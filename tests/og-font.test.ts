import assert from "node:assert/strict";
import { test } from "node:test";
import { getOgSatoriFonts } from "../src/utils/ogFont.ts";

const fonts = [
  {
    weight: "400",
    style: "normal",
    src: [{ url: "regular.woff", format: "woff" }],
  },
  {
    weight: "700",
    style: "normal",
    src: [{ url: "bold.woff", format: "woff" }],
  },
];

test("evicts failed OG font cache entries so later requests can retry", async () => {
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  let failRegular = true;

  globalThis.fetch = (async input => {
    const url = String(input);
    calls.push(url);

    if (url.endsWith("/regular.woff") && failRegular) {
      failRegular = false;
      return new Response(null, { status: 503 });
    }

    return new Response(new Uint8Array([1, 2, 3]));
  }) as typeof fetch;

  try {
    const contextUrl = new URL("https://example.com/");
    const getFontFileUrl = (fontPath: string) =>
      `https://assets.example.com/${fontPath}`;

    await assert.rejects(
      () => getOgSatoriFonts(fonts, contextUrl, getFontFileUrl),
      /Failed to load OG font/
    );

    const satoriFonts = await getOgSatoriFonts(
      fonts,
      contextUrl,
      getFontFileUrl
    );

    assert.equal(satoriFonts.length, 2);
    assert.equal(
      calls.filter(url => url.endsWith("/regular.woff")).length,
      2
    );
    assert.equal(calls.filter(url => url.endsWith("/bold.woff")).length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
