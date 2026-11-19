import test from 'node:test';
import assert from 'node:assert/strict';
import {EFFECTS,hitBalloon,hitStar,selectAnswer} from '../site/scripts/celebration.js';
test('one interactive party effect: smiling balloons and stars the child can tap to pop',()=>{
  assert.deepEqual(EFFECTS,['party']);
  const balloon={x:100,y:100,size:30};
  assert.equal(hitBalloon(balloon,100,100),true);
  assert.equal(hitBalloon(balloon,100,100+30),true);
  assert.equal(hitBalloon(balloon,100,100+60),false);
  assert.equal(hitBalloon(balloon,200,100),false);
  const star={x:50,y:50,size:20};
  assert.equal(hitStar(star,50,50),true);
  assert.equal(hitStar(star,50,50+24),true);
  assert.equal(hitStar(star,50,50+40),false);
});
test('first press only selects; same second press confirms; changing option selects again',()=>{
  assert.deepEqual(selectAnswer(null,'a'),{pending:'a',confirmed:false});
  assert.deepEqual(selectAnswer('a','b'),{pending:'b',confirmed:false});
  assert.deepEqual(selectAnswer('b','b'),{pending:null,confirmed:true});
});

test('answer celebrations run once and round celebrations run three times; navigation cancels queue',async()=>{
  const {celebrate,stopCelebration,celebrationCount}=await import('../site/scripts/celebration.js');
  assert.equal(celebrationCount('answer'),1);assert.equal(celebrationCount('round'),3);
  const original={document:globalThis.document,window:globalThis.window,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout};
  const timers=new Map();let id=0;const canvases=[];
  globalThis.setTimeout=(fn)=>{timers.set(++id,fn);return id;};globalThis.clearTimeout=(key)=>timers.delete(key);
  globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
  globalThis.window={innerWidth:320,innerHeight:568,devicePixelRatio:1,matchMedia:()=>({matches:false})};
  globalThis.document={body:{append:(canvas)=>canvases.push(canvas)},createElement:()=>({dataset:{},style:{},setAttribute(){},addEventListener(){},removeEventListener(){},getContext:()=>({scale(){}}),remove(){}})};
  try {
    celebrate(false,1);assert.equal(canvases.length,1);assert.equal(timers.size,0);
    celebrate(false,3);assert.equal(canvases.length,2);
    for(let i=0;i<2;i++){const [key,fn]=timers.entries().next().value;timers.delete(key);fn();}
    assert.equal(canvases.length,4);assert.equal(timers.size,0);
    canvases.forEach((canvas)=>{assert.equal(canvas.dataset.effect,'party');assert.equal(canvas.style.pointerEvents,'auto');});
    celebrate(false,3);assert.equal(timers.size,1);stopCelebration();assert.equal(timers.size,0);
  } finally {stopCelebration();Object.assign(globalThis,original);}
});
