# sayliks corner

sayliks corner 是我的个人博客和小小的网络角落，用来记录学习笔记、项目过程、阅读、音乐以及日常的想法。

站点刻意保持简单：页面加载快、排版干净、克制的深色主题搭配暖橙色点缀，并提供搜索、RSS 和评论。它基于 [AstroPaper](https://github.com/satnaing/astro-paper) 构建，但本仓库是作为个人发布空间维护的，而不是一个可复用的主题模板。

## 这个站点用来做什么

- 记录关于软件工程、项目，以及那些我正在慢慢搞懂的事情的笔记。
- 公开存档随笔、碎片、兴趣和个人近况。
- 用一套既能从本地文件、也能从网页 CMS 发布的工作流来写作。
- 保持安静的阅读体验：最小化的 UI 和有限的点缀色。

## 功能特性

- **文章（posts）** — 主博客，支持 Markdown / MDX、标签、精选、计划发布、上一篇/下一篇导航。
- **日常（moments）** — 轻量的"碎碎念"动态流，支持图片、心情、位置和置顶，标题与摘要自动派生。
- **照片墙（photo wall）** — 由 `src/data/photoWall.json` 驱动的静态相册，外链图片域名由配置 allowlist 约束，无需客户端 JavaScript。
- **一言（hitokoto）** — 首页每日一句，按本地日期在 `localStorage` 缓存；缓存未命中时空闲加载，失败时回退到内置句子。
- **标签与归档** — 按标签分类浏览，以及按时间分组的归档页。
- **静态搜索** — 基于 Pagefind，在构建时生成索引。
- **RSS** — 文章 (`/rss.xml`) 与日常 (`/moments/rss.xml`) 各有独立订阅源。
- **评论** — 基于 Giscus（GitHub Discussions），随站点深浅色主题切换，滚动到视口附近时才懒加载。
- **动态 OG 图片** — 没有显式 `ogImage` 的文章会用 Satori + Sharp 自动生成社交分享图。
- **深浅色模式** — 由 `<html>` 上的 `data-theme` 驱动，首屏前内联脚本设定，避免闪烁。
- **视图过渡** — 使用 Astro `ClientRouter` 实现近似 SPA 的导航体验。
- **国际化** — 以中文（`zh-CN`）为默认语言。

## 内容管理

博客文章位于：

```txt
src/content/posts/
```

日常动态位于：

```txt
src/content/moments/
```

独立页面位于：

```txt
src/content/pages/
```

关于页面是：

```txt
src/content/pages/about.md
```

> 集合的 Schema 统一定义在 `src/content.config.ts` 中。修改 Schema 后需运行 `pnpm sync` 重新生成类型。
>
> 以下划线 `_` 开头的文件或目录会被内容加载器忽略，不会成为正式内容。
>
> 子目录会成为 URL 片段：`posts/examples/foo.md` 对应 `/posts/examples/foo`。

可以通过 Sveltia CMS 在网页端创建根目录下的 Markdown 文章：

```txt
/cms/
```

`/admin/` 路由是一个带登录说明的着陆页，链接到 `/cms/`。

进阶的 `.mdx` 文章以及嵌套路径的文章仍然手动编辑，以保证既有 URL（及其对应的 Giscus 评论线程）保持稳定。

## CMS 与 GitHub 登录

Sveltia CMS 以静态文件形式部署在 `/cms/`，运行时 bundle 自托管于 `public/cms/sveltia-cms.js`，Schema 为 `public/cms/config.yml`。GitHub OAuth 由 `api/cms-auth/` 下的 Vercel Functions 处理（`auth.js`、`callback.js`，核心逻辑在 `src/server/cmsAuth.js`），并保留访问令牌（token）登录作为备选方案。

要启用生产环境的 OAuth 登录，先创建一个 GitHub OAuth App：

- Homepage URL：`https://www.matsumae.top`
- Authorization callback URL：`https://www.matsumae.top/api/cms-auth/callback`

然后在 Vercel 设置以下环境变量（可参考 `.env.example`）：

```txt
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
ALLOWED_DOMAINS=www.matsumae.top,matsumae.top
```

## 本地开发

本项目使用 `pnpm`，要求 Node `>=24.0.0 <25`。

```bash
pnpm install
pnpm dev
```

本地开发服务器运行在：

```txt
http://localhost:5173/
```

> 开发模式下会显示草稿和计划发布的文章 / 日常；生产构建则会隐藏它们。

## 命令

- `pnpm dev` — 启动本地开发服务器
- `pnpm build` — 类型检查、构建，并在 `dist/pagefind/` 生成 Pagefind 搜索索引
- `pnpm preview` — 本地预览生产构建结果
- `pnpm astro check` — 运行 Astro 类型检查
- `pnpm lint` — 运行 ESLint
- `pnpm format` — 用 Prettier 格式化整个项目
- `pnpm sync` — 重新生成 Astro 内容 / 模块类型
- `pnpm test` — 运行单元测试（`node:test`）

运行单个测试文件：

```bash
node --experimental-strip-types --test tests/moments.test.ts
```

## 配置

站点配置采用三层结构，**通常只需编辑第一层**：

1. `astro-paper.config.ts`（仓库根目录）— 唯一面向用户的配置，包含站点信息、每页文章数、功能开关、社交链接、分享链接。
2. `src/types/config.ts` — Schema 与类型定义，仅在新增配置项时编辑。
3. `src/config.ts` — 应用默认值并导出最终配置，代码中一律从这里 `import config from "@/config"`，**不要直接改它**。

## 测试与 CI

测试使用原生 `node:test` + `node:assert/strict`，覆盖 `src/utils/` 与 `src/scripts/` 中不依赖框架的纯逻辑模块（日常、照片墙、发布过滤、一言缓存）。需要单元测试的逻辑都抽离到无 `astro:*` 导入的 `.ts` 辅助模块中，对应的 `.astro` 路由只做轻量消费——这样测试套件可在裸 Node 下运行。

GitHub Actions（`.github/workflows/ci.yml`）会在每个 Pull Request 上依次执行类型检查、Lint、格式检查、测试与构建。

## 技术栈

- [Astro](https://astro.build/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)（v4，通过 `@tailwindcss/vite`，无配置文件）
- [Pagefind](https://pagefind.app/) — 静态搜索
- [Sveltia CMS](https://sveltiacms.app/) — 网页端文章管理
- [Giscus](https://giscus.app/) — 评论
- [Satori](https://github.com/vercel/satori) + [Sharp](https://sharp.pixelplumbing.com/) — 动态 Open Graph 图片
- [Shiki](https://shiki.style/) — 代码高亮

## 部署

站点部署在 **Vercel**（`astro-paper.config.ts` 中的 `site.url` 为站点地址，OAuth 通过 Vercel Functions 实现）。

仓库同时提供容器化方式：

- `Dockerfile` — 多阶段构建，用 Node 24 构建静态产物，再由 Nginx 提供服务。
- `compose.yaml` — 用于本地容器化开发（端口 `5173`）。

## 项目说明

- 站点级设置统一在 `astro-paper.config.ts` 中管理。
- 内容集合的 Schema 定义在 `src/content.config.ts`。
- `dist/pagefind/` 中的搜索文件是构建产物，不应手动编辑。
- 动态 OG 图片由 `src/pages/og.png.ts` 和 `src/pages/posts/[...slug]/index.png.ts` 这两个路由生成。
- 更多面向开发者的架构说明见 `CLAUDE.md`、`AGENTS.md`，以及 `docs/` 目录下的功能开发笔记。

## 致谢

本站基于 [Sat Naing](https://satnaing.dev) 的 [AstroPaper](https://github.com/satnaing/astro-paper)，并针对 sayliks corner 做了本地化定制。

## 许可证

MIT License. Copyright (c) 2026 sayliks.
