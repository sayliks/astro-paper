const SUPPORTED_PROVIDER = "github";
const DEFAULT_ALLOWED_DOMAINS =
  "www.matsumae.top,matsumae.top,localhost,127.0.0.1";

const escapeRegExp = str => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeDomain = value => {
  const domain = value?.trim().toLowerCase();

  if (!domain) return "";

  try {
    const url = new URL(domain.includes("://") ? domain : `https://${domain}`);
    return url.hostname;
  } catch {
    return domain.split("/")[0].split(":")[0];
  }
};

const getAllowedDomainPatternSources = allowedDomains =>
  allowedDomains
    .split(",")
    .map(normalizeDomain)
    .filter(Boolean)
    .map(domain => `^${escapeRegExp(domain).replaceAll("\\*", ".+")}$`);

const outputHTML = (
  { provider = "unknown", token, error, errorCode },
  request,
  env = process.env
) => {
  const state = error ? "error" : "success";
  const content = error ? { provider, error, errorCode } : { provider, token };
  const readyMessage = `authorizing:${provider}`;
  const resultMessage = `authorization:${provider}:${state}:${JSON.stringify(content)}`;
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  const allowedDomainPatterns = getAllowedDomainPatternSources(
    env.ALLOWED_DOMAINS || DEFAULT_ALLOWED_DOMAINS
  );

  return new Response(
    `<!doctype html><html><body><script>
(() => {
  const allowedDomainPatterns = ${JSON.stringify(allowedDomainPatterns)}.map(
    source => new RegExp(source, "i")
  );
  const isAllowedOrigin = origin => {
    try {
      const url = new URL(origin);
      const isLocal =
        url.hostname === "localhost" ||
        url.hostname === "127.0.0.1" ||
        url.hostname === "[::1]";

      if (url.protocol !== "https:" && !(url.protocol === "http:" && isLocal)) {
        return false;
      }

      return allowedDomainPatterns.some(pattern => pattern.test(url.hostname));
    } catch {
      return false;
    }
  };

  window.addEventListener("message", ({ data, origin }) => {
    if (data === ${JSON.stringify(readyMessage)} && isAllowedOrigin(origin)) {
      window.opener?.postMessage(
        ${JSON.stringify(resultMessage)},
        origin
      );
    }
  });
  window.opener?.postMessage(${JSON.stringify(readyMessage)}, "*");
})();
</script></body></html>`,
    {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/html;charset=UTF-8",
        "Set-Cookie": `csrf-token=deleted; HttpOnly; Max-Age=0; Path=/api/cms-auth; SameSite=Lax${secure}`,
      },
    }
  );
};

const isAllowedDomain = (domain, allowedDomains) =>
  getAllowedDomainPatternSources(allowedDomains).some(pattern =>
    new RegExp(pattern, "i").test(normalizeDomain(domain))
  );

const createError = (request, provider, error, errorCode, env) =>
  outputHTML({ provider, error, errorCode }, request, env);

export const handleAuth = async (request, env = process.env) => {
  if (request.method !== "GET") {
    return new Response("", { status: 405 });
  }

  const url = new URL(request.url);
  const provider = url.searchParams.get("provider");
  const domain = url.searchParams.get("site_id");

  if (provider !== SUPPORTED_PROVIDER) {
    return createError(
      request,
      provider ?? "unknown",
      "Your Git backend is not supported by the authenticator.",
      "UNSUPPORTED_BACKEND",
      env
    );
  }

  const allowedDomains = env.ALLOWED_DOMAINS || DEFAULT_ALLOWED_DOMAINS;

  if (!isAllowedDomain(domain, allowedDomains)) {
    return createError(
      request,
      provider,
      "Your domain is not allowed to use the authenticator.",
      "UNSUPPORTED_DOMAIN",
      env
    );
  }

  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return createError(
      request,
      provider,
      "OAuth app client ID or secret is not configured.",
      "MISCONFIGURED_CLIENT",
      env
    );
  }

  const csrfToken = globalThis.crypto.randomUUID().replaceAll("-", "");
  const callbackUrl = new URL("/api/cms-auth/callback", url.origin);
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: callbackUrl.toString(),
    scope: "repo",
    state: csrfToken,
  });
  const githubHost = env.GITHUB_HOSTNAME || "github.com";
  const secure = url.protocol === "https:" ? "; Secure" : "";

  return new Response("", {
    status: 302,
    headers: {
      "Cache-Control": "no-store",
      Location: `https://${githubHost}/login/oauth/authorize?${params.toString()}`,
      "Set-Cookie": `csrf-token=${provider}_${csrfToken}; HttpOnly; Path=/api/cms-auth; Max-Age=600; SameSite=Lax${secure}`,
    },
  });
};

export const handleCallback = async (request, env = process.env) => {
  if (request.method !== "GET") {
    return new Response("", { status: 405 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const [, provider, csrfToken] =
    request.headers
      .get("Cookie")
      ?.match(/\bcsrf-token=([a-z-]+?)_([0-9a-f]{32})\b/) ?? [];

  if (provider !== SUPPORTED_PROVIDER) {
    return createError(
      request,
      provider ?? "unknown",
      "Your Git backend is not supported by the authenticator.",
      "UNSUPPORTED_BACKEND",
      env
    );
  }

  if (!code || !state) {
    return createError(
      request,
      provider,
      "Failed to receive an authorization code. Please try again later.",
      "AUTH_CODE_REQUEST_FAILED",
      env
    );
  }

  if (!csrfToken || state !== csrfToken) {
    return createError(
      request,
      provider,
      "Potential CSRF attack detected. Authentication flow aborted.",
      "CSRF_DETECTED",
      env
    );
  }

  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return createError(
      request,
      provider,
      "OAuth app client ID or secret is not configured.",
      "MISCONFIGURED_CLIENT",
      env
    );
  }

  const githubHost = env.GITHUB_HOSTNAME || "github.com";
  const callbackUrl = new URL("/api/cms-auth/callback", url.origin);
  let response;

  try {
    response = await fetch(`https://${githubHost}/login/oauth/access_token`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: callbackUrl.toString(),
      }),
    });
  } catch {
    return createError(
      request,
      provider,
      "Failed to request an access token. Please try again later.",
      "TOKEN_REQUEST_FAILED",
      env
    );
  }

  let payload;

  try {
    payload = await response.json();
  } catch {
    return createError(
      request,
      provider,
      "Server responded with malformed data. Please try again later.",
      "MALFORMED_RESPONSE",
      env
    );
  }

  if (!payload.access_token) {
    return createError(
      request,
      provider,
      payload.error_description ||
        payload.error ||
        "GitHub did not return an access token.",
      payload.error ? "TOKEN_REQUEST_FAILED" : "MALFORMED_RESPONSE",
      env
    );
  }

  return outputHTML({ provider, token: payload.access_token }, request, env);
};
