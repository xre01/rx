(()=>{
'use strict';
const sidebar=document.querySelector('.rex-sidebar'),menu=document.querySelector('.profile-menu'),toggle=document.getElementById('profileToggle');
if(!sidebar||!menu||!toggle)return;
sidebar.classList.add('personal-sidebar');
const card=document.createElement('section');card.className='personal-card';card.setAttribute('aria-label','Personal panel');
const nav=sidebar.querySelector('.rex-sidebar-nav');

sidebar.querySelector('.rex-sidebar-rule')?.remove();
sidebar.insertBefore(card,sidebar.querySelector('.rex-sidebar-footer'));card.append(menu,nav);menu.classList.remove('rex-top-profile');menu.classList.add('personal-avatar-menu');
const me=document.createElement('button');me.type='button';me.className='mobile-me';me.setAttribute('aria-label','Me');me.setAttribute('aria-controls','profilePopover');me.setAttribute('aria-haspopup','dialog');me.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg><span>Me</span>';nav.append(me);me.addEventListener('click',event=>{event.stopPropagation();toggle.click()});const profilePanel=document.getElementById('profilePopover');new MutationObserver(()=>{const open=!profilePanel.hidden;me.setAttribute('aria-expanded',String(open));me.classList.toggle('is-profile-open',open)}).observe(profilePanel,{attributes:true,attributeFilter:['hidden']});
toggle.title='Profile and avatar settings';
const labels={home:'PTE',archives:'Archive'};nav.querySelectorAll('[data-side-view]').forEach(b=>{const text=b.querySelector('span');if(text){text.textContent=labels[b.dataset.sideView]||text.textContent;b.setAttribute('aria-label',text.textContent)}});
})();
