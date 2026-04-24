import { getCollection, type CollectionEntry } from "astro:content";

/**
 * Shared helpers for querying posts. Centralized so that:
 *   - "exclude drafts" logic lives in one place
 *   - sort order is consistent everywhere
 *   - each cell of the magazine can derive its display strings the same way
 */

export type Post = CollectionEntry<"post">;

export async function getPublishedPosts(): Promise<Post[]> {
  const all = await getCollection("post");
  return all
    .filter((p) => !p.data.draft)
    .sort(
      (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
    );
}

export function shortDate(d: Date): string {
  // "04.18"
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function longDate(d: Date): string {
  // "2026.04.18"
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function postHref(p: Post): string {
  return `/posts/${p.id.replace(/\.md$/, "")}`;
}

/**
 * Derive a display "number" for a post.
 * If the frontmatter supplies `number` use it; otherwise generate
 * "№ 001" style from the post's chronological rank.
 */
export function postNumber(p: Post, rankFromOldest: number): string {
  if (p.data.number) return p.data.number;
  return `No. ${String(rankFromOldest).padStart(3, "0")}`;
}
