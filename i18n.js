const translations={
 seminar:['Lab Seminar','연구실 세미나'],seminarBody:['Wednesdays at 3:00 pm. Topics include requirements traceability, APIs and refactoring, software-history mining, visualization and evolution.','수요일 오후 3시. 요구사항 추적성, API·리팩터링, 소프트웨어 변경 이력 분석, 가시화와 소프트웨어 진화를 다룹니다.'],
 home:['Home','홈'],members:['Members','멤버'],publications:['Publications','논문'],news:['News','뉴스'],gallery:['Gallery','갤러리'],
 login:['Sign in ↗','로그인 ↗'],search:['Search','검색'],searchPlaceholder:['Search publications','논문 검색'],skip:['Skip to content','본문 바로가기'],top:['Back to Top ↑','맨 위로 ↑'],
 faculty:['Professor','교수'],full:['Full-Time','전일제'],part:['Part-Time','시간제'],unknown:['Enrollment to be confirmed','재학 형태 확인 대기'],phd:['PhD Student','박사과정'],ms:['MS Student','석사과정'],undergrad:['Undergraduate Student','학부연구생'],other:['Other members','기타 멤버'],alumniGraduate:['Alumni · Graduate Students','졸업생 · 대학원'],alumniUndergrad:['Alumni · Undergraduate Students','졸업생 · 학부'],photoPending:['Photo coming soon','사진 준비 중'],details:['Profile details','프로필 상세'],
 filters:['Explore publications','논문 찾아보기'],filterIntro:['Combine year, author, venue and research area.','연도·저자·학술지/학회·연구 분야를 조합해 확인하세요.'],year:['Year','연도'],author:['Author','저자'],venue:['Journal / Conference','학술지 / 학회'],area:['Research area','연구 분야'],all:['All','전체'],reset:['Reset filters','필터 초기화'],noPapers:['No publications match these filters.','선택한 조건에 맞는 논문이 없습니다.'],unclassified:['Unclassified','미분류'],unknownVenue:['Venue not specified','게재처 미기재'],unknownYear:['Year not specified','연도 미기재'],
 professorTitle:['Meet our professor','지도교수 소개'],professorName:['Seonah Lee','이선아'],professorRole:['Professor · Gyeongsang National University','경상국립대학교 교수'],professorIntro:['Research on software evolution, trustworthy AI and safe autonomous drone systems.','소프트웨어 진화, 신뢰할 수 있는 AI, 안전한 드론 자율비행을 연구합니다.'],professorDept:['Software Engineering · AI Convergence Engineering','소프트웨어공학과 · AI융합공학과'],professorLink:['Professor’s website ↗','교수님 개인 홈페이지 ↗'],professorSource:['University profile ↗','대학 공식 소개 ↗'],professorTopics:['Research interests','주요 연구 분야'],se:['Software evolution & architecture','소프트웨어 진화·아키텍처'],ai:['AI for software engineering','소프트웨어공학을 위한 AI'],aero:['Autonomous flight & safety analysis','자율비행·안전성 분석'],
 newsIntro:['Research, achievements and activities at SEA Lab.','SEA Lab의 연구·성과·활동을 전합니다.'],galleryIntro:['Moments from our laboratory.','함께 연구하고 성장하는 연구실의 순간들입니다.'],source:['Read source ↗','원문 보기 ↗'],sourceDate:['Source publication date','원문 게시일'],galleryEmpty:['No photographs have been posted yet.','아직 등록된 사진이 없습니다.'],newsEmpty:['No news has been posted yet.','아직 등록된 소식이 없습니다.'],loading:['Loading posts…','게시물을 불러오는 중입니다…'],loadError:['Unable to load saved posts. Please try again.','저장된 게시물을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'],
 internationalJournals:['International Journals','국제학술지'],internationalConferences:['International Conferences','국제학회'],domesticJournals:['Domestic Journals','국내학술지'],domesticConferences:['Domestic Conferences','국내학회'],
 publicationIntro:['Publications by SEA Lab members and Professor Seonah Lee, including earlier work.','SEA Lab 구성원과 이선아 교수님의 논문을 소개합니다. 이전 소속에서 발표한 연구도 포함합니다.'],publicationSource:['Professor Lee’s publication list ↗','교수님 논문 목록 ↗'],languageNote:['Paper titles, citations and member-written biographies are shown in their original language.','논문 제목·서지정보와 멤버가 작성한 자기소개는 원문 언어로 표시합니다.'],
 homeTitle:['Software Evolution and Architecture Lab','소프트웨어 진화 및 아키텍처 연구실'],homeIntro:['We study software evolution and architecture, AI-assisted development, and safe autonomous systems.','소프트웨어 진화와 아키텍처, AI를 활용한 개발, 안전한 자율 시스템을 연구합니다.'],principles:['Our principles','연구실 운영 원칙'],self:['Self-determination','자기주도성'],selfBody:['Members shape their research and run the laboratory together.','구성원이 연구 주제를 주도적으로 탐구하고 함께 연구실을 운영합니다.'],open:['Openness','개방성'],openBody:['We welcome collaboration with other researchers and laboratories.','다른 연구자·연구실과의 협력을 지향합니다.'],ethics:['Research ethics','연구 윤리'],ethicsBody:['We follow professional ethics in software engineering and research.','소프트웨어공학의 직업 윤리와 연구 윤리를 준수합니다.'],location:['Location','위치'],locationBody:['Room 804, Building 601, Gyeongsang National University, Jinju, Korea','경남 진주시 진주대로 501, 경상국립대학교 601동 804호'],
 topic:['Research interests','연구 주제'],autonomous:['Autonomous Flight','자율비행'],reinforcement:['Deep Reinforcement Learning','심층 강화학습'],cad:['3D CAD Automation','3D CAD 자동화'],safety:['System/SW Safety Analysis','시스템·소프트웨어 안전성 분석'],simulation:['Aircraft Simulation','항공기 시뮬레이션']
};
let language='en';try{language=localStorage.getItem('sea-lab-language')==='ko'?'ko':'en';}catch{}
export const getLanguage=()=>language;
export const t=key=>translations[key]?.[language==='ko'?1:0]||key;
export function localized(element,key){element.dataset.i18n=key;element.textContent=t(key);return element;}
export function applyLanguage(root=document){
 root.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));
 root.querySelectorAll('[data-i18n-placeholder]').forEach(el=>el.placeholder=t(el.dataset.i18nPlaceholder));
 root.querySelectorAll('[data-lang]').forEach(el=>el.hidden=el.dataset.lang!==language);
 document.documentElement.lang=language;
 document.querySelectorAll('[data-language]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.language===language)));
}
export function setLanguage(value){if(!['en','ko'].includes(value))return;language=value;try{localStorage.setItem('sea-lab-language',value);}catch{}applyLanguage();document.dispatchEvent(new Event('language-changed'));}
export function setupLanguage(){
 if(!document.querySelector('header')||document.querySelector('.language-switch'))return;
 const control=document.createElement('div');control.className='language-switch';control.setAttribute('role','group');control.setAttribute('aria-label','Language / 언어');
 for(const [value,label] of [['en','EN'],['ko','한국어']]){const button=document.createElement('button');button.type='button';button.dataset.language=value;button.textContent=label;button.onclick=()=>setLanguage(value);control.append(button);}document.querySelector('header').append(control);
 applyLanguage();
}
