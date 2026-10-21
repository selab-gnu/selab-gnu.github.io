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
let papers=[],courses=[],query='',scope='all',loaded=false;

function publicationEntries(groups){
  return groups.flatMap((group,gi)=>group.items.map((html,ii)=>{
    const doc=new DOMParser().parseFromString(html,'text/html');
    const title=[...doc.querySelectorAll('a')].sort((a,b)=>b.textContent.trim().length-a.textContent.trim().length)[0]?.textContent;
    return {title:normalize(title||plain(html)),text:plain(html),category:group.category,anchor:'publication-'+gi+'-'+ii};
  }));
}
function matching(entries){const needle=query.toLocaleLowerCase();return entries.filter(entry=>(entry.title+' '+entry.text).toLocaleLowerCase().includes(needle));}
function excerpt(text){const index=text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());const start=Math.max(0,index-70);return (start?'…':'')+text.slice(start,start+240)+(text.length>start+240?'…':'');}
function highlighted(element,value){
  const lower=value.toLocaleLowerCase(),needle=query.toLocaleLowerCase();let from=0,index;
  while(needle&&(index=lower.indexOf(needle,from))!==-1){element.append(document.createTextNode(value.slice(from,index)));const mark=document.createElement('mark');mark.textContent=value.slice(index,index+needle.length);element.append(mark);from=index+needle.length;}
  element.append(document.createTextNode(value.slice(from)));
}
function renderList(id,entries,type){
  const list=$(id);list.replaceChildren();
  for(const entry of entries){
    const li=document.createElement('li'),heading=document.createElement('h3'),link=document.createElement('a'),meta=document.createElement('p'),summary=document.createElement('p');
    link.href=type==='publications'?'publications.html?q='+encodeURIComponent(query)+'#'+entry.anchor:entry.path;
    highlighted(link,entry.title);heading.append(link);
    meta.className='search-result-kind';meta.textContent=type==='publications'?entry.category:'Course · 강의 자료';
    summary.className='search-excerpt';highlighted(summary,excerpt(entry.text));li.append(meta,heading,summary);list.append(li);
  }
}
function render(){
  const searching=!!query;$('#search-results').hidden=!searching;$('#search-hint').hidden=searching;
  if(!searching){$('#search-summary').textContent='논문 제목·저자·연도와 강의 제목·본문을 검색합니다.';return;}
  if(!loaded){$('#search-summary').textContent='검색 자료를 불러오는 중입니다…';return;}
  const pub=matching(papers),course=matching(courses);
  $('#search-summary').textContent='“'+query+'” 검색 결과: 논문 '+pub.length+'편 · 강의 '+course.length+'개';
  $('#scope-all-count').textContent=pub.length+course.length;$('#scope-publications-count').textContent=pub.length;$('#scope-courses-count').textContent=course.length;
  $('#publication-result-count').textContent=pub.length+'편';$('#course-result-count').textContent=course.length+'개';
  $('#publication-results').hidden=scope==='courses';$('#course-results').hidden=scope==='publications';
  $('#publication-no-results').hidden=pub.length!==0;$('#course-no-results').hidden=course.length!==0;
  renderList('#publication-search-list',pub,'publications');renderList('#course-search-list',course,'courses');
  document.querySelectorAll('[data-search-scope]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.searchScope===scope)));
}
function setQuery(value,push=false){query=normalize(value);$('#site-query').value=query;$('#header-search').value=query;const url=new URL(location.href);if(query)url.searchParams.set('q',query);else url.searchParams.delete('q');if(push)history.pushState(null,'',url);render();}
$('#site-search-form').addEventListener('submit',event=>{event.preventDefault();setQuery($('#site-query').value,true);});
document.querySelectorAll('[data-search-scope]').forEach(button=>button.onclick=()=>{scope=button.dataset.searchScope;render();});
window.addEventListener('popstate',()=>setQuery(new URLSearchParams(location.search).get('q')||''));
setQuery(new URLSearchParams(location.search).get('q')||'');

// Load each source independently: unavailable cloud data must not hide courses.
const results=await Promise.allSettled(['data/publications.json','data/sections.json'].map(async path=>{
  const response=await fetch(path);if(!response.ok)throw Error(path);return response.json();
}));
if(results[0].status==='fulfilled')papers=publicationEntries(results[0].value);
if(results[1].status==='fulfilled')courses=results[1].value.filter(item=>item.section==='Courses'&&item.path!=='courses.html'&&/^[a-z0-9-]+\.html$/.test(item.path)).map(item=>({title:item.title,text:plain(item.html),path:item.path}));
loaded=true;render();
const unavailable=[];if(results[0].status==='rejected')unavailable.push('논문');if(results[1].status==='rejected')unavailable.push('강의');
$('#search-data-status').textContent=unavailable.length?unavailable.join('·')+' 자료를 불러오지 못했습니다. 새로고침해주세요.':'논문과 강의의 등록된 텍스트를 검색합니다. PDF·첨부파일 내부는 검색하지 않습니다.';
try {
  let timer;
  const readCloud=async()=>{const { contentRef,getDoc }=await import('./firebase-client.js');return getDoc(contentRef);};
  const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),6000);});
  let snap;try{snap=await Promise.race([readCloud(),timeout]);}finally{clearTimeout(timer);}
  if(snap.exists()){
    const content=snap.data();if(!validContent(content))throw Error('Invalid content');
    papers=publicationEntries(content.groups);render();
    if(results[0].status==='rejected')$('#search-data-status').textContent=results[1].status==='rejected'?'강의 자료를 불러오지 못했습니다. 새로고침해주세요.':'공개 저장된 최신 논문과 강의의 등록된 텍스트를 검색합니다. PDF·첨부파일 내부는 검색하지 않습니다.';
  }
}catch{
  if(results[0].status==='fulfilled')$('#search-data-status').textContent=(results[1].status==='rejected'?'강의 자료를 불러오지 못했습니다. ':'')+'최신 공개 논문을 확인하지 못해 저장소의 논문 자료로 검색했습니다. PDF·첨부파일 내부는 검색하지 않습니다.';
}
