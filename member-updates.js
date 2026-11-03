import {clean} from './content.js';
export const uicheonTopics=['Autonomous Flight','Deep Reinforcement Learning','3D CAD Automation','System/SW Safety Analysis','Aircraft Simulation'];
// This approved content correction is shared by the cloud reader and public renderer.
// It upgrades the old topic once; later administrator edits are preserved.
export function supplementMemberUpdates(profiles){return profiles.map(profile=>{
 if(!/^(?:uicheon\s*lee|이의천)$/i.test(profile.name.replace(/\s+/g,' ').trim()))return profile;
 const doc=new DOMParser().parseFromString(clean(profile.html),'text/html');
 const walker=doc.createTreeWalker(doc.body,NodeFilter.SHOW_TEXT);let node;
 while(node=walker.nextNode()){
  if(/Research Topic\s*:\s*Reinforcement Learning\s*$/i.test(node.textContent)){
   node.textContent=node.textContent.replace(/Reinforcement Learning\s*$/i,uicheonTopics.join(', '));
   return {...profile,html:doc.body.innerHTML};
  }
 }
 return profile;
});}
