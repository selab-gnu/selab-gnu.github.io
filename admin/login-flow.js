const redirectKey='sea-lab-google-redirect-pending';
export function loginError(error){
 const messages={
  'auth/popup-blocked':'브라우저가 로그인 창을 차단했습니다. ‘현재 창에서 로그인’을 선택하거나 팝업을 허용해주세요.',
  'auth/popup-closed-by-user':'로그인 창이 닫혔습니다. 다시 시도하거나 ‘현재 창에서 로그인’을 선택해주세요.',
  'auth/cancelled-popup-request':'다른 로그인 요청이 시작되었습니다. 열린 로그인 창을 확인해주세요.',
  'auth/unauthorized-domain':'현재 사이트 주소가 Firebase 로그인 허용 도메인에 없습니다. 관리자에게 문의해주세요.',
  'auth/operation-not-allowed':'Firebase에서 Google 로그인을 활성화해야 합니다. 관리자에게 문의해주세요.',
  'auth/network-request-failed':'로그인 서버에 연결하지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해주세요.',
  'auth/web-storage-unsupported':'브라우저의 쿠키·저장소를 사용할 수 없습니다. Chrome 또는 Edge의 일반 탭에서 다시 시도해주세요.'
 };
 return messages[error?.code]||'로그인 실패: '+(error?.code||error?.message||'알 수 없는 오류');
}

export function setupGoogleLogin({auth,provider,signInWithPopup,signInWithRedirect,getRedirectResult,login,redirect,status,slowAfter=8000}){
 let attempt=0,timer,phase='idle',currentMessage='',hadUser=false;
 const original=login.textContent;
 const message=value=>{currentMessage=value;status.textContent=value;};
 function reset(){clearTimeout(timer);phase='idle';login.disabled=false;redirect.disabled=false;login.textContent=original;}
 function flag(value){try{if(value)sessionStorage.setItem(redirectKey,'1');else sessionStorage.removeItem(redirectKey);}catch{}}
 login.onclick=async()=>{
  const token=++attempt;reset();phase='popup';login.disabled=true;login.textContent='Google 로그인 창 여는 중…';
  message('Google 로그인 창을 여는 중입니다. 새 창에서 계정을 선택해주세요.');
  timer=setTimeout(()=>{if(token===attempt)message('로그인 창이 보이지 않으면 팝업 차단을 확인하거나 ‘현재 창에서 로그인’을 선택해주세요. 앱 안에서 이용 중이면 Chrome 또는 Edge에서도 열 수 있습니다.');},slowAfter);
  try{await signInWithPopup(auth,provider());if(token===attempt)message('로그인 계정 정보를 확인하는 중입니다…');}
  catch(error){if(token===attempt)message(loginError(error));}
  finally{if(token===attempt)reset();}
 };
 redirect.onclick=async()=>{
  const token=++attempt;reset();phase='redirect';login.disabled=true;redirect.disabled=true;flag(true);
  message('현재 창을 Google 로그인 페이지로 이동하는 중입니다…');
  try{await signInWithRedirect(auth,provider());}
  catch(error){if(token===attempt){flag(false);reset();message(loginError(error));}}
 };
 async function restore(){
  let pending=false;try{pending=sessionStorage.getItem(redirectKey)==='1';}catch{}
  if(!pending)return;
  const token=++attempt;reset();phase='restoring';login.disabled=true;redirect.disabled=true;
  message('Google 로그인 결과를 확인하는 중입니다…');
  try{
   const result=await getRedirectResult(auth);
   if(token!==attempt)return;
   if(result?.user||auth.currentUser)message('로그인 계정의 권한을 확인하는 중입니다…');
   else message('이 브라우저에서 로그인 결과를 받지 못했습니다. Chrome 또는 Edge 일반 탭에서 팝업 로그인을 다시 시도해주세요.');
  }catch(error){if(token===attempt)message(loginError(error));}
  finally{flag(false);if(token===attempt)reset();}
 }
 restore();
 return {
  authChanged(user){
   login.hidden=!!user;redirect.hidden=!!user;
   if(user||hadUser){attempt++;reset();flag(false);}hadUser=!!user;
   if(!user&&phase!=='idle')queueMicrotask(()=>{if(phase!=='idle')status.textContent=currentMessage;});
  }
 };
}
