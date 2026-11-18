const fs=require('fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://test.invalid',runScripts:'outside-only'}),w=dom.window,q=s=>w.document.querySelector(s);
const focused=async selector=>{for(let i=0;i<100&&w.document.activeElement!==q(selector);i++)await new Promise(r=>setTimeout(r,5));assert.equal(w.document.activeElement,q(selector))};
w.matchMedia=()=>({matches:false,addEventListener(){}});w.scrollTo=()=>{};w.RexDashboardStore={summary:()=>({days:[],counts:[],sessions:[],seconds:0}),completedPractices:()=>0};Object.defineProperty(w.navigator,'onLine',{value:false});
(async()=>{try{
 q('.reference-welcome').innerHTML='<div class="hero-task-card"><div class="hero-task-list"></div></div>';
 for(const file of ['notion-archive.js','profile-menu.js','compact-dashboard.js','sidebar.js','personal-panel.js','profile-portal.js'])w.eval(fs.readFileSync(file,'utf8'));
 assert.ok(q('#profilePopover #archives.me-sync-settings'));assert.equal(q('#archives').classList.contains('panelview'),false);assert.equal(q('[data-side-view="archives"]'),null);assert.ok(q('.daily-reflection-host'),'reflection editor host survives removal of study sidebar');assert.ok(q('#profilePopover #loadArchive'));assert.ok(q('#profilePopover #cloudConnect'));assert.equal(q('#archiveGrid').children.length,0);
 q('#arcanePassword').value='retained';q('.mobile-me').click();assert.equal(q('#profilePopover').hidden,false);q('.profile-close').click();assert.equal(q('#profilePopover').hidden,true);
 w.RexOpenConnections('storage');await focused('#cloudToken');assert.equal(q('#profilePopover').hidden,false);assert.equal(q('.archive-connections').tagName,'SECTION');assert.equal(q('.archive-connections summary'),null);assert.equal(q('#archiveStoragePanel').hidden,false);assert.equal(q('#arcanePassword').value,'retained');
 w.RexOpenConnections('notion');await focused('#arcanePassword');assert.equal(q('#archiveNotionPanel').hidden,false);
 console.log('PASS: Me owns both sync services, Archive navigation/list removed, profile and connection shortcuts work, credentials and reflection host retained');
}finally{w.close()}})().catch(error=>{console.error(error);process.exitCode=1});
