import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker,{validateQuery,parseHorizons,makeScenario} from '../dist/server/index.js';
const fixture=JSON.parse(readFileSync(new URL('../public/data/polar-a.json',import.meta.url)));
test('serverless endpoint rejects invalid and ambiguous coordinates and dates',()=>{
  for(const query of ['lat=91&lon=0&start=2026-11-15&days=7','lat=NaN&lon=0&start=2026-11-15&days=7','lat=0&lon=0&start=2026-02-30&days=7','lat=0&lat=1&lon=0&start=2026-11-15&days=7','lat=&lon=0&start=2026-11-15&days=7','lat=0&lon=0&start=2026-11-15&days=31'])assert.throws(()=>validateQuery(new URLSearchParams(query)));
});
test('serverless parsing exactly matches the Python-produced NASA fixtures',()=>{
  const parsed=parseHorizons({result:fixture.provenance.sun.raw});
  assert.deepEqual(parsed,fixture.samples.map(s=>({time:s.time,az:s.sunAz,el:s.sunEl})));
});
test('serverless scenario requests lunar observers and preserves provenance',async()=>{
  const calls=[];
  const query=validateQuery(new URLSearchParams('lat=-89.5&lon=0&start=2026-11-15&days=30'));
  const result=await makeScenario(query,async url=>{calls.push(url);return new Response(JSON.stringify({result:calls.length===1?fixture.provenance.sun.raw:fixture.provenance.earth.raw}));});
  assert.deepEqual(result.samples,fixture.samples);
  assert.equal(new URL(calls[0]).searchParams.get('CENTER'),"'coord@301'");
  assert.equal(new URL(calls[1]).searchParams.get('COMMAND'),"'399'");
  assert.equal(result.terrain,false);
});
test('deployment serves embedded assets and handles bad routes without NASA access',async()=>{
  const index=await worker.fetch(new Request('https://example.test/'));
  assert.equal(index.status,200);assert.match(await index.text(),/Lunar Heuristics/);
  const data=await worker.fetch(new Request('https://example.test/data/polar-a.json'));
  assert.equal((await data.json()).samples.length,721);
  assert.equal((await worker.fetch(new Request('https://example.test/api/scenario?lat=99'))).status,400);
  assert.equal((await worker.fetch(new Request('https://example.test/nope'))).status,404);
  assert.equal((await worker.fetch(new Request('https://example.test/',{method:'POST'}))).status,405);
});
