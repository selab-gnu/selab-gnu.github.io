import {setupLanguage,applyLanguage,t,localized,getLanguage,languageURL} from './i18n.js';
import {renderProfiles,splitLegacyMembers} from './member-profiles.js';
import {loadMemberEmails,supplementMemberEmails} from './member-emails.js';
import {setupEmailPrivacy,protectEmails} from './email-privacy.js';
setupLanguage();
setupEmailPrivacy();
function professorSection(){
 if(!document.querySelector('.page-home')||document.getElementById('professor-introduction'))return;
 const section=document.createElement('section');section.id='professor-introduction';section.className='professor-introduction';
 section.innerHTML='<img class="professor-photo" src="/assets/people/seonah-lee.png" width="1230" height="1278" alt="Seonah Lee" loading="lazy"><div class="professor-intro-copy"><p class="eyebrow" data-i18n="professorTitle"></p><h2 data-i18n="professorName"></h2><p class="professor-role" data-i18n="professorRole"></p><p data-i18n="professorDept"></p><p data-i18n="professorIntro"></p><ul class="research-chips"><li data-i18n="se"></li><li data-i18n="ai"></li><li data-i18n="aero"></li></ul><details class="professor-history"><summary data-i18n="professorHistory"></summary><ul><li data-i18n="historyCurrent"></li><li data-i18n="historyBk"></li><li data-i18n="historyGnu"></li><li data-i18n="historyKaist"></li><li data-i18n="historyUbc"></li><li data-i18n="historyCmu"></li><li data-i18n="historySamsung"></li></ul></details><div class="professor-links"><a href="https://saleese.github.io/" data-i18n="professorLink"></a><a href="https://www.gnu.ac.kr/soft/pi/prfsr/selectPrfsrIntrdView.do?mi=14189" data-i18n="professorSource"></a><a href="mailto:saleese@gnu.ac.kr">saleese@gnu.ac.kr</a></div></div>';
 const banner=document.querySelector('#cloud-home .home-brand-banner');
 if(banner)banner.after(section);else document.getElementById('cloud-home').after(section);
}
const memberRoot=document.querySelector('.page-members .imported-content');
if(memberRoot){
 const initial=memberRoot.innerHTML;const records=supplementMemberEmails(splitLegacyMembers(initial),await loadMemberEmails());
 if(memberRoot.innerHTML===initial)memberRoot.innerHTML=renderProfiles(records);
}
professorSection();
function ui(){
 professorSection();
 protectEmails(document.querySelector('main'));
 const paths={'index.html':'home','research.html':'research','members.html':'members','publications.html':'publications','news.html':'news','gallery.html':'gallery'};
 document.querySelectorAll('nav a').forEach(link=>{const key=paths[link.getAttribute('href')];if(key)localized(link,key);});
 const title=document.querySelector('main>h1');const path=location.pathname.split('/').pop()||'index.html';if(title&&paths[path])localized(title,paths[path]);
 const login=document.querySelector('.manage-link');if(login)localized(login,'login');
 const search=document.getElementById('header-search');if(search){search.dataset.i18nPlaceholder='searchPlaceholder';search.placeholder=t('searchPlaceholder');const button=search.form?.querySelector('button');if(button)localized(button,'search');const label=search.form?.querySelector('label');if(label)localized(label,'searchPlaceholder');}
 const skip=document.querySelector('.skip');if(skip)localized(skip,'skip');const top=document.querySelector('footer a[href="#top"]');if(top)localized(top,'top');
 const breadcrumb=document.querySelector('.breadcrumb');if(breadcrumb){breadcrumb.replaceChildren(document.createTextNode(document.documentElement.lang==='ko'?'현재 위치: ':'You are here: '));const home=localized(document.createElement('a'),'home');home.href='index.html';breadcrumb.append(home);if(path!=='index.html'&&paths[path]){breadcrumb.append(document.createTextNode(' / '),localized(document.createElement('span'),paths[path]));}}
 const note=document.getElementById('language-note');if(note)localized(note,'languageNote');
 document.querySelectorAll('a[href]').forEach(link=>{const href=link.getAttribute('href');if(href.startsWith('#')||!/(?:\.html|admin\/?)(?:[?#]|$)/.test(href))return;const url=new URL(href,location.href);if(url.origin===location.origin)link.setAttribute('href',languageURL(href));});
 for(const form of document.querySelectorAll('form[role="search"]')){let input=form.querySelector('input[name="lang"]');if(!input){input=document.createElement('input');input.type='hidden';input.name='lang';form.append(input);}input.value=getLanguage();}
 const brand=document.querySelector('.brand-university');if(brand)brand.textContent=getLanguage()==='ko'?'경상국립대학교':'GYEONGSANG NATIONAL UNIVERSITY';
 document.title=(paths[path]?t(paths[path]):getLanguage()==='ko'?'논문 검색':'Publication search')+' — SEA Lab';
 applyLanguage();
}
document.addEventListener('language-changed',ui);document.addEventListener('content-updated',ui);ui();
