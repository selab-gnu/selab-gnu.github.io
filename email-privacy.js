const validEmail=value=>typeof value==='string'&&/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(value);
const addressPattern=/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/ig;
const encode=email=>btoa(email);
function decode(token){try{const email=atob(token);return validEmail(email)?email:null;}catch{return null;}}
function contact(email){const wrapper=document.createElement('span');wrapper.className='email-contact';wrapper.dataset.emailToken=encode(email);wrapper.textContent=email.replace('@',' [at] ');return wrapper;}
// Tokens deter simple address scrapers. They are reversible, not encryption or access control.
export function protectEmails(root){
 if(!root)return;
 for(const wrapper of root.querySelectorAll('[data-email-token]')){const email=decode(wrapper.dataset.emailToken);if(email)wrapper.replaceWith(contact(email));}
 for(const link of [...root.querySelectorAll('a[href^="mailto:"]')]){
  if(link.closest('[data-email-revealed]'))continue;
  let email;try{email=decodeURIComponent(link.getAttribute('href').slice(7).split('?')[0]);}catch{continue;}
  if(validEmail(email))link.replaceWith(contact(email));
 }
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];let node;
 while(node=walker.nextNode())if(!node.parentElement.closest('.email-contact,script,style,textarea,input')&&node.textContent.match(addressPattern))nodes.push(node);
 for(const text of nodes){const fragment=document.createDocumentFragment();let offset=0;for(const match of text.textContent.matchAll(addressPattern)){fragment.append(document.createTextNode(text.textContent.slice(offset,match.index)),contact(match[0]));offset=match.index+match[0].length;}fragment.append(document.createTextNode(text.textContent.slice(offset)));text.replaceWith(fragment);}
}
export function protectEmailMarkup(html){const doc=new DOMParser().parseFromString(html,'text/html');protectEmails(doc.body);return doc.body.innerHTML;}
// Static pages store only tokens; editors and legacy splitting recover the original contact field.
export function restoreEmailMarkup(html){const doc=new DOMParser().parseFromString(html,'text/html');for(const wrapper of doc.querySelectorAll('span[data-email-token]')){const email=decode(wrapper.dataset.emailToken);if(!email){wrapper.remove();continue;}const link=doc.createElement('a');link.setAttribute('href','mailto:'+email);link.textContent=email;wrapper.replaceWith(link);}return doc.body.innerHTML;}
// Retained for existing callers; contacts are visible without interaction.
export function setupEmailPrivacy(){}
