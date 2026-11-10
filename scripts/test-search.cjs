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
  const paperCount=groups.reduce((n,g)=>n+g.items.length,0);
  await page.addInitScript(groups=>{window.testGroups=groups;window.cloudFails=false;window.courseFails=false;},groups);
  await page.route('**/*',async route=>{
   const url=new URL(route.request().url());let body;
   if(url.pathname.endsWith('/firebase-firestore.js'))body='export const collection=()=>({});export const getDocs=async()=>({docs:[]});';
   else if(url.pathname==='/firebase-client.js')body=`export const contentRef={};export const getDoc=async()=>{if(window.cloudFails)throw Error('offline');return {exists:()=>true,data:()=>({version:1,home:'',members:'',groups:window.testGroups})}};`;
   else{
    if(url.pathname==='/data/sections.json'&&await page.evaluate(()=>window.courseFails)){await route.fulfill({status:503,body:''});return;}
    const file=path.join(root,url.pathname==='/'?'index.html':url.pathname);
    if(!fs.existsSync(file)){await route.fulfill({status:404,body:''});return;}body=fs.readFileSync(file);
   }
   await route.fulfill({contentType:url.pathname.endsWith('.png')?'image/png':url.pathname.endsWith('.js')?'text/javascript':url.pathname.endsWith('.css')?'text/css':url.pathname.endsWith('.json')?'application/json':'text/html; charset=utf-8',body});
  });
  for(const [path,title] of [['news.html','News'],['gallery.html','Gallery']]){
    await page.goto('http://localhost:8129/'+path);
    assert.equal(await page.locator('h1').textContent(),title);
    assert.equal(await page.locator('nav a[aria-current="page"]').textContent(),title);
    assert.equal(await page.locator('#collection-items').count(),1);
  }
  await page.goto('http://localhost:8129/index.html');
  assert.equal(await page.locator('.hero,aside').count(),0);
  assert.deepEqual(await page.locator('nav[aria-label="Main navigation"] a').allTextContents(),['Home','Research & Lab','Members','Publications','News','Gallery']);
  await page.locator('[data-language="ko"]').click();
  assert.equal(await page.locator('header form').getAttribute('action'),'site-search.html');await page.goto('http://localhost:8129/search.html?q=object&lang=ko');
  await page.waitForFunction(()=>document.querySelector('#publication-result-count')?.textContent==='1편');
  assert.equal(await page.locator('#publication-search-list li').count(),1);
  assert.equal(await page.locator('#course-results,[data-search-scope]').count(),0);
  for(const width of [390,1440]){await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await page.locator('#publication-search-list h3 a').click();
  await page.waitForFunction(n=>document.querySelectorAll('.publications li').length===n,paperCount);
  await page.locator('#publication-text-query').waitFor();assert.equal(await page.locator('main input[type=search]').count(),1);
  await page.locator('#publication-text-query').fill('zzzz-no-matching-publication');assert.equal(await page.locator('.publications li:not([hidden])').count(),0);await page.locator('#publication-text-query').fill('');await page.locator('.publication-advanced summary').click();assert(await page.locator('#filter-year').isVisible());
  assert.equal(await page.locator('.publications li[hidden]').count(),0);
  assert.equal(await page.locator('header input[type=search]').count(),1);
  assert(await page.evaluate(()=>!!document.querySelector(location.hash)));
  await page.waitForFunction(n=>document.querySelectorAll('.publications .paper-tags').length===n,paperCount);
  assert.equal(await page.locator('.publications .tag-unclassified').count(),0);
  if(process.env.TEST_PUBLICATIONS_SCREENSHOT)await page.screenshot({path:process.env.TEST_PUBLICATIONS_SCREENSHOT});
  const tagData=JSON.parse(fs.readFileSync(path.join(root,'data/publication-tags.json'),'utf8'));
  const tagged=new Map(tagData.entries.map(entry=>[entry.html,entry.tags]));
  const tagsFor=html=>html.match(/data-paper-tags="([^"]*)"/)?.[1].split(' ')||tagged.get(html)||[];
  const allPapers=groups.flatMap(g=>g.items);
  await page.goto('http://localhost:8129/search.html?tag=AI');
  await page.waitForFunction(n=>document.querySelector('#publication-result-count')?.textContent===n+'편',allPapers.filter(html=>tagsFor(html).includes('AI')).length);
  assert.equal(await page.locator('#research-filter').inputValue(),'AI');
  await page.locator('#publication-type-filter').selectOption('international-journals');
  const expectedAIJournals=groups[0].items.filter(html=>tagsFor(html).includes('AI')).length;
  assert.equal(await page.locator('#publication-search-list li').count(),expectedAIJournals);
  assert.equal(new URL(page.url()).searchParams.get('type'),'international-journals');
  if(process.env.TEST_TAGS_SEARCH_SCREENSHOT)await page.screenshot({path:process.env.TEST_TAGS_SEARCH_SCREENSHOT});
  await page.reload();await page.waitForFunction(n=>document.querySelector('#publication-search-list').children.length===n,expectedAIJournals);
  await page.locator('#research-filter').selectOption('AERO');
  const expectedAeroJournals=groups[0].items.filter(html=>tagsFor(html).includes('AERO')).length;
  assert.equal(await page.locator('#publication-search-list li').count(),expectedAeroJournals);
  await page.goBack();assert.equal(await page.locator('#research-filter').inputValue(),'AI');
  await page.locator('#reset-search-filters').click();assert(await page.locator('#search-results').isHidden());
  await page.locator('#research-filter').selectOption('unclassified');assert.equal(await page.locator('#publication-search-list li').count(),0);assert(await page.locator('#publication-no-results').isVisible());
  await page.locator('#research-filter').selectOption('AERO');await page.locator('#site-query').fill('An MCP Tool');await page.locator('#site-search-form button').click();
  assert(await page.locator('#publication-no-results').isVisible());
  await page.locator('#site-query').fill('');await page.locator('#site-search-form button').click();
  assert.equal(await page.locator('#publication-search-list li').count(),allPapers.filter(html=>tagsFor(html).includes('AERO')).length);
  for(const width of [390,1440]){await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  const tagsSafe=await page.evaluate(async()=>{
    const tags=await import('/publication-tags.js');const {clean}=await import('/content.js');
    const explicit=tags.withPaperTags('<a href="https://example.org">Title</a>',['AI','SE','AI','BAD']);
    return {selected:tags.paperTags(explicit),empty:tags.paperTags(tags.withPaperTags(window.testGroups[0].items[0],[])),safe:clean('<span data-paper-tags="AI" onclick="alert(1)">Safe</span><span data-paper-tags="BAD">Bad</span>')};
  });
  assert.deepEqual(tagsSafe.selected,['SE','AI']);assert.deepEqual(tagsSafe.empty,[]);
  assert(!tagsSafe.safe.includes('onclick')&&!tagsSafe.safe.includes('data-paper-tags="BAD"'));
  await page.goto('http://localhost:8129/search.html?q=ObJeCt');
  await page.waitForFunction(()=>document.querySelector('#publication-result-count')?.textContent==='1편');
  await page.locator('#site-query').fill('this-query-has-no-results');await page.locator('#site-search-form button').click();
  assert(await page.locator('#publication-no-results').isVisible());
  await page.locator('#site-query').fill('<img src=x onerror=alert(1)>');await page.locator('#site-search-form button').click();
  assert.equal(await page.locator('#search-summary img').count(),0);
  await page.locator('#site-query').fill('');await page.locator('#site-search-form button').click();
  assert(await page.locator('#search-results').isHidden());
  await page.addInitScript(()=>window.testGroups[0].items.unshift('<span data-paper-tags="AI AERO">New Author. <a href="https://example.org/paper">NewCloudOnlyPaper</a>. Test Journal (2026).</span>'));
  await page.goto('http://localhost:8129/search.html?q=NewCloudOnlyPaper');
  await page.waitForFunction(()=>document.querySelector('#publication-result-count')?.textContent==='1편');
  assert.equal(await page.locator('#publication-search-list .tag-ai').count(),1);
  assert.equal(await page.locator('#publication-search-list .tag-aero').count(),1);
  await page.locator('#research-filter').selectOption('AI');assert.equal(await page.locator('#publication-search-list li').count(),1);
  await page.locator('#research-filter').selectOption('SE');assert(await page.locator('#publication-no-results').isVisible());
  await page.addInitScript(()=>{window.cloudFails=true;});
  await page.goto('http://localhost:8129/search.html?q=object');
  await page.waitForFunction(()=>document.querySelector('#search-data-status')?.textContent.includes('최신 공개 논문을 확인하지 못해'));
  assert.equal(await page.locator('#publication-search-list li').count(),1);
  for(const [i,type] of ['international-journals','international-conferences','domestic-journals','domestic-conferences'].entries()){await page.goto('http://localhost:8137/publications.html?lang=ko');await page.locator('.category-links a[data-category-index="'+i+'"]').click();await page.waitForFunction(()=>document.querySelectorAll('#publication-search-list li').length>0);assert.equal(new URL(page.url()).searchParams.get('type'),type);assert.equal(await page.locator('#publication-type-filter').inputValue(),type);assert.equal(new URL(page.url()).searchParams.get('lang'),'ko');}
  assert.deepEqual(errors,[]);
  console.log('PASS: compact home, six navigation links, publication-only search, result anchors, empty/no-results/XSS, latest cloud paper tags, SE/AI/AERO and publication type filters, unclassified/empty intersections, URL persistence/back, safe metadata, offline fallback, mobile/desktop widths');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
