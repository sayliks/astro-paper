# Moments Development Notes

`日常 / Moments` is a lightweight publishing lane for informal updates. It is
separate from formal articles and remains fully static: Markdown files are
committed to Git, Astro builds the feed/detail pages, and Vercel publishes the
generated output.

## Content

Moment files live in `src/content/moments/` and use the `moments` collection in
`src/content.config.ts`.

```yaml
slug: evening-walk
title: 傍晚散步 # optional
pubDatetime: 2026-06-06T21:30:00+08:00
modDatetime: 2026-06-06T22:00:00+08:00 # optional
draft: false
pinned: false
mood: 平静
location: 校园
images:
  - src: /moments/evening-walk.jpg
    alt: 傍晚操场边的天空
    width: 1600
    height: 1200
```

The Markdown body is the visible Moment text. `title` is optional: when set it
becomes the main title shown on the home feed, detail page, and RSS; when blank
or omitted the title falls back to the publish-time form `日常 · YYYY-MM-DD HH:mm`.
The resolution lives in `resolveMomentTitle` (`src/utils/momentModel.ts`).
Tags, description, featured flag, reading time, social metrics, automatic
location, weather, and EXIF fields are intentionally not part of Phase 1.

## CMS

Sveltia CMS is configured in `public/cms/config.yml`. The `日常` collection uses
the existing GitHub backend and writes files to `src/content/moments/`.

CMS-created filenames follow:

```text
YYYY-MM-DD-HHmm-short-slug.md
```

The required `slug` field is only the short, stable filename suffix, such as
`evening-walk`. Routes are derived from the committed filename, so editing the
body does not change the permalink.

## Images

Moment uploads use `public/moments/` and are referenced as `/moments/name.jpg`.
Sveltia CMS does not reliably write intrinsic dimensions into frontmatter, so
`width`, `height`, and non-empty `alt` text are required manually.

## Routes

- Feed: `/moments/`
- Detail: `/moments/<filename-slug>/`
- RSS: `/moments/rss.xml`

The feed renders full Moment bodies directly. Detail pages exist for permalinks,
sharing, comments, and search indexing.

## Publication, Drafts, And Sorting

In production, `pubDatetime` controls when a Moment becomes publicly generated.
Future Moments are treated as scheduled content and are excluded until their
publication time passes.

Draft and future Moments are excluded from generated feed pages, detail pages,
RSS, sitemap, and search. Pinned Moments appear first; pinned and normal groups
are each sorted by `pubDatetime` descending.

## Comments, Search, And RSS

Moment detail pages reuse the existing Giscus component. Comments are not shown
inside feed items. Giscus maps by pathname, so Moment routes get their own stable
discussion threads without changing article comments.

The formal article feed at `/rss.xml` remains unchanged. Moments use the
separate `/moments/rss.xml` feed.

Pagefind indexes detail pages only via `data-pagefind-body`; the feed page is
not marked for indexing to avoid duplicate results.

## Phase 1 Limits

No likes, reposts, reactions, accounts, counters, private posts, database,
realtime updates, infinite scrolling, client-side pagination, lightbox,
carousel, remote image API, automatic location, or automatic weather is included.
