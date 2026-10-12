import test from "node:test";
import assert from "node:assert/strict";
import {createStore,freshState,STORAGE_KEY} from "../site/scripts/storage.js";

const profile={id:"p1",name:"Test",age:9,avatar:"sun",difficulty:"auto",progress:{},round:null};

test("profiles and in-progress rounds survive reload",()=>{
  const values=new Map();
  const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
  let store=createStore(storage);
  const round={subject:"math",band:"middle",stage:1,cardIds:["a","b","c","d","e","f"],index:2,score:3,wrongIds:["x"],hintUsed:true,maxLives:3,maxHints:2,hintsLeft:1,livesLeft:2,resolved:false,selectedId:"x"};
  store.save({...freshState(),profiles:[{...profile,round}],activeProfileId:"p1"});
  store=createStore(storage);
  assert.deepEqual(store.get().profiles[0].round,round);
  store.reset();assert.equal(values.has(STORAGE_KEY),false);
});

test("older saved rounds gain limits without losing players or completed progress",()=>{
  const oldRound={subject:"math",band:"middle",stage:1,cardIds:["a","b","c","d","e","f"],index:0,score:0,wrongIds:["a"],hintUsed:true,resolved:false,selectedId:"a"};
  const progress={"math:middle:1":{completed:true,best:10}};
  const oldState={...freshState(),profiles:[{...profile,progress,round:oldRound}],activeProfileId:"p1"};
  const store=createStore({getItem:()=>JSON.stringify(oldState),setItem(){},removeItem(){}});
  assert.equal(store.get().profiles[0].round.livesLeft,2);
  assert.equal(store.get().profiles[0].round.hintsLeft,1);
  assert.equal(store.get().profiles[0].round.maxLives,3);
  assert.equal(store.get().settings.soundEnabled,true);
  assert.deepEqual(store.get().profiles[0].progress,progress);
});

test("preset teacher selection persists and reloads",()=>{
  const values=new Map();
  const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
  const store=createStore(storage);
  for (const id of ["teacher-math","teacher-arabic","teacher-science","teacher-ragab"]) {
    store.save({...freshState(),profiles:[profile],activeProfileId:"p1",activeTeacherId:id});
    assert.equal(createStore(storage).get().activeTeacherId,id);
  }
});

test("unavailable or corrupt storage keeps the game usable",()=>{
  const throwing={getItem(){throw Error("blocked")},setItem(){throw Error("blocked")},removeItem(){throw Error("blocked")}};
  const store=createStore(throwing);
  assert.equal(store.persistent(),false);
  store.save({...freshState(),profiles:[profile],activeProfileId:"p1"});
  assert.equal(store.get().profiles.length,1);
  const corrupt=createStore({getItem(){return "bad json"},setItem(){},removeItem(){}});
  assert.equal(corrupt.persistent(),false);
  assert.deepEqual(corrupt.get().profiles,[]);
});
