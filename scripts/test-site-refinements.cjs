// Public UI tests use isolated browser storage and mocked Firebase; no cloud writes.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const shot=async(page,name)=>{if(process.env.REFINEMENTS_SCREENSHOTS){fs.mkdirSync(process.env.REFINEMENTS_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.REFINEMENTS_SCREENSHOTS,name+'.png'),fullPage:['home','news'].includes(name)});}};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.TEST_BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.pathname==='/firebase-client.js'){await route.fulfill({contentType:'text/javascript',body:'export const contentRef={};export const getDoc=async()=>({exists:()=>false});'});return;}
  if(url.hostname==='www.gstatic.com'){await route.fulfill({contentType:'text/javascript',body:'export const collection=()=>({});export const getDocs=async()=>({docs:[]});'});return;}
  const file=path.join(root,url.pathname==='/'?'index.html':url.pathname);
  if(!fs.existsSync(file)){await route.fulfill({status:404,body:''});return;}
  const type=url.pathname.endsWith('.js')?'text/javascript':url.pathname.endsWith('.css')?'text/css':url.pathname.endsWith('.json')?'application/json':'text/html; charset=utf-8';
  await route.fulfill({contentType:type,body:fs.readFileSync(file)});
 });
 await page.goto('http://localhost:8137/publications.html');await page.waitForSelector('#filter-author option:nth-child(2)',{state:'attached'});
 if(process.env.AUDIT_PUBLICATIONS)console.log(JSON.stringify(await page.evaluate(async()=>{const {citationMetadata}=await import('/publication-filters.js');const rows=[...document.querySelectorAll('.paper-citation')].map(e=>({text:e.textContent,...citationMetadata(e.innerHTML)}));return {authors:[...new Set(rows.flatMap(r=>r.authors))].sort(),venues:[...new Set(rows.map(r=>r.venue))].sort(),missing:rows.filter(r=>!r.authors.length||!r.venue||r.authors.some(a=>/^(?:&|Ahn$|Cho$|Kim$|Lee$|Seonah$|Sungwon$|Jaejun$|Jongsun$|Heetae$|[A-Z]\. [A-Z]$)|요구사항 추적성 관점/.test(a)))};}),null,2));
 const total=await page.locator('.publications li').count();assert.equal(total,139);
 const metadata=await page.evaluate(async()=>{const {citationMetadata}=await import('/publication-filters.js');return [...document.querySelectorAll('.paper-citation')].map(e=>citationMetadata(e.innerHTML));});
 assert(metadata.every(p=>p.authors.length&&p.venue&&p.year),'Every existing paper has usable facets');
 assert(!metadata.some(p=>p.authors.some(name=>/^(?:Ahn|Cho|Lee|Kim|Seonah|Sungwon|& Kim)$/.test(name))),'No split surname/given-name fragments');
 const topicUpgrade=await page.evaluate(async()=>{const {supplementMemberUpdates}=await import('/member-updates.js');const old={name:'Uicheon Lee',html:'<p>Research Topic: Reinforcement Learning</p>'};const first=supplementMemberUpdates([old]);const changed={...old,html:'<p>Research Topic: Future topic</p>'};return {updated:first[0].html,stable:JSON.stringify(first)===JSON.stringify(supplementMemberUpdates(first)),preserved:supplementMemberUpdates([changed])[0].html===changed.html};});
 assert(topicUpgrade.updated.includes('Aircraft Simulation')&&topicUpgrade.stable&&topicUpgrade.preserved);
 await page.locator('#filter-year').selectOption('2025');
 const yearVisible=await page.locator('.publications li:visible').count();assert(yearVisible>0&&yearVisible<total);
 await page.locator('#filter-author').selectOption('Uicheon Lee / 이의천');
 const combined=await page.locator('.publications li:visible').count();assert(combined>0&&combined<=yearVisible);
 await page.locator('#filter-venue').selectOption('Drones');assert.equal(await page.locator('.publications li:visible').count(),1);
 await page.locator('[data-language=ko]').click();assert((await page.locator('#publication-filter-summary').textContent()).includes('1편'));
 assert.equal(await page.locator('#filter-author').inputValue(),'Uicheon Lee / 이의천');
 assert((await page.locator('.category-links').textContent()).includes('국제학술지 (1 /'));
 await page.reload();await page.waitForSelector('#filter-author option:nth-child(2)',{state:'attached'});assert.equal(await page.locator('#filter-venue').inputValue(),'Drones');assert.equal(await page.locator('html').getAttribute('lang'),'ko');
 await page.locator('#filter-year').selectOption('2001');assert.equal(await page.locator('#publication-filter-empty').isVisible(),true);
 await page.locator('#publication-filter-reset').click();assert.equal(await page.locator('.publications li:visible').count(),total);
 await shot(page,'publications');
 await page.goto('http://localhost:8137/members.html');await page.waitForSelector('.member-grid');
 assert((await page.locator('.member-group-heading').allTextContents()).slice(0,4).join('|')==='교수|박사과정|석사과정|학부연구생');
 assert((await page.locator('.member-profile').first().textContent()).includes('Seonah Lee'));
 const studentGrids=page.locator('.member-grid');assert((await studentGrids.nth(1).evaluate(el=>getComputedStyle(el).gridTemplateColumns)).split(' ').length===3);
 const uicheon=page.locator('.member-profile').filter({has:page.locator('h3',{hasText:'Uicheon'})});
 const topics=await uicheon.locator('.member-topic').textContent();for(const topic of ['Autonomous Flight','Deep Reinforcement Learning','3D CAD Automation','System/SW Safety Analysis','Aircraft Simulation'])assert(topics.includes(topic));
 assert(!(await page.locator('.member-grid').allTextContents()).join('').toLowerCase().includes('part-time'));
 assert.equal(await page.locator('.member-profile').count(),await page.locator('.member-portrait').count());
 await shot(page,'members');
 await page.setViewportSize({width:390,height:844});assert((await studentGrids.nth(1).evaluate(el=>getComputedStyle(el).gridTemplateColumns)).split(' ').length===1);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await shot(page,'members-mobile');await page.setViewportSize({width:1440,height:1100});
 await page.goto('http://localhost:8137/news.html');await page.waitForSelector('.news-source');assert.equal(await page.locator('.news-card').count(),6);
 assert((await page.locator('.news-card').first().textContent()).includes('신지아'));
 await shot(page,'news');await page.locator('[data-language=en]').click();assert((await page.locator('.news-card').first().textContent()).includes('Jia Shin'));
 await page.goto('http://localhost:8137/index.html');await page.waitForSelector('#professor-introduction h2');assert.equal(await page.locator('html').getAttribute('lang'),'en');assert((await page.locator('#professor-introduction').textContent()).includes('Seonah Lee'));
 assert.equal(await page.locator('#cloud-home .home-introduction').count(),1);
 await page.locator('[data-language=ko]').click();assert((await page.locator('#professor-introduction').textContent()).includes('이선아'));
 await shot(page,'home');
 assert.deepEqual(errors,[]);
 console.log('PASS: 139 publications, combined filters/counts/reset/deep links, language persistence, degree order, faculty pinned, approved topics, responsive cards, 6 sourced bilingual news items, professor introduction.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
