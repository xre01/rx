/* Empty push wakes this worker; retrieve timer details using a device-only key. */
importScripts('focus-push-store.js?v=20261019-push1');
self.addEventListener('push',event=>event.waitUntil((async()=>{
 const config=await RexFocusPushStore.read();if(!config?.enabled)return;
 let reminder=config.pending;
 try{const response=await fetch('https://rex-notion-calendar.xren0220.workers.dev/api/focus/'+config.id+'/state',{headers:{'X-Focus-Key':config.key},cache:'no-store',signal:AbortSignal.timeout(8000)});if(response.ok){const data=await response.json();if(!data.enabled)return;if(data.reminder&&(!reminder||data.reminder.version>=reminder.version))reminder=data.reminder;}}catch{}
 if(!reminder?.dueAt||!['scheduled','sent',undefined].includes(reminder.status)||reminder.dueAt>Date.now()+1000||Date.now()-reminder.dueAt>90000||config.shownVersion>=reminder.version)return;
 await self.registration.showNotification(reminder.test?'Rex World · Test reminder':'Focus complete',{body:reminder.test?'Lock-screen reminders are working.':'Your focus session has finished. Time for a break.',icon:new URL('rex-wing-192.png?v=20261019-wing1',self.location.href).href,badge:new URL('rex-wing-192.png?v=20261019-wing1',self.location.href).href,tag:'rex-focus-'+reminder.version,data:{type:'rex-focus'},renotify:false});
 // Read again so a simultaneous pause/new countdown is never overwritten.
 const latest=await RexFocusPushStore.read();if(latest){latest.shownVersion=Math.max(latest.shownVersion||0,reminder.version);await RexFocusPushStore.write(latest);}
})()));
self.addEventListener('notificationclick',event=>{if(event.notification.data?.type!=='rex-focus')return;event.notification.close();event.waitUntil((async()=>{const url=new URL('index.html#focus',self.location.href);const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});const client=windows.find(c=>{const u=new URL(c.url);return u.origin===url.origin&&u.pathname===url.pathname;});if(client){await client.focus();client.postMessage({type:'rex-open-focus'});}else await self.clients.openWindow(url.href);})());});
