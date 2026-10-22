import {contentRef,runTransaction,serverTimestamp} from '../firebase-client.js';
import {doc} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import {collectionKinds,validEntry} from '../collections.js';
import {canEdit} from './auth.js';

export async function saveEntry(kind,entry,remove=false){
  if(!canEdit(kind))throw Error('관리자만 게시물을 변경할 수 있습니다.');
  if(!validEntry(kind,entry))throw Error('제목·날짜·본문 또는 사진을 확인해주세요.');
  const ref=doc(contentRef.firestore,collectionKinds[kind],entry.id);
  await runTransaction(contentRef.firestore,async tx=>{
    const snap=await tx.get(ref),revision=snap.exists()?snap.data().revision:0;
    if(revision!==entry.revision||(remove&&!snap.exists())||(!snap.exists()&&entry.revision!==0))
      throw Error('다른 창에서 게시물이 변경되었습니다. 작성한 내용을 보관한 뒤 다시 불러와주세요.');
    if(remove){tx.delete(ref);return;}
    const data={title:entry.title,date:entry.date,revision:revision+1,updatedAt:serverTimestamp()};
    if(kind==='gallery'){data.image=entry.image;data.caption=entry.caption;}
    else data.body=entry.body;
    tx.set(ref,data);
  });
  return {...entry,revision:entry.revision+1};
}
