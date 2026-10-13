(()=>{
'use strict';

const expected='1eb692bb48946aa9ee76a681d10de85c112b08318588c25eeb321a94d4509c24';
const gate=document.getElementById('rexUnlockGate'),form=document.getElementById('rexUnlockForm'),input=document.getElementById('rexUnlockPassword'),status=document.getElementById('rexUnlockStatus'),button=form.querySelector('button'),lock=document.getElementById('rexLockButton');
let previousFocus=null;
const scene=document.createElement('div');scene.className='rex-portal-scene';scene.setAttribute('aria-hidden','true');scene.innerHTML='<div class="rex-portal-halo"></div><div class="rex-portal-ring"></div><div class="rex-portal-core"></div>';
for(let n=0;n<22;n++){const star=document.createElement('i');star.style.setProperty('--angle',(n*137.5)+'deg');star.style.setProperty('--distance',(110+n%6*27)+'px');star.style.setProperty('--delay',(-n*.21)+'s');scene.append(star)}const vortex=document.createElement('div');vortex.className='rex-fire-vortex';scene.append(vortex);const flames=document.createElement('div');flames.className='rex-flame-crown';for(let n=0;n<32;n++){const flame=document.createElement('b');flame.style.setProperty('--turn',(n*11.25)+'deg');flame.style.setProperty('--flicker',(-n*.087)+'s');flames.append(flame)}scene.append(flames);const smoke=document.createElement('div');smoke.className='rex-fire-smoke';scene.append(smoke);gate.prepend(scene);
const fireCanvas=document.createElement('canvas');fireCanvas.className='rex-real-fire';fireCanvas.setAttribute('aria-hidden','true');scene.append(fireCanvas);
const portalThemes={blue:{name:'冰蓝火焰',rgb:[126,205,248],light:[221,247,255]},waterfall:{name:'瀑布',rgb:[140,205,224],light:[228,247,250]},dark:{name:'暗夜',rgb:[169,139,220],light:[230,211,251]},legendary:{name:'传奇至尊',rgb:[229,192,113],light:[255,242,208]}};
let portalTheme='blue';try{const saved=localStorage.getItem('rex-portal-theme');if(Object.prototype.hasOwnProperty.call(portalThemes,saved))portalTheme=saved}catch{}
let previewing=false;
const chooser=document.createElement('div');chooser.className='rex-portal-chooser';const themeLabel=document.createElement('label');themeLabel.textContent='入口魔法';const select=document.createElement('select');select.setAttribute('aria-label','入口魔法');Object.entries(portalThemes).forEach(([id,item])=>{const option=document.createElement('option');option.value=id;option.textContent=item.name;select.append(option)});select.value=portalTheme;themeLabel.append(select);const preview=document.createElement('button');preview.type='button';preview.className='rex-preview-portal';preview.textContent='预览效果';chooser.append(themeLabel,preview);chooser.hidden=false;form.before(chooser);
function applyTheme(){gate.dataset.portal=portalTheme;const theme=portalThemes[portalTheme];gate.style.setProperty('--portal-rgb',theme.rgb.join(','));}
select.addEventListener('change',()=>{portalTheme=select.value;try{localStorage.setItem('rex-portal-theme',portalTheme)}catch{}applyTheme()});
preview.addEventListener('click',async()=>{if(previewing||button.disabled)return;previewing=true;select.disabled=true;gate.classList.add('rex-entering');animateFire();await new Promise(resolve=>setTimeout(resolve,portalDuration()));gate.classList.remove('rex-entering');previewing=false;select.disabled=false;preview.focus()});applyTheme();
// One continuous gather, ignition and forward flight, with no repeated flashes.
function animateBlueFire(ctx,w,h,start){
  const TAU=Math.PI*2,baseRadius=Math.min(248,w*.31,h*.27),cx=w/2,cy=h*(h<540?.44:.48);
  const compact=w<600||h<540,flameCount=compact?72:108,sparkCount=compact?80:140;
  const clamp=n=>Math.max(0,Math.min(1,n));
  const smooth=n=>{n=clamp(n);return n*n*(3-2*n)};
  gate.style.setProperty('--blue-portal-radius',baseRadius+'px');
  gate.style.setProperty('--blue-portal-y',cy+'px');
  function glowSprite(size,stops){
    const texture=document.createElement('canvas');texture.width=texture.height=size;
    const brush=texture.getContext('2d');if(!brush)return null;
    const gradient=brush.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
    stops.forEach(([offset,color])=>gradient.addColorStop(offset,color));
    brush.fillStyle=gradient;brush.fillRect(0,0,size,size);return texture;
  }
  const spark=glowSprite(32,[[0,'#efffff'],[.16,'#b3f7ff'],[.4,'#389beac0'],[1,'#1765ff00']]);
  const flare=glowSprite(256,[[0,'#e7ffffc0'],[.1,'#9ceeff88'],[.35,'#2c9eff33'],[1,'#125eff00']]);
  function circle(r,color,width){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.stroke()}
  function flame(angle,r,length,width,curl,gradient){
    const point=(a,d)=>[cx+Math.cos(a)*d,cy+Math.sin(a)*d];
    const spread=width/r,tip=point(angle+curl,r+length),root=point(angle-spread,r-3);
    ctx.fillStyle=gradient;ctx.beginPath();ctx.moveTo(...root);
    ctx.bezierCurveTo(...point(angle-spread*1.2,r+length*.2),...point(angle+curl*.65-spread*.8,r+length*.34),...point(angle+curl*.48-spread*.35,r+length*.55));
    ctx.bezierCurveTo(...point(angle+curl*.25-spread*.65,r+length*.74),...point(angle+curl*.85,r+length*.88),...tip);
    ctx.bezierCurveTo(...point(angle+curl+spread*.25,r+length*.72),...point(angle+curl*.9+spread*.7,r+length*.42),...point(angle+curl*.3+spread*.5,r+length*.31));
    ctx.bezierCurveTo(...point(angle+spread*1.2,r+length*.18),...point(angle+spread,r+length*.05),...point(angle+spread,r-3));
    ctx.closePath();ctx.fill();
  }
  function frame(now){
    const t=(now-start)/1000;
    if(!gate.classList.contains('rex-entering')||t>=2.8){ctx.clearRect(0,0,w,h);return}
    const charge=smooth(t/.58),ignition=smooth((t-.24)/.62),flight=smooth((t-2.02)/.78);
    const fade=1-smooth((t-2.55)/.25),r=baseRadius*(.52+.48*charge)*(1+flight*6.5);
    const strength=ignition*fade,pulse=1+.018*Math.sin(t*5.5);
    ctx.clearRect(0,0,w,h);ctx.globalAlpha=fade;ctx.globalCompositeOperation='source-over';
    // Blue fire spills light into the room while the centre remains transparent.
    const atmosphere=ctx.createRadialGradient(cx,cy,r*.18,cx,cy,r*2.1);
    atmosphere.addColorStop(0,'rgba(38,112,225,0)');
    atmosphere.addColorStop(.37,'rgba(38,112,225,0)');
    atmosphere.addColorStop(.52,'rgba(8,78,169,'+(.22*strength)+')');
    atmosphere.addColorStop(.7,'rgba(15,78,176,'+(.1*strength)+')');
    atmosphere.addColorStop(1,'rgba(4,18,54,0)');
    ctx.fillStyle=atmosphere;ctx.fillRect(0,0,w,h);
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=strength;
    // A soft, blue outer crown, cyan bodies and fine white hot roots.
    const corona=ctx.createRadialGradient(cx,cy,r*.72,cx,cy,r*1.52);
    corona.addColorStop(0,'#155fff00');corona.addColorStop(.28,'#167bff20');
    corona.addColorStop(.38,'#64d9ff88');corona.addColorStop(.49,'#2586ff66');
    corona.addColorStop(.7,'#176bff22');corona.addColorStop(1,'#176bff00');
    ctx.fillStyle=corona;ctx.beginPath();ctx.arc(cx,cy,r*1.52,0,TAU);ctx.fill();
    for(let i=0;i<flameCount;i++){
      const a=i/flameCount*TAU+t*.11+.01*Math.sin(i*1.7+t*1.8);
      const wave=(Math.sin(i*.83-t*5.4)+Math.sin(i*.37+t*3.8)*.55+Math.sin(i*1.91-t*7.1)*.22)/1.77;
      const up=Math.max(0,-Math.sin(a));
      const length=r*(.075+.34*Math.pow((wave+1)/2,1.7)+.13*up)*pulse;
      const curl=.1*Math.sin(i*.63+t*3.2)+.07*Math.sin(i*1.23-t*2.6)+.03;
      const rootR=r*(1+.014*Math.sin(i*.79+t*4));
      const x=cx+Math.cos(a)*rootR,y=cy+Math.sin(a)*rootR;
      const gradient=ctx.createLinearGradient(x,y,cx+Math.cos(a+curl)*(rootR+length),cy+Math.sin(a+curl)*(rootR+length));
      gradient.addColorStop(0,'#b2f7ff90');gradient.addColorStop(.16,'#50ceffb0');
      gradient.addColorStop(.45,'#2487ff88');gradient.addColorStop(.76,'#255cfb30');gradient.addColorStop(1,'#2059ff00');
      flame(a,rootR,length,r*(.025+.011*Math.sin(i*1.27)),curl,gradient);
      flame(a-.009,rootR-2,length*.42,r*.005,curl*.75,'rgba(210,253,255,.48)');
    }
    // Long curling plumes rise off the crown, creating an unmistakable flame silhouette.
    for(let i=0;i<11;i++){
      const a=i*TAU/11+t*.15,reach=r*(.37+.16*Math.sin(i*2.3+t*3));
      const tipA=a+.2*Math.sin(t*2.2+i*1.9)+.09;
      const gradient=ctx.createLinearGradient(cx+Math.cos(a)*r,cy+Math.sin(a)*r,cx+Math.cos(tipA)*(r+reach),cy+Math.sin(tipA)*(r+reach));
      gradient.addColorStop(0,'#63daff70');gradient.addColorStop(.35,'#2897ffc0');gradient.addColorStop(.75,'#266bff35');gradient.addColorStop(1,'#266bff00');
      flame(a,r,reach,r*.028,tipA-a,gradient);
    }
    // One expanding pressure wave signals ignition; a second belongs to the final forward flight.
    for(const [at,speed,opacity] of [[.58,1.9,.24],[2.03,4,.38]]){
      const age=(t-at)/.7;
      if(age>0&&age<1){ctx.globalAlpha=strength*(1-age)*opacity;circle(baseRadius*(1+age*speed),'#8ae6ff',Math.max(1,baseRadius*.012*(1-age)))}
    }
    ctx.globalAlpha=strength;
    for(let i=0;i<sparkCount;i++){
      const age=(t*.46+i*.61803398875)%1,a=i*2.399963+t*.13;
      const d=r*(.98+age*.82+flight*age*2.2),drift=age*baseRadius*.19;
      const x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d-drift;
      const alpha=Math.sin(age*Math.PI)*(.3+.5*(i%9===0));
      ctx.globalAlpha=strength*alpha;
      const trail=(5+age*18+flight*90)*(compact?.65:1);
      ctx.strokeStyle=i%6===0?'#bcfaff':'#459dff';ctx.lineWidth=i%9===0?1.6:.7;
      ctx.beginPath();ctx.moveTo(x-Math.cos(a)*trail,y-Math.sin(a)*trail);ctx.lineTo(x,y);ctx.stroke();
      if(spark){const size=i%9===0?14:7;ctx.drawImage(spark,x-size/2,y-size/2,size,size)}
    }
    // Two restrained lens blooms anchor the hot rim without whitening the screen.
    if(flare){ctx.globalAlpha=strength*.55;for(const a of [-.9,Math.PI-.6]){const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r,size=r*.85;ctx.drawImage(flare,x-size/2,y-size/2,size,size)}}
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function animateLegendaryFire(ctx,w,h,start){
  const TAU=Math.PI*2,R=Math.min(258,w*.225,h*.265),cx=w/2,cy=h*(h<540?.43:.45);
  const compact=w<600||h<540,sparkCount=compact?85:150;
  const clamp=n=>Math.max(0,Math.min(1,n)),smooth=n=>{n=clamp(n);return n*n*(3-2*n)};
  const rgba=(rgb,a)=>'rgba('+rgb.join(',')+','+clamp(a)+')';
  const gold=[244,191,91],ivory=[255,243,205];
  gate.style.setProperty('--legendary-portal-radius',R+'px');gate.style.setProperty('--legendary-portal-y',cy+'px');
  function texture(size,stops){
    const tile=document.createElement('canvas');tile.width=tile.height=size;
    const brush=tile.getContext('2d');if(!brush)return null;
    const gradient=brush.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
    stops.forEach(([offset,color])=>gradient.addColorStop(offset,color));brush.fillStyle=gradient;brush.fillRect(0,0,size,size);return tile;
  }
  const glow=texture(256,[[0,'#fff6cda0'],[.2,'#ffd57740'],[.5,'#e9972b18'],[1,'#dc7c1600']]);
  const star=texture(32,[[0,'#fffdeb'],[.15,'#fff2ba'],[.45,'#ffc24c88'],[1,'#ffb12600']]);
  // Cache a loose feather once; the late shower does not belong to attached wings.
  function featherTexture(){
    const tile=document.createElement('canvas');tile.width=144;tile.height=320;
    const brush=tile.getContext('2d');if(!brush)return null;
    function vane(){
      brush.beginPath();brush.moveTo(77,17);
      brush.bezierCurveTo(44,43,23,91,28,151);
      brush.bezierCurveTo(32,198,49,236,74,264);
      brush.bezierCurveTo(99,235,114,190,110,130);
      brush.bezierCurveTo(109,76,97,37,77,17);brush.closePath();
    }
    const fill=brush.createLinearGradient(25,110,111,150);
    fill.addColorStop(0,'rgba(235,185,96,.18)');fill.addColorStop(.25,'rgba(255,240,199,.88)');
    fill.addColorStop(.53,'rgba(255,252,235,.98)');fill.addColorStop(.7,'rgba(255,235,179,.86)');fill.addColorStop(1,'rgba(224,167,69,.28)');
    brush.shadowColor='rgba(255,213,126,.55)';brush.shadowBlur=10;
    vane();brush.fillStyle=fill;brush.fill();brush.shadowBlur=0;
    brush.save();vane();brush.clip();
    // Fine, uneven barbs fan up from the curved shaft, giving every sprite a feather silhouette.
    for(let y=44;y<267;y+=5.2){
      const q=(y-17)/247,shaft=77-9*q+5*Math.sin(q*Math.PI),span=Math.sin(q*Math.PI)*43;
      brush.lineWidth=y%3<1?1.2:.7;brush.strokeStyle=y%3<1?'rgba(173,127,49,.38)':'rgba(255,253,231,.82)';
      brush.beginPath();brush.moveTo(shaft,y);brush.quadraticCurveTo(shaft-span*.52,y-13,shaft-span,y-25-5*Math.sin(y));
      brush.moveTo(shaft,y);brush.quadraticCurveTo(shaft+span*.55,y-11,shaft+span*.92,y-27);brush.stroke();
    }
    brush.restore();
    // Narrow splits in the outer vane leave soft individual barb tips, rather than a leaf edge.
    brush.globalCompositeOperation='destination-out';brush.strokeStyle='rgba(0,0,0,.82)';brush.lineWidth=1.15;
    for(let y=53;y<248;y+=12.5){
      const q=(y-17)/247,shaft=77-9*q+5*Math.sin(q*Math.PI),spread=Math.pow(Math.sin(q*Math.PI),.8);
      const left=shaft-spread*44,right=shaft+spread*34;
      brush.beginPath();brush.moveTo(left-5,y-8);brush.quadraticCurveTo(left+3,y-3,left+7,y+3);
      brush.moveTo(right+5,y-8);brush.quadraticCurveTo(right-3,y-3,right-7,y+3);brush.stroke();
    }
    brush.globalCompositeOperation='source-over';
    brush.strokeStyle='rgba(255,250,225,.88)';brush.lineWidth=1.7;
    brush.beginPath();brush.moveTo(68,303);brush.bezierCurveTo(81,252,78,157,77,23);brush.stroke();
    brush.strokeStyle='rgba(192,139,53,.65)';brush.lineWidth=.7;
    brush.beginPath();brush.moveTo(66,302);brush.bezierCurveTo(78,246,76,161,75,26);brush.stroke();
    return tile;
  }
  const feather=featherTexture(),featherCount=compact?18:30,foregroundCount=compact?4:6;
  const seed=(i,k)=>{const v=Math.sin((i+1)*127.1+k*311.7)*43758.5453123;return v-Math.floor(v)};
  const fallingFeathers=Array.from({length:featherCount},(_,i)=>{
    const front=i>=featherCount-foregroundCount,middle=i>=Math.floor(featherCount*.45),depth=front?2:middle?1:0;
    const phase=seed(i,1)*TAU,spread=seed(i,2),height=seed(i,3);
    return {delay:2.1+seed(i,4)*.22,depth,phase,
      x:front?w*(.09+(i-(featherCount-foregroundCount))*.82/Math.max(1,foregroundCount-1)):cx+(spread-.5)*w*.68,
      y:front?h*(.14+height*.22):cy-R*(.4+height*.92),
      length:(depth===2?Math.min(w*.14,h*.145):depth===1?Math.min(w*.085,h*.085):Math.min(w*.048,h*.048))*(.68+seed(i,5)*.42),
      release:(spread-.5)*w*(front?.23:.17),speed:h*(front?.2:middle?.14:.095)*(.8+seed(i,6)*.35),
      turn:(seed(i,7)-.5)*2.1,opacity:front?.86:middle?.66:.42};
  });
  function drawFallingFeathers(t,fade){
    if(!feather||t<2.1)return;
    ctx.globalCompositeOperation='source-over';
    for(const f of fallingFeathers){
      const age=t-f.delay;if(age<=0)continue;
      const release=1-Math.exp(-age*4.5),sway=Math.sin(age*3.2+f.phase)-Math.sin(f.phase);
      const x=f.x+f.release*release+sway*f.length*.28;
      const y=f.y+age*f.speed+age*age*h*.018-Math.sin(age*3)*h*.02;
      ctx.save();ctx.translate(x,y);ctx.rotate(f.phase*.7+age*f.turn+sway*.31);
      ctx.scale(.55+.45*Math.abs(Math.cos(age*2.6+f.phase)),1);
      ctx.globalAlpha=fade*smooth(age/.15)*f.opacity;
      ctx.drawImage(feather,-f.length*.225,-f.length*.5,f.length*.45,f.length);
      ctx.restore();
    }
  }
  function ring(radius,alpha,width,rotation=0,segments=1){
    ctx.strokeStyle=rgba(gold,alpha);ctx.lineWidth=width;ctx.beginPath();
    if(segments===1)ctx.arc(0,0,radius,0,TAU);
    else for(let n=0;n<segments;n++){const a=n*TAU/segments+rotation;ctx.moveTo(Math.cos(a)*radius,Math.sin(a)*radius);ctx.arc(0,0,radius,a,a+TAU/segments*.76)}
    ctx.stroke();
  }
  function diamond(a,radius,size,alpha){
    const x=Math.cos(a)*radius,y=Math.sin(a)*radius,dx=Math.cos(a),dy=Math.sin(a);
    ctx.fillStyle=rgba(gold,alpha*.6);ctx.strokeStyle=rgba(ivory,alpha);ctx.lineWidth=.85;
    ctx.beginPath();ctx.moveTo(x+dx*size,y+dy*size);ctx.lineTo(x-dy*size*.38,y+dx*size*.38);ctx.lineTo(x-dx*size,y-dy*size);ctx.lineTo(x+dy*size*.38,y-dx*size*.38);ctx.closePath();ctx.fill();ctx.stroke();
  }
  function frame(now){
    const t=(now-start)/1000;
    if(!gate.classList.contains('rex-entering')||t>=3.4){ctx.clearRect(0,0,w,h);return}
    const gather=smooth(t/.7),seal=smooth((t-.28)/.72),power=smooth((t-.9)/.7);
    const travel=smooth((t-2.62)/.78),fade=1-smooth((t-3.09)/.31),flightScale=1+travel*5;
    ctx.clearRect(0,0,w,h);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=fade;
    const night=ctx.createRadialGradient(cx,cy,R*.15,cx,cy,Math.max(w,h)*.7);
    night.addColorStop(0,rgba([6,12,30],gather*.88));night.addColorStop(.37,rgba([6,10,27],gather*.65));night.addColorStop(1,rgba([6,10,27],0));
    ctx.fillStyle=night;ctx.fillRect(0,0,w,h);
    // A sky-to-ground axis, with a narrow ivory heart and a broad gold spill.
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=fade*seal;
    const columnWidth=R*(.11+.09*power),column=ctx.createLinearGradient(cx-columnWidth,0,cx+columnWidth,0);
    column.addColorStop(0,'#ffca6500');column.addColorStop(.35,'#ffd68918');column.addColorStop(.48,'#fff0b846');column.addColorStop(.5,'#fff8d478');column.addColorStop(.52,'#fff0b846');column.addColorStop(.65,'#ffd68918');column.addColorStop(1,'#ffca6500');
    ctx.fillStyle=column;ctx.fillRect(cx-columnWidth,0,columnWidth*2,h);
    if(glow){ctx.globalAlpha=fade*seal*.7;ctx.drawImage(glow,cx-R*2,cy-R*2,R*4,R*4)}
    ctx.save();ctx.translate(cx,cy);ctx.scale(flightScale,flightScale);
    // Monumental, counterrotating celestial seals.
    ctx.globalAlpha=fade*seal;
    for(let layer=0;layer<5;layer++){
      const radius=R*(.77+layer*.15)*(.68+.32*seal),turn=t*(layer%2?-.1:.085);
      ring(radius,.08,R*.026);ring(radius,.56,layer===3?1.8:1);ring(radius+R*.025,.17,.65);
      ring(radius-R*.02,.38,.85,turn,layer%2?12:8);
    }
    ctx.save();ctx.rotate(t*.085);
    for(let i=0;i<48;i++){
      const a=i*TAU/48,major=i%4===0,r1=R*1.36,r2=R*(major?1.46:1.405);
      ctx.strokeStyle=rgba(ivory,major?.75:.37);ctx.lineWidth=major?1.2:.7;
      ctx.beginPath();ctx.moveTo(Math.cos(a)*r1,Math.sin(a)*r1);ctx.lineTo(Math.cos(a)*r2,Math.sin(a)*r2);ctx.stroke();
      if(major)diamond(a,R*1.56,R*.043,.75);
    }
    ctx.restore();
    ctx.shadowColor='#ffcf78';ctx.shadowBlur=compact?10:20;
    ring(R*1.23,.7,Math.max(1.5,R*.008));
    ctx.strokeStyle='rgba(255,247,211,.82)';ctx.lineWidth=Math.max(.8,R*.003);
    ctx.beginPath();ctx.arc(0,0,R*1.224,0,TAU);ctx.stroke();ctx.shadowBlur=0;
    // Geometric sigils make the rings feel like a coherent ancient spell.
    ctx.save();ctx.rotate(-t*.095);
    for(let i=0;i<24;i++){
      ctx.save();ctx.rotate(i*TAU/24);ctx.translate(0,-R*1.15);
      const q=R*.018;ctx.strokeStyle=rgba(ivory,.56);ctx.lineWidth=Math.max(.7,R*.0032);
      ctx.beginPath();ctx.moveTo(-q,-q);ctx.lineTo(0,q);ctx.lineTo(q,-q);ctx.moveTo(0,q);ctx.lineTo(0,q*2.3);
      if(i%3===0){ctx.moveTo(-q*1.4,q*.3);ctx.lineTo(q*1.4,q*.3)}
      if(i%3===1){ctx.moveTo(-q,-q);ctx.lineTo(q,-q)}ctx.stroke();ctx.restore();
    }
    ctx.restore();
    // A horizontal seal anchors the celestial gate in space.
    ctx.globalAlpha=fade*seal;
    for(let i=0;i<3;i++){
      ctx.strokeStyle=rgba(gold,i===0?.42:.19);ctx.lineWidth=i===0?1.3:.7;
      ctx.beginPath();ctx.ellipse(0,R*.96,R*(1.42+i*.19),R*(.16+i*.035),0,0,TAU);ctx.stroke();
    }
    ctx.restore();
    // A single wave of sovereign power, followed by accelerated forward travel.
    const burst=smooth((t-2.05)/.18)*(1-smooth((t-2.36)/.6));
    if(burst>0){
      ctx.globalAlpha=fade*burst*.44;const radius=R*(1.1+Math.max(0,t-2.05)*3);
      ctx.strokeStyle='#ffe3a0';ctx.lineWidth=Math.max(1,R*.012*(1-travel));ctx.beginPath();ctx.arc(cx,cy,radius,0,TAU);ctx.stroke();
      if(glow){ctx.globalAlpha=fade*burst*.27;ctx.drawImage(glow,cx-R*1.2,cy-R*1.2,R*2.4,R*2.4)}
    }
    for(let i=0;i<sparkCount;i++){
      const a=i*2.399963+t*.07,age=(t*.32+i*.61803398875)%1;
      const d=R*(t<.7?2.2-age*1.35:.85+age*1.5+travel*age*5),x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d-age*R*.16;
      ctx.globalAlpha=fade*gather*Math.sin(age*Math.PI)*(i%8===0?.9:.4);
      const trail=R*(.025+age*.06+travel*.32);ctx.strokeStyle=i%8===0?'#fff2c0':'#f7c45d';ctx.lineWidth=i%8===0?1.2:.65;
      ctx.beginPath();ctx.moveTo(x-Math.cos(a)*trail,y-Math.sin(a)*trail);ctx.lineTo(x,y);ctx.stroke();
      if(star){const size=i%8===0?13:7;ctx.drawImage(star,x-size/2,y-size/2,size,size)}
    }
    // Two diagonal rays cross above the gate as the spell reaches its peak.
    ctx.globalAlpha=fade*power*.5;const skyY=cy-R*1.43;
    for(let a of [-.28,.28]){
      ctx.save();ctx.translate(cx,skyY);ctx.rotate(a);
      const ray=ctx.createLinearGradient(-R*1.4,0,R*1.4,0);ray.addColorStop(0,'#ffda8100');ray.addColorStop(.5,'#fff7d799');ray.addColorStop(1,'#ffda8100');
      ctx.fillStyle=ray;ctx.fillRect(-R*1.4,-.65,R*2.8,1.3);ctx.restore();
    }
    // Loose ivory-gold feathers stay in screen space while the celestial seals rush forward.
    drawFallingFeathers(t,fade);
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function animateWaterfallFire(ctx,w,h,start){
  const TAU=Math.PI*2,R=Math.min(258,w*.31,h*.265),cx=w/2,cy=h*(h<540?.43:.45);
  const compact=w<600||h<540,streams=compact?42:68,drops=compact?52:88;
  const clamp=n=>Math.max(0,Math.min(1,n)),smooth=n=>{n=clamp(n);return n*n*(3-2*n)};
  const rgba=(rgb,a)=>'rgba('+rgb.join(',')+','+clamp(a)+')';
  const ice=[222,255,253],aqua=[91,222,228],deep=[14,94,113];
  gate.style.setProperty('--cinematic-portal-radius',R+'px');
  gate.style.setProperty('--cinematic-portal-y',cy+'px');
  function texture(size,stops){
    const tile=document.createElement('canvas');tile.width=tile.height=size;
    const brush=tile.getContext('2d');if(!brush)return null;
    const glow=brush.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
    stops.forEach(([p,color])=>glow.addColorStop(p,color));brush.fillStyle=glow;brush.fillRect(0,0,size,size);return tile;
  }
  const mist=texture(192,[[0,'#dafff85c'],[.2,'#a1f5ee38'],[.54,'#42c1c519'],[1,'#219ba600']]);
  const bead=texture(32,[[0,'#efffff'],[.16,'#cffff8d0'],[.46,'#72e4e360'],[1,'#30bfd400']]);
  const spill=texture(256,[[0,'#d0fff43a'],[.23,'#7aede930'],[.56,'#1abac018'],[1,'#15899900']]);
  // Cache refracting water once: a clear oval body, dark aqua interior and a white rim.
  const glassDrop=document.createElement('canvas');glassDrop.width=64;glassDrop.height=96;
  const glass=glassDrop.getContext('2d');
  if(glass){
    const water=glass.createRadialGradient(24,29,2,32,47,44);
    water.addColorStop(0,'#ecfffddd');water.addColorStop(.16,'#bbfff699');
    water.addColorStop(.39,'#4acce366');water.addColorStop(.7,'#14779772');water.addColorStop(1,'#a9fffbbb');
    glass.fillStyle=water;glass.beginPath();glass.ellipse(32,48,21,41,0,0,TAU);glass.fill();
    glass.strokeStyle='#d7ffffc9';glass.lineWidth=1.4;glass.stroke();
    glass.strokeStyle='#ffffffed';glass.lineWidth=3;glass.lineCap='round';
    glass.beginPath();glass.ellipse(32,48,18,38,0,Math.PI*1.04,Math.PI*1.52);glass.stroke();
    glass.strokeStyle='#8af7ffc9';glass.lineWidth=1.6;
    glass.beginPath();glass.ellipse(32,48,16,34,0,.11*Math.PI,.42*Math.PI);glass.stroke();
    glass.fillStyle='#ffffffd9';glass.beginPath();glass.ellipse(25,25,3.5,7,-.22,0,TAU);glass.fill();
  }
  const scatter=n=>{const value=Math.sin(n*12.9898+78.233)*43758.5453;return value-Math.floor(value)};
  const burstDrops=Array.from({length:compact?54:96},(_,i)=>{
    const seed=scatter(i+13),a=TAU*scatter(i+71);
    return {a,seed,delay:scatter(i+37)*.14,v:R*(.75+scatter(i+119)*4.3),r:R*(.017+Math.pow(seed,2)*.047),origin:scatter(i+193)};
  });
  const burstSpray=Array.from({length:compact?108:192},(_,i)=>{
    const seed=scatter(i+311),a=TAU*scatter(i+431);
    return {a,seed,delay:scatter(i+577)*.16,v:R*(.6+scatter(i+683)*5.2),r:Math.max(.85,R*(.004+seed*.011)),origin:scatter(i+797)};
  });
  function ellipse(x,y,rx,ry,color,width){
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.stroke();
  }
  function arch(radius,alpha,width,from=-Math.PI,to=0){
    ctx.strokeStyle=rgba(ice,alpha);ctx.lineWidth=width;ctx.beginPath();ctx.ellipse(0,0,radius,radius*1.05,0,from,to);ctx.stroke();
  }
  function frame(now){
    const t=Math.max(0,(now-start)/1000);
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.shadowBlur=0;
    if(!gate.classList.contains('rex-entering')||t>=3){ctx.clearRect(0,0,w,h);return}
    const gather=smooth(t/.64),flow=smooth((t-.14)/.62),opening=smooth((t-.4)/.72);
    const travel=smooth((t-2.25)/.75),fade=1-smooth((t-2.7)/.3),scale=1+travel*6;
    const strength=flow*fade*(1-.74*smooth((t-2.12)/.62));
    ctx.clearRect(0,0,w,h);
    // Deep teal shadow separates flowing white water from the warm study behind it.
    ctx.globalAlpha=fade;
    const atmosphere=ctx.createRadialGradient(cx,cy,R*.24,cx,cy,R*2.5);
    atmosphere.addColorStop(0,rgba([0,13,25],gather*.82));
    atmosphere.addColorStop(.36,rgba([0,24,37],gather*.84));
    atmosphere.addColorStop(.58,rgba(deep,flow*.24));atmosphere.addColorStop(1,rgba([0,20,32],0));
    ctx.fillStyle=atmosphere;ctx.fillRect(0,0,w,h);
    ctx.save();ctx.translate(cx,cy);ctx.scale(scale,scale);
    const gateR=R*(.72+.28*gather);
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=strength;
    if(spill)ctx.drawImage(spill,-gateR*1.7,-gateR*1.75,gateR*3.4,gateR*3.4);
    // Soft, layered water curtains remain distinct from the sharp falling veins.
    for(let side of [-1,1]){
      const x=side*gateR*.76;
      const curtain=ctx.createLinearGradient(x-side*gateR*.28,0,x+side*gateR*.33,0);
      curtain.addColorStop(0,'#37d7df00');curtain.addColorStop(.18,'#37cad522');
      curtain.addColorStop(.48,'#b9fff752');curtain.addColorStop(.72,'#52dce752');curtain.addColorStop(1,'#178da900');
      ctx.fillStyle=curtain;ctx.beginPath();
      ctx.moveTo(side*gateR*.62,-gateR*.82);
      ctx.bezierCurveTo(side*gateR*.77,-gateR*.69,side*gateR*.88,-gateR*.58,side*gateR*.97,-gateR*.3);
      ctx.bezierCurveTo(side*gateR*1.045,gateR*.13,side*gateR*1.02,gateR*.66,side*gateR*.92,gateR*.97);
      ctx.quadraticCurveTo(side*gateR*.78,gateR*1.1,side*gateR*.49,gateR*.98);
      ctx.bezierCurveTo(side*gateR*.68,gateR*.63,side*gateR*.7,-gateR*.32,side*gateR*.62,-gateR*.82);
      ctx.closePath();ctx.fill();
    }
    // The quiet, distant opening makes the front curtain feel tall and dimensional.
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=strength*opening;
    const core=ctx.createRadialGradient(0,-gateR*.05,0,0,-gateR*.05,gateR*.9);
    core.addColorStop(0,'#041b2af2');core.addColorStop(.67,'#042535ce');core.addColorStop(1,'#07333e00');
    ctx.fillStyle=core;ctx.beginPath();ctx.ellipse(0,-gateR*.04,gateR*.86,gateR*.95,0,0,TAU);ctx.fill();
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=strength*opening;
    for(let layer=0;layer<4;layer++){
      const radius=gateR*(.3+layer*.16),shift=gateR*.028*Math.sin(t*.45+layer);
      ellipse(shift,-gateR*.06,radius,radius*1.08,rgba(aqua,.04+layer*.02),gateR*.009);
      arch(radius,.06,Math.max(.65,gateR*.002));
    }
    // Water begins as a whole veil and parts into falling banks around a clear passage.
    for(let i=0;i<streams;i++){
      const u=-1.03+i/(streams-1)*2.06,edge=Math.abs(u);
      const top=-gateR*1.06*Math.sqrt(Math.max(.035,1-u*u));
      const bottom=gateR*(.94+.045*Math.sin(i*1.83));
      const side=Math.sign(u)||1,part=opening*gateR*.22*side*Math.pow(1-edge,2);
      const x=u*gateR+part,depth=i%3,phase=i*1.618,span=bottom-top;
      const transparency=(edge<.68?(1-opening)*.38+opening*.055:.5+.28*edge);
      const width=gateR*(.012+.008*(1+Math.sin(i*2.31)))*(depth===0?1.2:.72);
      function point(f){
        const wobble=Math.sin(f*10.5-t*4.1+phase)*gateR*.009+Math.sin(f*21.4-t*5.8+phase*.7)*gateR*.004;
        return [x+wobble+side*gateR*.027*f*f,top+span*f];
      }
      const ribbon=ctx.createLinearGradient(x,top,x,bottom);
      ribbon.addColorStop(0,rgba(ice,transparency*.9));ribbon.addColorStop(.08,rgba(aqua,transparency*.7));
      ribbon.addColorStop(.38,rgba(ice,transparency*.22));ribbon.addColorStop(.8,rgba(aqua,transparency*.55));ribbon.addColorStop(1,rgba(ice,transparency*.14));
      ctx.globalAlpha=strength;ctx.fillStyle=ribbon;ctx.beginPath();
      for(let n=0;n<=18;n++){const [px,py]=point(n/18);n?ctx.lineTo(px-width*.5,py):ctx.moveTo(px-width*.5,py)}
      for(let n=18;n>=0;n--){const [px,py]=point(n/18);ctx.lineTo(px+width*.5,py)}ctx.closePath();ctx.fill();
      // Broken high-speed white highlights give the flow a downward direction.
      for(let pulse=0;pulse<3;pulse++){
        const age=(t*(.83+depth*.09)+i*.137+pulse/3)%1;
        const len=.085+.05*(i%4)/3,end=Math.min(1,age+len);
        const tail=ctx.createLinearGradient(x,top+span*age,x,top+span*end);
        tail.addColorStop(0,rgba(ice,0));tail.addColorStop(.46,rgba(ice,transparency*.78));tail.addColorStop(1,rgba(aqua,0));
        ctx.strokeStyle=tail;ctx.lineWidth=Math.max(.55,width*.2);ctx.beginPath();
        for(let n=0;n<=5;n++){const p=point(age+(end-age)*n/5);n?ctx.lineTo(...p):ctx.moveTo(...p)}ctx.stroke();
      }
    }
    // A bright spillway feeds the falling water; fine broken contours avoid a solid neon hoop.
    ctx.globalAlpha=strength;
    arch(gateR*1.008,.09,gateR*.065,-Math.PI*1.03,.03*Math.PI);
    arch(gateR,.35,gateR*.016,-Math.PI*.97,-Math.PI*.03);
    arch(gateR*.994,.7,Math.max(.85,gateR*.004),-Math.PI*.92,-Math.PI*.08);
    for(let side of [-1,1]){
      ctx.strokeStyle=rgba(ice,.5);ctx.lineWidth=Math.max(1,gateR*.006);ctx.beginPath();
      ctx.moveTo(side*gateR*.985,-gateR*.2);ctx.bezierCurveTo(side*gateR*1.03,gateR*.2,side*gateR*.97,gateR*.66,side*gateR*.87,gateR*.99);ctx.stroke();
    }
    // Rolling foam, drifting mist and expanding pool rings anchor the fall in space.
    const poolY=gateR*1.02;
    ctx.save();ctx.translate(0,poolY);ctx.scale(1,.18);
    const pool=ctx.createRadialGradient(0,0,0,0,0,gateR*1.5);
    pool.addColorStop(0,'#cafff332');pool.addColorStop(.45,'#4dddd827');pool.addColorStop(1,'#248ea600');
    ctx.fillStyle=pool;ctx.beginPath();ctx.arc(0,0,gateR*1.5,0,TAU);ctx.fill();ctx.restore();
    for(let k=0;k<5;k++){
      const age=(t*.52+k*.2)%1,spread=gateR*(.33+age*1.2);
      ellipse(0,poolY+age*gateR*.018,spread,gateR*(.027+age*.14),rgba(ice,(1-age)*.26),Math.max(.65,gateR*.003));
    }
    for(let side of [-1,1])for(let k=0;k<9;k++){
      const phase=t*.66+k*.618,drift=Math.sin(phase)*gateR*.06;
      const mx=side*gateR*(.55+k*.066)+drift,my=poolY+Math.sin(k*1.3+t*.7)*gateR*.022;
      if(mist){ctx.globalAlpha=strength*(.32+.16*Math.sin(phase));ctx.drawImage(mist,mx-gateR*.23,my-gateR*.1,gateR*.46,gateR*.22)}
      ctx.globalAlpha=strength*.55;ellipse(mx,my,gateR*(.028+.009*(k%3)),gateR*.009,rgba(ice,.54),gateR*.004);
    }
    if(mist){
      for(let k=0;k<7;k++){
        const mx=(k-3)*gateR*.35+Math.sin(t*.63+k)*gateR*.12,my=poolY+gateR*.045+Math.sin(t*.5+k*.6)*gateR*.025;
        ctx.globalAlpha=strength*(k===3?.22:.4);ctx.drawImage(mist,mx-gateR*.38,my-gateR*.11,gateR*.76,gateR*.29);
      }
    }
    // Suspended spray and arcing droplets glisten without turning into fire sparks.
    for(let i=0;i<drops;i++){
      const age=(t*.67+i*.61803398875)%1,side=i%2?1:-1,seed=(i*.38196601125)%1;
      const px=side*gateR*(.63+seed*.43+age*.25),py=poolY-gateR*(Math.sin(age*Math.PI)*(.18+seed*.28)) + age*gateR*.04;
      ctx.globalAlpha=strength*Math.sin(age*Math.PI)*(.34+(i%7===0?.27:0));
      const size=gateR*(i%7===0?.035:.017),tail=gateR*.014*(1+age*1.5);
      ctx.strokeStyle=rgba(ice,.75);ctx.lineWidth=Math.max(.55,size*.16);ctx.beginPath();ctx.moveTo(px-side*tail*.3,py-tail);ctx.lineTo(px,py);ctx.stroke();
      if(bead)ctx.drawImage(bead,px-size*.5,py-size*.5,size,size);
    }
    // The first opening surge remains part of the falling-water buildup.
    const surge=(t-.59)/.65;
    if(surge>0&&surge<1){
      ctx.globalAlpha=strength*(1-surge)*.4;
      ellipse(0,poolY,gateR*(.75+surge*1.24),gateR*(.11+surge*.26),'#bafff1',Math.max(.8,gateR*.008*(1-surge)));
    }
    ctx.restore();
    // The finale bursts toward the viewer in screen space, independent of the expanding fall.
    const burst=t-2.08,burstY=cy+R*.08;
    if(burst>0){
      const attack=smooth(burst/.095),gravity=R*2.2;
      ctx.globalCompositeOperation='lighter';
      // A brief impact of whitewater becomes a broad soft cloud of spray.
      if(mist){
        const swell=R*(.55+burst*3.1),flash=attack*(1-smooth(burst/.36));
        ctx.globalAlpha=fade*flash*.94;
        ctx.drawImage(mist,cx-swell,burstY-swell*.64,swell*2,swell*1.28);
        ctx.globalAlpha=fade*attack*(1-smooth(burst/.85))*.36;
        ctx.drawImage(mist,cx-swell*1.38,burstY-swell*.76,swell*2.76,swell*1.52);
      }
      // Curved jets break into beads; their trajectories sag as the blast loses force.
      for(let i=0;i<(compact?9:15);i++){
        const a=i*2.3999632297+.31,seed=(i*.61803398875)%1;
        const age=Math.max(0,burst-(i%3)*.022),v=R*(2.2+seed*2.1),reach=R*.24+v*age;
        const sx=cx+Math.cos(a)*R*.21,sy=burstY+Math.sin(a)*R*.19;
        const ex=cx+Math.cos(a)*reach,ey=burstY+Math.sin(a)*reach*.83+gravity*age*age*.5;
        const mx=(sx+ex)/2-Math.sin(a)*R*.09,my=(sy+ey)/2-R*(.045+age*.12);
        ctx.globalAlpha=fade*attack*(1-smooth((burst-.06)/.44))*(.15+seed*.12);
        ctx.strokeStyle='#c8fffa';ctx.lineWidth=Math.max(.7,R*(.006+seed*.007)*(1-clamp(burst/.7)));
        ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo(mx,my,ex,ey);ctx.stroke();
      }
      for(const p of burstSpray){
        const age=burst-p.delay;if(age<=0)continue;
        const vx=Math.cos(p.a)*p.v,vy=Math.sin(p.a)*p.v*.82-R*.22;
        const distance=R*p.origin*.45,px=cx+Math.cos(p.a)*distance+vx*age;
        const py=burstY+Math.sin(p.a)*distance*.85+vy*age+gravity*age*age*.5;
        const radius=p.r*(1+age*.36);
        ctx.globalAlpha=fade*smooth(age/.07)*(.38+p.seed*.48);
        if(bead)ctx.drawImage(bead,px-radius,py-radius,radius*2,radius*2);
      }
      // Larger foreground drops keep a visible liquid body, with short refracted wakes.
      ctx.globalCompositeOperation='source-over';
      for(const p of burstDrops){
        const age=burst-p.delay;if(age<=0)continue;
        const vx=Math.cos(p.a)*p.v,vy=Math.sin(p.a)*p.v*.8-R*.24;
        const distance=R*p.origin*.42,px=cx+Math.cos(p.a)*distance+vx*age;
        const py=burstY+Math.sin(p.a)*distance*.82+vy*age+gravity*age*age*.5;
        const radius=p.r*(1+age*1.25),alpha=fade*smooth(age/.065)*(.63+p.seed*.3);
        const velocityY=vy+gravity*age,angle=Math.atan2(velocityY,vx)-Math.PI/2;
        if(bead){
          ctx.globalAlpha=alpha*.22;
          ctx.drawImage(bead,px-vx*.027-radius*.55,py-velocityY*.027-radius*.55,radius*1.1,radius*1.1);
        }
        ctx.save();ctx.translate(px,py);ctx.rotate(angle);ctx.globalAlpha=alpha;
        if(glass)ctx.drawImage(glassDrop,-radius,-radius*1.5,radius*2,radius*3);
        else {ctx.fillStyle='#bdfff7';ctx.beginPath();ctx.ellipse(0,0,radius*.6,radius,0,0,TAU);ctx.fill()}
        ctx.restore();
      }
    }
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.shadowBlur=0;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function animateDarkFire(ctx,w,h,start){
  const TAU=Math.PI*2,R=Math.min(258,w*.31,h*.265),cx=w/2,cy=h*(h<540?.43:.45);
  const compact=w<600||h<540,starCount=compact?44:66,currentCount=compact?20:28;
  const clamp=n=>Math.max(0,Math.min(1,n)),smooth=n=>{n=clamp(n);return n*n*(3-2*n)};
  gate.style.setProperty('--cinematic-portal-radius',R+'px');
  gate.style.setProperty('--cinematic-portal-y',cy+'px');
  function texture(size,stops){
    const tile=document.createElement('canvas');tile.width=tile.height=size;
    const brush=tile.getContext('2d');if(!brush)return null;
    const gradient=brush.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
    stops.forEach(([offset,color])=>gradient.addColorStop(offset,color));
    brush.fillStyle=gradient;brush.fillRect(0,0,size,size);return tile;
  }
  const night=texture(384,[[0,'#02030cf5'],[.38,'#050617e8'],[.68,'#080b2599'],[1,'#080b2500']]);
  const nebula=texture(192,[[0,'#a874ff99'],[.16,'#7242ff70'],[.4,'#4426b23a'],[.72,'#21135d14'],[1,'#21135d00']]);
  const indigo=texture(192,[[0,'#81b7ff80'],[.15,'#456ee955'],[.4,'#26389f30'],[1,'#16267600']]);
  const ringGlow=texture(384,[[0,'#643cff00'],[.53,'#643cff00'],[.66,'#6239f324'],[.73,'#9a66ef69'],[.77,'#d6adff88'],[.8,'#8b4cff40'],[.92,'#39297e12'],[1,'#39297e00']]);
  const voidTexture=texture(256,[[0,'#01020aff'],[.7,'#01030bff'],[.94,'#04051aff'],[.985,'#0b062af0'],[1,'#0b062a00']]);
  const star=texture(32,[[0,'#fffaff'],[.13,'#eee1ff'],[.36,'#9d89ef88'],[1,'#714dc900']]);
  const orbitTilt=-.29,tiltCos=Math.cos(orbitTilt),tiltSin=Math.sin(orbitTilt);
  function orbitalPoint(angle,radius,depth=.62){
    const x=Math.cos(angle)*radius,y=Math.sin(angle)*radius*depth;
    return [x*tiltCos-y*tiltSin,x*tiltSin+y*tiltCos];
  }
  // Bake complex currents once. Frames translate/rotate/scale these layers instead of
  // rebuilding thousands of wavy path points and blending nine nebula blooms.
  const layerSize=compact?384:640,unit=layerSize/3.7,span=layerSize/unit;
  function layer(painter,heightRatio=1){
    const tile=document.createElement('canvas');tile.width=layerSize;tile.height=Math.ceil(layerSize*heightRatio);
    const brush=tile.getContext('2d');if(!brush)return null;
    brush.translate(tile.width/2,tile.height/2);brush.globalCompositeOperation='lighter';
    painter(brush);return tile;
  }
  function orbitArc(brush,radius,depth,a,b,width,color){
    brush.beginPath();
    for(let k=0;k<=45;k++){
      const p=orbitalPoint(a+(b-a)*k/45,radius,depth);
      k?brush.lineTo(...p):brush.moveTo(...p);
    }
    brush.strokeStyle=color;brush.lineWidth=width;brush.stroke();
  }
  function currents(brush,front){
    for(let i=0;i<currentCount;i++){
      const f=i/(currentCount-1),phase=i*.61803398875*TAU;
      const begin=front?0:Math.PI,end=front?Math.PI:TAU;
      const radius=unit*(.87+f*.47),depth=.56+f*.12;
      brush.beginPath();
      for(let k=0;k<=38;k++){
        const u=k/38,a=begin+(end-begin)*u;
        const d=radius+unit*.018*Math.sin(a*3+phase)+unit*.011*Math.sin(a*7-phase*.7);
        const p=orbitalPoint(a,d,depth),lift=unit*.026*Math.sin(a*2+phase)*Math.sin(u*Math.PI);
        k?brush.lineTo(p[0],p[1]+lift):brush.moveTo(p[0],p[1]+lift);
      }
      brush.globalAlpha=.25+.5*Math.pow(.5+.5*Math.sin(phase+f*11),4);
      brush.strokeStyle=i%5===0?'#789df1':i%3===0?'#caa0ff':'#8660db';
      brush.lineWidth=Math.max(.7,unit*(i%5===0?.0045:.003));brush.stroke();
      if(i%4===0){brush.globalAlpha=.09;brush.lineWidth=unit*.028;brush.stroke()}
    }
    brush.globalAlpha=front?.64:.52;
    orbitArc(brush,unit*(front?1.35:1.38),front?.67:.69,front?.06:Math.PI+.15,front?Math.PI-.1:TAU-.05,unit*.005,front?'#ccb4ff':'#ad8ceb');
    brush.globalAlpha=front?.19:.25;
    orbitArc(brush,unit*(front?1.43:1.48),front?.68:.72,front?.18:Math.PI+.35,front?Math.PI-.28:TAU-.27,unit*(front?.035:.0025),front?'#7957c6':'#7496da');
  }
  const storm=layer(brush=>{
    for(let i=0;i<9;i++){
      const a=i*TAU/9-.4,d=unit*(.9+.13*Math.sin(i*2.4)),p=orbitalPoint(a,d,.84);
      const size=unit*(1.08+.25*Math.sin(i*.91)),sprite=i%3===0?indigo:nebula;
      brush.globalAlpha=.29+.11*Math.sin(i*1.7);
      if(sprite)brush.drawImage(sprite,p[0]-size/2,p[1]-size/2,size,size);
    }
    brush.save();brush.rotate(orbitTilt);brush.globalAlpha=.72;
    if(ringGlow)brush.drawImage(ringGlow,-unit*1.74,-unit*1.02,unit*3.48,unit*2.04);
    brush.restore();
    for(let i=0;i<4;i++){
      const a=-2.55+i*1.49;brush.beginPath();
      for(let k=0;k<=34;k++){
        const u=k/34,ang=a+u*.62,d=unit*(1.16+Math.sin(u*Math.PI)*(.23+.06*Math.sin(i*2)));
        const x=Math.cos(ang)*d,y=Math.sin(ang)*d*.94;
        k?brush.lineTo(x,y):brush.moveTo(x,y);
      }
      brush.globalAlpha=.12;brush.strokeStyle=i%2?'#618ef4':'#ba81ff';brush.lineWidth=unit*.023;brush.stroke();
      brush.globalAlpha=.48;brush.lineWidth=unit*.0035;brush.stroke();
    }
  });
  const farDisk=layer(brush=>currents(brush,false),.64);
  const nearDisk=layer(brush=>currents(brush,true),.64);
  const spiral=layer(brush=>{
    for(let arm=0;arm<3;arm++){
      brush.beginPath();
      for(let k=0;k<=48;k++){
        const u=k/48,a=arm*TAU/3+u*2.75,d=unit*(1.37-u*.66),p=orbitalPoint(a,d,.9);
        k?brush.lineTo(...p):brush.moveTo(...p);
      }
      brush.globalAlpha=.13;brush.strokeStyle=arm===1?'#7297ec':'#a57cf2';brush.lineWidth=unit*.018;brush.stroke();
      brush.globalAlpha=.3;brush.lineWidth=unit*.003;brush.stroke();
    }
  },.86);
  const stars=Array.from({length:starCount},(_,i)=>{
    const a=i*2.399963,z=.24+(i*.61803398875)%1;
    return {x:Math.cos(a),y:Math.sin(a),z,base:R*(.72+z*1.65),phase:i*1.7};
  });
  // A tapered comet sprite has one long luminous tail, a narrow white core, and
  // a radiant head; it crosses the screen continuously during the final beat.
  const meteor=document.createElement('canvas');meteor.width=640;meteor.height=88;
  const meteorBrush=meteor.getContext('2d');
  if(meteorBrush){
    const tail=meteorBrush.createLinearGradient(0,0,602,0);
    [[0,'#683cd400'],[.22,'#754afc05'],[.55,'#8267ff44'],[.84,'#b8b2ffcc'],[1,'#f6f4ff']].forEach(([s,c])=>tail.addColorStop(s,c));
    meteorBrush.fillStyle=tail;meteorBrush.beginPath();meteorBrush.moveTo(0,44);
    meteorBrush.quadraticCurveTo(390,21,602,34);meteorBrush.lineTo(614,44);
    meteorBrush.lineTo(602,54);meteorBrush.quadraticCurveTo(390,67,0,44);meteorBrush.fill();
    const core=meteorBrush.createLinearGradient(0,0,610,0);core.addColorStop(0,'#a495ff00');core.addColorStop(.58,'#bcbeff33');core.addColorStop(1,'#ffffff');
    meteorBrush.strokeStyle=core;meteorBrush.lineWidth=2.3;meteorBrush.beginPath();meteorBrush.moveTo(48,44);meteorBrush.lineTo(615,44);meteorBrush.stroke();
    if(star){meteorBrush.drawImage(star,583,17,54,54);meteorBrush.drawImage(star,599,33,22,22)}
    meteorBrush.strokeStyle='#fff7ff';meteorBrush.lineWidth=1.3;
    meteorBrush.beginPath();meteorBrush.moveTo(609,32);meteorBrush.lineTo(609,56);meteorBrush.moveTo(601,44);meteorBrush.lineTo(620,44);meteorBrush.stroke();
  }
  function drawLayer(tile,r,angle,alpha){
    if(!tile||alpha<=0)return;
    ctx.save();ctx.rotate(angle);ctx.globalAlpha=alpha;
    const width=r*span,height=width*tile.height/tile.width;
    ctx.drawImage(tile,-width/2,-height/2,width,height);ctx.restore();
  }
  function drawMeteor(t,delay,scale,offset){
    const u=(t-(2.25+delay))/.79;if(u<=0||u>=1)return;
    const opacity=smooth(u/.11)*(1-smooth((u-.81)/.19))*(1-smooth((t-3.03)/.14));
    const dx=w*1.45,dy=h*.58,angle=Math.atan2(dy,dx);
    const x=-w*.22+u*dx,y=h*(.08+offset)+u*dy;
    const length=Math.min(640,Math.max(300,w*.56))*scale;
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=opacity*(scale>.7?1:.57);
    ctx.drawImage(meteor,-length*.952,-length*44/640,length,length*88/640);ctx.restore();
  }
  function frame(now){
    const t=Math.max(0,(now-start)/1000);
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.shadowBlur=0;
    if(!gate.classList.contains('rex-entering')||t>=3.2){ctx.clearRect(0,0,w,h);return}
    const gather=smooth(t/.95),awaken=smooth((t-.25)/.9),peak=smooth((t-.7)/.6);
    const travel=smooth((t-2.4)/.8),fade=1-smooth((t-2.88)/.32);
    const energy=fade*awaken,r=R*(.68+.32*gather)*(1+travel*3.3);
    ctx.clearRect(0,0,w,h);ctx.globalAlpha=fade*gather;
    if(night)ctx.drawImage(night,cx-R*2.5,cy-R*2.5,R*5,R*5);
    ctx.save();ctx.translate(cx,cy);ctx.globalCompositeOperation='lighter';
    drawLayer(storm,r,t*.018,energy*(.94+.06*Math.sin(t*.9)));
    drawLayer(farDisk,r,-.018*Math.sin(t*.6),energy);
    drawLayer(spiral,r,-t*.24,energy);
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=energy;
    if(voidTexture)ctx.drawImage(voidTexture,-r*.7,-r*.7,r*1.4,r*1.4);
    else{ctx.fillStyle='#01030b';ctx.beginPath();ctx.arc(0,0,r*.7,0,TAU);ctx.fill()}
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=energy*.2;
    ctx.strokeStyle='#734ad0';ctx.lineWidth=r*.025;ctx.beginPath();ctx.arc(0,0,r*.708,0,TAU);ctx.stroke();
    ctx.globalAlpha=energy*.63;ctx.strokeStyle='#a18af0';ctx.lineWidth=Math.max(.8,r*.004);
    ctx.beginPath();ctx.arc(0,0,r*.703,.28,Math.PI*1.64);ctx.stroke();
    drawLayer(nearDisk,r,.018*Math.sin(t*.6),energy);
    if(nebula)for(let i=0;i<2;i++){
      const p=orbitalPoint(i*Math.PI+.24-t*.43,r*1.25,.66),size=r*.5;
      ctx.globalAlpha=energy*(.6+.2*peak);ctx.drawImage(nebula,p[0]-size/2,p[1]-size/2,size,size);
      ctx.globalAlpha=energy*.8;if(star)ctx.drawImage(star,p[0]-r*.038,p[1]-r*.038,r*.076,r*.076);
    }
    ctx.restore();ctx.globalCompositeOperation='lighter';
    const rotation=t*.025,cos=Math.cos(rotation),sin=Math.sin(rotation),glimmer=Math.sin(t*.8);
    for(let i=0;i<stars.length;i++){
      const s=stars[i],vx=s.x*cos-s.y*sin,vy=s.x*sin+s.y*cos;
      const d=s.base*(1-.17*gather)*(1+travel*(3.4+s.z*3)),x=cx+vx*d,y=cy+vy*d;
      if(x<-170||x>w+170||y<-170||y>h+170)continue;
      ctx.globalAlpha=fade*gather*(.65+.1*glimmer)*(i%7===0?.85:.46);
      const length=(travel*(40+s.z*125)+awaken*(i%11===0?7:1.5))*(compact?.7:1);
      ctx.strokeStyle=i%5===0?'#cde4ff':'#bb9cf2';ctx.lineWidth=i%9===0?1.35:.7;
      ctx.beginPath();ctx.moveTo(x-vx*length,y-vy*length);ctx.lineTo(x,y);ctx.stroke();
      if(star&&i%3===0){const size=(i%9===0?12:6)*(1+travel*.3);ctx.drawImage(star,x-size/2,y-size/2,size,size)}
    }
    const wave=(t-2.4)/.55;
    if(wave>0&&wave<1){
      ctx.globalAlpha=fade*(1-wave)*.3;ctx.strokeStyle='#9c82e9';ctx.lineWidth=Math.max(1,R*.012*(1-wave));
      ctx.beginPath();ctx.ellipse(cx,cy,R*(1.3+wave*3.2),R*(1.04+wave*2.8),orbitTilt,0,TAU);ctx.stroke();
    }
    drawMeteor(t,0,1,0);drawMeteor(t,.13,.43,-.1);drawMeteor(t,.23,.28,.06);
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function portalDuration(){return matchMedia('(prefers-reduced-motion: reduce)').matches?180:{blue:2800,waterfall:3000,dark:3200,legendary:3400}[portalTheme]}
function animateFire(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const ctx=fireCanvas.getContext('2d');if(!ctx)return;
  const w=gate.clientWidth,h=gate.clientHeight;
  const darkMode=portalTheme==='dark';const dpr=Math.min(darkMode?1:1.5,devicePixelRatio||1,Math.sqrt((darkMode?1500000:2500000)/(w*h)));
  fireCanvas.width=Math.floor(w*dpr);fireCanvas.height=Math.floor(h*dpr);ctx.scale(dpr,dpr);
  const renderer={blue:animateBlueFire,waterfall:animateWaterfallFire,dark:animateDarkFire,legendary:animateLegendaryFire}[portalTheme];
  renderer(ctx,w,h,performance.now());
}
async function enterWorld(){status.textContent='通行令已确认 · 正在开启魔法世界…';gate.classList.add('rex-entering');animateFire();await new Promise(resolve=>setTimeout(resolve,portalDuration()));setLocked(false);gate.classList.remove('rex-entering')}
function setLocked(locked){document.documentElement.classList.toggle('rex-locked',locked);gate.hidden=!locked;for(const child of document.body.children){if(child!==gate&&child!==lock&&child.tagName!=='SCRIPT')child.inert=locked}if(locked){input.value='';status.textContent='';input.focus()}else{input.value='';const target=previousFocus?.isConnected?previousFocus:document.querySelector('main');if(target){if(!target.hasAttribute('tabindex'))target.setAttribute('tabindex','-1');target.focus({preventScroll:true})}}}
form.addEventListener('submit',async event=>{event.preventDefault();if(button.disabled||previewing)return;button.disabled=true;status.textContent='正在验证…';try{const data=new TextEncoder().encode('rex-local-unlock-v1:'+input.value),digest=await crypto.subtle.digest('SHA-256',data),actual=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');if(actual===expected)await enterWorld();else{status.textContent='密码不正确，请重新输入。';input.select();input.focus()}}catch{status.textContent='无法验证密码，请使用支持本地网页的新版浏览器。'}finally{button.disabled=false}});
lock.addEventListener('click',()=>{previousFocus=document.activeElement;setLocked(true)});
setLocked(true);
})();
