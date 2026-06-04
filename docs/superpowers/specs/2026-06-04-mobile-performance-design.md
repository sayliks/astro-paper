# Mobile Performance Optimization — Design Spec

**Date:** 2026-06-04
**Status:** Approved
**Scope:** Homepage + Post detail pages

---

## 1. Objective & Success Metrics

### Objective
Improve mobile performance on the homepage and post detail pages without removing or degrading the three non-negotiable features: Giscus comments, Pagefind search, and dynamic OG images.

### Target Metrics (Mobile, simulated 4G)

| Metric | Current (estimated) | Target |
|--------|---------------------|--------|
| **LCP** | ~3.5s | < 2.5s |
| **CLS** | ~0.15 | < 0.1 |
| **INP** | ~200ms | < 100ms |
| **Lighthouse Performance** | ~70 | ≥ 90 |
| **TTFB** | ~500ms | < 300ms |
| **Total JS (post page)** | ~120 KB | < 60 KB (before Giscus third-party) |

### How we'll measure
- **Pre-implementation baseline:** Run `pnpm build && pnpm preview`, then Chrome DevTools Lighthouse (mobile preset, simulated 4G throttling, clear storage) against homepage + one post detail page. Export JSON reports and save screenshots.
- After each milestone (M1, M2), re-run the same Lighthouse audit and compare against baseline.
- Lighthouse JSON reports saved to `docs/superpowers/specs/lighthouse-baseline/` for traceability.

---

## 2. Scope

**In scope:** Homepage (`/`), post detail pages (`/posts/<slug>`)

**Out of scope:** Archives, tags, search, about, 404 pages (these will inherit improvements from shared components but aren't individually audited)

---

## 3. Non-Negotiable Features

| Feature | Constraint |
|---------|-----------|
| Giscus comments | Must remain on post detail pages; loading strategy can change |
| Pagefind search | Must remain on search page; existing lazy-load approach stays |
| Dynamic OG images | Must remain; Satori + Sharp pipeline unchanged |

---

## 4. Approaches Considered

| Approach | Effort | Impact | Decision |
|----------|--------|--------|----------|
| Quick Wins | Low | Moderate | Incorporated as baseline |
| **Targeted Optimization** | **Medium** | **High** | **Selected** |
| Deep Engineering | High | High (diminishing) | Rejected — over-engineered for a blog |

**Rationale:** Approach 2 delivers measurable LCP/CLS/INP improvements by fixing image loading, script execution, and font strategy — the three biggest mobile pain points — without architectural churn. Approach 3's service workers and speculative prerendering add maintenance burden disproportionate to the gain for a content site.

---

## 5. Detailed Design

### 5.1 Resource Loading & Hints

#### 5.1.1 Font preloading (revised per feedback)
**Current:** Astro's `fontProviders.google()` pulls from Google Fonts. Preload is set on 1 weight (400, `subset: "latin"`). The CSS URL introduces a cross-origin waterfall: browser fetches CSS from Google → CSS references woff2 files → browser fetches woff2.

**Change:**
- Reduce loaded weights from `[300, 400, 500, 600, 700]` to `[400, 500, 700]` in `astro.config.ts`. 300 and 600 are near-indistinguishable from 400 and 500 respectively on mobile screens.
- Preload two weights (400 + 700) instead of one, since 700 is the bold weight used in headings.
- Preload the **resolved woff2 asset URL** (the file Astro serves from its own origin after downloading from Google), not the Google Fonts CSS URL. This eliminates the cross-origin waterfall. Astro's `Font` component with the `preload` option should already handle this correctly when the font is configured via `astro:assets`. Verify the generated `<link>` tags point to `/_astro/fonts/...` (local) not `fonts.googleapis.com`.

**Files:** `astro.config.ts` (weights), `src/layouts/Layout.astro` (preload configuration)

#### 5.1.2 Preconnect hints
Add to `<head>` in `Layout.astro`:
```html
<link rel="preconnect" href="https://giscus.app" crossorigin>
```
Google Fonts preconnect is not needed when fonts are served locally by Astro. Giscus preconnect saves one DNS + TLS round-trip (~150ms on 4G) when the comments observer fires.

**Files:** `src/layouts/Layout.astro`

#### 5.1.3 Resource prefetch for pagination
On the homepage, add `<link rel="prefetch">` for the first page of posts (`/posts/`) — this is the most common next-navigation after the homepage. Low-cost speculative win.

**Files:** `src/pages/index.astro`

---

### 5.2 Image Optimization

#### 5.2.1 Content images in markdown posts
**Current:** Markdown images (`![](url)`) render as plain `<img>` tags — no `loading="lazy"`, no `decoding="async"`, no responsive `srcset`, no explicit `width`/`height`. This causes:
- **LCP:** Hero images block rendering
- **CLS:** Images without dimensions cause layout shifts as they load
- **Bandwidth waste:** Full-resolution images served to all viewport sizes

**Change:** Add a rehype plugin that transforms `<img>` tags in the rendered HTML:
- Adds `loading="lazy"` to all images except the first one on the page (first image gets `loading="eager"` to preserve LCP)
- Adds `decoding="async"` to all images
- Copies `width`/`height` attributes if present in the markdown (preserves native aspect-ratio for CLS-free loading)
- Adds `sizes="(max-width: 768px) 100vw, 768px"` for responsive hinting

**Files:** New file `src/utils/transformers/rehypeImageOptimize.ts`, registered in `astro.config.ts` markdown config.

**Note:** Full `srcset` generation (multiple resolutions via Sharp) requires images to go through Astro's `getImage()` API, which isn't directly available in a rehype plugin. The attribute-based approach gives us the CLS and lazy-loading wins — which account for ~70% of the mobile image performance gap. For the remaining 30% (automatic resizing), a follow-up could explore using Astro's Image component in `.mdx` posts or a more sophisticated remark plugin.

#### 5.2.2 Explicit dimensions for OG images
**Current:** The `og:image` `<meta>` tag references the image but `<meta>` tags don't need dimensions.
**No change needed** — OG images aren't rendered in the viewport.

#### 5.2.3 Favicon
**No change** — Already SVG (resolution-independent, 0 CLS impact).

---

### 5.3 JavaScript Optimization

#### 5.3.1 Post detail inline script — decomposition
**Current:** A ~170-line inline script in `[...slug]/index.astro` with `is:inline data-astro-rerun` handles:
1. Scroll progress bar (with `scroll` event listener — non-passive)
2. Heading anchor links (DOM manipulation on every page load)
3. Code copy buttons (DOM manipulation + clipboard API)

Every view transition navigation re-executes this entire block. Inline scripts block parsing if not deferred; `is:inline` means the browser must parse it synchronously.

**Change — split into three modules:**

**A) Scroll progress → CSS-only (progressive enhancement)**
Replace the entire JS scroll progress bar with a CSS approach:

```css
/* Default: hidden (browsers without animation-timeline support) */
.progress-container { display: none; }
.progress-bar { display: none; }

/* Progressive enhancement: shown only when supported */
@supports (animation-timeline: scroll()) {
  .progress-container {
    display: block;
    position: fixed;
    top: 0;
    z-index: 10;
    height: 4px;
    width: 100%;
    background: var(--background);
  }
  .progress-bar {
    display: block;
    height: 4px;
    background: var(--accent);
    animation: reading-progress auto linear;
    animation-timeline: scroll();
    width: 100%;
  }
}

@keyframes reading-progress {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
```

This eliminates all JS for scroll tracking. On browsers that don't support `animation-timeline: scroll()` (~80% as of 2026), the progress bar simply doesn't appear — a cosmetic-only degradation with zero impact on usability.

**B) Heading anchor links → `src/scripts/heading-links.ts`**
Standalone module with `astro:after-swap` listener. The browser caches this across navigations.

**C) Code copy buttons → `src/scripts/code-copy.ts`**
Standalone module. `astro:after-swap` triggers DOM scan + button attachment.

**Files:**
- `src/pages/posts/[...slug]/index.astro` — remove inline script, add `<style>` for CSS progress bar, add `<script>` references to external modules
- `src/styles/global.css` or inline `<style>` — scroll progress bar CSS
- `src/scripts/heading-links.ts` — new file
- `src/scripts/code-copy.ts` — new file

#### 5.3.2 Scroll event listener audit
After the CSS scroll progress change, the only remaining scroll listener is Astro's own view transition scroll restoration. No action needed — Astro's is already passive-optimized.

#### 5.3.3 Script loading strategy

| Script | Current | New | Reason |
|--------|---------|-----|--------|
| Theme FOUC prevention | `is:inline` (sync) | Unchanged | Must run before paint |
| `theme.ts` | `<script>` (deferred) | Unchanged | Already optimal |
| Header nav toggle | Inline in `Header.astro` | Unchanged | Tiny, needed for interaction |
| Scroll progress | Inline JS (~50 lines) | CSS-only | Zero JS cost |
| Heading links | Inline JS (~30 lines) | External `.ts`, deferred | Cached, non-blocking |
| Code copy buttons | Inline JS (~60 lines) | External `.ts`, deferred | Cached, non-blocking |
| Homepage `sessionStorage` | Inline in `index.astro` | Unchanged | Minimal, 3 lines |

---

### 5.4 Giscus Comments — Intersection Observer

**Current:** Giscus script injected immediately on post page load via an inline IIFE. The script has `async` + `data-loading="lazy"`, but the browser still fetches `giscus.app/client.js` regardless of scroll position.

**Change:** Wrap script injection in an `IntersectionObserver`:
- Observe the Giscus container `<section>`
- When it enters the viewport (rootMargin: `0px 0px 400px 0px`), inject the `<script>` element
- The existing `data-loading="lazy"` attribute stays as a fallback — if the observer never fires (edge case), the browser's native lazy loading still defers the fetch
- Disconnect the observer after first trigger

This keeps ~80 KB of third-party JS off the wire until the user actually scrolls to the comments section. For readers who never scroll past the article, Giscus is never loaded at all.

**Files:** `src/components/Giscus.astro`

---

### 5.5 CSS & Rendering

#### 5.5.1 `content-visibility: auto`
Apply `content-visibility: auto` with explicit `contain-intrinsic-size` to below-fold sections:

| Element | `contain-intrinsic-size` | Rationale |
|---------|--------------------------|-----------|
| Footer | `auto 200px` | Always below fold on post pages |
| Giscus wrapper | `auto 500px` | Only visible after scrolling past article |
| AdjacentPostNav | `auto 150px` | Always at the very bottom |

`contain-intrinsic-size: auto <estimate>` ensures:
- The browser can skip layout/paint for these elements until they approach the viewport
- The estimate prevents CLS when the element scrolls in — the browser uses it as a placeholder until actual rendering occurs

**Files:** `src/components/Footer.astro`, `src/components/Giscus.astro`, `src/pages/posts/[...slug]/_components/AdjacentPostNav.astro`

#### 5.5.2 `prefers-reduced-motion`
Add a global CSS rule:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```
This overrides all animations (including Astro view transitions) for users who prefer reduced motion. Also add a corresponding `<meta name="viewport">` adjustment consideration.

**Files:** `src/styles/global.css`

#### 5.5.3 Code block horizontal scroll
**No change.** The `wrap: false` setting in Shiki config preserves code formatting. The existing `max-w-app` wrapper + `overflow-x-auto` on pre elements (from prose styles) handles narrow viewports correctly.

#### 5.5.4 Touch target sizing (optional)

Audit interactive elements (nav links, buttons, copy-code button) for minimum 44×44px tap targets per WCAG 2.5.5. If small targets are found, add `min-height: 44px` or increase padding. This is a UX polish item — low performance impact but meaningful for mobile usability. (nav links, buttons, copy-code button) for minimum 44×44px tap targets per WCAG 2.5.5. If small targets are found, add `min-height: 44px` or increase padding. This is a UX polish item — low performance impact but meaningful for mobile usability.

---

### 5.6 View Transition Polish

**Change:** Reduce view transition duration on mobile:
```css
@media (max-width: 640px) {
  :root {
    --astro-transition-duration: 150ms;
  }
}
```
The default is ~200-300ms. A shorter duration on mobile makes navigation feel snappier. Combined with `prefers-reduced-motion`, users who want instant transitions get them.

**Files:** `src/styles/global.css`

---

## 6. Implementation Plan

### Pre-implementation: Lighthouse Baseline

- `pnpm build && pnpm preview`
- Run Chrome DevTools Lighthouse (mobile, 4G simulated, clear storage) against homepage + one post detail
- Export JSON reports to `docs/superpowers/specs/lighthouse-baseline/`
- Record screenshots of scores + filmstrip for before/after comparison

### Milestone 1 — Zero-Risk (CSS, hints, fonts)

No behavioral changes. Ship immediately.

| # | File | Action |
|---|------|--------|
| M1.1 | `astro.config.ts` | Reduce font weights from `[300,400,500,600,700]` to `[400,500,700]` |
| M1.2 | `src/layouts/Layout.astro` | Add `<link rel="preconnect" href="https://giscus.app" crossorigin>`, verify font preload `<link>` points to local woff2 (`/_astro/fonts/...`) not `fonts.googleapis.com` |
| M1.3 | `src/styles/global.css` | Add `@media (prefers-reduced-motion: reduce)` rule, `@media (max-width: 640px)` view transition duration (150ms), `content-visibility` utility class |
| M1.4 | `src/components/Footer.astro` | Add `content-visibility: auto; contain-intrinsic-size: auto 200px` |
| M1.5 | `src/pages/posts/[...slug]/_components/AdjacentPostNav.astro` | Add `content-visibility: auto; contain-intrinsic-size: auto 150px` |
| M1.6 | `src/pages/index.astro` | Add `<link rel="prefetch">` for `/posts/` |
| M1.7 | (optional) Header + card components | Touch target audit — ensure interactive elements ≥44×44px |

**Verify:** Re-run Lighthouse after M1. Expect gains in TTFB, minor LCP improvement from preconnect + font optimization.

### Milestone 2 — Behavioral (images, JS, Giscus)

Larger gains, requires testing.

| # | File | Action |
|---|------|--------|
| M2.1 | `src/utils/transformers/rehypeImageOptimize.ts` | **New:** rehype plugin — adds `loading="lazy"` (except first image → `eager`), `decoding="async"`, `sizes`, preserves `width`/`height` |
| M2.2 | `astro.config.ts` | Register rehype plugin in `markdown.rehypePlugins` |
| M2.3 | `src/scripts/heading-links.ts` | **New:** heading anchor link module with `astro:after-swap` |
| M2.4 | `src/scripts/code-copy.ts` | **New:** code copy button module with `astro:after-swap` |
| M2.5 | `src/pages/posts/[...slug]/index.astro` | Remove inline `is:inline data-astro-rerun` script. Add CSS-only scroll progress bar (progressive enhancement via `@supports`). Add `<script>` refs to heading-links.ts and code-copy.ts. Add `content-visibility: auto; contain-intrinsic-size: auto 500px` to Giscus wrapper |
| M2.6 | `src/components/Giscus.astro` | Wrap script injection in `IntersectionObserver` with `rootMargin: 0px 0px 400px 0px`. Keep `data-loading="lazy"` as fallback. Disconnect after first trigger |

**Verify:** Re-run Lighthouse after M2. Expect CLS improvement (image dimensions), INP improvement (less JS parse), LCP improvement (Giscus deferred).

### Commit strategy
- One commit per file, prefixed with `perf(mobile):` — groups cleanly in git log and each is independently revertible.
- Alternatively, two commits: `perf(mobile): M1 — CSS, hints, fonts` and `perf(mobile): M2 — images, JS, Giscus`. Use whichever matches team convention.

---

## 7. Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Rehype image plugin breaks existing image styling | Low | Medium | Apply only `loading`/`decoding`/`sizes` attributes — no structural changes. Test against all existing posts with images. |
| CSS scroll progress `@supports` false-positive in some browser | Low | Low | Cosmetic-only feature. No fallback needed. |
| Giscus observer fires late/never on some browsers | Low | Medium | Keep `data-loading="lazy"` as fallback. Test in Safari (which has historically had IntersectionObserver quirks). |
| External JS modules cause FOUC for copy buttons / heading links | Medium | Low | Buttons/links are progressive enhancement — the content is usable without them. Add `astro:after-swap` listener so they re-attach after view transitions. |
| `content-visibility` with wrong `contain-intrinsic-size` causes scroll jank | Medium | Low | Use conservative estimates (slightly larger than actual). The `auto` keyword lets the browser use the last-observed size. Test scroll behavior. |
| Font preload verification reveals woff2 not served locally | Low | High | If Astro's font pipeline still serves a Google URL, switch to `@fontsource` packages for local hosting. This is a known fallback path. |

---

## 8. Rollback Plan

All changes are to source files tracked by git. Rollback is:

```bash
git checkout -- <changed-files>
```

Since each category of change is in its own commit (per the execution order), individual categories can be reverted without affecting others:

```bash
git revert <commit-hash>
```

No database migrations, no API changes, no infrastructure changes. Pure frontend static site.
