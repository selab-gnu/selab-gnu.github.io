import {clean} from './content.js';
import {getLanguage,t} from './i18n.js';

export const researchAreas={SE:'소프트웨어공학',AI:'인공지능',AERO:'항공우주공학'};
export const publicationTypes=['international-journals','international-conferences','domestic-journals','domestic-conferences'];
let defaults=new Map(),dates=new Map(),loading;
const key=html=>new DOMParser().parseFromString(html,'text/html').body.textContent.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
export function normalizeTags(tags){return Object.keys(researchAreas).filter(tag=>Array.isArray(tags)&&tags.includes(tag));}
export function loadPaperTags(){
  return loading??=(async()=>{
    try{
      const response=await fetch(new URL('./data/publication-tags.json',import.meta.url));
      if(!response.ok)throw Error('Tags unavailable');
      const data=await response.json();
      defaults=new Map(data.entries.filter(entry=>typeof entry.html==='string').map(entry=>[key(entry.html),normalizeTags(entry.tags)]));
      dates=new Map(data.entries.filter(entry=>typeof entry.html==='string'&&/^\d{4}(?:-\d{2})?(?:-\d{2})?$/.test(entry.date||'')).map(entry=>[key(entry.html),entry.date]));
      return true;
    }catch{return false;}
  })();
}
export function publicationDate(html){
  const known=dates.get(key(html));if(known)return known;
  const doc=new DOMParser().parseFromString(html,'text/html');
  doc.querySelectorAll('strong,b').forEach(element=>{if(/award|우수|최우수|수상/i.test(element.textContent))element.remove();});
  const content=doc.body.textContent.replace(/https?:\/\/\S+/g,'').replace(/^\s*\[[^\]]*(?:award|우수|최우수|수상)[^\]]*\]/i,'');
  const years=content.match(/\b(?:19|20)\d{2}\b/g)||[];return years.length?String(Math.max(...years.map(Number))):'';
}
export function sortPublicationGroups(groups){
  return groups.map(group=>({...group,items:group.items.map((html,index)=>({html,index,date:publicationDate(html).split('-').map(Number)}))
    .sort((a,b)=>(b.date[0]||0)-(a.date[0]||0)||(b.date[1]||0)-(a.date[1]||0)||(b.date[2]||0)-(a.date[2]||0)||a.index-b.index).map(entry=>entry.html)}));
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
  const box=document.createElement('div');box.className='paper-tags';box.setAttribute('aria-label',t('area'));
  for(const tag of normalizeTags(tags)){
    const badge=document.createElement(links?'a':'span');badge.className='paper-tag tag-'+tag.toLowerCase();badge.textContent=tag;badge.title=getLanguage()==='ko'?researchAreas[tag]:{SE:'Software Engineering',AI:'Artificial Intelligence',AERO:'Aerospace Engineering'}[tag];
    if(links)badge.href='search.html?tag='+tag;
    box.append(badge);
  }
  if(!box.children.length){const badge=document.createElement('span');badge.className='paper-tag tag-unclassified';badge.textContent=t('unclassified');box.append(badge);}
  return box;
}
