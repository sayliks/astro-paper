# Performance Optimization Design

## Context

AstroPaper v6.0.0 fork (sayliks/astro-paper) needs comprehensive performance optimization. Current baseline:
- Build time: ~3.7s
- Dist size: 16MB
- Main JS bundle: 92KB
- Footer CSS: 68KB
- about-banner.gif: 814KB (45-frame animated GIF)
- Font (woff2): 62KB

## Optimization Areas

### 1. Image Optimization (Priority: HIGH)

**Problem**: `about-banner.gif` is 814KB for a small decorative element.

**Solution**: Convert GIF to WebP animation.

**Steps**:
1. Use Sharp or cwebp to convert `public/assets/about-banner.gif` → `public/assets/about-banner.webp`
2. Update `src/content/pages/about.md` to reference `.webp` file
3. Delete original `.gif` file

**Expected savings**: ~600KB (75% reduction)

**Implementation**:
```bash
# Convert GIF to WebP animation
cwebp -q 80 public/assets/about-banner.gif -o public/assets/about-banner.webp
# Or use Sharp in a Node script
```

### 2. Font Optimization (Priority: MEDIUM)

**Problem**: Google Sans Code registered twice (woff + woff2). OG font uses separate registration because Satori requires woff format.

**Solution**: Keep OG font registration (required for Satori), but optimize font loading.

**Steps**:
1. Verify OG font files are not preloaded unnecessarily
2. Ensure main font preloading is optimal
3. Consider font-display: swap for better perceived performance

**Note**: OG font registration cannot be removed because Satori requires woff format while the web app uses woff2. The two registrations serve different purposes.

**Expected savings**: Minimal, mainly ensuring optimal preload configuration

### 3. Build Speed Optimization (Priority: MEDIUM)

**Problem**: `pnpm build` runs `astro check` before `astro build`, adding ~1s.

**Solution**: Separate check and build scripts.

**Steps**:
1. Update `package.json` scripts:
   - `"build": "astro build && pagefind --site dist"` — build only
   - `"check": "astro check"` — type check only
   - `"build:full": "astro check && astro build && pagefind --site dist"` — full pipeline
2. Update CI to run `check` and `build` in parallel if desired

**Expected savings**: ~1s for `pnpm build`

### 4. Page Load Optimization (Priority: LOW)

**Problem**: JS bundle 92KB, CSS 68KB.

**Solution**: Analyze and optimize.

**Steps**:
1. Analyze `ui-core.Cjod3Orn.js` (92KB) for unused code
2. Check `Footer.B5kTx0cQ.css` (68KB) for redundant styles
3. Verify critical resource preloading

**Expected savings**: TBD after analysis

## Implementation Order

1. Image optimization (highest ROI)
2. Build speed optimization (quick win)
3. Font optimization (medium effort)
4. Page load analysis (requires investigation)

## Verification

1. `pnpm build` succeeds
2. `pnpm dev` works correctly
3. Image displays correctly (WebP animation)
4. OG images still generate correctly
5. Build time reduced
6. Dist size reduced

## Files to Modify

- `public/assets/about-banner.gif` → `.webp`
- `src/content/pages/about.md` — update image reference
- `package.json` — update scripts
- `astro.config.ts` — remove OG font registration
- `src/utils/ogFont.ts` — read font files directly
