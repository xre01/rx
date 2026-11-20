(()=>{
'use strict';
const attached=new WeakSet(),clamp=value=>Math.max(0,Math.min(1,value));
function attach(button){
 if(attached.has(button))return;attached.add(button);
 let gesture=null,suppressClick=false;
 const checked=()=>button.getAttribute('aria-checked')==='true';
 function reset(){
  const previous=gesture;gesture=null;
  button.classList.remove('is-pressing','is-dragging');button.style.removeProperty('--switch-progress');
  if(previous){try{button.releasePointerCapture?.(previous.id)}catch{}}
 }
 button.addEventListener('pointerdown',event=>{
  if(button.disabled||event.isPrimary===false||event.button!==0)return;
  suppressClick=false;gesture={id:event.pointerId,x:event.clientX,y:event.clientY,on:checked(),progress:checked()?1:0,dragging:false};
  button.classList.add('is-pressing');
  try{button.setPointerCapture?.(event.pointerId)}catch{}
 });
 button.addEventListener('pointermove',event=>{
  if(!gesture||gesture.id!==event.pointerId)return;
  if(button.disabled||checked()!==gesture.on){suppressClick=true;reset();return}
  const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
  if(!gesture.dragging&&Math.abs(dy)>Math.max(8,Math.abs(dx))){suppressClick=true;reset();return}
  if(!gesture.dragging&&Math.abs(dx)<5)return;
  gesture.dragging=true;button.classList.add('is-dragging');
  gesture.progress=clamp((gesture.on?1:0)+dx/20);
  button.style.setProperty('--switch-progress',String(gesture.progress));
 });
 button.addEventListener('pointerup',event=>{
  if(!gesture||gesture.id!==event.pointerId)return;
  const previous=gesture;reset();
  if(!previous.dragging)return;
  // The subsequent native click must not toggle a dragged switch a second time.
  suppressClick=true;
  if(!button.disabled&&checked()===previous.on&&(previous.progress>=.5)!==previous.on)button.click();
 });
 const cancel=()=>{if(gesture)suppressClick=true;reset()};
 button.addEventListener('pointercancel',cancel);button.addEventListener('lostpointercapture',cancel);
 button.addEventListener('click',event=>{
  if(suppressClick&&event.detail>0){suppressClick=false;event.preventDefault();event.stopImmediatePropagation()}
 },true);
 button.addEventListener('keydown',event=>{
  if(button.disabled||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();const next=event.key==='ArrowRight'||event.key==='End';
  if(checked()!==next)button.click();
 });
}
window.RexServiceSwitch={attach};
})();
