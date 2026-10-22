import {clean} from './content.js';

export const researchAreas={SE:'소프트웨어공학',AI:'인공지능',AERO:'항공우주공학'};
export const publicationTypes=['international-journals','international-conferences','domestic-journals','domestic-conferences'];
let defaults=new Map(),loading;
const key=html=>new DOMParser().parseFromString(html,'text/html').body.textContent.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
export function normalizeTags(tags){return Object.keys(researchAreas).filter(tag=>Array.isArray(tags)&&tags.includes(tag));}
export function loadPaperTags(){
  return loading??=(async()=>{
    try{
      const response=await fetch(new URL('./data/publication-tags.json',import.meta.url));
      if(!response.ok)throw Error('Tags unavailable');
      const data=await response.json();
      defaults=new Map(data.entries.filter(entry=>typeof entry.html==='string').map(entry=>[key(entry.html),normalizeTags(entry.tags)]));
      return true;
    }catch{return false;}
  })();
}
export function paperTags(html){
  const explicit=new DOMParser().parseFromString(clean(html),'text/html').querySelector('span[data-paper-tags]');
  return explicit?normalizeTags(explicit.dataset.paperTags.split(' ')):defaults.get(key(html))||[];
}
export function withoutPaperTags(html){
  const doc=new DOMParser().parseFromString(clean(html),'text/html');
  doc.querySelectorAll('span[data-paper-tags]').forEach(span=>span.replaceWith(...span.childNodes));
  return doc.body.innerHTML;
}
export function withPaperTags(html,tags){
  const span=document.createElement('span');span.dataset.paperTags=normalizeTags(tags).join(' ');span.innerHTML=withoutPaperTags(html);return span.outerHTML;
}
export function tagBadges(tags,links=false){
  const box=document.createElement('div');box.className='paper-tags';box.setAttribute('aria-label','연구 분야');
  for(const tag of normalizeTags(tags)){
    const badge=document.createElement(links?'a':'span');badge.className='paper-tag tag-'+tag.toLowerCase();badge.textContent=tag;badge.title=researchAreas[tag];
    if(links)badge.href='search.html?tag='+tag;
    box.append(badge);
  }
  if(!box.children.length){const badge=document.createElement('span');badge.className='paper-tag tag-unclassified';badge.textContent='미분류';box.append(badge);}
  return box;
}
