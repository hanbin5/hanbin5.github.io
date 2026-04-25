import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { CATEGORIES } from "./content/categories";

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
 *   - `draft: true` skips a note (sync-time and build-time both honor
 *     it — see lib/posts.ts::getPublishedPosts). Missing/empty draft is
 *     treated as not-draft.
 *
 * Frontmatter alias — `type` ≡ `category`:
 *   Older notes (and notes authored from other Obsidian templates) use
 *   `type:` to label the genre. We accept either spelling. The
 *   preprocess below copies `type` into `category` whenever `category`
 *   is absent, so the enum validator only ever sees one canonical
 *   field. New posts SHOULD prefer `category:` — `type:` is supported
 *   for compatibility, not encouraged.
 */
const post = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./content/posts" }),
  schema: z.preprocess(
    (raw) => {
      // Frontmatter is parsed into a plain object by Astro's loader.
      // If the author wrote `type:` instead of `category:`, alias it
      // before the enum validator runs. We don't drop `type` — the
      // object schema below ignores unknown keys (Zod default), so it
      // disappears naturally on validation.
      if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        const o = raw as Record<string, unknown>;
        if (o.category === undefined && o.type !== undefined) {
          return { ...o, category: o.type };
        }
      }
      return raw;
    },
    z.object({
      title:    z.string(),
      dek:      z.string().optional(),
      category: z.enum(CATEGORIES).default("Essay"),
      date:     z.coerce.date(),
      issue:    z.number().int().optional(),
      number:   z.string().optional(),            // e.g. "№ 012"
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
  ),
});

export const collections = { post };
