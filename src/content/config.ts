import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Post schema.
 * --------------------------------------------------------------------
 * Obsidian frontmatter is forgiving — authors may omit optional fields,
 * use strings for dates, pick any category spelling. We coerce what we
 * can, default the rest, and reject only what would break rendering.
 *
 * Relationship with sync-from-vault.sh:
 *   - `publish: true` is the gate the sync script checks when deciding
 *     whether to copy a note from the vault at all. Once the file is
 *     here, the field is irrelevant to the build, but we keep it on the
 *     schema so YAML-strict tools don't warn.
 *   - `draft: true` is respected by the build too — see
 *     lib/posts.ts::getPublishedPosts. Safety net for drafts that slip
 *     past the sync.
 *   - `tags[0]` is the PRIMARY project (decides the kanban column).
 *     Additional tags match in the archive's project filter.
 */
const post = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./content/posts" }),
  schema: z.object({
    title:    z.string(),
    dek:      z.string().optional(),
    category: z.string().default("Essay"),
    date:     z.coerce.date(),
    issue:    z.number().int().optional(),
    number:   z.string().optional(),            // e.g. "No. 012"
    readtime: z.string().optional(),            // e.g. "8분 분량"
    cover:    z.string().optional(),
    draft:    z.boolean().default(false),
    publish:  z.boolean().optional(),           // sync gate only; ignored at build
    tags:     z.array(z.string()).default([]),
  }),
});

export const collections = { post };
