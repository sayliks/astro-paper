# 优化点记录（2026-06-09）

本文件记录本次代码阅读中发现的后续优化方向。当前项目整体状态已经比较稳：静态构建、内容校验、CMS、RSS、评论、搜索、动态和照片墙都有基础防护与测试覆盖。下面的建议不要求一次性完成，适合作为长期维护清单，按影响面逐项推进。

本文件作为后续维护路线图使用。当前工作树已有部分优化实现，见“已完成的小优化记录”；建议清单只保留仍需要继续推进或补强的事项。

## 优先级说明

- **P1**：建议近期处理，能降低真实维护风险或明显改善性能。
- **P2**：适合在相关功能迭代时顺手处理。
- **P3**：体验或工程细节优化，可以排入长期维护。

## 已完成的小优化记录

这些点已经在当前代码中存在，后续修改相关文件时应保留：

| 方向 | 涉及位置 | 当前状态 |
| --- | --- | --- |
| 首页聚合候选收敛 | `src/pages/index.astro` | 首页先将文章候选和动态候选分别限制到 `posts.perIndex`，再合并排序，避免为最终不会展示的条目做额外映射与排序。 |
| 动态首图优先级 | `src/components/moments/MomentImages.astro`, `src/components/moments/MomentCard.astro`, `src/pages/moments/[slug]/index.astro` | `MomentImages` 支持 `priorityFirstImage`，首张可见图片跳过懒加载并设置 `fetchpriority="high"`，后续图片继续按需懒加载。 |
| 照片墙首图优先级 | `src/pages/photo-wall.astro` | 第一张照片墙图片设置 `fetchpriority="high"`，其余图片保留现有加载策略和稳定尺寸。 |
| 照片墙外链域名 allowlist | `astro-paper.config.ts`, `src/types/config.ts`, `src/config.ts`, `src/utils/photoWall.ts`, `tests/photo-wall.test.ts` | `photoWall.allowedExternalHosts` 已接入配置解析、照片墙读取和测试，当前生产配置只允许 `tg.matsumae.top` 作为外部照片域名。 |
| 照片墙外链 URL 严格校验 | `src/utils/photoWall.ts`, `tests/photo-wall.test.ts` | 外链照片必须使用显式 `https://` URL；`http://`、协议相对 URL 和 malformed `https:` 形态会转成稳定的照片墙校验错误。 |
| 动态 OG 字体缓存 | `src/utils/ogFont.ts`, `src/pages/og.png.ts`, `src/pages/posts/[...slug]/index.png.ts` | OG 字体读取已抽到 `getOgSatoriFonts()`，并用模块级 cache 复用同一字体 URL 的 `ArrayBuffer` promise，减少多张 OG 图构建时的重复字体读取。 |
| 动态 OG 缓存失败恢复 | `src/utils/ogFont.ts` | 字体 fetch promise 失败后会删除对应 cache key，避免一次瞬时失败污染后续 OG 生成请求。 |
| 移动端点按与主题色更新优化 | `src/scripts/header-menu.ts`, `src/scripts/theme.ts`, `src/styles/global.css` | 菜单和主题按钮已增加触屏 `pointerup` 直连处理，减少移动端点击延迟；粗指针设备禁用 View Transition 动画；主题色更新改为 rAF 调度。 |
| 一言请求空闲调度 | `src/scripts/hitokoto.ts` | 首页一言在没有同日缓存时改为 `requestIdleCallback` 或短 timeout 后再请求，并为 idle callback 设置 2 秒超时；取消调度时也会做能力检测，避免部分运行时缺少 `cancelIdleCallback` 时抛错。 |
| 内容查询复用 | `src/utils/contentQueries.ts`, `src/pages/**` | 已发布文章、动态和标签通过共享 helper 获取；生产构建复用模块级 promise，开发模式保持不缓存，避免内容编辑后需要重启 dev server。 |

## 建议清单

| 优先级 | 方向 | 涉及位置 | 建议 |
| --- | --- | --- | --- |
| P1 | CMS OAuth 权限最小化 | `src/server/cmsAuth.js`, `public/cms/config.yml` | 当前 GitHub OAuth 请求使用 `scope: "repo"`。如果仓库保持公开，可以评估是否能改为更窄的公开仓库权限，或在文档中明确为什么需要完整 repo 权限。 |
| P1 | CMS 运行时版本维护 | `public/cms/sveltia-cms.js`, `public/cms/index.html` | Sveltia CMS 已自托管，减少 CDN 运行时依赖。建议建立升级流程：记录来源版本、升级前后运行 CMS 登录/编辑/删除/上传验证，并关注上游安全更新。 |
| P1 | 内容 slug 唯一性约束 | `public/cms/config.yml`, `src/content/moments/*.md`, `tests/moments.test.ts` | 动态内容已经出现过重复 `slug` 风险。建议让 CMS 提示更明确，或增加测试/脚本检查 moments slug 是否重复，避免 Astro 内容层覆盖条目。 |
| P1 | 本地图片响应式派生图 | `public/cms/config.yml`, `src/components/moments/MomentImages.astro`, `src/pages/photo-wall.astro`, `src/data/photoWall.json` | 动态和照片墙本地图片目前主要从 `public/` 原样输出，并依赖手动填写宽高。建议规划上传或构建期 resize/srcset 流程，生成更小的 WebP/AVIF 派生图，同时继续保留准确 `width`、`height` 以维持布局稳定。 |
| P2 | 搜索脚本生命周期 | `src/pages/search.astro` | Pagefind 初始化逻辑直接写在页面脚本中。后续可抽到 `src/scripts/search.ts`，集中处理 View Transitions、事件解绑和类型声明，降低页面文件复杂度。 |
| P2 | 外链图片尺寸与格式约束 | `public/cms/config.yml`, `src/utils/photoWall.ts` | CMS 已要求填写宽高，但无法保证外部图片真实尺寸、格式和体积。可以补充一份编辑规范，或增加构建期检查脚本，提醒过大的外链图片。 |
| P2 | 文章图片自动优化边界 | `src/utils/transformers/rehypeImageOptimize.ts` | Markdown 图片会自动加 `loading`、`decoding`、`sizes` 和首图优先级。可以补测试覆盖这个 transformer，避免以后改 Markdown 管线时破坏图片加载策略。 |
| P2 | Markdown 图片响应式变体 | `src/utils/transformers/rehypeImageOptimize.ts`, `src/content/posts/*.md` | 当前 transformer 主要补加载属性，不生成变体。后续可以只针对本地图片接入 Astro 图片管线或构建脚本，输出响应式 `srcset`；外链图片则继续要求作者上传前压缩。 |
| P2 | RSS 输出一致性 | `src/pages/rss.xml.ts`, `src/pages/moments/rss.xml.ts` | 文章与动态 RSS 都输出全文 HTML。建议后续统一 description/content 策略，并确认 RSS 阅读器中图片、代码块、中文摘要的呈现效果。 |
| P2 | 首页聚合数据抽离 | `src/pages/index.astro` | 首页把文章和动态合并排序的逻辑在页面内完成。随着动态/文章增多，可抽成纯函数并补测试，避免首页展示规则散落在模板中。 |
| P2 | 全局客户端脚本拆分 | `src/layouts/Layout.astro`, `src/scripts/navigation-state.ts`, `src/scripts/header-menu.ts`, `src/scripts/theme.ts` | `theme`、`header-menu`、`navigation-state` 目前从基础布局全局加载。主题脚本需要保持全局，但可评估把只在部分页面有意义的逻辑拆分或按需加载，并审计 `ClientRouter` 是否需要默认开启。 |
| P3 | 主题脚本 DOM 查询整理 | `src/scripts/theme.ts` | `reflect()` 会重新查询主题按钮和 `theme-color` meta。后续可在 `setup()`/`astro:after-swap` 周期内刷新缓存引用，减少重复 DOM 查询，同时避免跨页面 View Transitions 使用旧节点。 |
| P3 | 图片占位资源替换计划 | `public/photo-wall/*.svg`, `docs/photo-wall-development.md` | 照片墙仍保留临时 SVG 占位资源。后续替换为真实图片时，建议统一转 WebP/AVIF，记录原始尺寸，并保持 CMS 中宽高准确。 |
| P3 | 主题与评论联动回归检查 | `src/scripts/theme.ts`, `src/components/Giscus.astro` | Giscus 已跟随站点主题。后续改主题按钮或 View Transitions 时，应手动验证评论 iframe 是否同步变色。 |
| P3 | Giscus 占位高度微调 | `src/components/Giscus.astro`, `src/pages/posts/[...slug]/index.astro`, `src/pages/moments/[slug]/index.astro` | 评论已用 IntersectionObserver 懒加载。后续可测量移动端和桌面端实际 iframe 高度，微调 `contain-intrinsic-size`，减少评论区出现时的跳动。 |
| P3 | Hitokoto 配置开关 | `src/components/home/HitokotoCard.astro`, `src/scripts/hitokoto.ts`, `src/types/config.ts` | 一言 cache miss 已改为空闲调度并设置 idle timeout。后续可加入配置开关，方便隐私优先或离线部署直接关闭第三方请求。 |
| P3 | 字体预加载按页面审计 | `astro.config.ts`, `src/layouts/Layout.astro` | Layout 默认预加载浏览器字体，首页已关闭。后续可审计照片墙、CMS、搜索等轻量页面是否也应关闭 `preloadFont`，只在长文详情等文字密集页面保留。 |
| P3 | 构建产物体积观察 | `package.json`, `public/cms/sveltia-cms.js`, `dist/` | 目前没有固定的 bundle/asset 体积报告。可以在需要时添加轻量的构建后检查脚本，记录公共资源体积变化，避免静态资源悄悄膨胀。 |

## 推荐执行顺序

1. **先处理安全与内容可靠性**：CMS 权限、slug 唯一性检查。
2. **再处理高收益资源优化**：照片墙响应式图片管线、CMS runtime 版本维护、Markdown 图片 transformer 测试。
3. **然后处理构建与脚本维护性**：搜索脚本抽离、首页聚合逻辑抽离、动态 OG 模板复用。
4. **最后处理长期体验优化**：RSS 阅读器实测、Giscus 占位高度、Hitokoto 配置开关、字体预加载审计、体积观察脚本。

## 已经值得保留的模式

- `src/components/Giscus.astro` 已经用 IntersectionObserver 延迟加载评论，不应回退为首屏立即加载。
- `src/pages/search.astro` 只在搜索页、并且通过 idle callback 动态导入 Pagefind UI。
- `src/utils/transformers/rehypeImageOptimize.ts` 已统一补充图片加载属性，后续优化应建立在这个 transformer 上。
- 照片墙和动态图片已经有显式宽高、稳定 `aspect-ratio`、懒加载和首图优先级策略。
- 照片墙外链图片已有 `photoWall.allowedExternalHosts` 约束，后续新增外链域名应先更新根配置。
- 动态 OG 字体 buffer 已集中到 `getOgSatoriFonts()`，后续不要在路由内重新手写字体读取逻辑。
- Hitokoto cache miss 已空闲请求，后续优化应补配置开关和 fetch 超时，而不是回退为首屏立即请求。
- 路由应继续通过 `src/utils/contentQueries.ts` 获取已发布文章、动态和标签，不要重新散落 `getCollection()` 调用。
- `Layout.astro` 已支持 `clientRouter`、`preloadFont`、`speedInsights` 按页面关闭，继续优化时优先复用这些开关。

## 每次优化建议的验证集

常规代码变更建议至少运行：

```bash
pnpm astro check
pnpm lint
pnpm run format:check
pnpm test
pnpm build
```

如果涉及 CMS，还应额外验证：

- `/cms/index.html` 能正常加载；
- GitHub 登录或 access token 登录可用；
- 文章、动态、照片墙的新增、编辑、删除与上传流程可用；
- CMS 生成的内容能通过 `pnpm build`。

如果涉及图片或页面布局，还应额外验证：

- 桌面、平板、移动端无横向滚动；
- 首屏图片不抢占过多带宽；
- 图片有准确 `alt`、`width`、`height`；
- 深色模式下文字、边框和评论区域保持可读。
