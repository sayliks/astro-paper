/**
 * Decap CMS GitHub OAuth — Step 2: Exchange code for token
 *
 * GitHub redirects here after the user authorizes the app.
 * Exchanges the authorization code for an access token and
 * sends it back to the CMS popup via postMessage.
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
      return res
        .status(400)
        .send(`GitHub OAuth error: ${data.error_description || data.error}`);
    }

    const token = data.access_token;
    const msg = `authorization:github:success:${JSON.stringify({ token, provider: "github" })}`;

    res.setHeader("Content-Type", "text/html");
    res.send(`<!DOCTYPE html>
<html><body><script>
(function() {
  if (window.opener) {
    window.opener.postMessage(${JSON.stringify(msg)}, "*");
  }
  window.close();
})();
</script></body></html>`);
  } catch (err) {
    res.status(500).send("Token exchange failed: " + err.message);
  }
}
