import {t} from './i18n.js';
const validEmail=value=>typeof value==='string'&&/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(value);
const addressPattern=/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/ig;
const encode=email=>btoa(email);
function decode(token){try{const email=atob(token);return validEmail(email)?email:null;}catch{return null;}}
function revealButton(){const button=document.createElement('button');button.type='button';button.className='email-reveal';button.dataset.i18n='revealEmail';button.textContent=t('revealEmail');button.setAttribute('aria-expanded','false');return button;}
function contact(email){const wrapper=document.createElement('span');wrapper.className='email-contact';wrapper.dataset.emailToken=encode(email);wrapper.append(revealButton());return wrapper;}
// Tokens deter simple address scrapers. They are reversible, not encryption or access control.
export function protectEmails(root){
 if(!root)return;
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
let installed=false;
export function setupEmailPrivacy(){if(installed)return;installed=true;document.addEventListener('click',event=>{
 const button=event.target.closest('button.email-reveal,button.email-hide');if(!button)return;
 const wrapper=button.closest('.email-contact');if(!wrapper)return;
 const email=decode(wrapper.dataset.emailToken);if(!email)return;
 if(button.classList.contains('email-hide')){wrapper.removeAttribute('data-email-revealed');const reveal=revealButton();wrapper.replaceChildren(reveal);reveal.focus();return;}
 const link=document.createElement('a');link.className='email-address';link.href='mailto:'+encodeURIComponent(email).replace('%40','@');link.textContent=email;
 const hide=document.createElement('button');hide.type='button';hide.className='email-hide';hide.dataset.i18n='hideEmail';hide.textContent=t('hideEmail');hide.setAttribute('aria-label',t('hideEmail'));wrapper.dataset.emailRevealed='true';wrapper.replaceChildren(link,hide);link.focus();
 });}
