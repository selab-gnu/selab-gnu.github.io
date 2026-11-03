// Both shareable language versions, cloud data, and compact alumni; no production writes.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const groups=JSON.parse(fs.readFileSync(path.join(root,'data/publications.json'),'utf8'));
const legacy=JSON.parse(fs.readFileSync(path.join(root,'data/sections.json'),'utf8')).find(s=>s.section==='Members').html;
const removed='a893f9cf-5023-4546-90b4-47822e884917';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.TEST_BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',error=>errors.push(error.message));if(process.env.DEBUG_LOCALES)page.on('console',message=>console.log('BROWSER',message.type(),message.text()));
 await page.addInitScript(({groups,legacy,removed})=>{localStorage.setItem('sea-lab-language','ko');window.localeFixture={groups,legacy,removed,records:null,deletes:[]};},{groups,legacy,removed});
 await page.route('**/*',async route=>{const url=new URL(route.request().url());let body;
 if(url.pathname==='/firebase-client.js')body=`export const contentRef={firestore:{}};export const getDoc=async()=>({exists:()=>true,data:()=>({version:1,home:'<p>This homepage is under the construction.</p>',members:window.localeFixture.legacy,groups:window.localeFixture.groups,memberDirectoryVersion:1,revision:1})});export const serverTimestamp=()=>0;export const runTransaction=async(db,fn)=>{const deletes=[];await fn({get:async ref=>{const id=ref.path.split('/').pop();const record=window.localeFixture.records.find(r=>r.id===id);return {id,exists:()=>!!record,data:()=>record};},delete:ref=>deletes.push(ref.path.split('/').pop())});window.localeFixture.records=window.localeFixture.records.filter(r=>!deletes.includes(r.id));window.localeFixture.deletes.push(...deletes);};`;
 else if(url.hostname==='www.gstatic.com')body=`export const doc=(db,...parts)=>({path:parts.join('/')});export const collection=doc;export const getDocs=async ref=>{if(!window.localeFixture.records){const {splitLegacyMembers}=await import(new URL('/member-profiles.js',location.origin).href);window.localeFixture.records=splitLegacyMembers(window.localeFixture.legacy).map(r=>({...r,revision:1}));window.localeFixture.records.push({id:window.localeFixture.removed,name:'Yeonu Lee',group:'current',html:'<strong>Yeonu Lee</strong><p>MS Student</p>',bio:'',order:100,revision:1});}return {docs:ref.path==='memberProfiles'?window.localeFixture.records.map(r=>({id:r.id,data:()=>r})):[]};};`;
 else{const file=path.join(root,url.pathname);if(!fs.existsSync(file)){await route.fulfill({status:404,body:''});return;}body=fs.readFileSync(file);}
 await route.fulfill({contentType:({'.js':'text/javascript','.css':'text/css','.html':'text/html; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg'})[path.extname(url.pathname)]||'application/octet-stream',body});
 });
 const screenshot=async name=>{if(!process.env.LANGUAGE_SCREENSHOTS)return;fs.mkdirSync(process.env.LANGUAGE_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.LANGUAGE_SCREENSHOTS,name+'.png'),fullPage:name.startsWith('members')});};
 for(const file of ['index.html','research.html','members.html','news.html','gallery.html']){
  await page.goto('http://localhost:8137/'+file+'?lang=en');await page.locator('.language-switch').waitFor();
  if(file==='members.html')await page.waitForFunction(()=>window.localeFixture.records&&document.getElementById('member-'+window.localeFixture.records[0].id)&&document.querySelectorAll('.member-profile').length===29);
  if(file==='news.html')await page.waitForSelector('.news-source');
  assert.equal(await page.locator('html').getAttribute('lang'),'en',file);
  const visible=await page.locator('main').innerText();assert(!/[가-힣]/.test(visible),file+' contains untranslated Korean: '+visible.match(/.{0,35}[가-힣].{0,50}/g));
  if(file==='index.html'){assert(visible.includes('We study software evolution'));await screenshot('home-en');}
  if(file==='members.html'){
   assert.equal(await page.locator('.member-alumnus').count(),18);assert.equal(await page.locator('.member-alumnus img,.member-alumnus .member-portrait,.member-alumnus details').count(),0);
   for(const name of ['Taehwan Kim','Hyug Jang']){const previous=page.locator('[data-member-name="'+name+'"]');assert.equal(await previous.count(),1);assert(await previous.evaluate(el=>el.parentElement.classList.contains('alumni-list')));assert.equal(await previous.locator('img,.member-portrait').count(),0);}
   assert.equal(await page.locator('.member-portrait').count(),11);assert.equal(await page.locator('[data-member-name="Yeonu Lee"]').count(),0);
   assert.equal(await page.locator('[data-member-name="det virak"] h3').innerText(),'Det Virak');
   assert.equal(await page.locator('[data-member-name="Patel Kajal"] h3').innerText(),'Kajal Patel');
   assert(!/[가-힣]/.test(await page.locator('[data-member-name="Uicheon Lee"]').innerText()));

   assert.equal(await page.evaluate(()=>window.localeFixture.deletes.length),0,'Public reads must not delete backend data');
   await screenshot('members-en');
   await page.locator('[data-language=ko]').click();assert.equal(new URL(page.url()).searchParams.get('lang'),'ko');
   assert((await page.locator('[data-member-name="Uicheon Lee"]').innerText()).includes('심층 강화학습'));
   assert((await page.locator('[data-member-name="Changwon Gwak"]').innerText()).includes('현대로템'));
   await screenshot('members-ko');
   await page.evaluate(async()=>{const {purgeRemovedProfiles}=await import('/admin/member-store.js');await purgeRemovedProfiles();await purgeRemovedProfiles();});
   assert.deepEqual(await page.evaluate(()=>window.localeFixture.deletes),[removed]);
  }
 }
 await page.goto('http://localhost:8137/index.html?lang=ko');await page.locator('.language-switch').waitFor();assert((await page.locator('#cloud-home').innerText()).includes('연구실 운영 원칙'));
 const memberLink=page.locator('nav[aria-label="Main navigation"] a').filter({hasText:'멤버'});assert.equal(new URL(await memberLink.getAttribute('href'),'http://localhost:8137').searchParams.get('lang'),'ko');await memberLink.click();assert.equal(new URL(page.url()).searchParams.get('lang'),'ko');
 await page.locator('[data-language=en]').click();await page.reload();await page.locator('.language-switch').waitFor();assert.equal(await page.locator('html').getAttribute('lang'),'en');
 for(const width of [390,768,1440]){await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 assert.deepEqual(errors,[]);console.log('PASS: shareable EN/KO versions across public pages, translated member topics/details/alumni, correct name casing, 16 alumni and 2 previous members without photos, requested profile exclusion, admin-only deferred cleanup, language navigation/reload and responsive layout.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
