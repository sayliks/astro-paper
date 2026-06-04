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

const REDIRECT_URI = "https://matsumae.top/api/auth/callback";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const CMS_ORIGIN = "https://matsumae.top";

/* ---- helpers ---- */
function maskedId(id) {
  if (!id) return "(not set)";
  if (id.length <= 10) return id.slice(0, 6) + "...";
  return id.slice(0, 6) + "..." + id.slice(-4);
}

function errorPage(res, status, title, heading, detail) {
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.status(status).send(`<!DOCTYPE html>
<html><head><title>${title}</title></head>
<body style="font-family:system-ui;padding:2rem;max-width:40rem">
<h2>${heading}</h2>
<pre style="background:#f5f5f5;padding:1rem;border-radius:4px;white-space:pre-wrap">${detail}</pre>
<p style="color:#666;font-size:0.9rem"><strong>Troubleshooting:</strong><br>
1. Redeploy on Vercel after setting or changing GITHUB_OAUTH_CLIENT_ID / GITHUB_OAUTH_CLIENT_SECRET.<br>
2. Ensure the GitHub OAuth App callback URL is exactly:<br>
   <code>https://matsumae.top/api/auth/callback</code><br>
3. Try in a new incognito window (clears stale OAuth state).<br>
4. If the error is <em>bad_verification_code</em>, the code was already used or the client_secret does not match the OAuth App.
</p>
<p>Close this window and try again.</p>
</body></html>`);
}

/* ---- handler ---- */
export default async function handler(req, res) {
  const code = req.query.code;
  if (!code) {
    return errorPage(res, 400, "Missing Code", "Missing authorization code",
      "No code parameter found in the callback URL. GitHub should have redirected here with ?code=...");
  }

  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return errorPage(res, 500, "Missing Env Vars", "Server configuration error",
      [
        "GITHUB_OAUTH_CLIENT_ID:  " + maskedId(clientId),
        "GITHUB_OAUTH_CLIENT_SECRET: " + (clientSecret ? "present" : "(not set)"),
        "redirect_uri: " + REDIRECT_URI,
        "",
        "One or both required Vercel environment variables are not set.",
        "Add them in Vercel → Settings → Environment Variables, then redeploy.",
      ].join("\n")
    );
  }

  try {
    /* Exchange the GitHub authorization code for an access token.
       This MUST succeed on the FIRST attempt — codes are single-use.
       Cache-Control: no-store on the response prevents the browser
       from re-requesting this URL and consuming the code a second time. */
    const tokenRes = await fetch(GITHUB_TOKEN_URL, {
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
    });

    const data = await tokenRes.json();

    if (data.error) {
      return errorPage(res, 400, "OAuth Error", "GitHub OAuth Error",
        [
          "error:             " + data.error,
          "error_description: " + (data.error_description || "none"),
          "client_id used:    " + maskedId(clientId),
          "redirect_uri:      " + REDIRECT_URI,
          "",
          data.error === "bad_verification_code"
            ? "→ The code was already used, expired, or the client_secret is wrong.\n" +
              "  Common fix: redeploy on Vercel, then test in an incognito window."
            : "",
        ].join("\n")
      );
    }

    const accessToken = data.access_token;
    if (!accessToken) {
      return errorPage(res, 500, "No Token", "Token Exchange Failed",
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
    /* Prevent the browser or proxy from re-requesting this callback URL.
       GitHub auth codes are single-use, so a re-request would fail with
       bad_verification_code and we'd never reach this branch. */
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.send(`<!DOCTYPE html>
<html><head><title>Authorizing...</title></head>
<body style="font-family:system-ui;padding:2rem">
<p id="status">Completing login...</p>
<script>
(function() {
  var status = document.getElementById("status");

  if (!window.opener) {
    status.textContent = "Error — opener window not found.\\a\\aPossible causes:\\a1. Popup was blocked or redirected.\\a2. Cross-Origin-Opener-Policy header is too strict.\\a3. Browser extension interfering.";
    status.style.color = "red";
    status.style.whiteSpace = "pre-wrap";
    return;
  }

  var authMessage = ${JSON.stringify(authMessage)};
  var origin = ${JSON.stringify(CMS_ORIGIN)};

  /* Step 1: notify the CMS that auth is in progress. */
  window.opener.postMessage("authorizing:github", origin);

  /* Step 2: send the token. Decap CMS listens for:
     authorization:github:success:{"token":"...","provider":"github"} */
  window.opener.postMessage(authMessage, origin);

  status.textContent = "Login successful. Closing...";
  setTimeout(function() { window.close(); }, 500);
})();
</script>
</body></html>`);
  } catch (err) {
    return errorPage(res, 500, "Server Error", "Token exchange failed",
      "Unexpected error: " + (err.message || "unknown") + "\n\nredirect_uri: " + REDIRECT_URI);
  }
}
