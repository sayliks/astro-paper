# Optimization Opportunities

Current as of 2026-06-09. This document records optimization points found by
reading the current AstroPaper codebase, with emphasis on practical changes that
reduce page weight, build cost, third-party runtime work, and long-term
maintenance risk.

## Recently Completed

These improvements are already present in the current working tree and should be
preserved during future optimization work.

| Area | Main files | Current state |
| --- | --- | --- |
| Photo wall host governance | `astro-paper.config.ts`, `src/utils/photoWall.ts`, `src/pages/photo-wall.astro`, `tests/photo-wall.test.ts` | External photo wall image URLs are restricted to `photoWall.allowedExternalHosts`; local images remain allowed. |
| OG font loading | `src/utils/ogFont.ts`, `src/pages/og.png.ts`, `src/pages/posts/[...slug]/index.png.ts` | Satori font buffers are loaded through a shared module-level cache via `getOgSatoriFonts()`. |
| Hitokoto cache misses | `src/scripts/hitokoto.ts` | Third-party quote fetches are scheduled with `requestIdleCallback` when available, with a short timeout fallback. |
| Touch interaction cleanup | `src/scripts/header-menu.ts`, `src/scripts/theme.ts`, `src/styles/global.css` | Header menu and theme toggle handle direct touch/pointer activation without relying only on delayed click events. |
| Vendored CMS bundle hygiene | `eslint.config.js`, `.prettierignore`, `public/cms/sveltia-cms.js` | The large self-hosted CMS runtime is excluded from lint/format paths. |

## Priority Map

| Priority | Area | Main files | Expected benefit |
| --- | --- | --- | --- |
| P1 | Responsive image delivery | `src/pages/photo-wall.astro`, `src/components/moments/MomentImages.astro`, `src/data/photoWall.json` | Lower image bytes, better LCP, less dependence on remote originals |
| P1 | Shared content queries | `src/pages/**`, `src/utils/getSortedPosts.ts`, `src/utils/getSortedMoments.ts` | Less repeated build work and one source of truth for publication rules |
| P1 | CMS/admin runtime asset policy | `public/cms/sveltia-cms.js`, `public/cms/index.html`, `public/cms/config.yml` | Clearer upgrade/cache story for the 1.9 MB vendored admin bundle |
| P2 | OG renderer reuse | `src/pages/og.png.ts`, `src/pages/posts/[...slug]/index.png.ts`, `src/utils/ogFont.ts` | Less duplicated Satori markup after font caching |
| P2 | Client script gating | `src/layouts/Layout.astro`, `src/scripts/*.ts`, `src/components/Header.astro` | Less JavaScript on routes that do not need every behavior |
| P2 | Third-party runtime controls | `src/scripts/hitokoto.ts`, `src/components/Giscus.astro`, `src/layouts/Layout.astro` | More predictable first-load behavior and privacy controls |
| P2 | Search script structure | `src/pages/search.astro` | Smaller page component and easier View Transition lifecycle maintenance |
| P2 | Content and image validation | `tests/`, `src/utils/transformers/rehypeImageOptimize.ts`, `public/cms/config.yml` | Fewer regressions around image loading and slug/content integrity |
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

### 2. Add memoized shared content query helpers

`getCollection("posts")` and `getCollection("moments")` are called from many
routes: homepage, posts pagination, post details, tags, archives, RSS, search,
moments list, moment details, and dynamic OG paths. The utilities are mostly
consistent, but each route repeats collection loading, filtering, and sorting.

Recommended work:

- Add `src/utils/contentQueries.ts` with memoized functions such as
  `getPublishedSortedPosts()`, `getPublishedSortedMoments()`, and
  `getPublishedTags()`.
- Keep behavior delegated to existing helpers: `postFilter`, `getSortedPosts`,
  `getSortedMoments`, and `getUniqueTags`.
- Update routes to consume these helpers instead of calling `getCollection`
  directly.
- Include explicit helpers for different ordering needs, such as pinned moment
  order versus "last updated" homepage feed order.

This should reduce repeated static-build work and make publication rules easier
to audit.

### 3. Share OG rendering code after font memoization

`src/utils/ogFont.ts` now centralizes and memoizes OG font buffer loading, so
the largest repeated font I/O issue has been addressed. The two OG image routes
still contain near-identical Satori frame markup and Sharp conversion flow.

Recommended work:

- Extract common OG frame styles/layout to a small renderer helper so the two
  routes only supply title, subtitle, and footer content.
- Share the Satori-to-PNG conversion helper if more OG image types are added.
- Consider whether rejected font fetch promises should be evicted from the cache
  in long-lived server runtimes; static builds can fail fast as they do now.
- Keep `config.features.dynamicOgImage` as the fast-build escape hatch.

This is now a maintainability optimization rather than the first build-time
hotspot.

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
scheduled on idle. The next step is configuration and timeout control.

Recommended work:

- Add a config flag to disable Hitokoto entirely for privacy-first or offline
  deployments.
- Add a short fetch timeout so a slow Hitokoto request does not linger.
- Consider a config flag for comments so `Giscus.astro` can be omitted from
  article pages without editing layouts.
- Review the default for `features.speedInsights`; keep page-level opt-outs for
  image-heavy or admin-like routes.

These changes make the static site more predictable under slow networks and
privacy-sensitive deployments.

### 7. Extract the search page script into a typed module

`src/pages/search.astro` contains the Pagefind UI bootstrap, development notice,
URL query synchronization, session-storage back URL handling, and View
Transition reinitialization in one inline script. It works, but it is one of the
largest page files and has several lifecycle responsibilities.

Recommended work:

- Move the script body to `src/scripts/search.ts`.
- Keep route data in DOM `data-*` attributes as it does now.
- Add local types or a small declaration for `@pagefind/default-ui` instead of
  keeping the `@ts-expect-error` inside the page.
- Add tests for pure helpers if query/back-url behavior is extracted.

This is mainly maintainability, but it also gives Vite a clearer module boundary
for caching and chunking.

### 8. Add regression tests for markdown image optimization

`src/utils/transformers/rehypeImageOptimize.ts` adds `loading`, `decoding`,
`sizes`, and first-image `fetchpriority` attributes to markdown images. That is
valuable performance behavior, but there is no direct test protecting it.

Recommended work:

- Add a focused test that feeds a small HAST tree into `rehypeImageOptimize()`.
- Cover first image with dimensions, later images, images without dimensions,
  and existing explicit attributes.
- Keep the transformer attribute-only until responsive image generation is
  introduced deliberately.

This is a small test investment that protects a high-impact rendering path.

### 9. Strengthen content integrity checks for slugs and remote media

Current tests cover moment sorting/filtering and photo wall shape validation,
including the new external-host allowlist. The next checks should catch content
states that only fail later in routing or production performance.

Recommended work:

- Add a test or script that asserts moment slugs are unique after route slug
  derivation.
- Add test coverage for malformed photo wall URL shapes such as `https:foo` so
  they fail validation instead of turning into broken local asset paths.
- Warn on external image URLs without known dimensions or on oversized local
  uploads.
- Consider checking CMS-generated image metadata before build.

This is partly performance and partly reliability: bad media or duplicate slugs
can waste debugging time and create route surprises.

### 10. Refine homepage feed assembly into a pure utility

`src/pages/index.astro` builds a mixed recent feed from posts and moments. It
already limits candidates before the final merge, which is good. The remaining
work is to make ordering rules explicit and reusable.

Recommended work:

- Extract feed assembly to a pure utility, for example
  `getRecentFeedItems({ posts, moments, limit })`.
- Name the moment ordering choice: pinned-first timeline order versus
  modified-time activity order.
- Cache or precompute moment descriptions if the same excerpts are used in
  multiple surfaces.

This is not urgent today, but it keeps the homepage from becoming a data
orchestration hotspot.

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
- Search imports Pagefind UI on idle and only on the search page.
- Photo wall and moment images include explicit dimensions and first-visible
  priority handling.
- Photo wall external URLs are constrained by `photoWall.allowedExternalHosts`.
- OG font buffers are memoized through `getOgSatoriFonts()`.
- Hitokoto cache-miss fetches are deferred to idle time.
- `Layout.astro` allows page-level opt-outs for `clientRouter`, font preload,
  and Speed Insights.
- `eslint.config.js` and `.prettierignore` already exclude the vendored CMS
  runtime bundle.

## Recommended First Pass

1. Implement shared memoized content query helpers and update routes to use
   them.
2. Add responsive image variant support for photo wall and moment uploads.
3. Extract shared OG image frame/rendering helpers.
4. Add regression tests for `rehypeImageOptimize()`, moment slug uniqueness, and
   malformed photo wall URL validation.
5. Gate optional global scripts and third-party work behind page needs or config
   flags.

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
