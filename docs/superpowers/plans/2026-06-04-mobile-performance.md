# Mobile Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve mobile Lighthouse scores (LCP < 2.5s, CLS < 0.1, INP < 100ms, Perf ≥ 90) on homepage and post detail pages without removing Giscus, Pagefind, or dynamic OG images.

**Architecture:** Two-milestone incremental optimization. M1 applies zero-risk CSS/HTML tweaks (fonts, hints, `prefers-reduced-motion`, `content-visibility`). M2 ships behavioral changes (rehype image plugin, JS decomposition to external modules, Giscus intersection observer, CSS scroll progress bar). Each file change is independently revertible.

**Tech Stack:** Astro v6, Tailwind v4, TypeScript, rehype/unified (hast), IntersectionObserver API, CSS `animation-timeline: scroll()`

---

## File Map

| File | M# | Action | Responsibility |
|------|-----|--------|----------------|
| `astro.config.ts` | M1.1, M2.2 | Modify font weights, register rehype plugin | Font config + markdown pipeline |
| `src/layouts/Layout.astro` | M1.2 | Add preconnect, verify font preload | Shared `<head>` for all pages |
| `src/styles/global.css` | M1.3 | Add reduced-motion, view transition duration, CSS progress bar | Global styles |
| `src/components/Footer.astro` | M1.4 | Add `content-visibility` | Footer rendering skip |
| `src/pages/posts/[...slug]/_components/AdjacentPostNav.astro` | M1.5 | Add `content-visibility` | Post nav rendering skip |
| `src/pages/index.astro` | M1.6 | Add `<link rel="prefetch">` for `/posts/` | Homepage speculative prefetch |
| `src/utils/transformers/rehypeImageOptimize.ts` | M2.1 | **New** — rehype plugin | Transform `<img>` in markdown output |
| `src/scripts/heading-links.ts` | M2.3 | **New** — heading anchor link module | Client-side heading link injection |
| `src/scripts/code-copy.ts` | M2.4 | **New** — code copy button module | Client-side copy button injection |
| `src/pages/posts/[...slug]/index.astro` | M2.5 | Replace inline script, add progress bar HTML + CSS, add script refs | Post detail page rendering |
| `src/components/Giscus.astro` | M2.6 | Add IntersectionObserver wrapper | Deferred Giscus loading |

---

## Pre-Implementation: Lighthouse Baseline

### Task 0: Capture baseline metrics

**Files:** None (measurement only)

- [ ] **Step 1: Build production**

```bash
pnpm build
```

- [ ] **Step 2: Start preview server (background)**

```bash
pnpm preview &
```

- [ ] **Step 3: Run Lighthouse on homepage**

Open Chrome DevTools → Lighthouse tab → Mode: Navigation, Device: Mobile, Categories: Performance → check "Clear storage" → Run against `http://localhost:4321/`

Export JSON: save to `docs/superpowers/specs/lighthouse-baseline/homepage.json`
Take screenshot of scores: save to `docs/superpowers/specs/lighthouse-baseline/homepage-scores.png`

- [ ] **Step 4: Run Lighthouse on a post detail page**

Find a post slug from the built site. Run same Lighthouse config against `http://localhost:4321/posts/<slug>/`

Export JSON: save to `docs/superpowers/specs/lighthouse-baseline/post-detail.json`
Take screenshot of scores: save to `docs/superpowers/specs/lighthouse-baseline/post-detail-scores.png`

- [ ] **Step 5: Record baseline metrics in plan**

Note LCP, CLS, INP, TTFB, Total JS (from the "View Original Trace" or summary) for both pages in the terminal.

---

## Milestone 1 — Zero-Risk (CSS, hints, fonts)

### Task M1.1: Reduce font weights in astro.config.ts

**Files:**
- Modify: `astro.config.ts:63-71`

- [ ] **Step 1: Change weights array**

In [astro.config.ts:63-71](astro.config.ts#L63-L71), change:

```ts
weights: [300, 400, 500, 600, 700],
```

To:

```ts
weights: [400, 500, 700],
```

- [ ] **Step 2: Verify the config is valid**

```bash
pnpm astro check
```

Expected: no type errors.

- [ ] **Step 3: Build and verify font loading**

```bash
pnpm build
```

Open the built HTML for a page. In `<head>`, verify the font preload `<link>` tags reference `/_astro/fonts/` (local files) — NOT `fonts.googleapis.com`.

- [ ] **Step 4: Commit**

```bash
git add astro.config.ts
git commit -m "perf(mobile): reduce font weights from 5 to 3 (400,500,700)"
```

---

### Task M1.2: Add preconnect hint in Layout.astro

**Files:**
- Modify: `src/layouts/Layout.astro:39-42`

- [ ] **Step 1: Add preconnect link**

In [src/layouts/Layout.astro:39-42](src/layouts/Layout.astro#L39-L42), after the `<meta charset>` line, add:

```astro
<link rel="preconnect" href="https://giscus.app" crossorigin>
```

The head section should look like:

```astro
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="preconnect" href="https://giscus.app" crossorigin>
  <link rel="icon" type="image/svg+xml" href={getAssetPath("favicon.svg")} />
  ...
```

- [ ] **Step 2: Verify in build output**

```bash
pnpm build
```

Grep for preconnect in the built HTML:

```bash
grep -r "preconnect" dist/
```

Expected: finds `<link rel="preconnect" href="https://giscus.app" crossorigin>` in page HTML files.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/Layout.astro
git commit -m "perf(mobile): add preconnect hint for giscus.app"
```

---

### Task M1.3: Add prefers-reduced-motion + view transition duration + CSS progress bar

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1: Add new styles at end of global.css**

In [src/styles/global.css](src/styles/global.css), append the following after all existing content:

```css
/* ===== Performance: reduced motion ===== */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* ===== Performance: snappier view transitions on mobile ===== */
@media (max-width: 640px) {
  :root {
    --astro-transition-duration: 150ms;
  }
}

/* ===== CSS scroll progress bar (progressive enhancement) ===== */
/* Hidden by default — only shown when animation-timeline is supported */
.progress-container,
.progress-bar {
  display: none;
}

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
    transform-origin: left;
  }
}

@keyframes reading-progress {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

Expected: build succeeds. No visual change yet (progress bar needs HTML elements added in M2.5).

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "perf(mobile): add prefers-reduced-motion, mobile transition speed, CSS progress bar"
```

---

### Task M1.4: Add content-visibility to Footer

**Files:**
- Modify: `src/components/Footer.astro`

- [ ] **Step 1: Read the file first**

Read `src/components/Footer.astro` to see the current structure.

- [ ] **Step 2: Add content-visibility style to the footer element**

Find the outermost element (likely a `<footer>`). Add a `style` attribute or a class. Given Tailwind v4 conventions, add inline style:

```astro
<footer
  style="content-visibility: auto; contain-intrinsic-size: auto 200px"
  class="..."
>
```

If there's already a `class` attribute, add the style alongside it. If the footer uses a different root element, apply it to that element.

**Important:** Read the file first before editing — do not assume the exact element structure.

- [ ] **Step 3: Verify build**

```bash
pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Footer.astro
git commit -m "perf(mobile): add content-visibility to footer"
```

---

### Task M1.5: Add content-visibility to AdjacentPostNav

**Files:**
- Modify: `src/pages/posts/[...slug]/_components/AdjacentPostNav.astro`

- [ ] **Step 1: Read the file**

Read `src/pages/posts/[...slug]/_components/AdjacentPostNav.astro`

- [ ] **Step 2: Add content-visibility to the root element**

Add to the outermost element:

```astro
style="content-visibility: auto; contain-intrinsic-size: auto 150px"
```

- [ ] **Step 3: Verify build**

```bash
pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/posts/[...slug]/_components/AdjacentPostNav.astro
git commit -m "perf(mobile): add content-visibility to adjacent post nav"
```

---

### Task M1.6: Add prefetch for /posts/ on homepage

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Add prefetch link in frontmatter**

In [src/pages/index.astro:1-24](src/pages/index.astro#L1-L24), the `<Layout>` component accepts children for `slot="head"`. Add a named slot to inject a prefetch link:

```astro
<Layout>
  <Fragment slot="head">
    <link rel="prefetch" href={getRelativeLocaleUrl(locale, "posts")} as="document">
  </Fragment>
  <Header />
  ...
```

Note: `getRelativeLocaleUrl` is already imported. `locale` is already defined in the frontmatter. `Fragment` can be imported from `astro:runtime` or used directly.

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

Check the homepage HTML for the prefetch link:

```bash
grep "prefetch" dist/index.html
```

Expected: finds `<link rel="prefetch" href="/posts/" as="document">`

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "perf(mobile): add speculative prefetch for /posts/ on homepage"
```

---

### Task M1.7 (optional): Touch target audit

**Files:**
- Review: `src/components/Header.astro`, `src/components/Card.astro`, `src/pages/posts/[...slug]/_components/BackToTopButton.astro`

- [ ] **Step 1: Audit interactive elements**

Open the site on a mobile viewport (375px width) and check tap targets per WCAG 2.5.5 (minimum 44×44px). Key elements to check:
- Nav menu links in `Header.astro`
- Theme toggle button (`#theme-btn`)
- Back-to-top button
- Copy code buttons (in M2.4 module)
- Tag links in `Card.astro`

- [ ] **Step 2: Fix undersized targets**

If any interactive element is smaller than 44×44px, add `min-h-[44px]` or increase padding. Example fix for small buttons:

```css
/* Add to the affected component's style block */
button, a {
  min-height: 44px;
  min-width: 44px;
}
```

- [ ] **Step 3: Commit (if changes made)**

```bash
git add <changed-files>
git commit -m "perf(mobile): ensure minimum 44x44px touch targets"
```

---

### Milestone 1 Verification

- [ ] Re-run Lighthouse (same config as Task 0) against homepage + post detail
- [ ] Compare LCP, CLS, TTFB against baseline
- [ ] Expect: TTFB improvement (~50-100ms from preconnect + fewer font weights), minor LCP gains
- [ ] Save updated reports to `docs/superpowers/specs/lighthouse-baseline/m1-*.json`

---

## Milestone 2 — Behavioral (images, JS, Giscus)

### Task M2.1: Create rehype image optimization plugin

**Files:**
- Create: `src/utils/transformers/rehypeImageOptimize.ts`

- [ ] **Step 1: Create the plugin file**

Create `src/utils/transformers/rehypeImageOptimize.ts`:

```ts
import type { Element, Root } from "hast";

/**
 * Rehype plugin that optimizes <img> tags for mobile performance.
 * - First image gets loading="eager" (preserves LCP)
 * - All other images get loading="lazy" + decoding="async"
 * - Adds responsive sizes hint
 * - Preserves existing width/height for CLS-free loading
 */
export function rehypeImageOptimize() {
  return (tree: Root) => {
    let isFirstImage = true;

    function walk(node: any) {
      if (!node || typeof node !== "object") return;

      if (node.type === "element" && node.tagName === "img") {
        const el = node as Element;
        el.properties = el.properties || {};

        // First image: eager to preserve LCP. Others: lazy.
        if (isFirstImage) {
          el.properties.loading = "eager";
          isFirstImage = false;
        } else {
          el.properties.loading = "lazy";
        }

        // Async decoding for non-critical images
        el.properties.decoding = "async";

        // Responsive sizes hint
        if (!el.properties.sizes) {
          el.properties.sizes = "(max-width: 768px) 100vw, 768px";
        }
      }

      // Recurse into children
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          walk(child);
        }
      }
    }

    walk(tree);
  };
}
```

**Note:** We use a manual tree walker instead of `unist-util-visit` to avoid an extra dependency. The `hast` types (`Element`, `Root`) are available from Astro's bundled packages.

- [ ] **Step 2: Verify the file compiles**

```bash
pnpm astro check
```

Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/utils/transformers/rehypeImageOptimize.ts
git commit -m "perf(mobile): add rehype plugin for image lazy/async/CLS attributes"
```

---

### Task M2.2: Register rehype plugin in astro.config.ts

**Files:**
- Modify: `astro.config.ts:40-46`

- [ ] **Step 1: Import the plugin**

At the top of `astro.config.ts`, add the import alongside the existing imports:

```ts
import { rehypeImageOptimize } from "./src/utils/transformers/rehypeImageOptimize";
```

- [ ] **Step 2: Register in markdown config**

The current markdown config uses `processor: unified({...})`. We need to add the rehype plugin. Two approaches depending on what the Astro `unified` wrapper supports:

**Try first (object form):** If `unified({...})` from `@astrojs/markdown-remark` supports `rehypePlugins`:

```ts
markdown: {
  processor: unified({
    remarkPlugins: [
      remarkToc,
      [remarkCollapse, { test: "Table of contents" }],
    ],
    rehypePlugins: [rehypeImageOptimize],
  }),
  shikiConfig: { ... },
},
```

**Fallback (chain form):** If the object form doesn't support `rehypePlugins`, switch to the chain:

```ts
markdown: {
  processor: unified()
    .use(remarkToc)
    .use(remarkCollapse, { test: "Table of contents" })
    .use(rehypeImageOptimize),
  shikiConfig: { ... },
},
```

- [ ] **Step 3: Verify build**

```bash
pnpm build
```

Expected: build succeeds. Inspect a post page with images:

```bash
grep -A2 "<img" dist/posts/*/index.html | head -20
```

Expected: `<img>` tags have `loading="lazy"`, `decoding="async"`, `sizes="..."`. The first image on each page should have `loading="eager"`.

- [ ] **Step 4: Commit**

```bash
git add astro.config.ts
git commit -m "perf(mobile): register rehype image optimization plugin"
```

---

### Task M2.3: Create heading-links.ts module

**Files:**
- Create: `src/scripts/heading-links.ts`

- [ ] **Step 1: Create the module**

Create `src/scripts/heading-links.ts`:

```ts
function addHeadingLinks(): void {
  const headings = Array.from(
    document.querySelectorAll("h2, h3, h4, h5, h6")
  );

  for (const heading of headings) {
    heading.classList.add("group");

    const link = document.createElement("a");
    link.className =
      "heading-link ms-2 no-underline opacity-75 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100";
    link.href = "#" + heading.id;

    const span = document.createElement("span");
    span.ariaHidden = "true";
    span.innerText = "#";

    link.appendChild(span);
    heading.appendChild(link);
  }
}

// Run on initial page load
addHeadingLinks();

// Re-run after Astro view transitions
document.addEventListener("astro:after-swap", addHeadingLinks);
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm astro check
```

- [ ] **Step 3: Commit**

```bash
git add src/scripts/heading-links.ts
git commit -m "perf(mobile): extract heading anchor links to external module"
```

---

### Task M2.4: Create code-copy.ts module

**Files:**
- Create: `src/scripts/code-copy.ts`

- [ ] **Step 1: Create the module**

Create `src/scripts/code-copy.ts`:

```ts
const COPY_LABEL = "复制";
const COPIED_LABEL = "已复制";

function attachCopyButtons(): void {
  const codeBlocks = Array.from(document.querySelectorAll("pre"));

  for (const codeBlock of codeBlocks) {
    // Skip if already wrapped (re-run safety)
    if (codeBlock.parentElement?.classList.contains("code-wrapper")) continue;

    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    wrapper.className = "code-wrapper";

    const computedStyle = getComputedStyle(codeBlock);
    const hasFileNameOffset =
      computedStyle.getPropertyValue("--file-name-offset").trim() !== "";
    const topClass = hasFileNameOffset
      ? "top-(--file-name-offset)"
      : "-top-3";

    const copyButton = document.createElement("button");
    copyButton.className = `copy-code absolute end-3 ${topClass} rounded bg-muted border border-muted px-2 py-1 text-xs leading-4 text-foreground font-medium`;
    copyButton.innerHTML = COPY_LABEL;

    codeBlock.setAttribute("tabindex", "0");
    codeBlock.parentNode?.insertBefore(wrapper, codeBlock);
    wrapper.appendChild(codeBlock);
    wrapper.appendChild(copyButton);

    copyButton.addEventListener("click", async () => {
      await copyCode(codeBlock, copyButton);
    });
  }
}

async function copyCode(block: HTMLElement, button: HTMLElement): Promise<void> {
  const code = block.querySelector("code");
  const text = code?.innerText ?? "";

  await navigator.clipboard.writeText(text);

  button.innerText = COPIED_LABEL;

  setTimeout(() => {
    button.innerText = COPY_LABEL;
  }, 700);
}

// Run on initial page load
attachCopyButtons();

// Re-run after Astro view transitions
document.addEventListener("astro:after-swap", attachCopyButtons);
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm astro check
```

- [ ] **Step 3: Commit**

```bash
git add src/scripts/code-copy.ts
git commit -m "perf(mobile): extract code copy buttons to external module"
```

---

### Task M2.5: Refactor post detail page — remove inline script, add CSS progress + external scripts

**Files:**
- Modify: `src/pages/posts/[...slug]/index.astro`

This is the biggest change. We need to:
1. Remove the large `is:inline data-astro-rerun` script block
2. Add static HTML for the CSS progress bar
3. Add `<script>` imports for heading-links and code-copy
4. Keep the `astro:after-swap` scroll reset
5. Add `content-visibility` on the Giscus wrapper

- [ ] **Step 1: Read the current file**

Read `src/pages/posts/[...slug]/index.astro` fully to confirm current state. The file was last read at the start of this session — re-read to capture any changes.

- [ ] **Step 2: Add progress bar HTML after `<PostLayout>` opening tag**

After the `<PostLayout ...>` opening tag (around line 98), add the progress bar containers:

```astro
<PostLayout
  title={`${title} | ${config.site.title}`}
  description={description}
  ogImage={ogImage}
  canonicalURL={canonicalURL}
  pubDatetime={pubDatetime}
  modDatetime={modDatetime}
>
  <!-- Scroll progress bar (CSS-driven; hidden on browsers without @supports) -->
  <div class="progress-container">
    <div class="progress-bar"></div>
  </div>

  <Header />
  ...
```

- [ ] **Step 3: Replace the large inline script**

Remove the entire `<script is:inline data-astro-rerun>` block (lines 172-273 in the current file — the block containing `createProgressBar`, `updateScrollProgress`, `addHeadingLinks`, `attachCopyButtons`).

Replace it with:

```astro
<script>
  import "@/scripts/heading-links";
</script>

<script>
  import "@/scripts/code-copy";
</script>

<script is:inline>
  document.addEventListener("astro:after-swap", () =>
    window.scrollTo({ left: 0, top: 0, behavior: "instant" })
  );
</script>
```

- [ ] **Step 4: Add content-visibility to Giscus wrapper**

Find the `<Giscus />` component usage (around line 163) and wrap it:

```astro
<div style="content-visibility: auto; contain-intrinsic-size: auto 500px">
  <Giscus />
</div>
```

- [ ] **Step 5: Verify build and test**

```bash
pnpm build
```

Start preview:

```bash
pnpm preview
```

Open a post page in the browser. Verify:
- Scroll progress bar appears at the top (if browser supports `animation-timeline`)
- Heading anchor links (`#`) appear on hover/focus
- Code copy buttons appear on code blocks
- Copy button actually copies code to clipboard
- Comments section (Giscus) loads when scrolled into view

- [ ] **Step 6: Commit**

```bash
git add src/pages/posts/[...slug]/index.astro
git commit -m "perf(mobile): replace inline post script with CSS progress bar + external JS modules"
```

---

### Task M2.6: Add IntersectionObserver to Giscus

**Files:**
- Modify: `src/components/Giscus.astro`

- [ ] **Step 1: Read the current file**

Read `src/components/Giscus.astro` to confirm current state.

- [ ] **Step 2: Wrap script injection in IntersectionObserver**

The current inline IIFE in Giscus.astro (lines 8-79) immediately injects the Giscus script. We need to wrap the injection in an observer while keeping the container detection and theme sync logic.

Replace the existing `<script is:inline data-astro-rerun>` block with:

```astro
<script is:inline data-astro-rerun>
  (() => {
    const container = document.currentScript?.parentElement;
    if (!container) return;

    const GISCUS_ORIGIN = "https://giscus.app";

    const getSiteTheme = () => {
      const activeTheme = document.documentElement.dataset.theme;
      if (activeTheme === "dark" || activeTheme === "light") {
        return activeTheme;
      }
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme === "dark" || storedTheme === "light") {
        return storedTheme;
      }
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    };

    const getGiscusTheme = () =>
      getSiteTheme() === "dark" ? "noborder_dark" : "noborder_light";

    const updateGiscusTheme = () => {
      const iframe = container.querySelector("iframe.giscus-frame");
      if (!iframe?.contentWindow) return;
      iframe.contentWindow.postMessage(
        { giscus: { setConfig: { theme: getGiscusTheme() } } },
        GISCUS_ORIGIN
      );
    };

    const injectGiscus = () => {
      container
        .querySelectorAll("script[data-giscus-script], iframe.giscus-frame")
        .forEach(element => element.remove());
      container.__giscusThemeObserver?.disconnect();

      const script = document.createElement("script");
      script.src = `${GISCUS_ORIGIN}/client.js`;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.dataset.giscusScript = "";
      script.setAttribute("data-repo", "sayliks/blog-comments");
      script.setAttribute("data-repo-id", "R_kgDOSwxE-A");
      script.setAttribute("data-category", "General");
      script.setAttribute("data-category-id", "DIC_kwDOSwxE-M4C-ett");
      script.setAttribute("data-mapping", "pathname");
      script.setAttribute("data-strict", "1");
      script.setAttribute("data-reactions-enabled", "1");
      script.setAttribute("data-emit-metadata", "0");
      script.setAttribute("data-input-position", "bottom");
      script.setAttribute("data-theme", getGiscusTheme());
      script.setAttribute("data-lang", "zh-CN");
      script.setAttribute("data-loading", "lazy");
      script.addEventListener("load", updateGiscusTheme);

      container.append(script);

      const observer = new MutationObserver(updateGiscusTheme);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
      container.__giscusThemeObserver = observer;

      document.addEventListener(
        "astro:before-swap",
        () => observer.disconnect(),
        { once: true }
      );
    };

    // IntersectionObserver: only load Giscus when comments scroll near viewport.
    // rootMargin: 400px bottom gives a comfortable preload buffer on mobile.
    // Falls back to immediate injection if IntersectionObserver is unavailable.
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            injectGiscus();
            observer.disconnect();
          }
        },
        { rootMargin: "0px 0px 400px 0px" }
      );
      observer.observe(container);
    } else {
      injectGiscus();
    }
  })();
</script>
```

- [ ] **Step 3: Verify build**

```bash
pnpm build
```

- [ ] **Step 4: Test manually**

```bash
pnpm preview
```

Open a post page. Before scrolling to the bottom, open DevTools → Network tab. Verify that `giscus.app/client.js` is NOT loaded.

Scroll to the comments section. Verify that `giscus.app/client.js` loads and Giscus renders.

- [ ] **Step 5: Commit**

```bash
git add src/components/Giscus.astro
git commit -m "perf(mobile): defer Giscus loading with IntersectionObserver (400px rootMargin)"
```

---

### Milestone 2 Verification

- [ ] Re-run Lighthouse (same config as Task 0) against homepage + post detail
- [ ] Compare all metrics against baseline:
  - **LCP** should be < 2.5s (down from ~3.5s)
  - **CLS** should be < 0.1 (down from ~0.15) — image dimensions prevent layout shifts
  - **INP** should be < 100ms — less JS parse/execute
  - **Total JS** should be < 60 KB (excluding Giscus third-party)
- [ ] Save final reports to `docs/superpowers/specs/lighthouse-baseline/m2-*.json`

---

## Post-Implementation

- [ ] Stop the preview server
- [ ] Run final typecheck: `pnpm astro check`
- [ ] Run lint: `pnpm lint`
- [ ] Verify all files committed: `git status`

---

## Rollback

Each task is in its own commit. To revert a specific change:

```bash
git revert <commit-hash>
```

To roll back the entire optimization:

```bash
# Find the first perf(mobile) commit and revert the range
git log --oneline | grep "perf(mobile)"
git revert <first-commit>..<last-commit>
```
