import rss from "@astrojs/rss";
import { getPublishedSortedMoments } from "@/utils/contentQueries";
import {
  getMomentDescription,
  getMomentMetaTitle,
  getMomentUrl,
} from "@/utils/getSortedMoments";
import config from "@/config";

export async function GET() {
  const moments = await getPublishedSortedMoments();

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
