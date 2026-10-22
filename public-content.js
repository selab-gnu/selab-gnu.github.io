import { renderProfiles } from './member-profiles.js';
import { clean, validContent } from './content.js';
if (document.querySelector('#cloud-home, .page-members .imported-content, .publication-group')) {
 try {
  const { contentRef, getDoc } = await import('./firebase-client.js');
  const snap = await getDoc(contentRef);
  if (snap.exists()) {
   const d = snap.data();
   if (!validContent(d)) throw Error('Invalid content');
   const home = document.querySelector('#cloud-home');
   const members = document.querySelector('.page-members .imported-content');
   if (home) home.innerHTML = clean(d.home);
   if (members) {
     if (d.memberDirectoryVersion===1) {
      const { readProfiles } = await import('./admin/member-store.js');
      const profiles=await readProfiles();
      members.innerHTML=renderProfiles(profiles);
      const added=new URLSearchParams(location.search).get('added');
      const profile=profiles.find(record=>record.id===added);
      if(profile){
        const card=document.getElementById('member-'+profile.id);
        const notice=document.createElement('p');notice.className='member-registration-status';notice.setAttribute('role','status');notice.textContent=profile.name+' 멤버가 등록되었습니다.';
        card.prepend(notice);card.classList.add('member-just-added');card.scrollIntoView({block:'center'});
      }
     } else members.innerHTML=clean(d.members);
   }
   if (document.querySelector('.publication-group')) {
    d.groups.forEach((g,i)=>{
     const section = document.querySelector('#category-'+i);
     section.querySelector('h2').textContent=g.category;
     const ul=section.querySelector('ul');ul.replaceChildren();
     for(const [j,html] of g.items.entries()){const li=document.createElement('li');li.id='publication-'+i+'-'+j;li.innerHTML=clean(html);ul.append(li);}
     document.querySelector('.category-links a[href="#category-'+i+'"]').textContent=g.category;
    });
    document.dispatchEvent(new Event('content-updated'));
   }
  }
 } catch(e) {
   console.warn('Cloud content unavailable; showing repository content.', e.code || e.message);
   if(document.querySelector('.page-members .imported-content')&&new URLSearchParams(location.search).has('added')){
     const notice=document.createElement('p');notice.setAttribute('role','alert');notice.textContent='최신 멤버 정보를 불러오지 못했습니다. 잠시 후 새로고침해 등록한 소개를 확인해주세요.';
     document.querySelector('.page-members .imported-content').prepend(notice);
   }
 }
}
