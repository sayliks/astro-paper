import type { FontData } from "astro:assets";
import { getFontPathByWeight } from "./getFontPathByWeight.ts";

export const OG_FONT_FAMILY = "Google Sans Code";
export const OG_FONT_VARIABLE = "--font-google-sans-code-og";

type OgFontWeight = 400 | 700;

type OgSatoriFont = {
  name: typeof OG_FONT_FAMILY;
  data: ArrayBuffer;
  weight: OgFontWeight;
  style: "normal";
};

type GetFontFileUrl = (fontPath: string, contextUrl: URL) => string;

const ogFontDataCache = new Map<string, Promise<ArrayBuffer>>();

export function getRequiredOgFontPath(
  fonts: FontData[] | undefined,
  weight: number
): string {
  const fontPath = getFontPathByWeight(fonts, weight);

  if (!fontPath) {
    throw new Error(`Cannot find ${OG_FONT_VARIABLE} ${weight} font path.`);
  }

  return fontPath;
}

function getOgFontData(
  fontPath: string,
  contextUrl: URL,
  getFontFileUrl: GetFontFileUrl
) {
  const fontFileUrl = getFontFileUrl(fontPath, contextUrl);
  const cacheKey = fontFileUrl.toString();
  const cached = ogFontDataCache.get(cacheKey);

  if (cached) return cached;

  const fontDataPromise = fetch(fontFileUrl).then(response => {
    if (!response.ok) {
      throw new Error(
        `Failed to load OG font ${fontFileUrl}: ${response.status}`
      );
    }

    return response.arrayBuffer();
  });

  ogFontDataCache.set(cacheKey, fontDataPromise);
  void fontDataPromise.catch(() => {
    if (ogFontDataCache.get(cacheKey) === fontDataPromise) {
      ogFontDataCache.delete(cacheKey);
    }
  });

  return fontDataPromise;
}

export async function getOgSatoriFonts(
  fonts: FontData[] | undefined,
  contextUrl: URL,
  getFontFileUrl: GetFontFileUrl
): Promise<OgSatoriFont[]> {
  const regularFontPath = getRequiredOgFontPath(fonts, 400);
  const boldFontPath = getRequiredOgFontPath(fonts, 700);

  const [regularData, boldData] = await Promise.all([
    getOgFontData(regularFontPath, contextUrl, getFontFileUrl),
    getOgFontData(boldFontPath, contextUrl, getFontFileUrl),
  ]);

  return [
    {
      name: OG_FONT_FAMILY,
      data: regularData,
      weight: 400,
      style: "normal",
    },
    {
      name: OG_FONT_FAMILY,
      data: boldData,
      weight: 700,
      style: "normal",
    },
  ];
}
