// Only HTTPS images and small raster thumbnails are accepted; SVG and script URLs are rejected.
export function validPhotoSource(value) {
 if(typeof value !== 'string' || value.length > 18000)return false;
 if(/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value))return true;
 try {const url=new URL(value);return url.protocol==='https:' && !!url.hostname && !url.username && !url.password;}catch{return false;}
}
// Only inert formatting is accepted in editable public content.
export function clean(html) {
 const doc = new DOMParser().parseFromString(html, 'text/html');
 const allowed = new Set('p div span h2 h3 h4 h5 h6 strong em b i u s br hr ul ol li a table thead tbody tfoot tr th td blockquote sub sup img'.split(' '));
 for (const e of [...doc.body.querySelectorAll('*')]) {
  if (!allowed.has(e.localName)) { e.remove(); continue; }
  for (const a of [...e.attributes]) {
   const link = e.localName === 'a' && a.name === 'href' && /^(https?:\/\/|mailto:)/i.test(a.value.trim());
   const photo = e.localName === 'img' && (
    (a.name === 'src' && validPhotoSource(a.value)) ||
    (a.name === 'alt' && a.value.length <= 320) ||
    (a.name === 'loading' && a.value === 'lazy') ||
    (['width','height'].includes(a.name) && /^[1-9][0-9]{0,2}$/.test(a.value))
   );
   const span = ['td','th'].includes(e.localName) && ['colspan','rowspan'].includes(a.name) && /^[1-9][0-9]?$/.test(a.value);
   if (!link && !span && !photo) e.removeAttribute(a.name);
  }
 }
 doc.body.querySelectorAll('img:not([src])').forEach(e=>e.remove());
 return doc.body.innerHTML;
}
export function validContent(d) {
 return d && d.version === 1 && typeof d.home === 'string' && typeof d.members === 'string' &&
 (d.memberDirectoryVersion === undefined || d.memberDirectoryVersion === 1) &&
 Array.isArray(d.groups) && d.groups.length === 4 && d.groups.every(g => typeof g.category === 'string' && Array.isArray(g.items) && g.items.every(i => typeof i === 'string'));
}
