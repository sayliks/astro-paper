import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://www.matsumae.top/",
    title: "sayliks corner",
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
      name: "mail",
      url: "mailto:sayliks@outlook.com",
      linkTitle: "给 sayliks 发邮件",
    },
  ],
  shareLinks: [
    { name: "whatsapp", url: "https://wa.me/?text=" },
    { name: "facebook", url: "https://www.facebook.com/sharer.php?u=" },
    { name: "x",        url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "mail",     url: "mailto:?subject=See%20this%20post&body=" },
  ],
});
