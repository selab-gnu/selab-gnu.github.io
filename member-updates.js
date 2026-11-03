import {clean} from './content.js';
export const uicheonTopics=['Autonomous Flight','Deep Reinforcement Learning','3D CAD Automation','System/SW Safety Analysis','Aircraft Simulation'];
export const professorPhoto='/assets/people/seonah-lee.png';
const suppliedPhotos=[
 {name:/^(?:seonah\s+lee(?:,?\s*ph\.?d\.?)?|이선아(?:\s*교수)?)$/i,source:professorPhoto},
 {name:/^(?:seongjin\s+go|go\s+seongjin|고성진)$/i,source:'/assets/people/seongjin-go.jpg'},
 {name:/^(?:kajal\s+patel|patel\s+kajal|파텔\s*카잘)$/i,source:'/assets/people/kajal-patel.png'},
 {name:/^(?:uicheon\s+lee|lee\s+uicheon|이의천)$/i,source:'/assets/people/uicheon-lee.jpg'},
 {name:/^(?:jueun\s+heo|heo\s+jueun|허주은)$/i,source:'/assets/people/jueun-heo.jpg'},
 {name:/^(?:dongeun\s+lee|lee\s+dongeun|이동은)$/i,source:'/assets/people/dongeun-lee.jpg'},
 {name:/^(?:det\s+virak|virak\s+det|뎃\s*비락)$/i,source:'/assets/people/det-virak.jpg'},
 {name:/^(?:jia\s+shin|shin\s+jia|신지아)$/i,source:'/assets/people/jia-shin.jpeg'},
 {name:/^(?:seongwan\s+lim|lim\s+seongwan|임성완)$/i,source:'/assets/people/seongwan-lim.png'},
 {name:/^(?:gyutae\s+kim|kim\s+gyutae|김규태)$/i,source:'/assets/people/gyutae-kim.jpg'}
];
// This approved content correction is shared by the cloud reader and public renderer.
// It upgrades the old topic once; later administrator edits are preserved.
export function supplementMemberUpdates(profiles){return profiles.map(profile=>{
 let updated=profile;
 // Owner-confirmed former doctoral members belong in the graduate alumni list.
 if(profile.group==='current'&&/^(?:taehwan\s+kim|kim\s+taehwan|김태환|hyug\s+jang|jang\s+hyug|장혁)$/i.test(profile.name.replace(/\s+/g,' ').trim()))updated={...profile,group:'graduates',order:Math.max(0,...profiles.filter(p=>p.group==='graduates').map(p=>p.order||0))+1+profile.order};
 const supplied=suppliedPhotos.find(photo=>photo.name.test(profile.name.replace(/\s+/g,' ').trim()));
 if(supplied){
  const doc=new DOMParser().parseFromString(clean(profile.html),'text/html');
  if(!doc.querySelector('img,[data-profile-photo="none"]')){const img=doc.createElement('img');img.setAttribute('src',supplied.source);img.alt=profile.name+' 프로필 사진';img.loading='lazy';img.width=160;img.height=200;doc.body.prepend(img);updated={...profile,html:doc.body.innerHTML};}
 }
 if(!/^(?:uicheon\s*lee|이의천)$/i.test(profile.name.replace(/\s+/g,' ').trim()))return updated;
 const doc=new DOMParser().parseFromString(clean(updated.html),'text/html');
 const walker=doc.createTreeWalker(doc.body,NodeFilter.SHOW_TEXT);let node;
 while(node=walker.nextNode()){
  if(/Research Topic\s*:\s*Reinforcement Learning\s*$/i.test(node.textContent)){
   node.textContent=node.textContent.replace(/Reinforcement Learning\s*$/i,uicheonTopics.join(', '));
   return {...updated,html:doc.body.innerHTML};
  }
 }
 return updated;
});}
