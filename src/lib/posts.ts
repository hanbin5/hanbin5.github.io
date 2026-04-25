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
  // The glob loader strips the `.md` from `id`, so this is just a
  // bare-slug → URL transform.
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
 * Build the chronological rank index. Posts are numbered from the
 * oldest forward, so a post's № stays put when newer posts get added —
 * the page-level slice/filter can change without renumbering anything.
 */
export function buildRankById(posts: Post[]): Map<string, number> {
  const oldestFirst = [...posts].reverse();
  const rankById = new Map<string, number>();
  oldestFirst.forEach((p, i) => rankById.set(p.id, i + 1));
  return rankById;
}

/**
 * Derive a display "number" for a post — "№ 001" style, prefix
 * included. If the frontmatter supplies a literal `number` (e.g.
 * "№ 012"), it wins.
 */
export function postNumber(p: Post, rankFromOldest: number): string {
  if (p.data.number) return p.data.number;
  return `№ ${String(rankFromOldest).padStart(3, "0")}`;
}
