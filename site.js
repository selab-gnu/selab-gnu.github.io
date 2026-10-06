const filter=document.querySelector('#filter');
if(filter){
 const entries=[...document.querySelectorAll('.publications li')];
 const groups=[...document.querySelectorAll('.publication-group')];
 function update(){const q=filter.value.trim().toLocaleLowerCase();let count=0;for(const item of entries){item.hidden=!item.textContent.toLocaleLowerCase().includes(q);if(!item.hidden)count++;}for(const group of groups)group.hidden=![...group.querySelectorAll('li')].some(x=>!x.hidden);document.querySelector('#result').textContent=`${count} of ${entries.length} publications`;document.querySelector('#empty').hidden=count!==0;}
 filter.value=new URLSearchParams(location.search).get('q')||'';filter.addEventListener('input',update);update();
}
