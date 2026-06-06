import type { CollectionEntry } from "astro:content";
import config from "@/config";
import { isContentPublished } from "./publicationFilter";

/**
 * Determines whether a post is eligible to be listed/rendered.
 *
 * - Excludes drafts always
 * - In production, excludes scheduled posts until `pubDatetime` minus the configured margin
 * - In dev, always shows non-draft posts to make authoring easier
 */
export function postFilter({ data }: CollectionEntry<"posts">) {
  return isContentPublished(
    { data },
    {
      isDev: import.meta.env.DEV,
      scheduledPostMargin: config.posts.scheduledPostMargin,
    }
  );
}
