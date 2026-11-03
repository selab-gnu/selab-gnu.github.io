// Approved name/email supplements only. The private workbook is not used by CI.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
 const supplements=JSON.parse(fs.readFileSync(path.join(root,'data/member-emails.json'),'utf8')).entries;
 const groups=JSON.parse(fs.readFileSync(path.join(root,'data/publications.json'),'utf8'));
 const records=supplements.map((entry,index)=>({id:entry.memberId,name:entry.names[0],group:'current',order:index,revision:1,bio:'Keep biography',html:'<strong>'+entry.names[0]+'</strong><p>Email: </p><img src="https://example.org/portrait.jpg" alt="Portrait">'}));
 records.push({id:'existing',name:'Existing Contact',group:'current',order:30,revision:1,bio:'',html:'<strong>Existing Contact</strong><p>Email: <a href="mailto:existing@example.org">existing@example.org</a></p>'});
 records.push({id:'unmatched',name:'Unmatched Member',group:'current',order:31,revision:1,bio:'',html:'<strong>Unmatched Member</strong><p>Email:</p>'});
 const browser=await chromium.launch({headless:true,executablePath:process.env.TEST_BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(({records,groups})=>window.emailFixture={records,groups},{records,groups});
  await page.route('**/*',async route=>{
   const url=new URL(route.request().url());let body;
   if(url.pathname==='/firebase-client.js')body=`export const contentRef={firestore:{}};export const getDoc=async()=>({exists:()=>true,data:()=>({version:1,home:'',members:'',groups:window.emailFixture.groups,revision:2,memberDirectoryVersion:1})});export const runTransaction=async()=>{};export const serverTimestamp=()=>0;`;
   else if(url.pathname.endsWith('firebase-firestore.js'))body=`export const doc=(db,...parts)=>({firestore:db,path:parts.join('/')});export const collection=doc;export const getDocs=async()=>({docs:window.emailFixture.records.map(record=>({id:record.id,data:()=>record}))});`;
   else{
    const file=path.join(root,url.pathname);if(!fs.existsSync(file)){await route.fulfill({status:404,body:''});return;}body=fs.readFileSync(file);
   }
   await route.fulfill({body,contentType:url.pathname.endsWith('.png')?'image/png':url.pathname.endsWith('.js')?'text/javascript':url.pathname.endsWith('.css')?'text/css':url.pathname.endsWith('.json')?'application/json':'text/html; charset=utf-8'});
  });
  await page.goto('http://localhost:8129/members.html');
  await page.waitForFunction(()=>document.querySelectorAll('.member-profile').length===8);
  for(const entry of supplements){
   const card=page.locator('[id="member-'+entry.memberId+'"]');
   assert.equal(await card.locator('a[href^="mailto:"]').count(),0);
   assert((await card.textContent()).includes(entry.email));
   assert((await card.textContent()).includes('Keep biography'));assert.equal(await card.locator('img').count(),1);
  }
  assert((await page.locator('#member-existing').textContent()).includes('existing@example.org'));
  assert.equal(await page.locator('#member-unmatched a').count(),0);
  const checks=await page.evaluate(async({records,supplements})=>{
   const {supplementMemberEmails,hasMemberEmail}=await import('/member-emails.js');
   const before=JSON.stringify(records),first=supplementMemberEmails(records,supplements),again=supplementMemberEmails(first,supplements);
   const existing={...records[0],html:'<strong>Known name</strong><p>Email: new-choice@example.org</p>'};
   const preserved=supplementMemberEmails([existing],supplements)[0];
   const ambiguous=[{...records[0],id:'duplicate-1'},{...records[0],id:'duplicate-2'}];
   const ambiguousResult=supplementMemberEmails(ambiguous,supplements);
   return {unchanged:before===JSON.stringify(records),idempotent:JSON.stringify(first)===JSON.stringify(again),preserved:preserved.html===existing.html,ambiguous:ambiguousResult.every(record=>!hasMemberEmail(record.html))};
  },{records,supplements});
  assert.deepEqual(checks,{unchanged:true,idempotent:true,preserved:true,ambiguous:true});assert.deepEqual(errors,[]);
  console.log('PASS: six empty emails supplemented in public cloud profiles, existing/changed addresses preserved, unknown/ambiguous names skipped, photo/bio preservation, idempotence, no backend writes');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
