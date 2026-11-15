import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {windows,summarize,untilSet,horizontalSolarFactor,sliceDemo} from '../public/model.js';
const H=3600000;
test('interpolates simultaneous crossings rather than counting sample points',()=>{
  const s=[{time:0,sunEl:-1,earthEl:3},{time:H,sunEl:1,earthEl:-1}];
  assert.deepEqual(windows(s,['sunEl','earthEl']),[{start:H/2,end:H*.75}]);
  assert.equal(summarize(s).bothPct,25);
});
test('merges continuous windows, clips to interval, and excludes equality',()=>{
  const s=[0,1,2].map(i=>({time:i*H,sunEl:1,earthEl:2}));
  assert.deepEqual(windows(s,['sunEl']),[{start:0,end:2*H}]);
  assert.equal(summarize(s).sunPct,100);
  assert.deepEqual(windows(s,['sunEl'],1),[]);
  assert.equal(untilSet(s,'sunEl',1,0).state,'beyond');
});
test('reports setting, below, and boundary states without inventing events',()=>{
  const s=[{time:0,sunEl:1},{time:H,sunEl:-1}];
  assert.deepEqual(untilSet(s,'sunEl',0,0),{state:'set',hours:.5});
  assert.equal(untilSet(s,'sunEl',1,0).state,'below');
});
test('solar factor reflects horizontal incidence and obstruction',()=>{
  assert.ok(Math.abs(horizontalSolarFactor(30)-.5)<1e-12);
  assert.equal(horizontalSolarFactor(-5),0);
  assert.equal(horizontalSolarFactor(5,6),0);
  assert.equal(horizontalSolarFactor(90),1);
});
test('bundled NASA data has valid time, coordinates, angles and provenance',()=>{
  for(const id of ['polar-a','polar-b','equator']){
    const data=JSON.parse(readFileSync(new URL(`../public/data/${id}.json`,import.meta.url)));
    assert.equal(data.samples.length,721);
    assert.equal(data.samples[0].time,Date.parse('2026-11-15T00:00:00Z'));
    assert.equal(data.samples.at(-1).time,Date.parse('2026-12-15T00:00:00Z'));
    for(const [i,s] of data.samples.entries()){
      if(i)assert.equal(s.time-data.samples[i-1].time,H);
      for(const key of ['sunEl','earthEl'])assert.ok(s[key]>=-90&&s[key]<=90);
      for(const key of ['sunAz','earthAz'])assert.ok(s[key]>=0&&s[key]<=360);
    }
    assert.match(data.provenance.sun.raw,/NO \(AIRLESS\)/);
    assert.match(data.provenance.earth.raw,/Earth \(399\)/);
    const m=summarize(data.samples);
    assert.ok(m.bothPct<=m.sunPct+1e-8&&m.bothPct<=m.earthPct+1e-8);
    assert.ok(summarize(data.samples,5).bothPct<=m.bothPct);
    assert.equal(sliceDemo(data,'2026-11-16',7).samples.length,169);
    assert.equal(sliceDemo(data,'2026-12-14',7),null);
  }
});
