// Local browser tests with mocked Firebase reads; no production requests/writes.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.TEST_BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const groups=JSON.parse(fs.readFileSync(path.join(root,'data/publications.json'),'utf8'));
  await page.addInitScript(groups=>{window.testGroups=groups;window.cloudFails=false;window.courseFails=false;},groups);
  await page.route('**/*',async route=>{
   const url=new URL(route.request().url());let body;
   if(url.pathname==='/firebase-client.js')body=`export const contentRef={};export const getDoc=async()=>{if(window.cloudFails)throw Error('offline');return {exists:()=>true,data:()=>({version:1,home:'',members:'',groups:window.testGroups})}};`;
   else{
    if(url.pathname==='/data/sections.json'&&await page.evaluate(()=>window.courseFails)){await route.fulfill({status:503,body:''});return;}
    const file=path.join(root,url.pathname==='/'?'index.html':url.pathname);
    if(!fs.existsSync(file)){await route.fulfill({status:404,body:''});return;}body=fs.readFileSync(file,'utf8');
   }
   await route.fulfill({contentType:url.pathname.endsWith('.js')?'text/javascript':url.pathname.endsWith('.css')?'text/css':url.pathname.endsWith('.json')?'application/json':'text/html; charset=utf-8',body});
  });
  await page.goto('http://localhost:8129/index.html');
  await page.locator('#header-search').fill('object');await page.locator('header form button').click();
  await page.waitForFunction(()=>document.querySelector('#scope-courses-count')?.textContent==='3');
  assert.equal(new URL(page.url()).pathname,'/search.html');
  assert.equal(await page.locator('#publication-search-list li').count(),1);
  assert.equal(await page.locator('#course-search-list li').count(),3);
  assert.equal(await page.locator('#header-search').inputValue(),'object');
  assert((await page.locator('#course-search-list').textContent()).includes('Software Architecture Design'));
  assert(await page.locator('#course-search-list mark').count()>0);
  await page.locator('[data-search-scope="courses"]').click();assert(await page.locator('#publication-results').isHidden());
  await page.locator('[data-search-scope="publications"]').click();assert(await page.locator('#course-results').isHidden());
  await page.locator('[data-search-scope="all"]').click();
  for(const width of [390,1440]){await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  if(process.env.TEST_SCREENSHOT)await page.screenshot({path:process.env.TEST_SCREENSHOT,fullPage:true});
  // A paper result opens the local publication with filtering and a valid anchor.
  await page.locator('#publication-search-list h3 a').click();
  await page.waitForFunction(()=>document.querySelector('#result')?.textContent==='1 of 110 publications');
  assert(await page.evaluate(()=>!!document.querySelector(location.hash)));
  await page.goBack();await page.locator('#course-search-list h3 a').first().click();assert(new URL(page.url()).pathname.startsWith('/courses-'));
  await page.goto('http://localhost:8129/search.html?q=ObJeCt');
  await page.waitForFunction(()=>document.querySelector('#scope-courses-count')?.textContent==='3');
  await page.locator('#site-query').fill('this-query-has-no-results');await page.locator('#site-search-form button').click();
  assert(await page.locator('#publication-no-results').isVisible());assert(await page.locator('#course-no-results').isVisible());
  await page.locator('#site-query').fill('<img src=x onerror=alert(1)>');await page.locator('#site-search-form button').click();
  assert.equal(await page.locator('#search-summary img').count(),0);
  await page.locator('#site-query').fill('');await page.locator('#site-search-form button').click();assert(await page.locator('#search-hint').isVisible());assert(await page.locator('#search-results').isHidden());
  // Latest cloud-only paper is searchable even though it is absent from JSON.
  await page.evaluate(()=>window.testGroups[0].items.unshift('New Author. <a href="https://example.org/paper">NewCloudOnlyPaper</a>. Test Journal (2026).'));
  await page.locator('#site-query').fill('NewCloudOnlyPaper');await page.locator('#site-search-form button').click();
  // Reload with a fixture override to exercise initialization from cloud data.
  await page.addInitScript(()=>window.testGroups[0].items.unshift('New Author. <a href="https://example.org/paper">NewCloudOnlyPaper</a>. Test Journal (2026).'));
  await page.goto('http://localhost:8129/search.html?q=NewCloudOnlyPaper');await page.waitForFunction(()=>document.querySelector('#scope-publications-count')?.textContent==='1');
  await page.addInitScript(()=>{window.cloudFails=true;});
  await page.goto('http://localhost:8129/search.html?q=object');await page.waitForFunction(()=>document.querySelector('#search-data-status')?.textContent.includes('최신 공개 논문을 확인하지 못해'));
  assert.equal(await page.locator('#publication-search-list li').count(),1);assert.equal(await page.locator('#course-search-list li').count(),3);
  await page.addInitScript(()=>{window.courseFails=true;window.cloudFails=false;});
  await page.goto('http://localhost:8129/search.html?q=object');await page.waitForFunction(()=>document.querySelector('#search-data-status')?.textContent.includes('강의 자료를 불러오지 못'));
  assert.equal(await page.locator('#publication-search-list li').count(),1);
  assert.deepEqual(errors,[]);
  console.log('PASS: global search navigation, object = 1 paper + 3 courses, scope filters, snippets/highlights, valid result links, dedicated paper search, case/empty/no-result/XSS input, latest cloud paper, independent source failures, mobile/desktop widths');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
