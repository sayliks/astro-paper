import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://www.matsumae.top/",
    title: "SAYLIKS",
    description: "一个用来记录学习、项目、阅读、音乐和日常想法的个人空间。",
    author: "sayliks",
    profile: "https://github.com/sayliks",
    ogImage: "default-og.jpg",
    lang: "zh-CN",
    timezone: "Asia/Hong_Kong",
    dir: "ltr",
  },
  posts: {
    perPage: 9,
    perIndex: 12,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  photoWall: {
    allowedExternalHosts: ["tg.matsumae.top"],
  },
  features: {
    dynamicOgImage: false,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: true,
      url: "https://github.com/sayliks/astro-paper/edit/main/",
    },
    search: "pagefind",
    speedInsights: true,
  },
  socials: [],
  shareLinks: [
    { name: "wechat", url: "", linkTitle: "分享到微信" },
    {
      name: "weibo",
      url: "https://service.weibo.com/share/share.php",
      linkTitle: "分享到微博",
    },
    {
      name: "telegram",
      url: "https://t.me/share/url",
      linkTitle: "分享到 Telegram",
    },
    { name: "mail", url: "mailto:", linkTitle: "通过邮件分享这篇文章" },
    { name: "copy", url: "", linkTitle: "复制文章链接" },
  ],
});
