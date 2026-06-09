# Optimization Opportunities

Current as of 2026-06-09. This document records optimization points found by
reading the current AstroPaper codebase, with emphasis on practical changes that
reduce page weight, build cost, third-party runtime work, and long-term
maintenance risk.

Use this as the reference audit, not as a task tracker. The active next-step
queue is maintained in `docs/optimization-roadmap-2026-06-09.md`; update the
roadmap after each optimization pass so completed items do not drift between
documents.

## Recently Completed

These improvements are already present in the current working tree and should be
preserved during future optimization work.

| Area | Main files | Current state |
| --- | --- | --- |
| Photo wall host governance | `astro-paper.config.ts`, `src/utils/photoWall.ts`, `src/pages/photo-wall.astro`, `tests/photo-wall.test.ts` | External photo wall image URLs are restricted to `photoWall.allowedExternalHosts`; local images remain allowed. |
| Photo wall URL validation | `src/utils/photoWall.ts`, `tests/photo-wall.test.ts` | External photo wall URLs reject insecure `http://` sources and malformed `https:` shapes with stable validation errors. |
| OG font loading | `src/utils/ogFont.ts`, `src/pages/og.png.ts`, `src/pages/posts/[...slug]/index.png.ts` | Satori font buffers are loaded through a shared module-level cache via `getOgSatoriFonts()`, and failed font fetches evict their cache key. |
| Hitokoto cache misses | `src/scripts/hitokoto.ts` | Third-party quote fetches are scheduled with `requestIdleCallback` when available, with a 2-second idle timeout and a short timeout fallback. |
| Touch interaction cleanup | `src/scripts/header-menu.ts`, `src/scripts/theme.ts`, `src/styles/global.css` | Header menu and theme toggle handle direct touch/pointer activation without relying only on delayed click events. |
| Shared content queries | `src/utils/contentQueries.ts`, `src/pages/**` | Published posts, moments, and tags are loaded through shared helpers that memoize during static builds while staying fresh in dev. |
| Content and markdown image regression tests | `src/content.config.ts`, `tests/moments.test.ts`, `tests/rehype-image-optimize.test.ts` | Moment entries use filename-derived collection IDs, and tests protect moment publication/sorting helpers plus Markdown image loading attributes. |
| Homepage feed utility | `src/utils/recentFeed.ts`, `src/pages/index.astro`, `tests/recent-feed.test.ts` | The mixed recent feed is assembled by a pure helper that preserves candidate limiting and ordering behavior. |
| Search module extraction | `src/pages/search.astro`, `src/scripts/search.ts`, `src/pagefind-default-ui.d.ts`, `tests/search.test.ts` | Pagefind initialization and query/back-link helpers now live in a typed route-local script module. |
| OG renderer reuse | `src/utils/ogImageFrame.ts`, `src/utils/ogImageRenderer.ts`, `src/pages/og.png.ts`, `src/pages/posts/[...slug]/index.png.ts`, `tests/og-image-frame.test.ts` | Generic and post OG endpoints share Satori frame and PNG response helpers while keeping cached OG font loading. |
| Vendored CMS bundle hygiene | `eslint.config.js`, `.prettierignore`, `public/cms/sveltia-cms.js` | The large self-hosted CMS runtime is excluded from lint/format paths. |

## Priority Map

| Priority | Area | Main files | Expected benefit |
| --- | --- | --- | --- |
| P1 | Responsive image delivery | `src/pages/photo-wall.astro`, `src/components/moments/MomentImages.astro`, `src/data/photoWall.json` | Lower image bytes, better LCP, less dependence on remote originals |
| P1 | CMS/admin runtime asset policy | `public/cms/sveltia-cms.js`, `public/cms/index.html`, `public/cms/config.yml` | Clearer upgrade/cache story for the 1.9 MB vendored admin bundle |
| P1 | CMS OAuth scope audit | `src/server/cmsAuth.js`, `public/cms/config.yml` | Clearer or narrower repository permissions for admin login |
| P2 | Client script gating | `src/layouts/Layout.astro`, `src/scripts/*.ts`, `src/components/Header.astro` | Less JavaScript on routes that do not need every behavior |
| P2 | Third-party runtime controls | `src/scripts/hitokoto.ts`, `src/components/Giscus.astro`, `src/layouts/Layout.astro` | More predictable first-load behavior and privacy controls |
| P3 | Font and asset budgets | `astro.config.ts`, `src/layouts/Layout.astro`, `package.json` | Better visibility into incremental static asset growth |

## Findings

### 1. Generate responsive variants for photo wall and moment images

The photo wall renders each item with a single `src`; current published entries
in `src/data/photoWall.json` are remote `https://tg.matsumae.top/...webp`
assets. Moment images similarly render direct public or remote URLs through
`MomentImages.astro`. The current implementation already preserves layout with
explicit `width` and `height`, lazy-loads non-priority images, marks first
visible images as high priority, and now restricts photo wall external hosts.
The next optimization layer is variant generation.

Recommended work:

- Mirror published photo wall images into `public/photo-wall/` or import them
  through an Astro/Sharp image pipeline.
- Generate display variants such as 320, 640, 960, and 1280 widths, then render
  `srcset` and accurate `sizes`.
- Apply the same approach to CMS-uploaded moment images under `public/moments`.
- Keep explicit dimensions as required content metadata to avoid CLS.
- Add a lightweight check that warns on very large local uploads or unknown
  remote hosts.

This is the most visible optimization because these pages are image-heavy and
currently cannot adapt bytes to the visitor's viewport.

### 2. Keep shared content query helpers as the route data entry point

`src/utils/contentQueries.ts` now centralizes published posts, published
moments, and published tags. Route modules should keep using these helpers
instead of calling `getCollection()` directly, so build-time collection work
stays memoized and publication rules remain easy to audit.

Recommended work:

- Keep behavior delegated to existing helpers: `postFilter`, `getSortedPosts`,
  `getSortedMoments`, and `getUniqueTags`.
- Include explicit helpers for different ordering needs, such as pinned moment
  order versus "last updated" homepage feed order.
- Keep dev mode uncached so CMS/content edits stay visible without restarting
  the dev server.

This reduces repeated static-build work and makes publication rules easier to
audit.

### 3. Keep shared OG rendering helpers as the endpoint boundary

`src/utils/ogFont.ts` centralizes and memoizes OG font buffer loading, and failed
font fetches evict their cache entries so later OG requests can retry. The
generic and post OG endpoints now also share frame helpers in
`src/utils/ogImageFrame.ts` and Satori-to-PNG response rendering in
`src/utils/ogImageRenderer.ts`.

Recommended work:

- Keep future OG endpoint variants limited to supplying title, subtitle, body,
  and footer content to the shared helpers.
- Keep `config.features.dynamicOgImage` as the fast-build escape hatch.
- Add new frame tests only when a new OG layout variant is introduced.

This item is now a preservation note rather than an active extraction task.

### 4. Define the CMS bundle update and caching policy

`public/cms/sveltia-cms.js` is about 1.9 MB. It is already excluded from ESLint
and Prettier, which is good and should remain. The missing piece is an explicit
operational policy for where the vendored bundle came from, when to update it,
and how it should be cached in production.

Recommended work:

- Document the exact Sveltia CMS version/source used to produce
  `public/cms/sveltia-cms.js`.
- Add an upgrade checklist that covers CMS login, edit, delete, upload, preview,
  and commit flows.
- Configure long-lived immutable caching for versioned CMS bundles at the
  hosting layer, or rename the bundle with a version/hash when updating.
- Keep custom authored admin code in small files such as `public/cms/preview.js`
  and `public/cms/article-preview.css`.

This keeps a large admin-only asset from becoming a mystery dependency.

### 5. Gate global client scripts by feature and page need

`Layout.astro` imports `theme`, `header-menu`, and `navigation-state` on every
page. These scripts are defensive and small, but not every route needs every
behavior. The inline theme bootstrap also runs even when the theme toggle
feature is disabled.

Recommended work:

- Skip the inline theme bootstrap and `theme.ts` module when
  `features.lightAndDarkMode` is false.
- Skip `navigation-state.ts` when `features.showBackButton` is false and the
  page does not emit `data-back-url`.
- Keep `header-menu.ts` global only if every rendered layout includes the
  responsive header; otherwise import it with the header component or a layout
  prop.
- Revisit whether `ClientRouter` should stay default-on for all pages. The
  project already opts out on heavier routes, which is a good sign that a
  route-by-route default may be cleaner.

This is a medium-sized runtime cleanup with low behavioral risk if done behind
existing feature flags.

### 6. Make third-party runtime work explicitly configurable

The site avoids several critical-path third-party costs: Giscus lazy-loads near
the viewport, Pagefind initializes on idle, and Hitokoto cache misses are now
scheduled on idle with a timeout. The next step is configuration and network
timeout control.

Recommended work:

- Add a config flag to disable Hitokoto entirely for privacy-first or offline
  deployments.
- Add a short network fetch timeout so a slow Hitokoto request does not linger.
- Consider a config flag for comments so `Giscus.astro` can be omitted from
  article pages without editing layouts.
- Review the default for `features.speedInsights`; keep page-level opt-outs for
  image-heavy or admin-like routes.

These changes make the static site more predictable under slow networks and
privacy-sensitive deployments.

### 7. Keep search route behavior isolated in its module

`src/pages/search.astro` now passes Pagefind bundle path, development notice
copy, translations, and back URL through DOM `data-*` attributes. The lifecycle
logic lives in `src/scripts/search.ts`, with local types for
`@pagefind/default-ui` and tests for the pure query/back-link helpers.

Recommended work:

- Keep Search-specific View Transition listeners inside `src/scripts/search.ts`.
- Add tests before changing URL query synchronization or session-storage back
  URL behavior.
- Keep Pagefind UI loading route-local and idle-scheduled.

This item is now a maintenance boundary rather than an extraction task.

### 8. Keep markdown image optimization tests aligned with the transformer

`src/utils/transformers/rehypeImageOptimize.ts` adds `loading`, `decoding`,
`sizes`, and first-image `fetchpriority` attributes to markdown images. Direct
tests now cover first-image priority, later lazy images, existing attributes,
missing dimensions, and nested image nodes.

Recommended work:

- Keep the transformer attribute-only until responsive image generation is
  introduced deliberately.
- Add new tests alongside any future `srcset` or local image pipeline behavior.
- Continue requiring explicit dimensions for priority images.

This protects the current rendering path without claiming responsive variants
are implemented.

### 9. Extend media validation after the filename-derived moment route fix

Moment entries now use filename-derived collection IDs, so duplicate frontmatter
`slug` values no longer overwrite entries in Astro's content layer. Current
tests cover moment sorting/filtering helpers and photo wall validation,
including the external-host allowlist, insecure external URLs, and malformed
external URL shapes.

Recommended work:

- Warn on external image URLs without known dimensions or on oversized local
  uploads.
- Consider checking CMS-generated image metadata before build.
- Keep Moment detail routes filename-derived unless a deliberate URL migration
  plan is introduced.

This is now mostly a media validation opportunity rather than a route collision
fix.

### 10. Keep homepage feed assembly as a pure utility

`src/utils/recentFeed.ts` now builds the mixed recent feed from posts and
moments. It keeps the current behavior: featured posts are excluded, post and
moment candidates are limited before the final merge, and the resulting feed is
sorted by updated/published time.

Recommended work:

- Keep homepage display rules in `getRecentFeedItems()` rather than rebuilding
  them in the Astro template.
- Add tests before changing candidate limits, featured filtering, or moment
  ordering semantics.
- Cache or precompute moment descriptions only if the same excerpts become
  shared by multiple surfaces.

This item is now a preservation note for the homepage utility.

### 11. Audit font loading by page type

`Layout.astro` preloads browser font weights 400 and 700 by default, while the
homepage opts out. The site content is Chinese-first, so the value of preloading
Latin-focused font subsets should be checked route by route.

Recommended work:

- Keep preloading on text-heavy article pages only if measurements show it helps.
- Disable font preloading on utility/admin/media-heavy pages where it is unlikely
  to improve the first view.
- Keep the browser font and OG-only Satori font paths separate.

### 12. Add simple asset/bundle budgets when optimization work starts

The repo has no current build-size budget. That is fine for a small site, but it
makes regressions harder to notice once admin assets, images, Pagefind, and
client scripts grow.

Recommended work:

- Add an optional post-build script that lists large files in `dist/` and fails
  only above generous thresholds.
- Track `public/cms/sveltia-cms.js`, generated Pagefind assets, image folders,
  and client JavaScript chunks separately.
- Keep this outside the core authoring path until thresholds are stable.

## Good Patterns To Preserve

- `Giscus.astro` lazy-loads comments with `IntersectionObserver`.
- Post and moment detail pages import heading-link and code-copy scripts only
  when rendered content needs them.
- Search imports Pagefind UI on idle through `src/scripts/search.ts` and only
  on the search page.
- Photo wall and moment images include explicit dimensions and first-visible
  priority handling.
- Photo wall external URLs are constrained by `photoWall.allowedExternalHosts`.
- Photo wall external URLs reject insecure `http://` and malformed `https:`
  shapes before rendering.
- OG font buffers are memoized through `getOgSatoriFonts()` and failed fetches
  evict their cache entries; OG frame/render helpers are shared by both current
  OG endpoints.
- Hitokoto cache-miss fetches are deferred to idle time with a timeout.
- Routes use `contentQueries.ts` for published posts, moments, and tags instead
  of repeating direct `getCollection()` calls.
- `Layout.astro` allows page-level opt-outs for `clientRouter`, font preload,
  and Speed Insights.
- `eslint.config.js` and `.prettierignore` already exclude the vendored CMS
  runtime bundle.

## Candidate Pool

Use the roadmap document for final ordering and branch scope. The remaining
high-signal candidates from this audit are:

1. Audit CMS runtime/version provenance and GitHub OAuth scope.
2. Add responsive image variant support for photo wall and moment uploads.
3. Gate optional global scripts and third-party work behind page needs or config
   flags.
4. Add simple asset and bundle budget reporting once thresholds are known.

## Suggested Verification

For code changes, run:

```bash
pnpm astro check
pnpm lint
pnpm run format:check
pnpm test
pnpm build
```

For image work, also verify:

- Desktop and mobile layouts have no unexpected horizontal scroll.
- First visible images keep accurate `width`, `height`, and `alt`.
- Generated variants are smaller than originals and selected correctly by the
  browser.
- Remote image fallback behavior is documented and intentional.

For CMS work, also verify:

- `/cms/index.html` loads the CMS bundle.
- OAuth or token login works.
- Article, moment, and photo wall create/edit/delete flows commit correctly.
- Uploaded images pass the new validation checks.
