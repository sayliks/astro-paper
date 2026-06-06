export const FALLBACK_MOMENT_DESCRIPTION = "一条日常记录。";

export type MomentSortInput = {
  id: string;
  body?: string;
  data: {
    pubDatetime: Date | string;
    draft?: boolean;
    pinned?: boolean;
  };
};

const toSeconds = (value: Date | string) =>
  Math.floor(new Date(value).getTime() / 1000);

export function isPublishedMoment(moment: { data: { draft?: boolean } }) {
  return !moment.data.draft;
}

export function sortMomentEntries<T extends MomentSortInput>(
  moments: T[]
): T[] {
  return [...moments].sort((a, b) => {
    const pinnedDelta =
      Number(Boolean(b.data.pinned)) - Number(Boolean(a.data.pinned));
    if (pinnedDelta !== 0) return pinnedDelta;

    return toSeconds(b.data.pubDatetime) - toSeconds(a.data.pubDatetime);
  });
}

export function getMomentIdSlug(id: string) {
  const segments = id.split("/");
  return segments.length > 0 ? String(segments[segments.length - 1]) : id;
}

export function formatMomentDateTimeKey(
  date: Date | string,
  timeZone = "Asia/Hong_Kong"
) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(date))
      .map(part => [part.type, part.value])
  );

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

export function getMomentTitle(
  date: Date | string,
  timeZone = "Asia/Hong_Kong"
) {
  return `日常 · ${formatMomentDateTimeKey(date, timeZone)}`;
}

export function markdownToPlainText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*>+\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/[*_~#|[\](){}]+/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .replace(/\s+([，。！？、；：,.!?;:])/g, "$1")
    .trim();
}

export function getMomentDescriptionFromMarkdown(
  markdown: string,
  maxLength = 160
) {
  const plainText = markdownToPlainText(markdown);
  if (!plainText) return FALLBACK_MOMENT_DESCRIPTION;

  const chars = Array.from(plainText);
  if (chars.length <= maxLength) return plainText;
  return `${chars
    .slice(0, maxLength - 1)
    .join("")
    .trimEnd()}…`;
}

export function isValidMomentImage(image: {
  src?: unknown;
  alt?: unknown;
  width?: unknown;
  height?: unknown;
}) {
  return (
    typeof image.src === "string" &&
    image.src.trim().length > 0 &&
    typeof image.alt === "string" &&
    image.alt.trim().length > 0 &&
    Number.isInteger(Number(image.width)) &&
    Number(image.width) > 0 &&
    Number.isInteger(Number(image.height)) &&
    Number(image.height) > 0
  );
}
