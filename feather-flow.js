(()=>{
 'use strict';
 const between=(r,a,b)=>a+(b-a)*r();
 const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
 function create(r=Math.random,tier='middle'){
  const side=r()<.5?-1:1,descending=true;
  const points=[
   [-side*between(r,14,42),between(r,-60,-48)],
   [-side*between(r,22,62),between(r,-10,0)],
   [side*between(r,10,48),between(r,38,54)],
   [side*between(r,10,36),between(r,80,94)]
  ];
  return {points:points.map(([x,y])=>[x*.48,y*.6]),duration:between(r,10.2,16.8),descending,roll:between(r,-38,12),spin:side*between(r,55,115),phase:between(r,0,Math.PI*2),flutter:between(r,1.3,2.1),size:tier==='front'?between(r,20,27):tier==='back'?between(r,7,11):between(r,11,18),alpha:tier==='front'?between(r,.76,.9):tier==='back'?between(r,.25,.4):between(r,.53,.74)};
 }
 function sample(p,t){
  t=Math.max(0,Math.min(1,t));const s=1-t;
  const x=s*s*s*p.points[0][0]+3*s*s*t*p.points[1][0]+3*s*t*t*p.points[2][0]+t*t*t*p.points[3][0];
  const y=s*s*s*p.points[0][1]+3*s*s*t*p.points[1][1]+3*s*t*t*p.points[2][1]+t*t*t*p.points[3][1];
  return {x,y,roll:p.roll+p.spin*t+Math.sin(p.phase+t*Math.PI*2*p.flutter)*6,yaw:Math.sin(p.phase+t*Math.PI*2*1.7)*42,scale:.67+Math.sin(t*Math.PI)*.34,opacity:p.alpha*smooth(0,.13,t)*(1-smooth(.78,1,t))};
 }
 const api={create,sample};
 if(typeof module==='object'&&module.exports){module.exports=api;return}
 const host=document.getElementById('rexWordmark');if(!host)return;
 const nodes=[...host.querySelectorAll('.rex-wind-feather')];if(!nodes.length)return;
 const mobile=matchMedia('(max-width:700px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const particles=nodes.map(element=>({element,tier:element.classList.contains('rex-wind-front')?'front':element.classList.contains('rex-wind-back')?'back':'middle',mobileAllowed:!element.parentElement.classList.contains('rex-feather-gust-back')&&[...element.parentElement.children].indexOf(element)<6,active:false,age:0,path:null})).sort((a,b)=>({front:0,middle:1,back:2}[a.tier]-{front:0,middle:1,back:2}[b.tier]));
 const eligible=p=>mobile.matches?p.mobileAllowed&&particles.indexOf(p)<3:particles.indexOf(p)<6;

 let inView=true,scrolling=false,scrollTimer=0;

 const paused=()=>!inView||scrolling||document.hidden||reduced.matches||document.body.classList.contains('effects-off');
 let frame=0,lastTime=0,lastPaint=0;
 function reset(p,age=0){p.path=create(Math.random,p.tier);p.path.size*=.78;p.age=age;p.element.style.setProperty('--wind-size',p.path.size.toFixed(2)+'px')}
 function seed(){const active=particles.filter(eligible);active.forEach((p,i)=>{if(!p.active){reset(p);p.age=p.path.duration*(i+Math.random()*.7)/active.length}p.active=true});for(const p of particles)if(!eligible(p)){p.active=false;p.element.style.opacity='0'}}
 function paint(time){
  if(paused()){frame=0;return}
  if(lastPaint&&time-lastPaint<1000/30){frame=requestAnimationFrame(paint);return}lastPaint=time;
  const dt=lastTime?Math.min((time-lastTime)/1000,.1):0;lastTime=time;
  for(const p of particles){
   if(!p.active)continue;p.age+=dt;
   // Recycling happens only after the preceding feather has fully disappeared.
   if(p.age>=p.path.duration){p.element.style.opacity='0';reset(p,-Math.random()*.12)}
   if(p.age<0)continue;
   const pose=sample(p.path,p.age/p.path.duration);
   p.element.style.transform='translate3d('+pose.x.toFixed(2)+'px,'+pose.y.toFixed(2)+'px,0) rotate('+pose.roll.toFixed(2)+'deg) scale('+pose.scale.toFixed(3)+')';
   p.element.style.opacity=pose.opacity.toFixed(3);
  }
  frame=requestAnimationFrame(paint);
 }
 function resume(){cancelAnimationFrame(frame);frame=0;lastTime=0;lastPaint=0;if(!paused())frame=requestAnimationFrame(paint)}
 function onScroll(){scrolling=true;clearTimeout(scrollTimer);resume();scrollTimer=setTimeout(()=>{scrolling=false;resume()},180)}
 document.addEventListener('scroll',onScroll,{passive:true,capture:true});
 if('IntersectionObserver' in window)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;resume()},{rootMargin:'40px'}).observe(host);
 for(const field of host.querySelectorAll('.rex-feather-gust'))field.dataset.flow='continuous';
 mobile.addEventListener('change',()=>{seed();resume()});reduced.addEventListener('change',resume);
 document.addEventListener('visibilitychange',resume);new MutationObserver(resume).observe(document.body,{attributes:true,attributeFilter:['class']});
 addEventListener('pagehide',()=>cancelAnimationFrame(frame));addEventListener('pageshow',resume);seed();resume();
})();
