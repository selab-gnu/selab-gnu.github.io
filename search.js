import {loadPublicationImports,mergePublicationImports} from './publication-imports.js';
import {loadPaperTags,paperTags,tagBadges,researchAreas,publicationTypes} from './publication-tags.js';
import { validContent } from './content.js';
import {getLanguage,t,languageURL} from './i18n.js';
const ko=()=>getLanguage()==='ko';

const $=selector=>document.querySelector(selector);
const normalize=value=>value.replace(/\s+/g,' ').trim();
const plain=html=>{
  const doc=new DOMParser().parseFromString(html,'text/html');
  doc.querySelectorAll('script,style').forEach(el=>el.remove());
  doc.querySelectorAll('br').forEach(el=>el.replaceWith(' '));
  doc.querySelectorAll('p,div,li,td,th,h1,h2,h3,h4,tr').forEach(el=>el.append(' '));
  return normalize(doc.body.textContent);
};
let papers=[],query='',area='all',type='all',loaded=false,dataMode='';
function dataStatus(mode=dataMode){dataMode=mode;const messages={repository:['등록된 논문 텍스트를 검색합니다. PDF·첨부파일 내부는 검색하지 않습니다.','Searches citation text; PDF and attachment contents are not indexed.'],error:['논문 자료를 불러오지 못했습니다. 새로고침해주세요.','Unable to load publications. Please reload.'],cloud:['공개 저장된 최신 논문 텍스트를 검색합니다. PDF·첨부파일 내부는 검색하지 않습니다.','Searches the latest published citations; PDF and attachment contents are not indexed.'],fallback:['최신 공개 논문을 확인하지 못해 저장소의 논문 자료로 검색했습니다. PDF·첨부파일 내부는 검색하지 않습니다.','Using repository publications because the latest cloud data is unavailable. PDF and attachment contents are not indexed.']};$('#search-data-status').textContent=messages[mode]?.[ko()?0:1]||'';}

function publicationEntries(groups){
  return groups.flatMap((group,gi)=>group.items.map((html,ii)=>{
    const doc=new DOMParser().parseFromString(html,'text/html');
    const title=[...doc.querySelectorAll('a')].sort((a,b)=>b.textContent.trim().length-a.textContent.trim().length)[0]?.textContent;
    return {title:normalize(title||plain(html)),text:plain(html),category:group.category,type:publicationTypes[gi],tags:paperTags(html),anchor:'publication-'+gi+'-'+ii};
  }));
}
function matching(entries){const needle=query.toLocaleLowerCase();return entries.filter(entry=>(entry.title+' '+entry.text).toLocaleLowerCase().includes(needle)&&(area==='all'||(area==='unclassified'?entry.tags.length===0:entry.tags.includes(area)))&&(type==='all'||entry.type===type));}
function excerpt(text){const index=text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());const start=Math.max(0,index-70);return (start?'…':'')+text.slice(start,start+240)+(text.length>start+240?'…':'');}
function highlighted(element,value){
  const lower=value.toLocaleLowerCase(),needle=query.toLocaleLowerCase();let from=0,index;
  while(needle&&(index=lower.indexOf(needle,from))!==-1){element.append(document.createTextNode(value.slice(from,index)));const mark=document.createElement('mark');mark.textContent=value.slice(index,index+needle.length);element.append(mark);from=index+needle.length;}
  element.append(document.createTextNode(value.slice(from)));
}
function renderList(id,entries){
  const list=$(id);list.replaceChildren();
  for(const entry of entries){
    const li=document.createElement('li'),heading=document.createElement('h3'),link=document.createElement('a'),meta=document.createElement('p'),summary=document.createElement('p');
    link.href=languageURL('publications.html#'+entry.anchor);
    highlighted(link,entry.title);heading.append(link);
    meta.className='search-result-kind';meta.textContent=t(['internationalJournals','internationalConferences','domesticJournals','domesticConferences'][publicationTypes.indexOf(entry.type)])||entry.category;
    summary.className='search-excerpt';highlighted(summary,excerpt(entry.text));li.append(meta,heading,tagBadges(entry.tags),summary);list.append(li);
  }
}
function render(){
  const searching=!!query||area!=='all'||type!=='all';$('#search-results').hidden=!searching;$('#search-hint').hidden=searching;
  if(!searching){$('#search-summary').textContent=ko()?'논문 제목·저자·연도를 검색합니다.':'Search publication titles, authors and years.';return;}
  if(!loaded){$('#search-summary').textContent=ko()?'검색 자료를 불러오는 중입니다…':'Loading publications…';return;}
  const pub=matching(papers);
  $('#search-summary').textContent=(query?'“'+query+'” '+(ko()?'검색 결과':'results'):(ko()?'분야·유형별 논문':'Publications by area and type'))+': '+pub.length+(ko()?'편':' publications')+(area!=='all'?' · '+(area==='unclassified'?t('unclassified'):area):'')+(type!=='all'?' · '+$('#publication-type-filter').selectedOptions[0].textContent:'');
  $('#publication-result-count').textContent=pub.length+(ko()?'편':' publications');
  $('#publication-no-results').hidden=pub.length!==0;
  renderList('#publication-search-list',pub);
}
function writeURL(push){
 const url=new URL(location.href);
 for(const [key,value] of [['q',query],['tag',area==='all'?'':area],['type',type==='all'?'':type]]){
  if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);
 }
 if(push)history.pushState(null,'',url);
}
function applySearch(push=true){
 query=normalize($('#site-query').value);area=$('#research-filter').value;type=$('#publication-type-filter').value;
 $('#header-search').value=query;writeURL(push);render();
}
function restoreSearch(){
 const params=new URLSearchParams(location.search);query=normalize(params.get('q')||'');
 const candidate=params.get('tag');area=Object.hasOwn(researchAreas,candidate)||candidate==='unclassified'?candidate:'all';
 type=publicationTypes.includes(params.get('type'))?params.get('type'):'all';
 $('#site-query').value=query;$('#header-search').value=query;$('#research-filter').value=area;$('#publication-type-filter').value=type;render();
}
$('#site-search-form').addEventListener('submit',event=>{event.preventDefault();applySearch();});
function translateSearch(){
 const labels=[['main>h1','논문 검색','Publication search'],['.search-intro','논문 제목·저자·연도로 연구실의 논문을 검색하세요.','Search the laboratory’s publications by title, author or year.'],['label[for="site-query"]','검색어','Search terms'],['label[for="research-filter"]','연구 분야','Research area'],['label[for="publication-type-filter"]','게재 유형','Publication type'],['#reset-search-filters','필터 초기화','Reset filters'],['#site-search-form button','검색','Search'],['#search-hint','검색어를 입력하거나 연구 분야·게재 유형을 선택하세요.','Enter search terms or select a research area or publication type.'],['#publication-no-results','일치하는 논문이 없습니다.','No matching publications.']];
 for(const [selector,korean,english] of labels)$(selector).textContent=ko()?korean:english;
 $('#site-query').placeholder=ko()?'예: object, traceability, 저자 이름':'e.g. object, traceability, author name';
 const areas=ko()?['전체 분야','SE · 소프트웨어공학','AI · 인공지능','AERO · 항공우주공학','미분류']:['All areas','SE · Software Engineering','AI · Artificial Intelligence','AERO · Aerospace Engineering','Unclassified'];
 [...$('#research-filter').options].forEach((o,i)=>o.textContent=areas[i]);
 const types=ko()?['전체 유형','국제학술지','국제학회','국내학술지','국내학회']:['All types','International journals','International conferences','Domestic journals','Domestic conferences'];
 [...$('#publication-type-filter').options].forEach((o,i)=>o.textContent=types[i]);
 document.querySelector('#publication-results-title').firstChild.textContent=ko()?'논문 ':'Publications ';
 dataStatus();
 render();
}
document.addEventListener('language-changed',translateSearch);translateSearch();
$('#research-filter').onchange=()=>applySearch();$('#publication-type-filter').onchange=()=>applySearch();
$('#reset-search-filters').onclick=()=>{$('#research-filter').value='all';$('#publication-type-filter').value='all';applySearch();};
window.addEventListener('popstate',restoreSearch);restoreSearch();
await loadPaperTags();

let repositoryLoaded=false;
try {
  const response=await fetch('data/publications.json');
  if(!response.ok)throw Error('Publications unavailable');
  papers=publicationEntries(await response.json());repositoryLoaded=true;
}catch{}
loaded=true;render();
dataStatus(repositoryLoaded?'repository':'error');
try {
  let timer;
  const readCloud=async()=>{const { contentRef,getDoc }=await import('./firebase-client.js');return getDoc(contentRef);};
  const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),6000);});
  let snap;try{snap=await Promise.race([readCloud(),timeout]);}finally{clearTimeout(timer);}
  if(snap.exists()){
    const content=snap.data();if(!validContent(content))throw Error('Invalid content');
    const combined=mergePublicationImports(content.groups,await loadPublicationImports());
    papers=publicationEntries(combined.groups);render();
    dataStatus('cloud');
  }
}catch{
  if(repositoryLoaded)dataStatus('fallback');
}
