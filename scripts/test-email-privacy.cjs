// No production requests or writes: tests protect rendered/static contacts, not backend access control.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.TEST_BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const emailPattern=/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
 for(const file of ['members.html','research.html','index.html']){const html=fs.readFileSync(path.join(root,file),'utf8');assert(!emailPattern.test(html),file+' must not expose plain addresses in generated source');assert(!html.includes('href="mailto:'),file+' must not expose mailto in generated source');}
 await page.route('**/*',async route=>{const url=new URL(route.request().url());if(url.pathname==='/firebase-client.js'){await route.fulfill({contentType:'text/javascript',body:'export const contentRef={};export const getDoc=async()=>({exists:()=>false});'});return;}const file=path.join(root,url.pathname);if(!fs.existsSync(file)){await route.fulfill({status:404,body:''});return;}await route.fulfill({contentType:({'.js':'text/javascript','.css':'text/css','.html':'text/html; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'})[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});});
 await page.goto('http://localhost:8137/members.html');await page.waitForSelector('.member-grid');
 assert.equal(await page.locator('main a[href^="mailto:"]').count(),0);assert(!emailPattern.test(await page.locator('main').innerText()));assert(!emailPattern.test(await page.locator('main').innerHTML()),'Collapsed profile details must not retain plain addresses');
 const card=page.locator('.member-profile').filter({has:page.locator('h3',{hasText:'Seongjin Go'})});
 assert.equal(await card.locator('.member-email .email-contact').textContent(),'tjdwls9267 [at] naver.com');
 assert.equal(await page.locator('.email-reveal,.email-hide,.member-profile details,.member-profile summary').count(),0);
 assert(await card.locator('.member-details').isVisible());
 await page.locator('[data-language=ko]').click();assert.equal(await card.locator('.member-email .email-contact').textContent(),'tjdwls9267 [at] naver.com');
 const restored=await page.evaluate(async()=>{const {splitLegacyMembers,profileHTML,renderProfiles}=await import('/member-profiles.js');const {restoreEmailMarkup}=await import('/email-privacy.js');const source=await(await fetch('/members.html')).text();const doc=new DOMParser().parseFromString(source,'text/html');const records=splitLegacyMembers(doc.querySelector('.imported-content').innerHTML);const go=records.find(r=>r.name==='Seongjin Go');const unsafe=restoreEmailMarkup('<span data-email-token="'+btoa('<img src=x onerror=alert(1)>')+'">Bad</span>');return {count:records.length,admin:profileHTML(go).includes('mailto:tjdwls9267@naver.com'),public:!renderProfiles([go]).includes('mailto:'),unsafe:unsafe.includes('<img')};});
 assert.equal(restored.count,29);assert(restored.admin&&restored.public&&!restored.unsafe);
 for(const file of ['index.html','research.html']){await page.goto('http://localhost:8137/'+file);await page.locator('.language-switch').waitFor();assert.equal(await page.locator('main a[href^="mailto:"]').count(),0);assert(!emailPattern.test(await page.locator('main').innerText()));}
 await page.setViewportSize({width:390,height:844});await page.goto('http://localhost:8137/members.html');await page.waitForSelector('.member-grid');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);console.log('PASS: static source obfuscation, visible [at] addresses without mailto/buttons, expanded profiles, language changes, admin/legacy email preservation, invalid tokens, mobile layout; no backend writes.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
