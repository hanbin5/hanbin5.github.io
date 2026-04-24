# 배포 가이드 — 기존 al-folio 리포를 이 새 사이트로 덮어쓰기

여기 파일들을 **기존 `hanbin5.github.io` 리포에 강제로 덮어씌워서** 배포해요.
기존 커밋 히스토리는 버려지지만, 어차피 al-folio 셋업이 꼬여있었으니 오히려 깔끔.

터미널에서 **아래 블록 한 번에 복붙**하면 끝이에요.

```bash
cd ~/Lab

# 1. 기존 폴더를 백업으로 보관 (나중에 필요 없어지면 삭제 가능)
mv hanbin5.github.io hanbin5.github.io.alfolio-bak

# 2. 새 사이트를 기존 이름으로 이동
mv hanbin5.github.io.new hanbin5.github.io
cd hanbin5.github.io

# 3. 새 git 히스토리 초기화 + 기존 원격지 연결 + 강제 푸시
git init -b main
git add .
git commit -m "Fresh start: blog-style personal site (Minimal Mistakes)"
git remote add origin https://github.com/hanbin5/hanbin5.github.io.git
git push --force origin main
```

## 푸시 후 — GitHub Pages 설정 바꾸기 (중요!)

이전엔 al-folio가 GitHub Actions로 빌드해서 `gh-pages` 브랜치에 결과물을 올리는 구조였어요. 지금은 **GitHub Pages가 직접 빌드하는** 방식으로 바뀌었으니 **소스 설정을 `main` 브랜치로 바꿔야** 해요.

1. https://github.com/hanbin5/hanbin5.github.io/settings/pages 이동
2. **Source**: `Deploy from a branch`
3. **Branch**: **`main`** 선택 (이전의 `gh-pages` 아님!) · `/(root)` 유지
4. **Save**

1~2분 기다리면 `https://hanbin5.github.io` 에 떠요.

## 건드려볼 것들

- **스킨 바꾸기** — `_config.yml`의 `minimal_mistakes_skin`을 바꿔보세요.
  옵션: `default`, `air`, `aqua`, `contrast`, `dark`, `dirt`, `mint`, `neon`, `plum`, `sunrise`.
- **이모지/이름** — `_config.yml` 상단의 `title`, `description`, `author.bio` 등.
- **새 글 쓰기** — `_posts/YYYY-MM-DD-slug.md` 파일 만들고 frontmatter에 `title`, `date`, `categories`, `tags` 넣기. 기존 `_posts/` 안의 파일을 복붙해서 시작하는 게 편함.
- **사이드바에 Google Scholar 아이콘 추가** — 첫 논문 나오면 `_config.yml`의 `author.links` 아래 주석 처리된 블록을 풀고 URL 채우기.

## 왜 이 구조가 나은가 (요약)

al-folio: Jekyll 플러그인 많음 → GitHub Pages가 지원 못 함 → GitHub Actions로 별도 빌드 → gh-pages 브랜치 → Pages가 거기서 서빙. 단계가 4개.

지금: GitHub Pages가 지원하는 플러그인만 사용 → main에 push하면 Pages가 직접 빌드해서 바로 서빙. 단계가 2개. 깨질 구석이 적어요.

## 문제가 생기면

- **Actions 탭에 실패가 뜸** → main 브랜치의 **"github-pages"** 빌드 로그 열어서 에러 확인. YAML 들여쓰기 오류가 제일 흔함.
- **사이트에 "Page Build Failure" 알림이 옴** → 이메일/GitHub 알림으로 에러 메시지 옴. 그대로 저한테 공유해주세요.
- **CSS 깨져 보임** → `_config.yml`의 `baseurl: ""` 비어있는지 먼저 확인.
