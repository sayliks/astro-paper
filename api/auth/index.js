/**
 * Decap CMS GitHub OAuth — Step 1: Redirect to GitHub
 *
 * Called by Decap CMS when the user clicks "Login with GitHub".
 * Redirects the popup to GitHub's OAuth authorization page.
 *
 * Requires Vercel env vars:
 *   GITHUB_OAUTH_CLIENT_ID
 */
export default function handler(req, res) {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  if (!clientId) {
    return res.status(500).send("Missing GITHUB_OAUTH_CLIENT_ID env var");
  }

  const scope = req.query.scope || "repo";
  const redirectUri = "https://matsumae.top/api/auth/callback";

  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scope);

  res.redirect(302, url.toString());
}
