import { experimental_getFontFileURL, fontData } from "astro:assets";
import satori from "satori";
import sharp from "sharp";
import { getOgSatoriFonts, OG_FONT_VARIABLE } from "./ogFont.ts";
import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  type OgNode,
} from "./ogImageFrame.ts";

export async function renderOgImagePng(
  frame: OgNode,
  contextUrl: URL
): Promise<Uint8Array> {
  const fonts = await getOgSatoriFonts(
    fontData[OG_FONT_VARIABLE],
    contextUrl,
    experimental_getFontFileURL
  );

  const svg = await satori(frame as Parameters<typeof satori>[0], {
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    embedFont: true,
    fonts,
  });

  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Uint8Array(pngBuffer);
}

export function createOgImageResponse(pngData: Uint8Array): Response {
  const body = new ArrayBuffer(pngData.byteLength);
  new Uint8Array(body).set(pngData);

  return new Response(body, {
    headers: { "Content-Type": OG_IMAGE_CONTENT_TYPE },
  });
}

export async function renderOgImageResponse(
  frame: OgNode,
  contextUrl: URL
): Promise<Response> {
  return createOgImageResponse(await renderOgImagePng(frame, contextUrl));
}
