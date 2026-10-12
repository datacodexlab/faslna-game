import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ageBand,effectiveBand,newRound,answerRound,advanceRound,completeStage,savedRoundMatchesContent,selectionHistory} from '../site/scripts/game.js';
import {createStore,freshState,validateState} from '../site/scripts/storage.js';
const site=new URL('../site/',import.meta.url);
const {cards}=JSON.parse(await readFile(new URL('locales/ar-preschool.json',site),'utf8'));

test('thirty local picture tasks progress from two to three choices with complete image assets',async()=>{
  assert.equal(cards.length,30);assert.equal(new Set(cards.map(c=>c.id)).size,30);
  for(const stage of [1,2,3])assert.equal(cards.filter(c=>c.stage===stage).length,10);
  for(const card of cards){
    assert.equal(card.options.length,card.stage===1?2:3);
    assert.equal(new Set(card.options.map(o=>o.image)).size,card.options.length);
    assert.ok(card.options.some(o=>o.id===card.answerId));
    assert.ok(card.prompt.length<65);
    for(const image of [card.referenceImage,...card.options.map(o=>o.image)]){
      assert.match(image,/^assets\/preschool\/[a-z0-9-]+\.svg$/);
      assert.match(await readFile(new URL(image,site),'utf8'),/^<svg/);
    }
  }
});

test('ages four and five cannot shift into reading content and every teacher can serve every picture stage',()=>{
  for(const age of [4,5])for(const difficulty of ['auto','easier','harder'])assert.equal(effectiveBand(age,difficulty),'preschool');
  assert.equal(ageBand(6),'young');
  for(const subject of ['math','arabic','science'])for(const stage of [1,2,3]){
    let round=newRound(cards,subject,'preschool',stage);
    assert.equal(savedRoundMatchesContent(round,cards),true);
    assert.equal(selectionHistory(round).academic.length,6);
    for(let i=0;i<6;i++){
      const card=cards.find(c=>c.id===round.cardIds[i]);
      round=answerRound(round,card,card.answerId);
      assert.equal(savedRoundMatchesContent(round,cards),true);
      round=advanceRound(round);
    }
    assert.equal(round.score,12);assert.equal(completeStage({},round)[`${subject}:preschool:${stage}`].completed,true);
  }
});

test('picture mistakes give visual completion after two errors without spending lives and survive storage',()=>{
  let round=newRound(cards,'math','preschool',3);
  const card=cards.find(c=>c.id===round.cardIds[0]);
  for(const wrong of card.options.filter(o=>o.id!==card.answerId))round=answerRound(round,card,wrong.id);
  assert.equal(round.resolved,true);assert.equal(round.selectedId,card.answerId);assert.equal(round.livesLeft,5);assert.equal(round.score,1);
  assert.equal(savedRoundMatchesContent(round,cards),true);
  const state={...freshState(),profiles:[{id:'child',name:'Child',age:4,avatar:'sun',difficulty:'auto',progress:{},history:{'math:preschool:3':selectionHistory(round)},round}],activeProfileId:'child'};
  assert.equal(validateState(state),true);
  let value;const storage={getItem:()=>value,setItem:(_,v)=>{value=v;},removeItem:()=>{value=null;}};
  createStore(storage).save(state);assert.deepEqual(createStore(storage).get(),state);
});
