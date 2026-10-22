import { app, contentRef, getDoc, runTransaction, serverTimestamp } from '../firebase-client.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { adminEmail } from '../firebase-config.js';
import { validContent } from '../content.js';
import { doc, setDoc, deleteDoc, collection, getDocs } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
const auth = getAuth(app);
let role='visitor', authGeneration=0, ownMemberId='';
export function getOwnMemberId(){return ownMemberId;}
export function canEdit(section){if(section==='my-profile')return (role==='admin'||role==='member')&&!!ownMemberId;return role==='admin'&&['publications','home','members','news','gallery'].includes(section);}
export function isAdmin(){return role==='admin';}
export function hasEditorAccess(){return role==='admin'||role==='member';}

const status = document.querySelector('#auth-status');
const login = document.querySelector('#login');
const logout = document.querySelector('#logout');
export async function readContent() {
 const snap = await getDoc(contentRef);
 if (!snap.exists()) return null;
 const d = snap.data();
 if (!validContent(d) || !Number.isInteger(d.revision)) throw Error('저장된 자료 형식을 확인해주세요.');
 return d;
}
export async function publishContent(data, revision) {
 if (!canEdit('publications')) throw Error('콘텐츠 편집 권한이 필요합니다.');
 if (!validContent(data)) throw Error('자료 형식이 올바르지 않습니다.');
 await runTransaction(contentRef.firestore, async tx => {
  const snap = await tx.get(contentRef);
  const current = snap.exists() ? snap.data().revision : 0;
  if (current !== revision) throw Error('다른 창에서 자료가 변경되었습니다. 작성한 내용을 복사해 보관한 뒤 다시 불러와 편집해주세요.');
  if(!snap.exists()&&!isAdmin())throw Error('전체 관리자가 먼저 최초 공개 저장을 해야 합니다.');
  const previous=snap.exists()?snap.data():data;
  tx.set(contentRef, { version: 1, home: canEdit('home')?data.home:previous.home, members: canEdit('members')&&previous.memberDirectoryVersion!==1?data.members:previous.members, groups: data.groups, ...(previous.memberDirectoryVersion===1?{memberDirectoryVersion:1}:{}), revision: current + 1, updatedAt: serverTimestamp() });
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
  const generation=++authGeneration;role='visitor';ownMemberId='';
  document.querySelector('#workspace').hidden=true;callback(false);
  document.title='연구실 홈페이지 · 로그인';
  document.querySelector('#account-heading').textContent='로그인';
  document.querySelector('#login-heading').textContent='관리자·멤버 로그인';
  logout.hidden=!user;login.hidden=!!user;
  status.textContent=user?'계정 권한을 확인하는 중입니다…':'방문자는 로그인 없이 공개 자료를 볼 수 있습니다. 관리자·멤버는 Google 계정으로 로그인하세요.';
  if(!user)return;
  try{
   const token=await user.getIdTokenResult();
   if(user.emailVerified&&token.signInProvider==='google.com'){
    if(user.email.toLowerCase()===adminEmail.toLowerCase())role='admin';
    else {const snap=await getDoc(doc(contentRef.firestore,'editorRoles',user.email.toLowerCase()));if(generation!==authGeneration)return;const data=snap.exists()?snap.data():{};role=['admin','member','visitor'].includes(data.role)?data.role:'visitor';ownMemberId=role!=='visitor'?(data.memberId||''):'';}
   }
   if(generation!==authGeneration)return;
   const allowed=hasEditorAccess();
   const heading=allowed?(isAdmin()?'홈페이지 관리':'내 자기소개 수정'):'로그인 계정';
   document.title='연구실 홈페이지 · '+heading;
   document.querySelector('#account-heading').textContent=heading;
   document.querySelector('#login-heading').textContent=heading;
   document.querySelector('#workspace').hidden=!allowed;
   document.querySelector('#role-management').hidden=!isAdmin();
   for(const section of ['publications','home','members','news','gallery','my-profile'])document.querySelector('[data-tab="'+section+'"]').hidden=!canEdit(section);
   status.textContent=allowed?user.email+' · '+({admin:'관리자',member:'멤버 (자기소개만 편집)',visitor:'방문자'}[role]):user.email+' · 방문자: 공개 자료만 열람할 수 있습니다. 자기소개를 수정하려면 관리자에게 멤버 등록을 요청해주세요.';
   callback(allowed);
  }catch(e){role='visitor';status.textContent='권한 확인 실패: '+(e.code||e.message)+'. 관리자에게 문의해주세요.';}
 });
}
export async function listRoles(){if(!isAdmin())throw Error('관리자만 사용할 수 있습니다.');return (await getDocs(collection(contentRef.firestore,'editorRoles'))).docs.map(d=>({email:d.id,...d.data()}));}
export async function grantRole(email,value,memberId=''){if(!isAdmin())throw Error('관리자만 사용할 수 있습니다.');email=email.trim().toLowerCase();if(email===adminEmail.toLowerCase()||!email.includes('@')||email.includes('/'))throw Error('추가할 편집자의 이메일을 입력해주세요.');if(!['admin','member','visitor'].includes(value))throw Error('잘못된 권한입니다.');if(value==='visitor')memberId='';if(value==='member'&&!memberId)throw Error('자기소개를 수정할 멤버를 연결해주세요.');if(memberId&&!(await getDoc(doc(contentRef.firestore,'memberProfiles',memberId))).exists())throw Error('공개 저장된 멤버를 선택해주세요.');await setDoc(doc(contentRef.firestore,'editorRoles',email),{role:value,...(memberId?{memberId}:{})});}
export async function revokeRole(email){if(!isAdmin())throw Error('관리자만 사용할 수 있습니다.');if(email.trim().toLowerCase()===adminEmail.toLowerCase())throw Error('기본 관리자 계정은 해제할 수 없습니다.');await deleteDoc(doc(contentRef.firestore,'editorRoles',email));}
