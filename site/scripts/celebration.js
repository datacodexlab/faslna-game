import {playPop} from "./audio.js";
export const EFFECTS = ['stars','rockets','confetti','balloons','fireworks','bubbles','rainbow','butterflies','starburst','trophy'];
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
export function makeBurst(x, y, color) {
  return {x, y, age:0, color, parts:Array.from({length:16},(_,i)=>({angle:i*Math.PI/8, dist:30+Math.random()*30, size:5+Math.random()*4}))};
}
function playCelebration(reduced, soundEnabled) {
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
  const colors=['#f4b824','#ed6488','#0f9186','#588be5','#a56bdd','#ef8739'];
  const particles=Array.from({length:effect==='rockets'?18:effect==='balloons'?20:64},(_,i)=>({x:Math.random()*w,y:Math.random()*h,size:8+Math.random()*15,delay:Math.random()*.4,color:colors[i%colors.length],phase:Math.random()*Math.PI*2}));
  const quiet=reduced||window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bursts=[];
  const rings=[];
  let frame=0,timer=0,lastNow=0;
  const start=performance.now();
  const onTap=(event)=>{
    const burst=makeBurst(event.clientX,event.clientY,colors[Math.floor(Math.random()*colors.length)]);
    bursts.push(burst);
    rings.push({x:event.clientX,y:event.clientY,age:0});
    void playPop(soundEnabled);
    if(quiet) render(.65,0);
  };
  window.addEventListener?.('pointerdown',onTap);
  cleanup=()=>{cancelAnimationFrame(frame);clearTimeout(timer);window.removeEventListener?.('pointerdown',onTap);canvas.remove();};
  function star(x,y,r) {
    ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,rr=i%2?r*.45:r;ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}ctx.closePath();ctx.fill();
  }
  function sparkle4(x,y,r,alpha,color='#fff') {
    ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;
    ctx.beginPath();ctx.moveTo(x,y-r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.quadraticCurveTo(x,y,x,y+r);ctx.quadraticCurveTo(x,y,x-r,y);ctx.quadraticCurveTo(x,y,x,y-r);ctx.fill();
    ctx.restore();
  }
  function render(t,dt) {
    ctx.clearRect(0,0,w,h);
    ctx.globalAlpha=quiet?1:Math.min(1,(3-t)*2);
    if(effect==='rainbow') {
      colors.forEach((color,i)=>{ctx.strokeStyle=color;ctx.lineWidth=12;ctx.beginPath();ctx.arc(w/2,h*.7,Math.max(4,Math.min(w*.42,h*.5)-i*13),Math.PI,2*Math.PI);ctx.stroke();});
    }
    if(effect==='trophy') {
      ctx.fillStyle='#ffc43d';ctx.strokeStyle='#bd7b09';ctx.lineWidth=5;
      const x=w/2,y=h*.35;
      ctx.beginPath();ctx.moveTo(x-35,y);ctx.lineTo(x+35,y);ctx.quadraticCurveTo(x+35,y+55,x,y+60);ctx.quadraticCurveTo(x-35,y+55,x-35,y);ctx.fill();
      ctx.beginPath();ctx.arc(x-34,y+18,19,Math.PI/2,Math.PI*1.5);ctx.stroke();ctx.beginPath();ctx.arc(x+34,y+18,19,-Math.PI/2,Math.PI/2);ctx.stroke();
      ctx.fillRect(x-5,y+55,10,25);ctx.fillRect(x-28,y+80,56,10);
    }
    particles.forEach((p,i)=>{
      const age=Math.max(0,t-p.delay),rise=(p.y/h+age*.6)%1;
      let x=p.x+Math.sin(age*3+p.phase)*18,y=-30+rise*(h+70);
      if(['balloons','bubbles','butterflies','rockets'].includes(effect)) y=h+30-rise*(h+100);
      if(['fireworks','starburst'].includes(effect)){const angle=i*Math.PI*2/particles.length,r=(.12+age*.7%1)*Math.min(w,h)*.65;x=w/2+Math.cos(angle)*r;y=h*.4+Math.sin(angle)*r;}
      if(quiet){x=p.x;y=p.y;}
      ctx.save();ctx.translate(x,y);ctx.fillStyle=p.color;ctx.strokeStyle=p.color;ctx.lineWidth=2;
      if(effect==='bubbles'){ctx.beginPath();ctx.arc(0,0,p.size,0,Math.PI*2);ctx.stroke();}
      else if(effect==='balloons'){ctx.beginPath();ctx.ellipse(0,0,p.size*.65,p.size,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(0,p.size);ctx.quadraticCurveTo(8,p.size+18,0,p.size+35);ctx.stroke();}
      else if(effect==='rockets'){ctx.rotate(-.15);ctx.fillStyle='#e95444';ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(10,10);ctx.lineTo(-10,10);ctx.fill();ctx.fillStyle='#ffd158';ctx.beginPath();ctx.moveTo(-6,10);ctx.lineTo(0,30);ctx.lineTo(6,10);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,4,0,Math.PI*2);ctx.fill();}
      else if(effect==='butterflies'){const flap=quiet?1:.5+Math.abs(Math.sin(age*8))*.5;ctx.scale(flap,1);ctx.beginPath();ctx.ellipse(-8,0,9,14,-.4,0,Math.PI*2);ctx.ellipse(8,0,9,14,.4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#334';ctx.fillRect(-2,-9,4,20);}
      else if(effect==='confetti'||effect==='trophy'){ctx.rotate(age*3+p.phase);ctx.fillRect(-4,-8,8,16);}
      else star(0,0,p.size*(effect==='fireworks'?.4:1));
      ctx.restore();
    });
    for(let i=bursts.length-1;i>=0;i--) {
      const burst=bursts[i];
      if(!quiet) burst.age+=dt;
      const alpha=Math.max(0,1-burst.age/1);
      for(let j=0;j<burst.parts.length;j++) {
        const part=burst.parts[j];
        const d=part.dist*(quiet?1:burst.age*90);
        sparkle4(burst.x+Math.cos(part.angle)*d,burst.y+Math.sin(part.angle)*d,part.size,alpha,j%2?'#fff':burst.color);
      }
      if(burst.age>=1) bursts.splice(i,1);
    }
    for(let i=rings.length-1;i>=0;i--) {
      const ring=rings[i];
      if(!quiet) ring.age+=dt;
      const progress=Math.min(1,ring.age/.8);
      ctx.save();ctx.globalAlpha=(1-progress)*.8;ctx.strokeStyle='#fff';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(ring.x,ring.y,6+progress*30,0,Math.PI*2);ctx.stroke();ctx.restore();
      if(ring.age>=.8) rings.splice(i,1);
    }
    ctx.globalAlpha=1;
  }
  function draw(now) {
    const t=quiet?.65:(now-start)/1000;
    const dt=quiet?0:Math.min(.05,lastNow?(now-lastNow)/1000:0);
    lastNow=now;
    render(t,dt);
    if(!quiet&&t<3) frame=requestAnimationFrame(draw);
    else timer=setTimeout(()=>{cleanup?.();cleanup=null;},quiet?2000:0);
  }
  frame=requestAnimationFrame(draw);
}
