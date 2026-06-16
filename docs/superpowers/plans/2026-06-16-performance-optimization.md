# Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimize AstroPaper fork performance across build speed, font loading, and page load.

**Architecture:** Three independent optimization tasks that can be implemented in any order. Image optimization is no longer needed since the about-banner.gif is now hosted externally.

**Tech Stack:** Astro v6, Sharp, Pagefind, Google Fonts

---

## Task 1: Build Speed Optimization

**Files:**
- Modify: `package.json` (scripts section)

- [ ] **Step 1: Update package.json scripts**

Current `build` script runs `astro check` before `astro build`, adding ~1s. Separate them for faster builds.

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build && pagefind --site dist",
    "build:full": "astro check && astro build && pagefind --site dist",
    "check": "astro check",
    "preview": "astro preview",
    "sync": "astro sync",
    "astro": "astro",
    "format:check": "prettier --check .",
    "format": "prettier --write .",
    "lint": "eslint .",
    "test": "node --experimental-strip-types --test tests/cms-auth.test.ts tests/hitokoto-cache.test.ts tests/moments.test.ts tests/og-font.test.ts tests/og-image-frame.test.ts tests/photo-wall.test.ts tests/publication.test.ts tests/recent-feed.test.ts tests/rehype-image-optimize.test.ts tests/search.test.ts"
  }
}
```

- [ ] **Step 2: Verify build works**

Run: `pnpm build`
Expected: Build completes in ~2.7s (saved ~1s from skipping astro check)

- [ ] **Step 3: Verify full build still works**

Run: `pnpm build:full`
Expected: Build completes with type checking (~3.7s)

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "perf(build): separate astro check from build script"
```

---

## Task 2: Font Loading Verification

**Files:**
- Read: `astro.config.ts` (fonts section)
- Read: `src/layouts/Layout.astro` (Font preload section)
- Read: `src/utils/ogFont.ts` (OG font loading)

- [ ] **Step 1: Verify current font configuration**

Check that:
1. Main font (`--font-google-sans-code`) is preloaded with correct weights
2. OG font (`--font-google-sans-code-og`) is NOT preloaded (only used for OG images)
3. Serif font (`--font-noto-serif-sc`) is preloaded for Chinese content

```bash
grep -n "preload" src/layouts/Layout.astro
```

Expected: Only `--font-google-sans-code` and `--font-noto-serif-sc` are preloaded

- [ ] **Step 2: Verify OG font is not preloaded**

Check that OG font registration doesn't include preload:

```bash
grep -A 10 "font-google-sans-code-og" astro.config.ts
```

Expected: No preload configuration for OG font

- [ ] **Step 3: Document findings**

If OG font is preloaded unnecessarily, note it for optimization. If already optimal, no changes needed.

- [ ] **Step 4: Commit (if changes made)**

```bash
git add astro.config.ts src/layouts/Layout.astro
git commit -m "perf(font): optimize font preload configuration"
```

---

## Task 3: Page Load Analysis

**Files:**
- Read: `dist/ui-core.Cjod3Orn.js` (main JS bundle)
- Read: `dist/Footer.B5kTx0cQ.css` (main CSS)

- [ ] **Step 1: Analyze JS bundle size**

Check the main JS bundle for unused code:

```bash
wc -c dist/ui-core.Cjod3Orn.js
head -50 dist/ui-core.Cjod3Orn.js
```

Expected: 92KB bundle, check for obvious unused imports

- [ ] **Step 2: Analyze CSS bundle size**

Check the main CSS for redundant styles:

```bash
wc -c dist/Footer.B5kTx0cQ.css
head -100 dist/Footer.B5kTx0cQ.css
```

Expected: 68KB CSS, check for duplicate or unused styles

- [ ] **Step 3: Check for code splitting opportunities**

Verify that lazy-loaded components (search, Giscus) are properly code-split:

```bash
ls -lh dist/*.js | sort -k5 -h
```

Expected: Separate chunks for search and Giscus

- [ ] **Step 4: Document findings**

Note any optimization opportunities found. If no significant issues, document that current optimization is adequate.

---

## Verification

After all tasks:

1. `pnpm build` succeeds (~2.7s)
2. `pnpm dev` works correctly
3. `pnpm build:full` succeeds with type checking (~3.7s)
4. All pages render correctly
5. Font loading works (no FOUC)
6. OG images generate correctly

## Expected Results

| Metric | Before | After | Savings |
|--------|--------|-------|---------|
| Build time (pnpm build) | ~3.7s | ~2.7s | ~1s |
| Type checking | Included | Separate command | On-demand |
| Font preloading | Optimal | Verified | - |
| JS/CSS bundles | 92KB + 68KB | Analyzed | TBD |
