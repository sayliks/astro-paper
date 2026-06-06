import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FALLBACK_MOMENT_DESCRIPTION,
  getMomentDescriptionFromMarkdown,
  getMomentIdSlug,
  getMomentTitle,
  isPublishedMoment,
  isValidMomentImage,
  sortMomentEntries,
  type MomentSortInput,
} from "../src/utils/momentModel.ts";

function createMoment(
  overrides: Partial<MomentSortInput["data"]> = {},
  id = "2026-06-06-2130-evening-walk"
): MomentSortInput {
  return {
    id,
    body: "今天也认真生活。",
    data: {
      pubDatetime: new Date("2026-06-06T21:30:00+08:00"),
      draft: false,
      pinned: false,
      ...overrides,
    },
  };
}

test("filters draft moments out of the published set", () => {
  const published = createMoment();
  const draft = createMoment({ draft: true }, "2026-06-06-2200-draft");

  assert.deepEqual([published, draft].filter(isPublishedMoment), [published]);
});

test("sorts pinned moments first, then by descending publish date", () => {
  const olderPinned = createMoment(
    {
      pinned: true,
      pubDatetime: new Date("2026-06-05T21:30:00+08:00"),
    },
    "2026-06-05-2130-pinned"
  );
  const newerPinned = createMoment(
    {
      pinned: true,
      pubDatetime: new Date("2026-06-06T21:30:00+08:00"),
    },
    "2026-06-06-2130-pinned"
  );
  const newerNormal = createMoment(
    { pubDatetime: new Date("2026-06-07T21:30:00+08:00") },
    "2026-06-07-2130-normal"
  );

  assert.deepEqual(sortMomentEntries([olderPinned, newerNormal, newerPinned]), [
    newerPinned,
    olderPinned,
    newerNormal,
  ]);
});

test("generates a stable permalink slug from the committed filename id", () => {
  assert.equal(
    getMomentIdSlug("2026-06-06-2130-evening-walk"),
    "2026-06-06-2130-evening-walk"
  );
});

test("generates metadata titles from the local publish time", () => {
  assert.equal(
    getMomentTitle(new Date("2026-06-06T21:30:00+08:00"), "Asia/Hong_Kong"),
    "日常 · 2026-06-06 21:30"
  );
});

test("creates plain-text descriptions from Markdown content", () => {
  assert.equal(
    getMomentDescriptionFromMarkdown(
      "![照片](/moments/a.jpg)\n\n今天读到 [一段文字](https://example.com)，很安静。"
    ),
    "今天读到 一段文字，很安静。"
  );
});

test("uses the empty description fallback when no useful text exists", () => {
  assert.equal(
    getMomentDescriptionFromMarkdown(
      "![照片](/moments/a.jpg)\n\n```ts\nconst a = 1\n```"
    ),
    FALLBACK_MOMENT_DESCRIPTION
  );
});

test("rejects invalid image dimensions and empty alt text", () => {
  assert.equal(
    isValidMomentImage({
      src: "/moments/a.jpg",
      alt: "傍晚的天空",
      width: 1600,
      height: 1200,
    }),
    true
  );
  assert.equal(
    isValidMomentImage({
      src: "/moments/a.jpg",
      alt: "",
      width: 1600,
      height: 1200,
    }),
    false
  );
  assert.equal(
    isValidMomentImage({
      src: "/moments/a.jpg",
      alt: "傍晚的天空",
      width: 0,
      height: 1200,
    }),
    false
  );
});

test("feed selection excludes drafts before sorting", () => {
  const draftPinned = createMoment(
    { draft: true, pinned: true },
    "2026-06-08-2130-draft-pinned"
  );
  const published = createMoment(
    { pubDatetime: new Date("2026-06-07T21:30:00+08:00") },
    "2026-06-07-2130-published"
  );

  assert.deepEqual(
    sortMomentEntries([draftPinned, published].filter(isPublishedMoment)),
    [published]
  );
});
