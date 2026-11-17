import {mergeNews} from './news-data.js';
import {readEntries} from './collections.js';
import {getLanguage,t} from './i18n.js';
const kind=document.body.classList.contains('page-gallery')?'gallery':'news';
const status=document.getElementById('collection-status'),list=document.getElementById('collection-items');
const node=(tag,text,className)=>{const el=document.createElement(tag);if(text)el.textContent=text;if(className)el.className=className;return el;};
const dialog=document.getElementById('gallery-viewer');
if(dialog){
  document.getElementById('viewer-close').onclick=()=>dialog.close();
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
}
let curated=[],saved=[],failed=false;
const searchInput=document.getElementById('news-query');
let query=new URLSearchParams(location.search).get('q')||'';
const normalize=value=>String(value||'').normalize('NFKC').replace(/\s+/g,' ').trim().toLocaleLowerCase();
if(searchInput){searchInput.value=query;const update=()=>{query=searchInput.value;const url=new URL(location.href);if(query.trim())url.searchParams.set('q',query.trim());else url.searchParams.delete('q');history.replaceState(null,'',url);render();};searchInput.oninput=update;document.getElementById('news-search-form').onsubmit=event=>{event.preventDefault();update();};window.addEventListener('popstate',()=>{query=new URLSearchParams(location.search).get('q')||'';searchInput.value=query;render();});}
async function load(){
 let timer;
 const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),6000);});
 await Promise.allSettled([
  Promise.race([readEntries(kind),timeout]).then(entries=>{saved=entries;render();}).catch(()=>{failed=true;render();}).finally(()=>clearTimeout(timer)),
  kind==='news'?fetch('./data/news-curated.json?v=20261117-news33',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{curated=data.entries;render();}).catch(()=>{}):Promise.resolve()
 ]);
}
function render(){
  list.replaceChildren();
  const language=getLanguage();
  if(dialog){document.getElementById('viewer-close').textContent=t('closeViewer');document.getElementById('viewer-close').setAttribute('aria-label',t('closeViewer'));}
  const all=mergeNews(saved,curated);const needle=normalize(query);const filtered=all.filter(entry=>!needle||normalize([...(typeof entry.title==='object'?Object.values(entry.title):[entry.title]),...(typeof entry.body==='object'?Object.values(entry.body):[entry.body])].join(' ')).includes(needle));
  const entries=filtered.map(e=>typeof e.title==='object'?{...e,title:e.title[language],body:e.body[language],curated:true}:e);
  if(searchInput){document.getElementById('news-search-label').textContent=language==='ko'?'뉴스 검색':'Search news';document.getElementById('news-search-submit').textContent=language==='ko'?'검색':'Search';searchInput.placeholder=language==='ko'?'제목·본문 키워드 검색 (예: 이의천, DASC, 장학금)':'Search titles and text (e.g. DASC, scholarship)';const empty=document.getElementById('news-search-empty');empty.hidden=!needle||entries.length>0;empty.textContent=language==='ko'?'일치하는 뉴스가 없습니다. 다른 키워드로 검색해보세요.':'No matching news. Try another keyword.';}
  for(const entry of entries){
    const card=node('article',null,kind==='gallery'?'gallery-card':'news-card');card.id=kind+'-'+entry.id;
    const date=node('time',entry.date);date.dateTime=entry.date;
    if(kind==='gallery'){
      const button=node('button',null,'gallery-open');button.type='button';button.setAttribute('aria-label',t('photoView')+' · '+entry.title);
      const image=node('img');image.src=entry.image;image.alt=entry.title;image.loading='lazy';image.width=800;image.height=600;
      button.append(image);button.onclick=()=>{
        const full=document.getElementById('viewer-image');full.src=entry.image;full.alt=entry.title;
        document.getElementById('viewer-title').textContent=entry.title;document.getElementById('viewer-caption').textContent=entry.caption;dialog.showModal();
      };
      card.append(button,node('h2',entry.title),date,node('p',entry.caption,'gallery-caption'));
    }else{
      if(entry.curated)date.title=entry.dateKind==='event'?(language==='ko'?'공식 프로그램 행사일':'Official program event date'):t('sourceDate');
      const dateKind=node('span',entry.dateKind==='event'?(language==='ko'?'행사일':'Event date'):entry.dateKind==='video'?(language==='ko'?'영상 공개일':'Video released'):(language==='ko'?'게시일':'Posted'),'news-date-kind');card.append(date,dateKind,node('h2',entry.title),node('p',entry.body,'news-body'));
      const sources=entry.sources|| (entry.source?[{url:entry.source,name:{ko:entry.sourceName||'출처',en:({'경상국립대학교 · GNU':'Gyeongsang National University · GNU','경상국립대학교 소프트웨어공학과':'GNU Department of Software Engineering'}[entry.sourceName]||entry.sourceName||'Source')},label:{ko:'원문 보기',en:'Read source'}}]:[]);
      const links=node('div',null,'news-source-links');for(const item of sources){if(!/^https?:\/\//i.test(item.url))continue;const name=typeof item.name==='object'?item.name[language]:item.name;const label=item.label?.[language]||(language==='ko'?'원문 보기':'Read source');const source=node('a',label+' ↗ · '+name,'news-source');source.href=item.url;links.append(source);}if(links.childNodes.length)card.append(links);

    }
    list.append(card);
  }
  status.textContent=entries.length?(language==='ko'?'전체 '+entries.length+(kind==='gallery'?'장의 사진':'개의 소식'):entries.length+(kind==='gallery'?' photographs':' news items')):t(kind==='gallery'?'galleryEmpty':'newsEmpty');
  if(searchInput&&needle)status.textContent=language==='ko'?'전체 '+all.length+'개 소식 중 '+entries.length+'개 검색됨':entries.length+' of '+all.length+' news items matched';
  if(failed)status.textContent+=' · '+t('loadError');
}
document.addEventListener('language-changed',render);
load();
