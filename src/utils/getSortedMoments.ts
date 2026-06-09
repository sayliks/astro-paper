import type { CollectionEntry } from "astro:content";
import { getRelativeLocaleUrl } from "astro:i18n";
import config from "@/config";
import {
  FALLBACK_MOMENT_DESCRIPTION,
  formatMomentDateTimeKey,
  getMomentDescriptionFromMarkdown,
  getMomentRouteSlug,
  getPublishedMomentEntries,
  isPublishedMoment,
  isValidMomentImage,
  resolveMomentTitle,
} from "./momentModel";

export type MomentEntry = CollectionEntry<"moments">;

export const fallbackMomentDescription = FALLBACK_MOMENT_DESCRIPTION;
export { isValidMomentImage };

export function getMomentDateTimeKey(date: Date) {
  return formatMomentDateTimeKey(date, config.site.timezone);
}

export function getMomentMetaTitle(moment: MomentEntry) {
  return resolveMomentTitle(moment.data, config.site.timezone);
}

export function momentFilter(moment: MomentEntry) {
  return isPublishedMoment(moment, { isDev: import.meta.env.DEV });
}

export function getSortedMoments(moments: MomentEntry[]) {
  return getPublishedMomentEntries(moments, { isDev: import.meta.env.DEV });
}

export function getMomentSlug(moment: MomentEntry) {
  return getMomentRouteSlug(moment);
}

export function getMomentUrl(
  moment: MomentEntry,
  locale: string | undefined = config.site.lang
) {
  return getRelativeLocaleUrl(locale, `moments/${getMomentSlug(moment)}`);
}

export function getMomentDescription(moment: MomentEntry, maxLength = 160) {
  return getMomentDescriptionFromMarkdown(moment.body ?? "", maxLength);
}
