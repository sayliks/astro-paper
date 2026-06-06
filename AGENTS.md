# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

AstroPaper is a minimal, SEO-friendly Astro blog theme. Package manager is **pnpm**; Node `>=24.0.0 <25`.

## Commands

```bash
pnpm dev            # dev server at localhost:5173 (shows drafts + scheduled posts)
pnpm build          # astro check (typecheck) + astro build + pagefind index in dist/pagefind/
pnpm preview        # preview the production build
pnpm lint           # eslint .
pnpm format         # prettier --write .   (format:check for CI)
pnpm sync           # regenerate astro:content / astro:* TS types after schema changes
```

Tests live in `tests/` and run with `pnpm test`. CI runs tests before `pnpm build`. "Type checking" means `astro check` (run via `pnpm build`, or directly with `pnpm astro check`). Run `pnpm sync` after editing `content.config.ts` so the generated types match.

## Configuration system (three layers — edit only the first)

1. **`astro-paper.config.ts`** (repo root) — the single user-facing config. Edit this for site metadata, posts-per-page, feature flags, socials, share links.
2. **`src/types/config.ts`** — the schema + `defineAstroPaperConfig()` type helper. Defines `AstroPaperConfig` (input) vs `ResolvedAstroPaperConfig` (resolved output). Edit only to add new config options.
3. **`src/config.ts`** — applies defaults and exports the resolved config. **Do not edit for configuration changes.** Everything in the codebase imports config from here (`import config from "@/config"`), never from the root file directly.

`astro.config.ts` reads from the root config (`config.site.url`, feature flags) to wire up integrations.

## Content & routing

- Posts live in `src/content/posts/` (collection `posts`), pages in `src/content/pages/` (collection `pages`). Schemas are in `src/content.config.ts`; `BLOG_PATH` is exported from there.
- **Underscore prefix excludes from build.** The glob loader uses `**/[^_]*.{md,mdx}`, so any file or directory starting with `_` (e.g. `_releases/`, `_color-schemes/`, `_components/`) is skipped by the content loader. This is the convention for docs/assets/co-located route components that must not become posts.
- **Subdirectories become URL segments.** A post at `posts/examples/foo.md` is served at `/posts/examples/foo`. The slug logic lives in `src/utils/getPostPaths.ts`. Two functions, do not confuse them:
  - `getPostSlug(id, filePath)` → slug-only path for `getStaticPaths` params (no base, no locale).
  - `getPostUrl(id, filePath, locale)` → fully navigable href for `<a>`/RSS (applies base + locale via `getRelativeLocaleUrl`).
- **Filtering/sorting:** `postFilter` (`src/utils/postFilter.ts`) drops drafts always, and in production hides scheduled posts until `pubDatetime - posts.scheduledPostMargin`; in dev everything non-draft shows. `getSortedPosts` sorts by `modDatetime ?? pubDatetime` desc. Use these rather than filtering `getCollection` results by hand.
- Slugs use a hybrid slugifier (`src/utils/slugify.ts`): `slugify` for Latin, `lodash.kebabcase` for strings containing non-Latin chars.

## Dynamic OG images

When `features.dynamicOgImage` is on, each post without an explicit `ogImage` gets a generated `index.png` via **Satori** (HTML→SVG) + **Sharp** (SVG→PNG):
- Per-post: `src/pages/posts/[...slug]/index.png.ts`.
- Site default: `src/pages/og.png.ts`.
- The post page (`[...slug]/index.astro`) resolves the OG URL: explicit `ogImage` frontmatter wins, otherwise it points at the generated `…/index.png`. Browser fonts use the `--font-google-sans-code` CSS variable, while generated OG images read the Satori-compatible `--font-google-sans-code-og` font data from Astro's font pipeline (`astro:assets`).

## i18n

`src/i18n/` auto-loads every `lang/*.ts` file via `import.meta.glob`. `useTranslations(locale)` returns the strings object (falls back to `en`); `tplStr(template, vars)` fills `{{key}}` placeholders. Astro i18n is configured in `astro.config.ts` (`locales: ["en"]`, `prefixDefaultLocale: false`). To add a locale: add it to `astro.config.ts` and drop a `src/i18n/lang/<locale>.ts` matching the `UIStrings` type.

## Base path & locale helpers

`src/utils/withBase.ts` handles deployment under a sub-path and locale prefixes: `getAssetPath()` to prefix `/public` asset URLs with the Astro `base`, `stripBase()` / `stripLocale()` to normalize pathnames. Use these instead of string-concatenating URLs.

## Theming & styling

- **Tailwind v4** via the `@tailwindcss/vite` plugin (no `tailwind.config.js`). Global styles and custom utilities (`max-w-app`, `app-layout`, `active-nav`) are defined with `@utility` in `src/styles/global.css`; color tokens in `src/styles/theme.css`; prose styles in `src/styles/typography.css`.
- **Dark mode** is driven by `data-theme` on `<html>`. An inline `is:inline` script in `src/layouts/Layout.astro` sets it before first paint (FOUC prevention); `src/scripts/theme.ts` handles the toggle afterward. The `dark:` variant maps to `[data-theme=dark]` (see `@custom-variant` in global.css).
- Markdown code blocks use Shiki with `min-light`/`night-owl` themes and notation transformers (diff/highlight/word-highlight) plus a custom filename transformer (`src/utils/transformers/fileName.js`), all configured in `astro.config.ts`.

## Conventions

- Path alias `@/*` → `src/*` (plus `@/astro-paper.config`). Prefer it over relative imports.
- Layouts: `Layout.astro` (base `<head>`, meta, OG, theme bootstrap) → `PostLayout.astro` (adds article/JSON-LD) → page.
- Route-private components/utils are co-located under `_components/` and `_utils/` inside `src/pages/...` (underscore keeps them out of routing).
- Static search is **Pagefind**; the index is generated into `dist/pagefind/` at build time. `data-pagefind-body` on the article marks indexable content.
