import {clean} from './content.js';

let loading;
const normalize=name=>name.normalize('NFKC').toLowerCase().replace(/[\s,.-]/g,'');
const emailPattern=/[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+/;
export function hasMemberEmail(html){
  const doc=new DOMParser().parseFromString(clean(html),'text/html');
  return emailPattern.test(doc.body.textContent)||[...doc.querySelectorAll('a[href^="mailto:"]')].some(a=>emailPattern.test(a.getAttribute('href').slice(7)));
}
export function addMissingEmail(html,email){
  if(hasMemberEmail(html))return html;
  const doc=new DOMParser().parseFromString(clean(html),'text/html'),anchor=doc.createElement('a');
  anchor.setAttribute('href','mailto:'+email);anchor.textContent=email;
  const walker=doc.createTreeWalker(doc.body,NodeFilter.SHOW_TEXT);let node;
  while((node=walker.nextNode())){
    if(/^\s*Email:\s*$/i.test(node.textContent)){node.textContent='Email: ';node.after(anchor);return doc.body.innerHTML;}
  }
  const line=doc.createElement('p');line.append('Email: ',anchor);doc.body.append(line);return doc.body.innerHTML;
}
export function loadMemberEmails(){
  return loading??=(async()=>{
    try{
      const response=await fetch(new URL('./data/member-emails.json',import.meta.url));
      if(!response.ok)throw Error('Member email defaults unavailable');
      const data=await response.json();
      return data.version===1&&Array.isArray(data.entries)?data.entries.filter(entry=>Array.isArray(entry.names)&&entry.names.every(name=>typeof name==='string')&&typeof entry.email==='string'&&/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(entry.email)):[];
    }catch{loading=undefined;return [];}
  })();
}
export function supplementMemberEmails(profiles,entries){
  const updates=new Map();
  for(const entry of entries){
    const named=profiles.filter(profile=>typeof profile.name==='string'&&entry.names.some(name=>normalize(name)===normalize(profile.name)));
    const identified=named.find(profile=>profile.id===entry.memberId);
    const target=identified||(named.length===1&&named[0].group===entry.group?named[0]:null);
    if(target&&!hasMemberEmail(target.html))updates.set(target.id,entry.email);
  }
  return profiles.map(profile=>updates.has(profile.id)?{...profile,html:addMissingEmail(profile.html,updates.get(profile.id))}:profile);
}
