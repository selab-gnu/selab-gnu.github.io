const {createHmac,timingSafeEqual,createHash}=require('node:crypto');
const uidFor=id=>'naver_'+createHash('sha256').update(id).digest('hex');
function signState(state,secret,now=Date.now()){const payload=Buffer.from(JSON.stringify({state,expires:now+600000})).toString('base64url');return payload+'.'+createHmac('sha256',secret).update('naver-login:'+payload).digest('base64url');}
function verifyState(cookie,state,secret,now=Date.now()){
 try{const [payload,signature,...extra]=cookie.split('.');if(extra.length)return false;const expected=createHmac('sha256',secret).update('naver-login:'+payload).digest();const actual=Buffer.from(signature,'base64url');if(expected.length!==actual.length||!timingSafeEqual(expected,actual))return false;const data=JSON.parse(Buffer.from(payload,'base64url'));return /^[a-f0-9]{64}$/.test(state)&&data.state===state&&data.expires>now&&data.expires<=now+600000;}catch{return false;}
}
module.exports={uidFor,signState,verifyState};
