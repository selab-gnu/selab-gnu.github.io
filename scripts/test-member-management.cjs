// Run with Playwright available on NODE_PATH. No live Firebase writes occur.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const firestore=`
export const doc=(db,...parts)=>({firestore:db,path:parts.join('/')});
export const collection=(db,...parts)=>({firestore:db,path:parts.join('/')});
const snapshot=(ref)=>({id:ref.path.split('/').pop(),exists:()=>!!window.fixture.docs[ref.path],data:()=>structuredClone(window.fixture.docs[ref.path])});
export const getDoc=async ref=>snapshot(ref);
export const getDocs=async ref=>({docs:Object.keys(window.fixture.docs).filter(k=>k.startsWith(ref.path+'/')&&k.split('/').length===2).map(path=>snapshot({path}))});
export const serverTimestamp=()=>0;
export const setDoc=async(ref,data)=>{window.fixture.docs[ref.path]=structuredClone(data);sessionStorage.setItem('test-member-docs',JSON.stringify(window.fixture.docs))};
export const deleteDoc=async ref=>{delete window.fixture.docs[ref.path];sessionStorage.setItem('test-member-docs',JSON.stringify(window.fixture.docs))};
export const runTransaction=async(db,fn)=>{const writes=[];await fn({get:getDoc,set:(r,d)=>writes.push(()=>setDoc(r,d)),update:(r,d)=>writes.push(()=>setDoc(r,{...window.fixture.docs[r.path],...d})),delete:r=>writes.push(()=>deleteDoc(r))});if(window.fixture.denyWrite)throw Error('permission-denied');for(const write of writes)await write()};`;
const authSDK=`
export const getAuth=()=>({});export class GoogleAuthProvider{setCustomParameters(){}}
export const signInWithPopup=async()=>{};export const signOut=async()=>window.fixture.login(null);
export const onAuthStateChanged=(auth,callback)=>{window.fixture.login=async user=>{window.fixture.user=user;sessionStorage.setItem('test-member-user',user?.email||'');await callback(user)};queueMicrotask(()=>callback(window.fixture.user));return ()=>{}};`;
const client=`export const app={},db={};export const contentRef={firestore:db,path:'siteContent/main'};export {getDoc,runTransaction,serverTimestamp} from '/mock-firestore.js';`;

(async()=>{
 const executablePath=process.env.TEST_BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
 const browser=await chromium.launch({headless:true,executablePath});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
  const groups=JSON.parse(fs.readFileSync(path.join(root,'data/publications.json'),'utf8'));
  const sections=JSON.parse(fs.readFileSync(path.join(root,'data/sections.json'),'utf8'));
  const legacy=sections.find(s=>s.path==='members.html').html;
  await page.addInitScript(({groups,legacy})=>{
   if(window!==window.top)return;
   const account=email=>({email,emailVerified:true,getIdTokenResult:async()=>({signInProvider:'google.com'})});
   window.fixture={account,docs:{'siteContent/main':{version:1,home:'<p>Home</p>',members:legacy,groups,revision:1,updatedAt:0}},user:account('yeonu7787@gmail.com')};
    const savedDocs=sessionStorage.getItem('test-member-docs');if(savedDocs)window.fixture.docs=JSON.parse(savedDocs);
    const savedUser=sessionStorage.getItem('test-member-user');if(savedUser!==null)window.fixture.user=savedUser?account(savedUser):null;
  },{groups,legacy});
  await page.route('**/*',async route=>{
   const url=new URL(route.request().url());let source;
   if(url.pathname.endsWith('firebase-auth.js'))source=authSDK;
   else if(url.pathname.endsWith('firebase-firestore.js')||url.pathname==='/mock-firestore.js')source=firestore;
   else if(url.pathname==='/firebase-client.js')source=client;
   else {
    const file=path.join(root,url.pathname==='/'?'index.html':url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname);
    if(!fs.existsSync(file)){await route.fulfill({status:404,body:''});return;}
    source=fs.readFileSync(file,'utf8');
   }
   const contentType=url.pathname.endsWith('.js')?'text/javascript':url.pathname.endsWith('.css')?'text/css':url.pathname.endsWith('.json')?'application/json':'text/html; charset=utf-8';
   await route.fulfill({contentType,headers:{'Access-Control-Allow-Origin':'*'},body:source});
  });
  async function submitMember(name){
    await page.locator('#member-form button[type="submit"]').click();
    await page.waitForURL(url=>url.pathname==='/members.html'&&url.searchParams.has('added'));
    await page.locator('.member-registration-status').waitFor();
    assert((await page.locator('.member-registration-status').textContent()).includes(name));
    const target=new URL(page.url()).searchParams.get('added');
    assert(await page.locator('[id="member-'+target+'"]').isVisible());
    await page.goto('http://localhost:8129/admin/');await page.waitForFunction(()=>!document.querySelector('#app').hidden);
    await page.locator('[data-tab="members"]').click();
    await page.locator('#member-list button').filter({hasText:name}).click();
  }
  await page.goto('http://localhost:8129/admin/');
  await page.waitForFunction(()=>!document.querySelector('#app').hidden);
  await page.locator('[data-tab="members"]').click();
  const migration=await page.locator('#member-migration-count').textContent();
  assert(migration.includes('29명'),migration);
  // The actual source has 13 current members and 16 alumni. Verify no name is
  // combined accidentally, and every original text/link survives conversion.
  const migrationInfo=await page.evaluate(()=>{
   const box=document.querySelector('#member-migration-preview');
   return {text:box.textContent,links:[...box.querySelectorAll('a')].map(a=>a.href)};
  });
  assert(migrationInfo.text.includes('Uicheon')&&migrationInfo.text.includes('Lee'));
  // New-member registration must be available before the legacy document has
  // been migrated. Its first save performs both operations atomically.
  assert(await page.locator('#new-member').isVisible());
  assert(await page.locator('#member-delete').isVisible());
  await page.locator('#new-member').click();
  await page.locator('#member-name').fill('First Save Test');
  await page.locator('#member-role').fill('Undergraduate Research Student');
  await page.evaluate(()=>window.fixture.denyWrite=true);
  await page.locator('#member-form button[type="submit"]').click();
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('작성한 내용은 유지됩니다'));
  assert.equal(await page.locator('#member-name').inputValue(),'First Save Test');
  assert.equal(await page.evaluate(()=>window.fixture.docs['siteContent/main'].memberDirectoryVersion),undefined);
  assert(await page.locator('#member-new-card').isVisible());
  assert((await page.locator('#member-submit-error').textContent()).includes('입력 내용'));
  await page.evaluate(()=>window.fixture.denyWrite=false);
  await submitMember('First Save Test');
  await page.waitForFunction(()=>window.fixture.docs['siteContent/main'].memberDirectoryVersion===1);

  assert.equal(await page.locator('#member-list button').count(),30);
  assert.equal(await page.locator('#member-edit-name').inputValue(),'First Save Test');
  await page.locator('#member-delete').click();
  await page.waitForFunction(()=>document.querySelectorAll('#member-list button').length===29);
  const records=await page.evaluate(()=>Object.entries(window.fixture.docs).filter(([key])=>key.startsWith('memberProfiles/')).map(([key,value])=>({id:key.split('/')[1],...value})));
  assert.equal(records.length,29);
  assert.equal(records.filter(r=>r.group==='current').length,13);
  assert.equal(records.filter(r=>r.group==='graduates').length,9);
  assert.equal(records.filter(r=>r.group==='undergraduates').length,7);
  assert(records.some(r=>r.name==='Uicheon Lee'));
  assert(migrationInfo.links.includes('mailto:saleese@gmail.com'));
  const preserved=await page.evaluate(({legacy,records})=>{
   const parse=html=>new DOMParser().parseFromString(html,'text/html');
   const original=parse(legacy);
   for(const el of original.querySelectorAll('strong,b'))if(/^(Alumni|Graduate Students\s*-*|Undergraduate Students\s*-*)$/.test(el.textContent.trim()))el.remove();
   const normalized=html=>parse(html).body.textContent.replace(/\s/g,'');
   return normalized(original.body.innerHTML)===normalized(records.map(r=>r.html).join(''));
  },{legacy,records});
  assert(preserved,'All original member text must survive migration');
  const before=await page.evaluate(()=>structuredClone(window.fixture.docs));
  await page.locator('#member-edit-bio').fill('연구 소개 첫 줄\n두 번째 줄 <script>alert(1)</script>');
  await page.locator('#member-save').click();
  await page.waitForFunction(()=>document.querySelector('#status').textContent==='선택한 멤버를 공개 저장했습니다.');
  const after=await page.evaluate(()=>structuredClone(window.fixture.docs));
  assert.equal(after['siteContent/main'].members,legacy);
  for(const [key,value] of Object.entries(before))if(key!=='memberProfiles/'+records[0].id)assert.deepEqual(after[key],value);
  // Register a self-only role linked to a member, with a different login email.
  await page.locator('#role-management summary').click();
  await page.locator('#role-email').fill('member@example.org');
  await page.locator('#role-value').selectOption('member');
  await page.locator('#role-member').selectOption(records[0].id);
  await page.locator('#role-form button[type="submit"]').click();
  await page.waitForFunction(()=>!!window.fixture.docs['editorRoles/member@example.org']);
  assert.equal((await page.evaluate(()=>window.fixture.docs['editorRoles/member@example.org'])).memberId,records[0].id);
  // Check full form registration and the selected alumni group.
  await page.locator('#new-member').click();
  await page.locator('#member-name').fill('Test Member');
  await page.locator('#member-role').fill('MS Student');
  await page.locator('#member-group').selectOption('graduates');
  await page.locator('#member-bio').fill('New biography');
  await submitMember('Test Member');
  assert.equal(await page.evaluate(()=>Object.values(window.fixture.docs).find(r=>r.name==='Test Member').group),'graduates');
  // A professor assigned the administrator role has full management access.
  await page.evaluate(async()=>{const auth=await import('/admin/auth.js');await auth.grantRole('professor@example.org','admin');await window.fixture.login(window.fixture.account('professor@example.org'));});
  await page.waitForFunction(()=>!document.querySelector('#app').hidden);
  await page.locator('[data-tab="members"]').click();
  assert(await page.locator('#new-member').isVisible());
  assert(await page.locator('#member-delete').isVisible());
  assert(await page.locator('#role-management').isVisible());
  await page.locator('#new-member').click();
  await page.locator('#member-name').fill('Professor Added Member');
  await page.locator('#member-role').fill('MS Student');
  await submitMember('Professor Added Member');
  await page.locator('#member-edit-bio').fill('교수님이 수정한 소개');
  await page.locator('#member-save').click();
  await page.waitForFunction(()=>document.querySelector('#status').textContent==='선택한 멤버를 공개 저장했습니다.');
  assert.equal(await page.evaluate(()=>Object.values(window.fixture.docs).find(r=>r.name==='Professor Added Member').bio),'교수님이 수정한 소개');
  await page.locator('#member-delete').click();
  await page.waitForFunction(()=>!Object.values(window.fixture.docs).some(r=>r.name==='Professor Added Member'));
  await page.evaluate(async()=>{const auth=await import('/admin/auth.js');await auth.grantRole('visitor@example.org','visitor');});
  // Existing user: only own biography and no content-management menus.
  await page.evaluate(()=>window.fixture.login(window.fixture.account('member@example.org')));
  await page.waitForFunction(()=>!document.querySelector('#app').hidden&&!document.querySelector('#my-profile').hidden);
  for(const tab of ['publications','members','home'])assert(await page.locator('[data-tab="'+tab+'"]').isHidden());
  assert(await page.locator('#save').isHidden());
  const denied=await page.evaluate(async()=>{
   const auth=await import('/admin/auth.js');
   const results=[];
   for(const action of [()=>auth.grantRole('attacker@example.org','admin'),()=>auth.publishContent(window.fixture.docs['siteContent/main'],2)]){
    try{await action();results.push(false);}catch{results.push(true);}
   }
   return results;
  });
  assert.deepEqual(denied,[true,true],'Self-only accounts cannot grant roles or publish global content');
  await page.locator('#my-bio').fill('내가 직접 수정한 소개\n두 번째 줄');
  await page.locator('#my-bio-save').click();
  await page.waitForFunction(()=>document.querySelector('#status').textContent==='내 자기소개를 공개 저장했습니다.');
  const ownSaved=await page.evaluate(id=>window.fixture.docs['memberProfiles/'+id],records[0].id);
  assert.equal(ownSaved.bio,'내가 직접 수정한 소개\n두 번째 줄');
  assert.equal(ownSaved.html,records[0].html);
  // Revision conflict must retain the user's text for recovery.
  await page.locator('#my-bio').fill('충돌 시 남아야 할 초안');
  await page.evaluate(id=>window.fixture.docs['memberProfiles/'+id].revision++,records[0].id);
  await page.locator('#my-bio-save').click();
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('다른 창에서 변경'));
  assert.equal(await page.locator('#my-bio').inputValue(),'충돌 시 남아야 할 초안');
  // Switch account: no stale member identity or old biography remains.
  await page.evaluate(()=>window.fixture.login(null));
  assert(await page.locator('#workspace').isHidden());
  assert.equal(await page.locator('#my-bio').inputValue(),'');
  for(const email of ['visitor@example.org','unregistered@example.org']){
    await page.evaluate(email=>window.fixture.login(window.fixture.account(email)),email);
    assert(await page.locator('#workspace').isHidden());
    assert((await page.locator('#auth-status').textContent()).includes('방문자'));
  }
  await page.evaluate(async()=>{window.fixture.docs['editorRoles/legacy@example.org']={role:'manager'};await window.fixture.login(window.fixture.account('legacy@example.org'));});
  assert(await page.locator('#workspace').isHidden());

  assert.deepEqual(errors,[]);
  console.log('PASS: new-member button before migration, first-save migration and delete, 29 original members preserved, individual save, role/member link, add alumni, professor full CRUD, member self-only UI/save, conflict recovery, logout cleanup');
  // Re-enter as administrator for local screenshots (mock backend only).
  await page.evaluate(()=>window.fixture.login(window.fixture.account('yeonu7787@gmail.com')));
  await page.waitForFunction(()=>!document.querySelector('#app').hidden);
  await page.locator('[data-tab="members"]').click();
  await page.locator('#role-management summary').click();
  await page.locator('#member-search').fill('Heetae Cho');
  await page.locator('#member-list button').click();
  for(const width of [390,1440]){
   await page.setViewportSize({width,height:1100});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  const screenshot=process.env.TEST_SCREENSHOT;
  await page.locator('#member-preview-rendered').getByText('Heetae Cho',{exact:true}).waitFor();
  if(screenshot)await page.screenshot({path:screenshot,fullPage:true});
  console.log('PASS: mobile and desktop page width');
  // The public page must use individual documents after migration, including
  // a biography saved through the self-only editor.
  await page.goto('http://localhost:8129/members.html');
  await page.waitForFunction(()=>document.querySelector('.imported-content').textContent.includes('내가 직접 수정한 소개'));
  assert.equal(await page.locator('.imported-content h2').count(),3);
  assert.equal(await page.locator('.imported-content script').count(),0);
  console.log('PASS: public directory reads individual profiles and updated biographies');
  // First use of the administrator, before siteContent/main even exists.
  await page.goto('http://localhost:8129/admin/');
  await page.waitForFunction(()=>!document.querySelector('#app').hidden);
  await page.evaluate(async()=>{window.fixture.docs={};await window.fixture.login(window.fixture.account('yeonu7787@gmail.com'));});
  await page.waitForFunction(()=>!document.querySelector('#app').hidden);
  await page.locator('[data-tab="members"]').click();
  await page.locator('#new-member').click();
  await page.locator('#member-name').fill('Initial Setup Member');
  await page.locator('#member-role').fill('MS Student');
  await submitMember('Initial Setup Member');
  assert.equal(await page.evaluate(()=>window.fixture.docs['siteContent/main'].revision),1);
  assert.equal(await page.locator('#member-list button').count(),30);
  console.log('PASS: failed-save draft recovery and first-use administrator bootstrap');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
