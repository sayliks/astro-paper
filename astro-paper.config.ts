import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://www.matsumae.top/",
    title: "sayliks's corner",
    description: "一个用来记录学习、项目、阅读、音乐和日常想法的个人空间。",
    author: "sayliks",
    profile: "https://github.com/sayliks",
    ogImage: "default-og.jpg",
    lang: "zh-CN",
    timezone: "Asia/Hong_Kong",
    dir: "ltr",
  },
  posts: {
    perPage: 4,
    perIndex: 4,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: true,
      url: "https://github.com/sayliks/astro-paper/edit/main/",
    },
    search: "pagefind",
    speedInsights: true,
  },
  socials: [
    {
      name: "github",
      url: "https://github.com/sayliks",
      linkTitle: "GitHub 上的 sayliks",
    },
    {
      name: "x",
      url: "https://x.com/frsayliks",
      linkTitle: "X 上的 sayliks",
    },
    {
      name: "discord",
      url: "https://discord.gg/5khVRKUv",
      linkTitle: "Discord 上的 saylikx",
    },
    {
      name: "mail",
      url: "mailto:sayliks@outlook.com",
      linkTitle: "给 sayliks 发邮件",
    },
  ],
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
