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

## 이미지·첨부 처리

Obsidian의 `![[photo.png]]` wiki embed는 현재 빌드 파이프라인에서 **변환되지 않습니다**. 해결책 중 하나 선택:

### 방법 A: 표준 markdown 이미지 + public/attachments

1. 이미지를 저장소의 `public/attachments/`에 복사.
2. 마크다운에서 절대경로로 참조:
   ```md
   ![SLAM trajectory plot](/attachments/slam-trajectory.png)
   ```
3. Obsidian에서도 이 경로가 유효하도록, Vault 루트에 `attachments`
   폴더를 심볼릭 링크로 걸어두면 양쪽에서 똑같이 보임.

### 방법 B: 외부 호스팅 (권장 — CDN 부담 없음)

GitHub issue에 drag & drop → GitHub이 cdn URL 제공 → 그 URL을
마크다운에 붙여넣기.

### 방법 C: 나중에 파이프라인 확장

`scripts/sync-from-vault.sh`를 확장해서 `![[...]]` 참조 스캔 후 Vault의
attachment 폴더에서 `public/attachments/`로 rsync하도록 만들 수 있음.
지금은 미구현.

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

## Obsidian 링크 처리

`[[다른 노트]]` 스타일 wiki link는 빌드에 나오지 않습니다. 공개 글 안에서 다른 공개 글로 링크 걸려면 표준 마크다운:

```md
[Kalman 필터 입문](/posts/kalman-intro)
```

URL은 파일명 stem (슬래시 구분) 그대로 따라갑니다.
