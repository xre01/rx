(()=>{
'use strict';
const metrics=document.querySelector('.compact-metrics');if(!metrics)return;
function polish(){
 for(const cell of metrics.children){
  const value=cell.querySelector('strong');if(!value||value.querySelector('.metric-value'))continue;
  const text=value.textContent.trim(),match=text.match(/^(\d+)\s+(questions?|min|days?)$/);
  if(match){const number=document.createElement('span'),unit=document.createElement('small');number.className='metric-value';number.textContent=match[1];unit.className='metric-unit';unit.textContent=match[2];value.replaceChildren(number,unit);}else value.classList.add('metric-text-value');
 }
}
polish();new MutationObserver(polish).observe(metrics,{childList:true});
})();
