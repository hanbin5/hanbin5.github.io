/**
 * remark-obsidian-callouts
 * ---------------------------------------------------------------------
 * Obsidian's callout syntax is a blockquote whose first line is
 * `[!type] optional title` (with an optional `+`/`-` fold marker after
 * the type). The whole blockquote then renders as a coloured panel with
 * an icon and the title set in bold above the body.
 *
 *     > [!note] Markov
 *     > A state $s_t$ is **Markov** if and only if ...
 *
 * Standard CommonMark sees the same source as a plain blockquote with
 * literal `[!note] Markov` text at the top. This plugin runs after
 * remark-parse, walks every blockquote, detects the `[!type] title`
 * marker, strips it, and rewrites the node so remark-rehype emits
 *
 *     <div class="callout callout-note" data-callout="note">
 *       <div class="callout-title">Markov</div>
 *       <div class="callout-body"> ...original body... </div>
 *     </div>
 *
 * Styling lives in prose.css. The plugin only knows about structure and
 * type names; colours and icons are entirely a CSS concern.
 *
 * Why mutate the AST instead of emitting raw HTML? Inner blockquote
 * children stay as mdast nodes so KaTeX, links, code spans, and any
 * other downstream remark/rehype plugins keep working inside callouts.
 */
const TYPE_RE = /^\[!([A-Za-z][\w-]*)\][+\-]?\s*(.*?)\s*$/;

function visitBlockquotes(node, fn) {
  if (!node) return;
  if (node.type === "blockquote") fn(node);
  if (node.children) {
    for (const child of node.children) visitBlockquotes(child, fn);
  }
}

function defaultTitle(type) {
  // Capitalise — "note" → "Note", "tldr" → "Tldr".
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

export default function remarkObsidianCallouts() {
  return (tree) => {
    visitBlockquotes(tree, (node) => {
      const first = node.children?.[0];
      if (!first || first.type !== "paragraph" || first.children.length === 0) return;

      // The marker lives in the very first text node of the first
      // paragraph. We split that text node on its first newline so the
      // remainder of that line becomes the title and anything after the
      // newline stays as body text.
      const firstText = first.children[0];
      if (firstText.type !== "text") return;

      const newlineAt = firstText.value.indexOf("\n");
      const headLine =
        newlineAt === -1 ? firstText.value : firstText.value.slice(0, newlineAt);
      const tailLine =
        newlineAt === -1 ? "" : firstText.value.slice(newlineAt + 1);

      const m = headLine.match(TYPE_RE);
      if (!m) return;

      const type = m[1].toLowerCase();
      const title = m[2] || defaultTitle(type);

      // Strip the marker from the first text node. If the marker
      // consumed the whole line and the paragraph had no further
      // content, drop the now-empty paragraph entirely.
      if (tailLine.length === 0) {
        first.children.shift();
        if (first.children.length === 0) {
          node.children.shift();
        } else {
          // Drop a leading line break left over from the split so the
          // body doesn't begin with whitespace.
          const head = first.children[0];
          if (head?.type === "text") head.value = head.value.replace(/^\n+/, "");
        }
      } else {
        firstText.value = tailLine;
      }

      // Wrap remaining children in a "callout-body" div so the title
      // and the body are siblings under the outer callout. Without
      // this wrapper, the body paragraphs would render flush against
      // the title and styling becomes brittle.
      const bodyChildren = node.children;
      const body = {
        type: "paragraph", // overridden via hName below
        data: {
          hName: "div",
          hProperties: { className: ["callout-body"] },
        },
        children: bodyChildren,
      };

      const titleNode = {
        type: "paragraph",
        data: {
          hName: "div",
          hProperties: { className: ["callout-title"] },
        },
        children: [{ type: "text", value: title }],
      };

      node.children = [titleNode, body];
      node.data = node.data || {};
      node.data.hName = "div";
      node.data.hProperties = {
        className: ["callout", `callout-${type}`],
        "data-callout": type,
      };
    });
  };
}
