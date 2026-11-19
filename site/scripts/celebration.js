import {playPop} from "./audio.js";
export const EFFECTS = ['cannon','fireworks','rain','rocket','bigstar','tapgame'];
let previous = -1;
let cleanup = null;
let sequenceTimer = 0;
export function selectAnswer(pending, id) {
  return pending === id ? {pending:null,confirmed:true} : {pending:id,confirmed:false};
}
export function nextEffect(last, random = Math.random) {
  const offset = Math.floor(random() * (EFFECTS.length - (last < 0 ? 0 : 1)));
  return last >= 0 && offset >= last ? offset + 1 : offset;
}
export function celebrationCount(event) { return event === 'round' ? 3 : 2; }
export function stopCelebration() { clearTimeout(sequenceTimer);sequenceTimer=0;cleanup?.();cleanup=null; }
export function celebrate(reduced = false, count = 1, soundEnabled = true) {
  stopCelebration();
  let remaining=Math.min(3,Math.max(1,count));
  const interval=count>=3?3100:1550;
  const next=()=>{
    playCelebration(reduced, soundEnabled, interval);
    if(--remaining>0) sequenceTimer=setTimeout(next,interval);
  };
  next();
}
export function makeShapedBurst(x, y, color, shape = 'ring') {
  const parts=[];
  for(let i=0;i<16;i++){
    let angle,dist;
    if(shape==='star'){angle=Math.floor(i/16*5)*Math.PI*2/5+(Math.random()-.5)*.3;dist=30+Math.random()*30;}
    else if(shape==='heart'){const th=i/16*Math.PI*2,hx=16*Math.pow(Math.sin(th),3),hy=13*Math.cos(th)-5*Math.cos(2*th)-2*Math.cos(3*th)-Math.cos(4*th);angle=Math.atan2(-hy,hx);dist=Math.hypot(hx,hy)*2.2+8;}
    else {angle=i*Math.PI/8;dist=30+Math.random()*30;}
    parts.push({angle,dist,size:5+Math.random()*4});
  }
  return {x,y,age:0,color,parts};
}
export function makeBurst(x, y, color) { return makeShapedBurst(x,y,color,'ring'); }
const COLORS=['#f4b824','#ed6488','#0f9186','#588be5','#a56bdd','#ef8739'];
const DARK='#4b4e6d';
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=(arr)=>arr[Math.floor(Math.random()*arr.length)];
function playCelebration(reduced, soundEnabled, intervalMs) {
  cleanup?.();cleanup=null;
  previous=nextEffect(previous);
  const effect=EFFECTS[previous];
  const canvas=document.createElement('canvas');
  canvas.className='celebration-layer';canvas.setAttribute('aria-hidden','true');canvas.dataset.effect=effect;
  document.body.append(canvas);
  const ctx=canvas.getContext('2d');
  if(!ctx) {canvas.remove();return;}
  const w=window.innerWidth,h=window.innerHeight,dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=w*dpr;canvas.height=h*dpr;ctx.scale(dpr,dpr);
  const DUR=intervalMs/1000,S=DUR/3.1;
  const quiet=reduced||window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sc={bursts:[],rings:[],tracers:[],trail:[],rockets:[],confetti:[],stars:[],targets:[],balloons:[],bubbles:[],butterflies:[],hearts:[],sparkles:[],cannon:null,shots:[],nextShot:0,shotTimes:[.2,1.1,2].map(v=>v*S),nextRocket:0,finaleDone:false,rainbowA:0,bigRocket:null,bigRocket2:null,rot:0,nextTarget:0};
  if(effect==='cannon'){sc.cannon={edge:'left',x:30,y:h*.55,angle:0};sc.balloons=Array.from({length:4},()=>({x:rnd(30,w-30),y:rnd(0,h),size:rnd(20,30),color:pick(COLORS),vy:rnd(18,30),phase:rnd(0,6)}));}
  if(effect==='fireworks'){sc.rockets=Array.from({length:2},()=>({x:rnd(40,w-40),y:rnd(h*.3,h*.8),vy:rnd(220,300),targetY:rnd(h*.15,h*.4),color:pick(COLORS),shape:pick(['ring','star','heart'])}));}
  if(effect==='rain'){sc.confetti=Array.from({length:60},()=>({x:rnd(0,w),y:rnd(0,h),size:rnd(7,13),color:pick(COLORS),rot:rnd(0,6),vr:rnd(-3,3),vy:rnd(90,150),phase:rnd(0,6)}));sc.stars=Array.from({length:20},()=>({x:rnd(20,w-20),y:rnd(0,h),size:rnd(12,20),color:pick(['#ffd34e','#ff6fb1','#7ed957']),vy:rnd(70,120),phase:rnd(0,6)}));sc.butterflies=Array.from({length:3},()=>({x:rnd(0,w),y:rnd(h*.2,h*.7),vx:rnd(15,30)*(Math.random()<.5?-1:1),phase:rnd(0,6)}));}
  if(effect==='rocket'){sc.bubbles=Array.from({length:8},()=>({x:rnd(20,w-20),y:rnd(0,h),r:rnd(8,18),vy:rnd(20,40),phase:rnd(0,6)}));sc.bigRocket={x:-40,y:h*.8,ex:-40,ey:h*.8,tx:w*.75,ty:h*.15,dur:1.1*S,age:0,done:false};sc.bigRocket2={x:w+40,y:h*.6,tx:w*.25,ty:h*.25,dur:1.1*S,age:0,started:false,done:false};}
  if(effect==='bigstar'){sc.hearts=Array.from({length:6},()=>({x:rnd(30,w-30),y:rnd(0,h),size:rnd(12,20),color:pick(['#ff6fb1','#ed6488','#ff8fb1']),vy:rnd(25,45),phase:rnd(0,6)}));}
  if(effect==='tapgame'){sc.targets=Array.from({length:3},()=>({x:rnd(40,w-40),y:rnd(60,h*.6),size:26,color:'#ffd34e',age:rnd(0,.5),life:1.4}));sc.confetti=Array.from({length:24},()=>({x:rnd(0,w),y:rnd(0,h),size:rnd(7,12),color:pick(COLORS),rot:rnd(0,6),vr:rnd(-3,3),vy:rnd(60,110),phase:rnd(0,6)}));}
  let frame=0,timer=0,lastNow=0;
  const start=performance.now();
  const popAt=(x,y,color)=>{sc.bursts.push(makeBurst(x,y,color));sc.rings.push({x,y,age:0});void playPop(soundEnabled);};
  const fireCannon=(tx,ty)=>{
    const c=sc.cannon;if(!c) return;
    c.angle=Math.atan2(ty-c.y,tx-c.x);
    const mx=c.x+Math.cos(c.angle)*64,my=c.y+Math.sin(c.angle)*64;
    sc.tracers.push({x1:mx,y1:my,x2:tx,y2:ty,age:0});
    sc.bursts.push(makeShapedBurst(tx,ty,pick(COLORS),pick(['ring','star'])));
    sc.rings.push({x:tx,y:ty,age:0});
    void playPop(soundEnabled);
  };
  const placeCannon=()=>{
    const edge=pick(['left','right','top']);
    if(edge==='left') sc.cannon={edge,x:30,y:h*.55,angle:0};
    else if(edge==='right') sc.cannon={edge,x:w-30,y:h*.55,angle:Math.PI};
    else sc.cannon={edge,x:w*.5,y:30,angle:Math.PI/2};
  };
  const explodeRocket=(r)=>{
    sc.bursts.push(makeShapedBurst(r.x,r.y,r.color,r.shape));
    sc.bursts.push(makeShapedBurst(r.x,r.y,pick(COLORS),'ring'));
    sc.rings.push({x:r.x,y:r.y,age:0});
    void playPop(soundEnabled);
  };
  const onTap=(event)=>{
    const x=event.clientX,y=event.clientY;
    if(effect==='tapgame'||effect==='rain'){
      const list=effect==='tapgame'?sc.targets:sc.stars;
      for(let i=list.length-1;i>=0;i--){
        if(Math.hypot(x-list[i].x,y-list[i].y)<=list[i].size*1.4){
          popAt(list[i].x,list[i].y,list[i].color);list.splice(i,1);
          if(effect==='rain') sc.stars.push({x:rnd(20,w-20),y:-20,size:rnd(12,20),color:pick(['#ffd34e','#ff6fb1','#7ed957']),vy:rnd(70,120),phase:rnd(0,6)});
          if(quiet) render(.65);
          return;
        }
      }
    }
    if(effect==='cannon'&&sc.cannon&&Math.hypot(x-sc.cannon.x,y-sc.cannon.y)<=70){fireCannon(rnd(w*.2,w*.8),rnd(h*.1,h*.5));if(quiet) render(.65);return;}
    popAt(x,y,pick(COLORS));
    if(quiet) render(.65);
  };
  window.addEventListener?.('pointerdown',onTap);
  cleanup=()=>{cancelAnimationFrame(frame);clearTimeout(timer);window.removeEventListener?.('pointerdown',onTap);canvas.remove();};
  function starPath(x,y,r){
    ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,rr=i%2?r*.45:r;ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}ctx.closePath();
  }
  function heartPath(x,y,s){
    ctx.beginPath();
    for(let i=0;i<=20;i++){const th=i/20*Math.PI*2,hx=16*Math.pow(Math.sin(th),3),hy=13*Math.cos(th)-5*Math.cos(2*th)-2*Math.cos(3*th)-Math.cos(4*th);const px=x+hx*s/16,py=y-hy*s/16;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}
    ctx.closePath();
  }
  function sparkle4(x,y,r,alpha,color='#fff'){
    ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;
    ctx.beginPath();ctx.moveTo(x,y-r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.quadraticCurveTo(x,y,x,y+r);ctx.quadraticCurveTo(x,y,x-r,y);ctx.quadraticCurveTo(x,y,x,y-r);ctx.fill();
    ctx.restore();
  }
  function face(x,y,s){
    ctx.fillStyle=DARK;
    ctx.beginPath();ctx.arc(x-s*.22,y-s*.08,s*.09,0,Math.PI*2);ctx.arc(x+s*.22,y-s*.08,s*.09,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=DARK;ctx.lineWidth=Math.max(1.5,s*.07);ctx.lineCap='round';
    ctx.beginPath();ctx.arc(x,y+s*.12,s*.28,Math.PI*.15,Math.PI*.85);ctx.stroke();
  }
  function drawRocketShape(x,y,scale,angle){
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);
    ctx.fillStyle='#e95444';ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(10,10);ctx.lineTo(-10,10);ctx.closePath();ctx.fill();
    ctx.fillStyle='#ffd158';ctx.beginPath();ctx.moveTo(-6,10);ctx.lineTo(0,30);ctx.lineTo(6,10);ctx.closePath();ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,4,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  function update(dt,t){
    sc.bursts.forEach(b=>b.age+=dt);sc.bursts=sc.bursts.filter(b=>b.age<1);
    sc.rings.forEach(r=>r.age+=dt);sc.rings=sc.rings.filter(r=>r.age<.8);
    sc.tracers.forEach(tr=>tr.age+=dt);sc.tracers=sc.tracers.filter(tr=>tr.age<.2);
    sc.trail.forEach(p=>p.age+=dt);sc.trail=sc.trail.filter(p=>p.age<.4);
    sc.rot+=dt*.5;
    if(effect==='cannon'){
      sc.balloons.forEach(b=>{b.y-=b.vy*dt;if(b.y<-60){b.y=h+40;b.x=rnd(30,w-30);}});
      if(sc.nextShot<sc.shotTimes.length&&t>=sc.shotTimes[sc.nextShot]){sc.nextShot++;placeCannon();fireCannon(rnd(w*.2,w*.8),rnd(h*.1,h*.5));}
    }
    if(effect==='fireworks'){
      if(t< DUR*.7&&t>=sc.nextRocket){sc.nextRocket+=.5*S;sc.rockets.push({x:rnd(40,w-40),y:h+20,vy:rnd(240,320),targetY:rnd(h*.15,h*.4),color:pick(COLORS),shape:pick(['ring','star','heart'])});}
      sc.rockets.forEach(r=>{r.y-=r.vy*dt;sc.trail.push({x:r.x+rnd(-3,3),y:r.y+16,age:0,size:rnd(2,4),color:'#ffd34e'});});
      for(let i=sc.rockets.length-1;i>=0;i--){if(sc.rockets[i].y<=sc.rockets[i].targetY){explodeRocket(sc.rockets[i]);sc.rockets.splice(i,1);}}
      if(!sc.finaleDone&&t>=DUR*.75){sc.finaleDone=true;sc.rainbowA=.01;
        [[w*.25,h*.3,'star'],[w*.5,h*.22,'heart'],[w*.75,h*.3,'ring']].forEach(([x,y,shape])=>{sc.bursts.push(makeShapedBurst(x,y,pick(COLORS),shape));sc.rings.push({x,y,age:0});});
        void playPop(soundEnabled);}
      if(sc.rainbowA>0&&sc.rainbowA<1) sc.rainbowA=Math.min(1,sc.rainbowA+dt*2);
    }
    if(effect==='rain'){
      sc.confetti.forEach(c=>{c.y+=c.vy*dt;c.x+=Math.sin(t*2+c.phase)*20*dt;c.rot+=c.vr*dt;if(c.y>h+20){c.y=-20;c.x=rnd(0,w);}});
      sc.stars.forEach(s=>{s.y+=s.vy*dt;s.x+=Math.sin(t*2+s.phase)*15*dt;if(s.y>h+20){s.y=-20;s.x=rnd(20,w-20);}});
      sc.butterflies.forEach(b=>{b.x+=b.vx*dt;if(b.x<-40)b.x=w+40;if(b.x>w+40)b.x=-40;});
    }
    if(effect==='rocket'){
      sc.bubbles.forEach(b=>{b.y-=b.vy*dt;if(b.y<-30){b.y=h+30;b.x=rnd(20,w-20);}});
      const fly=(r)=>{
        if(r.done) return;
        r.age+=dt;const p=Math.min(1,r.age/r.dur);
        r.x=r.x+(r.tx-r.x)*Math.min(1,dt*4);r.y=r.y+(r.ty-r.y)*Math.min(1,dt*4);
        sc.trail.push({x:r.x+rnd(-4,4),y:r.y+rnd(-4,4),age:0,size:rnd(3,6),color:pick(['#ffd34e','#fff','#ff6fb1'])});
        if(p>=1){r.done=true;sc.bursts.push(makeShapedBurst(r.tx,r.ty,'#ffd34e','star'));sc.bursts.push(makeShapedBurst(r.tx,r.ty,'#ff6fb1','heart'));sc.bursts.push(makeShapedBurst(r.tx,r.ty,'#4db6ff','ring'));sc.rings.push({x:r.tx,y:r.ty,age:0});void playPop(soundEnabled);}
      };
      fly(sc.bigRocket);
      if(!sc.bigRocket2.started&&t>=.55*DUR){sc.bigRocket2.started=true;sc.bigRocket2.x=w+40;sc.bigRocket2.y=h*.6;}
      if(sc.bigRocket2.started) fly(sc.bigRocket2);
    }
    if(effect==='bigstar'){
      sc.hearts.forEach(hh=>{hh.y-=hh.vy*dt;hh.x+=Math.sin(t*2+hh.phase)*12*dt;if(hh.y<-30){hh.y=h+30;hh.x=rnd(30,w-30);}});
      for(let i=0;i<3;i++){const a=rnd(0,Math.PI*2),rr=rnd(40,75);sc.sparkles.push({x:w/2+Math.cos(a)*rr,y:h*.38+Math.sin(a)*rr*.8,vy:rnd(50,90),age:0,size:rnd(3,6),color:pick(['#ffd34e','#fff'])});}
      sc.sparkles.forEach(p=>{p.y+=p.vy*dt;p.age+=dt;});sc.sparkles=sc.sparkles.filter(p=>p.age<.8);
    }
    if(effect==='tapgame'){
      sc.confetti.forEach(c=>{c.y+=c.vy*dt;c.rot+=c.vr*dt;if(c.y>h+20){c.y=-20;c.x=rnd(0,w);}});
      if(t>=sc.nextTarget){sc.nextTarget+=.45*S;if(sc.targets.length<4) sc.targets.push({x:rnd(40,w-40),y:rnd(60,h*.6),size:26,color:'#ffd34e',age:0,life:1.4});}
      sc.targets.forEach(tg=>tg.age+=dt);sc.targets=sc.targets.filter(tg=>tg.age<tg.life);
    }
  }
  function render(t){
    ctx.clearRect(0,0,w,h);
    ctx.globalAlpha=quiet?1:Math.min(1,(DUR-t)*2);
    if(effect==='fireworks'&&sc.rainbowA>0){
      ctx.save();ctx.globalAlpha*=sc.rainbowA;
      COLORS.forEach((color,i)=>{ctx.strokeStyle=color;ctx.lineWidth=12;ctx.beginPath();ctx.arc(w/2,h*.72,Math.max(4,Math.min(w*.42,h*.5)-i*13),Math.PI,2*Math.PI);ctx.stroke();});
      ctx.restore();
    }
    if(effect==='cannon') sc.balloons.forEach(b=>{
      const x=b.x+Math.sin(t*1.4+b.phase)*8;
      ctx.save();ctx.translate(x,b.y);
      ctx.strokeStyle=DARK;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,b.size);ctx.quadraticCurveTo(8,b.size+16,0,b.size+30);ctx.stroke();
      ctx.fillStyle=b.color;ctx.strokeStyle=DARK;ctx.lineWidth=3;
      ctx.beginPath();ctx.ellipse(0,0,b.size*.68,b.size,0,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle='#fff';ctx.globalAlpha*=.55;ctx.beginPath();ctx.ellipse(-b.size*.26,-b.size*.38,b.size*.2,b.size*.3,-.5,0,Math.PI*2);ctx.fill();ctx.globalAlpha=quiet?1:Math.min(1,(DUR-t)*2);
      ctx.restore();
    });
    if(effect==='rocket') sc.bubbles.forEach(b=>{
      ctx.save();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.globalAlpha*=.7;
      ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(b.x-b.r*.3,b.y-b.r*.3,b.r*.25,0,Math.PI*2);ctx.fill();
      ctx.restore();
    });
    if(effect==='rain') sc.butterflies.forEach(b=>{
      const flap=quiet?1:.5+Math.abs(Math.sin(t*8+b.phase))*.5;
      ctx.save();ctx.translate(b.x,b.y+Math.sin(t*2+b.phase)*8);ctx.scale(flap*(b.vx<0?-1:1),1);ctx.fillStyle='#a56bdd';
      ctx.beginPath();ctx.ellipse(-8,0,9,14,-.4,0,Math.PI*2);ctx.ellipse(8,0,9,14,.4,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=DARK;ctx.fillRect(-2,-9,4,20);ctx.restore();
    });
    if(effect==='bigstar') sc.hearts.forEach(hh=>{
      ctx.save();ctx.fillStyle=hh.color;heartPath(hh.x,hh.y,hh.size);ctx.fill();ctx.restore();
    });
    if(effect==='cannon'&&sc.cannon){
      const c=sc.cannon;
      ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.angle);
      ctx.fillStyle='#3d4a6b';ctx.fillRect(0,-13,64,26);
      ctx.fillStyle='#ffd34e';ctx.fillRect(52,-15,10,30);
      ctx.restore();
      ctx.fillStyle='#3d4a6b';ctx.beginPath();ctx.arc(c.x,c.y,20,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ffd34e';ctx.beginPath();ctx.arc(c.x-8,c.y+14,7,0,Math.PI*2);ctx.arc(c.x+8,c.y+14,7,0,Math.PI*2);ctx.fill();
      sparkle4(c.x-18,c.y-20,5,.9,'#ffd34e');
    }
    if(effect==='fireworks'||effect==='rocket'){
      sc.trail.forEach(p=>{ctx.save();ctx.globalAlpha*=(1-p.age/.4);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();ctx.restore();});
    }
    if(effect==='fireworks') sc.rockets.forEach(r=>drawRocketShape(r.x,r.y,1,-.15));
    if(effect==='rain'){
      sc.confetti.forEach(c=>{ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.rot);ctx.fillStyle=c.color;ctx.fillRect(-4,-7,8,14);ctx.restore();});
      sc.stars.forEach(s=>{
        const tw=.9+.12*Math.sin(t*3+s.phase);
        ctx.save();ctx.translate(s.x,s.y);ctx.scale(tw,tw);ctx.fillStyle=s.color;ctx.strokeStyle=DARK;ctx.lineWidth=2;
        starPath(0,0,s.size);ctx.fill();ctx.stroke();face(0,0,s.size*.8);ctx.restore();
      });
    }
    if(effect==='rocket'){
      const fly=(r,scale)=>{
        if(r.done||(!r.started&&r!==sc.bigRocket)) return;
        const ang=Math.atan2(r.ty-r.y,r.tx-r.x);
        drawRocketShape(r.x,r.y,scale,ang+Math.PI/2);
      };
      fly(sc.bigRocket,2);
      if(sc.bigRocket2.started) fly(sc.bigRocket2,1.6);
    }
    if(effect==='bigstar'){
      const cx=w/2,cy=h*.38,scale=Math.min(1,t/.4),pulse=1+.05*Math.sin(t*4),size=64*scale*pulse;
      ctx.save();ctx.translate(cx,cy);
      for(let i=0;i<3;i++){ctx.save();ctx.globalAlpha*=(.14-i*.04);ctx.fillStyle='#ffd34e';ctx.beginPath();ctx.arc(0,0,size*(1.5+i*.35),0,Math.PI*2);ctx.fill();ctx.restore();}
      ctx.save();ctx.rotate(sc.rot*.4);ctx.strokeStyle='#ffd34e';ctx.globalAlpha*=.35;ctx.lineWidth=3;
      for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(Math.cos(a)*size*1.1,Math.sin(a)*size*1.1);ctx.lineTo(Math.cos(a)*size*1.6,Math.sin(a)*size*1.6);ctx.stroke();}
      ctx.restore();
      ctx.rotate(sc.rot*.15);ctx.fillStyle='#ffd34e';ctx.strokeStyle=DARK;ctx.lineWidth=3;
      starPath(0,0,size);ctx.fill();ctx.stroke();face(0,0,size*.8);
      ctx.restore();
      sc.sparkles.forEach(p=>sparkle4(p.x,p.y,p.size,Math.max(0,1-p.age/.8),p.color));
    }
    if(effect==='tapgame'){
      sc.confetti.forEach(c=>{ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.rot);ctx.fillStyle=c.color;ctx.fillRect(-4,-7,8,14);ctx.restore();});
      sc.targets.forEach(tg=>{
        const fade=tg.age>tg.life-.3?Math.max(0,(tg.life-tg.age)/.3):1;
        const pulse=1+.1*Math.sin(tg.age*10);
        ctx.save();ctx.globalAlpha*=fade;ctx.translate(tg.x,tg.y);ctx.scale(pulse,pulse);
        ctx.fillStyle=tg.color;ctx.strokeStyle=DARK;ctx.lineWidth=2;
        starPath(0,0,tg.size);ctx.fill();ctx.stroke();face(0,0,tg.size*.8);ctx.restore();
      });
    }
    ctx.globalAlpha=1;
    sc.tracers.forEach(tr=>{
      ctx.save();ctx.globalAlpha=Math.max(0,1-tr.age/.2);ctx.strokeStyle='#ffd34e';ctx.lineWidth=5;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(tr.x1,tr.y1);ctx.lineTo(tr.x2,tr.y2);ctx.stroke();
      ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(tr.x1,tr.y1);ctx.lineTo(tr.x2,tr.y2);ctx.stroke();ctx.restore();
    });
    sc.bursts.forEach(burst=>{
      const spread=quiet?1:Math.min(1,burst.age*6);
      const alpha=Math.max(0,1-burst.age/1);
      for(let j=0;j<burst.parts.length;j++){
        const part=burst.parts[j],d=part.dist*spread;
        sparkle4(burst.x+Math.cos(part.angle)*d,burst.y+Math.sin(part.angle)*d,part.size,alpha,j%2?'#fff':burst.color);
      }
    });
    sc.rings.forEach(ring=>{
      const progress=Math.min(1,ring.age/.8);
      ctx.save();ctx.globalAlpha=(1-progress)*.8;ctx.strokeStyle='#fff';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(ring.x,ring.y,6+progress*30,0,Math.PI*2);ctx.stroke();ctx.restore();
    });
  }
  function draw(now){
    const t=quiet?.65:(now-start)/1000;
    const dt=quiet?0:Math.min(.05,lastNow?(now-lastNow)/1000:0);
    lastNow=now;
    if(!quiet) update(dt,t);
    render(t);
    if(!quiet&&t<DUR) frame=requestAnimationFrame(draw);
    else timer=setTimeout(()=>{cleanup?.();cleanup=null;},quiet?2000:0);
  }
  frame=requestAnimationFrame(draw);
}
