// The supplied deck is summarized in tracked JSON; original personal files are never needed by CI.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/openlab.json'),'utf8'));
const mime={'.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.html':'text/html; charset=utf-8'};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.TEST_BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const screenshot=async name=>{if(!process.env.OPENLAB_SCREENSHOTS)return;fs.mkdirSync(process.env.OPENLAB_SCREENSHOTS,{recursive:true});if(name==='home')await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(process.env.OPENLAB_SCREENSHOTS,name+'.png'),fullPage:name==='home'});};
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.pathname==='/firebase-client.js'){await route.fulfill({contentType:'text/javascript',body:'export const contentRef={};export const getDoc=async()=>({exists:()=>false});'});return;}
  if(url.hostname==='www.gstatic.com'){await route.fulfill({contentType:'text/javascript',body:'export const collection=()=>({});export const getDocs=async()=>({docs:[]});'});return;}
  const file=path.join(root,url.pathname==='/'?'index.html':url.pathname);if(!fs.existsSync(file)){await route.fulfill({status:404,body:''});return;}
  await route.fulfill({contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
 });
 await page.goto('http://localhost:8137/index.html');await page.locator('#professor-introduction .professor-photo').waitFor();
 await page.locator('[data-language=ko]').click();
 for(const selector of ['.brand-logo','.home-full-logo','.professor-photo','footer img'])assert(await page.locator(selector).evaluate(img=>img.complete&&img.naturalWidth>0),selector);
 assert.equal(await page.locator('nav[aria-label="Main navigation"] a').count(),6);
 assert.equal(await page.locator('.research-area-card').count(),3);
 assert(!(await page.locator('#cloud-home').textContent()).includes('Wednesdays'));
 assert((await page.locator('#cloud-home').textContent()).includes('월요일'));
 await page.locator('.professor-history summary').click();assert((await page.locator('.professor-history').textContent()).includes('삼성전자'));
 await page.locator('.professor-history summary').click();await screenshot('home');
 await page.goto('http://localhost:8137/members.html');await page.waitForSelector('.member-faculty .member-portrait img');
 assert.equal(await page.locator('.member-faculty .member-portrait img').getAttribute('src'),'/assets/people/seonah-lee.png');
 assert(await page.locator('.member-faculty img').evaluate(img=>img.complete&&img.naturalWidth>0));await screenshot('members');
 const seongjin=page.locator('.member-profile').filter({has:page.locator('h3',{hasText:'Seongjin Go'})});
 assert.equal(await seongjin.locator('.member-portrait img').getAttribute('src'),'/assets/people/seongjin-go.jpg');
 assert(await seongjin.locator('.member-portrait img').evaluate(img=>img.complete&&img.naturalWidth>0));
 const kajal=page.locator('.member-profile[data-member-name="Patel Kajal"]');
 assert.equal(await kajal.locator('.member-portrait img').getAttribute('src'),'/assets/people/kajal-patel.png');
 assert(await kajal.locator('.member-portrait img').evaluate(img=>img.complete&&img.naturalWidth>0));
 const uicheon=page.locator('.member-profile').filter({has:page.locator('h3',{hasText:'Uicheon Lee'})});
 assert.equal(await uicheon.locator('.member-portrait img').getAttribute('src'),'/assets/people/uicheon-lee.jpg');
 assert(await uicheon.locator('.member-portrait img').evaluate(img=>img.complete&&img.naturalWidth>0));
 assert((await uicheon.locator('.member-topic').textContent()).includes('Aircraft Simulation'));
 for(const [name,file] of [['Jueun Heo','jueun-heo.jpg'],['Dongeun Lee','dongeun-lee.jpg'],['det virak','det-virak.jpg'],['Jia Shin','jia-shin.jpeg'],['Seongwan Lim','seongwan-lim.png'],['Gyutae Kim','gyutae-kim.jpg']]){
  const portrait=page.locator('.member-profile').filter({has:page.locator('h3',{hasText:name})}).locator('.member-portrait img');
  assert.equal(await portrait.getAttribute('src'),'/assets/people/'+file);
  await portrait.scrollIntoViewIfNeeded();assert(await portrait.evaluate(img=>img.complete&&img.naturalWidth>0),name);
 }
 const checks=await page.evaluate(async()=>{
  const {supplementMemberUpdates}=await import('/member-updates.js');const {withMemberPhoto}=await import('/admin/member-photo.js');const {clean,validPhotoSource}=await import('/content.js');
  const profile={name:'Seonah Lee, Ph.D',group:'current',html:'<strong>Seonah Lee</strong><p>Professor</p>'};const first=supplementMemberUpdates([profile])[0];const removed={...first,html:withMemberPhoto(first.html,'',profile.name)};const custom={...profile,html:withMemberPhoto(profile.html,'https://example.org/new.png',profile.name)};
  return {stable:supplementMemberUpdates([first])[0].html===first.html,removed:!supplementMemberUpdates([removed])[0].html.includes('<img'),custom:supplementMemberUpdates([custom])[0].html===custom.html,unsafe:validPhotoSource('/assets/people/../../other.png')||clean('<img src="/assets/private.png">').includes('<img')};
 });
 assert(checks.stable&&checks.removed&&checks.custom&&!checks.unsafe);
 await page.goto('http://localhost:8137/research.html');await page.waitForFunction(()=>document.querySelector('html').lang==='ko');
 assert.equal(await page.locator('main>h1').textContent(),'연구실 소개');
 assert.equal(await page.locator('.research-area-card').count(),3);assert.equal(await page.locator('.research-project').count(),8);assert.equal(await page.locator('.research-timeline li').count(),11);assert.equal(await page.locator('.award-year li').count(),17);
 assert.equal(data.awards.length,17);assert.equal(await page.locator('.award-year h3').first().textContent(),'2026');assert.equal(await page.locator('.award-year h3').last().textContent(),'2017');
 assert((await page.locator('#awards').textContent()).includes('일반부 대상'));
 await screenshot('research');await page.locator('#awards').evaluate(el=>el.scrollIntoView({block:'start'}));await screenshot('awards');
 await page.locator('[data-language=en]').click();assert.equal(await page.locator('main>h1').textContent(),'Research & Lab');assert((await page.locator('#awards').innerText()).includes('Grand Prize'));
 const links=await page.locator('.research-project a').evaluateAll(nodes=>nodes.map(a=>a.getAttribute('href')));
 for(const link of links){await page.goto('http://localhost:8137/'+link);await page.waitForFunction(()=>document.querySelectorAll('#publication-search-list li').length>0);assert.equal(await page.locator('#publication-search-list li').count(),1,link);}
 for(const width of [390,768,1440]){await page.setViewportSize({width,height:1100});for(const file of ['index.html','research.html','members.html','publications.html','news.html','gallery.html']){await page.goto('http://localhost:8137/'+file);await page.locator('.language-switch').waitFor();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),file+' at '+width);}}
 await page.setViewportSize({width:390,height:1000});await page.goto('http://localhost:8137/index.html');await page.locator('[data-language=ko]').click();await screenshot('mobile-home');
 assert.deepEqual(errors,[]);
 console.log('PASS: supplied logo assets, professor photo/default/custom/removal, bilingual research page, 3 areas, 8 linked studies, 11 milestones, 17 sourced awards, updated seminar, 390/768/1440 layouts, no browser errors or cloud writes.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
