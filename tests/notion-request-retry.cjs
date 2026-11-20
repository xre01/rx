const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('workers/notion-worker.mjs','utf8'),code=source.slice(source.indexOf('async function notion('),source.indexOf('async function children('));
function boot(responses){const calls=[],delays=[],timeouts=[];const ctx={FormData,VERSION:'2025-09-03',Date,Number,Error,fail:(message,status)=>Object.assign(Error(message),{status}),AbortSignal:{timeout:ms=>{timeouts.push(ms);return AbortSignal.timeout(ms)}},setTimeout:(resolve,ms)=>{delays.push(ms);resolve()},fetch:async(url,options)=>{calls.push({url,options});const response=responses.shift();if(response instanceof Error)throw response;return response}};vm.createContext(ctx);vm.runInContext(code+';globalThis.call=notion',ctx);return {calls,delays,timeouts,call:(method='GET',path='pages/test')=>ctx.call({NOTION_TOKEN:'test-only'},path,method,method==='GET'?undefined:{})}}
(async()=>{
 let app=boot([Response.json({},{status:429,headers:{'Retry-After':'2'}}),Response.json({ok:true})]);assert.equal((await app.call()).ok,true);assert.deepEqual(app.delays,[2000]);assert.deepEqual(app.timeouts,[20000,20000]);
 app=boot([Response.json({},{status:503}),Response.json({ok:true})]);await app.call('POST','data_sources/test/query');assert.equal(app.calls.length,2);
 app=boot([Response.json({},{status:503})]);await assert.rejects(app.call('POST','pages'));assert.equal(app.calls.length,1,'ambiguous writes are not replayed');
 app=boot([new TypeError('interrupted')]);await assert.rejects(app.call('POST','pages'),e=>e.status===503);assert.equal(app.calls.length,1);
 app=boot([Response.json({},{status:401})]);await assert.rejects(app.call());assert.equal(app.calls.length,1);
 app=boot([Response.json({},{status:429,headers:{'Retry-After':'60'}})]);await assert.rejects(app.call(),e=>e.status===503);assert.equal(app.calls.length,1);assert.equal(app.delays.length,0,'long rate limits return without blocking the object queue');
 console.log('PASS: Notion timeout, Retry-After, read/query retries, auth failures and no automatic replay of ambiguous writes');
})().catch(e=>{console.error(e);process.exitCode=1});
