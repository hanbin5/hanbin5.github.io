import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPublishedPosts, postHref } from "../lib/posts";

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
      description: p.data.dek ?? "",
      link: postHref(p),
      categories: [p.data.category, ...p.data.tags],
    })),
    customData: `<language>ko</language>`,
  });
}
