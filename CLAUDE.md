# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This is **sayliks corner** — a personal blog built on AstroPaper, maintained as a publishing space (not a reusable theme template). Package manager is **pnpm**; Node `>=24.0.0 <25`. Deployed on Vercel.

## Commands

```bash
pnpm dev            # dev server at localhost:5173 (shows drafts + scheduled posts/moments)
pnpm build          # astro build + pagefind index into dist/pagefind/ (no typecheck)
pnpm build:full     # astro check + astro build + pagefind (full pipeline with typecheck)
pnpm check          # astro check (typecheck only)
pnpm preview        # preview the production build
pnpm lint           # eslint .
pnpm format         # prettier --write .   (format:check for CI)
pnpm sync           # regenerate astro:content / astro:* TS types after schema changes
pnpm test           # node --test on tests/*.test.ts (uses --experimental-strip-types)
```

Tests are plain `node:test` + `node:assert/strict` over the pure helper modules in `src/utils/` and `src/scripts/` (moments, photo-wall, publication filter, hitokoto cache). Run a single test file directly:

```bash
node --experimental-strip-types --test tests/moments.test.ts
```

CI runs `pnpm astro check`, `pnpm lint`, `pnpm test`, then `pnpm build`. "Type checking" means `astro check` (run via `pnpm check` or `pnpm build:full`). Run `pnpm sync` after editing `content.config.ts` so the generated types match. **Logic that needs unit tests lives in framework-free `.ts` helpers** (no `astro:*` imports), and the `.astro` route is a thin consumer — this is what keeps the test suite runnable under bare Node.

## Configuration system (three layers — edit only the first)

1. **`astro-paper.config.ts`** (repo root) — the single user-facing config. Edit this for site metadata, posts-per-page, feature flags, socials, share links.
2. **`src/types/config.ts`** — the schema + `defineAstroPaperConfig()` type helper. Defines `AstroPaperConfig` (input) vs `ResolvedAstroPaperConfig` (resolved output). Edit only to add new config options.
3. **`src/config.ts`** — applies defaults and exports the resolved config. **Do not edit for configuration changes.** Everything in the codebase imports config from here (`import config from "@/config"`), never from the root file directly.

`astro.config.ts` reads from the root config (`config.site.url`, feature flags) to wire up integrations.

## Content collections & routing

Three collections, all defined in `src/content.config.ts` (which exports `BLOG_PATH` and `MOMENTS_PATH`):

- **`posts`** — `src/content/posts/`, served under `/posts/`. The main blog. Rich frontmatter (featured, tags, ogImage, canonicalURL, etc.).
- **`moments`** — `src/content/moments/`, served under `/moments/` (with its own `moments/rss.xml`). Short "日常" status updates with optional images, mood, location, and a `pinned` flag. An optional `title` overrides the derived `动态 · <datetime>` title (see `resolveMomentTitle`); descriptions are always derived from the body.
- **`pages`** — `src/content/pages/` (e.g. `about.md`). Minimal schema.

Shared mechanics:

- **Underscore prefix excludes from build.** Every loader uses `**/[^_]*.{md,mdx}`, so any file or directory starting with `_` (e.g. `_releases/`, `_components/`) is skipped. This is the convention for docs/assets/co-located route components that must not become content.
- **Subdirectories become URL segments.** A post at `posts/examples/foo.md` serves at `/posts/examples/foo`. The slug logic is in `src/utils/getPostPaths.ts`. Two functions, do not confuse them:
  - `getPostSlug(id, filePath)` → slug-only path for `getStaticPaths` params (no base, no locale).
  - `getPostUrl(id, filePath, locale)` → fully navigable href for `<a>`/RSS (applies base + locale via `getRelativeLocaleUrl`).
- **One shared publication rule.** `isContentPublished` in `src/utils/publicationFilter.ts` is the single source of truth: drops drafts always, and in production hides scheduled content until `pubDatetime - scheduledPostMargin`; in dev everything non-draft shows. Both posts (`postFilter`/`getSortedPosts`) and moments (`momentModel.ts` → `getSortedMoments.ts`) build on it. Use these helpers rather than filtering `getCollection` results by hand.
- **Moments mirror the post-path pattern.** `getMomentSlug` / `getMomentUrl` / `getSortedMoments` (in `src/utils/getSortedMoments.ts`) parallel the post helpers; pure logic (sorting with pinned-first, description/title derivation, image validation) lives in `src/utils/momentModel.ts` so it stays unit-testable.
- Slugs use a hybrid slugifier (`src/utils/slugify.ts`): `slugify` for Latin, `lodash.kebabcase` for strings containing non-Latin chars.

## Dynamic OG images

When `features.dynamicOgImage` is on, each post without an explicit `ogImage` gets a generated `index.png` via **Satori** (HTML→SVG) + **Sharp** (SVG→PNG):
- Per-post: `src/pages/posts/[...slug]/index.png.ts`.
- Site default: `src/pages/og.png.ts`.
- The post page (`[...slug]/index.astro`) resolves the OG URL: explicit `ogImage` frontmatter wins, otherwise it points at the generated `…/index.png`.
- **Font wiring is shared via `src/utils/ogFont.ts`.** `astro.config.ts` registers the Google font **twice**: once as woff2 (the site UI font, keyed to `--font-google-sans-code`) and once as woff under `OG_FONT_VARIABLE` (Satori needs woff, not woff2). `OG_FONT_FAMILY`/`OG_FONT_VARIABLE` keep both registrations and the OG renderers in sync — change the font in one place.

## i18n

`src/i18n/` auto-loads every `lang/*.ts` file via `import.meta.glob`. `useTranslations(locale)` returns the strings object (falls back to `zh-CN`, then `en`); `tplStr(template, vars)` fills `{{key}}` placeholders. This fork is **Chinese-first**: the primary locale is `zh-CN` (default, no URL prefix), and `en.ts` re-exports `zh-CN` strings. Astro i18n is configured in `astro.config.ts` (`locales: ["zh-CN"]`, `defaultLocale: "zh-CN"`, `prefixDefaultLocale: false`). To add a locale: add it to `astro.config.ts` and drop a `src/i18n/lang/<locale>.ts` matching the `UIStrings` type.

## Base path & locale helpers

`src/utils/withBase.ts` handles deployment under a sub-path and locale prefixes: `getAssetPath()` to prefix `/public` asset URLs with the Astro `base`, `stripBase()` / `stripLocale()` to normalize pathnames. Use these instead of string-concatenating URLs.

## Theming & styling

- **Tailwind v4** via the `@tailwindcss/vite` plugin (no `tailwind.config.js`). Global styles and custom utilities (`max-w-app`, `app-layout`, `active-nav`) are defined with `@utility` in `src/styles/global.css`; color tokens in `src/styles/theme.css`; prose styles in `src/styles/typography.css`.
- **Dark mode** is driven by `data-theme` on `<html>`. An inline `is:inline` script in `src/layouts/Layout.astro` sets it before first paint (FOUC prevention); `src/scripts/theme.ts` handles the toggle afterward. The `dark:` variant maps to `[data-theme=dark]` (see `@custom-variant` in global.css).
- Markdown code blocks use Shiki with `min-light`/`night-owl` themes and notation transformers (diff/highlight/word-highlight) plus a custom filename transformer (`src/utils/transformers/fileName.js`), all configured in `astro.config.ts`.
- The markdown pipeline also runs `rehypeImageOptimize` (`src/utils/transformers/rehypeImageOptimize.ts`), which adds `loading`/`decoding`/`sizes` to content `<img>` tags (first image eager, rest lazy) for mobile performance.

## Comments

- **Giscus** comments (GitHub Discussions) are in `src/components/Giscus.astro`, configured for repo `sayliks/blog-comments`. Theme syncs with site dark/light mode via MutationObserver. The script is injected lazily via `IntersectionObserver` (only loads when the comments section nears the viewport), with `data-loading="lazy"` as a fallback. Used by both post and moment detail pages.

## Photo wall

The `/photo-wall` route (`src/pages/photo-wall.astro`) renders a static gallery from `src/data/photoWall.json` (not a content collection). `src/utils/photoWall.ts` validates each entry strictly (throws on bad data at build time), filters by `published`, and sorts by `order`. `src/data/` is the home for structured JSON data that isn't Markdown content. Note this page opts out of the `ClientRouter` (`clientRouter={false}`).

## Hitokoto (daily quote)

`src/scripts/hitokoto.ts` fetches a "一言" quote client-side; `src/scripts/hitokoto-cache.ts` holds the pure, tested cache logic: one quote per local day in `localStorage` under `hitokoto:latest`, with stale-cache and hardcoded `FALLBACK_QUOTE` fallbacks on fetch failure. The cache module imports nothing framework-specific so it can be unit-tested.

## CMS & auth (Sveltia + Vercel)

- Web-based authoring is **Sveltia CMS** (not Decap/Netlify CMS), served as static files from `public/cms/` (`index.html` loads `@sveltia/cms` from unpkg; `config.yml` is the schema; `preview.js` + `article-preview.css` customize the preview pane). `src/pages/admin.astro` is a `/admin` landing page with login instructions that links to `/cms/index.html` — it is not the CMS itself.
- GitHub OAuth runs as **Vercel Functions** in `api/cms-auth/` (`auth.js`, `callback.js`), which are thin wrappers over `src/server/cmsAuth.js` (the testable core). Requires `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ALLOWED_DOMAINS` env vars on Vercel; access-token login is the fallback.
- Per README: only root-level Markdown posts are created via the CMS. Advanced `.mdx` posts and nested post paths are edited by hand so existing URLs (and their Giscus threads) stay stable.

## View transitions

Uses Astro's `ClientRouter` for SPA-like navigation. `transition:name` on post titles and tags; `transition:persist` on search container. Theme state is carried across transitions via `astro:before-swap` / `astro:after-swap` events in `src/scripts/theme.ts`.

## Conventions

- Path alias `@/*` → `src/*` (plus `@/astro-paper.config`). Prefer it over relative imports.
- Layouts: `Layout.astro` (base `<head>`, meta, OG, theme bootstrap) → `PostLayout.astro` (adds article/JSON-LD) → page.
- Route-private components/utils are co-located under `_components/` and `_utils/` inside `src/pages/...` (underscore keeps them out of routing).
- Static search is **Pagefind**; the index is generated at build time into `dist/pagefind/` (don't hand-edit it). `data-pagefind-body` on the article marks indexable content. The search UI is lazy-loaded via dynamic `import()` on `requestIdleCallback` in `src/pages/search.astro`.
- Commits follow **Conventional Commits** (configured via `cz.yaml` with Commitizen).
