const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');const source=fs.readFileSync('reading.js','utf8'),a=source.indexOf('async function syncReading(){'),b=source.indexOf('async function openReadingFile',a);let queued=0,get=0,fail=false;const ctx={loadLibrary:()=>!ctx.storageError,storageError:"",readingSyncBusy:false,readingConnected:true,readingConnectionAbort:{signal:{aborted:false}},readingKey:{value:"test"},readingSyncError:'',readingMigrationDone:true,readingSyncedAt:0,readingSummary:{},readingSyncMessage:{},feedback:{},records:[{id:'note',title:'A',updated:'edit1',remoteRevision:1,syncedUpdated:'old',attachments:[],logs:[]}],key:'library',localStorage:{setItem(){}},readingDirty:r=>r.syncedUpdated!==r.updated,readingTags:r=>r.tags||[],updateReadingXp(){},render(){},updateSyncStatus(){},queueReadingSync(){queued++},FormData:class{append(){}},Date,readingRequest:async(path,options={})=>{if(fail)throw Error('Conflict');if(options.method==='POST'){ctx.records=[{...ctx.records[0],updated:'edit2',body:'Latest edit'}];return{record:{id:'note',title:'A',updated:'edit1',remoteRevision:2}}}get++;return{records:[],complete:true}}};vm.createContext(ctx);vm.runInContext(source.slice(a,b),ctx);(async()=>{await ctx.syncReading();assert.equal(ctx.records[0].updated,'edit2');assert.equal(ctx.records[0].body,'Latest edit');assert.equal(ctx.records[0].remoteRevision,2);assert.equal(queued,1);assert.equal(ctx.readingSyncBusy,false);fail=true;queued=0;await ctx.syncReading();assert.equal(queued,0);assert.equal(ctx.readingSyncError,'Conflict');assert.equal(ctx.records[0].body,'Latest edit');fail=false;
 const tomb={id:'note',title:'A',updated:'removed',deleted:true,logs:[]};
 ctx.records.push({id:'other',title:'B',updated:'second',logs:[]});
 ctx.readingRequest=async(path,options={})=>options.method==='POST'?{record:{id:'other',title:'B',updated:'second',remoteRevision:1,logs:[]}}:{records:[tomb],complete:true};
 await ctx.syncReading();assert.equal(ctx.records[0].body,'Latest edit');assert.match(ctx.readingSyncError,/Deleted on another device/);assert.equal(ctx.records[1].syncedUpdated,'second');
 ctx.records=[{id:'tagged',title:'Tagged',updated:'new',syncedUpdated:'old',tags:['Ideas'],remoteRevision:'old',logs:[],attachments:[]}];
 ctx.readingRequest=async(path,options={})=>options.method==='POST'?{record:{id:'tagged',updated:'new',remoteRevision:'server-accepted',logs:[]}}:{records:[],complete:true};
 await ctx.syncReading();assert.deepEqual(ctx.records[0].tags,['Ideas']);assert.equal(ctx.records[0].remoteRevision,'server-accepted');assert.equal(ctx.records[0].syncedUpdated,'old');assert.match(ctx.readingSyncError,/needs the tags update/);
 let attemptedWrites=0;ctx.records=[{id:'one',title:'One',updated:'now',logs:[],attachments:[]},{id:'two',title:'Two',updated:'now',logs:[],attachments:[]}];ctx.readingRequest=async(path,options={})=>{if(options.method==='POST'){attemptedWrites++;ctx.readingConnectionAbort.signal.aborted=true;throw Error('Connection changed')}return {records:[],complete:true}};await ctx.syncReading();assert.equal(attemptedWrites,1,'abort stops the batch before a second write');ctx.readingConnectionAbort.signal.aborted=false;
 ctx.storageError='Damaged library';let writes=0;ctx.localStorage.setItem=()=>writes++;await ctx.syncReading();assert.equal(writes,0);assert.equal(ctx.readingSyncError,ctx.storageError);
 // Verify the real loader protects the original bytes, including malformed array entries.
 const loader=source.slice(source.indexOf('function loadLibrary(){'),source.indexOf('loadLibrary();'));
 vm.runInContext(loader,ctx);
 for(const raw of ['truncated',JSON.stringify([{id:'bad'}])]){
  ctx.localStorage.getItem=()=>raw;
  await ctx.syncReading();
  assert.match(ctx.readingSyncError,/storage could not be loaded/);
  assert.equal(writes,0);
 }
 console.log('PASS: edits during sync are preserved and requeued; failures retain data without retry loops')})().catch(e=>{console.error(e);process.exit(1)});

