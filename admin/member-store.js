import { contentRef, getDoc, runTransaction, serverTimestamp } from '../firebase-client.js';
import { doc, collection, getDocs } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const ref = id => doc(contentRef.firestore, 'memberProfiles', id);
export async function readProfiles() {
  return (await getDocs(collection(contentRef.firestore, 'memberProfiles'))).docs.map(d=>({id:d.id,...d.data()}));
}
export async function readProfile(id) {
  const snap = await getDoc(ref(id));
  return snap.exists() ? {id:snap.id,...snap.data()} : null;
}
export async function migrateProfiles(records, revision) {
  await runTransaction(contentRef.firestore, async tx=>{
    const snap = await tx.get(contentRef);
    if (!snap.exists()) throw Error('먼저 기존 자료를 홈페이지에 공개 저장해주세요.');
    if (snap.data().memberDirectoryVersion === 1) throw Error('이미 멤버별 관리로 전환되었습니다. 새로고침해주세요.');
    if (snap.data().revision !== revision) throw Error('공개 자료가 변경되었습니다. 다시 불러온 뒤 전환해주세요.');
    for (const record of records) {
      const {id,...data}=record;
      tx.set(ref(id), {...data,revision:1,updatedAt:serverTimestamp()});
    }
    tx.update(contentRef,{memberDirectoryVersion:1,revision:revision+1,updatedAt:serverTimestamp()});
  });
  return revision+1;
}
export async function saveProfile(record, ownBioOnly=false) {
  const {id,revision}=record;
  await runTransaction(contentRef.firestore,async tx=>{
    const snap=await tx.get(ref(id));
    const current=snap.exists()?snap.data().revision:0;
    if (revision!==current) throw Error('이 멤버의 소개가 다른 창에서 변경되었습니다. 다시 불러온 뒤 수정해주세요.');
    if (ownBioOnly) {
      if (!snap.exists()) throw Error('연결된 멤버가 없습니다. 관리자에게 문의해주세요.');
      tx.update(ref(id),{bio:record.bio,revision:current+1,updatedAt:serverTimestamp()});
    } else {
      const {name,html,bio,group,order}=record;
      tx.set(ref(id),{name,html,bio,group,order,revision:current+1,updatedAt:serverTimestamp()});
    }
  });
  return {...record,revision:revision+1};
}
export async function deleteProfile(record) {
  await runTransaction(contentRef.firestore,async tx=>{
    const snap=await tx.get(ref(record.id));
    if(!snap.exists()||snap.data().revision!==record.revision) throw Error('멤버 정보가 변경되었습니다. 다시 불러와주세요.');
    tx.delete(ref(record.id));
  });
}
