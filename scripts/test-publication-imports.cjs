// All requests are served from local fixtures. No production Firebase writes.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
 const groups=JSON.parse(fs.readFileSync(path.join(root,'data/publications.json'),'utf8'));
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'data/publication-imports.json'),'utf8'));
 const entries=manifest.batches.flatMap(batch=>batch.entries),importedHTML=new Set(entries.map(entry=>entry.html));
 const old=groups.map(({publicationImports,...group})=>({...group,items:group.items.filter(html=>!importedHTML.has(html))}));
 assert.equal(entries.length,29);assert.equal(groups.reduce((n,g)=>n+g.items.length,0),139);
 assert.equal(old.reduce((n,g)=>n+g.items.length,0),110);
 const browser=await chromium.launch({headless:true,executablePath:process.env.TEST_BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(groups=>window.importFixture={version:1,home:'<p>Cloud homepage</p>',members:'<p>Cloud members</p>',groups,revision:200},old);
  await page.route('**/*',async route=>{
   const url=new URL(route.request().url());let body;
   if(url.pathname==='/firebase-client.js')body=`export const contentRef={};export const getDoc=async()=>({exists:()=>true,data:()=>window.importFixture});`;
   else{
    const file=path.join(root,url.pathname==='/'?'index.html':url.pathname);
    if(!fs.existsSync(file)){await route.fulfill({status:404,body:''});return;}
    body=fs.readFileSync(file,'utf8');
   }
   await route.fulfill({body,contentType:url.pathname.endsWith('.js')?'text/javascript':url.pathname.endsWith('.css')?'text/css':url.pathname.endsWith('.json')?'application/json':'text/html; charset=utf-8'});
  });
  await page.goto('http://localhost:8129/publications.html');
  await page.waitForFunction(()=>document.querySelectorAll('.publications .paper-tags').length===139);
  const checks=await page.evaluate(async({old,groups,manifest})=>{
   const {publicationDate,sortPublicationGroups}=await import('/publication-tags.js');
   const {mergePublicationImports}=await import('/publication-imports.js');
   const before=JSON.stringify(old),first=mergePublicationImports(old,manifest),second=mergePublicationImports(first.groups,manifest);
   const deleted=structuredClone(first.groups),item=manifest.batches[0].entries[0];
   const group=deleted.find(g=>g.category===item.category);group.items=group.items.filter(html=>html!==item.html);
   const afterDelete=mergePublicationImports(deleted,manifest);
   const modified=structuredClone(first.groups),target=modified.find(g=>g.category===item.category);
   target.items[target.items.indexOf(item.html)]=item.html.replace(item.title,'Admin revised title');
   const afterEdit=mergePublicationImports(modified,manifest);
   const already=structuredClone(old);already.find(g=>g.category===item.category).items.push(item.html);
   const duplicate=mergePublicationImports(already,manifest);
   const sortedReverse=sortPublicationGroups(groups.map(group=>({...group,items:[...group.items].reverse()})));
   const dateOrders=sortedReverse.map(group=>group.items.map(html=>publicationDate(html)));
   const awardPaper=groups[0].items.find(html=>html.includes('FANET Routing'));
   const missingYearPapers=groups[2].items.filter(html=>{const text=new DOMParser().parseFromString(html,'text/html').body.textContent.replace(/\s+/g,' ').toLowerCase();return text.includes('a code recommendation method using rnn')||text.includes('a spreadsheet application');});
   return {dateOrders,awardDate:publicationDate(awardPaper),inferredDates:missingYearPapers.map(html=>publicationDate(html)),first,second,unchanged:before===JSON.stringify(old),afterDelete,afterEdit,duplicate,expected:groups};
  },{old,groups,manifest});
  assert.equal(checks.awardDate,'2023');assert.deepEqual(checks.inferredDates,['2018','2018']);
  for(const order of checks.dateOrders){const keys=order.map(date=>date.split('-').map(Number).concat([0,0]).slice(0,3).map(n=>String(n).padStart(4,'0')).join(''));assert(keys.every((key,i)=>i===0||keys[i-1]>=key),'Newest-first publication dates');}
  assert.equal(checks.first.added,29);assert(checks.first.pending);assert(checks.unchanged);
  assert.deepEqual(checks.first.groups,groups,'Repository and old-cloud merge must produce identical citation order');
  assert.equal(checks.second.added,0);assert.equal(checks.second.pending,false);
  assert.equal(checks.afterDelete.added,0);assert.equal(checks.afterDelete.groups.reduce((n,g)=>n+g.items.length,0),138);
  assert.equal(checks.afterEdit.added,0);assert(checks.afterEdit.groups.some(g=>g.items.some(html=>html.includes('Admin revised title'))));
  assert.equal(checks.duplicate.added,28);assert.equal(checks.duplicate.groups.reduce((n,g)=>n+g.items.length,0),139);
  const citations=await page.locator('.publications .paper-citation').allTextContents();
  assert.equal(citations.length,139);
  for(const entry of entries)assert.equal(citations.filter(cite=>cite.includes(entry.title)).length,1,entry.title);
  for(const html of old.flatMap(g=>g.items))assert(groups.some(g=>g.items.includes(html)),'All old citations must remain byte-for-byte intact');
  const first=entries[0];
  await page.goto('http://localhost:8129/search.html?q='+encodeURIComponent(first.title));
  await page.waitForFunction(()=>document.querySelector('#search-data-status').textContent.includes('공개 저장된 최신'));
  assert.equal(await page.locator('#publication-search-list li').count(),1);
  const link=await page.locator('#publication-search-list h3 a').getAttribute('href');
  await page.locator('#publication-search-list h3 a').click();
  await page.waitForFunction(()=>document.querySelectorAll('.publications .paper-tags').length===139);
  assert((await page.locator(link.slice(link.indexOf('#'))).textContent()).includes(first.title),'Search anchors must identify the same merged paper');
  await page.addInitScript(groups=>window.importFixture.groups=groups,checks.afterDelete.groups);
  await page.goto('http://localhost:8129/publications.html');
  await page.waitForFunction(()=>document.querySelectorAll('.publications .paper-tags').length===138);
  assert(!(await page.locator('.publications').allTextContents()).join(' ').includes(first.title),'A saved deletion must not be resurrected');
  for(const width of [390,1440]){await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  assert.deepEqual(errors,[]);
  console.log('PASS: 29 additions, 139 total, unchanged old citations, old cloud merge at arbitrary revision, stable ordering/anchors, idempotence, pre-existing deduplication, saved edit/deletion protection, desktop/mobile');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
