# HANBIN — A Journal · 리팩토링 설계서

> 버전 v0.1 · 2026-04-24
> 저자 관점(Feynman 스타일)으로 "왜 이렇게 하는지"를 먼저 설명한다.

---

## 1. 왜 리팩토링 해야 하는가 — 문제 정의

지금의 `index.html`은 851줄 중 500줄 이상이 `<style>` 블록이다.
즉 **콘텐츠(글), 레이아웃(뼈대), 스타일(외형), 설정(메타)** 네 가지가
한 파일에 녹아 있다.

왜 문제인가? 한 가지 축만 바꾸고 싶어도 네 축이 엉켜 있어서 편집이 "수술"이
된다. 예를 들어 새 글을 올리려면 `<article class="article">` 블록을 통째로
복제-수정해야 하는데, 이는 **콘텐츠를 "데이터"가 아니라 "DOM 조각"으로**
다루고 있기 때문이다. 데이터라면 엑셀의 한 행처럼 추가하면 되지만, DOM
조각이라면 HTML 문법/클래스 이름/카드 간 간격까지 사람이 책임져야 한다.

리팩토링의 본질은 딱 하나다: **"글은 데이터, 디자인은 템플릿"으로 분리한다.**
그러면 글을 올리는 행위와 디자인을 바꾸는 행위가 서로 영향을 주지 않게 된다.

---

## 2. 목표

1. 글은 마크다운(`.md`) 파일로 관리 — Obsidian Vault와 리포 `content/` 둘 다 지원.
2. 빌드는 Astro가 담당 — 기존 신문/잡지 디자인은 그대로 포팅.
3. 수식은 KaTeX로 서버사이드 렌더링(MathJax 문법 호환).
4. 배포는 지금처럼 `git push` → GitHub Pages 자동 업데이트. 별도 서버 없음.

---

## 3. 전체 아키텍처 한 장 요약

```
┌─────────────────────────────┐        ┌─────────────────────────────┐
│   Obsidian Vault (iCloud)   │        │   hanbin5.github.io (repo)  │
│                             │        │                             │
│  20_Concepts/               │  sync  │  content/                   │
│  60_Writing/64_Blog/   ─────┼───────►│   posts/*.md                │
│  40_Projects/44_Public/     │        │   concepts/*.md             │
│                             │        │   projects/*.md             │
└─────────────────────────────┘        │                             │
                                       │  src/                       │
                                       │   content.config.ts         │
                                       │   layouts/                  │
                                       │    JournalLayout.astro      │
                                       │    PostLayout.astro         │
                                       │   pages/                    │
                                       │    index.astro   ◄── 잡지 홈 │
                                       │    posts/[slug].astro       │
                                       │    archive.astro            │
                                       │   components/               │
                                       │    Masthead.astro           │
                                       │    HeroStory.astro          │
                                       │    ArticleCard.astro        │
                                       │    ArchiveRow.astro         │
                                       │    Footer.astro             │
                                       │                             │
                                       │  public/            (정적)   │
                                       │  astro.config.mjs            │
                                       │  scripts/sync-from-vault.sh  │
                                       └──────────────┬──────────────┘
                                                      │ git push
                                                      ▼
                                       ┌─────────────────────────────┐
                                       │   GitHub Actions            │
                                       │   npm run build             │
                                       │   → deploy /dist to Pages   │
                                       └─────────────────────────────┘
```

---

## 4. 디자인 토큰 (CAU 공식 팔레트 반영)

현재 사이트의 `--accent: #1e4ba8`는 CAU Blue(#2155A4)와 거의 같다.
공식 색으로 맞추면서 신문 톤도 유지한다.

```css
:root {
  /* --- 중앙대 공식 팔레트 --- */
  --cau-blue:       #2155A4;  /* Pantone 2945C */
  --cau-red:        #EF3340;  /* Pantone 032C  */
  --cau-gray:       #666666;  /* Cool Gray 8   */
  --cau-light-gray: #E6E6E6;  /* Pantone 427C  */
  --cau-silver:     #8A8D8F;  /* Pantone 877C  */
  --cau-gold:       #B08D57;  /* Pantone 873C  */

  /* --- 시맨틱 (역할) 토큰 --- */
  --paper:        #ffffff;
  --ink:          #111114;
  --muted:        var(--cau-gray);
  --line:         #111114;
  --line-soft:    var(--cau-light-gray);
  --accent:       var(--cau-blue);      /* 링크·푸터·섹션 번호 */
  --accent-bright:#2e7fe3;              /* kickers — CAU Blue 20% lighten */
  --band:         #dcdee3;              /* 잡지 밴드 배경 */
  --highlight:    #e8efff;              /* 인용/강조 밴드 */
  --danger:       var(--cau-red);       /* 긴급/경고(거의 안 씀) */

  /* --- 타이포 --- */
  --serif: "Fraunces", "Nanum Myeongjo", ui-serif, Georgia, serif;
  --sans:  "Inter", -apple-system, "Apple SD Gothic Neo", sans-serif;
  --mono:  "JetBrains Mono", ui-monospace, Menlo, monospace;
}
```

> 핵심: CAU Blue를 `--accent`로 승격. 기존 모든 `var(--accent)` 참조는
> 그대로 두고 정의만 교체하면 되므로 비용 0에 브랜드 반영.

---

## 5. 콘텐츠 스키마 (Astro Content Collection)

`src/content.config.ts`:

```ts
import { defineCollection, z } from "astro:content";

const post = defineCollection({
  type: "content",
  schema: z.object({
    title:       z.string(),
    dek:         z.string().optional(),            // 부제목
    category:    z.enum(["Essay", "Note", "Research", "Review"]),
    date:        z.coerce.date(),
    issue:       z.number().int().optional(),      // Vol. 1 No. 7
    readtime:    z.string().optional(),            // "8 min"
    cover:       z.string().optional(),
    draft:       z.boolean().default(false),
    tags:        z.array(z.string()).default([]),
  }),
});
export const collections = { post };
```

Obsidian 글의 frontmatter 예:

```md
---
title: 칼만 필터의 직관
dek: 불확실성을 어떻게 "줄여나가는가"
category: Research
date: 2026-04-20
issue: 7
readtime: 12 min
tags: [robotics, estimation]
draft: false
---

$$
\hat{x}_{k|k} = \hat{x}_{k|k-1} + K_k (z_k - H \hat{x}_{k|k-1})
$$
```

`draft: true`인 글은 빌드 시 자동 제외. 현재 `publish.sh`의 draft 필터 로직을
Astro collection filter로 옮긴다.

---

## 6. 자동화 파이프라인

### 6.1 Obsidian → content/ 동기화 (`scripts/sync-from-vault.sh`)

기존 `~/Lab/quartz/publish.sh` 로직 재활용:

- Vault의 `20_Concepts`, `60_Writing/64_Blog`, `40_Projects/44_Public`을
  각각 `content/concepts/`, `content/posts/`, `content/projects/`로 rsync.
- `.obsidian`, `.trash`, `*.canvas`, `templates`, `.DS_Store` 제외.
- 리포 content/에 직접 쓴 글은 보존(sync 전 임시 백업).

### 6.2 로컬 미리보기

```bash
npm run dev         # astro dev, http://localhost:4321
npm run sync        # Vault → content/ 동기화
npm run sync:dev    # sync + dev
```

### 6.3 배포 (GitHub Actions)

`.github/workflows/deploy.yml` — push to `main` 시 Astro 빌드 후
`/dist`를 `gh-pages` 브랜치(또는 Pages built-in)로 publish.

---

## 7. 수식 렌더링 — MathJax에서 KaTeX로

Astro에서는 `remark-math` + `rehype-katex` 조합이 사실상 표준.
`astro.config.mjs`:

```js
import { defineConfig } from "astro/config";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export default defineConfig({
  site: "https://hanbin5.github.io",
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [[rehypeKatex, { strict: false, throwOnError: false }]],
  },
});
```

포스트 레이아웃의 `<head>`에 KaTeX CSS 한 번만 로드:

```html
<link rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
```

**MathJax 호환 체크리스트** — 현재 MathJax 문법 중 KaTeX에서 조심할 것:

| 기능                | MathJax | KaTeX | 대응 |
|---------------------|---------|-------|------|
| `$...$`, `$$...$$` | O       | O     | 동일 |
| `\begin{align}`     | O       | O     | 동일 |
| `\label` / `\ref`  | O       | 부분  | `\tag{}`로 대체 |
| `\require{AMS}`    | O       | 기본  | 삭제 OK |
| 매크로 `\newcommand` | O     | O     | 동일 |
| 복잡한 commutative diagram | O | 일부 | 필요 시 이미지 |

대부분의 개인 블로그 수식은 전부 커버된다.

---

## 8. 신문 디자인 포팅 매핑

현재 `index.html` 섹션 → Astro 컴포넌트:

| 현재 마크업                         | 새 컴포넌트                    |
|-------------------------------------|--------------------------------|
| `<!-- TOP BAR -->`                  | `components/TopBar.astro`      |
| `<!-- MASTHEAD -->`                 | `components/Masthead.astro`    |
| `<!-- HERO STORY -->`               | `components/HeroStory.astro`   |
| `<!-- EDITOR'S NOTE BAND -->`       | `components/EditorBand.astro`  |
| `<!-- IN THIS ISSUE -->`            | `pages/index.astro` + `ArticleCard` |
| `<!-- LONGFORM + DEPARTMENTS -->`   | `components/Longform.astro`    |
| `<!-- ARCHIVE -->`                  | `pages/archive.astro`          |
| `<!-- FOOTER -->`                   | `components/Footer.astro`      |

**CSS는 `src/styles/newsprint.css` 한 파일로 추출** — 지금 `<style>` 블록을
그대로 옮기고 변수만 CAU 토큰으로 교체. 인라인 `<style>` 지옥 해소.

---

## 9. 디렉토리 최종 모양

```
hanbin5.github.io/
├── .github/workflows/deploy.yml
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── README.md
├── REFACTOR_PLAN.md                ← 이 문서
├── content/
│   ├── posts/
│   │   └── 2026-04-20-kalman-intuition.md
│   ├── concepts/
│   └── projects/
├── public/
│   ├── fonts/ (선택: self-host)
│   └── og/
├── scripts/
│   └── sync-from-vault.sh
└── src/
    ├── content.config.ts
    ├── styles/
    │   ├── tokens.css               ← CAU 팔레트 + 시맨틱 토큰
    │   └── newsprint.css            ← 기존 <style> 블록 포팅
    ├── layouts/
    │   ├── JournalLayout.astro      ← 홈·아카이브용
    │   └── PostLayout.astro         ← 개별 글용
    ├── components/
    │   ├── TopBar.astro
    │   ├── Masthead.astro
    │   ├── HeroStory.astro
    │   ├── EditorBand.astro
    │   ├── ArticleCard.astro
    │   ├── Longform.astro
    │   ├── ArchiveRow.astro
    │   └── Footer.astro
    └── pages/
        ├── index.astro              ← 홈 (이슈/매거진)
        ├── archive.astro            ← 전체 아카이브
        └── posts/[...slug].astro    ← 동적 포스트 라우트
```

---

## 10. 마이그레이션 절차 (단계별, 되돌리기 쉽게)

**원칙**: `main` 브랜치는 건드리지 않고 `refactor/astro` 브랜치에서 진행.
현재 사이트는 계속 살아있는 채로 새 빌드가 완성되면 스위치.

1. `git checkout -b refactor/astro`
2. Astro 프로젝트 스캐폴드: `npm create astro@latest -- --template minimal`
3. `tokens.css` · `newsprint.css` 분리 작성 (기존 `<style>` 이식).
4. `Masthead` → `Footer` 순으로 정적 컴포넌트부터 포팅. 이 단계에서는
   아직 데이터 없이 하드코딩된 마크업을 그대로 옮긴다 — 디자인 1:1 확인용.
5. `content.config.ts` + Zod 스키마 + 샘플 포스트 3개로 검증.
6. `pages/index.astro`가 `content/posts`에서 최신 글 6개를 가져와 grid-3에
   렌더하도록 바꾼다 (하드코딩 데이터 제거).
7. `pages/posts/[...slug].astro` 작성 + KaTeX 테스트 (수식 5개 이상).
8. `sync-from-vault.sh` 복사/조정 + `npm run sync` 커맨드 추가.
9. GitHub Actions workflow 추가, Pages 대상 브랜치 변경.
10. 스테이징 확인 → `main` merge → 배포.

각 단계 끝마다 `npm run build`가 통과해야 다음 단계 진행.

---

## 11. 열린 결정사항 (승인 필요)

- [ ] `content/posts/`와 Obsidian Vault를 **동시 유지**할 때 충돌 규칙
  → 제안: Vault가 "truth", sync 시 `content/posts/`를 덮어씀. 리포에서만
  쓰는 글은 `content/repo-only/`로 분리해서 sync 대상에서 제외.
- [ ] OG 이미지 자동 생성 (Astro의 `@vercel/og` 또는 Satori) 포함 여부.
- [ ] RSS 피드 (`@astrojs/rss`) 포함 여부.
- [ ] 다크 모드 추가 여부 (현재는 페이퍼 화이트 고정).
- [ ] 폰트 self-host 여부 (Google Fonts CDN 유지 vs `/public/fonts`).

---

## 12. 이 문서 승인 후 할 일

승인 떨어지면 **§10의 1~4단계**(브랜치 생성 → Astro 스캐폴드 →
CSS 분리 → 정적 컴포넌트 포팅)까지 한 번에 진행하고, 디자인이 기존
사이트와 픽셀 수준으로 일치하는지 스크린샷으로 비교해서 보여드립니다.
그 단계가 통과되어야 콘텐츠/파이프라인 작업으로 넘어갑니다.
