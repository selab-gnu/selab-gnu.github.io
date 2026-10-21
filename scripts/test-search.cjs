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
  assert.equal(await page.locator('.hero,aside').count(),0);
  assert.deepEqual(await page.locator('nav[aria-label="Main navigation"] a').allTextContents(),['Home','Members','Publications']);
  await page.locator('#header-search').fill('object');await page.locator('header form button').click();
  await page.waitForFunction(()=>document.querySelector('#publication-result-count')?.textContent==='1편');
  assert.equal(await page.locator('#publication-search-list li').count(),1);
  assert.equal(await page.locator('#course-results,[data-search-scope]').count(),0);
  for(const width of [390,1440]){await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await page.locator('#publication-search-list h3 a').click();
  await page.waitForFunction(()=>document.querySelector('#result')?.textContent==='1 of 110 publications');
  assert(await page.evaluate(()=>!!document.querySelector(location.hash)));
  await page.goto('http://localhost:8129/search.html?q=ObJeCt');
  await page.waitForFunction(()=>document.querySelector('#publication-result-count')?.textContent==='1편');
  await page.locator('#site-query').fill('this-query-has-no-results');await page.locator('#site-search-form button').click();
  assert(await page.locator('#publication-no-results').isVisible());
  await page.locator('#site-query').fill('<img src=x onerror=alert(1)>');await page.locator('#site-search-form button').click();
  assert.equal(await page.locator('#search-summary img').count(),0);
  await page.locator('#site-query').fill('');await page.locator('#site-search-form button').click();
  assert(await page.locator('#search-results').isHidden());
  await page.addInitScript(()=>window.testGroups[0].items.unshift('New Author. <a href="https://example.org/paper">NewCloudOnlyPaper</a>. Test Journal (2026).'));
  await page.goto('http://localhost:8129/search.html?q=NewCloudOnlyPaper');
  await page.waitForFunction(()=>document.querySelector('#publication-result-count')?.textContent==='1편');
  await page.addInitScript(()=>{window.cloudFails=true;});
  await page.goto('http://localhost:8129/search.html?q=object');
  await page.waitForFunction(()=>document.querySelector('#search-data-status')?.textContent.includes('최신 공개 논문을 확인하지 못해'));
  assert.equal(await page.locator('#publication-search-list li').count(),1);
  assert.deepEqual(errors,[]);
  console.log('PASS: compact home, three navigation links, publication-only search, result anchors, empty/no-results/XSS, latest cloud paper, offline fallback, mobile/desktop widths');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
