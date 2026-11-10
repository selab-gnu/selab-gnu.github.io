import {contentRef,runTransaction,serverTimestamp} from '../firebase-client.js';
import {doc} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import {validGalleryImage} from '../collections.js';
import {canEdit} from './auth.js';
export async function saveAlbum(entry,photos,previous=[],remove=false){
 if(!canEdit('gallery'))throw Error('관리자만 앨범을 변경할 수 있습니다.');
 if(!remove&&(!entry.title.trim()||entry.title.length>200||!/^\d{4}-\d{2}-\d{2}$/.test(entry.date)||!Number.isFinite(Date.parse(entry.date))||entry.caption.length>2000||!photos.length||photos.length>12||photos.some(p=>!validGalleryImage(p.image))))throw Error('제목·날짜·설명과 사진 1~12장을 확인해주세요.');
 const prefix='album_'+crypto.randomUUID()+'_';const records=remove?[]:photos.map((photo,i)=>({id:prefix+String(i).padStart(2,'0'),title:entry.title,date:entry.date,caption:i===0?entry.caption:(photo.caption??entry.caption),image:photo.image,revision:1}));
 await runTransaction(contentRef.firestore,async tx=>{for(const old of previous){const snap=await tx.get(doc(contentRef.firestore,'galleryItems',old.id));if(!snap.exists()||snap.data().revision!==old.revision)throw Error('다른 창에서 앨범이 변경되었습니다. 입력 내용을 보관하고 새로 불러와주세요.');}for(const old of previous)tx.delete(doc(contentRef.firestore,'galleryItems',old.id));for(const record of records){const {id,...data}=record;tx.set(doc(contentRef.firestore,'galleryItems',id),{...data,updatedAt:serverTimestamp()});}});return records;
}
