(()=>{
'use strict';
const panel=document.getElementById('profilePopover'),toggle=document.getElementById('profileToggle');if(!panel||!toggle)return;
const portal=document.createElement('div');portal.className='profile-menu profile-portal';portal.hidden=panel.hidden;document.body.append(portal);portal.append(panel);
panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
let wasOpen=false;const sync=()=>{const open=!panel.hidden;portal.hidden=!open;if(open&&!wasOpen)panel.querySelector('.profile-close')?.focus();if(!open&&wasOpen)toggle.focus();wasOpen=open;};
new MutationObserver(sync).observe(panel,{attributes:true,attributeFilter:['hidden']});sync();
portal.addEventListener('click',event=>{if(event.target===portal)panel.querySelector('.profile-close')?.click();});
portal.addEventListener('keydown',event=>{if(event.key!=='Tab')return;const focusable=[...panel.querySelectorAll('button,input,summary,a[href],[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length);if(!focusable.length)return;const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}});
})();
