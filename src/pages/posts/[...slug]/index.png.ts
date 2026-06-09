import type { APIRoute } from "astro";
import {
  createOgFooter,
  createOgImageFrame,
  createOgSpan,
  createOgText,
} from "@/utils/ogImageFrame";
import { renderOgImageResponse } from "@/utils/ogImageRenderer";
import { getPublishedSortedPosts } from "@/utils/contentQueries";
import { getPostSlug } from "@/utils/getPostPaths";
import { shouldGenerateDynamicOgImagePost } from "@/utils/dynamicOgImageFilter";
import config from "@/config";

export async function getStaticPaths() {
  if (!config.features.dynamicOgImage) {
    return [];
  }

  const posts = (await getPublishedSortedPosts()).filter(post =>
    shouldGenerateDynamicOgImagePost(post, () => true)
  );

  return posts.map(post => ({
    params: { slug: getPostSlug(post.id, post.filePath) },
    props: post,
  }));
}

export const GET: APIRoute = async ({ props, url }) => {
  if (!config.features.dynamicOgImage) {
    return new Response(null, { status: 404, statusText: "Not found" });
  }

  const frame = createOgImageFrame({
    body: createOgText(props.data.title, {
      fontSize: 72,
      fontWeight: "bold",
      maxHeight: "84%",
      overflow: "hidden",
    }),
    footer: createOgFooter(
      [
        createOgSpan([
          "by ",
          createOgSpan('"', { color: "transparent" }),
          createOgSpan(props.data.author, {
            overflow: "hidden",
            fontWeight: "bold",
          }),
        ]),
        createOgSpan(config.site.title, {
          overflow: "hidden",
          fontWeight: "bold",
        }),
      ],
      "space-between"
    ),
  });

  return renderOgImageResponse(frame, url);
};
