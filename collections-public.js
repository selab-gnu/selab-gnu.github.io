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
async function load(){
 let timer;
 const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),6000);});
 await Promise.allSettled([
  Promise.race([readEntries(kind),timeout]).then(entries=>{saved=entries;render();}).catch(()=>{failed=true;render();}).finally(()=>clearTimeout(timer)),
  kind==='news'?fetch('./data/news-curated.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{curated=data.entries;render();}).catch(()=>{}):Promise.resolve()
 ]);
}
function render(){
  list.replaceChildren();
  const language=getLanguage();const publishedSources=new Set(saved.map(e=>e.source).filter(Boolean));
  const entries=[...saved,...curated.filter(e=>!saved.some(s=>s.id===e.id)&&!publishedSources.has(e.source)).map(e=>({...e,title:e.title[language],body:e.body[language],curated:true}))].sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
  for(const entry of entries){
    const card=node('article',null,kind==='gallery'?'gallery-card':'news-card');card.id=kind+'-'+entry.id;
    const date=node('time',entry.date);date.dateTime=entry.date;
    if(kind==='gallery'){
      const button=node('button',null,'gallery-open');button.type='button';button.setAttribute('aria-label',entry.title+' 사진 크게 보기');
      const image=node('img');image.src=entry.image;image.alt=entry.title;image.loading='lazy';image.width=800;image.height=600;
      button.append(image);button.onclick=()=>{
        const full=document.getElementById('viewer-image');full.src=entry.image;full.alt=entry.title;
        document.getElementById('viewer-title').textContent=entry.title;document.getElementById('viewer-caption').textContent=entry.caption;dialog.showModal();
      };
      card.append(button,node('h2',entry.title),date,node('p',entry.caption,'gallery-caption'));
    }else{
      if(entry.curated)date.title=entry.dateKind==='event'?(language==='ko'?'공식 프로그램 행사일':'Official program event date'):t('sourceDate');
      card.append(date,node('h2',entry.title),node('p',entry.body,'news-body'));
      if(entry.source){const source=node('a',t('source')+' · '+entry.sourceName,'news-source');source.href=entry.source;card.append(source);}
    }
    list.append(card);
  }
  status.textContent=entries.length?(language==='ko'?'전체 '+entries.length+(kind==='gallery'?'장의 사진':'개의 소식'):entries.length+(kind==='gallery'?' photographs':' news items')):t(kind==='gallery'?'galleryEmpty':'newsEmpty');
  if(failed)status.textContent+=' · '+t('loadError');
}
document.addEventListener('language-changed',render);
load();
