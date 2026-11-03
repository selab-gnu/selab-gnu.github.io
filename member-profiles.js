import { clean } from './content.js';
import {localized} from './i18n.js';
import {supplementMemberUpdates} from './member-updates.js';
import {protectEmailMarkup,restoreEmailMarkup} from './email-privacy.js';
import {bilingualText,memberName,bilingualProfileDetails,visibleMembers,canonicalMemberName} from './member-localization.js';

export const memberGroups = {
  current: 'Current Members',
  graduates: 'Alumni · Graduate Students',
  undergraduates: 'Alumni · Undergraduate Students'
};

export function profileHTML(profile) {
  const bio = document.createElement('p');
  bio.textContent = profile.bio || '';
  // Paragraphs and explicit breaks survive the existing content sanitizer.
  const biography = bio.innerHTML.replace(/\r?\n/g, '<br>');
  return clean(restoreEmailMarkup(profile.html)) + (biography ? '<p>' + biography + '</p>' : '');
}

export function isFaculty(profile) {
  if (profile.group !== 'current') return false;
  const doc = new DOMParser().parseFromString(clean(profile.html), 'text/html');
  // Ignore the name, but preserve bold role labels used in older profiles.
  doc.body.querySelector('strong,b')?.remove();
  doc.body.querySelectorAll('br').forEach(el => el.replaceWith('\n'));
  return doc.body.textContent.split(/\n/).some(line => /^(?:(?:assistant|associate|emeritus|full|visiting)\s+)*professor\b|^(?:정|부|조|명예|초빙)?교수(?:\s|$)/i.test(line.trim()));
}

// Keep category order and current faculty ahead of student profiles.
export function compareMembers(a, b) {
  const groups = Object.keys(memberGroups);
  const category = groups.indexOf(a.group) - groups.indexOf(b.group);
  if (category) return category;
  return Number(isFaculty(b)) - Number(isFaculty(a)) || (a.group==='current' ? memberRank(a)-memberRank(b) : 0) || a.order - b.order || a.id.localeCompare(b.id);
}

export function memberCategory(profile){
 const doc=new DOMParser().parseFromString(clean(profile.html),'text/html');doc.querySelectorAll('br').forEach(el=>el.replaceWith('\n'));
 const text=doc.body.textContent;
 const level=/ph\.?\s*d|박사/i.test(text)?'phd':/\bMS\b|M\.S\.|석사/i.test(text)?'ms':/undergraduate|학부/i.test(text)?'undergrad':'other';
 return {level};
}
function memberRank(profile){return ['phd','ms','undergrad','other'].indexOf(memberCategory(profile).level);}
function memberCard(profile){
 const compact=profile.group!=='current';
 const card=document.createElement('section');card.id='member-'+profile.id;card.dataset.memberName=profile.name;card.className='member-profile'+(isFaculty(profile)?' member-faculty':'')+(compact?' member-alumnus':'');
 const content=document.createElement('div');content.className='member-copy';content.innerHTML=profileHTML(profile);content.querySelectorAll('hr').forEach(el=>el.remove());
 const walker=document.createTreeWalker(content,NodeFilter.SHOW_TEXT);let textNode;while(textNode=walker.nextNode())textNode.textContent=textNode.textContent.replace(/(?:part|full)[ -]?time\s*/ig,'').replace(/Enrollment:\s*/g,'');
 const img=content.querySelector('img');
 const portrait=document.createElement('div');portrait.className='member-portrait';
 if(img){portrait.append(img);img.alt=canonicalMemberName(profile.name,'en');}
 else{const initials=document.createElement('span');initials.className='member-initials';initials.textContent=profile.name.split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase();portrait.append(initials,localized(document.createElement('small'),'photoPending'));}
 const raw=content.cloneNode(true);raw.querySelectorAll('br').forEach(el=>el.replaceWith('\n'));raw.querySelectorAll('p,div').forEach(el=>el.append('\n'));const text=raw.textContent.replace(/\u00a0/g,' ');
 const name=memberName(profile.name);const role=localized(document.createElement('p'),isFaculty(profile)?'faculty':memberCategory(profile).level);role.className='member-role';
 const heading=document.createElement('div');heading.className='member-card-heading';heading.append(name,role);const copy=document.createElement('div');copy.className='member-copy';copy.append(heading);
 if(compact){
  role.remove();
  const summary=content.cloneNode(true);summary.querySelectorAll('img').forEach(el=>el.remove());
  summary.querySelector('strong,b')?.remove();
  summary.querySelectorAll('br').forEach(el=>el.replaceWith(' '));summary.querySelectorAll('p,div').forEach(el=>el.append(' '));
  const description=summary.textContent.replace(/\s+/g,' ').replace(/^[\s,]+/,'').trim();
  if(description)copy.append(bilingualText('p',description,'alumni-summary'));
  if(profile.bio)copy.append(bilingualText('p',profile.bio,'member-biography'));
  card.append(copy);return protectEmailMarkup(card.outerHTML);
 }
 if(isFaculty(profile)&&/seonah\s+lee|이선아/i.test(profile.name)){copy.append(localized(document.createElement('p'),'professorDept'),localized(document.createElement('p'),'professorIntro'));const website=document.createElement('a');website.href='https://saleese.github.io/';localized(website,'professorLink');copy.append(website);}
 const mail=content.querySelector('a[href^="mailto:"]');if(mail){const contact=document.createElement('p');contact.className='member-email';contact.append(mail.cloneNode(true));copy.append(contact);}
 const topic=text.match(/Research Topic\s*:\s*([^\n]+)/i)?.[1]?.trim();if(topic){const topicBox=document.createElement('p');topicBox.className='member-topic';const label=localized(document.createElement('strong'),'topic');topicBox.append(label,document.createElement('br'),bilingualText('span',topic));copy.append(topicBox);}
 if(profile.bio)copy.append(bilingualText('p',profile.bio,'member-biography'));
 const details=document.createElement('div');details.className='member-details';content.querySelectorAll('a[href^="mailto:"]').forEach(el=>el.replaceWith(el.textContent));details.append(bilingualProfileDetails(content,profile.name));copy.append(details);
 card.append(portrait,copy);return protectEmailMarkup(card.outerHTML);
}
export function renderProfiles(profiles) {
 profiles=supplementMemberUpdates(visibleMembers(profiles));
 const sections=[];
 const section=(key,items,sub=false)=>{if(!items.length)return;const heading=localized(document.createElement(sub?'h3':'h2'),key);heading.className='member-group-heading';const grid=document.createElement('div');grid.className=key.startsWith('alumni')?'alumni-list':'member-grid';grid.innerHTML=items.sort(compareMembers).map(memberCard).join('');sections.push(heading.outerHTML+grid.outerHTML);};
 section('faculty',profiles.filter(isFaculty));
 const rows=profiles.filter(p=>p.group==='current'&&!isFaculty(p));
 for(const level of ['phd','ms','undergrad','other'])section(level,rows.filter(p=>memberCategory(p).level===level));
 section('alumniGraduate',profiles.filter(p=>p.group==='graduates'));section('alumniUndergrad',profiles.filter(p=>p.group==='undergraduates'));
 return sections.join('');
}

// Split the legacy document at member-name headings, preserving original links
// and text rather than guessing structured fields from inconsistent old markup.
export function splitLegacyMembers(html) {
  const doc = new DOMParser().parseFromString(restoreEmailMarkup(clean(html)), 'text/html');
  const markers = [...doc.body.querySelectorAll('strong,b')].filter(e =>
    !e.parentElement.closest('strong,b') && e.textContent.trim());
  const records = [];
  let group = 'current';
  for (let i=0; i<markers.length; i++) {
    const marker = markers[i];
    let name = marker.textContent.replace(/\s+/g,' ').trim();
    if (name === 'Alumni') { group = 'graduates'; continue; }
    if (/^Graduate Students\s*-*$/.test(name)) { group = 'graduates'; continue; }
    if (/^Undergraduate Students\s*-*$/.test(name)) { group = 'undergraduates'; continue; }
    // One original name (Uicheon Lee) spans adjacent strong elements.
    while (markers[i+1] && marker.parentElement === markers[i+1].parentElement &&
      markers[i].nextSibling === markers[i+1]) {
      name += ' ' + markers[++i].textContent.trim();
    }
    const range = doc.createRange();
    range.setStartBefore(marker);
    if (markers[i+1]) range.setEndBefore(markers[i+1]);
    else range.setEnd(doc.body, doc.body.childNodes.length);
    const box = doc.createElement('div');
    box.append(range.cloneContents());
    box.querySelectorAll('hr').forEach(e=>e.remove());
    records.push({id: crypto.randomUUID(), name: name.replace(/[,\s]+$/,''), html: clean(box.innerHTML), bio:'', group, order:records.length, revision:0});
  }
  if (!records.length) throw Error('기존 멤버를 구분하지 못했습니다. 기존 내용을 확인해주세요.');
  return records;
}
