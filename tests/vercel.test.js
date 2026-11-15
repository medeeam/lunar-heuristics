import test from 'node:test';
import assert from 'node:assert/strict';
import endpoint from '../api/scenario.js';

test('Vercel entry point exposes the same validated scenario endpoint',async()=>{
  const response=await endpoint.fetch(new Request('https://example.test/api/scenario?lat=91&lon=0&start=2026-11-15&days=7'));
  assert.equal(response.status,400);
  assert.match((await response.json()).error,/Latitude/);
});
