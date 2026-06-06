import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FALLBACK_QUOTE,
  HITOKOTO_CACHE_KEY,
  getFetchFailureQuote,
  isHitokotoResponse,
  readCachedQuote,
  writeCachedQuote,
  type HitokotoResponse,
  type HitokotoStorage,
} from "../src/scripts/hitokoto-cache.ts";

class MemoryStorage implements HitokotoStorage {
  values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function createQuote(overrides: Partial<HitokotoResponse> = {}) {
  return {
    id: 1,
    uuid: "quote-uuid",
    hitokoto: "今天也要认真生活。",
    type: "e",
    from: "测试出处",
    from_who: "测试作者",
    creator: "sayliks",
    creator_uid: 1,
    reviewer: 1,
    commit_from: "web",
    created_at: "2026-06-06 00:00:00",
    length: 10,
    ...overrides,
  } satisfies HitokotoResponse;
}

test("reuses a valid same-day cache entry", () => {
  const storage = new MemoryStorage();
  const today = new Date(2026, 5, 6);
  const quote = createQuote();

  assert.equal(writeCachedQuote(storage, quote, today), true);
  assert.deepEqual(readCachedQuote(storage, { date: today }), quote);
});

test("returns null for a valid cache entry from a previous day", () => {
  const storage = new MemoryStorage();
  const today = new Date(2026, 5, 6);
  const nextDay = new Date(2026, 5, 7);

  assert.equal(writeCachedQuote(storage, createQuote(), today), true);
  assert.equal(readCachedQuote(storage, { date: nextDay }), null);
});

test("recovers safely from malformed cached JSON", () => {
  const storage = new MemoryStorage();

  storage.setItem(HITOKOTO_CACHE_KEY, "{not valid json");

  assert.equal(readCachedQuote(storage), null);
  assert.deepEqual(getFetchFailureQuote(storage), FALLBACK_QUOTE);
});

test("uses the most recent valid stale cache when a request fails", () => {
  const storage = new MemoryStorage();
  const yesterday = new Date(2026, 5, 5);
  const today = new Date(2026, 5, 6);
  const quote = createQuote({ hitokoto: "昨天留下的好句子。" });

  assert.equal(writeCachedQuote(storage, quote, yesterday), true);
  assert.equal(readCachedQuote(storage, { date: today }), null);
  assert.deepEqual(getFetchFailureQuote(storage), quote);
});

test("rejects invalid API responses and does not cache empty quote content", () => {
  const storage = new MemoryStorage();
  const today = new Date(2026, 5, 6);
  const invalidQuote = createQuote({ hitokoto: "   " });

  assert.equal(isHitokotoResponse(invalidQuote), false);
  assert.equal(writeCachedQuote(storage, invalidQuote, today), false);
  assert.equal(readCachedQuote(storage, { date: today }), null);
});
