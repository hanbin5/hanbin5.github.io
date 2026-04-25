import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPublishedPosts, postHref } from "../lib/posts";

/**
 * Build a one-line summary from the post's markdown body when the
 * frontmatter doesn't supply a `dek`. Without this, RSS readers see
 * just the title — RFC-wise the <description> is supposed to carry
 * either the full content or a summary.
 *
 * The transform is deliberately conservative: drop fenced code, drop
 * setext/atx headings, strip basic markdown punctuation, collapse
 * whitespace, then truncate to ~200 chars on a word boundary. We do
 * NOT try to render markdown to HTML — that would inflate the feed
 * payload and re-introduce HTML to a field that used to be plain text.
 */
function summaryFromBody(body: string | undefined, max = 200): string {
  if (!body) return "";
  const stripped = body
    .replace(/```[\s\S]*?```/g, " ")    // fenced code blocks
    .replace(/`[^`]*`/g, " ")           // inline code
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1") // links → text
    .replace(/^#{1,6}\s+/gm, "")        // ATX headings
    .replace(/^\s*[-*+]\s+/gm, "")      // list bullets
    .replace(/\*\*|__|[*_~>]/g, "")     // emphasis / quote markers
    .replace(/\s+/g, " ")
    .trim();
  if (stripped.length <= max) return stripped;
  const cut = stripped.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();
  return rss({
    title: "HANBIN — A Journal",
    description: "정리 중인 생각을 위한 작은 공간.",
    site: context.site ?? "https://hanbin5.github.io",
    items: posts.map((p) => ({
      // RSS <title> is plain text — strip any author <em>/<strong> markup.
      title: p.data.title.replace(/<[^>]+>/g, ""),
      pubDate: p.data.date,
      description: p.data.dek ?? summaryFromBody(p.body),
      link: postHref(p),
      categories: [p.data.category, ...p.data.tags],
    })),
    customData: `<language>ko</language>`,
  });
}
