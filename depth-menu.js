(()=>{
 'use strict';
 const select=document.querySelector('.dashboard-view-controls select');
 if(!select)return;
 const label=select.closest('label'),width=select.getBoundingClientRect().width;
 const wrap=document.createElement('span');wrap.className='depth-view-picker';
 if(width)wrap.style.setProperty('--picker-width',width+'px');
 const trigger=document.createElement('button');trigger.type='button';trigger.className='depth-view-trigger';trigger.id='depthViewTrigger';trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls','depthViewOptions');
 const caption=document.createElement('span'),chevron=document.createElement('span');chevron.className='depth-view-chevron';chevron.setAttribute('aria-hidden','true');trigger.append(caption,chevron);
 const menu=document.createElement('span');menu.id='depthViewOptions';menu.className='depth-view-options';menu.setAttribute('role','listbox');menu.setAttribute('aria-label','Dashboard view');menu.hidden=true;
 const options=[...select.options].map((o,i)=>{const item=document.createElement('span');item.className='depth-view-option';item.id='depthViewOption'+i;item.setAttribute('role','option');item.setAttribute('tabindex','-1');item.dataset.value=o.value;const text=document.createElement('span');text.textContent=o.textContent;const mark=document.createElement('span');mark.className='depth-view-check';mark.setAttribute('aria-hidden','true');item.append(text,mark);item.addEventListener('click',()=>choose(i));item.addEventListener('keydown',e=>keys(e,i));menu.append(item);return item});
 function sync(){caption.textContent=select.selectedOptions[0]?.textContent||'';trigger.setAttribute('aria-label','Dashboard view: '+caption.textContent);options.forEach(o=>o.setAttribute('aria-selected',String(o.dataset.value===select.value)))}
 function close(focus=false){menu.hidden=true;trigger.setAttribute('aria-expanded','false');if(focus)trigger.focus()}
 function open(index=select.selectedIndex){menu.hidden=false;trigger.setAttribute('aria-expanded','true');options[Math.max(0,index)]?.focus()}
 function choose(i){select.value=options[i].dataset.value;select.dispatchEvent(new Event('change',{bubbles:true}));sync();close(true)}
 function keys(e,i){let index=i;if(e.key==='ArrowDown')index=(i+1)%options.length;else if(e.key==='ArrowUp')index=(i+options.length-1)%options.length;else if(e.key==='Home')index=0;else if(e.key==='End')index=options.length-1;else if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(i);return}else if(e.key==='Escape'){e.preventDefault();close(true);return}else if(e.key==='Tab'){close();return}else{if(e.key.length===1){const next=options.findIndex(o=>o.textContent.toLowerCase().startsWith(e.key.toLowerCase()));if(next>=0){e.preventDefault();options[next].focus()}}return}e.preventDefault();options[index].focus()}
 trigger.addEventListener('click',()=>menu.hidden?open():close());trigger.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();open(e.key==='ArrowUp'?options.length-1:0)}});
 document.addEventListener('pointerdown',e=>{if(!wrap.contains(e.target))close()});wrap.addEventListener('focusout',e=>{if(!wrap.contains(e.relatedTarget))close()});select.addEventListener('change',sync);
 wrap.append(trigger,menu);label.append(wrap);select.hidden=true;sync();
})();
