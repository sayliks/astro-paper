import type { FontData } from "astro:assets";
import { getFontPathByWeight } from "./getFontPathByWeight";

export const OG_FONT_FAMILY = "Google Sans Code";
export const OG_FONT_VARIABLE = "--font-google-sans-code-og";

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
