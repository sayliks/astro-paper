import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import config from "@/config";

export const BLOG_PATH = "src/content/posts";
export const MOMENTS_PATH = "src/content/moments";

const blankStringToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalTrimmedString = z.preprocess(
  blankStringToUndefined,
  z.string().trim().optional()
);

const requiredDate = z.coerce.date();

const optionalDate = z.preprocess(
  blankStringToUndefined,
  z.coerce.date().optional().nullable()
);

const posts = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: `./${BLOG_PATH}` }),
  schema: ({ image }) =>
    z.object({
      author: z.string().default(config.site.author),
      pubDatetime: requiredDate,
      modDatetime: optionalDate,
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

const moments = defineCollection({
  loader: glob({
    pattern: "**/[^_]*.{md,mdx}",
    base: `./${MOMENTS_PATH}`,
    generateId: ({ entry }) => entry.replace(/\.mdx?$/, "").replace(/.*\//, ""),
  }),
  schema: z.object({
    slug: z.string().trim().min(1),
    title: optionalTrimmedString,
    pubDatetime: requiredDate,
    modDatetime: optionalDate,
    draft: z.boolean().default(false),
    pinned: z.boolean().default(false),
    mood: optionalTrimmedString,
    location: optionalTrimmedString,
    images: z
      .array(
        z.object({
          src: z.string().trim().min(1),
          alt: z.string().trim().min(1),
          width: z.coerce.number().int().positive(),
          height: z.coerce.number().int().positive(),
        })
      )
      .default([]),
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

export const collections = { posts, moments, pages };
