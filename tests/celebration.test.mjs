import test from 'node:test';
import assert from 'node:assert/strict';
import {EFFECTS,nextEffect,makeBurst,makeShapedBurst,selectAnswer} from '../site/scripts/celebration.js';
test('six win effects never immediately repeat',()=>{
  assert.equal(new Set(EFFECTS).size,6);
  assert.deepEqual([...EFFECTS].sort(),['bigstar','cannon','fireworks','rain','rocket','tapgame']);
  for(let last=-1;last<6;last++)for(const value of [0,.1,.5,.999999]) {
    const next=nextEffect(last,()=>value);assert.ok(next>=0&&next<6);assert.notEqual(next,last);
  }
});
test('tapping anywhere bursts a firework of sparkles in every direction',()=>{
  const burst=makeBurst(100,200,'#ff6fb1');
  assert.equal(burst.x,100);assert.equal(burst.y,200);assert.equal(burst.parts.length,16);
  const angles=burst.parts.map(part=>part.angle).sort((a,b)=>a-b);
  for(let i=1;i<angles.length;i++) assert.ok(Math.abs(angles[i]-angles[i-1]-Math.PI/8)<1e-9);
  burst.parts.forEach(part=>{assert.ok(part.dist>=30&&part.dist<=60);assert.ok(part.size>=5&&part.size<=9);});
});
test('shaped bursts: star points cluster on five arms, heart bursts follow a heart outline',()=>{
  const star=makeShapedBurst(0,0,'#ffd34e','star');
  assert.equal(star.parts.length,16);
  star.parts.forEach(part=>{
    const near=Math.min(...[0,1,2,3,4,5].map(k=>Math.abs(part.angle-k*Math.PI*2/5)));
    assert.ok(near<0.2);
  });
  const heart=makeShapedBurst(0,0,'#ff6fb1','heart');
  assert.equal(heart.parts.length,16);
  heart.parts.forEach(part=>{assert.ok(Number.isFinite(part.angle));assert.ok(part.dist>=8&&part.dist<=70);});
});
test('first press only selects; same second press confirms; changing option selects again',()=>{
  assert.deepEqual(selectAnswer(null,'a'),{pending:'a',confirmed:false});
  assert.deepEqual(selectAnswer('a','b'),{pending:'b',confirmed:false});
  assert.deepEqual(selectAnswer('b','b'),{pending:null,confirmed:true});
});

test('a tap during a celebration draws a burst ring and sparkles at the tap point',async()=>{
  const {celebrate,stopCelebration}=await import('../site/scripts/celebration.js');
  const original={document:globalThis.document,window:globalThis.window,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout};
  const timers=new Map();let id=0;const rafQueue=[];const calls=[];const listeners=new Map();
  const ctx=new Proxy({},{get:(target,prop)=> (...args)=>{calls.push([prop,...args]);}, set:(target,prop,value)=>{target[prop]=value;return true;}});
  globalThis.setTimeout=(fn)=>{timers.set(++id,fn);return id;};globalThis.clearTimeout=(key)=>timers.delete(key);
  globalThis.requestAnimationFrame=(fn)=>{rafQueue.push(fn);return rafQueue.length;};globalThis.cancelAnimationFrame=()=>{};
  globalThis.window={innerWidth:320,innerHeight:568,devicePixelRatio:1,matchMedia:()=>({matches:false}),addEventListener:(type,fn)=>listeners.set(type,fn),removeEventListener:(type)=>listeners.delete(type)};
  globalThis.document={body:{append(){}},createElement:()=>({dataset:{},setAttribute(){},getContext:()=>ctx,remove(){}})};
  try {
    celebrate(false,1);
    assert.ok(listeners.has('pointerdown'));
    const start=performance.now();
    const step=(ms)=>{const fn=rafQueue.shift();fn(start+ms);};
    step(100);
    const before=calls.length;
    listeners.get('pointerdown')({clientX:100,clientY:150});
    step(200);
    const frameCalls=calls.slice(before);
    const ring=frameCalls.find(args=>args[0]==='arc'&&args[1]===100&&args[2]===150);
    assert.ok(ring,'a ring arc is drawn at the tap point');
    const sparkle=frameCalls.find(args=>args[0]==='moveTo'&&Math.hypot(args[1]-100,args[2]-150)<=30);
    assert.ok(sparkle,'burst sparkles stay visible near the tap point');
    stopCelebration();assert.equal(listeners.size,0);
  } finally {stopCelebration();Object.assign(globalThis,original);}
});

test('answer celebrations run twice quickly and round celebrations run three times; navigation cancels queue',async()=>{
  const {celebrate,stopCelebration,celebrationCount}=await import('../site/scripts/celebration.js');
  assert.equal(celebrationCount('answer'),2);assert.equal(celebrationCount('round'),3);
  const original={document:globalThis.document,window:globalThis.window,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout};
  const timers=new Map();let id=0;const effects=[];
  const listeners=new Map();
  globalThis.setTimeout=(fn)=>{timers.set(++id,fn);return id;};globalThis.clearTimeout=(key)=>timers.delete(key);
  globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
  globalThis.window={innerWidth:320,innerHeight:568,devicePixelRatio:1,matchMedia:()=>({matches:false}),addEventListener:(type,fn)=>listeners.set(type,fn),removeEventListener:(type)=>listeners.delete(type)};
  globalThis.document={body:{append:(canvas)=>effects.push(canvas.dataset.effect)},createElement:()=>({dataset:{},setAttribute(){},getContext:()=>({scale(){}}),remove(){}})};
  try {
    celebrate(false,1);assert.equal(effects.length,1);assert.equal(timers.size,0);assert.ok(listeners.has('pointerdown'));
    celebrate(false,3);assert.equal(effects.length,2);
    for(let i=0;i<2;i++){const [key,fn]=timers.entries().next().value;timers.delete(key);fn();}
    assert.equal(effects.length,4);assert.equal(timers.size,0);
    effects.forEach((value,index)=>{if(index)assert.notEqual(value,effects[index-1]);});
    celebrate(false,3);assert.equal(timers.size,1);stopCelebration();assert.equal(timers.size,0);assert.equal(listeners.size,0);
  } finally {stopCelebration();Object.assign(globalThis,original);}
});
