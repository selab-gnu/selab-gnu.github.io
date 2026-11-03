const validEmail=value=>typeof value==='string'&&/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(value);
const addressPattern=/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/ig;
const encode=email=>btoa(email);
function decode(token){try{const email=atob(token);return validEmail(email)?email:null;}catch{return null;}}
const contactSelector='span[data-email-token],span[data-email-user][data-email-domain]';
function readContact(wrapper){
 try{const email=wrapper.dataset.emailToken?decode(wrapper.dataset.emailToken):atob(wrapper.dataset.emailUser)+'@'+atob(wrapper.dataset.emailDomain);return validEmail(email)?email:null;}catch{return null;}
}
function contact(email,display=false){const wrapper=document.createElement('span');wrapper.className='email-contact';const [user,domain]=email.split('@');wrapper.dataset.emailUser=encode(user);wrapper.dataset.emailDomain=encode(domain);wrapper.textContent=display?user+'@'+domain:'Email';return wrapper;}
// Tokens deter simple address scrapers. They are reversible, not encryption or access control.
export function protectEmails(root,display=true){
 if(!root)return;
 for(const wrapper of root.querySelectorAll(contactSelector)){const email=readContact(wrapper);if(email)wrapper.replaceWith(contact(email,display));else wrapper.remove();}
 for(const link of [...root.querySelectorAll('a[href^="mailto:"]')]){
  if(link.closest('[data-email-revealed]'))continue;
  let email;try{email=decodeURIComponent(link.getAttribute('href').slice(7).split('?')[0]);}catch{continue;}
  if(validEmail(email))link.replaceWith(contact(email,display));
 }
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];let node;
 while(node=walker.nextNode())if(!node.parentElement.closest('.email-contact,script,style,textarea,input')&&node.textContent.match(addressPattern))nodes.push(node);
 for(const text of nodes){const fragment=document.createDocumentFragment();let offset=0;for(const match of text.textContent.matchAll(addressPattern)){fragment.append(document.createTextNode(text.textContent.slice(offset,match.index)),contact(match[0],display));offset=match.index+match[0].length;}fragment.append(document.createTextNode(text.textContent.slice(offset)));text.replaceWith(fragment);}
}
export function protectEmailMarkup(html){const doc=new DOMParser().parseFromString(html,'text/html');protectEmails(doc.body,false);return doc.body.innerHTML;}
// Static pages store separate encoded user/domain parts; editors and legacy splitting recover the original contact field.
export function restoreEmailMarkup(html){const doc=new DOMParser().parseFromString(html,'text/html');for(const wrapper of doc.querySelectorAll(contactSelector)){const email=readContact(wrapper);if(!email){wrapper.remove();continue;}const link=doc.createElement('a');link.setAttribute('href','mailto:'+email);link.textContent=email;wrapper.replaceWith(link);}return doc.body.innerHTML;}
// Retained for existing callers; contacts are visible without interaction.
export function setupEmailPrivacy(){}
