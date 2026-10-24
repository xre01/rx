const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{webcrypto}=require('crypto');
const SOURCE='3fd0d1ce-21d1-8046-a3e4-000bae86ce0d',DB='3fd0d1ce-21d1-808a-b9dd-c1201cb27918';
let serial=0;const uuid=()=>`12345678-1234-4234-8234-${String(++serial).padStart(12,'0')}`;
const pages=[],blocks=new Map(),calls=[],text=v=>[{type:'text',text:{content:v}}];
const name=p=>(p?.title||p?.rich_text||[]).map(t=>t.plain_text??t.text?.content??'').join('');
function matches(p,f){if(!f)return true;if(f.and)return f.and.every(x=>matches(p,x));if(f.or)return f.or.some(x=>matches(p,x));const v=p.properties[f.property],q=f.select||f.rich_text||f.date;const value=f.select?v?.select?.name:f.date?v?.date?.start:name(v);return q.is_empty?!value:q.equals!==undefined?value===q.equals:q.does_not_equal!==undefined?value!==q.does_not_equal:q.starts_with!==undefined?(value||'').startsWith(q.starts_with):false;}
function assign(rows,parent){return rows.map(b=>{const id=uuid(),v={...b[b.type]},nested=v.children;delete v.children;if(nested)blocks.set(id,assign(nested,id));return {...b,[b.type]:v,id,parent:{block_id:parent},has_children:!!nested};});}
async function mock(env,path,method='GET',data){calls.push({path,method,data});if(path==='data_sources/legacy-pte/query')throw Error('Legacy source no longer exists: 404');
 if(path.endsWith('/query')){const source=path.split('/')[1];let result=pages.filter(p=>!p.archived&&p.parent.data_source_id===source&&matches(p,data.filter));const start=data.start_cursor?Number(data.start_cursor):0,size=data.page_size||100;return {results:result.slice(start,start+size),has_more:start+size<result.length,next_cursor:String(start+size)};}
 if(path.startsWith('data_sources/'))return {id:path.split('/')[1]};
 if(path==='pages'){const p={id:uuid(),url:'https://notion.so/'+serial,parent:data.parent,properties:data.properties};pages.push(p);blocks.set(p.id,assign(data.children||[],p.id));return p;}
 if(path.startsWith('pages/')){const p=pages.find(p=>p.id===path.split('/')[1]);if(!p)throw Error('Missing page');if(method==='PATCH'){if(data.properties)p.properties={...p.properties,...data.properties};if(data.archived!==undefined)p.archived=data.archived;}return p;}
 if(path.startsWith('blocks/')){const id=path.split('/')[1];if(path.includes('/children')){if(method==='PATCH'){const added=assign(data.children,id);blocks.set(id,[...(blocks.get(id)||[]),...added]);return {results:added};}return {results:(blocks.get(id)||[]).filter(b=>!b.archived),has_more:false};}const b=[...blocks.values()].flat().find(b=>b.id===id);if(method==='PATCH')Object.assign(b,data);return b;}
 throw Error('Unexpected '+path);
}
const memory=new Map(),state={storage:{get:async k=>structuredClone(memory.get(k)),put:async(k,v)=>memory.set(k,structuredClone(v)),list:async({prefix})=>new Map([...memory].filter(([k])=>k.startsWith(prefix)))}};
const ctx={console,Response,Request,FormData,Blob,URL,TextEncoder,crypto:webcrypto,mock};vm.createContext(ctx);
vm.runInContext(fs.readFileSync('workers/notion-worker.mjs','utf8').replace('export default {','globalThis.worker = {').replace('export class Calendar','globalThis.Calendar = class Calendar').replace('(function(root)',';\n(function(root)')+'\nnotion=mock;',ctx);
const env={NOTION_TOKEN:'test',ACCESS_PASSWORD:'test',NOTION_DATA_SOURCE_ID:'legacy-pte',NOTION_DATABASE_ID:'legacy-db',ALLOWED_ORIGIN:'https://xre01.github.io'};
const calendar=new ctx.Calendar(state,env);env.CALENDAR={idFromName:n=>n,get:()=>calendar};
const request=(path,init={})=>new Request('https://worker.test'+path,{...init,headers:{'X-Arcane-Key':'test',...init.headers}});
async function reading(item){const form=new FormData();form.set('record',JSON.stringify(item));const res=await calendar.fetch(request('/api/reading/records',{method:'POST',body:form}));assert.equal(res.status,200,await res.clone().text());return (await res.json()).record;}
function seed(source,type,title,date){const p={id:uuid(),url:'https://notion.so/seed',parent:{data_source_id:source},properties:{Name:{title:text(title)},Date:{date:date?{start:date}:null},...(type?{Type:{select:{name:type}}}:{})}};pages.push(p);blocks.set(p.id,[]);return p;}
(async()=>{
 const work=seed(SOURCE,'Work','Work','2026-10-18');
 const article=await reading({id:uuid(),kind:'article',title:'Reading article',body:'Read',logs:[],writtenDate:'2026-10-18',attachments:[],updated:'2026-10-18T00:00:00Z'});
 let book=await reading({id:uuid(),kind:'book',title:'Book',body:'',logs:[{id:'a',date:'2026-10-18',note:'One'},{id:'b',date:'2026-10-19',note:'Two'}],attachments:[],updated:'2026-10-18T00:00:00Z'});
 assert.equal(pages.filter(p=>p.properties.RecordKind?.select?.name==='Reading day'&&!p.archived).length,2);
 const replay={...book,updated:'2026-10-18T00:00:00Z'};book=await reading(replay);assert.equal(pages.filter(p=>p.properties.RecordKind?.select?.name==='Reading day'&&!p.archived).length,2);
 const form=new FormData();form.set('id',uuid());form.set('date','2026-10-18');form.set('category','language');form.set('note','PTE only');
 const pte=await (await calendar.submit(request('/api/entries',{method:'POST',body:form}))).json();assert.notEqual(pte.pageId,article.remotePageId);
 const ptePage=pages.find(p=>p.id===pte.pageId);assert.equal(ptePage.parent.data_source_id,SOURCE);assert.equal(ptePage.properties.Type.select.name,'PTE');
 const count=pages.length;await calendar.submit(request('/api/entries',{method:'POST',body:form}));assert.equal(pages.length,count);
 const legacy=seed('legacy-pte',null,'Legacy PTE','2026-10-17');
 let list=await (await ctx.worker.fetch(request('/api/entries'),env)).json();assert.deepEqual(list.records.map(p=>p.id).sort(),[ptePage.id].sort());
 list=await (await calendar.fetch(request('/api/reading/records'))).json();assert.equal(list.records.length,2);assert.ok(list.records.every(r=>['book','article'].includes(r.kind)));
 for(const page of [work,pages.find(p=>p.id===article.remotePageId)]){const res=await ctx.worker.fetch(request('/api/entries/'+page.id),env);assert.equal(res.status,403);}
 // Moving legacy pages preserves IDs and receipts; both APIs remain separated.
 legacy.parent={data_source_id:SOURCE};legacy.properties.Type={select:{name:'PTE'}};
 list=await (await ctx.worker.fetch(request('/api/entries'),env)).json();assert.equal(list.records.length,2);
 const migration=await (await calendar.fetch(request('/api/reading/calendar-migrate',{method:'POST'}))).json();assert.equal(migration.migrated,2);
 const edited=await reading({...book,title:'Renamed',logs:[book.logs[1]],updated:'2026-10-19T00:00:00Z'});
 await reading(replay); const days=pages.filter(p=>p.properties.RecordKind?.select?.name==='Reading day'&&!p.archived);assert.equal(days.length,1);assert.equal(name(days[0].properties.Name),'Renamed · 2026-10-19');
 await reading({...edited,deleted:true,updated:'2026-10-20T00:00:00Z'});assert.equal(pages.filter(p=>p.properties.RecordKind?.select?.name==='Reading day'&&!p.archived).length,0);
 assert.equal(work.archived,undefined);assert.ok(calls.filter(c=>c.path.endsWith('/query')).every(c=>c.path.includes(SOURCE)));
 console.log('PASS: My World mixed types, same-day isolation, legacy move, receipts, book dates, rename/removal, migration and unchanged reading records');
})().catch(e=>{console.error(e);process.exit(1)});
