(()=>{'use strict';
const panel=document.getElementById('reading');if(!panel)return;
const timerEntry=document.createElement('button');timerEntry.type='button';timerEntry.className='reading-tomato-entry';timerEntry.setAttribute('aria-label','Start reading timer');timerEntry.setAttribute('title','Start reading timer');timerEntry.innerHTML='<svg viewBox="0 0 48 48" width="38" height="38" fill="none" aria-hidden="true"><path d="M24 15c-11-6-20 1-19 12 1 10 9 17 19 16 10 1 18-6 19-16 1-11-8-18-19-12Z" fill="#E69A87" stroke="#CB7B68" stroke-width="1.5"/><path d="m24 16-10-3 7-3-1-6 6 5 7-3-2 7 6 3-10 2Z" fill="#78966B"/><path d="M25 10c-1-4 0-6 2-8" stroke="#67875F" stroke-width="2.5" stroke-linecap="round"/><circle cx="24" cy="28" r="10" fill="#FFF5E9" fill-opacity=".9"/><path d="M24 21v7l4 2" stroke="#885B48" stroke-width="2" stroke-linecap="round"/><path d="M13 22c-2 3-2 5-1 7" stroke="#FFE3D6" stroke-width="2" stroke-linecap="round"/></svg>';
timerEntry.addEventListener('click',event=>window.RexFocusTimer.open('reading',event.currentTarget));
panel.querySelector('.reading-heading').append(timerEntry);
})();
