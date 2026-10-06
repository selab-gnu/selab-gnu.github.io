# Software Evolution and Architecture Lab

연구실 홈페이지: https://selab-gnu.github.io/

기존 홈페이지(http://selab.gnu.ac.kr/index.php)의 공개 내용을 옮긴 GitHub Pages 사이트입니다.

## 페이지와 자료 수정

- 소개: `data/home.html`
- 논문 목록: `data/publications.json`
- 멤버, 수업, 도구 및 상세 페이지: `data/sections.json`
- 공통 화면: `scripts/build.py`
- 디자인: `styles.css`
- 논문 검색: `site.js`

Python 3에서 `python scripts/build.py`를 실행하면 15개 HTML 페이지가 생성됩니다. 별도 패키지 설치는 필요하지 않습니다. 생성한 HTML도 함께 커밋하고 main에 push합니다.

로컬 미리보기: 저장소에서 `python -m http.server 8000` 실행 후 http://localhost:8000 접속.

## GitHub Pages와 인수인계

저장소 Settings → Pages에서 배포 설정을 확인합니다. 브랜치 배포를 사용할 때는 main / (root)를 선택합니다. `.nojekyll`은 HTML을 그대로 게시하도록 하는 파일입니다.

후임자에게 저장소 권한, Pages 설정, 자료 수정 및 빌드 방법을 전달하세요. 현재 실행에 필요한 서버 계정, API 키, npm 패키지는 없습니다.

로그인 영역은 준비 중 표시이며 인증 기능은 없습니다. PDF는 기존 링크를 유지합니다. 상세 이전 범위와 검수 결과는 `MIGRATION.md`를 참고하세요.
