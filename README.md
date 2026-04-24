# hanbin5.github.io

My personal site. Built with [Jekyll](https://jekyllrb.com/) + the
[Minimal Mistakes](https://mmistakes.github.io/minimal-mistakes/) theme
(pulled as a remote theme, so GitHub Pages builds everything natively —
no GitHub Actions, no `gh-pages` branch).

## How to add content

- **Blog post:** create `_posts/YYYY-MM-DD-title.md` with a frontmatter
  block (see existing posts for the template).
- **Publication:** edit `_pages/publications.md`.
- **Project:** edit `_pages/projects.md`, or write a longer post under
  `_posts/` and link it from the projects page.
- **About page:** `_pages/about.md`.
- **Navigation (top bar):** `_data/navigation.yml`.

## Local preview (optional)

```bash
bundle install
bundle exec jekyll serve
```

Then open <http://localhost:4000>.

## Publishing

Just `git push`. GitHub Pages rebuilds in ~1 minute.
