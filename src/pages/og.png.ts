import type { APIRoute } from "astro";
import {
  createCenteredOgBody,
  createOgFooter,
  createOgImageFrame,
  createOgSpan,
  createOgText,
} from "@/utils/ogImageFrame";
import { renderOgImageResponse } from "@/utils/ogImageRenderer";
import config from "@/config";

export const GET: APIRoute = async context => {
  if (!config.features.dynamicOgImage) {
    return new Response(null, { status: 404, statusText: "Not found" });
  }

  const frame = createOgImageFrame({
    body: createCenteredOgBody([
      createOgText(config.site.title, { fontSize: 72, fontWeight: "bold" }),
      createOgText(config.site.description, { fontSize: 28 }),
    ]),
    footer: createOgFooter(
      createOgSpan(new URL(config.site.url).hostname, {
        overflow: "hidden",
        fontWeight: "bold",
      }),
      "flex-end"
    ),
  });

  return renderOgImageResponse(frame, context.url);
};
