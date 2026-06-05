import type { FontData } from "astro:assets";

export function getFontPathByWeight(
  fonts: FontData[] | undefined,
  weight: number,
  options?: {
    style?: "normal" | "italic";
    format?: string;
  }
): string | undefined {
  const style = options?.style ?? "normal";
  const formats = options?.format
    ? [options.format]
    : ["woff", "truetype", "ttf", "opentype", "otf"];

  if (!fonts) return undefined;

  for (const font of fonts) {
    if (font.weight === String(weight) && font.style === style) {
      const src = font.src.find(file =>
        file.format ? formats.includes(file.format) : false
      );
      if (src) return src.url;
    }
  }

  return undefined;
}
