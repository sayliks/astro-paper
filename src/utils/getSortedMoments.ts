import type { CollectionEntry } from "astro:content";
import { getRelativeLocaleUrl } from "astro:i18n";
import config from "@/config";
import {
  FALLBACK_MOMENT_DESCRIPTION,
  formatMomentDateTimeKey,
  getMomentDescriptionFromMarkdown,
  getMomentIdSlug,
  getMomentTitle,
  isPublishedMoment,
  isValidMomentImage,
  sortMomentEntries,
} from "./momentModel";

export type MomentEntry = CollectionEntry<"moments">;

export const fallbackMomentDescription = FALLBACK_MOMENT_DESCRIPTION;
export { isValidMomentImage };

export function getMomentDateTimeKey(date: Date) {
  return formatMomentDateTimeKey(date, config.site.timezone);
}

export function getMomentMetaTitle(moment: MomentEntry) {
  return getMomentTitle(moment.data.pubDatetime, config.site.timezone);
}

export function momentFilter(moment: MomentEntry) {
  return isPublishedMoment(moment);
}

export function getSortedMoments(moments: MomentEntry[]) {
  return sortMomentEntries(moments.filter(momentFilter));
}

export function getMomentSlug(moment: MomentEntry) {
  return getMomentIdSlug(moment.id);
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
