---
title: 使用Cloudflare R2 + PicList零成本搭建个人图床
pubDatetime: 2026-06-11T22:11:00+08:00
description: 如何使用 Cloudflare R2 + 自定义域名 + PicList 搭建一个免费、稳定、支持 CDN 加速的个人图床，并实现 Obsidian/Markdown 的自动上传与外链引用。
tags:
  - 随笔
draft: true
featured: false
ogImage: ''
canonicalURL: ''
timezone: Asia/Hong_Kong
---

## 什么是图床

图床（Image Hosting）是一种专门用于存储图片并提供外链访问的服务。

简单来说，当你将图片上传到图床后，会获得一个公开访问的 URL 地址。无论是在博客、Markdown 文档、Obsidian 笔记、论坛还是社交平台中，都可以通过这个链接直接引用图片，而无需依赖本地文件。

相比直接将图片存放在项目仓库或服务器中，图床具有以下优势：

* **减小仓库体积**：避免大量图片占用 Git 仓库空间。
* **提高网站性能**：图片与网站内容分离，降低构建和部署压力。
* **统一管理资源**：所有图片集中存储，便于维护和迁移。
* **支持多处复用**：同一张图片可以在多个平台和项目中共享使用。
* **提升访问速度**：多数图床提供 CDN 加速，图片加载更快。

对于个人博客和知识库而言，图床本质上是一套“图片存储 + 外链访问”的解决方案，能够让内容管理更加灵活和高效。目前较为流行的方案包括 **Cloudflare R2**、[GitHub](https://github.com?utm_source=chatgpt.com) 仓库图床、Telegram 图床以及各类对象存储服务。

## 为什么需要图床

把图片直接丢进 Git 仓库是很多人起步时的习惯，但用久了会发现：

* 仓库克隆越来越慢，git blame 都不想跑
* CI 每次都要拖一堆几百 KB 的图片，构建时间翻倍
* 换一次博客框架，所有图片链接碎一地
* 想整理历史图片，发现和代码/文章混在一起，不敢乱动

独立图床的本质就是**存储与内容分离**。一个图片链接可以同时在博客、Obsidian、论坛、邮件里使用，换什么工具都不影响。

如果你只想选一个免费且长久可用的方案，**Cloudflare R2** 无疑是目前最成熟的选择。

***

## 优势

* Cloudflare R2（S3 兼容，每月 10GB 免费）
* PicList（开源，支持 macOS / Windows / Linux）
* 自定义域名 + Cloudflare CDN 自动加速

R2 的关键优势是 **出站流量不收费**，这是它比 AWS S3 或阿里云 OSS 更适合做图床的地方。

***

# 准备工作

* **一个域名**（可选但强烈建议，`r2.dev` 在某些网络下速度一般）
* **Cloudflare 账号**
* **PicList 客户端**：https://piclist.cn/

[![image.webp](https://tg.matsumae.top/file/1781187728381_image.webp "PicList官网")](https://piclist.cn/)

***

## 一、域名接入 Cloudflare

如果你已经将域名托管在 Cloudflare，直接跳过这步。

1. 在域名注册商后台，把 NS 服务器改成 Cloudflare 分配的地址
2. 在 Cloudflare 控制台添加站点，等 DNS 生效（几分钟到几小时不等）
3. 确认域名的代理状态是 **橙色云朵**（开启 CDN）

![image.webp](https://tg.matsumae.top/file/1781187954127_image.webp)

![image.webp](https://tg.matsumae.top/file/1781188011834_image.webp)

> 如果后面绑定自定义域名后访问不了，先回 DNS 检查这个域名是不是走了代理（橙色）。走灰色 DNS Only 的话，R2 的公开桶也能访问，但不会走 Cloudflare 边缘缓存。

***

## 二、创建 R2 存储桶

进入 Cloudflare 控制台 → R2 → Create bucket。

命名规则：全小写、用连字符，比如 `blog-img` 或 `frostsalix-assets`。

区域选 **Auto** 就行。

![image.webp](https://tg.matsumae.top/file/1781188093901_image.webp)

![image.webp](https://tg.matsumae.top/file/1781188125646_image.webp)

![image.webp](https://tg.matsumae.top/file/1781188178535_image.webp)

完成后点击创建按钮。

创建后默认是私有的，需要手动打开公开访问：

进入 bucket → Settings → Bucket access → Allow public access。

打开后你会看到一个 `pub-xxxx.r2.dev` 的地址，先记着，后面测试用。

![image.webp](https://tg.matsumae.top/file/1781188358478_image.webp)

***

## 三、绑定自定义域名（推荐）

bucket 页面左侧菜单 → Custom Domains → Connect domain。

输入 `img.yourdomain.com`（换成你自己的）。

Cloudflare 会自动加一条 CNAME 记录，指向 R2 的公开端点。

生效后，图片就能通过：

```text
https://img.yourdomain.com/图片名
```

访问。

![image.webp](https://tg.matsumae.top/file/1781188401388_image.webp)

***

## 四、生成 API 密钥（给 PicList 用）

R2 → Manage API Tokens → Create API token。

* Name：`piclist-upload`
* Permission：**Admin read & write**
* Specify bucket：选你刚创建的 bucket

创建后 **立刻保存 Secret Access Key**，只出现一次。

同时记下：

* Access Key ID
* Endpoint（格式 `https://<account_id>.r2.cloudflarestorage.com`，account_id 在 Cloudflare 控制台右侧）

![image.webp](https://tg.matsumae.top/file/1781188532642_image.webp)

![image.webp](https://tg.matsumae.top/file/1781188532679_image.webp)

***

## 五、安装并配置 PicList

下载安装 PicList：
https://piclist.cn/
（选对应系统版本）
PicList 原生支持 S3

## 配置 R2 连接

进入 PicList → 图床设置 → Amazon S3（或类似的 S3 选项）。

填下面这些：

| 字段 | 值 |
| --- | --- |
| AccessKeyID | 上一步生成的 Access Key ID |
| SecretAccessKey | 上一步的 Secret Key |
| BucketName | `blog-img`（你的 bucket 名） |
| FilePath | 可选，比如 `images/`（虚拟目录，不填则直接放根目录） |
| CustomUrl | `https://img.yourdomain.com`（你的自定义域名，不要加尾部斜杠） |
| Endpoint | `https://<account_id>.r2.cloudflarestorage.com` |
| Region | 留空或填 `auto`（R2 会忽略） |
| ACL | `public-read`（关键） |

![image.webp](https://tg.matsumae.top/file/1781188665581_image.webp)

![image.webp](https://tg.matsumae.top/file/1781188671230_image.webp)

保存，并设为默认图床。

***

## 六、测试上传

拖一张图片到 PicList 上传区。
如果成功，日志会显示类似：

```text
[上传成功] https://img.yourdomain.com/2026/06/test.png
```

![image.webp](https://tg.matsumae.top/file/1781188728148_image.webp)

复制链接，在浏览器打开看是否正常显示。

如果返回 `AccessDenied`：

* 检查 bucket 的公开访问开了没有
* 检查 ACL 是不是 `public-read`
* 检查自定义域名的 CNAME 是否正确（可以用 `dig img.yourdomain.com` 看一眼）

***

## 七、Obsidian 自动上传（可选）

推荐插件：**Image Auto Upload**。

1. Obsidian 社区插件搜索安装
2. 插件设置 → Uploader 选 \*\*PicGo(app)\*\*（PicList 兼容这个接口）
3. PicList 里开启 Server：设置 → 设置 Server → 打开开关，端口默认 36677

之后在 Obsidian 里 `Ctrl + V` 粘贴图片，会自动上传并替换成 Markdown 链接。
![image.webp](https://tg.matsumae.top/file/1781188797853_image.webp)
![image.webp](https://tg.matsumae.top/file/1781188815272_image.webp)

***

## 八、目录组织建议

一个比较好的习惯是在 Bucket 里按 `年/月/` 分目录，比如：

```text
blog-img/
├── 2026/
│   └── 06/
│       └── first-post-cover.png
└── 2026/
    └── 07/
        └── obsidian-note-screenshot.jpg
```

PicList 可以在 FilePath 里写 `{year}/{month}/`（它支持变量），或者直接写固定前缀。
配合 PicList 的「时间戳重命名」功能，上传后自动生成唯一文件名，省去命名的麻烦。

***

## 总结

R2 的稳定性 + PicList 的本地体验 + 自定义域名的可控性，对于独立博客和知识库来说，远好于那些随时可能关闭的免费图床服务。
如果卡在某一步，通常是 API 密钥的 Endpoint 写错，或者 bucket 没开公开访问，检查这两处能解决 80% 的问题。
