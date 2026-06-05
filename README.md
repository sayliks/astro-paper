# sayliks corner

sayliks corner is my personal blog and small web corner for learning notes, project records, reading, music, and everyday thoughts.

The site is intentionally simple: fast pages, clean typography, a restrained dark theme, warm orange accents, search, RSS, and comments. It is built on AstroPaper, but this repository is maintained as a personal publishing space rather than a reusable theme template.

## What This Site Is For

- Writing notes about software engineering, projects, and things I am slowly figuring out.
- Keeping a public archive of essays, fragments, interests, and personal updates.
- Publishing with a workflow that works both from local files and from the web CMS.
- Preserving a quiet reading experience with minimal UI and limited accent color.

## Content

Blog posts live in:

```txt
src/content/posts/
```

Pages live in:

```txt
src/content/pages/
```

The About page is:

```txt
src/content/pages/about.md
```

Root-level Markdown posts can be created through Decap CMS at:

```txt
/cms/
```

The `/admin/` route is only a static shortcut to `/cms/`.

Advanced `.mdx` posts and nested post paths are still edited manually so existing URLs stay stable for Giscus comments.

## CMS GitHub Login

Sveltia CMS is served at `/cms/`. GitHub OAuth is handled by Vercel Functions under `/api/cms-auth/`, with access-token login kept as a fallback.

For production OAuth login, create a GitHub OAuth App with:

- Homepage URL: `https://www.matsumae.top`
- Authorization callback URL: `https://www.matsumae.top/api/cms-auth/callback`

Then set these Vercel environment variables:

```txt
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
ALLOWED_DOMAINS=www.matsumae.top,matsumae.top
```

## Local Development

This project uses `pnpm` and expects Node `>=22.12.0 <24`.

```bash
pnpm install
pnpm dev
```

The local dev server runs at:

```txt
http://localhost:5173/
```

## Commands

| Command            | Action                                                                        |
| ------------------ | ----------------------------------------------------------------------------- |
| `pnpm dev`         | Start the local dev server                                                    |
| `pnpm astro check` | Run Astro type checking                                                       |
| `pnpm build`       | Type-check, build, and generate the Pagefind search index in `dist/pagefind/` |
| `pnpm preview`     | Preview the production build locally                                          |
| `pnpm lint`        | Run ESLint                                                                    |
| `pnpm format`      | Format the project with Prettier                                              |
| `pnpm sync`        | Regenerate Astro content/module types                                         |

## Tech Stack

- [Astro](https://astro.build/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Pagefind](https://pagefind.app/) for static search
- [Decap CMS](https://decapcms.org/) for web-based post creation
- [Giscus](https://giscus.app/) for comments
- [Satori](https://github.com/vercel/satori) and [Sharp](https://sharp.pixelplumbing.com/) for dynamic Open Graph images

## Project Notes

- Site-level settings are managed in `astro-paper.config.ts`.
- Content schemas are defined in `src/content.config.ts`.
- Generated search files in `dist/pagefind/` are build output and should not be edited by hand.
- Dynamic OG images are generated from the routes under `src/pages/og.png.ts` and `src/pages/posts/[...slug]/index.png.ts`.

## Acknowledgements

This site is based on [AstroPaper](https://github.com/satnaing/astro-paper) by [Sat Naing](https://satnaing.dev), with local customization for sayliks corner.

## License

MIT License. Copyright (c) 2026 sayliks.
