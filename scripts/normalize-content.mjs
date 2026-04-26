#!/usr/bin/env node
/**
 * normalize-content.mjs
 * ---------------------------------------------------------------------
 * Pre-build pass over content/posts/*.md that reflows Obsidian-style
 * `$$ ... $$` math so it parses cleanly with remark-math.
 *
 * Why a separate script instead of an Astro/remark plugin?
 *   - remark-math runs on the AST, but the bug we're fixing happens at
 *     the parser level: mid-paragraph `$$` is parsed as inline math and
 *     swallows the rest of the document. Patching the AST after-the-
 *     fact means re-running the parser, which is brittle.
 *   - A simple file-level pass is idempotent — running it twice on the
 *     same file leaves it byte-identical the second time.
 *   - The same logic should be reusable from the sync script if we
 *     ever want to normalise during sync rather than at build time.
 *
 * Idempotence: every well-formed `$$\n<body>\n$$\n\n` block is left
 * alone. We only rewrite when an opening `$$` sits mid-line, when the
 * body lives on the same line as either delimiter, or when the block
 * has no surrounding blank lines.
 */
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { fixObsidianMath } from "../src/plugins/remark-obsidian-math.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const POSTS_DIR = join(ROOT, "content", "posts");

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...(await walk(p)));
    } else if (e.isFile() && e.name.endsWith(".md")) {
      files.push(p);
    }
  }
  return files;
}

async function main() {
  let s;
  try {
    s = await stat(POSTS_DIR);
  } catch {
    console.log(`[normalize-content] no posts dir at ${POSTS_DIR}, skipping.`);
    return;
  }
  if (!s.isDirectory()) return;

  const files = await walk(POSTS_DIR);
  let touched = 0;
  for (const file of files) {
    const before = await readFile(file, "utf8");
    const after = fixObsidianMath(before);
    if (after !== before) {
      await writeFile(file, after);
      touched++;
      console.log(`[normalize-content] reflowed math in ${file.replace(ROOT + "/", "")}`);
    }
  }
  console.log(
    `[normalize-content] checked ${files.length} file(s); rewrote ${touched}.`
  );
}

main().catch((err) => {
  console.error("[normalize-content] failed:", err);
  process.exit(1);
});
