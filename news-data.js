const normalized=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
export function mergeNews(saved,curated){
 const same=(a,b)=>a.id===b.id||(a.source&&[b.source,...(b.sourceAliases||[]),...(b.sources||[]).map(s=>s.url)].includes(a.source))||[...Object.values(typeof b.title==='object'?b.title:{title:b.title}),...(b.titleAliases||[])].some(title=>normalized(title)===normalized(a.title));
 // Administrator-written posts take precedence over matching repository entries.
 return [...saved,...curated.filter(entry=>!saved.some(post=>same(post,entry)))].sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
}
