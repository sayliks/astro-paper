import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { handleAuth, handleCallback } from "../src/server/cmsAuth.js";

const VALID_ENV = {
  GITHUB_CLIENT_ID: "client-id",
  GITHUB_CLIENT_SECRET: "client-secret",
  ALLOWED_DOMAINS: "www.matsumae.top,matsumae.top,localhost,127.0.0.1",
};

const CSRF_TOKEN = "a".repeat(32);
const GITHUB_COOKIE = `csrf-token=github_${CSRF_TOKEN}`;

// U+2028 / U+2029 built at runtime so this source file stays pure ASCII.
const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

function authRequest(
  params: Record<string, string>,
  { method = "GET" }: { method?: string } = {}
) {
  const url = new URL("https://www.matsumae.top/api/cms-auth/auth");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url, { method });
}

function callbackRequest(
  params: Record<string, string>,
  { cookie, method = "GET" }: { cookie?: string; method?: string } = {}
) {
  const url = new URL("https://www.matsumae.top/api/cms-auth/callback");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const headers = new Headers();
  if (cookie) headers.set("Cookie", cookie);
  return new Request(url, { method, headers });
}

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function stubTokenResponse(payload: unknown) {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify(payload), {
      headers: { "Content-Type": "application/json" },
    })) as typeof globalThis.fetch;
}

test("non-GET requests are rejected with 405", async () => {
  const auth = await handleAuth(authRequest({ provider: "github" }, { method: "POST" }), VALID_ENV);
  assert.equal(auth.status, 405);

  const callback = await handleCallback(
    callbackRequest({ code: "c", state: CSRF_TOKEN }, { method: "POST" }),
    VALID_ENV
  );
  assert.equal(callback.status, 405);
});

test("missing GitHub client credentials yield MISCONFIGURED_CLIENT", async () => {
  const response = await handleAuth(
    authRequest({ provider: "github", site_id: "www.matsumae.top" }),
    { ALLOWED_DOMAINS: VALID_ENV.ALLOWED_DOMAINS }
  );
  const body = await response.text();
  assert.match(body, /MISCONFIGURED_CLIENT/);
});

test("allowed domain passes the domain gate (redirects to GitHub)", async () => {
  const response = await handleAuth(
    authRequest({ provider: "github", site_id: "www.matsumae.top" }),
    VALID_ENV
  );
  assert.equal(response.status, 302);
  assert.match(
    response.headers.get("Location") ?? "",
    /^https:\/\/github\.com\/login\/oauth\/authorize\?/
  );
  assert.match(response.headers.get("Set-Cookie") ?? "", /csrf-token=github_[0-9a-f]{32}/);
});

test("disallowed domain is rejected with UNSUPPORTED_DOMAIN", async () => {
  const response = await handleAuth(
    authRequest({ provider: "github", site_id: "evil.example.org" }),
    VALID_ENV
  );
  const body = await response.text();
  assert.match(body, /UNSUPPORTED_DOMAIN/);
});

// Locks in the *deliberate* wildcard semantics flagged in review: a leading
// "*" expands to ".+", which crosses dot boundaries (so "a.b.example.com"
// matches "*.example.com"). If this ever changes, it must be a conscious choice.
test("wildcard allowed domains match across subdomain levels", async () => {
  const wildcardEnv = { ...VALID_ENV, ALLOWED_DOMAINS: "*.example.com" };

  const singleLevel = await handleAuth(
    authRequest({ provider: "github", site_id: "a.example.com" }),
    wildcardEnv
  );
  assert.equal(singleLevel.status, 302);

  const multiLevel = await handleAuth(
    authRequest({ provider: "github", site_id: "a.b.example.com" }),
    wildcardEnv
  );
  assert.equal(multiLevel.status, 302);

  const outside = await handleAuth(
    authRequest({ provider: "github", site_id: "example.org" }),
    wildcardEnv
  );
  assert.match(await outside.text(), /UNSUPPORTED_DOMAIN/);
});

test("CSRF state mismatch is rejected with CSRF_DETECTED", async () => {
  const response = await handleCallback(
    callbackRequest(
      { code: "auth-code", state: "b".repeat(32) },
      { cookie: GITHUB_COOKIE }
    ),
    VALID_ENV
  );
  const body = await response.text();
  assert.match(body, /CSRF_DETECTED/);
});

test("matching CSRF/state exchanges the code and reflects the token", async () => {
  stubTokenResponse({ access_token: "gho_test_token_123" });

  const response = await handleCallback(
    callbackRequest(
      { code: "auth-code", state: CSRF_TOKEN },
      { cookie: GITHUB_COOKIE }
    ),
    VALID_ENV
  );
  const body = await response.text();

  assert.match(body, /authorization:github:success/);
  assert.match(body, /gho_test_token_123/);
});

// === XSS regression coverage ===

test("malicious provider is normalized, never reflected verbatim", async () => {
  const payload = "</script><img src=x onerror=alert(document.domain)>";
  const response = await handleAuth(authRequest({ provider: payload }), VALID_ENV);
  const body = await response.text();

  // Collapsed to "unknown" → the attacker payload never reaches the document.
  assert.match(body, /UNSUPPORTED_BACKEND/);
  assert.ok(!body.includes("onerror=alert"), "attacker attribute leaked into HTML");
  assert.ok(!body.includes("<img src=x"), "attacker tag leaked into HTML");
});

test("toScriptJSON escapes < so reflected error text cannot break out of <script>", async () => {
  // GitHub-sourced error_description is reflected into the inline script. Even
  // though it is not user-controlled, it must be escaped defensively.
  stubTokenResponse({
    error_description: "</script><script>alert(1)</script>",
  });

  const response = await handleCallback(
    callbackRequest(
      { code: "auth-code", state: CSRF_TOKEN },
      { cookie: GITHUB_COOKIE }
    ),
    VALID_ENV
  );
  const body = await response.text();

  assert.ok(body.includes("\\u003c"), "expected < to be escaped as \\u003c");
  assert.ok(
    !body.includes("<script>alert(1)"),
    "attacker <script> survived unescaped"
  );
});

test("toScriptJSON escapes U+2028 / U+2029 line separators", async () => {
  stubTokenResponse({
    error_description: `line${LINE_SEPARATOR}para${PARAGRAPH_SEPARATOR}end`,
  });

  const response = await handleCallback(
    callbackRequest(
      { code: "auth-code", state: CSRF_TOKEN },
      { cookie: GITHUB_COOKIE }
    ),
    VALID_ENV
  );
  const body = await response.text();

  assert.ok(body.includes("\\u2028"), "U+2028 was not escaped");
  assert.ok(body.includes("\\u2029"), "U+2029 was not escaped");
  assert.ok(!body.includes(LINE_SEPARATOR), "raw U+2028 leaked into output");
  assert.ok(!body.includes(PARAGRAPH_SEPARATOR), "raw U+2029 leaked into output");
});
