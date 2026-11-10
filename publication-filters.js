import {publicationDate,paperTags} from './publication-tags.js';
import {t,localized} from './i18n.js';
const normalize=value=>value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const aliases={seonahlee:'Seonah Lee / 이선아',이선아:'Seonah Lee / 이선아',uicheonlee:'Uicheon Lee / 이의천',이의천:'Uicheon Lee / 이의천',seongjingo:'Seongjin Go / 고성진',고성진:'Seongjin Go / 고성진',jiashin:'Jia Shin / 신지아',신지아:'Jia Shin / 신지아',jueunheo:'Jueun Heo / 허주은',허주은:'Jueun Heo / 허주은',detvirak:'Det Virak / 뎃 비락',뎃비락:'Det Virak / 뎃 비락',taehwankim:'Taehwan Kim / 김태환',김태환:'Taehwan Kim / 김태환',heetaecho:'Heetae Cho / 조희태',조희태:'Heetae Cho / 조희태'};
const categoryKeys=['internationalJournals','internationalConferences','domesticJournals','domesticConferences'];
const authorAliases=[['Seonah Lee / 이선아','Seon Ah Lee','Sun-Ah Lee'],['Sungwon Kang / 강성원','Sungwon Kang','강성원'],['Pilsu Jung / 정필수','Pilsu Jung','정필수'],['Changwon Kwak / 곽창원','Changwon Kwak','곽창원'],['Doje Park / 박도제','Doje Park','박도제'],['Hwi Ahn / 안휘','Hwi Ahn','안휘'],['Serin Jeong / 정세린','Serin Jeong','정세린'],['Taehyun Kim / 김태현','Taehyun Kim','김태현'],['Jihyun Yoo / 유지현','Jihyun Yoo','유지현']];
for(const [canonical,...names] of authorAliases)for(const name of names)aliases[normalize(name)]=canonical;
function canonicalAuthor(name){
 name=name.replace(/\s*\(.*$/g,'').replace(/^[&\s]+|[.\s]+$/g,'').replace(/\s+/g,' ');
 return aliases[normalize(name)]||name;
}
const venues=[
 [/IEEE Access/i,'IEEE Access'],[/IEEE Transactions on Software Engineering/i,'IEEE Transactions on Software Engineering'],[/Information and Software Technology/i,'Information and Software Technology'],[/Journal of Systems and Software/i,'Journal of Systems and Software'],[/International Journal of Software Engineering and Knowledge Engineering/i,'International Journal of Software Engineering and Knowledge Engineering'],[/Applied Sciences|Appl\. Sci\./i,'Applied Sciences'],[/\bDrones\b/i,'Drones'],[/\bElectronics\b/i,'Electronics'],[/Transactions on Emerging Telecommunications Technologies/i,'Transactions on Emerging Telecommunications Technologies'],
 [/International Conference on Software Testing.*Workshops/i,'ICST Workshops (ICSTW)'],[/International Workshop on Intelligent Software Engineering/i,'Intelligent Software Engineering (ISE)'],[/Digital Avionics Systems Conference/i,'Digital Avionics Systems Conference (DASC)'],[/International Conference on Software Quality,? Reliability,? and Security/i,'Software Quality, Reliability and Security (QRS)'],[/International Conference on Program Comprehension/i,'International Conference on Program Comprehension (ICPC)'],[/International Conference on Mining Software Repositories/i,'Mining Software Repositories (MSR)'],[/International Conference on Software Maintenance and Evolution/i,'Software Maintenance and Evolution (ICSME)'],[/International Conference on Software Maintenance/i,'Software Maintenance (ICSM)'],[/International Conference on Software Engineering and Knowledge Engineering/i,'Software Engineering and Knowledge Engineering (SEKE)'],[/International Conference on Software Engineering/i,'International Conference on Software Engineering (ICSE)'],[/International Workshop on Bots in Software Engineering/i,'Bots in Software Engineering (BotSE)'],[/ACM\/SIGAPP Symposium On Applied Computing/i,'ACM/SIGAPP Symposium on Applied Computing (SAC)'],[/International Conference on Artificial Intelligence in Information and Communication/i,'Artificial Intelligence in Information and Communication (ICAIIC)'],[/IEEE Symposium on Visual Languages and Human-Centric Computing/i,'Visual Languages and Human-Centric Computing (VL/HCC)'],[/World Congress for Software Quality/i,'World Congress for Software Quality (WCSQ)'],[/International Workshop on Dynamic Analysis/i,'International Workshop on Dynamic Analysis (WODA)'],
 [/Korea Computer Congress/i,'Korea Computer Congress (KCC)'],[/Korea Conference.*Software Engin/i,'Korea Conference on Software Engineering (KCSE)'],[/Korea Software Congress/i,'Korea Software Congress (KSC)'],[/한국정보처리학회논문지|정보처리학회논문지|소프트웨어및데이터공학|소프트웨어 및 데이터 공학/,'정보처리학회논문지 · 소프트웨어 및 데이터 공학'],[/한국정보과학회지|정보과학회지|Communications of The Korea Information Science Society/i,'정보과학회지'],[/정보과학회논문지/,'정보과학회논문지'],[/Journal of KISS(?:\(B\))?: Software and Applications/i,'Journal of KISS · Software and Applications'],[/항공우주시스템공학회지/,'항공우주시스템공학회지'],[/한국항공우주학회지/,'한국항공우주학회지'],[/시스템엔지니어링학술지/,'시스템엔지니어링학술지'],[/한국산학기술학회논문지/,'한국산학기술학회논문지']
];
export function citationMetadata(html){
 const doc=new DOMParser().parseFromString(html,'text/html');doc.querySelectorAll('strong,b').forEach(el=>{if(/award|우수|최우수|수상/i.test(el.textContent))el.remove();});
 const text=doc.body.textContent.replace(/\s+/g,' ').trim();
 const anchor=[...doc.querySelectorAll('a')].filter(a=>!/^pdf$/i.test(a.textContent.trim())).sort((a,b)=>b.textContent.length-a.textContent.length)[0];
 const quote=text.search(/["“「]/);let authorEnd=quote;
 if(authorEnd<0&&anchor&&anchor.textContent.length>15)authorEnd=text.indexOf(anchor.textContent);
 let prefix=authorEnd>0?text.slice(0,authorEnd):'';
 prefix=prefix.replace(/\(?\b(?:19|20)\d{2}\b\)?[.,:]?\s*$/,'').replace(/[.,\s]+$/,'');
 let names=prefix.includes(';')?prefix.split(';').map(part=>part.trim().replace(/^([^,]+),\s*(.+)$/,'$2 $1')):prefix.split(/\s+(?:and|및)\s+|[,、]/).map(s=>s.trim()).filter(Boolean);
 // Bibliographies using “surname, given name” are normalized to given-name order.
 if(names.length>1&&/^[A-Z][a-z-]+$/.test(names[0])&&/^[A-Z][a-z-]+(?:\s+[A-Z][a-z-]+)*$/.test(names[1]))names=[names[1]+' '+names[0],...names.slice(2)];
 names=names.map(name=>name.replace(/^and\s+/,'').replace(/[.\s]+$/,'')).filter(name=>name&&!/\d|https?:|Research Topic/i.test(name));
 if(/^Fathoni, M\. F\./.test(text))names=['M. F. Fathoni','S. N. Lee','Y. S. Kim','K. I. Kim','K. H. Kim'];
 if(/^Jo, Y\.-I\./.test(text))names=['Y.-I. Jo','S. Lee','K. H. Kim'];
 if(/^주요한, 정환균/.test(text))names=['주요한','정환균','이선아'];
 if(/^"이선아, 조희태, 사용자 피드백/.test(text))names=['이선아','조희태'];
 names=names.filter(name=>!/요구사항 추적성 관점에서/.test(name));
 const authors=[...new Set(names.map(canonicalAuthor).filter(Boolean))];
 let venue=doc.querySelector('em,i')?.textContent.trim().replace(/^In\s+/i,'').replace(/[,\s]+(?:19|20)\d{2}.*$/,'')||'';
 if(!venue){
  const ending=quote>=0?text.slice(quote+1).split(/["”」]/).slice(1).join(' '):anchor?text.slice(text.indexOf(anchor.textContent)+anchor.textContent.length):'';
  const known=ending.match(/IEEE Access|Information and Software Technology|Journal of Systems and Software|Korea Computer Congress|Korea Conference (?:on|On) Software Engin\w+|한국정보과학회|항공우주시스템공학회지|Avionics Systems Symposium Korea|Digital Avionics Systems Conference|대한임베디드공학회/i);
  venue=known?.[0]||ending.replace(/^[\s,.“”"]+/,'').replace(/\(?\b(?:19|20)\d{2}\b.*$/,'').replace(/[,.;\s]+$/,'').trim();
 }
 if(/Korea Conference.*Software Engin/i.test(venue))venue='Korea Conference on Software Engineering (KCSE)';
 if(/Korea Computer Congress/i.test(venue))venue='Korea Computer Congress (KCC)';
 const canonicalVenue=venues.find(([pattern])=>pattern.test(venue))||venues.find(([pattern])=>pattern.test(text));
 return {authors,venue:canonicalVenue?.[1]||venue||'',year:publicationDate(html).slice(0,4),tags:paperTags(html)};
}
export function setupPublicationFilters(){
 const groups=[...document.querySelectorAll('.publication-group')];if(!groups.length)return;
 const panel=document.createElement('section');panel.className='publication-explorer';panel.setAttribute('aria-label',t('filters'));
 const heading=localized(document.createElement('h2'),'filters');const intro=localized(document.createElement('p'),'filterIntro');panel.append(heading,intro);
 const query=document.createElement('input');query.type='search';query.id='publication-text-query';const queryLabel=document.createElement('label');queryLabel.htmlFor=query.id;panel.append(queryLabel,query);const queryCopy=()=>{queryLabel.textContent=document.documentElement.lang==='ko'?'논문 제목·저자·연도 검색':'Search title, author or year';query.placeholder=document.documentElement.lang==='ko'?'검색어를 입력하세요':'Enter search terms';};queryCopy();query.oninput=()=>{writeURL();render();};
 const controls=document.createElement('div');controls.className='publication-filter-grid';const selects={};
 for(const field of ['year','author','venue','area']){const box=document.createElement('div'),label=localized(document.createElement('label'),field),select=document.createElement('select');select.id='filter-'+field;label.htmlFor=select.id;selects[field]=select;box.append(label,select);controls.append(box);select.onchange=()=>{writeURL();render();};}
 const reset=localized(document.createElement('button'),'reset');reset.type='button';reset.id='publication-filter-reset';reset.onclick=()=>{query.value='';Object.values(selects).forEach(el=>el.value='');writeURL();render();};controls.append(reset);const advanced=document.createElement('details');advanced.className='publication-advanced';const toggle=document.createElement('summary');advanced.append(toggle,controls);panel.append(advanced);const advancedCopy=()=>toggle.textContent=document.documentElement.lang==='ko'?'상세 필터 (연도·저자·학술지·분야)':'More filters (year, author, venue, area)';advancedCopy();
 const summary=document.createElement('p');summary.id='publication-filter-summary';summary.setAttribute('role','status');summary.setAttribute('aria-live','polite');panel.append(summary);
 const empty=localized(document.createElement('p'),'noPapers');empty.id='publication-filter-empty';empty.hidden=true;panel.append(empty);
 document.querySelector('.category-links').before(panel);
 let papers=[];
 const countLabel=(shown,total)=>shown===total?String(total):shown+' / '+total;
 function options(){
  for(const [field,select] of Object.entries(selects)){
   const prior=select.value;select.replaceChildren(new Option(t('all'),''));
   const values=field==='area'?['SE','AI','AERO','unclassified']:[...new Set(papers.flatMap(p=>field==='author'?p.authors:[p[field]||'unknown']))].sort((a,b)=>field==='year'?b.localeCompare(a):a.localeCompare(b));
   for(const value of values){const label=value==='unknown'?t(field==='year'?'unknownYear':'unknownVenue'):value==='unclassified'?t('unclassified'):value;const count=papers.filter(p=>field==='author'?p.authors.includes(value):field==='area'?value==='unclassified'?!p.tags.length:p.tags.includes(value):(p[field]||'unknown')===value).length;select.append(new Option(label+' ('+count+')',value));}
   if([...select.options].some(o=>o.value===prior))select.value=prior;
  }
 }
 function matches(p){return p.element.textContent.toLocaleLowerCase().includes(query.value.trim().toLocaleLowerCase())&&Object.entries(selects).every(([key,select])=>!select.value||(key==='author'?p.authors.includes(select.value):key==='area'?select.value==='unclassified'?!p.tags.length:p.tags.includes(select.value):(p[key]||'unknown')===select.value));}
 function render(){
  let visible=0;
  for(const paper of papers){paper.element.hidden=!matches(paper);if(!paper.element.hidden)visible++;}
  groups.forEach((group,index)=>{const all=papers.filter(p=>p.group===index),shown=all.filter(p=>!p.element.hidden).length;group.hidden=shown===0;group.querySelector('h2').textContent=t(categoryKeys[index])+' · '+countLabel(shown,all.length);const link=document.querySelector('.category-links a[data-category-index="'+index+'"]');if(link)link.textContent=t(categoryKeys[index])+' ('+countLabel(shown,all.length)+')';});
  summary.textContent=document.documentElement.lang==='ko'?`전체 ${papers.length}편 중 ${visible}편 표시`:`Showing ${visible} of ${papers.length} publications`;empty.hidden=visible!==0;
 }
 function writeURL(){const url=new URL(location.href);if(query.value.trim())url.searchParams.set('q',query.value.trim());else url.searchParams.delete('q');for(const [key,select] of Object.entries(selects)){if(select.value)url.searchParams.set(key,select.value);else url.searchParams.delete(key);}history.replaceState(null,'',url);}
 function restore(){const params=new URLSearchParams(location.search);query.value=params.get('q')||'';for(const [key,select] of Object.entries(selects)){const value=params.get(key);if([...select.options].some(o=>o.value===value))select.value=value;}advanced.open=Object.values(selects).some(select=>select.value);}
 function collect(){const previous=Object.fromEntries(Object.entries(selects).map(([key,select])=>[key,select.value]));papers=groups.flatMap((group,index)=>[...group.querySelectorAll('li')].map(element=>({...citationMetadata(element.querySelector('.paper-citation')?.innerHTML||element.innerHTML),element,group:index})));options();restore();for(const [key,value] of Object.entries(previous))if(value&&[...selects[key].options].some(o=>o.value===value))selects[key].value=value;revealTarget();render();}
 function revealTarget(){const target=papers.find(p=>'#'+p.element.id===location.hash);if(target&&!matches(target)){query.value='';Object.values(selects).forEach(el=>el.value='');writeURL();}}
 document.addEventListener('content-updated',collect);document.addEventListener('language-changed',()=>{queryCopy();advancedCopy();options();render();});window.addEventListener('popstate',()=>{restore();render();});window.addEventListener('hashchange',()=>{revealTarget();render();});collect();
}
