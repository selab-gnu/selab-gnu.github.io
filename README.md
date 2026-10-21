# Software Evolution and Architecture Lab

연구실 홈페이지: https://selab-gnu.github.io/

기존 홈페이지(http://selab.gnu.ac.kr/index.php)의 공개 내용을 옮긴 GitHub Pages 사이트입니다.

## 페이지와 자료 수정

- 소개: `data/home.html`
- 논문 목록: `data/publications.json`
- 멤버, 수업, 도구 및 상세 페이지: `data/sections.json`
- 공통 화면: `scripts/build.py`
- 디자인: `styles.css`
- 논문 전용 검색: `site.js`
- 논문·강의 통합 검색: `search.js` / `search.html`

Python 3에서 `python scripts/build.py`를 실행하면 16개 HTML 페이지가 생성됩니다. 별도 패키지 설치는 필요하지 않습니다. 생성한 HTML도 함께 커밋하고 main에 push합니다.

로컬 미리보기: 저장소에서 `python -m http.server 8000` 실행 후 http://localhost:8000 접속.

## GitHub Pages와 인수인계

저장소 Settings → Pages에서 배포 설정을 확인합니다. 브랜치 배포를 사용할 때는 main / (root)를 선택합니다. `.nojekyll`은 HTML을 그대로 게시하도록 하는 파일입니다.

후임자에게 저장소 권한, Pages 설정, 자료 수정 및 빌드 방법을 전달하세요. 현재 실행에 필요한 서버 계정, API 키, npm 패키지는 없습니다.

로그인 영역은 준비 중 표시이며 인증 기능은 없습니다. PDF는 기존 링크를 유지합니다. 상세 이전 범위와 검수 결과는 `MIGRATION.md`를 참고하세요.

## 통합 검색

모든 공개 페이지 상단의 검색은 `search.html`로 이동합니다. Publications와 Courses 결과를 별도 영역으로 표시하고, 전체/논문/강의로 범위를 좁힐 수 있습니다. 논문은 개별 항목의 서지정보, 강의는 제목과 본문을 검색합니다. 강의 목록에 노출되는 같은 강의 링크나 중복 소개 페이지는 별도 결과로 중복 집계하지 않습니다. PDF·첨부파일 내부는 검색하지 않습니다.

논문은 저장소 자료를 먼저 표시한 뒤 Firestore의 최신 공개 자료를 반영합니다. 클라우드 확인이 실패하거나 6초를 넘기면 저장소 자료로 검색하고 화면에 안내합니다. Publications 페이지 내부의 전용 검색·분류 기능은 그대로 유지합니다. 변경 후 `python scripts/build.py`로 검색 페이지와 모든 공통 헤더를 함께 생성합니다. 검색 추가에는 Firebase 규칙 변경이 필요하지 않습니다.

`node scripts/test-search.cjs`로 Playwright 기반 모의 백엔드 검증을 실행합니다. Playwright 패키지 경로와 설치된 Chrome 경로는 필요하면 `NODE_PATH`, `TEST_BROWSER_PATH`로 지정합니다. 실제 Firebase에는 저장하지 않습니다.
