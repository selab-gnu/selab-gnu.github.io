// Only inert formatting is accepted in editable public content.
export function clean(html) {
 const doc = new DOMParser().parseFromString(html, 'text/html');
 const allowed = new Set('p div span h2 h3 h4 h5 h6 strong em b i u s br hr ul ol li a table thead tbody tfoot tr th td blockquote sub sup'.split(' '));
 for (const e of [...doc.body.querySelectorAll('*')]) {
  if (!allowed.has(e.localName)) { e.remove(); continue; }
  for (const a of [...e.attributes]) {
   const link = e.localName === 'a' && a.name === 'href' && /^(https?:\/\/|mailto:)/i.test(a.value.trim());
   const span = ['td','th'].includes(e.localName) && ['colspan','rowspan'].includes(a.name) && /^[1-9][0-9]?$/.test(a.value);
   if (!link && !span) e.removeAttribute(a.name);
  }
 }
 return doc.body.innerHTML;
}
export function validContent(d) {
 return d && d.version === 1 && typeof d.home === 'string' && typeof d.members === 'string' &&
 Array.isArray(d.groups) && d.groups.length === 4 && d.groups.every(g => typeof g.category === 'string' && Array.isArray(g.items) && g.items.every(i => typeof i === 'string'));
}
