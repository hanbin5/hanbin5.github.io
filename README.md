# hanbin5.github.io — HANBIN · A Journal

Personal CV-oriented journal, built with **Astro** and deployed to GitHub Pages.
Obsidian vault → repo via tag-based publishing.

> Legacy single-file site preserved as `index.legacy.html` until the
> Astro build has been verified on production. Safe to delete after.

---

## What lives where

```
hanbin5.github.io/
├── content/
│   ├── posts/          ← synced from Obsidian (publish: true)
│   └── repo-only/      ← authored here, never touched by sync
├── obsidian-templates/
│   ├── post.md         ← frontmatter template for new posts
│   └── README.md       ← authoring guide (publish model, tags, KaTeX)
├── src/
│   ├── content/config.ts       Zod schema
│   ├── layouts/                JournalLayout, PostLayout, BaseHead
│   ├── components/             Masthead, HeroStory, Footer, TopBar, …
│   ├── pages/                  index (kanban), archive, about, posts/[...slug]
│   ├── lib/posts.ts            shared query helpers
│   └── styles/
│       ├── tokens.css          CAU palette + semantic tokens
│       ├── newsprint.css       magazine/newspaper layout + kanban
│       └── prose.css           post reading view
├── scripts/sync-from-vault.sh  Vault → content/posts (tag-based)
├── .github/workflows/deploy.yml
├── astro.config.mjs
└── REFACTOR_PLAN.md
```

---

## Home page layout

```
┌──────────────────────────────────────────────────────────┐
│  HANBIN (topbar with Archive · About · Contact)           │
│                                                           │
│  ┌──────────── Hero ────────────┐                         │
│  │  Latest post as cover story  │                         │
│  └──────────────────────────────┘                         │
│                                                           │
│  § 01  Projects Board  (kanban — primary view)           │
│    ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│    │ project1 │ │ project2 │ │ project3 │  ← columns     │
│    │  card    │ │  card    │ │  card    │                │
│    │  card    │ │  card    │ │          │  ← chrono ↓    │
│    │  +3 more │ │          │ │          │                │
│    └──────────┘ └──────────┘ └──────────┘                │
│                                                           │
│  § 02  The Archive  (timeline preview)                   │
│    № 009 · 2026.04.24 · 도구가 나의...                     │
│    № 008 · 2026.04.18 · 작은 스프레드시트...               │
│    ... [전체 보기 →]                                      │
└──────────────────────────────────────────────────────────┘
```

Two orthogonal views of the same corpus — project (kanban) × time
(timeline). The archive page offers a project-filter too, so
`/archive?tag=slam-research` deep-links filtered views.

---

## Writing a new post

**Two paths, same contract.**

### Path A — From Obsidian (recommended)

1. Insert the template at `obsidian-templates/post.md` (or copy it to
   your Obsidian templates folder).
2. Fill the frontmatter; **set `publish: true`** when ready to publish.
3. In the repo:

```bash
npm run sync        # Vault → content/posts, filtered by `publish: true`
npm run dev         # preview at http://localhost:4321
# or
npm run sync:dev    # sync + dev in one step
```

Read `obsidian-templates/README.md` for the full authoring guide —
frontmatter fields, tag/project convention, image handling, KaTeX gotchas.

### Path B — Directly in this repo

Create `content/posts/YYYY-MM-DD-slug.md`:

```md
---
title: "제목"
date: 2026-05-01
dek: "부제"
category: "Essay"        # one of: Essay | Note | Log | Review (default: Essay)
readtime: "6분 분량"
tags: [project-name]
draft: false
publish: true
---

본문. **마크다운**과 $LaTeX$ 수식 전부 지원.
```

### Publish model

Publishing is gated by **two booleans** at the note level, not a folder move:

| frontmatter                      | result                                                      |
|----------------------------------|-------------------------------------------------------------|
| `publish: false` (or missing)    | stays in vault only                                         |
| `publish: true` + `draft: false` | synced to site on next `npm run sync`                       |
| `publish: true` + `draft: true`  | sync skips it (draft override)                              |
| `publish: true` + draft missing  | sync skips it — explicit `draft: false` is required opt-in  |

Vault organization (daily notes, research, drafts) is independent of
what's public.

### Project model (tags)

Project = first tag. Example:

```yaml
tags: [slam-research]                  # kanban column: slam-research
tags: [slam-research, kalman-study]    # column: slam-research, archive filters match both
tags: []                               # column: (unclassified)
```

Kanban caps each column at **5 cards** — overflow becomes
`+N more in this project →` linking to `/archive?tag=slam-research` with
the filter pre-activated.

### Category model (genre)

Category is a closed enum — adding a new value is a deliberate edit to
`src/content/config.ts` (`CATEGORIES`), not a free-form string. This
prevents typo drift and lets the archive filter list exactly what exists.

| Category | Use it for                                                   |
|----------|--------------------------------------------------------------|
| `Essay`  | Long-form thinking, argument-shaped writing (default)        |
| `Note`   | Learning notes — what you wrote to teach yourself            |
| `Log`    | Work / experiment / reading logs — time-stamped artifacts    |
| `Review` | Reviews of papers, books, tools — reactive writing           |

`/archive` exposes Category alongside Project as a second filter axis
(AND-combined). Deep link both at once:
`/archive?tag=slam-research&category=Note`.

---

## Local development

```bash
npm install
npm run dev         # http://localhost:4321
npm run build       # produces dist/
npm run preview     # serve dist/ locally
```

## Deployment

`git push` to `main` triggers `.github/workflows/deploy.yml`:

1. `npm ci`
2. `npm run build`
3. Upload `dist/` as the Pages artifact and deploy.

## Math

Rendered with **KaTeX** via `remark-math` + `rehype-katex`. MathJax
syntax is largely compatible:

- `$inline$`, `$$block$$`, `\begin{align}` — identical.
- `\label` / `\ref` — limited; use `\tag{}` for numbered equations.
- `\require{AMS}` — unnecessary; AMS is built-in.
- Shared macros (e.g. `\RR`, `\NN`, `\ZZ`) live in `astro.config.mjs`
  under `rehypeKatex > macros`.

## Colors

Design tokens in `src/styles/tokens.css` follow the official **CAU**
palette:

| Token              | Hex       | Pantone  |
|--------------------|-----------|----------|
| `--cau-blue`       | `#2155A4` | 2945 C   |
| `--cau-red`        | `#EF3340` | 032  C   |
| `--cau-gray`       | `#666666` | Cool 8   |
| `--cau-light-gray` | `#E6E6E6` | 427  C   |
| `--cau-silver`     | `#8A8D8F` | 877  C   |
| `--cau-gold`       | `#B08D57` | 873  C   |

`--accent` (primary link / footer / section numbers) = `--cau-blue`.

---

## Scaling roadmap

As the site grows, enable these in order:

- **Tier 1 (now)** — kanban card cap + archive deep-link filter.
  Already implemented.
- **Tier 2 (10+ projects)** — activate `ACTIVITY_WINDOW_DAYS` in
  `src/pages/index.astro` to fold dormant projects into an accordion;
  add `pinned: true` frontmatter override.
- **Tier 3 (20+ projects)** — generate `/projects/[tag]` per-project
  pages; switch kanban to horizontal scroll with snap points.

## Harmless leftovers

Safe to delete when convenient (not required):

- `index.legacy.html` — original single-file site for comparison.
- `src/components/Longform.astro` — orphan after Longform section removal.
- `src/components/ArticleCard.astro` — orphan after kanban migration;
  kept as potential scaffold for future tag pages.
- `.grid-3` / `.article` CSS rules in `newsprint.css` — paired with
  ArticleCard above.
