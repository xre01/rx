(()=>{
'use strict';
const paths={readingEditor:'reading-editor.js?v=19b6046a341a',dashboardExport:'dashboard-export.js?v=0294b2363036'},pending=new Map();
function load(name){
 if(!paths[name])return Promise.reject(Error('Unknown feature'));
 if(pending.has(name))return pending.get(name);
 const promise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src=paths[name];script.async=true;
  let finished=false;
  const timer=setTimeout(()=>failed(),30000);
  function failed(){if(finished)return;finished=true;clearTimeout(timer);script.remove();pending.delete(name);reject(Error('Could not load this feature. Check your connection and retry.'))}
  script.onload=()=>{
   if(finished)return;
   const ready=name==='readingEditor'?window.RexReadingEditor:window.RexDashboardExport;
   if(!ready){failed();return}finished=true;clearTimeout(timer);resolve();
  };script.onerror=failed;document.head.append(script);
 });pending.set(name,promise);return promise;
}
window.RexAssets={load};
})();
