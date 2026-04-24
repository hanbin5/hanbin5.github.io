# hanbin5.github.io — HANBIN · A Journal

Personal magazine-style journal, built with **Astro** and deployed to GitHub Pages.

> Legacy single-file site preserved as `index.legacy.html` until the
> Astro build is verified on production.

## What lives where

```
hanbin5.github.io/
├── content/
│   ├── posts/         ← one .md per essay (frontmatter-driven)
│   ├── concepts/      ← (synced from Obsidian vault)
│   ├── projects/      ← (synced from Obsidian vault)
│   └── repo-only/     ← never touched by sync scripts
├── src/
│   ├── content.config.ts      Zod schema for posts
│   ├── layouts/               JournalLayout, PostLayout, BaseHead
│   ├── components/            Masthead, HeroStory, ArticleCard, …
│   ├── pages/                 index.astro, archive.astro, posts/[...slug]
│   ├── lib/posts.ts           shared query helpers
│   └── styles/
│       ├── tokens.css         CAU palette + semantic roles
│       ├── newsprint.css      magazine/newspaper layout
│       └── prose.css          article reading view
├── scripts/sync-from-vault.sh
├── .github/workflows/deploy.yml
├── astro.config.mjs
└── REFACTOR_PLAN.md
```

## Writing a new post

Two ways:

### 1. Directly in this repo

Create `content/posts/YYYY-MM-DD-slug.md`:

```md
---
title: "제목"
dek: "부제"
category: "Essay"
date: 2026-05-01
issue: 5
readtime: "6분 분량"
tags: [foo, bar]
draft: false
---

본문. **마크다운**과 $LaTeX$ 수식 전부 지원됩니다.

$$
E = mc^2
$$
```

### 2. From your Obsidian vault

Write in the vault's public folders (`60_Writing/64_Blog`, `20_Concepts`,
`40_Projects/44_Public`). Then from this repo:

```bash
npm run sync      # mirrors vault → content/
npm run dev       # preview at http://localhost:4321
# or
npm run sync:dev  # both in one command
```

Drafts (`draft: true`) are stripped automatically during sync.

## Local development

```bash
npm install
npm run dev
```

## Deployment

`git push` to `main` triggers `.github/workflows/deploy.yml`:

1. `npm ci`
2. `npm run build`
3. Upload `dist/` as the Pages artifact and deploy.

## Math

Rendered with **KaTeX** via `remark-math` + `rehype-katex`. MathJax syntax
is largely compatible. A few caveats:

- `\label` / `\ref` are limited — use `\tag{}` for numbered equations.
- `\require{AMS}` can be deleted (AMS is built-in).
- Add custom macros in `astro.config.mjs` under `rehypeKatex > macros`.

## Colors

Design tokens in `src/styles/tokens.css` use the official **CAU** palette:

| Token              | Hex       | Pantone  |
|--------------------|-----------|----------|
| `--cau-blue`       | `#2155A4` | 2945 C   |
| `--cau-red`        | `#EF3340` | 032  C   |
| `--cau-gray`       | `#666666` | Cool 8   |
| `--cau-light-gray` | `#E6E6E6` | 427  C   |
| `--cau-silver`     | `#8A8D8F` | 877  C   |
| `--cau-gold`       | `#B08D57` | 873  C   |
