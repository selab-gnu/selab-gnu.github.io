import { clean } from './content.js';

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
  return clean(profile.html) + (biography ? '<p>' + biography + '</p>' : '');
}

// Keep category order and current faculty ahead of student profiles.
export function compareMembers(a, b) {
  const groups = Object.keys(memberGroups);
  const category = groups.indexOf(a.group) - groups.indexOf(b.group);
  if (category) return category;
  const faculty = profile => {
    if (profile.group !== 'current') return false;
    const doc = new DOMParser().parseFromString(clean(profile.html), 'text/html');
    doc.body.querySelectorAll('strong,b,a').forEach(element => element.remove());
    return /\b(?:(?:assistant|associate|emeritus|full)\s+)?professor\b|교수/i.test(doc.body.textContent);
  };
  return Number(faculty(b)) - Number(faculty(a)) || a.order - b.order || a.id.localeCompare(b.id);
}

export function renderProfiles(profiles) {
  return Object.entries(memberGroups).map(([group, label]) => {
    const members = profiles.filter(p => p.group === group).sort(compareMembers);
    return members.length ? '<h2>' + label + '</h2>' + members.map(p => {const card=document.createElement('section');card.id='member-'+p.id;card.className='member-profile';card.innerHTML=profileHTML(p)+'<hr>';return card.outerHTML;}).join('') : '';
  }).join('');
}

// Split the legacy document at member-name headings, preserving original links
// and text rather than guessing structured fields from inconsistent old markup.
export function splitLegacyMembers(html) {
  const doc = new DOMParser().parseFromString(clean(html), 'text/html');
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
