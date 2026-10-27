import sys,json,csv,collections,datetime
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8');sys.path.insert(0,'reports/publication-audit-2026-10-22');from audit import load,match,norm
p=Path('reports/publication-audit-2026-10-22');s=load();local=s['local'];prof=s['professor']
manual={62:(47,'한/영 제목 대응; 저자·2026년·학술지·54(2),217–225 일치; 영문 제목 on 유무 차이'),64:(49,'한/영 제목 대응; 저자·2024년·Journal of KIISE 51(8),706–717 및 DOI 등록정보 일치'),65:(50,'한/영 제목 대응; 저자·2024년·한국항공우주학회지 52(5),423–429 및 DOI 등록정보 일치'),66:(51,'한/영 제목 대응; 배병덕·이선아,2023년,항공우주시스템공학회지17(6),KT-1 미션 소프트웨어 시험 주제 일치'),113:(93,'한/영 제목 대응; 배병일·강성원·이선아,KCSE2020,학습시간 단축 주제 일치'),114:(94,'한/영 제목 대응; 조희태·박도제·이선아,KCSE2020,이슈/매뉴얼 추적성 비교 일치'),115:(96,'한/영 제목 대응; 김재만·이선아,KCSE2020,자동비행조종컴퓨터 검증 시나리오 일치'),116:(95,'한/영 제목 대응; 이유렬·김은진·이혁진·이선아,KCSE2020,수화번역 프로젝트 일치'),128:(106,'영문 관사 A/An 차이; 정세린·이선아,KCSE2018,요구사항추적성 스프레드시트 일치')}
def cat(x):return {'Top-tier Journals':'International Journals','International Conferences and Workshops':'International Conference'}.get(x,x)
matches=[];missing=[]
for i,r in enumerate(prof,1):
 if i in manual:
  index,evidence=manual[i];b=local[index-1];assert cat(r['category'])==cat(b['category']);matches.append({'professor':r,'current':b,'method':'reviewed-bilingual-or-title-variant','evidence':evidence});continue
 candidates=[b for b in local if cat(r['category'])==cat(b['category'])and match(r,b)]
 if len(candidates)>1:raise Exception(('ambiguous',r['id'],[b['id']for b in candidates]))
 if candidates:matches.append({'professor':r,'current':candidates[0],'method':match(r,candidates[0]),'evidence':'동일 분류 안에서 제목 정규화/인용문 내 제목/논문 링크 일치'})
 else:missing.append(r)
assert len(matches)==109 and len({m['current']['id']for m in matches})==109
current_only=[b for b in local if b['id']not in {m['current']['id']for m in matches}]
recent=[r for r in missing if int(r['year'])>=2016];older=[r for r in missing if int(r['year'])<2016]
dupids=[(7,31,'같은 학술지 논문의 ICST2024 Journal First 발표'),(17,43,'같은 논문의 TSE2021 학술지 게재와 ASE2019 Journal First 발표'),(49,81,'같은 제목·저자의 국내 학술지와 학회 발표; 별도 발표 기록으로 유지'),(61,106,'같은 연구 제목의 국내 학술지와 KCSE2018 발표; A/An 표기 차이 포함')]
summary={'checked_at':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).isoformat(),'counts':{k:len(v)for k,v in s.items()},'shared_professor_current_records':len(matches),'legacy_current_shared_records':110,'missing_current_records':len(missing),'missing_since_2016':len(recent),'missing_before_2016':len(older),'current_only_records':len(current_only),'same_title_cross_venue_pairs_current':4,'current_distinct_research_title_groups':106,'all_three_distinct_shared_research_title_groups':105,'union_records':139,'cloud_revision':2,'cloud_updateTime':json.loads((p/'cloud-selab-fe241.json').read_text(encoding='utf-8'))['updateTime']}
(p/'comparison.json').write_text(json.dumps({'summary':summary,'matches':matches,'missing':missing,'current_only':current_only,'same_title_pairs':[{'first':local[a-1],'second':local[b-1],'note':note}for a,b,note in dupids]},ensure_ascii=False,indent=2),encoding='utf-8')
with (p/'missing-publications.csv').open('w',encoding='utf-8-sig',newline='')as f:
 w=csv.writer(f);w.writerow(['year','category','title','authors','venue','DOI_or_source','professor_id'])
 for r in sorted(missing,key=lambda r:(-int(r['year']),r['category'],r['title'])):w.writerow([r['year'],r['category'],r['title'],r['authors'],r['venue'],r['links'][0]['url']if r['links']else 'https://saleese.github.io/publications/#'+r['bib_id'],r['bib_id']])
with (p/'all-publications-comparison.csv').open('w',encoding='utf-8-sig',newline='')as f:
 w=csv.writer(f);w.writerow(['title','year','category','professor_site','legacy_lab','current_local','current_Firebase','status','matching_evidence'])
 for m in matches:
  r=m['professor'];w.writerow([r['title'],r['year'],r['category'],'yes','yes','yes','yes','shared',m['evidence']])
 for r in missing:w.writerow([r['title'],r['year'],r['category'],'yes','no','no','no','missing-current',''])
 for r in current_only:w.writerow([r['title'],','.join(r['years']),r['category'],'no','yes','yes','yes','current-only',''])
label={'Top-tier Journals':'주요 국제학술지','International Journals':'국제학술지','International Conferences and Workshops':'국제학회·워크숍','Domestic Journals':'국내학술지','Domestic Conferences':'국내학회'}
lines=['# 논문 목록 비교 — 2026-10-22','', '교수님 개인 사이트, 기존 연구실 사이트, 작업 중인 홈페이지의 로컬·배포 HTML·Firebase 공개 데이터를 읽기 전용으로 비교했습니다. 홈페이지 논문은 수정하지 않았습니다.','', '## 결과','', '| 항목 | 수 |','|---|---:|','| 교수님 개인 사이트 등록 항목 | 138 |','| 기존 연구실 사이트 등록 항목 | 110 |','| 작업 중인 홈페이지 로컬 / 배포 HTML / Firebase | 각 110 |','| 교수님·기존 연구실·현재 홈페이지 모두에 있는 등록 항목 | 109 |','| 기존 연구실과 현재 홈페이지가 공유하는 등록 항목 | 110 |','| 교수님 사이트에는 있으나 현재 홈페이지에는 없는 항목 | 29 |','| 위 29개 중 2016년 이후 / 2015년 이전 포함(~2015) | 9 / 20 |','| 현재 홈페이지에는 있으나 교수님 사이트에는 없는 항목 | 1 |','| 세 사이트 합집합: 발표·게재 기록 단위 | 139 |','', '등록 항목은 제목뿐 아니라 학술지·학회 구분을 유지한 발표/게재 기록 단위입니다. 학술지 논문과 그 논문의 Journal First 발표를 별도 항목으로 셉니다.','', '## 비교 방법과 검증 범위','', '- 대소문자·공백·문장부호·유니코드 표기를 정규화하고 같은 분류 안에서 제목·인용문·링크를 대조했습니다.','- 한글/영문 번역 제목, 관사 A/An 차이는 저자·연도·게재처를 함께 확인해 수동 연결했습니다. 9개 대응을 comparison.json에 근거와 함께 기록했습니다.','- DOI는 가능한 항목에 한해 Crossref 등록 메타데이터를 추가 대조했습니다. 일부 요청은 429/404로 실패했으며 모든 DOI가 유효하거나 모든 외부 PDF가 열리는지까지 보증하는 검사는 아닙니다.','- 현재 Firebase 공개 논문 목록(revision 2)과 배포 HTML은 로컬 110개 인용문과 정규화 기준으로 모두 일치했습니다.','- 기존 사이트도 동일 110개 논문이지만 AeroGuardian에 [Best of Session Award] 표기가 추가되어 있습니다. 현재 로컬·배포·Firebase 인용문에는 이 수상 표기가 없습니다. 논문 누락과 메타데이터 차이는 구분했습니다.','- 기존 사이트 소개는 2016년 이후 목록이라고 안내하지만 실제로 2015년 국내학술지 1개도 포함되어 있어 엄격한 연도 필터로 비교하지 않았습니다.','', '## 현재 홈페이지에 없는 논문·발표 29개','', '| 연도 | 분류 | 제목 | 저자 | 근거 |','|---|---|---|---|---|']
for r in sorted(missing,key=lambda r:(-int(r['year']),r['category'],r['title'])):
 url=r['links'][0]['url']if r['links']else 'https://saleese.github.io/publications/#'+r['bib_id'];lines.append('| '+ ' | '.join([r['year'],label[r['category']],r['title'].replace('|','/'),r['authors'].replace('|','/'),'[출처]('+url+')'])+' |')
lines+=['','## 현재 목록의 같은 제목 재등장 4쌍','', '다음은 제목이 겹치는 4쌍(8개 등록 항목)입니다. 연구 제목으로 합치면 110개 항목은 106개 연구 제목 그룹, 세 사이트 공통 109개 항목은 105개 그룹이 됩니다. 발표/게재처가 다른 기록이므로 단순 실수라고 판단하거나 자동 삭제하지 않았습니다.','']
for a,b,note in dupids:
 m=next(m for m in matches if m['current']['id']==local[a-1]['id']);lines+=['- **'+m['professor']['title']+'** — '+note+' (`'+local[a-1]['id']+'`, `'+local[b-1]['id']+'`)']
lines+=['','## 반대로 교수님 사이트에 없는 현재 항목','']
for r in current_only:lines+=['- '+r['citation']]
lines+=['','## 출처와 파일','', '- [교수님 Publications](https://saleese.github.io/publications/)','- [기존 연구실 Publications](http://selab.gnu.ac.kr/index.php/publications)','- [현재 배포된 Publications](https://selab-gnu.github.io/publications.html)','- 로컬 기준: ../../data/publications.json','- Firebase: `projects/selab-fe241/databases/(default)/documents/siteContent/main`, 공개 읽기만 수행','- missing-publications.csv: 빠진 29개 목록(Excel용 UTF-8 BOM)','- all-publications-comparison.csv: 합집합 139개 등록 항목의 사이트별 포함 여부','- comparison.json: 자동/수동 매칭 근거와 전체 기록','- 교수님 개인 페이지 138개는 현재 공개 목록의 게시 여부를 센 것이며 논문별 실제 게재/채택 상태를 외부 출판사에서 모두 독립 검증한 결과는 아닙니다.']
(p/'publication-comparison.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False,indent=2));print('Recent missing:',[(r['year'],r['title'])for r in recent]);print('Current only:',[r['title']for r in current_only])
