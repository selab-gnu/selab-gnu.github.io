// News and gallery entries are stored individually so photos never inflate the homepage document.
export const collectionKinds = {news:'newsItems', gallery:'galleryItems'};
export function validGalleryImage(source) {
  if(typeof source!=='string'||source.length>240000)return false;
  if(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(source))return true;
  try {const url=new URL(source);return source.length<=2048&&url.protocol==='https:'&&!!url.hostname&&!url.username&&!url.password;}catch{return false;}
}
export function validEntry(kind, entry) {
  return Object.hasOwn(collectionKinds,kind)&&entry&&typeof entry.title==='string'&&entry.title.trim().length>0&&entry.title.length<=200
    &&typeof entry.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(entry.date)&&Number.isFinite(Date.parse(entry.date))
    &&Number.isInteger(entry.revision)&&entry.revision>=0
    &&(kind==='gallery'?validGalleryImage(entry.image)&&typeof entry.caption==='string'&&entry.caption.length<=2000:
      typeof entry.body==='string'&&entry.body.trim().length>0&&entry.body.length<=10000);
}
export function sortEntries(a,b){return b.date.localeCompare(a.date)||a.id.localeCompare(b.id);}
export async function readEntries(kind) {
  if(!Object.hasOwn(collectionKinds,kind))throw Error('잘못된 게시판입니다.');
  const [{contentRef},{collection,getDocs}]=await Promise.all([import('./firebase-client.js'),import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js')]);
  return (await getDocs(collection(contentRef.firestore,collectionKinds[kind]))).docs
    .map(doc=>({...doc.data(),id:doc.id})).filter(entry=>validEntry(kind,entry)).sort(sortEntries);
}
