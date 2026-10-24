const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{webcrypto}=require('crypto');
let calls=[],pages=[],blocks=new Map(),serial=0;
const uuid=()=> '12345678-1234-4234-8234-'+String(++serial).padStart(12,'0');
function assign(list,parent){return list.map(b=>{const id=uuid(),copy={...b,id,parent:{block_id:parent}};if(b[b.type]?.children){blocks.set(id,assign(b[b.type].children,id));copy.has_children=true;copy[b.type]={...b[b.type]};delete copy[b.type].children}return copy})}
async function notion(env,path,method='GET',data){
 calls.push({path,method});
 if(path==='data_sources/3fd0d1ce-21d1-8046-a3e4-000bae86ce0d')return {id:'ok'};
 if(path.endsWith('/query'))return {results:pages.filter(p=>!p.archived),has_more:false};
 if(path==='pages'&&method==='POST'){const p={id:uuid(),url:'https://notion.so/test',parent:data.parent,properties:data.properties};pages.push(p);blocks.set(p.id,assign(data.children||[],p.id));return p}
 if(path.startsWith('pages/')){const p=pages.find(p=>p.id===path.split('/')[1]);if(method==='PATCH'){const properties={...p.properties,...data.properties};Object.assign(p,data);p.properties=properties;}return p}
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
(async()=>{
 const item={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',kind:'article',title:'Article',body:'Notes',logs:[],writtenDate:'2026-10-18',updated:'2026-10-18T00:00:00Z',attachments:[{id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',name:'notes.pdf',size:8}]};
 const first=await submit(item,item.attachments[0].id);assert.equal(pages.length,1);assert.ok(first.record.attachments[0].blockId);
 const again=await submit(item,item.attachments[0].id);assert.equal(pages.length,1);assert.equal(again.record.remoteRevision,first.record.remoteRevision);
 const edit={...first.record,body:'Revised',richBody:[{type:'paragraph',paragraph:{rich_text:[{type:'text',text:{content:'Revised'}}]}}],updated:'2026-10-18T01:00:00Z'};const next=await submit(edit);assert.equal(pages.length,1);assert.equal(next.record.body,'Revised');assert.equal(calls.filter(c=>c.path==='file_uploads').length,1);
 let conflict=false;try{await submit({...item,body:'Stale edit'})}catch(e){conflict=e.status===409}assert.equal(conflict,true);
 const removed=await submit({...next.record,attachments:[],updated:'2026-10-18T02:00:00Z'});assert.equal(removed.record.attachments.length,0);
 const res=await ctx.handle(new Request('https://worker.test/api/reading/records'),state,{}),data=await res.json();assert.equal(data.complete,true);assert.equal(data.records.length,1);assert.equal(data.records[0].body,'Revised');
 const liveRoot=blocks.get(pages[0].id).filter(b=>!b.archived&&b.type==='toggle').at(-1);
 const liveBody=blocks.get(liveRoot.id).find(b=>b.type==='paragraph');liveBody.paragraph.rich_text=[{type:'text',text:{content:'Edited directly in Notion'}}];
 pages[0].properties.Name.title=[{type:'text',text:{content:'Notion title'}}];
 const external=(await (await ctx.handle(new Request('https://worker.test/api/reading/records'),state,{})).json()).records[0];
 assert.equal(external.body,'Edited directly in Notion');assert.equal(external.title,'Notion title');assert.notEqual(external.remoteRevision,removed.record.remoteRevision);
 let externalConflict=false;try{await submit({...removed.record,body:'Unsynced local edit',updated:'2026-10-18T02:30:00Z'})}catch(e){externalConflict=e.status===409}assert.equal(externalConflict,true);
 assert.ok(calls.filter(c=>c.path.endsWith('/query')).every(c=>c.path.includes('3fd0d1ce-21d1-8046-a3e4-000bae86ce0d')));
 const deleted=await submit({...removed.record,deleted:true,body:'',logs:[],attachments:[],updated:'2026-10-18T03:00:00Z'});assert.equal(deleted.record.deleted,true);assert.equal(pages[0].archived,true);const afterDelete=await (await ctx.handle(new Request('https://worker.test/api/reading/records'),state,{})).json();assert.equal(afterDelete.records.length,1);assert.equal(afterDelete.records[0].deleted,true);let resurrection=false;try{await submit({...item,body:'Stale restore'})}catch(e){resurrection=e.status===409}assert.equal(resurrection,true);
 const book=await submit({id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',kind:'book',title:'Book',body:'',logs:[{id:'note-1',date:'2026-10-18',note:'First day'}],updated:'2026-10-18T00:00:00Z',attachments:[]});
 const bookPage=pages.find(p=>p.id===book.record.remotePageId),bookRoot=blocks.get(bookPage.id).filter(b=>!b.archived&&b.type==='toggle').at(-1);
 const beforeBook=(await (await ctx.handle(new Request('https://worker.test/api/reading/records'),state,{})).json()).records.find(r=>r.id===book.record.id);assert.equal(beforeBook.remoteRevision,book.record.remoteRevision);assert.equal(beforeBook.logs[0].id,'note-1');
 blocks.get(bookRoot.id).find(b=>b.type==='paragraph').paragraph.rich_text=[{type:'text',text:{content:'Book edited in Notion'}}];
 const afterBook=(await (await ctx.handle(new Request('https://worker.test/api/reading/records'),state,{})).json()).records.find(r=>r.id===book.record.id);assert.equal(afterBook.logs[0].note,'Book edited in Notion');assert.equal(afterBook.logs[0].id,'note-1');
 const richDoc=[{type:'paragraph',paragraph:{rich_text:[{type:'text',text:{content:'Formatted'},annotations:{bold:true,underline:true,color:'yellow_background'}}]}},{type:'toggle',toggle:{rich_text:[{type:'text',text:{content:'Details'}}],children:[{type:'quote',quote:{rich_text:[{type:'text',text:{content:'Nested quote'},annotations:{italic:true}}]}}]}},{type:'table',table:{table_width:2,has_column_header:true,has_row_header:false,children:[{type:'table_row',table_row:{cells:[[{type:'text',text:{content:'A'}}],[{type:'text',text:{content:'B'}}]]}}]}}];
 const richSaved=await submit({id:'dddddddd-dddd-4ddd-8ddd-dddddddddddd',kind:'article',title:'Rich',body:'Formatted',richBody:richDoc,logs:[],writtenDate:'2026-10-18',updated:'2026-10-18T00:00:00Z',attachments:[]});
 const richLoaded=(await (await ctx.handle(new Request('https://worker.test/api/reading/records'),state,{})).json()).records.find(r=>r.id===richSaved.record.id);
 assert.deepEqual(richLoaded.richBody,richSaved.record.richBody);assert.equal(richLoaded.remoteRevision,richSaved.record.remoteRevision);
 const richPage=pages.find(p=>p.id===richSaved.record.remotePageId),richRoot=blocks.get(richPage.id).filter(b=>!b.archived&&b.type==='toggle').at(-1);
 const richParagraph=blocks.get(richRoot.id).find(b=>b.type==='paragraph');richParagraph.paragraph.rich_text[0].annotations.color='blue_background';
 const richEdited=(await (await ctx.handle(new Request('https://worker.test/api/reading/records'),state,{})).json()).records.find(r=>r.id===richSaved.record.id);assert.equal(richEdited.richBody[0].paragraph.rich_text[0].annotations.color,'blue_background');assert.notEqual(richEdited.remoteRevision,richSaved.record.remoteRevision);


 const attachmentId='12121212-1212-4212-8212-121212121212',bookDoc={version:1,doc:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Book with file'}]}]}};
 const attached=await submit({id:'13131313-1313-4313-8313-131313131313',kind:'book',title:'Book files',body:'',logs:[{id:'book-note',date:'2026-10-18',note:'Book with file',editorNote:bookDoc,attachmentIds:[attachmentId]}],editorClientVersion:1,attachments:[{id:attachmentId,name:'book.pdf',size:8}],updated:'2026-10-18T04:00:00Z'},attachmentId);
 const attachedLoaded=(await (await ctx.handle(new Request('https://worker.test/api/reading/records'),state,{})).json()).records.find(r=>r.id===attached.record.id);assert.deepEqual(attachedLoaded.logs[0].attachmentIds,[attachmentId]);assert.deepEqual(attachedLoaded.logs[0].editorNote,bookDoc);assert.ok(attachedLoaded.attachments[0].blockId);
 await assert.rejects(()=>submit({...attached.record,editorClientVersion:1,logs:[{...attached.record.logs[0],attachmentIds:['not-a-file'] }],updated:'2026-10-18T05:00:00Z'}));
 const full={version:1,doc:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Web version',marks:[{type:'textStyle',attrs:{color:'#a43e48',backgroundColor:'#fff0a6'}}]}]}]}};
 const fullSaved=await submit({id:'ffffffff-ffff-4fff-8fff-ffffffffffff',kind:'article',title:'Full document',body:'Web version',richBody:[{type:'paragraph',paragraph:{rich_text:[{type:'text',text:{content:'Web version'}}]}}],editorBody:full,editorClientVersion:1,logs:[],attachments:[],writtenDate:'2026-10-18',updated:'2026-10-18T04:00:00Z'});
 const fullLoaded=(await (await ctx.handle(new Request('https://worker.test/api/reading/records'),state,{})).json()).records.find(r=>r.id===fullSaved.record.id);assert.deepEqual(fullLoaded.editorBody,full);assert.equal(fullLoaded.remoteRevision,fullSaved.record.remoteRevision);
 await assert.rejects(()=>submit({...fullSaved.record,updated:'2026-10-18T05:00:00Z'}),e=>e.status===409);
 const fullRoot=blocks.get(fullSaved.record.remotePageId).filter(b=>!b.archived&&b.type==='toggle').at(-1);blocks.get(fullRoot.id).find(b=>b.type==='paragraph').paragraph.rich_text=[{type:'text',text:{content:'Notion changed'}}];
 await assert.rejects(()=>ctx.handle(new Request('https://worker.test/api/reading/records'),state,{}),e=>e.status===409);assert.deepEqual(memory.get('reading-record:'+fullSaved.record.remotePageId).editorBody,full);
 console.log('PASS: deletion/tombstones/stale-client protection, separate database, retry deduplication, edit, conflict protection, attachment upload/reuse/removal, complete reload');
})().catch(e=>{console.error(e);process.exit(1)});
