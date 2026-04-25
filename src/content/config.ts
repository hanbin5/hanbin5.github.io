import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { CATEGORIES } from "./categories";

/**
 * Post schema.
 * --------------------------------------------------------------------
 * Obsidian frontmatter is forgiving — authors may omit optional fields
 * or use strings for dates. We coerce what we can, default the rest,
 * and reject only what would break rendering.
 *
 * Two axes of classification (intentionally orthogonal):
 *   - `category` is a closed enum of GENRE labels (one per post). What
 *     KIND of writing is this? Used as the 2nd-axis filter in /archive
 *     and as the small label on cards.
 *   - `tags[]` is open-ended PROJECT membership. tags[0] decides the
 *     home-page kanban column; remaining tags broaden archive filter
 *     matches. Tags get added/removed freely as projects evolve.
 *
 * Why category is closed but tags are open:
 *   - Genre is a small, stable space — fixing it prevents typo drift
 *     ("Essay" / "essay" / "Esay" each becoming a distinct value) and
 *     lets the filter UI list exactly what exists. Adding a category
 *     should be a deliberate edit to this file.
 *   - Project names are personal, ad-hoc, and grow over time. Forcing
 *     them through an enum would be friction.
 *
 * Relationship with sync-from-vault.sh:
 *   - `publish: true` is the gate the sync script checks when deciding
 *     whether to copy a note from the vault at all. Once the file is
 *     here, the field is irrelevant to the build, but we keep it on the
 *     schema so YAML-strict tools don't warn.
 *   - `draft: false` is required by the sync script (explicit opt-in).
 *     Build also honors `draft: true` as a final safety net — see
 *     lib/posts.ts::getPublishedPosts.
 */
const post = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./content/posts" }),
  schema: z.object({
    title:    z.string(),
    dek:      z.string().optional(),
    category: z.enum(CATEGORIES).default("Essay"),
    date:     z.coerce.date(),
    issue:    z.number().int().optional(),
    number:   z.string().optional(),            // e.g. "No. 012"
    readtime: z.string().optional(),            // e.g. "8분 분량"
    cover:    z.string().optional(),
    draft:    z.boolean().default(false),
    publish:  z.boolean().optional(),           // sync gate only; ignored at build
    // Tags double as DOM data attributes for the archive's client-side
    // filter. We forbid commas in tag strings so join/split round trips
    // stay safe. (We also serialize as JSON in the markup, but
    // belt-and-braces — schema-level rejection surfaces the typo at
    // build time, before it ever reaches a page.)
    tags:     z.array(
                z.string().refine(
                  (t) => !t.includes(","),
                  { message: "Tags must not contain commas." },
                ),
              ).default([]),
  }),
});

export const collections = { post };
