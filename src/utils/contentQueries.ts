import { getCollection, type CollectionEntry } from "astro:content";
import { getSortedMoments } from "./getSortedMoments";
import { getSortedPosts } from "./getSortedPosts";
import { getUniqueTags } from "./getUniqueTags";

type PostEntry = CollectionEntry<"posts">;
type MomentEntry = CollectionEntry<"moments">;
type PublishedTag = ReturnType<typeof getUniqueTags>[number];

let publishedSortedPostsPromise: Promise<PostEntry[]> | undefined;
let publishedSortedMomentsPromise: Promise<MomentEntry[]> | undefined;
let publishedTagsPromise: Promise<PublishedTag[]> | undefined;

async function loadPublishedSortedPosts() {
  return getSortedPosts(await getCollection("posts"));
}

async function loadPublishedSortedMoments() {
  return getSortedMoments(await getCollection("moments"));
}

export function getPublishedSortedPosts() {
  if (import.meta.env.DEV) {
    return loadPublishedSortedPosts();
  }

  publishedSortedPostsPromise ??= loadPublishedSortedPosts();
  return publishedSortedPostsPromise;
}

export function getPublishedSortedMoments() {
  if (import.meta.env.DEV) {
    return loadPublishedSortedMoments();
  }

  publishedSortedMomentsPromise ??= loadPublishedSortedMoments();
  return publishedSortedMomentsPromise;
}

async function loadPublishedTags() {
  return getUniqueTags(await getPublishedSortedPosts());
}

export function getPublishedTags() {
  if (import.meta.env.DEV) {
    return loadPublishedTags();
  }

  publishedTagsPromise ??= loadPublishedTags();
  return publishedTagsPromise;
}
