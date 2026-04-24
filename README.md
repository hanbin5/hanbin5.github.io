# hanbin5.github.io

Personal journal site — **HANBIN · A Journal**.

This is a plain static HTML site. No Jekyll, no build step. `index.html` is
hand-authored with embedded CSS; GitHub Pages serves it as-is (the
`.nojekyll` file in the root tells GitHub not to try to "build" anything).

## How to edit

Everything lives in **`index.html`**. Sections are clearly commented:

- `<!-- TOP BAR -->`
- `<!-- MASTHEAD -->` — the big "HANBIN" name plate
- `<!-- HERO STORY -->` — this issue's cover piece
- `<!-- EDITOR'S NOTE BAND -->` — gray pullquote band
- `<!-- IN THIS ISSUE -->` — 6-article grid
- `<!-- LONGFORM + DEPARTMENTS -->` — feature essay + sidebar
- `<!-- ARCHIVE -->` — full list of past essays
- `<!-- FOOTER -->` — blue footer with links

### Add a new article to the grid

Inside `<div class="grid-3">`, copy one of the `<article class="article">`
blocks and edit the fields (category, date, No., title, dek, read-time).
Keep the grid in groups of 3 for the desktop layout to tile cleanly.

### Add a row to the archive

Inside `<div class="archive-list">`, copy an `<div class="archive-row">`
block and fill in idx/date/title/category/read fields.

### Change colors / typography

Top of the `<style>` block — edit CSS variables under `:root`:

- `--accent` — primary blue (royal blue used in footer and highlights)
- `--accent-bright` — lighter blue for kickers
- `--serif`, `--sans`, `--mono` — font stacks

Fonts come from Google Fonts (Fraunces / Inter / JetBrains Mono / Nanum Myeongjo);
the `<link>` in `<head>` loads them.

## Local preview

Open `index.html` in a browser. That's it — no server needed for a quick look.

For a local HTTP server (to test relative paths, etc.):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Publishing

```bash
git add .
git commit -m "Update"
git push
```

GitHub Pages redeploys in ~1 minute.
