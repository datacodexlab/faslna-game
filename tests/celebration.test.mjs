import test from 'node:test';
import assert from 'node:assert/strict';
import {EFFECTS,nextEffect,selectAnswer} from '../site/scripts/celebration.js';
test('ten celebrations never immediately repeat',()=>{
  assert.equal(new Set(EFFECTS).size,10);
  for(let last=-1;last<10;last++)for(const value of [0,.1,.5,.999999]) {
    const next=nextEffect(last,()=>value);assert.ok(next>=0&&next<10);assert.notEqual(next,last);
  }
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
  const timers=new Map();let id=0;const effects=[];
  globalThis.setTimeout=(fn)=>{timers.set(++id,fn);return id;};globalThis.clearTimeout=(key)=>timers.delete(key);
  globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
  globalThis.window={innerWidth:320,innerHeight:568,devicePixelRatio:1,matchMedia:()=>({matches:false})};
  globalThis.document={body:{append:(canvas)=>effects.push(canvas.dataset.effect)},createElement:()=>({dataset:{},setAttribute(){},getContext:()=>({scale(){}}),remove(){}})};
  try {
    celebrate(false,1);assert.equal(effects.length,1);assert.equal(timers.size,0);
    celebrate(false,3);assert.equal(effects.length,2);
    for(let i=0;i<2;i++){const [key,fn]=timers.entries().next().value;timers.delete(key);fn();}
    assert.equal(effects.length,4);assert.equal(timers.size,0);
    effects.forEach((value,index)=>{if(index)assert.notEqual(value,effects[index-1]);});
    celebrate(false,3);assert.equal(timers.size,1);stopCelebration();assert.equal(timers.size,0);
  } finally {stopCelebration();Object.assign(globalThis,original);}
});
