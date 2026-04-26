/**
 * remark-obsidian-math
 * ---------------------------------------------------------------------
 * In Obsidian, `$$ ... $$` is happy to live mid-paragraph:
 *
 *     ... s.t. $$
 *     p(A | S) ...
 *     $$
 *     and you put all information in $S$ ...
 *
 * remark-math (and the underlying micromark-extension-math) only
 * recognises display math when `$$` sits on its own line with blank
 * lines around it. Mid-paragraph `$$` gets parsed as inline math and
 * then greedily consumes everything until the next `$$` it can find —
 * which in practice swallows the rest of the document and produces a
 * giant `katex-error` blob.
 *
 * `fixObsidianMath(src)` is a string-level pre-processor that finds
 * every `$$ ... $$` span and reflows it so the opening and closing
 * `$$` each sit alone on a line, with a blank line above and below.
 *
 * Two correctness-preserving rules:
 *
 *   1. Already-well-formed blocks are LEFT VERBATIM. A block is
 *      well-formed if the line containing the opening `$$` has only
 *      whitespace (or blockquote `>` markers) before it, and the line
 *      containing the closing `$$` has only whitespace after it.
 *      This makes the function idempotent — running it twice on the
 *      same file produces no further changes — and protects math that
 *      already lives correctly inside a `> [!note]` callout.
 *
 *   2. Math reflowed from inside a blockquote keeps its `> ` prefix on
 *      every output line, so callout-internal `$$ ... $$` survives
 *      the rewrite without escaping the callout.
 *
 * Fenced code blocks and YAML frontmatter are skipped entirely so we
 * never touch verbatim regions that happen to contain `$` literals.
 */

const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n/;
const FENCED_CODE_RE = /^(```|~~~)[^\n]*\n[\s\S]*?\n\1\s*$/m;

function preprocess(src) {
  let out = "";
  let i = 0;

  // Frontmatter — copy verbatim.
  const fm = src.match(FRONTMATTER_RE);
  if (fm && fm.index === 0) {
    out += fm[0];
    i = fm[0].length;
  }

  // Walk segments, copying fenced blocks verbatim and reflowing math
  // only in prose segments.
  while (i < src.length) {
    const rest = src.slice(i);
    const fence = rest.match(FENCED_CODE_RE);
    if (fence) {
      out += fixMath(rest.slice(0, fence.index));
      out += fence[0];
      i += fence.index + fence[0].length;
    } else {
      out += fixMath(rest);
      break;
    }
  }
  return out;
}

/**
 * Detect the blockquote nesting prefix at the start of a line —
 * `> `, `> > `, etc. Returns the prefix string (possibly empty).
 */
function blockquotePrefix(line) {
  const m = line.match(/^([\s]*(?:>[\s]?)+)/);
  return m ? m[1] : "";
}

function fixMath(chunk) {
  let result = "";
  let i = 0;

  while (i < chunk.length) {
    const open = chunk.indexOf("$$", i);
    if (open === -1) {
      result += chunk.slice(i);
      break;
    }
    const close = chunk.indexOf("$$", open + 2);
    if (close === -1) {
      // Unbalanced `$$` — copy the rest verbatim.
      result += chunk.slice(i);
      break;
    }

    // Look at the line context for both delimiters.
    const openLineStart = chunk.lastIndexOf("\n", open - 1) + 1;
    const openLinePrefix = chunk.slice(openLineStart, open);

    const closeLineEnd = (() => {
      const n = chunk.indexOf("\n", close + 2);
      return n === -1 ? chunk.length : n;
    })();
    const closeLineSuffix = chunk.slice(close + 2, closeLineEnd);

    const openIsAtLineStart = /^[ \t]*(?:>[ \t]?)*[ \t]*$/.test(openLinePrefix);
    const closeIsAtLineEnd = /^[ \t]*$/.test(closeLineSuffix);

    if (openIsAtLineStart && closeIsAtLineEnd) {
      // Already well-formed (possibly inside a blockquote). Copy
      // verbatim including the trailing newline so subsequent passes
      // through this loop start on a fresh line.
      result += chunk.slice(i, closeLineEnd);
      i = closeLineEnd;
      continue;
    }

    // ---- needs reflow ------------------------------------------------
    const before = chunk.slice(i, open);
    let body = chunk.slice(open + 2, close);
    const after = chunk.slice(close + 2);

    // Determine the blockquote prefix from the opening line. If the
    // opening line begins with `> ` (any depth), preserve that prefix
    // on the reflowed math. Otherwise the math escapes the callout.
    const bqPrefix = blockquotePrefix(openLinePrefix);
    const trimmedBqPrefix = bqPrefix.trimEnd(); // e.g. ">" without the trailing space

    // Strip blockquote prefixes from the body lines (we'll re-add them
    // on output if needed). Also strip leading/trailing blank lines.
    body = body
      .replace(/^[ \t]*>[ \t]?/gm, "")
      .replace(/^\s*\n/, "")
      .replace(/\n\s*$/, "");

    // Emit the prefix-stripped portion of `before`, then the math
    // block, then the (still-following) text. We always insert blank
    // lines around the math so the parser sees a real block.
    result += before.replace(/[ \t]+$/, ""); // trim trailing inline whitespace

    // Ensure a blank line precedes the math.
    if (bqPrefix) {
      // Inside a blockquote: a "blank line" is a line that contains
      // only the bq marker (e.g. `>\n`).
      if (!result.endsWith("\n")) result += "\n";
      if (!result.endsWith("\n" + trimmedBqPrefix + "\n")) {
        result += trimmedBqPrefix + "\n";
      }
    } else {
      if (!result.endsWith("\n\n")) {
        result += result.endsWith("\n") ? "\n" : "\n\n";
      }
    }

    // Emit math, line-prefixed if inside a blockquote.
    const prefix = bqPrefix ? bqPrefix : "";
    const linePrefix = bqPrefix
      ? // Use just `> ` (depth-1) for the math content so it's
        // unambiguous; deeper nesting is uncommon and the prefix
        // detection above is already conservative.
        "> "
      : "";
    result += `${linePrefix}$$\n`;
    for (const line of body.split("\n")) {
      result += `${linePrefix}${line}\n`;
    }
    result += `${linePrefix}$$\n`;
    if (bqPrefix) result += `${trimmedBqPrefix}\n`;
    else result += "\n";

    // Eat any leading blank-with-bq-marker lines from `after` so we
    // don't double up blank rows.
    let j = 0;
    while (j < after.length) {
      const nl = after.indexOf("\n", j);
      const lineEnd = nl === -1 ? after.length : nl + 1;
      const line = after.slice(j, lineEnd);
      if (/^[ \t]*(?:>[ \t]?)*[ \t]*\n?$/.test(line) && line.trim() !== ">") {
        j = lineEnd;
      } else {
        break;
      }
    }
    i = close + 2 + j;
  }

  return result;
}

export default function remarkObsidianMath() {
  // Astro / unified plugins run on the AST after parsing, so we can't
  // truly preprocess raw markdown from inside a remark plugin. The
  // canonical entry point is `fixObsidianMath` (re-exported below),
  // invoked by `scripts/normalize-content.mjs` at prebuild time.
  //
  // The plugin form is kept as a no-op transformer so astro.config.mjs
  // can list it for documentation without breaking the build if the
  // pre-build step was skipped.
  return () => undefined;
}

export { preprocess as fixObsidianMath };
