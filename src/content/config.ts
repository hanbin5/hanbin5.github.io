import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Post schema.
 * --------------------------------------------------------------------
 * Obsidian frontmatter is forgiving — authors may omit optional fields,
 * use strings for dates, pick any category spelling. We coerce what we
 * can, default the rest, and reject only what would break rendering.
 */
const post = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./content/posts" }),
  schema: z.object({
    title:    z.string(),
    dek:      z.string().optional(),
    category: z.string().default("Essay"),
    date:     z.coerce.date(),
    issue:    z.number().int().optional(),
    number:   z.string().optional(),          // e.g. "No. 012"
    readtime: z.string().optional(),          // e.g. "8 min"
    cover:    z.string().optional(),
    draft:    z.boolean().default(false),
    tags:     z.array(z.string()).default([]),
  }),
});

export const collections = { post };
