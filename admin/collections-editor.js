import {readEntries,sortEntries,validGalleryImage} from '../collections.js';
import {saveEntry} from './collection-store.js';
import {canEdit} from './auth.js';
import {thumbnail} from './member-photo.js';

export function setupCollections({message}){
  let generation=0;
  const states={};
  const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
  for(const kind of ['news','gallery']){
    const get=suffix=>document.getElementById(kind+'-'+suffix);
    const state=states[kind]={records:[],selected:null,dirty:false,loaded:false,busy:false,uploading:false,image:'',photoGeneration:0};
    function renderPreview(){
      if(kind!=='gallery')return;
      get('preview').replaceChildren();
      if(validGalleryImage(state.image)){const image=document.createElement('img');image.src=state.image;image.alt=get('title').value||'갤러리 사진 미리보기';get('preview').append(image);}
      else {const text=document.createElement('p');text.textContent='사진을 선택하면 여기에 미리 보입니다.';get('preview').append(text);}
    }
    function list(){
      const box=get('list');box.replaceChildren();
      for(const record of [...state.records].sort(sortEntries)){
        const button=document.createElement('button');button.type='button';button.classList.toggle('selected',record.id===state.selected?.id);
        if(kind==='gallery'){const image=document.createElement('img');image.src=record.image;image.alt='';image.loading='lazy';button.append(image);}
        const title=document.createElement('span');title.textContent=record.title;
        const date=document.createElement('small');date.textContent=record.date;button.append(title,date);
        button.onclick=()=>{if(state.busy||!discard())return;edit(record);};box.append(button);
      }
      if(!state.records.length)box.textContent='등록된 게시물이 없습니다. 새 게시물을 추가해주세요.';
    }
    function discard(){return !state.dirty||confirm('이 게시물에서 저장하지 않은 수정을 버릴까요?');}
    function edit(record=null){
      state.photoGeneration++;state.uploading=false;state.selected=record;state.dirty=false;get('form').reset();
      get('form').hidden=false;get('title').value=record?.title||'';get('date').value=record?.date||today();
      get('delete').hidden=!record;get('editor-heading').textContent=record?'게시물 수정':'새 게시물';
      get('status').textContent='';
      if(kind==='gallery'){state.image=record?.image||'';get('caption').value=record?.caption||'';get('url').value=state.image.startsWith('https:')?state.image:'';renderPreview();}
      else get('body').value=record?.body||'';
      list();
    }
    get('form').addEventListener('input',()=>{state.dirty=true;renderPreview();});
    get('new').onclick=()=>{if(!state.busy&&discard()){edit();get('title').focus();}};
    get('cancel').onclick=()=>{if(!state.busy&&discard())edit(state.selected);};
    get('reload').onclick=()=>{if(state.busy||!discard())return;state.loaded=false;state.dirty=false;state.activate();};
    if(kind==='gallery'){
      get('file').onchange=async()=>{
        const file=get('file').files[0];if(!file)return;
        const token=++state.photoGeneration;state.uploading=true;state.dirty=true;get('status').textContent='사진을 준비하는 중입니다…';
        try{
          const image=await thumbnail(file,{width:1200,height:900,maxLength:240000});
          if(token!==state.photoGeneration)return;
          state.image=image;get('url').value='';renderPreview();get('status').textContent='사진 준비가 끝났습니다. 공개 저장하면 홈페이지에 표시됩니다.';
        }catch(error){if(token===state.photoGeneration)get('status').textContent=error.message;}
        finally{if(token===state.photoGeneration){state.uploading=false;get('file').value='';}}
      };
      get('url').oninput=()=>{
        state.photoGeneration++;state.uploading=false;state.image=get('url').value.trim();state.dirty=true;renderPreview();
      };
    }
    async function perform(action){
      if(state.busy)return;
      const token=generation;state.busy=true;document.getElementById(kind).inert=true;
      try{await action(token);}catch(error){if(token===generation){get('status').textContent='저장하지 못했습니다: '+(error.code==='permission-denied'?'관리자 권한과 최신 Firestore 규칙을 확인해주세요.':error.message)+' 작성한 내용은 유지됩니다.';}}
      finally{if(token===generation){state.busy=false;document.getElementById(kind).inert=false;}}
    }
    get('form').onsubmit=event=>{
      event.preventDefault();if(!canEdit(kind)||!get('form').reportValidity())return;
      perform(async token=>{
        if(state.uploading)throw Error('사진 준비가 끝날 때까지 기다려주세요.');
        const entry={id:state.selected?.id||crypto.randomUUID(),revision:state.selected?.revision||0,title:get('title').value.trim(),date:get('date').value};
        if(kind==='gallery'){entry.image=state.image;entry.caption=get('caption').value.trim();if(!validGalleryImage(entry.image))throw Error('사진 파일이나 HTTPS 이미지 주소를 선택해주세요.');}
        else entry.body=get('body').value.trim();
        const saved=await saveEntry(kind,entry);
        if(token!==generation)return;
        state.records=[...state.records.filter(record=>record.id!==saved.id),saved];edit(saved);
        get('status').textContent='공개 저장했습니다. 홈페이지에 바로 반영됩니다.';message((kind==='gallery'?'갤러리':'뉴스')+' 게시물을 공개 저장했습니다.');
      });
    };
    get('delete').onclick=()=>perform(async token=>{
      if(!state.selected||!confirm('“'+state.selected.title+'” 게시물을 삭제할까요?'))return;
      const selected=state.selected;await saveEntry(kind,selected,true);
      if(token!==generation)return;
      state.records=state.records.filter(record=>record.id!==selected.id);edit();get('status').textContent='게시물을 삭제했습니다.';
    });
    state.activate=async()=>{
      if(state.loaded||state.busy)return;
      const token=generation;state.busy=true;document.getElementById(kind).inert=true;get('status').textContent='게시물을 불러오는 중입니다…';
      try{
        const entries=await readEntries(kind);if(token!==generation||!canEdit(kind))return;
        state.records=entries;state.loaded=true;edit();
      }catch(error){if(token===generation)get('status').textContent='게시물을 불러오지 못했습니다. 새로 불러오기를 눌러 다시 시도해주세요.';}
      finally{if(token===generation){state.busy=false;document.getElementById(kind).inert=false;}}
    };
    state.clear=()=>{state.records=[];state.selected=null;state.loaded=false;state.busy=false;state.photoGeneration++;state.uploading=false;state.image='';state.dirty=false;get('form').reset();get('list').replaceChildren();get('status').textContent='';if(kind==='gallery')get('preview').replaceChildren();document.getElementById(kind).inert=false;};
  }
  return {
    activate:kind=>states[kind]?.activate(),
    clear(){generation++;Object.values(states).forEach(state=>state.clear());},
    hasPending:()=>Object.values(states).some(state=>state.dirty||state.uploading||state.busy)
  };
}
