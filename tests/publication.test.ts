import assert from "node:assert/strict";
import { test } from "node:test";
import { shouldGenerateDynamicOgImagePost } from "../src/utils/dynamicOgImageFilter.ts";
import { isContentPublished } from "../src/utils/publicationFilter.ts";

const NOW = new Date("2026-06-06T12:00:00+08:00");
const SCHEDULED_POST_MARGIN = 15 * 60 * 1000;

type ArticleInput = {
  data: {
    draft?: boolean;
    pubDatetime: Date;
    ogImage?: unknown;
  };
};

function createArticle(overrides: Partial<ArticleInput["data"]> = {}) {
  return {
    data: {
      pubDatetime: new Date("2026-06-06T11:00:00+08:00"),
      draft: false,
      ...overrides,
    },
  } satisfies ArticleInput;
}

function productionPostFilter(post: ArticleInput) {
  return isContentPublished(post, {
    isDev: false,
    now: NOW,
    scheduledPostMargin: SCHEDULED_POST_MARGIN,
  });
}

test("published articles are eligible for dynamic OG generation", () => {
  assert.equal(
    shouldGenerateDynamicOgImagePost(createArticle(), productionPostFilter),
    true
  );
});

test("draft articles are excluded from dynamic OG generation", () => {
  assert.equal(
    shouldGenerateDynamicOgImagePost(
      createArticle({ draft: true }),
      productionPostFilter
    ),
    false
  );
});

test("future scheduled articles are excluded from dynamic OG generation in production", () => {
  assert.equal(
    shouldGenerateDynamicOgImagePost(
      createArticle({ pubDatetime: new Date("2026-06-06T12:20:00+08:00") }),
      productionPostFilter
    ),
    false
  );
});

test("articles with explicit Open Graph images are excluded from dynamic OG generation", () => {
  assert.equal(
    shouldGenerateDynamicOgImagePost(
      createArticle({ ogImage: "/assets/uploads/custom-og.jpg" }),
      productionPostFilter
    ),
    false
  );
});
