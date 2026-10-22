import {readEntries} from './collections.js';
const kind=document.body.classList.contains('page-gallery')?'gallery':'news';
const status=document.getElementById('collection-status'),list=document.getElementById('collection-items');
const node=(tag,text,className)=>{const el=document.createElement(tag);if(text)el.textContent=text;if(className)el.className=className;return el;};
const dialog=document.getElementById('gallery-viewer');
if(dialog){
  document.getElementById('viewer-close').onclick=()=>dialog.close();
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
}
try{
  const entries=await readEntries(kind);
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
    }else card.append(date,node('h2',entry.title),node('p',entry.body,'news-body'));
    list.append(card);
  }
  status.textContent=entries.length?(kind==='gallery'?'연구실의 순간들 · '+entries.length+'장의 사진':'전체 '+entries.length+'개의 소식'):
    (kind==='gallery'?'아직 등록된 사진이 없습니다.':'아직 등록된 소식이 없습니다.');
}catch{status.textContent='게시물을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';}
