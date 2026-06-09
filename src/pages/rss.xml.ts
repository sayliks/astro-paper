import rss from "@astrojs/rss";
import { getPublishedSortedPosts } from "@/utils/contentQueries";
import { getPostUrl } from "@/utils/getPostPaths";
import config from "@/config";

export async function GET() {
  const sortedPosts = await getPublishedSortedPosts();

  return rss({
    title: config.site.title,
    description: config.site.description,
    site: config.site.url,
    items: sortedPosts.map(({ data, id, filePath, rendered }) => ({
      link: getPostUrl(id, filePath, config.site.lang),
      title: data.title,
      description: data.description,
      content: rendered?.html,
      pubDate: new Date(data.modDatetime ?? data.pubDatetime),
    })),
  });
}
