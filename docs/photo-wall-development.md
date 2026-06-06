# Photo Wall Development Plan

## Goal

Add a photo wall feature to AstroPaper and expose it from the main header navigation. The new navigation item should sit immediately to the right of the existing "标签" item and link to a dedicated photo wall page.

## User-Facing Behavior

- Header navigation order becomes: 内容, 标签, 照片墙, 关于, then the existing icon actions.
- The new item is a normal text navigation link so it matches the current posts/tags/about behavior on desktop and mobile.
- The photo wall route is `/photo-wall/`.
- The page title is localized through the existing i18n system.
- The page shows a responsive wall of photos with short captions and optional metadata.
- The page works without client-side JavaScript.

## Content Model

Photo wall entries are managed through Sveltia CMS as a file collection.

Data file:

- `src/data/photoWall.json`

Image upload folder:

- repository path: `public/photo-wall/`
- public URL prefix: `/photo-wall/`

Item shape:

```ts
type PhotoWallItem = {
  src: string;
  title: string;
  alt: string;
  width: number;
  height: number;
  order: number;
  published: boolean;
};
```

`src` may be either a local repository image, such as
`photo-wall/window-light.svg`, or an external `https://` image URL. Local
images are passed through the project base-path helper at build time; external
URLs are left unchanged.

The six initial placeholder images remain under `public/photo-wall/` and have
been migrated into `src/data/photoWall.json`.

## Production Asset Guidelines

- Use web-ready images rather than original camera files.
- Recommended dimensions: about `1200px` on the long edge for landscape/square images and about `1125-1400px` on the long edge for portrait images.
- Preferred formats: `webp` or `avif` for photos, with `jpg` acceptable when compatibility or source tooling requires it. Keep SVG only for placeholders or simple illustrations.
- Target maximum file size: roughly `250 KB` per image after compression; smaller is better when visual quality holds.
- File names should be lowercase kebab-case, descriptive, and stable, for example `rain-walk.webp`.
- Compress and strip unnecessary metadata before adding files to the repository.
- To replace placeholders, upload or place new files in `public/photo-wall/`,
  update `src`, `title`, `alt`, `width`, `height`, `order`, and `published` in
  Sveltia CMS, then run the validation commands below.

## Routing and Layout

Planned page:

- `src/pages/photo-wall.astro`

The page should follow the existing page composition:

1. `Layout`
2. `Header`
3. `Breadcrumb`
4. `Main`
5. `Footer`

This preserves metadata, theme behavior, skip links, breadcrumb behavior, and the current app width.

## i18n Updates

Add a `photoWall` key in:

- `src/i18n/types.ts`
- `src/i18n/lang/zh-CN.ts`

`src/i18n/lang/en.ts` currently re-exports `zh-CN`, so no separate English string file is needed unless a real English locale is added later.

Add page copy keys for:

- `pages.photoWallTitle`
- `pages.photoWallDesc`

## Breadcrumb Updates

Add `photo-wall` to the breadcrumb label map in `src/components/Breadcrumb.astro` so the page displays a localized label instead of the raw slug.

## Header Updates

Update `src/components/Header.astro`:

- Insert the new nav item immediately after the tags item.
- Use `getRelativeLocaleUrl(locale, "photo-wall")`.
- Apply `active-nav` with `isActive("/photo-wall")`.
- Keep the same `li` and anchor classes already used by text nav items.

## Visual Direction

The existing site is quiet, text-first, and minimal. The photo wall should feel warmer while still fitting the theme:

- Compact masonry-inspired grid using CSS columns or responsive grid.
- Slight variation by orientation, but no heavy decorative frame.
- Rounded corners should stay restrained.
- Captions should be readable and not overlap images.
- Dark mode should inherit existing theme tokens.

## Accessibility

- Every image must have meaningful `alt` text.
- Captions should be visible text, not only hover text.
- The page should remain readable with reduced motion.
- The nav item must be keyboard reachable like the existing text nav links.

## Verification

After implementation:

1. Run `pnpm astro check`.
2. Run `pnpm lint`.
3. Request `/photo-wall/` from the running dev server.
4. Request the home page and confirm the header still renders.
5. Confirm the nav order is correct and `/photo-wall/` receives the active underline.

## Future Extensions

- Move photo entries into an Astro content collection only if captions become long-form.
- Add tag or year filtering once the photo count grows.
- Replace placeholder assets with real personal photos.
