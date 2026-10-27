const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.TEST_BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.pathname==='/login-test'){await route.fulfill({contentType:'text/html',body:'<!doctype html><button id="login">구글 계정으로 로그인</button><button id="login-redirect">현재 창에서 로그인</button><p id="auth-status"></p>'});return;}
   const file=path.join(root,url.pathname);if(!fs.existsSync(file)){await route.fulfill({status:404,body:''});return;}
   await route.fulfill({contentType:'text/javascript',body:fs.readFileSync(file,'utf8')});
  });
  await page.goto('http://localhost:8129/login-test');
  async function setup(mode){
   await page.evaluate(async mode=>{
    const {setupGoogleLogin}=await import('/admin/login-flow.js');
    window.fixture={popup:0,redirect:0,restore:0,auth:{currentUser:null}};
    window.flow=setupGoogleLogin({auth:fixture.auth,provider:()=>({}),login:document.querySelector('#login'),redirect:document.querySelector('#login-redirect'),status:document.querySelector('#auth-status'),slowAfter:500,
     signInWithPopup:()=>{fixture.popup++;if(mode==='blocked')return Promise.reject({code:'auth/popup-blocked'});if(mode==='closed')return Promise.reject({code:'auth/popup-closed-by-user'});return new Promise((resolve,reject)=>{fixture.resolve=resolve;fixture.reject=reject;});},
     signInWithRedirect:async()=>{fixture.redirect++;if(mode==='redirect-error')throw {code:'auth/network-request-failed'};},
     getRedirectResult:async()=>{fixture.restore++;return null;}
    });
    flow.authChanged(null);
   },mode);
  }
  await setup('pending');await page.locator('#login').click();
  assert(await page.locator('#login').isDisabled());assert((await page.locator('#auth-status').textContent()).includes('여는 중'));
  await page.waitForFunction(()=>document.querySelector('#auth-status').textContent.includes('로그인 창이 보이지 않으면'));
  await page.locator('#login-redirect').click();assert.equal(await page.evaluate(()=>fixture.redirect),1);
  await page.evaluate(()=>fixture.reject({code:'auth/popup-blocked'}));
  assert((await page.locator('#auth-status').textContent()).includes('이동하는 중'),'Old popup errors must not replace redirect state');
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('sea-lab-google-redirect-pending')),'1');
  await page.evaluate(()=>flow.authChanged({email:'user@example.org'}));assert(await page.locator('#login').isHidden());assert(await page.locator('#login-redirect').isHidden());
  await page.evaluate(()=>flow.authChanged(null));assert(await page.locator('#login').isEnabled());
  await setup('blocked');await page.locator('#login').click();
  await page.waitForFunction(()=>document.querySelector('#auth-status').textContent.includes('차단했습니다'));
  assert(await page.locator('#login').isEnabled());assert(await page.locator('#login-redirect').isVisible());
  await setup('closed');await page.locator('#login').click();await page.waitForFunction(()=>document.querySelector('#auth-status').textContent.includes('닫혔습니다'));
  assert(await page.locator('#login').isEnabled());
  await setup('redirect-error');await page.locator('#login-redirect').click();
  await page.waitForFunction(()=>document.querySelector('#auth-status').textContent.includes('연결하지 못했습니다'));
  assert(await page.locator('#login').isEnabled());assert(await page.locator('#login-redirect').isEnabled());
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('sea-lab-google-redirect-pending')),null);
  await page.evaluate(()=>sessionStorage.setItem('sea-lab-google-redirect-pending','1'));await setup('restore');
  await page.waitForFunction(()=>document.querySelector('#auth-status').textContent.includes('로그인 결과를 받지 못했습니다'));
  assert.equal(await page.evaluate(()=>fixture.restore),1);assert(await page.locator('#login').isEnabled());
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('sea-lab-google-redirect-pending')),null);
  assert.deepEqual(errors,[]);
  console.log('PASS: popup progress/slow response, blocked/closed popup recovery, explicit redirect fallback, stale attempt protection, redirect failure/result feedback, signed-in/out controls');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
