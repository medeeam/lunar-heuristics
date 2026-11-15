export const SITES = [
  {id:'polar-a', name:'Polar site A', lat:-89.5, lon:0, note:'Near-pole reference'},
  {id:'polar-b', name:'Polar site B', lat:-85, lon:30, note:'Southern reference'},
  {id:'equator', name:'Equatorial reference', lat:0, lon:0, note:'Near-side reference'},
];
export function windows(samples, keys, threshold = 0) {
  const result = [];
  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i], b = samples[i + 1];
    let left = 0, right = 1;
    for (const key of keys) {
      const x = a[key] - threshold, y = b[key] - threshold;
      if (x <= 0 && y <= 0) { right = -1; break; }
      if (x <= 0 && y > 0) left = Math.max(left, -x / (y - x));
      if (x > 0 && y <= 0) right = Math.min(right, -x / (y - x));
    }
    if (right <= left) continue;
    const start = a.time + left * (b.time - a.time);
    const end = a.time + right * (b.time - a.time);
    const previous = result.at(-1);
    if (previous && Math.abs(previous.end - start) < 1) previous.end = end;
    else result.push({start, end});
  }
  return result;
}
export function summarize(samples, threshold = 0) {
  const total = samples.at(-1).time - samples[0].time;
  const sun = windows(samples, ['sunEl'], threshold);
  const earth = windows(samples, ['earthEl'], threshold);
  const both = windows(samples, ['sunEl','earthEl'], threshold);
  const duration = list => list.reduce((sum,w) => sum+w.end-w.start, 0);
  return {sun, earth, both, sunPct: duration(sun)/total*100, earthPct: duration(earth)/total*100,
    bothPct: duration(both)/total*100, longest: Math.max(0,...both.map(w=>(w.end-w.start)/3600000))};
}
export function untilSet(samples, key, index, threshold) {
  const now = samples[index];
  if (now[key] <= threshold) return {state:'below'};
  const window = windows(samples.slice(index), [key], threshold)[0];
  if (!window || window.end >= samples.at(-1).time - 1) return {state:'beyond'};
  return {state:'set', hours:(window.end-now.time)/3600000};
}
export function horizontalSolarFactor(elevation, threshold=0) {
  return elevation > threshold ? Math.max(0,Math.sin(elevation*Math.PI/180)) : 0;
}
export function sliceDemo(data, start, days) {
  const from = Date.parse(start+'T00:00:00Z'), to = from+days*86400000;
  const samples = data.samples.filter(s=>s.time>=from && s.time<=to);
  if (samples.length !== days*24+1) return null;
  return {...data, start, days, samples};
}
