(()=>{
  'use strict';
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
  const pageId=value=>String(value||'').replace(/-/g,'').toLowerCase();
  const urlId=value=>String(value||'').match(/[0-9a-f]{32}(?=[?#/]|$)/i)?.[0]?.toLowerCase();
  const validDay=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value);
  // Only a complete successful database read may establish that a page was deleted.
  window.RexNotionReconcile=(records,{origin,complete})=>{
    if(!complete||!Array.isArray(records))return;
    const pages=new Set(records.map(r=>pageId(r.id)).filter(Boolean));
    const snapshotKey='rex-notion-pages-v1',snapshots=read(snapshotKey,{}),previous=snapshots[origin]||[];
    const revoked=new Set(read('rex-notion-revoked-days-v1',[]));
    const current=records.filter(r=>validDay(r.date)&&r.completed!==false).map(r=>({id:pageId(r.id),date:r.date}));
    for(const r of previous)if(!pages.has(r.id))revoked.add(r.date);
    const plans=read('rex-pte-daily-v1',{}),removedSubmissions=new Set();let changed=false;
    for(const [date,rows]of Object.entries(plans)){
      if(!Array.isArray(rows))continue;
      for(const r of rows){
        if(!r?.synced||r.notionOrigin&&r.notionOrigin!==origin)continue;
        const id=pageId(r.pageId)||urlId(r.url);
        if(id&&!pages.has(id)){
          if(r.submission)removedSubmissions.add(r.submission);
          r.done=false;r.synced=false;r.notionDeleted=true;delete r.signature;delete r.submission;delete r.url;delete r.pageId;
          revoked.add(date);changed=true;
        }
      }
    }
    const customs=read('rex-custom-cultivation-v1',[]);let customsChanged=false;
    function clearReceipt(record,date){
      if(!record?.synced||record.notionOrigin&&record.notionOrigin!==origin)return false;
      const id=pageId(record.pageId)||urlId(record.url);if(!id||pages.has(id))return false;
      if(record.submission)removedSubmissions.add(record.submission);record.done=0;record.synced=false;record.notionDeleted=true;
      for(const key of ['url','pageId','signature','submission'])delete record[key];revoked.add(date);changed=true;customsChanged=true;return true;
    }
    for(const task of customs){const entries=task.repeat?Object.entries(task.history||{}):[[task.date,task]];
      for(const [date,record]of entries){clearReceipt(record,date);let questionChanged=false;
       for(const question of Object.values(record.questions||{}))if(clearReceipt(question,date))questionChanged=true;
       if(questionChanged)record.done=Math.min(task.goal,Object.entries(record.questions||{}).filter(([n,q])=>/^\d+$/.test(n)&&Number(n)<=task.goal&&q.done).length+(Number(record.questions?.batch?.done)||0));
      }
    }
    if(customsChanged)localStorage.setItem('rex-custom-cultivation-v1',JSON.stringify(customs));
    const growth=read('rex-daily-growth-v1',[]),kept=growth.filter(r=>{
      if(r.origin&&r.origin!==origin)return true;
      const id=pageId(r.pageId)||urlId(r.url);
      const deleted=removedSubmissions.has(r.id)||(id&&!pages.has(id));
      if(deleted){revoked.add(r.date);changed=true}return !deleted;
    });
    snapshots[origin]=current;
    localStorage.setItem(snapshotKey,JSON.stringify(snapshots));
    localStorage.setItem('rex-notion-revoked-days-v1',JSON.stringify([...revoked].filter(validDay)));
    if(changed){localStorage.setItem('rex-pte-daily-v1',JSON.stringify(plans));localStorage.setItem('rex-daily-growth-v1',JSON.stringify(kept))}
    window.RexDashboardStore?.reconcileDays([...revoked]);
    if(changed)dispatchEvent(new Event('rex-notion-reconciled'));
    dispatchEvent(new Event('rex-local-changed'));
  };
  addEventListener('rex-notion-saved',event=>{
    const item=event.detail;if(!item||typeof item.id!=='string'||!validDay(item.date))return;
    try{const entries=read('rex-daily-growth-v1',[]).filter(row=>row.id!==item.id);const origin=item.origin||document.getElementById('gateway')?.value;
      entries.push({...item,origin,source:'notion'});localStorage.setItem('rex-daily-growth-v1',JSON.stringify(entries));dispatchEvent(new Event('rex-local-changed'));
    }catch{}
  });
  // The existing gateway accepts five files per request. Send larger selections
  // in idempotent batches into the same daily page, without a backend deployment.
  window.RexNotionUpload=async(origin,token,form)=>{
    const files=form.getAll('files');
    if(files.length>16||files.filter(f=>f.type?.startsWith('image/')).length>15||files.reduce((n,f)=>n+(f.size||0),0)>20*1024*1024)throw Error('Maximum 15 images plus audio, 20 MiB total.');
    const base=String(form.get('id')),batches=Math.max(1,Math.ceil(files.length/5));let response;
    for(let batch=0;batch<batches;batch++){
      const body=new FormData();for(const [key,value]of form.entries())if(key!=='files')body.append(key,value);
      if(batch){
        const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(base+':attachments:'+batch));
        const hex=Array.from(new Uint8Array(hash)).map(v=>v.toString(16).padStart(2,'0')).join('').slice(0,32);
        body.set('id',hex.slice(0,8)+'-'+hex.slice(8,12)+'-4'+hex.slice(13,16)+'-a'+hex.slice(17,20)+'-'+hex.slice(20));
        body.set('note','Attachments · continued '+(batch+1)+' / '+batches);
      }
      files.slice(batch*5,batch*5+5).forEach(file=>body.append('files',file,file.name));
      response=await fetch(origin+'/api/entries',{method:'POST',headers:{'X-Arcane-Key':token},body});
      if(!response.ok)return response;
    }
    return response;
  };
})();
