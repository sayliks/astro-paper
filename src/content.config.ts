import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import config from "@/config";

export const BLOG_PATH = "src/content/posts";

const blankStringToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalTrimmedString = z.preprocess(
  blankStringToUndefined,
  z.string().trim().optional()
);

const posts = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: `./${BLOG_PATH}` }),
  schema: ({ image }) =>
    z.object({
      author: z.string().default(config.site.author),
      pubDatetime: z.date(),
      modDatetime: z.date().optional().nullable(),
      title: z.string(),
      featured: z.boolean().optional(),
      draft: z.boolean().optional(),
      tags: z.array(z.string()).default(["others"]),
      ogImage: z.preprocess(
        blankStringToUndefined,
        image().or(z.string().trim().min(1)).optional()
      ),
      description: z.string(),
      canonicalURL: optionalTrimmedString,
      hideEditPost: z.boolean().optional(),
      timezone: optionalTrimmedString,
    }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    ogImage: optionalTrimmedString,
    canonicalURL: optionalTrimmedString,
  }),
});

export const collections = { posts, pages };
