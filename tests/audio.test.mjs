import test from "node:test";
import assert from "node:assert/strict";
import {SOUND_PRESETS,nextSoundIndex,playEncouragement} from "../site/scripts/audio.js";

test("ten synthesized encouragement patterns are distinct",()=>{
  assert.equal(SOUND_PRESETS.length,10);
  assert.equal(new Set(SOUND_PRESETS.map(item=>item.kind==="clap"?`clap:${item.pulses.join(",")}`:`${item.wave}:${item.notes.join(",")}:${item.duration}`)).size,10);
  assert.equal(SOUND_PRESETS.filter(item=>item.kind==="clap").length,3);
});

test("sound rotation never repeats the previous pattern",()=>{
  for(let last=0;last<SOUND_PRESETS.length;last++)for(const value of [0,.1,.5,.9,.999]) {
    const next=nextSoundIndex(last,()=>value);
    assert.notEqual(next,last);
    assert.ok(next>=0&&next<SOUND_PRESETS.length);
  }
});

test("muted or unavailable audio never blocks play",async()=>{
  assert.equal(await playEncouragement(false),false);
  assert.equal(await playEncouragement(true),false);
});
