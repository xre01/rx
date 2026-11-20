const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<button role="switch" aria-label="Connection" aria-checked="false"></button>',{runScripts:'outside-only'}),w=dom.window,button=w.document.querySelector('button');
w.eval(fs.readFileSync('service-switch.js','utf8'));w.RexServiceSwitch.attach(button);w.RexServiceSwitch.attach(button);
let changes=0;button.addEventListener('click',()=>{changes++;button.setAttribute('aria-checked',String(button.getAttribute('aria-checked')!=='true'))});
const on=()=>button.getAttribute('aria-checked')==='true';
function pointer(type,x,y=10,extras={}){const event=new w.MouseEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y,button:0});Object.defineProperties(event,{pointerId:{value:1},isPrimary:{value:true}});for(const [key,value]of Object.entries(extras))Object.defineProperty(event,key,{value});button.dispatchEvent(event)}
const nativeClick=()=>button.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true,detail:1}));
function drag(from,to){pointer('pointerdown',from);pointer('pointermove',to);pointer('pointerup',to);nativeClick()}
try{
 pointer('pointerdown',10);assert(button.classList.contains('is-pressing'));pointer('pointerup',10);nativeClick();assert(on());assert.equal(changes,1);
 drag(40,10);assert(!on());assert.equal(changes,2,'drag commits once, suppressing the following native click');
 drag(10,18);assert(!on());assert.equal(changes,2,'a short drag snaps back without disconnecting/reconnecting');
 drag(10,-10);assert(!on());assert.equal(changes,2,'dragging towards the existing endpoint is not a tap');
 drag(10,32);assert(on());assert.equal(changes,3);
 pointer('pointerdown',40);pointer('pointermove',40,35);assert(!button.classList.contains('is-pressing'));pointer('pointerup',40,35);nativeClick();assert(on());assert.equal(changes,3,'vertical scrolling never changes the service');
 pointer('pointerdown',40);pointer('pointermove',10);pointer('pointercancel',10);nativeClick();assert(on());assert.equal(button.style.getPropertyValue('--switch-progress'),'');assert(!button.classList.contains('is-dragging'));
 pointer('pointerdown',40);pointer('pointermove',10);button.disabled=true;pointer('pointerup',10);assert(on());assert.equal(changes,3);button.click();assert.equal(changes,3);
 button.disabled=false;
 for(const [key,expected]of [['ArrowLeft',false],['ArrowLeft',false],['ArrowRight',true],['Home',false],['End',true]]){button.dispatchEvent(new w.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));assert.equal(on(),expected)}
 assert.equal(changes,7,'arrow and Home/End keys set the requested state without repeated toggles');
 pointer('pointerdown',40);pointer('pointermove',10);pointer('lostpointercapture',10);assert(on());assert(!button.classList.contains('is-pressing'));
 console.log('PASS: capsule tap, press, drag commit/snap-back, one change per drag, scroll/cancel, disabled state and keyboard operation');
}finally{w.close()}
