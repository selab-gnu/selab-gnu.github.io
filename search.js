import {loadPaperTags,paperTags,tagBadges,researchAreas,publicationTypes} from './publication-tags.js';
import { validContent } from './content.js';

const $=selector=>document.querySelector(selector);
const normalize=value=>value.replace(/\s+/g,' ').trim();
const plain=html=>{
  const doc=new DOMParser().parseFromString(html,'text/html');
  doc.querySelectorAll('script,style').forEach(el=>el.remove());
  doc.querySelectorAll('br').forEach(el=>el.replaceWith(' '));
  doc.querySelectorAll('p,div,li,td,th,h1,h2,h3,h4,tr').forEach(el=>el.append(' '));
  return normalize(doc.body.textContent);
};
let papers=[],query='',area='all',type='all',loaded=false;

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
    link.href='publications.html#'+entry.anchor;
    highlighted(link,entry.title);heading.append(link);
    meta.className='search-result-kind';meta.textContent=entry.category;
    summary.className='search-excerpt';highlighted(summary,excerpt(entry.text));li.append(meta,heading,tagBadges(entry.tags),summary);list.append(li);
  }
}
function render(){
  const searching=!!query||area!=='all'||type!=='all';$('#search-results').hidden=!searching;$('#search-hint').hidden=searching;
  if(!searching){$('#search-summary').textContent='논문 제목·저자·연도를 검색합니다.';return;}
  if(!loaded){$('#search-summary').textContent='검색 자료를 불러오는 중입니다…';return;}
  const pub=matching(papers);
  $('#search-summary').textContent=(query?'“'+query+'” 검색 결과':'분야·유형별 논문')+': '+pub.length+'편'+(area!=='all'?' · '+(area==='unclassified'?'미분류':area):'')+(type!=='all'?' · '+$('#publication-type-filter').selectedOptions[0].textContent:'');
  $('#publication-result-count').textContent=pub.length+'편';
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
$('#search-data-status').textContent=repositoryLoaded?'등록된 논문 텍스트를 검색합니다. PDF·첨부파일 내부는 검색하지 않습니다.':'논문 자료를 불러오지 못했습니다. 새로고침해주세요.';
try {
  let timer;
  const readCloud=async()=>{const { contentRef,getDoc }=await import('./firebase-client.js');return getDoc(contentRef);};
  const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),6000);});
  let snap;try{snap=await Promise.race([readCloud(),timeout]);}finally{clearTimeout(timer);}
  if(snap.exists()){
    const content=snap.data();if(!validContent(content))throw Error('Invalid content');
    papers=publicationEntries(content.groups);render();
    $('#search-data-status').textContent='공개 저장된 최신 논문 텍스트를 검색합니다. PDF·첨부파일 내부는 검색하지 않습니다.';
  }
}catch{
  if(repositoryLoaded)$('#search-data-status').textContent='최신 공개 논문을 확인하지 못해 저장소의 논문 자료로 검색했습니다. PDF·첨부파일 내부는 검색하지 않습니다.';
}
