import type { UIStrings } from "../types";

export default {
  nav: {
    home: "首页",
    posts: "文章",
    tags: "标签",
    moments: "动态",
    photoWall: "照片墙",
    about: "关于",
    archives: "归档",
    search: "搜索",
  },
  post: {
    publishedAt: "发布于",
    updatedAt: "更新于",
    sharePostIntro: "分享这篇文章：",
    sharePostOn: "分享到 {{platform}}",
    sharePostViaEmail: "通过邮件分享这篇文章",
    tagLabel: "标签",
    backToTop: "回到顶部",
    goBack: "返回",
    editPage: "编辑页面",
    previousPost: "上一篇",
    nextPost: "下一篇",
  },
  moments: {
    title: "动态",
    description: "一些轻一点、近一点的状态更新。",
    empty: "还没有发布动态。",
    pinned: "置顶",
    draft: "草稿",
    comments: "评论",
    backToMoments: "返回动态",
    updatedAt: "更新于",
    metadataLabel: "动态元信息",
    moodLabel: "心情",
    locationLabel: "地点",
    rssTitle: "sayliks 动态 RSS",
    rssDescription: "sayliks 的状态更新。",
  },
  pagination: {
    prev: "上一页",
    next: "下一页",
    page: "第",
  },
  home: {
    socialLinks: "社交链接",
    featured: "精选",
    recentPosts: "最近",
    allPosts: "全部",
  },
  footer: {
    copyright: "版权所有",
    allRightsReserved: "保留所有权利。",
  },
  pages: {
    tagTitle: "标签",
    tagDesc: "包含该标签的所有文章",

    tagsTitle: "标签",
    tagsDesc: "文章中使用过的所有标签。",

    photoWallTitle: "照片墙",
    photoWallDesc: "一些被留下来的画面。",

    momentsTitle: "动态",
    momentsDesc: "一些轻一点、近一点的状态更新。",

    postsTitle: "文章",
    postsDesc: "我发布过的所有文章。",

    archivesTitle: "归档",
    archivesDesc: "按时间整理的所有文章。",

    searchTitle: "搜索",
    searchDesc: "搜索站内",
  },
  a11y: {
    skipToContent: "跳到正文",
    openMenu: "打开菜单",
    closeMenu: "关闭菜单",
    toggleTheme: "切换主题",
    searchPlaceholder: "搜索文章……",
    noResults: "没有找到结果",
    goToPreviousPage: "前往上一页",
    goToNextPage: "前往下一页",
  },
  notFound: {
    title: "404 页面未找到",
    message: "页面未找到",
    goHome: "回到首页",
  },
} satisfies UIStrings;
