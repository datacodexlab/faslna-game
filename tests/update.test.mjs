import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const site=new URL("../site/",import.meta.url);
test("forced update button exists and reloads with a cache-busting version",async()=>{
  const ui=JSON.parse(await readFile(new URL("locales/ar-ui.json",site),"utf8"));
  assert.equal(ui.updateGame,"حدّث اللعبة");
  const app=await readFile(new URL("scripts/app.js",site),"utf8");
  assert.match(app,/function forceUpdate\(\)/);
  assert.match(app,/searchParams\.set\("v", String\(Date\.now\(\)\)\)/);
  assert.match(app,/t\("updateGame"\)/);
  const index=await readFile(new URL("index.html",site),"utf8");
  assert.match(index,/id="app-version">1\.11\.2</);
});
