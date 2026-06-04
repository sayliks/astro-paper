/**
 * Decap CMS GitHub OAuth — Step 2: Exchange code for token
 *
 * GitHub redirects here after the user authorizes the app.
 * Exchanges the authorization code for an access token and
 * sends it back to the CMS opener window via postMessage
 * using the Decap external-OAuth handshake protocol:
 *
 *   1. popup  → opener: "authorizing:github"
 *   2. opener → popup:  (any message — signals readiness)
 *   3. popup  → opener: 'authorization:github:success:{"token":"...","provider":"github"}'
 *
 * Requires Vercel env vars:
 *   GITHUB_OAUTH_CLIENT_ID
 *   GITHUB_OAUTH_CLIENT_SECRET
 */
export default async function handler(req, res) {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send("Missing authorization code");
  }

  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(500).send("Missing OAuth env vars on server");
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
        }),
      }
    );

    const data = await tokenRes.json();

    if (data.error) {
      res.setHeader("Content-Type", "text/html");
      return res.status(400).send(`<!DOCTYPE html>
<html><head><title>Auth Error</title></head>
<body style="font-family:system-ui;padding:2rem">
<h2>GitHub OAuth Error</h2>
<p><strong>${data.error}:</strong> ${data.error_description || "unknown"}</p>
<p>Close this window and try again.</p>
</body></html>`);
    }

    const accessToken = data.access_token;
    if (!accessToken) {
      res.setHeader("Content-Type", "text/html");
      return res.status(500).send(`<!DOCTYPE html>
<html><head><title>Auth Error</title></head>
<body style="font-family:system-ui;padding:2rem">
<h2>Token Exchange Failed</h2>
<p>GitHub returned a successful response but no access token was found.</p>
<p>Close this window and try again.</p>
</body></html>`);
    }

    /* The auth success message Decap CMS expects */
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

  /* Step 2: wait for the opener to reply, then send the token. */
  function receiveMessage(event) {
    window.removeEventListener("message", receiveMessage);
    /* Step 3: send the token back to the opener's origin. */
    window.opener.postMessage(authMessage, event.origin);
    status.textContent = "Login successful. Closing...";
    setTimeout(function() { window.close(); }, 300);
  }

  window.addEventListener("message", receiveMessage, false);

  /* Step 1: tell the opener we are ready. */
  window.opener.postMessage("authorizing:github", "*");
})();
</script>
</body></html>`);
  } catch (err) {
    res.status(500).send("Token exchange failed: " + err.message);
  }
}
