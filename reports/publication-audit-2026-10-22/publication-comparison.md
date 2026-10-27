# 논문 목록 비교 — 2026-10-22

교수님 개인 사이트, 기존 연구실 사이트, 작업 중인 홈페이지의 로컬·배포 HTML·Firebase 공개 데이터를 읽기 전용으로 비교했습니다. 홈페이지 논문은 수정하지 않았습니다.

## 결과

| 항목 | 수 |
|---|---:|
| 교수님 개인 사이트 등록 항목 | 138 |
| 기존 연구실 사이트 등록 항목 | 110 |
| 작업 중인 홈페이지 로컬 / 배포 HTML / Firebase | 각 110 |
| 교수님·기존 연구실·현재 홈페이지 모두에 있는 등록 항목 | 109 |
| 기존 연구실과 현재 홈페이지가 공유하는 등록 항목 | 110 |
| 교수님 사이트에는 있으나 현재 홈페이지에는 없는 항목 | 29 |
| 위 29개 중 2016년 이후 / 2015년까지 | 9 / 20 |
| 현재 홈페이지에는 있으나 교수님 사이트에는 없는 항목 | 1 |
| 세 사이트 합집합: 발표·게재 기록 단위 | 139 |

등록 항목은 제목뿐 아니라 학술지·학회 구분을 유지한 발표/게재 기록 단위입니다. 학술지 논문과 그 논문의 Journal First 발표를 별도 항목으로 셉니다.

## 비교 방법과 검증 범위

- 대소문자·공백·문장부호·유니코드 표기를 정규화하고 같은 분류 안에서 제목·인용문·링크를 대조했습니다.
- 한글/영문 번역 제목, 관사 A/An 차이는 저자·연도·게재처를 함께 확인해 수동 연결했습니다. 9개 대응을 comparison.json에 근거와 함께 기록했습니다.
- DOI는 가능한 항목에 한해 Crossref 등록 메타데이터를 추가 대조했습니다. 일부 요청은 429/404로 실패했으며 모든 DOI가 유효하거나 모든 외부 PDF가 열리는지까지 보증하는 검사는 아닙니다.
- 현재 Firebase 공개 논문 목록(revision 2)과 배포 HTML은 로컬 110개 인용문과 정규화 기준으로 모두 일치했습니다.
- 기존 사이트도 동일 110개 논문이지만 AeroGuardian에 [Best of Session Award] 표기가 추가되어 있습니다. 현재 로컬·배포·Firebase 인용문에는 이 수상 표기가 없습니다. 논문 누락과 메타데이터 차이는 구분했습니다.
- 기존 사이트 소개는 2016년 이후 목록이라고 안내하지만 실제로 2015년 국내학술지 1개도 포함되어 있어 엄격한 연도 필터로 비교하지 않았습니다.

## 현재 홈페이지에 없는 논문·발표 29개

| 연도 | 분류 | 제목 | 저자 | 근거 |
|---|---|---|---|---|
| 2026 | 국제학회·워크숍 | Graph Database-based Measurement of Traceability Coverage in Open-Source Projects | Jihyun Yoo, Seonah Lee , and Heetae Cho | [출처](https://saleese.github.io/publications/#yoo2026traceability) |
| 2023 | 국내학회 | 안드로이드 앱과 구글 Firebase를 활용한 IoT 스마트팜 제어 | 이태상, 김동환, 손명원, 하준영, and 이선아 | [출처](https://saleese.github.io/publications/#lee2023smartfarm) |
| 2022 | 국제학술지 | A fine-grained secure service provisioning platform for hypervisor systems | Junho Seo, Seonah Lee , Ki-Il Kim, and Kyong Hoon Kim | [출처](https://doi.org/10.3390/electronics11101606) |
| 2022 | 국제학술지 | Resource allocation through logistic regression and multicriteria decision making method in IoT fog computing | Hayat Bashir, Seonah Lee , and Kyong Hoon Kim | [출처](https://doi.org/10.1002/ett.3824) |
| 2021 | 국내학회 | 표적 정보를 포함하는 2차원 지도 생성 시스템 | 전병륜, 김강산, 김송섭, 박보근, 전동환, 이선아, and 이성진 | [출처](https://saleese.github.io/publications/#jeon2021map) |
| 2020 | 국제학술지 | Reducing dynamic power consumption in mixed-critical real-time systems | Ijaz Ali, Yong-Il Jo, Seonah Lee , Wan Yeon Lee, and Kyong Hoon Kim | [출처](https://doi.org/10.3390/app10207256) |
| 2019 | 국내학회 | A PageRank-based Bug Report Summarization Technique using Bug Report Relationships | Beomjun Kim, Sungwon Kang, and Seonah Lee | [출처](https://saleese.github.io/publications/#kim2019pagerankkips) |
| 2019 | 국내학회 | Code Change Recommendation based on Recurrent Neural Networks | Jaejun Lee, Sungwon Kang, and Seonah Lee | [출처](https://saleese.github.io/publications/#lee2019rnn) |
| 2017 | 국내학회 | Code Change Recommendation System based on the N-gram Model | Taehyun Kim, Sungwon Kang, Seonah Lee , and Chansup Keum | [출처](https://saleese.github.io/publications/#kim2017ngram) |
| 2015 | 국내학회 | A Refactoring Process for Improving the Portability of Embedded Software Modules | Kyoungjong Lee, Sungwon Kang, and Seonah Lee | [출처](https://saleese.github.io/publications/#lee2015refactoring) |
| 2015 | 주요 국제학술지 | The Impact of View Histories on Edit Recommendations | Seonah Lee , Sungwon Kang, Sunghun Kim, and Matt Staats | [출처](https://doi.org/10.1109/tse.2014.2362138) |
| 2014 | 국내학회 | A Case Study on the Level of Code Quality according to File Ownership | SeungBum Han, Seonah Lee , and Sungwon Kang | [출처](https://saleese.github.io/publications/#han2014ownership) |
| 2013 | 국내학술지 | Data-mining based Recommendation Systems for Software Evolution Tasks | Seonah Lee and Sungwon Kang | [출처](https://koreascience.kr/article/JAKO201306464395246.pdf) |
| 2013 | 국제학회·워크숍 | A Graphical Recommender for Assisting Code Exploration | Seonah Lee , Sungwon Kang, and Matt Staats | [출처](https://doi.org/10.1109/icse.2013.6606706) |
| 2013 | 국제학회·워크숍 | Mining Contexts for Recommending Source Locations to Explore | Seonah Lee and Sungwon Kang | [출처](https://saleese.github.io/publications/#lee2013mining) |
| 2013 | 국제학술지 | Clustering Navigation Sequences to Create Contexts for Guiding Code Navigation | Seonah Lee and Sungwon Kang | [출처](https://doi.org/10.1016/j.jss.2013.03.103) |
| 2012 | 국제학술지 | A Study on Guiding Programmers’ Code Navigation with a Graphical Code Recommender | Seonah Lee and Sungwon Kang | [출처](https://doi.org/10.1007/978-3-642-23202-2_5) |
| 2011 | 국제학회·워크숍 | Clustering and Recommending Collections of Code Relevant to Tasks | Seonah Lee and Sungwon Kang | [출처](https://doi.org/10.1109/icsm.2011.6080826) |
| 2009 | 국제학술지 | A Framework for Tool-based Software Architecture Reconstruction | Sungwon Kang, Seonah Lee , and Dan Hyung Lee | [출처](https://doi.org/10.1142/s0218194009004167) |
| 2008 | 국제학회·워크숍 | How Can Diagramming Tools Help Support Programming Activities? | Seonah Lee , Gail C. Murphy, Thomas Fritz, and Meghan Allen | [출처](https://doi.org/10.1109/vlhcc.2008.4639095) |
| 2006 | 국제학회·워크숍 | Verifying a Software Architecture Reconstruction Framework with a Case Study | Seonah Lee and Sungwon Kang | [출처](https://saleese.github.io/publications/#lee2006verifying) |
| 2004 | 국제학회·워크숍 | SAAT: Reverse Engineering for Performance Analysis | Seonah Lee , Seungmo Cho, and Sungkwan Heo | [출처](https://doi.org/10.1049/ic:20040298) |
| 2003 | 국내학회 | Software Architecture Analysis for Performance Analysis: UPnP Case Study | Seonah Lee , Byounwan Lee, and Guiyoung Lee | [출처](https://saleese.github.io/publications/#lee2003upnp) |
| 2002 | 국내학회 | The Case Study of Software Requirement Management | Jeongeun Choi, Soonkew Choi, and Seonah Lee | [출처](https://saleese.github.io/publications/#choi2002requirement) |
| 2002 | 국제학술지 | Transition Management of Software Process Improvement | Seonah Lee and Byoungju Choi | [출처](https://doi.org/10.1007/3-540-36209-6_5) |
| 2001 | 국내학회 | Incremental Process Deployment Strategy for Software Process Improvement | Seonah Lee , Soonkew Choi, and Jeongeun Choi | [출처](https://saleese.github.io/publications/#lee2001incremental) |
| 2000 | 국내학술지 | Establishment of the Software Quality Metrics for a Software Development Process | Seonah Lee and Byoungju Choi | [출처](https://saleese.github.io/publications/#lee2000metrics) |
| 2000 | 국제학회·워크숍 | Developer’s View on the Software Quality Model based on the ISO/IEC 9126 | Seonah Lee , Sookyung Kim, and Byoungju Choi | [출처](https://saleese.github.io/publications/#lee2000developers) |
| 1999 | 국내학술지 | Hierarchical Software Quality Model (H-SQM) of Developer’s View | Seonah Lee and Byoungju Choi | [출처](https://saleese.github.io/publications/#lee1999hsqm) |

## 현재 목록의 같은 제목 재등장 4쌍

다음은 제목이 겹치는 4쌍(8개 등록 항목)입니다. 연구 제목으로 합치면 110개 항목은 106개 연구 제목 그룹, 세 사이트 공통 109개 항목은 105개 그룹이 됩니다. 발표/게재처가 다른 기록이므로 단순 실수라고 판단하거나 자동 삭제하지 않았습니다.

- **Automated code-based test case reuse for software product line testing** — 같은 학술지 논문의 ICST2024 Journal First 발표 (`local-7`, `local-31`)
- **Automatic Detection and Update Suggestion for Outdated API Names in Documentation** — 같은 논문의 TSE2021 학술지 게재와 ASE2019 Journal First 발표 (`local-17`, `local-43`)
- **Safety Requirement Elicitation for Small Aircraft Collision Avoidance Software using STPA, FTA and FMEA** — 같은 제목·저자의 국내 학술지와 학회 발표; 별도 발표 기록으로 유지 (`local-49`, `local-81`)
- **A Spreadsheet Application that Enables to Flexibly Change Mappings in Requirement Traceability Matrix** — 같은 연구 제목의 국내 학술지와 KCSE2018 발표; A/An 표기 차이 포함 (`local-61`, `local-106`)

## 반대로 교수님 사이트에 없는 현재 항목

- Jueun Heo, Seonah Lee, " Toward more accurate label recommendation for GitHub Issue Reports " 1st International Workshop on Intelligent Software Engineering (2022)

## 출처와 파일

- [교수님 Publications](https://saleese.github.io/publications/)
- [기존 연구실 Publications](http://selab.gnu.ac.kr/index.php/publications)
- [현재 배포된 Publications](https://selab-gnu.github.io/publications.html)
- 로컬 기준: ../../data/publications.json
- Firebase: `projects/selab-fe241/databases/(default)/documents/siteContent/main`, 공개 읽기만 수행
- missing-publications.csv: 빠진 29개 목록(Excel용 UTF-8 BOM)
- all-publications-comparison.csv: 합집합 139개 등록 항목의 사이트별 포함 여부
- comparison.json: 자동/수동 매칭 근거와 전체 기록
- 교수님 개인 페이지 138개는 현재 공개 목록의 게시 여부를 센 것이며 논문별 실제 게재/채택 상태를 외부 출판사에서 모두 독립 검증한 결과는 아닙니다.
