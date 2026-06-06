export type PhotoWallItem = {
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
};

export const photoWallItems: PhotoWallItem[] = [
  {
    src: "photo-wall/window-light.svg",
    alt: "窗边的阳光落在书桌、纸页和一杯茶上",
    caption: "窗边上午",
    width: 900,
    height: 1125,
  },
  {
    src: "photo-wall/blue-hour.svg",
    alt: "傍晚蓝色天空下的城市窗户和远处楼影",
    caption: "蓝调时刻",
    width: 1200,
    height: 750,
  },
  {
    src: "photo-wall/rain-walk.svg",
    alt: "雨后路面反射着路灯和行人的影子",
    caption: "雨后散步",
    width: 900,
    height: 900,
  },
  {
    src: "photo-wall/library-corner.svg",
    alt: "书架、阅读灯和摊开的笔记本组成的安静角落",
    caption: "图书馆角落",
    width: 900,
    height: 1125,
  },
  {
    src: "photo-wall/warm-rooftop.svg",
    alt: "暖色天光下的天台边缘和远方云层",
    caption: "天台余温",
    width: 1200,
    height: 750,
  },
  {
    src: "photo-wall/green-shadow.svg",
    alt: "树叶投下的绿色影子铺在浅色墙面上",
    caption: "绿影",
    width: 900,
    height: 900,
  },
];
