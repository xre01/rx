(()=>{
'use strict';
const sidebar=document.querySelector('.rex-sidebar'),menu=document.querySelector('.profile-menu'),toggle=document.getElementById('profileToggle');
if(!sidebar||!menu||!toggle)return;
sidebar.classList.add('personal-sidebar');
const card=document.createElement('section');card.className='personal-card';card.setAttribute('aria-label','Personal panel');
const identity=document.createElement('div');identity.className='personal-identity';
const name=document.createElement('h2');name.textContent=document.getElementById('profileTitle')?.textContent||'Rex';
const title=document.createElement('span');title.className='personal-title';name.append(title);
identity.append(name);
const progress=document.createElement('section');progress.className='personal-growth';progress.setAttribute('aria-label','Study progress');
const caption=document.createElement('div'),level=document.createElement('strong'),exp=document.createElement('small');caption.append(level,exp);
const track=document.createElement('div');track.className='personal-progress';track.setAttribute('role','progressbar');track.setAttribute('aria-label','Level experience');track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax','100');const fill=document.createElement('span');track.append(fill);progress.append(caption,track);

const nav=sidebar.querySelector('.rex-sidebar-nav');

sidebar.querySelector('.rex-sidebar-rule')?.remove();
sidebar.insertBefore(card,sidebar.querySelector('.rex-sidebar-footer'));card.append(menu,identity,progress,nav);menu.classList.remove('rex-top-profile');menu.classList.add('personal-avatar-menu');
toggle.title='Profile and avatar settings';
const labels={home:'Pte Prep',archives:'Notion Archive'};nav.querySelectorAll('[data-side-view]').forEach(b=>{const text=b.querySelector('span');if(text)text.textContent=labels[b.dataset.sideView]||text.textContent;});
function sync(){title.textContent=document.getElementById('rank').textContent;level.textContent='Lv. '+document.getElementById('level').textContent;exp.textContent=document.getElementById('expLabel').textContent.replace(/^LV\. \d+ · /,'');const width=document.getElementById('expBar').style.width||'0%';fill.style.width=width;track.setAttribute('aria-valuenow',String(parseFloat(width)||0));}
new MutationObserver(sync).observe(document.getElementById('rank'),{subtree:true,childList:true,characterData:true});
sync();new MutationObserver(sync).observe(document.querySelector('#profilePopover .profile'),{subtree:true,childList:true,characterData:true,attributes:true});
})();
