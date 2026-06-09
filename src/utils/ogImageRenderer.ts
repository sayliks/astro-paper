import { experimental_getFontFileURL, fontData } from "astro:assets";
import satori from "satori";
import sharp from "sharp";
import { getOgSatoriFonts, OG_FONT_VARIABLE } from "./ogFont.ts";
import {
  createOgImageResponse,
  createOgSatoriOptions,
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

  const svg = await satori(
    frame as Parameters<typeof satori>[0],
    createOgSatoriOptions(fonts)
  );

  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Uint8Array(pngBuffer);
}

export async function renderOgImageResponse(
  frame: OgNode,
  contextUrl: URL
): Promise<Response> {
  return createOgImageResponse(await renderOgImagePng(frame, contextUrl));
}
