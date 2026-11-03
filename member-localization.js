import {getLanguage} from './i18n.js';
const key=name=>name.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const names=[
 ['Seonah Lee, Ph.D','이선아','Seonah Lee','이선아 교수'],['Heetae Cho','조희태'],['Jueun Heo','허주은'],['Uicheon Lee','이의천'],['Taehwan Kim','김태환'],['Hyug Jang','장혁'],['Seongjin Go','고성진'],['Det Virak','뎃 비락','det virak'],['Kajal Patel','파텔 카잘','Patel Kajal'],['Dongeun Lee','이동은'],['Jia Shin','신지아'],['Gyutae Kim','김규태'],['Seongwan Lim','임성완'],
 ['Changwon Gwak','곽창원','Changwon Kwak'],['Doje Park','박도제'],['Jongyeol Park','박종열'],['Seongseop Kim','김성섭'],['Jaeman Kim','김재만'],['Jeongwon Lee','이정원'],['Jeongbin Yoon','윤정빈'],['Junho Lee','이준호','JunHo Lee'],['Jongwon Lee','이종원'],['Kibeom Kwon','권기범'],['Sunho Lee','이선호'],['Euijin Choi','최의진'],['Mukhtar Samal','무크타르 사말']
];
const nameIndex=new Map(names.flatMap(([en,ko,...aliases])=>[en,ko,...aliases].map(name=>[key(name),{en,ko}])));
export const canonicalMemberName=(name,language=getLanguage())=>nameIndex.get(key(name))?.[language]||name;
const phrases=[
 ['MS graduated, PhD Student','석사 졸업 · 박사과정'],['Undergraduate Research Student','학부연구생'],['PhD Student','박사과정'],['MS Student','석사과정'],['Professor','교수'],
 ['Department of Aerospace and Software Engineering','항공우주및소프트웨어공학부'],['Department of AI Convergence Engineering','AI융합공학과'],['Department of Software Engineering','소프트웨어공학과'],['Gyeongsang National University','경상국립대학교'],['Gyeongsang National University','경상국립대'],
 ['Jinjudaero 501, Jinju City, South Gyeongsang Province, Korea, 52828.','경상남도 진주시 진주대로 501, 52828'],
 ['A deep learning technique in code recommendation','코드 추천을 위한 딥러닝 기법'],['AI4SE, classification','소프트웨어공학을 위한 AI, 분류'],
 ['Autonomous Flight','자율비행'],['Deep Reinforcement Learning','심층 강화학습'],['3D CAD Automation','3D CAD 자동화'],['System/SW Safety Analysis','시스템·소프트웨어 안전성 분석'],['Aircraft Simulation','항공기 시뮬레이션'],['Reinforcement learning, Ad-hoc network routing protocol, safety requirement','강화학습, 애드혹 네트워크 라우팅 프로토콜, 안전 요구사항'],
 ['Scenario-based Test Cases for the Verification of an Automatic Flight Control Computer','자동비행조종컴퓨터 검증을 위한 시나리오 기반 시험 사례'],['Software engineering & requirement traceability','소프트웨어공학·요구사항 추적성'],['Classification of multiple labels in text','텍스트 다중 레이블 분류'],['Software Architecture, Micro Service Architecture','소프트웨어 아키텍처, 마이크로서비스 아키텍처'],['Multi-modal DL, Document classification','멀티모달 딥러닝, 문서 분류'],['Document Summarization using DL','딥러닝을 이용한 문서 요약'],['Software Traceability','소프트웨어 추적성'],['API Evolution','API 진화'],['Reinforcement Learning','강화학습'],
 ['University of Manchester, UK (PhD student)','영국 맨체스터대학교 박사과정'],['Japan, Appia Engineering','일본 Appia Engineering'],['Hyundai Rotem','현대로템'],['LIG Nex1','LIG넥스원'],['POSCO Technical Research Laboratories','POSCO 기술연구원'],['MOASOFT','모아소프트'],['Korea Aerospace Industries (KAI)','한국항공우주산업(주) KAI'],['SK C&C','SK C&C (SK 주식회사)'],
 ['Research Topic:','연구 주제:'],['Email:','이메일:'],['Homepage:','홈페이지:'],['Phone:','전화:'],['M.S.','석사']
];
phrases.push(['MOASOFT','(주)모아소프트'],['MOASOFT','(주)MOASOFT']);
const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function translateMemberText(text,language=getLanguage()){
 let result=text.normalize('NFKC').replace(/\u00a0/g,' ').replace(/(?:part|full)[ -]?time\s*/ig,'').replace(/Enrollment:\s*/g,'');
 const replacements=phrases.map(([en,ko])=>language==='ko'?[en,ko]:[ko,en]).sort((a,b)=>b[0].length-a[0].length);
 // One pass avoids translating a newly inserted phrase a second time.
 const pattern=new RegExp(replacements.map(([from])=>escape(from).replace(/ /g,'\\s+')).join('|'),'gi');
 result=result.replace(pattern,match=>replacements.find(([from])=>new RegExp('^'+escape(from).replace(/ /g,'\\s+')+'$','i').test(match))?.[1]||match);
 return result.replace(/Repulic of Korea/gi,'Republic of Korea');
}
export function bilingualText(tag,text,className=''){
 const element=document.createElement(tag);if(className)element.className=className;
 for(const language of ['en','ko']){const span=document.createElement('span');span.dataset.lang=language;span.hidden=language!==getLanguage();span.textContent=translateMemberText(text,language);element.append(span);}
 return element;
}
export function memberName(name){
 const translations=nameIndex.get(key(name))||{en:name,ko:name};const heading=document.createElement('h3');
 for(const language of ['en','ko']){const span=document.createElement('span');span.dataset.lang=language;span.hidden=language!==getLanguage();span.textContent=translations[language];if(language==='ko'&&translations.ko!==translations.en){const english=document.createElement('small');english.className='member-romanized';english.textContent=translations.en;span.append(document.createTextNode(' '),english);}heading.append(span);}
 return heading;
}
export function bilingualProfileDetails(content,profileName){
 const result=document.createElement('div');
 for(const language of ['en','ko']){
  const copy=content.cloneNode(true);copy.dataset.lang=language;copy.hidden=language!==getLanguage();
  const heading=copy.querySelector('strong,b');if(heading&&key(heading.textContent)===key(profileName))heading.textContent=canonicalMemberName(profileName,language);
  const walker=document.createTreeWalker(copy,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode())node.textContent=translateMemberText(node.textContent,language);
  result.append(copy);
 }
 return result;
}
// Exact document/name exclusions requested by the owner; other profiles are unaffected.
export const removedMemberIds=['a893f9cf-5023-4546-90b4-47822e884917'];
export const isRemovedMember=profile=>removedMemberIds.includes(profile.id)||/^(?:이연우|yeonu\s+lee|yeonwoo\s+lee|lee\s+yeonu)$/i.test(profile.name.trim());
export function visibleMembers(profiles){return profiles.filter(profile=>!isRemovedMember(profile));}
