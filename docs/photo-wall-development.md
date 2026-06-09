# Photo Wall Maintenance Notes

## Current Shape

The photo wall is implemented as a static Astro page exposed from the main
header navigation. The nav item sits between `动态` and `关于`.

## User-Facing Behavior

- Header navigation order is: 文章, 动态, 照片墙, 关于, then the existing icon actions.
- The item is a normal text navigation link so it matches the current posts/tags/about behavior on desktop and mobile.
- The photo wall route is `/photo-wall/`.
- The page title is localized through the existing i18n system.
- The page shows a responsive wall of photos with visible captions.
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
`photo-wall/window-light.svg`, or an external `https` image URL whose hostname
is listed in `photoWall.allowedExternalHosts` inside
`astro-paper.config.ts`. Local images are passed through the project base-path
helper at build time; approved external URLs are left unchanged. The `order`
field controls the final display order.

Current production photo wall data uses `tg.matsumae.top`, which is explicitly
allowed in the root config. Add new external image hosts there before publishing
CMS entries that reference them.

```ts
photoWall: {
  allowedExternalHosts: ["tg.matsumae.top"],
}
```

Hosts are matched exactly after lowercasing, so `tg.matsumae.top` does not
automatically allow arbitrary subdomains. Add new hosts deliberately and verify
them before publishing.

Current published entries are stored in `src/data/photoWall.json`; local
repository images and approved external `https://` images both use the same data
shape.

## Production Asset Guidelines

- Use web-ready images rather than original camera files.
- Recommended dimensions: about `1200px` on the long edge for landscape/square images and about `1125-1400px` on the long edge for portrait images.
- Preferred formats: `webp` or `avif` for photos, with `jpg` acceptable when compatibility or source tooling requires it. Keep SVG only for placeholders or simple illustrations.
- Target maximum file size: roughly `250 KB` per image after compression; smaller is better when visual quality holds.
- File names should be lowercase kebab-case, descriptive, and stable, for example `rain-walk.webp`.
- Compress and strip unnecessary metadata before adding files to the repository.
- To replace or add photos, upload/place new files in `public/photo-wall/` or
  paste an approved external URL, then update `src`, `title`, `alt`, `width`,
  `height`, `order`, and `published` in Sveltia CMS before running the
  validation commands below.
- For external images, use only approved `https://` hosts and keep width/height
  values aligned with the real rendered asset.
- Prefer the existing approved host or local repository assets over one-off
  third-party URLs.

## Routing and Layout

Implemented page:

- `src/pages/photo-wall.astro`

The page should follow the existing page composition:

1. `Layout`
2. `Header`
3. `Breadcrumb`
4. `Main`
5. `Footer`

This preserves metadata, theme behavior, skip links, breadcrumb behavior, and
the current app width.

## i18n Notes

The photo wall strings live in:

- `src/i18n/types.ts`
- `src/i18n/lang/zh-CN.ts`

`src/i18n/lang/en.ts` currently re-exports `zh-CN`, so no separate English string file is needed unless a real English locale is added later.

The page copy keys are:

- `pages.photoWallTitle`
- `pages.photoWallDesc`

## Breadcrumb Notes

`photo-wall` is mapped in `src/components/Breadcrumb.astro` so the page displays
a localized label instead of the raw slug.

## Header Notes

Current `src/components/Header.astro` behavior:

- The photo wall nav item sits after moments and before about.
- Use `getRelativeLocaleUrl(locale, "photo-wall")`.
- Apply `active-nav` with `isActive("/photo-wall")`.
- Keep the same `li` and anchor classes already used by text nav items.

## Visual Direction

The existing site is quiet, text-first, and minimal. The photo wall should feel warmer while still fitting the theme:

- Compact responsive CSS Grid.
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

After changing photo wall content, config, or rendering:

1. Run `pnpm astro check`.
2. Run `pnpm lint`.
3. Run `pnpm test` when changing validation or data-shape code.
4. Request `/photo-wall/` from the running dev server.
5. Request the home page and confirm the header still renders.
6. Confirm the nav order is correct and `/photo-wall/` receives the active underline.
7. If using external images, confirm every host is present in
   `photoWall.allowedExternalHosts` and every image request returns 200 over
   HTTPS.

## Deferred Extensions

- Move photo entries into an Astro content collection only if captions become long-form.
- Keep the current static grid model unless a separate scoped task explicitly
  asks for new interaction features.
- Add responsive image variants when local image processing is introduced.
