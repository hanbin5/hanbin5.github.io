/**
 * Closed enum of post categories (genre labels).
 * --------------------------------------------------------------------
 * Single source of truth — referenced by:
 *   - content/config.ts → schema validation (rejects values not in here)
 *   - pages/archive.astro → renders the category filter chips, in this
 *     declared order (so the UI is stable even when some categories
 *     happen to have zero posts at the moment)
 *
 * Lives in its own file (not in config.ts) because content/config.ts
 * imports from "astro:content" — a virtual module that's only resolvable
 * at certain stages of the build. Re-exporting plain runtime values
 * through that file forces every consumer to drag in the zod runtime,
 * which breaks page bundles. Keeping the constant pure here lets pages
 * import it safely.
 *
 * Adding / removing a category is a deliberate edit. After changing
 * this list, run `npm run build` once locally — any existing post that
 * carried a now-removed category will surface as a schema validation
 * error and you'll know exactly which file to update.
 */
export const CATEGORIES = ["Essay", "Note", "Log", "Review"] as const;
export type Category = (typeof CATEGORIES)[number];
