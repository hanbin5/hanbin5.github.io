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
  // Astro 4's contentLayer glob loader already strips the `.md` from
  // `id`, so this is just a bare-slug → URL transform. Trailing slash
  // omitted on purpose — Astro's static output works with or without
  // it, and consistency with the rest of the codebase wins.
  return `/posts/${p.id}`;
}

/**
 * Tiny English pluralizer. Centralized so headers / counts / chips
 * never disagree (the archive client JS already had this rule inline —
 * everywhere else used to hardcode the plural form).
 */
export function plural(n: number, singular: string, pluralForm?: string): string {
  return `${n} ${n === 1 ? singular : (pluralForm ?? singular + "s")}`;
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
