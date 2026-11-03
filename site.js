import {loadPaperTags,paperTags,tagBadges} from './publication-tags.js';
import './site-enhancements.js';
import {setupPublicationFilters} from './publication-filters.js';
// Search results link directly to a publication; every paper stays visible.
function highlightPublication(){
 document.querySelectorAll('.publication-target').forEach(el=>el.classList.remove('publication-target'));
 let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
 const target=document.getElementById(id);
 if(target?.matches('.publications li'))target.classList.add('publication-target');
}
window.addEventListener('hashchange',highlightPublication);
document.addEventListener('content-updated',highlightPublication);
highlightPublication();

function renderPaperTags(){
 for(const item of document.querySelectorAll('.publications li')){
  item.querySelectorAll('.paper-tags').forEach(badges=>badges.remove());
  const citation=item.querySelector('.paper-citation');
  if(citation)item.append(tagBadges(paperTags(citation.innerHTML),true));
 }
}
if(document.querySelector('.publications')){
 document.addEventListener('content-updated',renderPaperTags);
 document.addEventListener('language-changed',renderPaperTags);
 await loadPaperTags();renderPaperTags();setupPublicationFilters();
}
