import test from "node:test";
import assert from "node:assert/strict";
import {ageBand,effectiveBand,budgetForBand,roundCards,newRound,selectionHistory,revealHint,answerRound,advanceRound,completeStage,stageUnlocked,totalStars,savedRoundMatchesContent,recoverSavedRounds} from "../site/scripts/game.js";

function fixture() {
  const cards=[];
  for (const [kind,subject,count] of [["academic","math",4],["social","social",2]]) {
    for(let i=0;i<count;i++) cards.push({id:`${kind}-${i}`,kind,subject,band:"young",stage:1,options:[{id:"a"},{id:"b"},{id:"c"}],answerId:"b"});
  }
  return cards;
}

test("difficulty stays within adjacent age bands",()=>{
  assert.equal(ageBand(6),"young");assert.equal(ageBand(11),"middle");assert.equal(ageBand(14),"older");
  assert.equal(effectiveBand(6,"easier"),"young");assert.equal(effectiveBand(8,"harder"),"middle");assert.equal(effectiveBand(14,"harder"),"older");
});

test("round mixes four academic cards with two social cards",()=>{
  const selected=roundCards(fixture(),"math","young",1);
  assert.deepEqual(selected.map(item=>item.kind),["academic","academic","social","academic","academic","social"]);
  assert.throws(()=>roundCards(fixture().slice(1),"math","young",1));
});

test("guided retry resolves a card for one star; first try earns two",()=>{
  const cards=fixture();let round=newRound(cards,"math","young",1);
  round=answerRound(round,cards[0],"a");
  assert.equal(round.score,0);assert.equal(round.hintUsed,false);assert.equal(round.livesLeft,4);assert.deepEqual(round.wrongIds,["a"]);
  round=answerRound(round,cards[0],"b");
  assert.equal(round.resolved,true);assert.equal(round.score,1);
  round=advanceRound(round);assert.equal(round.index,1);assert.equal(round.hintUsed,false);
  round=answerRound(round,cards[1],"b");assert.equal(round.score,3);
});

test("requesting a hint before answering gives one star",()=>{
  const cards=fixture();let round=newRound(cards,"math","young",1);
  round=revealHint(round);assert.equal(round.hintUsed,true);
  round=answerRound(round,cards[0],"b");assert.equal(round.score,1);
});

test("six correct answers yield the twelve-star maximum",()=>{
  const cards=fixture();let round=newRound(cards,"math","young",1);
  while (round.index<6) {
    const card=cards.find(item=>item.id===round.cardIds[round.index]);
    round=advanceRound(answerRound(round,card,card.answerId));
  }
  assert.equal(round.score,12);
  assert.equal(completeStage({},round)["math:young:1"].best,12);
});

test("stage awards preserve best score and unlock next stage",()=>{
  const round={...newRound(fixture(),"math","young",1),index:6,score:4};
  let progress=completeStage({},round);
  assert.equal(stageUnlocked(progress,"math","young",2),true);
  progress=completeStage(progress,{...round,score:2});
  assert.equal(totalStars(progress),4);
  progress=completeStage(progress,{...round,score:5});
  assert.equal(totalStars(progress),5);
  assert.equal(stageUnlocked(progress,"science","young",2),false);
});

test("round recovery drops invalid card references but preserves profiles and progress",()=>{
  const cards=fixture();
  const valid=newRound(cards,"math","young",1);
  assert.equal(savedRoundMatchesContent(valid,cards),true);
  const progress={"math:young:1":{completed:true,best:8}};
  const state={profiles:[{id:"a",progress,round:{...valid,cardIds:["missing",...valid.cardIds.slice(1)]}},{id:"b",progress:{},round:valid}]};
  const recovered=recoverSavedRounds(state,cards);
  assert.equal(recovered.recovered,true);
  assert.equal(recovered.state.profiles[0].round,null);
  assert.deepEqual(recovered.state.profiles[0].progress,progress);
  assert.deepEqual(recovered.state.profiles[1].round,valid);
});

test("saved round validation checks current answer state",()=>{
  const cards=fixture();const valid=newRound(cards,"math","young",1);
  assert.equal(savedRoundMatchesContent({...valid,wrongIds:["a"],livesLeft:2,hintUsed:true,hintsLeft:1,selectedId:"a"},cards),true);
  assert.equal(savedRoundMatchesContent({...valid,wrongIds:["b"],hintUsed:true,selectedId:"b"},cards),false);
  assert.equal(savedRoundMatchesContent({...valid,resolved:true,selectedId:"a"},cards),false);
  assert.equal(savedRoundMatchesContent({...valid,index:6,wrongIds:["a"]},cards),false);
});

test("band hint budget covers the whole round and cannot be replenished by advancing",()=>{
  const cards=fixture();let round=newRound(cards,"math","young",1);
  for (let index=0;index<round.maxHints;index++) {
    const card=cards.find(item=>item.id===round.cardIds[round.index]);
    round=revealHint(round);
    assert.equal(revealHint(round).hintsLeft,round.hintsLeft);
    round=advanceRound(answerRound(round,card,card.answerId));
  }
  assert.equal(round.hintsLeft,0);
  assert.equal(revealHint(round).hintUsed,false);
  assert.equal(savedRoundMatchesContent(round,cards),true);
});

test("last wrong answer ends the round, blocks answers and never grants completion",()=>{
  const cards=fixture().map(card=>({...card,band:"middle"}));let round=newRound(cards,"math","middle",1);
  const first=cards.find(item=>item.id===round.cardIds[0]);
  round=answerRound(round,first,"a");
  assert.equal(answerRound(round,first,"a").livesLeft,2);
  round=answerRound(round,first,"c");
  round=advanceRound(answerRound(round,first,"b"));
  const second=cards.find(item=>item.id===round.cardIds[1]);
  round=answerRound(round,second,"a");
  assert.equal(round.livesLeft,0);
  assert.equal(savedRoundMatchesContent(round,cards),true);
  assert.deepEqual(answerRound(round,second,"b"),round);
  assert.deepEqual(advanceRound(round),round);
  assert.deepEqual(revealHint(round),round);
  assert.throws(()=>completeStage({},round));
});

test("age band budgets are snapshotted at round start",()=>{
  assert.deepEqual(budgetForBand("young"),{maxLives:5,maxHints:3});
  assert.deepEqual(budgetForBand("middle"),{maxLives:3,maxHints:2});
  assert.deepEqual(budgetForBand("older"),{maxLives:2,maxHints:1});
  const round=newRound(fixture(),"math","young",1);
  assert.equal(round.maxLives,5);assert.equal(round.maxHints,3);
});

test("expanded pool avoids all six cards from previous replay",()=>{
  const cards=[];
  for(let i=0;i<10;i++) cards.push({...fixture()[0],id:`academic-${i}`});
  for(let i=0;i<5;i++) cards.push({...fixture()[4],id:`social-${i}`});
  const first=newRound(cards,"math","young",1,{},()=>.2);
  const second=newRound(cards,"math","young",1,selectionHistory(first),()=>.2);
  assert.equal(second.cardIds.length,6);
  assert.equal(second.cardIds.filter(id=>first.cardIds.includes(id)).length,0);
  assert.equal(savedRoundMatchesContent(second,cards),true);
});
