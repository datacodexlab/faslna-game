import {playPop} from "./audio.js";
export const EFFECTS = ['party'];
let cleanup = null;
let sequenceTimer = 0;
export function selectAnswer(pending, id) {
  return pending === id ? {pending:null,confirmed:true} : {pending:id,confirmed:false};
}
export function celebrationCount(event) { return event === 'round' ? 3 : 1; }
export function stopCelebration() { clearTimeout(sequenceTimer);sequenceTimer=0;cleanup?.();cleanup=null; }
export function celebrate(reduced = false, count = 1, soundEnabled = true) {
  stopCelebration();
  let remaining=Math.min(3,Math.max(1,count));
  const next=()=>{
    playCelebration(reduced, soundEnabled);
    if(--remaining>0) sequenceTimer=setTimeout(next,3100);
  };
  next();
}
export function hitBalloon(b, x, y) {
  const rx=b.size*.8, ry=b.size*1.2;
  return ((x-b.x)/rx)**2 + ((y-b.y)/ry)**2 <= 1;
}
export function hitStar(s, x, y) {
  const r=s.size*1.25;
  return (x-s.x)**2 + (y-s.y)**2 <= r*r;
}
const BALLOON_COLORS=['#ff6fb1','#4db6ff','#7ed957','#ffd34e','#a855f7','#ff8c42'];
const STAR_COLORS=['#ffd34e','#ff6fb1','#7ed957','#4db6ff'];
const DARK='#4b4e6d';
function playCelebration(reduced, soundEnabled) {
  cleanup?.();cleanup=null;
  const effect=EFFECTS[0];
  const canvas=document.createElement('canvas');
  canvas.className='celebration-layer';canvas.setAttribute('aria-hidden','true');canvas.dataset.effect=effect;
  canvas.style.pointerEvents='auto';
  document.body.append(canvas);
  const ctx=canvas.getContext('2d');
  if(!ctx) {canvas.remove();return;}
  const w=window.innerWidth,h=window.innerHeight,dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=w*dpr;canvas.height=h*dpr;ctx.scale(dpr,dpr);
  const quiet=reduced||window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const balloons=Array.from({length:8},()=>({x:30+Math.random()*(w-60),y:Math.random()*h,size:24+Math.random()*14,color:BALLOON_COLORS[Math.floor(Math.random()*BALLOON_COLORS.length)],speed:22+Math.random()*18,phase:Math.random()*Math.PI*2,sway:8+Math.random()*8}));
  const stars=Array.from({length:14},()=>({x:30+Math.random()*(w-60),y:30+Math.random()*(h-60),size:13+Math.random()*12,color:STAR_COLORS[Math.floor(Math.random()*STAR_COLORS.length)],phase:Math.random()*Math.PI*2,spin:(Math.random()-.5)*.5}));
  const sparkles=Array.from({length:18},()=>({x:Math.random()*w,y:Math.random()*h,size:3+Math.random()*4,phase:Math.random()*Math.PI*2}));
  const bursts=[];
  const rings=[];
  let frame=0,timer=0,lastNow=0;
  const start=performance.now();
  const onTap=(event)=>{
    const x=event.clientX,y=event.clientY;
    for(let i=balloons.length-1;i>=0;i--) {
      if(hitBalloon(balloons[i],x,y)) {pop(balloons[i].x,balloons[i].y,balloons[i].color);balloons.splice(i,1);event.stopPropagation();event.preventDefault();if(quiet) render(.65);return;}
    }
    for(let i=stars.length-1;i>=0;i--) {
      if(hitStar(stars[i],x,y)) {pop(stars[i].x,stars[i].y,stars[i].color);stars.splice(i,1);event.stopPropagation();event.preventDefault();if(quiet) render(.65);return;}
    }
  };
  const pop=(x,y,color)=>{
    bursts.push({x,y,age:0,color,parts:Array.from({length:8},(_,i)=>({angle:i*Math.PI/4,dist:26+Math.random()*22,size:4+Math.random()*4}))});
    rings.push({x,y,age:0});
    void playPop(soundEnabled);
  };
  canvas.addEventListener('pointerdown',onTap);
  cleanup=()=>{cancelAnimationFrame(frame);clearTimeout(timer);canvas.removeEventListener('pointerdown',onTap);canvas.remove();};
  function face(x,y,s) {
    ctx.fillStyle=DARK;
    ctx.beginPath();ctx.arc(x-s*.22,y-s*.08,s*.09,0,Math.PI*2);ctx.arc(x+s*.22,y-s*.08,s*.09,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=DARK;ctx.lineWidth=Math.max(1.5,s*.07);ctx.lineCap='round';
    ctx.beginPath();ctx.arc(x,y+s*.12,s*.28,Math.PI*.15,Math.PI*.85);ctx.stroke();
  }
  function balloon(b,t) {
    const x=b.x+Math.sin(t*1.4+b.phase)*b.sway,y=b.y;
    ctx.save();ctx.translate(x,y);
    ctx.strokeStyle=DARK;ctx.lineWidth=2;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(0,b.size);ctx.quadraticCurveTo(9,b.size+16,0,b.size+32);ctx.quadraticCurveTo(-9,b.size+44,0,b.size+56);ctx.stroke();
    ctx.fillStyle=b.color;ctx.strokeStyle=DARK;ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(0,b.size-2);ctx.lineTo(-7,b.size+8);ctx.lineTo(7,b.size+8);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.ellipse(0,0,b.size*.68,b.size,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff';ctx.globalAlpha=.55;
    ctx.beginPath();ctx.ellipse(-b.size*.26,-b.size*.38,b.size*.2,b.size*.3,-.5,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
    face(0,-b.size*.05,b.size*.9);
    ctx.restore();
  }
  function starPath(x,y,r) {
    ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,rr=i%2?r*.45:r;ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}ctx.closePath();
  }
  function star(s,t) {
    const twinkle=.9+.12*Math.sin(t*3+s.phase);
    ctx.save();ctx.translate(s.x,s.y);ctx.rotate(Math.sin(t*.8+s.phase)*.15);ctx.scale(twinkle,twinkle);
    ctx.fillStyle=s.color;ctx.strokeStyle=DARK;ctx.lineWidth=2;
    starPath(0,0,s.size);ctx.fill();ctx.stroke();
    face(0,0,s.size*.8);
    ctx.restore();
  }
  function sparkle4(x,y,r,alpha) {
    ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#fff';
    ctx.beginPath();ctx.moveTo(x,y-r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.quadraticCurveTo(x,y,x,y+r);ctx.quadraticCurveTo(x,y,x-r,y);ctx.quadraticCurveTo(x,y,x,y-r);ctx.fill();
    ctx.restore();
  }
  function render(t,dt) {
    ctx.clearRect(0,0,w,h);
    for(const b of balloons) {
      if(!quiet) {b.y-=b.speed*dt;if(b.y<-70){b.y=h+50;b.x=30+Math.random()*(w-60);}}
      balloon(b,t);
    }
    for(const s of stars) star(s,t);
    for(const p of sparkles) sparkle4(p.x,p.y,p.size,.35+.35*Math.sin(t*2+p.phase));
    for(let i=bursts.length-1;i>=0;i--) {
      const burst=bursts[i];
      if(!quiet) burst.age+=dt;
      const alpha=Math.max(0,1-burst.age/.6);
      for(const part of burst.parts) {
        const d=part.dist*(quiet?1:burst.age*90);
        sparkle4(burst.x+Math.cos(part.angle)*d,burst.y+Math.sin(part.angle)*d,part.size,alpha);
      }
      if(burst.age>=.6) bursts.splice(i,1);
    }
    for(let i=rings.length-1;i>=0;i--) {
      const ring=rings[i];
      if(!quiet) ring.age+=dt;
      const progress=Math.min(1,ring.age/.5);
      ctx.save();ctx.globalAlpha=(1-progress)*.8;ctx.strokeStyle='#fff';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(ring.x,ring.y,6+progress*30,0,Math.PI*2);ctx.stroke();ctx.restore();
      if(ring.age>=.5) rings.splice(i,1);
    }
  }
  function draw(now) {
    const t=quiet?.65:(now-start)/1000;
    const dt=quiet?0:Math.min(.05,lastNow?(now-lastNow)/1000:0);
    lastNow=now;
    render(t,dt);
    if(!quiet&&t<3) frame=requestAnimationFrame(draw);
    else timer=setTimeout(()=>{cleanup?.();cleanup=null;},quiet?2000:0);
  }
  if(quiet) {render(.65,0);timer=setTimeout(()=>{cleanup?.();cleanup=null;},2000);}
  else frame=requestAnimationFrame(draw);
}
