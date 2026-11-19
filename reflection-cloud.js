/* Read saved reflections through the existing authenticated archive gateway. */
(()=>{
'use strict';
let cache=null,mutationVersion=0;const removedDates=new Set();
const text=b=>(b?.[b.type]?.rich_text||[]).map(t=>t.text?.content??t.plain_text??'').join('');
function connection(){const input=document.getElementById('gateway'),key=document.getElementById('arcanePassword')?.value||sessionStorage.getItem('arcane-session-password');if(!key)return null;const url=new URL(input?.value||localStorage.getItem('arcane-notion-gateway')||'https://rex-notion-calendar.xren0220.workers.dev');if(url.protocol!=='https:'||url.username||url.password)throw Error('Check the Notion gateway URL in Me → Connections.');return {origin:url.origin,key}}
function personal(value){const note=String(value||'').trim();if(!note.startsWith('Daily Study Overview · '))return note;const marker=note.indexOf('\n\nDaily Reflection\n\n');return marker>=0?note.slice(marker+'\n\nDaily Reflection\n\n'.length).trim():note}
function parse(page,data,origin){
 if(Array.isArray(data.reflections))return data.reflections.map(r=>({...r,remote:true,origin,note:personal(r.note),files:[],links:[],synced:true,url:page.url}));
 const rows=Array.isArray(data.richNotes)?data.richNotes:null,result=[];
 if(rows){let current;for(const b of rows){if(b.type==='heading_3'){current=null;if(/^(?:生活|Daily Reflection)(?:\s*·\s*网站记录)?\s*$/.test(text(b))){const link=(b.heading_3.rich_text||[]).find(t=>t.text?.link?.url?.includes('#submission='))?.text.link.url;current={id:link?.split('#submission=')[1]||page.id+'-'+result.length,submission:link?.split('#submission=')[1],date:page.date,note:'',media:[],remote:true,origin,url:page.url,synced:true,files:[],links:[]};result.push(current)}}else if(current&&['to_do','paragraph'].includes(b.type))current.note+=[current.note?'\n\n':'',text(b)].join('')}
 }else if(Array.isArray(data.notes)){let current;for(const line of data.notes){if(/^(?:生活|Daily Reflection)(?:\s*·\s*网站记录)?\s*$/.test(line)){current={id:page.id+'-'+result.length,date:page.date,note:'',media:[],remote:true,origin,url:page.url,synced:true,files:[],links:[]};result.push(current)}else if(/^(?:PTE 练习|PTE practice|Practice notes)(?:\s*·.*)?$/i.test(line))current=null;else if(current)current.note+=(current.note?'\n':'')+line}}
 return result.map(r=>({...r,note:personal(r.note),attachmentsInNotion:!!data.media?.length}));
}
async function request(c,path,signal){const controller=new AbortController(),abort=()=>controller.abort();if(signal?.aborted)throw Error('Request cancelled.');signal?.addEventListener('abort',abort,{once:true});const timer=setTimeout(abort,20000);try{const response=await fetch(c.origin+path,{headers:{'X-Arcane-Key':c.key},cache:'no-store',signal:controller.signal});if(!response.ok)throw Error(response.status===401?'Reconnect to Notion in Me → Connections.':'Could not read Notion records ('+response.status+').');return await response.json()}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort)}}
async function load({signal,force=false}={}){
 const version=mutationVersion,c=connection();if(!c)return {records:[],connected:false,partial:false};
 if(!force&&cache&&cache.origin===c.origin&&cache.key===c.key&&Date.now()-cache.at<60000)return visible(cache.result);
 const index=await request(c,'/api/entries',signal);if(!Array.isArray(index.records))throw Error('Invalid Notion record list.');
 const pages=index.records.filter(r=>/^[0-9a-f-]{36}$/i.test(r?.id||'')&&/^\d{4}-\d{2}-\d{2}$/.test(r.date||'')),records=[];let cursor=0,failed=0;
 await Promise.all(Array.from({length:Math.min(3,pages.length)},async()=>{while(cursor<pages.length&&!signal?.aborted){const page=pages[cursor++];try{const data=await request(c,'/api/entries/'+page.id,signal);records.push(...parse(page,data,c.origin))}catch(error){if(signal?.aborted)throw error;failed++}}}));
 if(version!==mutationVersion)return load({signal,force:true});
 const result={records,connected:true,partial:!!index.truncated||failed>0,failed};if(!result.partial)cache={origin:c.origin,key:c.key,at:Date.now(),result};return visible(result);
}
function visible(result){const hidden=new Set([...removedDates,...(window.RexDailyReflection?.pendingDeletionDates||[])]);return {...result,records:result.records.filter(r=>!hidden.has(r.date))};}
async function download(file,origin,signal){const c=connection();if(!c||c.origin!==origin)throw Error('Reconnect to the same Notion gateway to open this attachment.');if(!/^\/api\/media\/[0-9a-f-]{36}\/[0-9a-f-]{36}$/i.test(file.proxy||''))throw Error('Invalid attachment address.');const response=await fetch(c.origin+file.proxy,{headers:{'X-Arcane-Key':c.key},cache:'no-store',signal});if(!response.ok)throw Error('Could not load this attachment. Open the original in Notion.');return response.blob()}
async function remove(date,{operationId,origin}={}){
 const c=connection();if(!c)throw Error('Connect to Notion to sync this deletion.');
 if(origin&&origin!==c.origin)throw Error('Reconnect to the original Notion service to finish deletion.');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
 try{
  const response=await fetch(c.origin+'/api/reflections/delete',{method:'POST',headers:{'X-Arcane-Key':c.key,'Content-Type':'application/json'},body:JSON.stringify({date,operationId}),cache:'no-store',signal:controller.signal});
  const data=await response.json();if(!response.ok||!data.ok)throw Error(data.error||'Could not delete the Notion life record.');
  removedDates.add(date);cache=null;mutationVersion++;dispatchEvent(new CustomEvent('rex-life-deleted',{detail:{date}}));return data;
 }finally{clearTimeout(timer)}
}
addEventListener('rex-notion-saved',event=>{if(!['reflection','skill'].includes(event.detail?.category))return;removedDates.delete(event.detail.date);cache=null;mutationVersion++;});
window.RexReflectionCloud={load,download,remove,origin:()=>connection()?.origin||''};
dispatchEvent(new Event('rex-reflection-cloud-ready'));
})();
