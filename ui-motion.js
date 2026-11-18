(()=>{
'use strict';
const reduced=matchMedia('(prefers-reduced-motion:reduce)'),toast=document.createElement('div');toast.className='ui-success-toast';toast.hidden=true;toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');document.body.append(toast);let timer;
function pulse(element){if(!element||reduced.matches)return;element.classList.remove('ui-success');requestAnimationFrame(()=>element.classList.add('ui-success'));element.addEventListener('animationend',()=>element.classList.remove('ui-success'),{once:true});}
function show(date,message){toast.textContent='✓ '+message;toast.hidden=false;clearTimeout(timer);timer=setTimeout(()=>{toast.hidden=true;},2300);const day=[...document.querySelectorAll('.calendar-day')].find(el=>el.getAttribute('aria-label')?.startsWith(date));pulse(day);pulse(document.querySelector('.compact-metrics>article'));}
addEventListener('rex-notion-saved',event=>show(event.detail?.date||'','Synced to Notion'));
addEventListener('rex-backfill-saved',event=>show(event.detail?.date||'','Backfill saved'));
const form=document.getElementById('pteOtherForm'),feedback=document.getElementById('pteOtherFeedback');if(form&&feedback)form.addEventListener('submit',()=>{if(feedback.textContent==='Daily question targets saved.'){const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());show(date,'Practice saved');}});
function initMobileNavigation(){
  const nav=document.querySelector('.personal-card > .rex-sidebar-nav');
  if(!nav)return;

  const mobile=matchMedia('(max-width:599px)');
  const pill=document.createElement('div');
  pill.className='rex-nav-pill';
  pill.setAttribute('aria-hidden','true');
  nav.prepend(pill);

  const duration=400;
  let selected, pillMotion, contentMotion;
  const smooth=value=>{
    const t=Math.max(0,Math.min(1,value));
    return t*t*(3-2*t);
  };
  const shape=(left,right,scale=1)=>({
    width:Math.max(1,right-left)+'px',
    transform:'translate3d('+left+'px,-50%,0) scaleY('+scale+')'
  });

  function sync(animate){
    const next=nav.querySelector('.mobile-me[aria-expanded="true"]')||
      nav.querySelector('button[aria-current="page"]');
    if(animate&&next===selected)return;

    const previous=selected;
    selected=next;
    previous?.removeAttribute('data-nav-arrival');
    contentMotion?.cancel();

    if(!mobile.matches||!next){
      pillMotion?.cancel();
      return;
    }

    const bar=nav.getBoundingClientRect();
    const target=next.getBoundingClientRect();
    const inset=Math.min(10,target.width*.14);
    const left=target.left-bar.left+inset;
    const right=target.right-bar.left-inset;
    const current=pill.getBoundingClientRect();
    const height=pill.offsetHeight;
    pillMotion?.cancel();
    Object.assign(pill.style,shape(left,right));

    if(!animate||!previous||!current.width||!height||reduced.matches||!pill.animate)return;

    const fromLeft=current.left-bar.left;
    const fromRight=current.right-bar.left;
    const direction=Math.sign(left+right-fromLeft-fromRight);
    const distance=Math.abs(left+right-fromLeft-fromRight)/2;
    // The far edge takes a head start. After both edges arrive, they settle together.
    const frames=Array.from({length:25},(_,index)=>{
      const time=index/24;
      const front=smooth(time/.64);
      const back=smooth((time-.12)/.62);
      const springTime=Math.max(0,(time-.70)/.30);
      const spring=direction*Math.min(7,distance*.09)*
        Math.sin(springTime*Math.PI*2.7)*(1-springTime)**2;
      const leftProgress=direction<0?front:back;
      const rightProgress=direction>0?front:back;
      const scale=1+(current.height/height-1)*(1-smooth(time/.38))-
        (front-back)*.58*Math.min(1,distance/60);
      return shape(
        fromLeft+(left-fromLeft)*leftProgress+spring,
        fromRight+(right-fromRight)*rightProgress+spring,
        scale
      );
    });
    pillMotion=pill.animate(frames,{duration});

    next.setAttribute('data-nav-arrival','');
    const content=next.classList.contains('mobile-me')
      ? document.getElementById('profilePopover')
      : document.getElementById(next.dataset.sideView);
    const slide=target.left>=previous.getBoundingClientRect().left?10:-10;
    // Relative offsets keep fixed controls, such as Home's add button, anchored to the viewport.
    contentMotion=content?.animate([
      {opacity:.25,position:'relative',left:slide+'px'},
      {opacity:1,position:'relative',left:'0px'}
    ],{duration,easing:'cubic-bezier(.2,.65,.25,1)'});
  }

  nav.addEventListener('animationend',event=>{
    if(event.animationName==='rex-nav-icon-arrive')event.target.removeAttribute('data-nav-arrival');
  });
  new MutationObserver(()=>sync(true)).observe(nav,{
    subtree:true,attributes:true,attributeFilter:['aria-current','aria-expanded']
  });
  const align=()=>sync(false);
  new ResizeObserver(align).observe(nav);
  mobile.addEventListener('change',align);
  reduced.addEventListener('change',align);
  align();
}
document.addEventListener('DOMContentLoaded',initMobileNavigation,{once:true});
})();
