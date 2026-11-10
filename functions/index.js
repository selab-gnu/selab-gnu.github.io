const {onRequest}=require('firebase-functions/v2/https');
const {defineSecret,defineString}=require('firebase-functions/params');
const {initializeApp}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');
const {uidFor,signState,verifyState}=require('./naver-core');
initializeApp();
const clientId=defineString('NAVER_CLIENT_ID');
const clientSecret=defineSecret('NAVER_CLIENT_SECRET');
const callbackUrl=defineString('NAVER_CALLBACK_URL');
const siteOrigin='https://selab-gnu.github.io';
const cookieName='__Host-selab-naver';
exports.naverLogin=onRequest({region:'asia-northeast3',secrets:[clientSecret],maxInstances:3,timeoutSeconds:30},async(req,res)=>{
 res.set('Cache-Control','no-store');res.set('Referrer-Policy','no-referrer');res.set('X-Content-Type-Options','nosniff');
 if(req.method!=='GET')return res.status(405).send('Method not allowed');
 const action=req.query.action;
 if(action==='start'){
  const state=String(req.query.state||'');if(!/^[a-f0-9]{64}$/.test(state))return res.status(400).send('Invalid state');
  res.set('Set-Cookie',cookieName+'='+signState(state,clientSecret.value())+'; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600');
  const url=new URL('https://nid.naver.com/oauth2.0/authorize');url.search=new URLSearchParams({response_type:'code',client_id:clientId.value(),redirect_uri:callbackUrl.value(),state}).toString();return res.redirect(url.href);
 }
 if(action!=='callback')return res.status(400).send('Invalid action');
 const cookies=Object.fromEntries((req.headers.cookie||'').split(';').map(x=>x.trim().split('=')));
 const state=String(req.query.state||'');
 res.set('Set-Cookie',cookieName+'=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
 if(!verifyState(cookies[cookieName]||'',state,clientSecret.value()))return res.status(400).send('로그인 요청을 확인할 수 없습니다. 창을 닫고 다시 시도해주세요.');
 const deliver=payload=>{const nonce=require('node:crypto').randomBytes(20).toString('base64');res.set('Content-Security-Policy',"default-src 'none'; script-src 'nonce-"+nonce+"'; base-uri 'none'; frame-ancestors 'none'");const data=JSON.stringify({type:'selab-naver-login',state,...payload}).replace(/</g,'\\u003c');return res.type('html').send('<!doctype html><meta charset="utf-8"><title>네이버 로그인</title><p>로그인 창으로 돌아가세요. 자동으로 닫히지 않으면 이 창을 닫아주세요.</p><script nonce="'+nonce+'">if(window.opener){window.opener.postMessage('+data+','+JSON.stringify(siteOrigin)+');window.close();}</script>');};
 if(req.query.error)return deliver({error:'네이버 로그인이 취소되었거나 정보 제공에 동의하지 않았습니다.'});
 if(typeof req.query.code!=='string'||req.query.code.length>2000)return deliver({error:'잘못된 로그인 응답입니다.'});
 try{
  const tokenResponse=await fetch('https://nid.naver.com/oauth2.0/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',client_id:clientId.value(),client_secret:clientSecret.value(),code:req.query.code,state}),signal:AbortSignal.timeout(10000)});
  const token=await tokenResponse.json();if(!tokenResponse.ok||!token.access_token)throw Error('token');
  const profileResponse=await fetch('https://openapi.naver.com/v1/nid/me',{headers:{Authorization:'Bearer '+token.access_token},signal:AbortSignal.timeout(10000)});const profile=await profileResponse.json();
  if(!profileResponse.ok||profile.resultcode!=='00'||typeof profile.response?.id!=='string'||!profile.response.id||profile.response.id.length>512)throw Error('profile');
  // No email-based linking or automatic role grant. Identity comes from Naver's server response.
  const uid=uidFor(profile.response.id);const auth=getAuth();try{await auth.getUser(uid);}catch(error){if(error.code!=='auth/user-not-found')throw error;await auth.createUser({uid});}
  const firebaseToken=await auth.createCustomToken(uid,{loginProvider:'naver'});return deliver({token:firebaseToken});
 }catch{return deliver({error:'네이버 인증을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.'});}
});
