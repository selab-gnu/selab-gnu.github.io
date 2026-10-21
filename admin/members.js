import { clean } from '../content.js';
import { memberGroups, profileHTML, splitLegacyMembers } from '../member-profiles.js';
import { formatMember } from './member-format.js';
import { canEdit, getOwnMemberId } from './auth.js';
import { readProfiles, readProfile, migrateProfiles, saveProfile, deleteProfile } from './member-store.js';

const $=s=>document.querySelector(s);
const keys=['name','degree','role','department','institution','room','address','email','phone','homepage','topic','bio'];
export function setupMembers({message,refreshPreview,onMigration,getRevision}) {
  let records=[], selected=null, own=null, migration=[], ready=false, pending=false, ownPending=false, busy=false, generation=0, sourceContent=null, sourceRevision=0;
  const newFields=()=>Object.fromEntries(keys.map(key=>[key,$('#member-'+key).value.trim()]));
  const hasNew=()=>Object.values(newFields()).some(Boolean);
  const draft=()=>selected?{...selected,html:clean($('#member-edit-body').innerHTML),bio:$('#member-edit-bio').value,name:$('#member-edit-name').value.trim(),group:$('#member-edit-group').value}:null;
  function fillGroups(select){select.replaceChildren();for(const [key,name] of Object.entries(memberGroups)){const o=document.createElement('option');o.value=key;o.textContent=name;select.append(o);}}
  fillGroups($('#member-edit-group'));fillGroups($('#member-group'));
  function roleOptions(){const select=$('#role-member');const old=select.value;select.replaceChildren(new Option('멤버 연결 안 함',''));for(const record of records.filter(r=>r.revision>0))select.append(new Option(record.name+' · '+memberGroups[record.group],record.id));select.value=old;}
  function list(){$('#member-summary').textContent=records.length+'명 · 전체 멤버 추가·수정·삭제 가능';const q=$('#member-search').value.toLocaleLowerCase();const box=$('#member-list');box.replaceChildren();for(const record of records.filter(r=>r.name.toLocaleLowerCase().includes(q)).sort((a,b)=>a.order-b.order)){const b=document.createElement('button');b.type='button';b.textContent=record.name+' · '+memberGroups[record.group];b.classList.toggle('selected',selected?.id===record.id);b.onclick=()=>{if(!discard())return;selected=record;$('#member-new-card').hidden=true;show();};box.append(b);}if(!box.children.length)box.textContent='등록된 멤버 또는 검색 결과가 없습니다.';roleOptions();}
  function show(){$('#member-directory .member-layout').hidden=false;const editing=!!selected;$('#member-detail').hidden=!editing;if(editing){$('#member-edit-name').value=selected.name;$('#member-edit-group').value=selected.group;$('#member-edit-body').innerHTML=clean(selected.html);$('#member-edit-bio').value=selected.bio;}list();refreshPreview();}
  function discard(){if((pending||hasNew())&&!confirm('저장하지 않은 멤버 수정을 버릴까요?'))return false;pending=false;$('#member-form').reset();return true;}
  function newPreview(){try{$('#new-member-preview').innerHTML=hasNew()?clean(profileHTML({html:formatMember({...newFields(),bio:''}),bio:newFields().bio})):'이름과 직무·과정을 입력하면 소개를 확인할 수 있습니다.';}catch(e){$('#new-member-preview').textContent=e.message;}}
  function clear(){generation++;records=[];selected=null;own=null;migration=[];ready=false;pending=false;ownPending=false;busy=false;$('#member-form').reset();$('#my-bio').value='';$('#my-profile-content').replaceChildren();$('#member-list').replaceChildren();$('#member-detail').hidden=true;$('#member-new-card').hidden=true;$('#my-profile-editor').hidden=true;roleOptions();}
  async function load(content,revision){clear();const token=generation;const managing=canEdit('members');sourceContent=structuredClone(content);sourceRevision=revision;ready=content.memberDirectoryVersion===1;$('#member-migration').hidden=!managing||ready;$('#member-directory').hidden=!managing;$('#member-new-card').hidden=true;
    if(managing){
      if(ready){const loaded=await readProfiles();if(token!==generation)return;records=loaded;selected=records[0]||null;show();}
      else {migration=splitLegacyMembers(content.members);records=migration;selected=records[0]||null;show();$('#member-migration-count').textContent=migration.length+'명의 소개를 멤버별로 나눴습니다. 기존 링크와 내용은 유지합니다.';$('#member-migration-preview').innerHTML=migration.map(r=>'<h3>'+memberGroups[r.group]+'</h3>'+profileHTML(r)+'<hr>').join('');}
    }
    const ownId=getOwnMemberId();
    if(ownId){const loaded=await readProfile(ownId);if(token!==generation)return;own=loaded;$('#my-profile-editor').hidden=!own;$('#my-profile-status').textContent=own?'이름·직무·연락처는 관리자가 관리합니다. 본인은 자기소개만 수정할 수 있습니다.':'연결된 멤버를 찾을 수 없습니다. 관리자에게 연결 변경을 요청해주세요.';if(own){$('#my-profile-name').textContent=own.name;$('#my-profile-content').innerHTML=clean(own.html);$('#my-bio').value=own.bio;}}
    $('#migrate-members').onclick=()=>perform(async()=>{if(pending||hasNew())throw Error('입력 중인 멤버를 먼저 저장해주세요.');if(!confirm('미리보기의 '+migration.length+'명을 멤버별 관리로 전환하고 공개 저장할까요?'))return;const next=await migrateProfiles(records,getRevision?.()??sourceRevision,sourceContent);onMigration(next);await load({...content,memberDirectoryVersion:1},next);message('멤버별 관리로 전환했습니다.');});
  }
  function migrationNotice(){return ready?'':' 기존 소개를 보존하면서 멤버별 관리로 전환합니다.';}
  async function persistInitial(nextRecords,focusId){
    const next=await migrateProfiles(nextRecords,getRevision?.()??sourceRevision,sourceContent);
    onMigration(next);
    const content={...sourceContent,memberDirectoryVersion:1};
    await load(content,next);
    if(focusId)selected=records.find(r=>r.id===focusId)||records[0]||null;
    $('#member-new-card').hidden=true;pending=false;show();
  }
  async function perform(action){if(busy)return;busy=true;$('#members').inert=true;$('#my-profile').inert=true;try{await action();}catch(e){message(e.code==='permission-denied'||e.message==='permission-denied'?'저장 권한이 없습니다. 관리자 계정과 최신 Firestore 규칙 게시 여부를 확인해주세요. 작성한 내용은 유지됩니다.':(e.message||e.code));}finally{busy=false;$('#members').inert=false;$('#my-profile').inert=false;}}
  $('#member-search').oninput=list;
  $('#new-member').onclick=()=>{if(!canEdit('members')||!discard())return;selected=null;$('#member-detail').hidden=true;$('#member-directory .member-layout').hidden=true;$('#member-new-card').hidden=false;list();newPreview();refreshPreview();$('#member-name').focus();};
  $('#member-cancel').onclick=()=>{if(!discard())return;$('#member-new-card').hidden=true;selected=records[0]||null;show();};
  $('#member-form').onsubmit=e=>{e.preventDefault();if(!canEdit('members')||!$('#member-form').reportValidity())return;perform(async()=>{const f=newFields();if(!f.role)throw Error('직무·과정·상태를 입력해주세요.');const record={id:crypto.randomUUID(),name:f.name,html:formatMember({...f,bio:''}).replace(/<hr>/g,''),bio:f.bio,group:$('#member-group').value,order:Math.min(0,...records.map(r=>r.order))-1,revision:0};if(!confirm('새 멤버의 소개를 공개 저장할까요?'+migrationNotice()))return;if(!ready){await persistInitial([...records,record],record.id);message('새 멤버를 공개 저장했습니다.');return;}const saved=await saveProfile(record);records.push(saved);selected=saved;pending=false;$('#member-form').reset();$('#member-new-card').hidden=true;show();message('새 멤버를 공개 저장했습니다.');});};
  $('#member-save').onclick=()=>perform(async()=>{if(!selected||!canEdit('members'))return;if(ownPending&&own?.id===selected.id)throw Error('내 자기소개 화면에서 작성 중인 내용을 먼저 저장해주세요.');const record=draft();if(!record.name||!$('#member-edit-body').textContent.trim())throw Error('이름과 기본 소개를 입력해주세요.');if(!confirm(record.name+'의 소개를 공개 저장할까요?'+migrationNotice()))return;if(!ready){await persistInitial(records.map(r=>r.id===record.id?record:r),record.id);message('선택한 멤버를 공개 저장했습니다.');return;}const saved=await saveProfile(record);records=records.map(r=>r.id===saved.id?saved:r);selected=saved;if(own?.id===saved.id){own=saved;$('#my-bio').value=saved.bio;}pending=false;show();message('선택한 멤버를 공개 저장했습니다.');});
  $('#member-delete').onclick=()=>perform(async()=>{if(!selected||!canEdit('members'))return;if(!confirm(selected.name+'을 삭제할까요? 이 멤버에 연결된 자기소개 편집 권한도 사용할 수 없게 됩니다.'+migrationNotice()))return;if(!ready){await persistInitial(records.filter(r=>r.id!==selected.id));message('멤버를 삭제했습니다.');return;}await deleteProfile(selected);records=records.filter(r=>r.id!==selected.id);selected=records[0]||null;pending=false;show();message('멤버를 삭제했습니다. 연결된 계정은 권한 관리에서 해제하거나 다른 멤버로 연결해주세요.');});
  $('#my-bio-save').onclick=()=>perform(async()=>{if(!own||!getOwnMemberId())return;if(pending&&selected?.id===own.id)throw Error('멤버 관리에서 작성 중인 내용을 먼저 저장해주세요.');if(!confirm('내 자기소개를 공개 저장할까요?'))return;own=await saveProfile({...own,bio:$('#my-bio').value},true);records=records.map(r=>r.id===own.id?own:r);if(selected?.id===own.id){selected=own;show();}ownPending=false;message('내 자기소개를 공개 저장했습니다.');});
  for(const el of document.querySelectorAll('#member-form input,#member-form textarea,#member-form select,#member-detail input,#member-detail select,#member-detail textarea,#member-edit-body,#my-bio'))el.addEventListener('input',()=>{if(el.id==='my-bio')ownPending=true;else pending=true;newPreview();refreshPreview();});
  return {load,clear,hasPending:()=>pending||ownPending||hasNew(),previewHTML:()=>draft()?profileHTML(draft()):'',ownPreview:()=>own?profileHTML({...own,bio:$('#my-bio').value}):'',exportDraft:()=>({records,selected:draft(),newMember:hasNew()?newFields():null,own:own?{...own,bio:$('#my-bio').value}:null})};
}
