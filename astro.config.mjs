import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import remarkObsidianCallouts from "./src/plugins/remark-obsidian-callouts.mjs";
import remarkObsidianBreaks from "./src/plugins/remark-obsidian-breaks.mjs";

// https://astro.build/config
export default defineConfig({
  site: "https://hanbin5.github.io",
  integrations: [sitemap()],
  markdown: {
    // Plugin order matters:
    //   1. remarkObsidianCallouts — runs on the parsed AST and converts
    //      `> [!type] title` blockquotes into <div class="callout ...">
    //      structures BEFORE remark-math so callout-internal `$$` is
    //      still parsed as math (the rewritten div keeps math children).
    //   2. remarkMath — finds `$$...$$` block math and `$...$` inline.
    //      Mid-paragraph `$$` in source markdown is reflowed by the
    //      `prebuild` content-normaliser script (scripts/normalize-content.mjs)
    //      so by the time we get here every `$$` block sits on its own
    //      line with blank lines around it.
    //   3. remarkObsidianBreaks — converts single \n inside paragraphs
    //      to <br> so prose authored in Obsidian (which has "strict
    //      line breaks" off by default) renders the same way here.
    remarkPlugins: [remarkObsidianCallouts, remarkMath, remarkObsidianBreaks],
    rehypePlugins: [
      [
        rehypeKatex,
        {
          // MathJax compatibility knobs
          strict: false,        // allow non-standard LaTeX without warnings
          throwOnError: false,  // never crash the build on a bad equation
          output: "htmlAndMathml",
          trust: true,
          macros: {
            // Helpers commonly used in MathJax-authored docs
            "\\RR": "\\mathbb{R}",
            "\\NN": "\\mathbb{N}",
            "\\ZZ": "\\mathbb{Z}",
          },
        },
      ],
    ],
    shikiConfig: {
      theme: "github-light",
      wrap: true,
    },
  },
  build: {
    assets: "assets",
  },
});
