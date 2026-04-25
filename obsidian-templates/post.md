---
# Required — build fails without these.
title: "{{title}}"
date: {{date:YYYY-MM-DD}}

# Recommended — shown on hero/cards/RSS.
dek: "부제 한 줄 — 없으면 비워둬도 됨"
category: "Essay"          # 닫힌 enum: Essay | Note | Log | Review (default: Essay).
                           #   Essay  — 길게 끌고 가는 생각, 독자에게 보여주려는 글
                           #   Note   — 본인이 학습한 걸 정리한 노트
                           #   Log    — 작업/실험/리딩 일지 (시점성)
                           #   Review — 외부 자료(논문/책/도구) 평가
                           # 다른 값을 쓰려면 src/content/config.ts의 CATEGORIES를 먼저 수정.
readtime: ""               # "8분 분량" 같은 문자열. 비우면 카드에서 숨겨짐.

# Project tags — the PRIMARY classification axis.
#   첫 번째 태그가 "소속 프로젝트" (kanban 컬럼 결정).
#   추가 태그는 archive의 project 필터에서 함께 매칭됨.
#   kebab-case 소문자 권장. 예: slam-research, capstone-2026, kalman-study
tags:
  - project-tag-here

# Sync flags — sync-from-vault.sh가 이 두 줄로 공개 여부를 판단.
publish: false             # ← 공개 준비 끝나면 true 로.
draft: false               # ← true 면 publish:true여도 스킵됨 (안전장치).

# Optional.
issue: 4                   # Vol. II · No. XX 표기용. 없으면 masthead 기본값 사용.
number: ""                 # "No. 012" 표기 수동 지정. 비우면 자동 넘버링.
---

> Feynman식으로 첫 문장을 시작해보기: "**이 글은 ○○가 왜 그렇게 되는지**를
> 설명한다." 가장 어려운 한 줄을 먼저 쓰면 나머지가 쉬워진다.

## 섹션 1

본문. **마크다운**과 $LaTeX$ 수식 모두 지원.

블록 수식:

$$
\hat{x}_{k|k} = \hat{x}_{k|k-1} + K_k \left( z_k - H_k \hat{x}_{k|k-1} \right)
$$

코드 블록:

```python
def residual(z, x_pred, H):
    return z - H @ x_pred
```

## 섹션 2

- 이미지: Obsidian의 `![[file.png]]` wiki embed 그대로 써도 됨 — sync 시
  자동으로 표준 마크다운으로 변환되고 파일은 `public/attachments/`로 복사.
  단 이미지는 vault의 **`06_Public_Attachments/`**에 있어야 함 (05_*는
  비공개 영역, sync가 안 봄). 외부 CDN URL을 직접 박는 것도 OK —
  `![alt](https://...)` 형태는 sync가 건드리지 않음.
- 링크: Obsidian wiki link `[[다른 노트]]` / `[[다른 노트|별칭]]` 그대로
  사용 가능 — sync가 published된 다른 노트로 자동 해석함. 비공개/없는
  노트로 링크하면 본문에 그대로 남아 사이트에서 가시적 깨짐으로 노출됨.
  외부 링크는 표준 마크다운 `[텍스트](URL)`을 그대로 쓰면 됨.

---

*초안이 끝나면 프론트매터에서 `publish: false → true`로 바꾸고,
터미널에서 `npm run sync:dev` 한 번.*
