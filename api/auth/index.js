/**
 * Decap CMS GitHub OAuth — Step 1: Redirect to GitHub
 *
 * Called by Decap CMS when the user clicks "Login with GitHub".
 * Redirects the popup to GitHub's OAuth authorization page.
 *
 * Requires Vercel env vars:
 *   GITHUB_OAUTH_CLIENT_ID
 */
/**
 * Decap CMS GitHub OAuth — Step 1: Redirect to GitHub
 *
 * Called by Decap CMS when the user clicks "Login with GitHub".
 * Redirects the popup to GitHub's OAuth authorization page.
 *
 * Requires Vercel env vars:
 *   GITHUB_OAUTH_CLIENT_ID
 */

const REDIRECT_URI = "https://matsumae.top/api/auth/callback";
const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";

export default function handler(req, res) {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  if (!clientId) {
    return res.status(500).send("Missing GITHUB_OAUTH_CLIENT_ID env var");
  }

  const scope = req.query.scope || "repo";

  const url = new URL(GITHUB_AUTHORIZE_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("scope", scope);

  /* Prevent caching — ensures the popup always gets a fresh redirect */
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.redirect(302, url.toString());
}
