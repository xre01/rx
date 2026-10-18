const VERSION = '2025-09-03';
const LIMIT = 20 * 1024 * 1024;
const categories = { language: 'PTE 练习', reflection: 'Daily Reflection' };
const json = (body, status = 200) => Response.json(body, { status });
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const rich = content => [{ type: 'text', text: { content } }];
function uploadType(file) {
  // Browsers on Windows label M4A as audio/x-m4a or omit its MIME type.
  // Notion accepts the MP4 audio container as audio/mp4.
  const extension = file.name.split('.').at(-1).toLowerCase();
  const audio = { m4a: 'audio/mp4', m4b: 'audio/mp4', mp3: 'audio/mpeg', wav: 'audio/wav', aac: 'audio/aac', flac: 'audio/x-flac', ogg: 'audio/ogg', opus: 'audio/ogg' };
  return audio[extension] || file.type || 'application/octet-stream';
}

async function notion(env, path, method = 'GET', body) {
  const headers = { Authorization: `Bearer ${env.NOTION_TOKEN}`, 'Notion-Version': VERSION };
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch('https://api.notion.com/v1/' + path, {
    method, headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined
  });
  const value = await response.json();
  if (!response.ok) throw fail(response.status === 429 ? 'Notion 请求较多，请稍后重试。' : `Notion 请求失败（${response.status}）。请检查数据库授权、密钥和文件格式。`, 502);
  return value;
}
async function children(env, id) {
  const rows = []; let cursor;
  do {
    const page = await notion(env, `blocks/${id}/children?page_size=100${cursor ? '&start_cursor=' + encodeURIComponent(cursor) : ''}`);
    rows.push(...page.results); cursor = page.has_more ? page.next_cursor : null;
  } while (cursor);
  return rows;
}
function validDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const d = new Date(date + 'T00:00:00Z');
  return !isNaN(d) && d.toISOString().slice(0, 10) === date;
}
function marker(block, id) {
  return (block[block.type]?.rich_text || []).some(t => t.text?.link?.url?.endsWith('#submission=' + id));
}
function belongs(env, page) {
  return page.parent?.data_source_id === env.NOTION_DATA_SOURCE_ID || page.parent?.database_id === env.NOTION_DATABASE_ID;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const readingLocal=new URL(request.url).pathname.startsWith('/api/reading/')&&['http://localhost:8765','http://127.0.0.1:8765'].includes(origin);
    const headers = { 'Vary': 'Origin', 'Cache-Control': 'no-store' };
    if ((origin === env.ALLOWED_ORIGIN || readingLocal)) Object.assign(headers, {
      'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'Content-Type, X-Arcane-Key, X-Focus-Key',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    });
    const finish = response => { const result = new Response(response.body, response); for (const [k,v] of Object.entries(headers)) result.headers.set(k,v); return result; };
    if (origin && origin !== env.ALLOWED_ORIGIN && !readingLocal) return finish(json({ error: '不允许此网站访问。' }, 403));
    if (request.method === 'OPTIONS') return finish(new Response(null, { status: 204 }));
    if (!env.NOTION_TOKEN || !env.ACCESS_PASSWORD) return finish(json({ error: '后端尚未设置 Notion 密钥和通行令。' }, 503));
    const focusPath=new URL(request.url).pathname,focusMatch=focusPath.match(/^\/api\/focus\/([0-9a-f-]{36})\/(register|subscription|state|schedule|disable)$/i);
    if (focusMatch&&focusMatch[2]!=='register'){try{return finish(await env.CALENDAR.get(env.CALENDAR.idFromName('focus:'+focusMatch[1])).fetch(request));}catch(error){return finish(json({error:error.message},error.status||500));}}
    if (request.headers.get('X-Arcane-Key') !== env.ACCESS_PASSWORD) return finish(json({ error: '通行令错误。' }, 401));
    try {
      const path = new URL(request.url).pathname;
      if(focusMatch)return finish(await env.CALENDAR.get(env.CALENDAR.idFromName('focus:'+focusMatch[1])).fetch(request));
      if(path.startsWith('/api/reading/')){if(request.method==='POST'){const reader=request.body?.getReader();if(!reader)throw fail('内容为空。');const chunks=[];let size=0;while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>LIMIT+512*1024){await reader.cancel();throw fail('同步内容不能超过 20 MiB。',413)}chunks.push(value)}request=new Request(request.url,{method:request.method,headers:request.headers,body:new Blob(chunks)});}const stub=env.CALENDAR.get(env.CALENDAR.idFromName('reading:'+READING_SOURCE));return finish(await stub.fetch(request));}
      if (path === '/api/entries' && request.method === 'POST') {
        if (!request.headers.get('Content-Type')?.startsWith('multipart/form-data')) throw fail('请使用上传表单。');
        // Bound the streamed request before buffering or parsing attachments.
        const reader = request.body?.getReader(); if (!reader) throw fail('上传内容为空。');
        const chunks = []; let size = 0;
        while (true) { const { value, done } = await reader.read(); if (done) break; size += value.byteLength; if (size > LIMIT + 128 * 1024) { await reader.cancel(); throw fail('每次上传总大小不能超过 20 MiB。', 413); } chunks.push(value); }
        const safeRequest = new Request(request.url, { method: 'POST', headers: request.headers, body: new Blob(chunks) });
        const stub = env.CALENDAR.get(env.CALENDAR.idFromName(env.NOTION_DATA_SOURCE_ID));
        return finish(await stub.fetch(safeRequest));
      }
      if (path === '/api/entries' && request.method === 'GET') {
        let cursor; const pages = [];
        do {
          const result = await notion(env, `data_sources/${env.NOTION_DATA_SOURCE_ID}/query`, 'POST', { page_size: 100, sorts: [{ property: 'Date', direction: 'descending' }], ...(cursor ? { start_cursor: cursor } : {}) });
          pages.push(...result.results); cursor = result.has_more ? result.next_cursor : null;
        } while (cursor && pages.length < 500);
        const records = pages.map(p => ({ id: p.id, title: (p.properties.Name?.title || []).map(t => t.plain_text ?? t.text?.content ?? '').join(''), date: p.properties.Date?.date?.start, url: p.url, minutes: null, exp: null, media: [], category: '每日任务' }));
        return finish(json({ records, truncated: !!cursor }));
      }
      const match = path.match(/^\/api\/entries\/([0-9a-f-]{36})$/i);
      if (match && request.method === 'GET') {
        const page = await notion(env, `pages/${match[1]}`);
        if (!belongs(env, page)) throw fail('无法访问此页面。', 403);
        const blocks = await children(env, page.id);
        const notes = blocks.filter(b => ['heading_3','paragraph','to_do'].includes(b.type)).map(b => (b[b.type].rich_text || []).map(t => t.plain_text ?? t.text?.content ?? '').join(''));
        const media = blocks.filter(b => ['image','audio','file','pdf','video'].includes(b.type)).map(b => ({ name: (b[b.type].caption || []).map(t => t.plain_text ?? t.text?.content ?? '').join('') || b.type, type: b.type, proxy: `/api/media/${page.id}/${b.id}` }));
        async function richChildren(rows,depth=0){if(depth>8)throw fail('Note nesting exceeds the editor limit.',409);const out=[];for(const b of rows){if(b.archived||b.in_trash||['image','audio','file','pdf','video'].includes(b.type))continue;if(b.type==='toggle'&&readingText(b).startsWith('Sync in progress'))continue;const v={...b[b.type]};if(b.has_children||v.children?.length)v.children=await richChildren(v.children||await children(env,b.id),depth+1);out.push({object:'block',type:b.type,[b.type]:v});}return out;}
        let richNotes;try{richNotes=RexRichDoc.normalize(await richChildren(blocks),1000,500000);}catch(error){richNotes=null;}
        return finish(json({ notes:richNotes?RexRichDoc.plain(richNotes).split('\n'):notes, media,richNotes }));
      }
      const media = path.match(/^\/api\/media\/([0-9a-f-]{36})\/([0-9a-f-]{36})$/i);
      if (media && request.method === 'GET') {
        const page = await notion(env, `pages/${media[1]}`);
        if (!belongs(env, page)) throw fail('无法访问此附件。', 403);
        const block = await notion(env, `blocks/${media[2]}`);
        if (block.parent?.page_id !== page.id || !['image','audio','file','pdf','video'].includes(block.type)) throw fail('无法访问此附件。', 403);
        const url = block[block.type]?.file?.url;
        if (!url) throw fail('请在 Notion 中打开此外部附件。', 404);
        const response = await fetch(url);
        if (!response.ok) throw fail('附件读取失败。', 502);
        return finish(new Response(response.body, { headers: { 'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Content-Disposition': 'attachment' } }));
      }
      return finish(json({ error: '接口不存在。' }, 404));
    } catch (e) { return finish(json({ error: e.message }, e.status || 500)); }
  }
};

// One object per database serializes website submissions, including concurrent tabs.
export class Calendar {
  constructor(state, env) { this.state = state; this.env = env; this.queue = Promise.resolve(); }
  fetch(request) {
    const result = this.queue.then(() => new URL(request.url).pathname.startsWith('/api/focus/')?focusHandle(request,this.state):new URL(request.url).pathname.startsWith('/api/reading/')?readingHandle(request,this.state,this.env):this.submit(request));
    this.queue = result.catch(() => {});
    return result.catch(e => json({ error: e.message }, e.status || 500));
  }
  alarm(){const result=this.queue.then(()=>focusAlarm(this.state));this.queue=result.catch(()=>{});return result;}
  async submit(request) {
    const form = await request.formData();
    const id = String(form.get('id') || ''), date = String(form.get('date') || ''), note = String(form.get('note') || '').trim(), requestedCategory = String(form.get('category') || ''), category = requestedCategory === 'skill' ? 'reflection' : requestedCategory;
    let structured=null;if(form.has('richNote')){try{structured=RexRichDoc.normalize(JSON.parse(String(form.get('richNote'))));}catch(error){throw fail(error.message,400);}}
    const files = form.getAll('files').filter(f => typeof f !== 'string' && f.size);
    if (!/^[0-9a-f-]{36}$/i.test(id) || !validDate(date) || !categories[category] || note.length > 2000 || (!note && !files.length)) throw fail('请填写有效日期、分类、任务或附件。');
    if (files.length > 16 || files.reduce((s,f) => s + f.size, 0) > LIMIT) throw fail('最多 16 个附件，总大小不能超过 20 MiB。', 413);
    const cached = await this.state.storage.get('receipt:' + id);
    if (cached) return json(cached);
    const env = this.env;
    const found = await notion(env, `data_sources/${env.NOTION_DATA_SOURCE_ID}/query`, 'POST', { filter: { property: 'Date', date: { equals: date } }, sorts: [{ timestamp: 'created_time', direction: 'ascending' }], page_size: 1 });
    let page = found.results[0];
    if (!page) page = await notion(env, 'pages', 'POST', { parent: { type: 'data_source_id', data_source_id: env.NOTION_DATA_SOURCE_ID }, properties: { Name: { title: rich(`${date} · 每日任务`) }, Date: { date: { start: date } } } });
    const receipt = { pageId: page.id, url: page.url, date };
    // Recover from a lost response or restart after Notion accepted the append.
    const existing = await children(env, page.id);
    if (!existing.some(b => marker(b, id))) {
      const blocks = [{ object: 'block', type: 'heading_3', heading_3: { rich_text: [...rich(categories[category]), { type: 'text', text: { content: ' · 网站记录', link: { url: `${env.ALLOWED_ORIGIN}/rx/#submission=${id}` } } }] } }];
      if (note&&!structured) blocks.push({ object: 'block', type: 'to_do', to_do: { rich_text: rich(note), checked: false } });
      for (const file of files) {
        const contentType = uploadType(file);
        const upload = await notion(env, 'file_uploads', 'POST', { mode: 'single_part', filename: file.name, content_type: contentType });
        const data = new FormData(); data.append('file', new Blob([file], { type: contentType }), file.name);
        const sent = await notion(env, `file_uploads/${upload.id}/send`, 'POST', data);
        if (sent.status !== 'uploaded') throw fail('附件尚未上传完成，请稍后重试。', 502);
        const type = contentType.startsWith('image/') ? 'image' : contentType.startsWith('audio/') ? 'audio' : contentType === 'application/pdf' ? 'pdf' : contentType.startsWith('video/') ? 'video' : 'file';
        blocks.push({ object: 'block', type, [type]: { type: 'file_upload', file_upload: { id: upload.id }, caption: rich(file.name) } });
      }
      if(structured){
        const completeTitle=blocks[0].heading_3.rich_text;
        blocks[0].heading_3.rich_text=rich(categories[category]);
        const pendingTitle='Sync in progress · '+id;
        const prior=existing.find(b=>b.type==='toggle'&&readingText(b)===pendingTitle&&!b.archived);
        let pending=prior;
        if(!pending){
          const title=String(form.get('richTitle')||note.split('\n\n')[0]||'Practice notes').slice(0,200);
          blocks.push({object:'block',type:'paragraph',paragraph:{rich_text:rich(title)}});
          blocks.push({object:'block',type:'toggle',toggle:{rich_text:rich(pendingTitle)}});
          const appended=await notion(env,`blocks/${page.id}/children`,'PATCH',{children:blocks});
          pending=appended.results?.at(-1);if(!pending)throw fail('Could not save the practice note.',502);
        }
        const staged=await children(env,pending.id);for(const b of staged)if(!b.archived)await notion(env,'blocks/'+b.id,'PATCH',{archived:true});
        await appendRichBlocks(env,pending.id,structured.length?structured:[readingBlock('paragraph','No note content.')]);
        await notion(env,'blocks/'+pending.id,'PATCH',{toggle:{rich_text:[...rich('Practice notes'),completeTitle.at(-1)]}});
      }else await notion(env, `blocks/${page.id}/children`, 'PATCH', { children: blocks });
    }
    await this.state.storage.put('receipt:' + id, receipt);
    return json(receipt);
  }
}


(function(root){'use strict';
const colors=new Set(['default','gray','brown','orange','yellow','green','blue','purple','pink','red'].flatMap(c=>c==='default'?[c]:[c,c+'_background']));
const types=new Set(['paragraph','heading_1','heading_2','heading_3','bulleted_list_item','numbered_list_item','quote','callout','to_do','toggle','code','divider','table','table_row']);
function text(items){return (items||[]).map(t=>t.text?.content??t.plain_text??'').join('');}
function spans(items){if(!Array.isArray(items)||items.length>100)throw Error('Too many text fragments.');return items.flatMap(t=>{if(t.type&&t.type!=='text')throw Error('This Notion text type is not supported; the original is retained.');const value=t.text?.content??t.plain_text??'';if(typeof value!=='string')throw Error('Invalid text.');const a=t.annotations||{},annotations={};for(const k of ['bold','italic','underline','strikethrough','code'])if(a[k])annotations[k]=true;if(a.color&&a.color!=='default'){if(!colors.has(a.color))throw Error('Invalid color.');annotations.color=a.color;}const link=t.text?.link?.url||t.href;if(link&&!/^https?:\/\//i.test(link))throw Error('Only HTTP and HTTPS links are supported.');const out=[];for(let i=0;i<value.length;i+=1800)out.push({type:'text',text:{content:value.slice(i,i+1800),...(link?{link:{url:link}}:{})},...(Object.keys(annotations).length?{annotations}:{})});return out;});}
function normalize(input,maxBlocks=90,maxChars=50000){let count=0,chars=0;function walk(rows,depth=0){if(!Array.isArray(rows)||depth>8)throw Error('Note structure is too deeply nested.');return rows.map(b=>{if(++count>maxBlocks)throw Error('Use at most 90 note blocks.');if(!types.has(b.type))throw Error('Unsupported Notion block: '+b.type+'. The original is retained.');const t=b.type,v=b[t]||{},data={};if(t==='divider')return {object:'block',type:t,[t]:data};if(t==='table'){data.table_width=v.table_width;if(!Number.isInteger(data.table_width)||data.table_width<1||data.table_width>12)throw Error('Invalid table width.');data.has_column_header=!!v.has_column_header;data.has_row_header=!!v.has_row_header;data.children=walk(v.children||[],depth+1);if(!data.children.length||data.children.some(r=>r.type!=='table_row'||r.table_row.cells.length!==data.table_width))throw Error('Invalid table.');}else if(t==='table_row'){if(!Array.isArray(v.cells))throw Error('Invalid table row.');data.cells=v.cells.map(spans);chars+=data.cells.reduce((n,c)=>n+text(c).length,0);}else{data.rich_text=spans(v.rich_text||[]);chars+=text(data.rich_text).length;if(t==='code')data.language='plain text';else if(v.color&&v.color!=='default'){if(!colors.has(v.color))throw Error('Invalid block color.');data.color=v.color;}if(t==='to_do')data.checked=!!v.checked;if(t==='callout')data.icon={type:'emoji',emoji:'💡'};if(v.children?.length){if(t==='code'||t==='table_row')throw Error('Invalid nested block.');data.children=walk(v.children,depth+1);}}
 return {object:'block',type:t,[t]:data};});}const result=walk(input);if(chars>maxChars)throw Error('Note text is too long.');return result;}
function plain(doc){return (doc||[]).map(b=>{const v=b[b.type]||{};return b.type==='table_row'?(v.cells||[]).map(text).join(' | '):[text(v.rich_text),v.children?.length?plain(v.children):''].filter(Boolean).join('\n');}).join('\n');}
root.RexRichDoc={normalize,plain,text};if(typeof module!=='undefined')module.exports=root.RexRichDoc;
})(globalThis);

async function appendRichBlocks(env,parent,blocks){
 const shallow=blocks.map(b=>{const v={...b[b.type]};if(b.type!=='table')delete v.children;return {object:'block',type:b.type,[b.type]:v};});
 const result=await notion(env,'blocks/'+parent+'/children','PATCH',{children:shallow});
 for(let i=0;i<blocks.length;i++){const b=blocks[i],nested=b[b.type]?.children;if(nested?.length&&b.type!=='table'){const id=result.results?.[i]?.id;if(!id)throw fail('Could not save nested note content.',502);await appendRichBlocks(env,id,nested);}}
}

// Independent reading data source; credentials remain in Cloudflare secrets.
const READING_SOURCE = '3fd0d1ce-21d1-8046-a3e4-000bae86ce0d';
const READING_DB = '3fd0d1ce-21d1-808a-b9dd-c1201cb27918';
const readingText = b => (b?.[b.type]?.rich_text || []).map(t => t.plain_text ?? t.text?.content ?? '').join('');
const readingUUID = s => typeof s === 'string' && /^[0-9a-f-]{36}$/i.test(s);
function readingParts(s) { const out=[]; for(let i=0;i<s.length;i+=1800) out.push(s.slice(i,i+1800)); return out.length?out:['']; }
const readingBlock = (type,text) => ({object:'block',type,[type]:{rich_text:readingParts(text).flatMap(rich)}});
const readingBelongs = page => page.parent?.data_source_id===READING_SOURCE || page.parent?.database_id===READING_DB;
async function readingPages(env) {
 const pages=[]; let cursor;
 do { const result=await notion(env,'data_sources/'+READING_SOURCE+'/query','POST',{page_size:100,...(cursor?{start_cursor:cursor}:{})}); pages.push(...result.results); cursor=result.has_more?result.next_cursor:null; if(pages.length>2000)throw fail('阅读记录超出加载上限。',413); } while(cursor);
 return pages;
}
async function readingSnapshot(env,page,state) {
 const stored=state&&await state.storage.get("reading-record:"+page.id);
 if(stored){
  const checked=await state.storage.get('reading-checked:'+page.id);if(page.last_edited_time&&checked?.edited===page.last_edited_time&&Date.now()-checked.at<30000)return {...stored,remotePageId:page.id,notionUrl:page.url};
  const top=(await children(env,page.id)).filter(b=>!b.archived&&!b.in_trash);
  const roots=top.filter(b=>b.type==='toggle'&&/^(读书笔记|文章笔记|Reading notes|Article notes)/.test(readingText(b)));
  async function readDoc(rows,depth=0){if(depth>8)throw fail('Note nesting exceeds the editor limit. The original is retained.',409);const result=[];for(const b of rows){if(b.archived||b.in_trash||['file','pdf','image','audio','video'].includes(b.type))continue;const type=b.type,v={...b[type]};if(b.has_children||v.children?.length)v.children=await readDoc(v.children||await children(env,b.id),depth+1);result.push({object:'block',type,[type]:v});}return result;}
  let doc=await readDoc(roots.length?await children(env,roots.at(-1).id):[]);
  doc.push(...await readDoc(top.filter(b=>b.type!=='toggle')));
  doc=RexRichDoc.normalize(doc);
  if(doc.length===1&&RexRichDoc.plain(doc)==='暂无笔记'&&!stored.body&&!(stored.logs||[]).length)doc=[];
  const title=(page.properties?.Name?.title||[]).map(t=>t.plain_text??t.text?.content??'').join('')||stored.title;
  const date=page.properties?.Date?.date?.start?.slice(0,10)||stored.writtenDate;
  let body='',url=stored.url||'',logs=[],richBody;
  if(stored.kind==='article'){
   if(doc[0]?.type==='paragraph'&&RexRichDoc.text(doc[0].paragraph.rich_text).startsWith('原文：'))url=RexRichDoc.text(doc.shift().paragraph.rich_text).slice(3);
   richBody=doc;body=RexRichDoc.plain(doc);
  }else{let current;const used=new Set();for(const block of doc){const label=RexRichDoc.text(block[block.type]?.rich_text);if(block.type==='heading_3'&&/^\d{4}-\d{2}-\d{2}$/.test(label)){const old=(stored.logs||[]).find((n,i)=>n.date===label&&!used.has(i));if(old)used.add(stored.logs.indexOf(old));current={id:old?.id||crypto.randomUUID(),date:label,note:'',richNote:[]};logs.push(current);}else{if(!current)throw fail('Book notes need a date heading before their content. The original is retained.',409);current.richNote.push(block);}}for(const log of logs)log.note=RexRichDoc.plain(log.richNote);}
  const projection={title,writtenDate:date,body:stored.kind==='article'?body:stored.body,logs:stored.kind==='book'?logs:stored.logs,url,...(stored.kind==='article'?{richBody}:{})};
  const expected={title:stored.title,writtenDate:stored.writtenDate,body:stored.body,logs:stored.logs,url:stored.url||'',...(stored.kind==='article'&&stored.richBody?{richBody:stored.richBody}:{})};
  let result=stored;
  if(JSON.stringify(projection)!==JSON.stringify(expected)){
   const revision=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(projection))))).map(x=>x.toString(16).padStart(2,'0')).join('');
   result={...stored,...projection,source:title,noteTitle:title,updated:page.last_edited_time||new Date().toISOString(),remoteRevision:revision};await state.storage.put('reading-record:'+page.id,result);
  }
  if(page.last_edited_time)await state.storage.put('reading-checked:'+page.id,{edited:page.last_edited_time,at:Date.now()});
  return {...result,remotePageId:page.id,notionUrl:page.url};
 }
 const versions=(await children(env,page.id)).filter(b=>b.type==='toggle'&&readingText(b).startsWith('REX-READING:'));
 if(!versions.length)return null;
 const latest=versions.at(-1),parts=readingText(latest).split(':'),body=await children(env,latest.id),meta=body.find(b=>b.type==='toggle'&&readingText(b)==='网站同步数据');
 if(!meta)throw fail('阅读同步数据不完整，未覆盖本机笔记。',502);
 const code=await children(env,meta.id);let item;
 try{item=JSON.parse(code.filter(b=>b.type==='code').map(readingText).join(''));}catch{throw fail('阅读同步数据格式无效。',502);}
 if(item.id!==parts[1])throw fail('阅读记录标识不匹配。',502);
 let index=0;const media=body.filter(b=>['file','pdf','audio','image'].includes(b.type));
 for(const file of item.attachments||[])if(!file.blockId&&media[index])file.blockId=media[index++].id;
 return {...item,remotePageId:page.id,remoteRevision:parts.slice(2).join(':'),notionUrl:page.url};
}
async function readingHandle(request,state,env) {
 const url=new URL(request.url),path=url.pathname;

 if(path==='/api/reading/migrate'&&request.method==='POST'){
  let count=0;for(const page of await readingPages(env)){const record=await readingSnapshot(env,page,state);if(!record)continue;const top=await children(env,page.id);
   // Persist recovery information before removing visible technical blocks.
   await state.storage.put('reading-record:'+page.id,record);await state.storage.put('reading-page:'+record.id,page.id);
   for(const version of top.filter(b=>b.type==='toggle'&&readingText(b).startsWith('REX-READING:'))){
    const nested=await children(env,version.id);
    for(const meta of nested.filter(b=>b.type==='toggle'&&readingText(b)==='网站同步数据'))await notion(env,'blocks/'+meta.id,'PATCH',{archived:true});
    await notion(env,'blocks/'+version.id,'PATCH',{toggle:{rich_text:rich(record.kind==='book'?'读书笔记':('文章笔记 · '+record.writtenDate))}});
   }count++;
  }return json({ok:true,migrated:count});
 }
 if(path==='/api/reading/status'&&request.method==='GET'){await notion(env,'data_sources/'+READING_SOURCE);return json({ok:true,databaseId:READING_DB,name:'Reading and growth'});}
 if(path==='/api/reading/records'&&request.method==='GET'){
  const records=[];for(const page of await readingPages(env)){const item=await readingSnapshot(env,page,state);if(item)records.push(item);}const deleted=await state.storage.list({prefix:'reading-tombstone:'});records.push(...deleted.values());return json({records,complete:true});
 }
 if(path==='/api/reading/media'&&request.method==='GET'){
  const pageId=url.searchParams.get('page'),fileId=url.searchParams.get('file');
  if(!readingUUID(pageId)||!readingUUID(fileId))throw fail('附件地址无效。');
  const page=await notion(env,'pages/'+pageId);if(!readingBelongs(page)||page.archived||page.in_trash)throw fail('Cannot access this attachment.',403);
  const snapshot=await readingSnapshot(env,page,state),file=snapshot?.attachments?.find(f=>f.id===fileId);
  if(!file?.blockId)throw fail('此附件已移除或不存在。',404);
  const block=await notion(env,'blocks/'+file.blockId),address=block[block.type]?.file?.url;
  if(!address)throw fail('附件不可用。',404);
  const response=await fetch(address);if(!response.ok)throw fail('附件读取失败。',502);
  return new Response(response.body,{headers:{'Content-Type':response.headers.get('Content-Type')||'application/octet-stream','X-Content-Type-Options':'nosniff','Content-Disposition':'attachment'}});
 }
 if(path!=='/api/reading/records'||request.method!=='POST')throw fail('阅读接口不存在。',404);
 const form=await request.formData();let item;try{item=JSON.parse(String(form.get('record')||''));}catch{throw fail('阅读记录格式无效。');}
 if(!item||!readingUUID(item.id)||!['book','article'].includes(item.kind)||typeof item.title!=='string'||!item.title.trim()||item.title.length>200||!Array.isArray(item.logs)||!Array.isArray(item.attachments||[]))throw fail('阅读记录不完整。');

 if(item.deleted===true){
  const pageId=await state.storage.get('reading-page:'+item.id);
  if(pageId){const page=await notion(env,'pages/'+pageId);if(!readingBelongs(page))throw fail('Cannot access this reading record.',403);if(!page.archived&&!page.in_trash)await notion(env,'pages/'+pageId,'PATCH',{archived:true});}
  const record={id:item.id,kind:item.kind,title:item.title,body:'',logs:[],attachments:[],deleted:true,updated:item.updated,remoteRevision:'deleted:'+item.updated,remotePageId:pageId};
  await state.storage.put('reading-tombstone:'+item.id,record);return json({record});
 }
 if(await state.storage.get('reading-tombstone:'+item.id))throw fail('This reading record was deleted. Refresh to load the latest records.',409);
 if(typeof item.body!=='string'||item.body.length>50000||item.logs.length>40||item.logs.some(l=>!l||!validDate(l.date)||typeof l.note!=='string'||l.note.length>50000))throw fail('笔记内容过长或日期无效。');
 if(JSON.stringify(item).length>120000)throw fail('单条记录内容超出同步上限。',413);
 if(item.kind==='article'&&!validDate(item.writtenDate))throw fail('笔记日期无效。');
 if(item.url){try{if(!['https:','http:'].includes(new URL(item.url).protocol))throw Error();}catch{throw fail('原文链接无效。');}}
 const files=form.getAll('files').filter(f=>typeof f!=='string'),attachments=item.attachments||[];
 if(attachments.length>10||files.reduce((sum,f)=>sum+f.size,0)>LIMIT)throw fail('最多 10 个附件，每次同步附件总大小不超过 20 MiB。',413);
 if(attachments.some(f=>!f||!readingUUID(f.id)||typeof f.name!=='string'||f.name.length>200))throw fail('附件信息无效。');
 if(item.kind==='article'&&!item.richBody)item.richBody=item.body?[readingBlock('paragraph',item.body)]:[];
 for(const log of item.logs){if(!log.id)log.id=crypto.randomUUID();if(!log.richNote)log.richNote=log.note?[readingBlock('paragraph',log.note)]:[];}
 if(item.richBody){item.richBody=RexRichDoc.normalize(item.richBody);item.body=RexRichDoc.plain(item.richBody);}
 for(const log of item.logs)if(log.richNote){log.richNote=RexRichDoc.normalize(log.richNote);log.note=RexRichDoc.plain(log.richNote);}
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(item))))).map(x=>x.toString(16).padStart(2,'0')).join('');
 const receiptKey='reading-receipt:'+item.id+':'+hash,cached=await state.storage.get(receiptKey);if(cached)return json(cached);
 let pageId=await state.storage.get('reading-page:'+item.id),page;
 if(pageId){page=await notion(env,'pages/'+pageId);if(!readingBelongs(page)||page.archived||page.in_trash)throw fail('Notion 记录已移动或移除。',409);}
 if(!page)for(const candidate of await readingPages(env)){const stored=await state.storage.get('reading-record:'+candidate.id);const blocks=stored?[]:await children(env,candidate.id);if(stored?.id===item.id||blocks.some(b=>b.type==='toggle'&&readingText(b).startsWith('REX-READING:'+item.id+':'))){page=candidate;break;}}
 const previous=page?await readingSnapshot(env,page,state):null;
 if(previous?.remoteRevision===hash){const receipt={record:previous};await state.storage.put('reading-page:'+item.id,page.id);await state.storage.put(receiptKey,receipt);return json(receipt);}
 if(previous&&previous.remoteRevision!==(item.remoteRevision||''))throw fail('此笔记已在其他设备更新，请先拉取最新记录。',409);
 const mapped=[],fileBlocks=[];
 for(const file of attachments){
  const old=previous?.attachments?.find(f=>f.id===file.id);
  if(old?.blockId){const contentType=old.type||'application/octet-stream',type=contentType.startsWith('image/')?'image':contentType.startsWith('audio/')?'audio':contentType==='application/pdf'?'pdf':'file';if(old.uploadId){fileBlocks.push({object:'block',type,[type]:{type:'file_upload',file_upload:{id:old.uploadId},caption:rich(file.name)}});const next={...old,name:file.name};delete next.blockId;mapped.push(next);}else mapped.push({...old,name:file.name});continue;}
  const bytes=files.find(f=>f.name===file.id);if(!bytes)throw fail('找不到附件，请重新选择文件。');
  const contentType=uploadType({name:file.name,type:bytes.type}),upload=await notion(env,'file_uploads','POST',{mode:'single_part',filename:file.name,content_type:contentType});
  const data=new FormData();data.append('file',new Blob([bytes],{type:contentType}),file.name);
  const sent=await notion(env,'file_uploads/'+upload.id+'/send','POST',data);if(sent.status!=='uploaded')throw fail('附件上传尚未完成。',502);
  const type=contentType.startsWith('image/')?'image':contentType.startsWith('audio/')?'audio':contentType==='application/pdf'?'pdf':'file';
  fileBlocks.push({object:'block',type,[type]:{type:'file_upload',file_upload:{id:upload.id},caption:rich(file.name)}});mapped.push({...file,uploadId:upload.id});
 }
 const body=[];
 if(item.kind==='article'){if(item.url)body.push(readingBlock('paragraph','原文：'+item.url));if(item.richBody)body.push(...item.richBody);else if(item.body)body.push(readingBlock('paragraph',item.body));}
 else for(const log of item.logs){body.push(readingBlock('heading_3',log.date));if(log.richNote)body.push(...log.richNote);else body.push(readingBlock('paragraph',log.note));}
 body.push(...fileBlocks);if(body.length>95)throw fail('笔记数量超过单次同步上限。',413);
 const clean={id:item.id,kind:item.kind,title:item.title,source:item.source||item.title,noteTitle:item.title,body:item.body,...(item.richBody?{richBody:item.richBody}:{}),logs:item.logs,attachments:mapped,writtenDate:item.writtenDate||null,createdAt:item.createdAt,updated:item.updated,status:item.status||'reading',url:item.kind==='article'?(item.url||''):''};
 const version={object:'block',type:'toggle',toggle:{rich_text:[...rich(item.kind==='book'?'读书笔记':('文章笔记 · '+item.writtenDate)),{type:'text',text:{content:' · 网站记录',link:{url:'https://xre01.github.io/rx/#reading-revision='+hash}}}],children:[]}};
 const finalVersionTitle=version.toggle.rich_text;version.toggle.rich_text=rich('Sync in progress');
 const properties={Name:{title:rich(item.title)},Date:{date:item.kind==='article'?{start:item.writtenDate}:null}};
 if(!page)page=await notion(env,'pages','POST',{parent:{type:'data_source_id',data_source_id:READING_SOURCE},properties,children:[version]});
 else{await notion(env,'blocks/'+page.id+'/children','PATCH',{children:[version]});await notion(env,'pages/'+page.id,'PATCH',{properties});}
 await state.storage.put('reading-page:'+item.id,page.id);
 const top=await children(env,page.id),root=top.filter(b=>b.type==='toggle'&&!b.archived).at(-1);if(!root)throw fail('Could not locate the saved note.',502);await appendRichBlocks(env,root.id,body.length?body:[readingBlock('paragraph','暂无笔记')]);await notion(env,'blocks/'+root.id,'PATCH',{toggle:{rich_text:finalVersionTitle}});const saved=await children(env,root.id);let index=0;for(const file of mapped)if(!file.blockId){const block=saved.filter(b=>['file','pdf','audio','image'].includes(b.type))[index++];if(block)file.blockId=block.id;}
 const result={...clean,attachments:mapped,remotePageId:page.id,remoteRevision:hash,notionUrl:page.url},receipt={record:result};await state.storage.put('reading-record:'+page.id,result);await state.storage.put(receiptKey,receipt);for(const old of top.filter(b=>b.id!==root?.id&&b.type==='toggle'&&/^(读书笔记|文章笔记|Reading notes|Article notes)/.test(readingText(b))))await notion(env,'blocks/'+old.id,'PATCH',{archived:true});return json(receipt);
}


// Empty-payload Web Push: timer details stay in this device's authenticated state endpoint.
const focusB64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
async function focusHash(value){return focusB64(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));}
function focusEndpoint(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&value.length<4096&&(u.hostname.endsWith('.push.apple.com')||u.hostname==='fcm.googleapis.com'||u.hostname==='updates.push.services.mozilla.com'||u.hostname.endsWith('.notify.windows.com'));}catch{return false;}}
async function focusJSON(request){const reader=request.body?.getReader();if(!reader)return {};let size=0,chunks=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>8192){await reader.cancel();throw fail('Reminder request is too large.',413);}chunks.push(value);}return JSON.parse(await new Blob(chunks).text());}
async function focusHandle(request,state){const path=new URL(request.url).pathname,action=path.split('/').at(-1);let config=await state.storage.get('focus:config');
 if(action==='register'&&request.method==='POST'){
  const body=await focusJSON(request);if(!/^[A-Za-z0-9_-]{43}$/.test(body.key||''))throw fail('Invalid device key.');const hash=await focusHash(body.key);
  if(config&&config.keyHash!==hash)throw fail('This reminder device already exists.',409);
  if(!config){const pair=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);config={keyHash:hash,privateKey:await crypto.subtle.exportKey('jwk',pair.privateKey),publicKey:focusB64(await crypto.subtle.exportKey('raw',pair.publicKey))};await state.storage.put('focus:config',config);}
  return json({publicKey:config.publicKey});
 }
 if(!config||await focusHash(request.headers.get('X-Focus-Key')||'')!==config.keyHash)throw fail('Reminder device is not authorized.',401);
 if(action==='state'&&request.method==='GET'){const reminder=await state.storage.get('focus:reminder');return json({enabled:!!config.endpoint,reminder:reminder||null});}
 const body=await focusJSON(request);
 if(action==='subscription'&&request.method==='POST'){if(!focusEndpoint(body.endpoint))throw fail('Unsupported push service.');config.endpoint=body.endpoint;await state.storage.put('focus:config',config);return json({ok:true});}
 if(action==='disable'&&request.method==='POST'){delete config.endpoint;await state.storage.put('focus:config',config);await state.storage.deleteAlarm();await state.storage.delete('focus:reminder');return json({ok:true});}
 if(action==='schedule'&&request.method==='POST'){
  if(!config.endpoint)throw fail('Enable notifications again.',409);
  if(!Number.isSafeInteger(body.version)||body.version<=0)throw fail('Invalid reminder revision.');
  const previous=await state.storage.get('focus:reminder');if(previous&&body.version<=previous.version)return json({ok:true,reminder:previous});
  const reminder={version:body.version,status:'cancelled',dueAt:null,test:!!body.test};
  if(body.dueAt!==null){if(!Number.isSafeInteger(body.dueAt)||body.dueAt<Date.now()+500||body.dueAt>Date.now()+10805000)throw fail('Choose a future countdown within 180 minutes.');reminder.dueAt=body.dueAt;reminder.status='scheduled';}
  await state.storage.put('focus:reminder',reminder);if(reminder.dueAt)await state.storage.setAlarm(reminder.dueAt);else await state.storage.deleteAlarm();return json({ok:true,reminder});
 }
 throw fail('Reminder endpoint not found.',404);
}
async function focusAlarm(state){const config=await state.storage.get('focus:config'),r=await state.storage.get('focus:reminder');if(!config?.endpoint||r?.status!=='scheduled')return;
 if(r.dueAt>Date.now()+250){await state.storage.setAlarm(r.dueAt);return;}if(Date.now()-r.dueAt>90000){await state.storage.put('focus:reminder',{...r,status:'expired'});return;}
 const audience=new URL(config.endpoint).origin;let auth=await state.storage.get('focus:vapid');
 if(!auth||auth.aud!==audience||Date.now()-auth.createdAt>3600000){const head=focusB64(new TextEncoder().encode(JSON.stringify({typ:'JWT',alg:'ES256'}))),claims=focusB64(new TextEncoder().encode(JSON.stringify({aud:audience,exp:Math.floor(Date.now()/1000)+21600,sub:'https://xre01.github.io/rx/'}))),message=head+'.'+claims,key=await crypto.subtle.importKey('jwk',config.privateKey,{name:'ECDSA',namedCurve:'P-256'},false,['sign']),signature=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,new TextEncoder().encode(message));auth={aud:audience,createdAt:Date.now(),jwt:message+'.'+focusB64(signature)};await state.storage.put('focus:vapid',auth);}
 const response=await fetch(config.endpoint,{method:'POST',redirect:'manual',headers:{Authorization:'vapid t='+auth.jwt+', k='+config.publicKey,TTL:'60',Urgency:'high',Topic:'rex-focus'},signal:AbortSignal.timeout(10000)});
 if(response.status===404||response.status===410){delete config.endpoint;await state.storage.put('focus:config',config);await state.storage.put('focus:reminder',{...r,status:'subscription-expired'});return;}
 if(!response.ok){if(response.status>=500||response.status===429)throw Error('Push service temporarily unavailable.');await state.storage.put('focus:reminder',{...r,status:'failed'});return;}
 await state.storage.put('focus:reminder',{...r,status:'sent'});
}
