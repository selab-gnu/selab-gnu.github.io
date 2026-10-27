const categoryNames=['International Journals','International Conference','Domestic Journals','Domestic Conferences'];
let loading;
const text=html=>new DOMParser().parseFromString(html,'text/html').body.textContent;
const normalize=value=>value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const yearOf=html=>Math.max(0,...(text(html).match(/\b(?:19|20)\d{2}\b/g)||[]).map(Number));

export function loadPublicationImports(){
  return loading??=(async()=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
    try{
      const response=await fetch(new URL('./data/publication-imports.json',import.meta.url),{signal:controller.signal});
      if(!response.ok)throw Error('논문 추가 목록을 불러오지 못했습니다. 다시 시도해주세요.');
      const data=await response.json();
      if(data.version!==1||!Array.isArray(data.batches)||!data.batches.every(batch=>
        typeof batch.id==='string'&&/^[a-z0-9-]{1,80}$/.test(batch.id)&&Array.isArray(batch.entries)&&batch.entries.every(entry=>
          categoryNames.includes(entry.category)&&typeof entry.html==='string'&&typeof entry.title==='string'&&entry.title.length>0&&Number.isInteger(entry.year))))
        throw Error('논문 추가 목록의 형식을 확인해주세요.');
      return data;
    }finally{clearTimeout(timer);}
  })().catch(error=>{loading=undefined;throw error;});
}

// Each group acknowledges a batch in its existing document. Subsequent edits or
// deletions win over the repository; importing is never repeated after save.
export function mergePublicationImports(groups,manifest){
  const merged=groups.map(group=>({...group,items:[...group.items],...(group.publicationImports?{publicationImports:[...group.publicationImports]}:{})}));
  let added=0,acknowledged=0;
  for(const batch of manifest.batches){
    for(const group of merged){
      const entries=batch.entries.filter(entry=>entry.category===group.category);
      if(!entries.length||group.publicationImports?.includes(batch.id))continue;
      for(const entry of [...entries].sort((a,b)=>b.year-a.year)){
        const title=normalize(entry.title);
        const present=group.items.some(html=>normalize(text(html)).includes(title)&&yearOf(html)===entry.year);
        if(present)continue;
        const index=group.items.findIndex(html=>yearOf(html)<entry.year);
        group.items.splice(index===-1?group.items.length:index,0,entry.html);added++;
      }
      group.publicationImports=[...(group.publicationImports||[]),batch.id];acknowledged++;
    }
  }
  return {groups:merged,added,pending:acknowledged>0};
}
