export type DynamicOgPostInput = {
  data: {
    ogImage?: unknown;
  };
};

export function shouldGenerateDynamicOgImagePost<T extends DynamicOgPostInput>(
  post: T,
  publicationFilter: (post: T) => boolean
): boolean {
  return publicationFilter(post) && !post.data.ogImage;
}
