# Obsidian → HANBIN Journal · Authoring Guide

> 이 폴더의 파일들을 Obsidian Template 폴더로 복사하면, 새 글을
> 단축키 하나로 시작할 수 있습니다.

---

## 설치 (한 번만)

1. Obsidian Settings → **Templates** 플러그인 활성화 (core plugin).
2. **Template folder location**을 Vault 안의 적절한 경로로 설정
   (예: `99_Templates/`).
3. 이 저장소의 `obsidian-templates/*.md`를 해당 폴더로 복사.
4. Obsidian에서 새 노트를 만들고 → `Ctrl/Cmd + P` → "Insert template"
   → **post** 선택. 프론트매터가 자동 삽입됨.

---

## 발행 모델 (태그 기반)

이 사이트는 **폴더 매핑이 아니라 프론트매터 태그**로 공개 여부를
결정합니다. Vault의 글 위치(`Daily/`, `Research/`, `Drafts/`, 어디든)와
**공개 여부는 직교**합니다.

```
┌────────────────────────────────────────────────────────┐
│  Obsidian Vault (iCloud 동기화)                         │
│                                                         │
│  Daily Notes/   Research/   Drafts/   Inbox/   …       │
│      ↓              ↓            ↓         ↓           │
│  ┌────────────── publish: true ────────────────┐       │
│  │   sync-from-vault.sh 이 자동 수집하는 범위   │       │
│  └────────────────────────────────────────────┘       │
└────────────────────────────────────────────────────────┘
                       │
                       ▼
           repo/content/posts/*.md  →  Astro build  →  GitHub Pages
```

**세 가지 상태**

| frontmatter                       | 결과                                                   |
|-----------------------------------|--------------------------------------------------------|
| `publish: false`                  | Vault에서만 보임. 사이트에는 절대 안 올라감.            |
| `publish: true` + `draft: false`  | 다음 sync 때 공개.                                     |
| `publish: true` + `draft: true`   | sync가 스킵 — "거의 다 썼지만 아직" 안전망.             |

---

## 프론트매터 필드 레퍼런스

```yaml
---
title: "제목"                  # 필수
date: 2026-05-01               # 필수 (ISO yyyy-mm-dd)
dek: "부제 한 줄"              # 선택
category: "Essay"              # 선택, 기본 "Essay"
readtime: "8분 분량"           # 선택
tags: [project-tag]            # 선택, 빈 배열이면 "(unclassified)" 컬럼
issue: 4                       # 선택, Vol.II No.XX 표기
number: "No. 012"              # 선택, 비우면 자동 넘버링
publish: true                  # sync용
draft: false                   # sync용
---
```

### 필드 상세

- **title / date**: 없으면 Astro가 빌드 실패. 반드시 채울 것.
- **dek**: hero/card/RSS에서 1~2줄로 노출되는 부제. 긴 글의
  *핵심 문장 요약*을 넣는 게 일반적.
- **category**: **닫힌 enum** — `Essay` / `Note` / `Log` / `Review`.
  default `Essay`. 다른 값을 넣으면 빌드가 거부함 (오타 드리프트 방지).
  새 값을 추가하려면 `src/content/config.ts`의 `CATEGORIES`를 먼저 수정.
  - `Essay` — 길게 끌고 가는 생각, 독자에게 보여주려는 글
  - `Note` — 본인이 학습한 걸 정리한 노트
  - `Log` — 작업/실험/리딩 일지 (시점성)
  - `Review` — 외부 자료(논문/책/도구) 평가
- **tags**: **이것이 프로젝트다.** 아래 섹션 참고. category와 직교하는
  열린 axis — 자유 입력, 여러 개 가능, 순서가 의미 있음.
- **readtime**: 자유 문자열. "8분 분량", "10 min" 같은 표기. 자동 계산
  아님 — 직접 판단해서 적음.
- **issue / number**: 매거진 관용 스타일 표기. 없으면 사이트가 자동 생성.

---

## Tag = Project 관습

### 왜 tag를 project로 쓰는가

CV용 블로그에서 가장 궁금한 건 *"이 사람이 어떤 연구·작업 맥락에서 뭘 썼나"*.
Obsidian의 tag는 원래 가볍게 토픽을 표시하는 장치지만, 우리는 그걸 한
용도로 특화해서 씁니다: **프로젝트 이름**.

### Naming convention

- **kebab-case 소문자**: `slam-research`, `capstone-2026`, `kalman-study`
- **명사 중심**: `robotics` (X — 너무 광범위) → `orb-slam3-port` (O)
- **시간 범위 포함 가능**: `field-notes-2026`, `summer-reading-2025`
- **한 글에 여러 태그 가능하지만**, 첫 번째 태그가 **primary project**
  (홈 kanban의 컬럼 결정). 나머지는 archive 필터에서 추가 매칭.

### 예시

```yaml
tags: [slam-research]                  # SLAM 프로젝트의 글
tags: [slam-research, kalman-study]    # SLAM 주로, Kalman도 해당
tags: [capstone-2026]                  # 캡스톤 졸업작품
tags: []                               # 미분류 — kanban의 (unclassified) 컬럼
```

### Project가 많아지면?

- **5장 넘는 컬럼**: 자동으로 "+N more in this project" 링크 표시,
  `/archive?tag=project-name`으로 연결.
- **많은 프로젝트**: 현재는 auto-fit 그리드로 자연스럽게 wrap.
  10개 넘으면 `index.astro` 상단의 `ACTIVITY_WINDOW_DAYS` 주석을 풀어서
  dormant 프로젝트 접기 활성화 가능.
- **휴면 프로젝트**: 오랫동안 새 글 없으면 `/projects/[tag]` 전용 페이지
  생성 후 홈 kanban에서 제외하는 Tier 3 리팩토링 예정.

---

## 로컬 발행 워크플로

```bash
# 1. Obsidian에서 글 작성, publish: true 설정.
# 2. 터미널:
cd ~/Lab/hanbin5.github.io
npm run sync:dev      # Vault → content/posts 동기화 + 로컬 서버
# 또는
npm run sync          # 동기화만 (빌드 안 함)
# 또는
npm run build         # 로컬 프로덕션 빌드 (dist/)
```

로컬에서 확인 끝나면:

```bash
git add -A
git commit -m "post: 글 제목"
git push              # GitHub Actions가 자동 배포
```

---

## 이미지·첨부 처리 — selective auto-sync

Obsidian의 `![[photo.png]]` wiki embed가 sync 단계에서 **자동 처리됩니다.**
별도 작업 없이 평소처럼 노트에 이미지를 박으면 됩니다.

### 작동 방식

1. **공개용 이미지는 vault의 `06_Public_Attachments/`에 둔다.**
   - Obsidian Settings → Files & Links → "Default location for new
     attachments"을 `06_Public_Attachments/`로 잡으면, drag&drop 시 자동
     으로 거기로 떨어집니다.
   - 작업용/비공개 이미지는 `05_Attachments/`에 둡니다. sync는 이 폴더는
     **절대 안 봅니다** — 폴더 분리가 publish 게이트입니다.

2. **published된 노트가 본문에서 참조하는 이미지만** sync 시 git에 들어
   갑니다.
   - `![[slam-trajectory.png]]` ← 06_Public_Attachments/에서 찾아 복사
   - `![[diagrams/architecture.png|시스템 구조도]]` ← 서브폴더 OK, alt 보존
   - 위 두 케이스 모두 sync 후 노트는 `![alt](/attachments/file.png)` 형태로
     자동 변환되어 Astro가 렌더링.
   - 06_Public_Attachments/에 있어도 published 노트가 참조 안 하면 git에
     안 들어감 — repo는 "실제로 사이트에 보일 것"만큼만 큼.

3. **참조했는데 06_Public_Attachments/에 없는 파일은 경고만 찍고 넘어감.**
   - sync 출력에 `⚠️ missing-attachment: foo.png` 표시
   - 빌드는 성공하지만 사이트에선 깨진 이미지 자리에 alt 텍스트가 보이는
     "loud failure" 상태가 됨 → 글 발행 전에 발견하기 쉬움
   - 해결: 그 파일을 05_Attachments에서 06으로 옮기거나, 참조를 수정.

4. 지원 확장자: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`. PDF/영상
   같은 다른 타입을 sync 대상에 추가하려면 `scripts/sync-from-vault.sh`의
   `IMG_EXT` 변수를 수정.

### Repo 비대화에 대해

- public/attachments/는 sync가 **wipe-and-recreate**하므로, 참조에서
  빠진 이미지는 다음 sync 때 자동으로 빠짐 (working tree 기준).
- 단 git **히스토리**에는 한 번 commit된 파일이 남음. 1년에 글 12편 ×
  이미지 5장 × 200KB = ~12MB 정도가 누적의 자연스러운 페이스. 수년간
  쌓여도 GitHub 권장 1GB 안쪽일 것.
- 그보다 큰 파일(>500KB)은 git에 들이지 말고 외부 CDN URL을 본문에 직접
  적기를 권장. wiki embed는 기존 자료에만 쓰고 큰 파일은 외부.

### 외부 URL을 그대로 쓰고 싶을 때

표준 마크다운 형태(`![alt](https://...)`)는 sync가 건드리지 않습니다.
GitHub Issue / Cloudflare R2 / Imgur 등 어디든 외부 호스팅된 이미지는 그
URL을 본문에 그대로 적으면 됩니다. 큰 동영상이나 자주 갱신되는 자료는 이
방식이 자연스럽습니다.

---

## KaTeX 수식 체크리스트

MathJax 문법 대부분이 호환되지만, 다음은 예외:

- ✅ `$inline$`, `$$block$$` — 동일
- ✅ `\begin{align} … \end{align}` — 동일
- ✅ `\newcommand`, `\mathbb`, `\mathcal` — 동일
- ⚠️ `\label{eq}` / `\ref{eq}` — **제한적**. `\tag{1}`로 번호 붙이는 게
  안전.
- ⚠️ `\require{AMS}` — **필요 없음**. AMS는 기본 활성화되어 있음.
- ❌ 복잡한 commutative diagram — 이미지로 대체.

`astro.config.mjs`의 `rehypeKatex > macros`에 공용 매크로를 미리 정의해두면 모든 글에서 재사용 가능. 예: `\RR`, `\NN`, `\ZZ`는 이미 정의됨.

---

## Obsidian 링크 처리 — wiki link 자동 해석

`[[다른 노트]]` 스타일 wiki link도 sync 단계에서 자동으로 표준 마크다운
링크로 변환됩니다. Obsidian에서 평소처럼 노트끼리 링크를 걸면 됩니다.

### 작동 방식

sync는 두 패스로 동작합니다:

1. **1패스**: vault를 훑어 publish 게이트를 통과하는 모든 노트의
   `{ 파일명 stem → URL slug }` 맵을 만듭니다.
2. **2패스**: 각 published 노트를 복사하면서 본문의 wiki link를 그
   맵으로 해석합니다. 슬러그는 lowercase + 공백→하이픈으로 정규화됨.
   (Astro의 라우트가 lowercase여서 — `Loop Closure.md`는 `/posts/loop-closure/`
   로 발행됩니다.)

### 변환 규칙

| 원본 (Obsidian) | 변환 결과 (사이트) |
|---|---|
| `[[Loop Closure]]` | `[Loop Closure](/posts/loop-closure)` |
| `[[Loop Closure\|루프 클로저]]` | `[루프 클로저](/posts/loop-closure)` |
| `[[loop closure]]` (소문자 typing) | `[loop closure](/posts/loop-closure)` — 매칭은 case-insensitive |
| `[[Loop Closure#Section]]` | `[Loop Closure](/posts/loop-closure)` — heading anchor는 v1에선 drop |
| `[[Loop Closure^block]]` | 그대로 — block 참조는 미지원 |

### 비공개 또는 존재하지 않는 노트로의 링크

대상 노트가 **publish 게이트를 통과하지 않거나 vault에 아예 없으면**
sync가 두 가지를 합니다:
- 본문의 `[[…]]`를 **그대로 둠** (변환 안 함). 사이트에 리터럴
  `[[Private Thoughts]]` 텍스트로 노출되는 "loud failure" 상태가 됨.
- sync 출력에 `⚠️  unpublished-link: <name>` 경고를 찍음.

이 동작은 의도된 것입니다 — silent fix가 되면 시간이 지나서 *내가 모르는
사이 깨진 링크가 본문에 박혀 있는* 상황이 생기는데, 사이트 본문에 깨진
링크가 보이면 발견 즉시 수정할 수 있습니다.

해결 방법: 대상 노트에 `publish: true` + `draft: false`를 추가해 다음
sync에서 같이 발행되도록 하거나, 링크 자체를 표준 마크다운(외부 URL)
이나 평문으로 바꿉니다.

### Heading anchor를 활성화하고 싶다면 (v2)

현재 `[[X#H]]`의 `#H` 부분은 drop 됩니다. 활성화하려면:

1. `astro.config.mjs`의 markdown 설정에 `rehype-slug`를 추가
2. `scripts/sync-from-vault.sh`의 `process_links` 안에서 heading 부분을
   동일 슬러그화 로직으로 URL 끝에 붙이도록 perl 치환을 확장

지금은 페이지 단위 링크만 자동화되어 있고, 섹션 단위 점프는 수동으로
표준 마크다운(`[Section](/posts/slug#section-slug)`)을 적어야 합니다.
