const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{webcrypto}=require('crypto');
let calls=[],pages=[],blocks=new Map(),serial=0;
const uuid=()=> '12345678-1234-4234-8234-'+String(++serial).padStart(12,'0');
function assign(list,parent){return list.map(b=>{const id=uuid(),copy={...b,id,parent:{block_id:parent}};if(b[b.type]?.children){blocks.set(id,assign(b[b.type].children,id));copy.has_children=true;copy[b.type]={...b[b.type]};delete copy[b.type].children}return copy})}
async function notion(env,path,method='GET',data){
 calls.push({path,method});
 if(path==='data_sources/3fd0d1ce-21d1-8046-a3e4-000bae86ce0d')return {id:'ok'};
 if(path.endsWith('/query'))return {results:pages.filter(p=>!p.archived),has_more:false};
 if(path==='pages'&&method==='POST'){const p={id:uuid(),url:'https://notion.so/test',parent:data.parent,properties:data.properties};pages.push(p);blocks.set(p.id,assign(data.children||[],p.id));return p}
 if(path.startsWith('pages/')){const p=pages.find(p=>p.id===path.split('/')[1]);if(method==='PATCH')Object.assign(p,data);return p}
 if(path.startsWith('blocks/')&&path.endsWith('/children')&&method==='PATCH'){const id=path.split('/')[1];for(const list of blocks.values()){const parent=list.find(b=>b.id===id);if(parent)parent.has_children=true;}blocks.set(id,[...((blocks.get(id)||[]).filter(b=>!b.archived)),...assign(data.children,id)]);return {results:blocks.get(id).slice(-data.children.length)}}
 if(path==='file_uploads')return {id:uuid()};
 if(path.endsWith('/send'))return {status:'uploaded'};
 if(path.startsWith('blocks/')&&method==='PATCH'){for(const list of blocks.values()){const b=list.find(b=>b.id===path.split('/')[1]);if(b){Object.assign(b,data);return b}}}
 if(path.startsWith('blocks/')){for(const list of blocks.values()){const b=list.find(b=>b.id===path.split('/')[1]);if(b)return b}}
 throw Error('Unexpected Notion path '+path)
}
const memory=new Map(),state={storage:{get:async k=>structuredClone(memory.get(k)),put:async(k,v)=>memory.set(k,structuredClone(v)),list:async({prefix})=>new Map([...memory].filter(([k])=>k.startsWith(prefix)))}},ctx={console,Response,Request,FormData,Blob,TextEncoder,crypto:webcrypto,URL,notion,children:async(env,id)=>blocks.get(id)||[],LIMIT:20*1024*1024,rich:s=>[{type:'text',text:{content:s}}],json:(body,status=200)=>Response.json(body,{status}),fail:(message,status=400)=>Object.assign(Error(message),{status}),validDate:s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s,uploadType:f=>f.type||'application/pdf'};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('rich-doc.js','utf8')+'\n'+fs.readFileSync('workers/notion-worker.mjs','utf8').split('async function appendRichBlocks')[1].split('// Independent reading')[0].replace(/^/, 'async function appendRichBlocks'),ctx);vm.runInContext('const READING_SOURCE'+fs.readFileSync('workers/notion-worker.mjs','utf8').split('const READING_SOURCE')[1]+'\nglobalThis.handle=readingHandle;',ctx);
async function submit(item,file){const form=new FormData();form.append('record',JSON.stringify(item));if(file)form.append('files',new Blob(['test pdf'],{type:'application/pdf'}),file);return (await ctx.handle(new Request('https://worker.test/api/reading/records',{method:'POST',body:form}),state,{})).json()}

ctx.categories={language:'Language',reflection:'Reflection'};ctx.marker=(b,id)=>(b[b.type]?.rich_text||[]).some(t=>t.text?.link?.url?.endsWith('#submission='+id));
const worker=fs.readFileSync('workers/notion-worker.mjs','utf8');const calendar=worker.slice(worker.indexOf('export class Calendar'),worker.indexOf('(function(root)'));
// Shared rich helpers appear between the Calendar and reading extension.
vm.runInContext(calendar.replace('export class Calendar','class Calendar')+'\nglobalThis.TestCalendar=Calendar;',ctx);
(async()=>{const calendar=new ctx.TestCalendar(state,{NOTION_DATA_SOURCE_ID:'pte-source',ALLOWED_ORIGIN:'https://xre01.github.io'});
 const form=new FormData();form.set('id','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee');form.set('date','2026-10-18');form.set('category','language');form.set('note','WE · Question 1\n\nKey idea');form.set('richNote',JSON.stringify([{type:'paragraph',paragraph:{rich_text:[{type:'text',text:{content:'Key idea'},annotations:{bold:true,underline:true,color:'green'}}]}},{type:'to_do',to_do:{checked:true,rich_text:[{type:'text',text:{content:'Review'}}]}}]));
 const request=()=>new Request('https://worker.test/api/entries',{method:'POST',body:form});const saved=await (await calendar.submit(request())).json();assert.ok(saved.pageId);
 const top=blocks.get(saved.pageId);const root=top.find(b=>b.type==='toggle'&&ctx.marker(b,'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'));assert.ok(root);const content=blocks.get(root.id);assert.equal(content[0].paragraph.rich_text[0].annotations.color,'green');assert.equal(content[1].to_do.checked,true);
 const count=pages.length;await calendar.submit(request());assert.equal(pages.length,count);assert.equal(blocks.get(saved.pageId).filter(b=>b.type==='toggle').length,1);
 const reflection=new FormData();reflection.set('id','ffffffff-ffff-4fff-8fff-ffffffffffff');reflection.set('date','2026-10-18');reflection.set('category','skill');reflection.set('note','Reflection note');await calendar.submit(new Request('https://worker.test/api/entries',{method:'POST',body:reflection}));assert.ok([...blocks.values()].flat().some(b=>b.type==='heading_3'&&ctx.readingText===undefined&&(b.heading_3.rich_text||[]).some(t=>t.text?.content==='Reflection')));
 console.log('PASS: PTE native formatting, checked to-do, completion marker, receipt retry deduplication');})().catch(e=>{console.error(e);process.exit(1)});
