import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getBackUrlWithSearch,
  getSearchUrlWithTerm,
  shouldResetSearchParam,
} from "../src/scripts/search.ts";

test("updates the q search parameter while preserving existing parameters", () => {
  const search = getSearchUrlWithTerm("?page=2&q=old", "astro paper");
  const params = new URLSearchParams(search);

  assert.equal(params.get("page"), "2");
  assert.equal(params.get("q"), "astro paper");
});

test("creates a back URL from the source path and current search", () => {
  assert.equal(
    getBackUrlWithSearch("/search", "?q=astro+paper"),
    "/search?q=astro+paper"
  );
});

test("detects empty search values that should reset the URL", () => {
  assert.equal(shouldResetSearchParam(""), true);
  assert.equal(shouldResetSearchParam("   "), true);
  assert.equal(shouldResetSearchParam(null), true);
  assert.equal(shouldResetSearchParam("astro"), false);
});
