import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// https://astro.build/config
export default defineConfig({
  site: "https://hanbin5.github.io",
  integrations: [sitemap()],
  experimental: {
    // Enable the Content Layer API (stable in Astro 5, still flagged in 4.x).
    // This is what lets defineCollection({ loader: glob(...) }) see our
    // repo-root `content/` directory. When we upgrade to Astro 5, remove.
    contentLayer: true,
  },
  markdown: {
    remarkPlugins: [remarkMath],
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
