/**
 * remark-obsidian-breaks
 * ---------------------------------------------------------------------
 * Obsidian's "Strict line breaks" preference is OFF by default, which
 * means a single newline inside a paragraph renders as a visible line
 * break (`<br>`). CommonMark, by contrast, collapses single newlines
 * to a space — so prose authored in Obsidian arrives on the site as
 * one long run-on paragraph.
 *
 * This plugin mirrors Obsidian's default by walking text nodes inside
 * paragraphs, splitting on `\n`, and inserting `break` nodes between
 * the pieces. Code spans, code blocks, math, and inline HTML are
 * untouched because we only descend into nodes that contain `text`
 * children — the visit explicitly skips `code`, `inlineCode`, `math`,
 * and `inlineMath`.
 *
 * Two small details that matter:
 *
 *  - We ignore double newlines (`\n\n`). remark-parse has already
 *    split those into separate paragraphs by the time this runs, so
 *    any `\n\n` we see is the residue of edge cases (e.g. inside a
 *    callout's first text after the marker was stripped). Treating
 *    those as a single break keeps the output clean.
 *
 *  - We don't insert a `break` if a line is empty after splitting —
 *    that would produce two `<br>` in a row and double the gap.
 */
const SKIP_TYPES = new Set(["code", "inlineCode", "math", "inlineMath", "html"]);

function transform(node) {
  if (!node || !node.children) return;

  if (SKIP_TYPES.has(node.type)) return;

  const out = [];
  for (const child of node.children) {
    if (child.type === "text" && typeof child.value === "string" && child.value.includes("\n")) {
      // Collapse runs of \n to a single \n (paragraph splits already
      // happened upstream); split, drop empty pieces, interleave breaks.
      const parts = child.value.replace(/\n{2,}/g, "\n").split("\n");
      parts.forEach((part, i) => {
        if (part.length > 0) {
          out.push({ type: "text", value: part });
        }
        if (i < parts.length - 1) {
          out.push({ type: "break" });
        }
      });
    } else {
      transform(child);
      out.push(child);
    }
  }
  node.children = out;
}

export default function remarkObsidianBreaks() {
  return (tree) => transform(tree);
}
