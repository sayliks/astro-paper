import {
  defineConfig,
  envField,
  fontProviders,
  svgoOptimizer,
} from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { unified } from "@astrojs/markdown-remark";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import { rehypeImageOptimize } from "./src/utils/transformers/rehypeImageOptimize";
import { OG_FONT_FAMILY, OG_FONT_VARIABLE } from "./src/utils/ogFont";
import config from "./astro-paper.config";

export default defineConfig({
  site: config.site.url,
  // 4321 sits inside a Windows-reserved TCP range (winnat/Hyper-V), which
  // makes the default bind fail with EACCES. 5173 is outside the reserved ranges.
  server: { port: 5173 },
  integrations: [
    mdx(),
    sitemap({
      filter: page =>
        config.features?.showArchives !== false || !page.endsWith("/archives/"),
    }),
  ],
  i18n: {
    locales: ["zh-CN"],
    defaultLocale: "zh-CN",
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkToc,
        [remarkCollapse, { test: "Table of contents" }],
      ],
      rehypePlugins: [rehypeImageOptimize],
    }),
    shikiConfig: {
      themes: { light: "min-light", dark: "night-owl" },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerFileName({ style: "v2", hideDot: false }),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  image: {
    service: {
      entrypoint: "astro/assets/services/sharp",
      config: {
        limitInputPixels: false,
      },
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      name: OG_FONT_FAMILY,
      cssVariable: "--font-google-sans-code",
      provider: fontProviders.google(),
      fallbacks: ["monospace"],
      weights: [400, 500, 700],
      styles: ["normal"],
      formats: ["woff2"],
    },
    {
      name: OG_FONT_FAMILY,
      cssVariable: OG_FONT_VARIABLE,
      provider: fontProviders.google(),
      fallbacks: ["monospace"],
      weights: [400, 700],
      styles: ["normal"],
      formats: ["woff"],
    },
    {
      name: "Noto Serif SC",
      cssVariable: "--font-noto-serif-sc",
      provider: fontProviders.google(),
      fallbacks: ["Georgia", "Noto Serif TC", "Songti SC", "SimSun", "serif"],
      weights: [400, 500],
      styles: ["normal"],
      formats: ["woff2"],
    },
  ],
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  },
  experimental: {
    svgOptimizer: svgoOptimizer(),
  },
});
