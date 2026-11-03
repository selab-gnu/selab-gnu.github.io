import {clean} from './content.js';
export const uicheonTopics=['Autonomous Flight','Deep Reinforcement Learning','3D CAD Automation','System/SW Safety Analysis','Aircraft Simulation'];
export const professorPhoto='/assets/people/seonah-lee.png';
const suppliedPhotos=[
 {name:/^(?:seonah\s+lee(?:,?\s*ph\.?d\.?)?|이선아(?:\s*교수)?)$/i,source:professorPhoto},
 {name:/^(?:seongjin\s+go|go\s+seongjin|고성진)$/i,source:'/assets/people/seongjin-go.jpg'},
 {name:/^(?:kajal\s+patel|patel\s+kajal|파텔\s*카잘)$/i,source:'/assets/people/kajal-patel.png'},
 {name:/^(?:uicheon\s+lee|lee\s+uicheon|이의천)$/i,source:'/assets/people/uicheon-lee.jpg'}
];
// This approved content correction is shared by the cloud reader and public renderer.
// It upgrades the old topic once; later administrator edits are preserved.
export function supplementMemberUpdates(profiles){return profiles.map(profile=>{
 let updated=profile;
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
