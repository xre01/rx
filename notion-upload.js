(()=>{
  const $=id=>document.getElementById(id),form=$('growthForm'),feedback=$('growthFeedback');
  const date=document.createElement('input');date.type='date';date.id='growthDate';date.setAttribute('aria-label','任务日期');
  const local=new Date();date.value=[local.getFullYear(),String(local.getMonth()+1).padStart(2,'0'),String(local.getDate()).padStart(2,'0')].join('-');
  const files=document.createElement('input');files.type='file';files.id='growthFiles';files.multiple=true;files.setAttribute('aria-label','添加图片、录音或文件');
  const submit=form.querySelector('[type=submit]');form.insertBefore(date,submit);form.insertBefore(files,submit);
  $('growthNote').required=false;
  const hint=document.createElement('p');hint.className='sub';hint.textContent='连接档案馆后，任务与附件会保存到所选日期的 Notion 页面。最多 5 个附件，总大小 20 MiB。';form.after(hint);
  let busy=false,pending=null;
  function connection(){const value=$('gateway').value.trim()||localStorage.getItem('arcane-notion-gateway');const key=$('arcanePassword').value||sessionStorage.getItem('arcane-session-password');if(!value||!key)throw Error('请先在「魔法档案馆」填写 Worker 地址和通行令。');const url=new URL(value);if(url.protocol!=='https:')throw Error('Worker 地址必须使用 HTTPS');return {origin:url.origin,key};}
  form.addEventListener('submit',async e=>{
    e.preventDefault();e.stopImmediatePropagation();if(busy)return;
    const note=$('growthNote').value.trim(),selected=[...files.files];
    if(!note&&!selected.length){feedback.textContent='请填写任务或选择附件。';return;}
    if(!date.value){feedback.textContent='请选择任务日期。';return;}
    if(selected.length>5||selected.reduce((s,f)=>s+f.size,0)>20*1024*1024){feedback.textContent='最多 5 个附件，总大小不能超过 20 MiB。';return;}
    let config;try{config=connection()}catch(error){feedback.textContent=error.message;return;}
    const signature=JSON.stringify([config.origin,date.value,$('growthCategory').value,note,selected.map(f=>[f.name,f.size,f.lastModified])]);
    if(!pending||pending.signature!==signature)pending={signature,id:crypto.randomUUID()};
    const data=new FormData();data.set('id',pending.id);data.set('date',date.value);data.set('category',$('growthCategory').value);data.set('note',note);selected.forEach(f=>data.append('files',f,f.name));
    busy=true;submit.disabled=true;feedback.textContent='正在保存到 Notion，请保持页面打开……';
    try{
      const response=await fetch(config.origin+'/api/entries',{method:'POST',headers:{'X-Arcane-Key':config.key},body:data});
      const result=await response.json();if(!response.ok)throw Error(result.error||'上传失败');
      feedback.replaceChildren(document.createTextNode(`已保存到 ${result.date} 的 Notion 页面。 `));
      const a=document.createElement('a');a.textContent='打开当天任务 ↗';a.href=result.url;a.target='_blank';a.rel='noopener noreferrer';feedback.append(a);
      // Cache only confirmed text submissions for the existing local overview.
      if(note)dispatchEvent(new CustomEvent('rex-notion-saved',{detail:{id:pending.id,date:date.value,category:$('growthCategory').value,note}}));
      pending=null;$('growthNote').value='';files.value='';
    }catch(error){feedback.textContent='未确认保存成功：'+error.message+' 内容已保留，可重试；相同提交不会重复追加。';}
    finally{busy=false;submit.disabled=false;}
  },true);
  submit.textContent='✧ 保存到 Notion';
  // Existing archive cards load page contents only when requested.
  const observer=new MutationObserver(()=>{
    for(const card of $('archiveGrid').children){
      if(card.dataset.detailsAdded)continue;const link=card.querySelector('a');const id=link?.href.match(/[0-9a-f]{32}/i)?.[0];if(!id)continue;
      card.dataset.detailsAdded='true';const btn=document.createElement('button');btn.className='ghost';btn.textContent='查看任务和附件';card.append(btn);
      btn.addEventListener('click',async()=>{btn.disabled=true;try{
        const config=connection(),uuid=id.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/,'$1-$2-$3-$4-$5');
        const response=await fetch(config.origin+'/api/entries/'+uuid,{headers:{'X-Arcane-Key':config.key}});const result=await response.json();if(!response.ok)throw Error(result.error);
        for(const text of result.notes){const p=document.createElement('p');p.textContent=text;card.append(p);}
        for(const file of result.media){const open=document.createElement('button');open.className='ghost';open.textContent='加载 '+file.name;card.append(open);open.addEventListener('click',async()=>{open.disabled=true;try{const response=await fetch(config.origin+file.proxy,{headers:{'X-Arcane-Key':config.key}});if(!response.ok)throw Error('附件加载失败');const url=URL.createObjectURL(await response.blob());const el=document.createElement(file.type==='image'?'img':file.type==='audio'?'audio':'a');if(el.tagName==='A'){el.href=url;el.download=file.name;el.textContent='下载 '+file.name;}else{el.src=url;if(file.type==='audio')el.controls=true;else el.alt=file.name;}card.append(el);open.remove();const cleanup=new MutationObserver(()=>{if(!el.isConnected){URL.revokeObjectURL(url);cleanup.disconnect();}});cleanup.observe($('archiveGrid'),{childList:true,subtree:true});}catch(error){open.disabled=false;open.textContent='重试 '+file.name;$('archiveMessage').textContent=error.message;}});}
        btn.remove();
      }catch(error){btn.disabled=false;$('archiveMessage').textContent=error.message;}});
    }
  });observer.observe($('archiveGrid'),{childList:true});
})();
