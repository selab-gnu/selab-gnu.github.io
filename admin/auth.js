import { app, contentRef, getDoc, runTransaction, serverTimestamp } from '../firebase-client.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { adminEmail } from '../firebase-config.js';
import { validContent } from '../content.js';
import { doc, setDoc, deleteDoc, collection, getDocs } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
const auth = getAuth(app);
let role='visitor', authGeneration=0;
export function canEdit(section){return role==='owner'||role==='manager'||role==='publications'&&section==='publications';}
export function isOwner(){return role==='owner';}

const status = document.querySelector('#auth-status');
const login = document.querySelector('#login');
const logout = document.querySelector('#logout');
export function isAdmin(){return ['owner','manager','publications'].includes(role);}
export async function readContent() {
 const snap = await getDoc(contentRef);
 if (!snap.exists()) return null;
 const d = snap.data();
 if (!validContent(d) || !Number.isInteger(d.revision)) throw Error('저장된 자료 형식을 확인해주세요.');
 return d;
}
export async function publishContent(data, revision) {
 if (!isAdmin()) throw Error('관리자 로그인이 필요합니다.');
 if (!validContent(data)) throw Error('자료 형식이 올바르지 않습니다.');
 await runTransaction(contentRef.firestore, async tx => {
  const snap = await tx.get(contentRef);
  const current = snap.exists() ? snap.data().revision : 0;
  if (current !== revision) throw Error('다른 창에서 자료가 변경되었습니다. 초안을 내보낸 뒤 새로고침해서 다시 편집해주세요.');
  if(!snap.exists()&&role!=='owner')throw Error('전체 관리자가 먼저 최초 공개 저장을 해야 합니다.');
  const previous=snap.exists()?snap.data():data;
  tx.set(contentRef, { version: 1, home: canEdit('home')?data.home:previous.home, members: canEdit('members')?data.members:previous.members, groups: data.groups, revision: current + 1, updatedAt: serverTimestamp() });
 });
 return revision + 1;
}
login.onclick = async () => {
 login.disabled = true;
 try { const provider = new GoogleAuthProvider(); provider.setCustomParameters({prompt:'select_account'}); await signInWithPopup(auth, provider); }
 catch (e) { status.textContent = '로그인 실패: ' + (e.code || e.message); }
 finally { login.disabled = false; }
};
logout.onclick = async () => { if (!confirm('저장하지 않은 수정은 사라집니다. 로그아웃할까요?')) return; await signOut(auth); };
export function watchAuth(callback) {
 return onAuthStateChanged(auth, async user => {
  const generation=++authGeneration;role='visitor';
  document.querySelector('#workspace').hidden=true;callback(false);
  logout.hidden=!user;login.hidden=!!user;
  status.textContent=user?'계정 권한을 확인하는 중입니다…':'구글 계정으로 로그인하세요. 승인된 계정만 편집할 수 있습니다.';
  if(!user)return;
  try{
   const token=await user.getIdTokenResult();
   if(user.emailVerified&&token.signInProvider==='google.com'){
    if(user.email===adminEmail)role='owner';
    else {const snap=await getDoc(doc(contentRef.firestore,'editorRoles',user.email.toLowerCase()));if(generation!==authGeneration)return;role=snap.exists()?snap.data().role:'visitor';}
   }
   if(generation!==authGeneration)return;
   const allowed=isAdmin();
   document.querySelector('#workspace').hidden=!allowed;
   document.querySelector('#role-management').hidden=!isOwner();
   for(const section of ['home','members'])document.querySelector('[data-tab="'+section+'"]').hidden=!canEdit(section);
   status.textContent=allowed?user.email+' · '+({owner:'전체 관리자',manager:'콘텐츠 관리자',publications:'논문 편집자'}[role]):'이 계정에는 편집 권한이 없습니다. 관리자에게 권한 등록을 요청해주세요.';
   callback(allowed);
  }catch(e){role='visitor';status.textContent='권한 확인 실패: '+(e.code||e.message)+'. 관리자에게 문의해주세요.';}
 });
}
export async function listRoles(){if(!isOwner())throw Error('전체 관리자만 사용할 수 있습니다.');return (await getDocs(collection(contentRef.firestore,'editorRoles'))).docs.map(d=>({email:d.id,...d.data()}));}
export async function grantRole(email,value){if(!isOwner())throw Error('전체 관리자만 사용할 수 있습니다.');email=email.trim().toLowerCase();if(email===adminEmail||!email.includes('@')||email.includes('/'))throw Error('추가할 편집자의 이메일을 입력해주세요.');if(!['publications','manager'].includes(value))throw Error('잘못된 권한입니다.');await setDoc(doc(contentRef.firestore,'editorRoles',email),{role:value});}
export async function revokeRole(email){if(!isOwner())throw Error('전체 관리자만 사용할 수 있습니다.');await deleteDoc(doc(contentRef.firestore,'editorRoles',email));}
