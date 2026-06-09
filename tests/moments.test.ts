import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import {
  FALLBACK_MOMENT_DESCRIPTION,
  getPublishedMomentEntries,
  getMomentDescriptionFromMarkdown,
  getMomentIdSlug,
  getMomentRouteSlug,
  getMomentTitle,
  isPublishedMoment,
  isValidMomentImage,
  resolveMomentTitle,
  sortMomentEntries,
  type MomentSortInput,
} from "../src/utils/momentModel.ts";

const NOW = new Date("2026-06-06T22:00:00+08:00");
const PUBLICATION_OPTIONS = { now: NOW, isDev: false };
const MOMENTS_CONTENT_DIR = path.join(process.cwd(), "src/content/moments");
const CMS_CONFIG_PATH = path.join(process.cwd(), "public/cms/config.yml");

function createMoment(
  overrides: Partial<MomentSortInput["data"]> = {},
  id = "2026-06-06-2130-evening-walk"
): MomentSortInput {
  return {
    id,
    body: "今天也认真生活。",
    data: {
      slug: "evening-walk",
      pubDatetime: new Date("2026-06-06T21:30:00+08:00"),
      draft: false,
      pinned: false,
      ...overrides,
    },
  };
}

function listMomentContentFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith("_") || entry.name.startsWith(".")) return [];

    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listMomentContentFiles(entryPath);
    if (/\.mdx?$/i.test(entry.name)) return [entryPath];

    return [];
  });
}

function readFrontmatterSlug(filePath: string): string {
  const source = readFileSync(filePath, "utf8");
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
  const rawSlug = frontmatter?.match(/^slug:\s*(.+?)\s*$/m)?.[1];

  assert.ok(rawSlug, `Missing frontmatter slug in ${filePath}`);

  return rawSlug.replace(/^['"]|['"]$/g, "").trim();
}

function getMomentRouteSlugFromFile(filePath: string) {
  return getMomentRouteSlug({
    data: {
      slug: readFrontmatterSlug(filePath),
    },
  });
}

function getCmsMomentPreviewPathTemplate() {
  const config = readFileSync(CMS_CONFIG_PATH, "utf8");
  const momentsCollection = config.match(
    /(?:^|\n)\s*-\s+name:\s+moments\b([\s\S]*?)(?=\n\s*-\s+name:|\s*$)/
  )?.[1];
  const previewPath = momentsCollection?.match(
    /^\s*preview_path:\s*["']?(.+?)["']?\s*$/m
  )?.[1];

  assert.ok(previewPath, "Missing moments preview_path in CMS config");

  return previewPath;
}

test("filters draft moments out of the published set", () => {
  const published = createMoment();
  const draft = createMoment({ draft: true }, "2026-06-06-2200-draft");

  assert.deepEqual(
    [published, draft].filter(moment =>
      isPublishedMoment(moment, PUBLICATION_OPTIONS)
    ),
    [published]
  );
});

test("filters future moments out of the published set", () => {
  const published = createMoment();
  const future = createMoment(
    { pubDatetime: new Date("2026-06-06T22:30:00+08:00") },
    "2026-06-06-2230-future"
  );

  assert.deepEqual(
    [future, published].filter(moment =>
      isPublishedMoment(moment, PUBLICATION_OPTIONS)
    ),
    [published]
  );
});

test("includes moments once publication time has passed", () => {
  const published = createMoment({
    pubDatetime: new Date("2026-06-06T21:59:59+08:00"),
  });

  assert.equal(isPublishedMoment(published, PUBLICATION_OPTIONS), true);
});

test("uses pubDatetime as the production publication boundary for moments", () => {
  const boundary = createMoment({
    pubDatetime: new Date("2026-06-06T22:00:00+08:00"),
  });
  const afterBoundary = createMoment({
    pubDatetime: new Date("2026-06-06T21:59:59+08:00"),
  });

  assert.equal(isPublishedMoment(boundary, PUBLICATION_OPTIONS), false);
  assert.equal(isPublishedMoment(afterBoundary, PUBLICATION_OPTIONS), true);
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

test("can still derive the committed filename suffix when needed", () => {
  assert.equal(
    getMomentIdSlug("2026-06-06-2130-evening-walk"),
    "2026-06-06-2130-evening-walk"
  );
});

test("uses frontmatter slug for moment detail routes and CMS previews", () => {
  const moment = createMoment(
    { slug: "thinking" },
    "2026-06-08-1453-thinking"
  );
  const routeSlug = getMomentRouteSlug(moment);
  const previewPath = getCmsMomentPreviewPathTemplate().replace(
    "{{slug}}",
    routeSlug
  );

  assert.equal(routeSlug, "thinking");
  assert.notEqual(routeSlug, moment.id);
  assert.equal(previewPath, "moments/thinking/");
});

test("current committed moment frontmatter slugs generate unique detail routes", () => {
  const routesBySlug = new Map<string, string[]>();

  for (const filePath of listMomentContentFiles(MOMENTS_CONTENT_DIR)) {
    const routeSlug = getMomentRouteSlugFromFile(filePath);
    const relativeFilePath = path
      .relative(process.cwd(), filePath)
      .replaceAll(path.sep, "/");

    routesBySlug.set(routeSlug, [
      ...(routesBySlug.get(routeSlug) ?? []),
      relativeFilePath,
    ]);
  }

  const duplicateRoutes = [...routesBySlug.entries()]
    .filter(([, filePaths]) => filePaths.length > 1)
    .map(([routeSlug, filePaths]) => ({ routeSlug, filePaths }));

  assert.deepEqual(duplicateRoutes, []);
});

test("generates metadata titles from the local publish time", () => {
  assert.equal(
    getMomentTitle(new Date("2026-06-06T21:30:00+08:00"), "Asia/Hong_Kong"),
    "动态 · 2026-06-06 21:30"
  );
});

test("prefers a custom moment title over the date-derived one", () => {
  assert.equal(
    resolveMomentTitle(
      {
        title: "低俗小说好看",
        pubDatetime: new Date("2026-06-06T21:30:00+08:00"),
      },
      "Asia/Hong_Kong"
    ),
    "低俗小说好看"
  );
});

test("falls back to the date title when the custom title is blank or missing", () => {
  const pubDatetime = new Date("2026-06-06T21:30:00+08:00");
  const expected = "动态 · 2026-06-06 21:30";

  assert.equal(
    resolveMomentTitle({ title: "   ", pubDatetime }, "Asia/Hong_Kong"),
    expected
  );
  assert.equal(
    resolveMomentTitle({ pubDatetime }, "Asia/Hong_Kong"),
    expected
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
    { pubDatetime: new Date("2026-06-06T21:45:00+08:00") },
    "2026-06-06-2145-published"
  );

  assert.deepEqual(
    getPublishedMomentEntries([draftPinned, published], PUBLICATION_OPTIONS),
    [published]
  );
});

test("shared published moment source excludes future entries before sorting", () => {
  const pinnedPublished = createMoment(
    { pinned: true, pubDatetime: new Date("2026-06-06T21:30:00+08:00") },
    "2026-06-06-2130-pinned"
  );
  const futurePinned = createMoment(
    { pinned: true, pubDatetime: new Date("2026-06-06T22:30:00+08:00") },
    "2026-06-06-2230-future-pinned"
  );
  const published = createMoment(
    { pubDatetime: new Date("2026-06-06T21:45:00+08:00") },
    "2026-06-06-2145-published"
  );

  assert.deepEqual(
    getPublishedMomentEntries(
      [published, futurePinned, pinnedPublished],
      PUBLICATION_OPTIONS
    ),
    [pinnedPublished, published]
  );
});
