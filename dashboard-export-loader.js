(()=>{
'use strict';
const controls=document.querySelector('.dashboard-view-controls');if(!controls)return;
const button=document.createElement('button');button.type='button';button.className='dashboard-export';button.title='Export PNG';button.setAttribute('aria-label',button.title);
button.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 20h17M6.5 16.5v-5M12 16.5v-12M17.5 16.5v-8"/></svg>';
controls.append(button);
const status=document.createElement('span');status.setAttribute('role','status');status.hidden=true;controls.after(status);
button.addEventListener('click',async()=>{
 if(window.RexDashboardExport)return; // The loaded module owns subsequent clicks.
 button.disabled=true;button.setAttribute('aria-busy','true');status.hidden=false;status.textContent='Loading export…';
 try{await window.RexAssets.load('dashboardExport');window.RexDashboardExport.open();status.hidden=true;status.textContent=''}
 catch(error){status.textContent=error.message}
 finally{button.disabled=false;button.removeAttribute('aria-busy')}
});
})();
