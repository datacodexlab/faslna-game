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
