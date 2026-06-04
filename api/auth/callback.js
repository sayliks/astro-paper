/**
 * Decap CMS GitHub OAuth — Step 2: Exchange code for token
 *
 * GitHub redirects here after the user authorizes the app.
 * Exchanges the authorization code for an access token and
 * sends it back to the CMS opener window via postMessage.
 *
 * Requires Vercel env vars:
 *   GITHUB_OAUTH_CLIENT_ID
 *   GITHUB_OAUTH_CLIENT_SECRET
 */
export default async function handler(req, res) {
  const REDIRECT_URI = "https://matsumae.top/api/auth/callback";

  const code = req.query.code;
  if (!code) {
    return res.status(400).send("Missing authorization code");
  }

  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;

  /* ---------- helpers for the debug-safe error page ---------- */
  function maskedId(id) {
    if (!id) return "(not set)";
    return id.slice(0, 6) + "..." + id.slice(-4);
  }
  function errorPage(title, heading, detail) {
    res.setHeader("Content-Type", "text/html");
    res.status(400).send(`<!DOCTYPE html>
<html><head><title>${title}</title></head>
<body style="font-family:system-ui;padding:2rem;max-width:40rem">
<h2>${heading}</h2>
<pre style="background:#f5f5f5;padding:1rem;border-radius:4px;white-space:pre-wrap">${detail}</pre>
<p style="color:#666">This usually means the OAuth code was reused/expired,
the Vercel env vars are stale, or redirect_uri differs between
authorize and token exchange.</p>
<p>Close this window and try again.</p>
</body></html>`);
  }

  /* ---- pre-flight: are env vars present? ---- */
  if (!clientId || !clientSecret) {
    return errorPage(
      "Missing Env Vars",
      "Server configuration error",
      [
        "GITHUB_OAUTH_CLIENT_ID:  " + (clientId ? maskedId(clientId) : "(not set)"),
        "GITHUB_OAUTH_CLIENT_SECRET: " + (clientSecret ? "present" : "(not set)"),
        "redirect_uri: " + REDIRECT_URI,
      ].join("\n")
    );
  }

  try {
    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: REDIRECT_URI,
        }),
      }
    );

    const data = await tokenRes.json();

    if (data.error) {
      return errorPage(
        "OAuth Error",
        "GitHub OAuth Error",
        [
          "error:            " + data.error,
          "error_description:" + (data.error_description || "none"),
          "client_id used:   " + maskedId(clientId),
          "redirect_uri:     " + REDIRECT_URI,
        ].join("\n")
      );
    }

    const accessToken = data.access_token;
    if (!accessToken) {
      return errorPage(
        "No Token",
        "Token Exchange Failed",
        [
          "GitHub returned OK but no access_token in response.",
          "client_id used: " + maskedId(clientId),
          "redirect_uri:   " + REDIRECT_URI,
          "response keys:  " + Object.keys(data).join(", "),
        ].join("\n")
      );
    }

    /* ---- success: send token to Decap CMS via postMessage ---- */
    const authMessage =
      "authorization:github:success:" +
      JSON.stringify({ token: accessToken, provider: "github" });

    res.setHeader("Content-Type", "text/html");
    res.send(`<!DOCTYPE html>
<html><head><title>Authorizing...</title></head>
<body style="font-family:system-ui;padding:2rem">
<p id="status">Completing login...</p>
<script>
(function() {
  var status = document.getElementById("status");

  if (!window.opener) {
    status.textContent = "Error: opener window not found. Close this window and try again.";
    status.style.color = "red";
    return;
  }

  var authMessage = ${JSON.stringify(authMessage)};
  var origin = "https://matsumae.top";

  /* Notify the CMS that auth is in progress. */
  window.opener.postMessage("authorizing:github", origin);

  /* Send the token to the CMS. Decap CMS listens for this message. */
  window.opener.postMessage(authMessage, origin);

  status.textContent = "Login successful. Closing...";
  setTimeout(function() { window.close(); }, 500);
})();
</script>
</body></html>`);
  } catch (err) {
    res.status(500).send("Token exchange failed: " + err.message);
  }
}
