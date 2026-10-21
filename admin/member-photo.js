import { clean, validPhotoSource } from '../content.js';

export function memberPhoto(html) {
  return new DOMParser().parseFromString(clean(html),'text/html').querySelector('img')?.getAttribute('src') || '';
}
export function withMemberPhoto(html, source, name) {
  const doc=new DOMParser().parseFromString(clean(html),'text/html');
  doc.querySelectorAll('img').forEach(img=>img.remove());
  if(source){
    if(!validPhotoSource(source))throw Error('사진 주소는 HTTPS 이미지 주소를 입력해주세요.');
    const img=doc.createElement('img');img.src=source;img.alt=name+' 프로필 사진';img.loading='lazy';img.width=160;img.height=200;
    doc.body.prepend(img);
  }
  const result=doc.body.innerHTML;
  if(result.length>30000)throw Error('사진과 소개가 저장 용량을 초과했습니다. 사진을 줄이거나 소개를 짧게 해주세요.');
  return result;
}
async function thumbnail(file){
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('JPG, PNG, WebP 사진을 선택해주세요.');
  if(file.size>10*1024*1024)throw Error('10MB 이하의 사진을 선택해주세요.');
  const bitmap=await createImageBitmap(file);
  try{
    const scale=Math.min(1,240/bitmap.width,300/bitmap.height);
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);
    for(const quality of [.85,.7,.55,.4,.25]){const source=canvas.toDataURL('image/jpeg',quality);if(source.length<=18000)return source;}
    throw Error('사진을 충분히 줄이지 못했습니다. 더 작은 사진을 선택해주세요.');
  }finally{bitmap.close();}
}
export function setupPhoto(prefix, changed){
  const get=suffix=>document.getElementById(prefix+suffix);
  let generation=0,processing=false;
  function set(source=''){
    generation++;processing=false;get('-file').value='';get('-url').value=source.startsWith('https:')?source:'';get('').value=source;get('-status').textContent='';
    get('-preview').replaceChildren();
    if(source){const img=document.createElement('img');img.src=source;img.alt='선택한 프로필 사진 미리보기';get('-preview').append(img);}
  }
  get('-file').onchange=async()=>{
    const file=get('-file').files[0];if(!file)return;
    const token=++generation;processing=true;get('-status').textContent='사진을 준비하는 중입니다…';
    try{const source=await thumbnail(file);if(token!==generation)return;set(source);changed();}
    catch(error){if(token===generation){get('-status').textContent=error.message;get('-file').value='';}}
    finally{if(token===generation)processing=false;}
  };
  get('-url').onchange=()=>{const value=get('-url').value.trim();if(value&&!validPhotoSource(value)){get('-status').textContent='HTTPS로 시작하는 직접 이미지 주소를 입력해주세요.';return;}set(value);changed();};
  get('-remove').onclick=()=>{set();changed();};
  return {set,read:()=>get('-url').value.trim()||get('').value,assertReady(){if(processing)throw Error('사진 준비가 끝난 뒤 저장해주세요.');const url=get('-url').value.trim();if(url&&!validPhotoSource(url))throw Error('사진 주소를 확인해주세요.');}};
}
