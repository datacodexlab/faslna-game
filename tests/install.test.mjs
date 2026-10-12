import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const site=new URL("../site/",import.meta.url);
test("install manifest resolves within site and icons have real advertised PNG sizes",async()=>{
  const manifestUrl=new URL("locales/ar-manifest.json",site);
  const manifest=JSON.parse(await readFile(manifestUrl,"utf8"));
  assert.ok(manifest.name && manifest.short_name);
  assert.equal(manifest.display,"standalone");
  assert.equal(new URL(manifest.start_url,manifestUrl).href,site.href);
  assert.equal(new URL(manifest.scope,manifestUrl).href,site.href);
  assert.deepEqual(manifest.icons.map(icon=>icon.sizes),["192x192","512x512"]);
  for(const icon of manifest.icons){
    const path=new URL(icon.src,manifestUrl);assert.ok(path.href.startsWith(site.href));
    const data=await readFile(path);assert.equal(data.subarray(1,4).toString(),"PNG");
    const [w,h]=icon.sizes.split("x").map(Number);
    assert.equal(data.readUInt32BE(16),w);assert.equal(data.readUInt32BE(20),h);
  }
  const apple=await readFile(new URL("assets/icon-180.png",site));
  assert.equal(apple.readUInt32BE(16),180);assert.equal(apple.readUInt32BE(20),180);
});
