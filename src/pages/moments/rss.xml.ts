import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import {
  getMomentDescription,
  getMomentMetaTitle,
  getMomentUrl,
  getSortedMoments,
} from "@/utils/getSortedMoments";
import config from "@/config";

export async function GET() {
  const moments = getSortedMoments(await getCollection("moments"));

  return rss({
    title: "动态 | sayliks corner",
    description: "sayliks 的状态更新。",
    site: config.site.url,
    items: moments.map(moment => ({
      link: getMomentUrl(moment, config.site.lang),
      title: getMomentMetaTitle(moment),
      description: getMomentDescription(moment),
      content: moment.rendered?.html,
      pubDate: new Date(moment.data.pubDatetime),
    })),
  });
}
