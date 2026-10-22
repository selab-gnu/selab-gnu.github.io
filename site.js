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
