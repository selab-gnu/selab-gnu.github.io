import {naverLoginEndpoint} from './naver-config.js';
export function setupNaverLogin({auth,button,status}){
 if(!button)return {authChanged(){}};
 if(!naverLoginEndpoint){button.textContent='네이버로 로그인 (준비 중)';button.title='네이버 앱 등록 및 인증 서버 연결이 필요합니다.';}
 let popup=null,pending='',timer,poll;
 function finish(){clearTimeout(timer);clearInterval(poll);button.disabled=false;pending='';}
 button.onclick=()=>{
  if(!naverLoginEndpoint){status.textContent='네이버 로그인은 준비 중입니다. 연결 전까지 Google 로그인을 이용해주세요.';return;}
  let endpoint;try{endpoint=new URL(naverLoginEndpoint);if(endpoint.protocol!=='https:'||endpoint.search||endpoint.hash)throw Error();}catch{status.textContent='네이버 로그인 서버 설정을 확인해주세요.';return;}
  finish();pending=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');endpoint.search=new URLSearchParams({action:'start',state:pending});
  popup=window.open(endpoint.href,'selab-naver-login','popup,width=500,height=700');if(!popup){finish();status.textContent='팝업 차단을 해제한 뒤 다시 시도해주세요.';return;}
  button.disabled=true;status.textContent='네이버 로그인 창에서 인증해주세요.';
  poll=setInterval(()=>{if(popup?.closed){finish();status.textContent='네이버 로그인 창이 닫혔습니다. 완료되지 않았다면 다시 시도해주세요.';}},1000);
  timer=setTimeout(()=>{finish();popup?.close();status.textContent='로그인 대기 시간이 지났습니다. 다시 시도해주세요.';},180000);
 };
 window.addEventListener('message',async event=>{
  if(!pending||!naverLoginEndpoint||event.origin!==new URL(naverLoginEndpoint).origin||event.source!==popup||event.data?.type!=='selab-naver-login'||event.data.state!==pending)return;
  const data=event.data;finish();popup?.close();
  if(typeof data.error==='string'){status.textContent=data.error;return;}
  if(typeof data.token!=='string'||data.token.length>10000){status.textContent='로그인 응답을 확인할 수 없습니다.';return;}
  status.textContent='네이버 계정의 홈페이지 권한을 확인하는 중입니다…';
  try{const {signInWithCustomToken}=await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js');await signInWithCustomToken(auth,data.token);}catch{status.textContent='홈페이지 로그인에 실패했습니다. 서버 및 Firebase 설정을 확인해주세요.';}
 });
 return {authChanged(user){button.hidden=!!user;if(user){finish();popup?.close();}}};
}
