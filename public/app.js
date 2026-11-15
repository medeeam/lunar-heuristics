import {SITES, summarize, untilSet, horizontalSolarFactor, sliceDemo} from './model.js';
const $ = id => document.getElementById(id);
const state = {data:null, name:'Polar site A', index:0, clearance:0, summary:null, comparison:[], playing:null, busy:false};
const demoCache = new Map();
const fmt = (n,d=1) => n.toFixed(d);
const degree = n => `${n>=0?'+':'−'}${Math.abs(n).toFixed(2)}°`;
const coordinates = (lat,lon) => `${Math.abs(lat).toFixed(3)}° ${lat<0?'S':'N'} · ${Math.abs(lon).toFixed(3)}° ${lon<0?'W':'E'}`;
const dateLabel = t => new Date(t).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'UTC',hour12:false})+' UTC';
const shortDate = t => new Date(t).toLocaleDateString('en-GB',{day:'2-digit',month:'short',timeZone:'UTC'}).toUpperCase();
const esc = text => String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function status(message, error=false){$('status').textContent=message;$('status').classList.toggle('error',error);}
function busy(value){state.busy=value;$('results').setAttribute('aria-busy',String(value));$('results').classList.toggle('loading',value);for(const id of ['calculate','compare','reset'])$(id).disabled=value;}
function stop(){clearInterval(state.playing);state.playing=null;$('play').textContent='▶';$('play').setAttribute('aria-label','Play timeline');}
async function getDemo(id){if(!demoCache.has(id)){const response=await fetch(`/data/${id}.json`);if(!response.ok)throw Error('Bundled data is missing. Run python3 scripts/fetch_demo.py and retry.');demoCache.set(id,await response.json());}return demoCache.get(id);}
async function loadData(lat,lon,start,days){
  const preset=SITES.find(s=>s.lat===lat&&s.lon===lon);
  if(preset && start>='2026-11-15' && start<='2026-12-15'){
    const demo=await getDemo(preset.id), subset=sliceDemo(demo,start,days);
    if(subset)return {...subset,mode:'Bundled JPL data'};
  }
  const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),100000);
  try{const response=await fetch('/api/scenario?'+new URLSearchParams({lat,lon,start,days}),{signal:controller.signal});
    let data;try{data=await response.json();}catch{throw Error('Custom scenarios need the Python server. Start with npm start, or load the bundled demo.');}
    if(!response.ok)throw Error(data.error||'The scenario could not be calculated.');return {...data,mode:'Live JPL data'};
  }catch(error){if(error.name==='AbortError')throw Error('JPL took too long to respond. Retry or load the bundled demo.');throw error;}finally{clearTimeout(timeout);}
}
async function calculate(){
  if(state.busy||!$('scenario-form').reportValidity())return;
  stop();busy(true);status('Calculating Sun and Earth positions… NASA requests may take up to 90 seconds.');
  const lat=Number($('lat').value),lon=Number($('lon').value),start=$('start').value,days=Number($('days').value);
  try{
    const data=await loadData(lat,lon,start,days);
    state.data=data;state.name=SITES.find(s=>s.lat===lat&&s.lon===lon)?.name||'Custom site';state.index=0;state.comparison=[];
    $('time').max=data.samples.length-1;$('time').value=0;
    for(const id of ['time','play','export','provenance'])$(id).disabled=false;
    status(`${data.mode} · ${data.samples.length} hourly samples · ${data.start} / ${shortDate(data.samples.at(-1).time)} · UTC`);
    renderAll();renderComparison();
  }catch(error){status(`${error.message}${state.data?' Previous results remain displayed.':''}`,true);}
  finally{busy(false);}
}
function recompute(){if(!state.data)return;state.summary=summarize(state.data.samples,state.clearance);}
function renderAll(){recompute();renderCurrent();renderTimeline();renderMetrics();renderWindows();renderLocator();}
function renderCurrent(){
  const data=state.data,s=data.samples[state.index];
  $('sky-title').textContent=state.name;$('active-coordinates').textContent=coordinates(data.lat,data.lon);
  $('sun-angle').textContent=degree(s.sunEl);$('earth-angle').textContent=degree(s.earthEl);
  $('sun-state').textContent=s.sunEl>state.clearance?'Above clearance':'Below clearance';
  $('earth-state').textContent=s.earthEl>state.clearance?'Above clearance':'Below clearance';
  $('current-date').textContent=dateLabel(s.time).toUpperCase();
  $('time').setAttribute('aria-valuetext',dateLabel(s.time));
  $('range-start').textContent=shortDate(data.samples[0].time);$('range-end').textContent=shortDate(data.samples.at(-1).time);
  renderSky(s);
}
function renderSky(s){
  const W=window.innerWidth<700?420:900,H=250,L=40,R=25,T=25,B=28;
  const max=Math.max(10,Math.ceil((Math.max(Math.abs(s.sunEl),Math.abs(s.earthEl),state.clearance)+4)/10)*10);
  const y=el=>T+(max-el)/(max*2)*(H-T-B),x=az=>L+az/360*(W-L-R);
  let grid='';for(const az of [0,90,180,270,360]){grid+=`<line x1="${x(az)}" y1="${T}" x2="${x(az)}" y2="${H-B}" stroke="#2a383b" stroke-dasharray="2 6"/><text x="${x(az)}" y="${H-7}" fill="#a8b7b6" text-anchor="middle" font-size="10">${['N · 0°','E · 90°','S · 180°','W · 270°','N · 360°'][az/90]}</text>`;}
  for(const el of [-max/2,0,max/2])grid+=`<line x1="${L}" x2="${W-R}" y1="${y(el)}" y2="${y(el)}" stroke="${el===0?'#83968d':'#253235'}"/><text x="${L-9}" y="${y(el)+4}" fill="#a8b7b6" font-size="10" text-anchor="end">${el}°</text>`;
  const marker=(name,az,el,color,r)=>{const px=x(az),py=y(el),anchor=az>300?'end':'start',dx=az>300?-15:15;return `<line x1="${px}" x2="${px}" y1="${py}" y2="${y(0)}" stroke="${color}" stroke-dasharray="3 5" opacity=".5"/><circle cx="${px}" cy="${py}" r="${r+8}" fill="${color}" opacity=".06"/><circle cx="${px}" cy="${py}" r="${r}" fill="${color}"/><text x="${px+dx}" y="${py-10}" text-anchor="${anchor}" fill="${color}" font-size="11">${name}</text><text x="${px+dx}" y="${py+7}" text-anchor="${anchor}" fill="#a8b7b6" font-size="10">${fmt(az)}° AZ</text>`;};
  $('sky').innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="presentation"><defs><linearGradient id="ground" x2="0" y2="1"><stop stop-color="#293b35" stop-opacity=".35"/><stop offset="1" stop-color="#142020" stop-opacity=".1"/></linearGradient></defs><rect x="${L}" y="${y(0)}" width="${W-L-R}" height="${H-B-y(0)}" fill="url(#ground)"/>${grid}${state.clearance>0?`<rect x="${L}" y="${y(state.clearance)}" width="${W-L-R}" height="${y(0)-y(state.clearance)}" fill="#b9e3c7" opacity=".05"/><line x1="${L}" x2="${W-R}" y1="${y(state.clearance)}" y2="${y(state.clearance)}" stroke="#b9e3c7" stroke-dasharray="5 5"/>`:''}${marker('SUN',s.sunAz,s.sunEl,'#eac078',7)}${marker('EARTH',s.earthAz,s.earthEl,'#8ec9ed',6)}</svg>`;
  $('sky').setAttribute('aria-label',`At ${dateLabel(s.time)}, Sun elevation ${fmt(s.sunEl,2)} degrees, azimuth ${fmt(s.sunAz,2)} degrees; Earth elevation ${fmt(s.earthEl,2)} degrees, azimuth ${fmt(s.earthAz,2)} degrees. Clearance ${state.clearance} degrees.`);
}
function renderTimeline(){
  const samples=state.data.samples,W=window.innerWidth<700?420:900,H=130,L=40,R=10,T=10,B=18;
  const min=Math.floor(Math.min(0,...samples.flatMap(s=>[s.sunEl,s.earthEl]))/5)*5-2;
  const max=Math.ceil(Math.max(state.clearance,...samples.flatMap(s=>[s.sunEl,s.earthEl]))/5)*5+2;
  const start=samples[0].time,end=samples.at(-1).time;
  const x=t=>L+(t-start)/(end-start)*(W-L-R),y=v=>T+(max-v)/(max-min)*(H-T-B);
  const path=key=>samples.map((s,i)=>`${i?'L':'M'}${x(s.time).toFixed(2)},${y(s[key]).toFixed(2)}`).join(' ');
  const shade=state.summary.both.map(w=>`<rect x="${x(w.start)}" y="${T}" width="${Math.max(0,x(w.end)-x(w.start))}" height="${H-T-B}" fill="#b9e3c7" opacity=".09"/>`).join('');
  const cursor=x(samples[state.index].time);
  $('timeline').innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="presentation">${shade}${[min,0,max].map(v=>`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="#29383a"/><text x="${L-8}" y="${y(v)+3}" text-anchor="end" fill="#a8b7b6" font-size="9">${v}°</text>`).join('')}<line x1="${L}" x2="${W-R}" y1="${y(state.clearance)}" y2="${y(state.clearance)}" stroke="#b9e3c7" stroke-dasharray="3 6" opacity=".5"/><path d="${path('sunEl')}" stroke="#eac078" stroke-width="2" fill="none"/><path d="${path('earthEl')}" stroke="#8ec9ed" stroke-width="2" fill="none"/><line x1="${cursor}" x2="${cursor}" y1="${T}" y2="${H-B}" stroke="#edf0e9"/><circle cx="${cursor}" cy="${y(samples[state.index].sunEl)}" r="3" fill="#eac078"/><circle cx="${cursor}" cy="${y(samples[state.index].earthEl)}" r="3" fill="#8ec9ed"/></svg>`;
  $('timeline').setAttribute('aria-label',`Elevation over ${state.data.days} days. Sun visible ${fmt(state.summary.sunPct)} percent; Earth visible ${fmt(state.summary.earthPct)} percent; both visible ${fmt(state.summary.bothPct)} percent. Use the time slider to inspect hourly positions.`);
}
function renderMetrics(){
  const {data,summary,index,clearance}=state,s=data.samples[index];
  $('sun-percent').textContent=fmt(summary.sunPct)+'%';$('earth-percent').textContent=fmt(summary.earthPct)+'%';$('joint-hours').textContent=fmt(summary.longest)+' h';
  $('solar-factor').textContent=fmt(horizontalSolarFactor(s.sunEl,clearance)*100)+'%';
  const remaining=key=>{const result=untilSet(data.samples,key,index,clearance);return result.state==='below'?'Currently below clearance':result.state==='beyond'?'No set before window ends':`Sets below clearance in ~${fmt(result.hours)} h`;};
  $('sun-set').textContent=remaining('sunEl');$('earth-set').textContent=remaining('earthEl');
}
function renderWindows(){
  const list=state.summary.both;
  $('window-summary').textContent=`${list.length} joint window${list.length===1?'':'s'} · ${fmt(state.summary.bothPct)}% of the interval · clearance ${fmt(state.clearance)}° · hourly samples with interpolated crossings`;
  $('window-list').innerHTML=list.length?list.slice(0,8).map(w=>`<li>${dateLabel(w.start)} → ${dateLabel(w.end)} <strong>(${fmt((w.end-w.start)/3600000)} h)</strong>${w.start===state.data.samples[0].time||w.end===state.data.samples.at(-1).time?' · clipped at analysis boundary':''}</li>`).join(''):'<li>No simultaneous Sun and Earth visibility in this window. Try another date, site, or clearance.</li>';
}
function renderLocator(){
  const lat=state.data?.lat??Number($('lat').value),lon=state.data?.lon??Number($('lon').value),r=42;
  const x=85+r*Math.cos(lat*Math.PI/180)*Math.sin(lon*Math.PI/180),y=51-r*Math.sin(lat*Math.PI/180);
  $('locator').innerHTML=`<svg viewBox="0 0 170 104"><circle cx="85" cy="51" r="42" fill="#1b2829" stroke="#425552"/><ellipse cx="85" cy="51" rx="18" ry="42" fill="none" stroke="#344744"/><ellipse cx="85" cy="51" rx="42" ry="15" fill="none" stroke="#344744"/><path d="M43 51H127M85 9V93" stroke="#344744"/><circle cx="${x}" cy="${y}" r="5" fill="#b9e3c7" stroke="#101718" stroke-width="2"/><text x="141" y="103" fill="#a8b7b6" font-size="7" text-anchor="end">SCHEMATIC · NEAR SIDE</text></svg>`;
}
async function compare(){
  if(state.busy||!state.data)return;stop();busy(true);status('Comparing reference sites over the active dates…');
  const {start,days}=state.data;const results=[];
  for(const site of SITES){try{results.push({site,data:await loadData(site.lat,site.lon,start,days)});}catch(error){results.push({site,error:error.message});}}
  state.comparison=results;renderComparison();busy(false);
  const failed=results.filter(r=>r.error).length;status(failed?`${failed} comparison site(s) unavailable. Available results are shown; retry comparison to recover.`:'Comparison ready · same UTC dates and clearance for every site.',failed>0);
}
function renderComparison(){
  if(!state.data)return;
  $('comparison-context').textContent=`${state.data.start} · ${state.data.days} days · ${fmt(state.clearance)}° clearance · geometric visibility only`;
  if(!state.comparison.length){$('comparison-body').innerHTML='<tr><td colspan="6">Select “Compare reference sites” to evaluate these dates at all three locations.</td></tr>';return;}
  $('comparison-body').innerHTML=state.comparison.map(({site,data,error})=>{
    if(error)return `<tr><td>${site.name}</td><td>${coordinates(site.lat,site.lon)}</td><td colspan="4">Unavailable — retry comparison.</td></tr>`;
    const m=summarize(data.samples,state.clearance),active=state.data.lat===site.lat&&state.data.lon===site.lon;
    return `<tr><td class="${active?'active':''}">${site.name}${active?' · active':''}<small>${site.note}</small></td><td>${coordinates(site.lat,site.lon)}</td><td><span class="bar"><i style="width:${m.sunPct}%"></i></span>${fmt(m.sunPct)}%</td><td><span class="bar earth-bar"><i style="width:${m.earthPct}%"></i></span>${fmt(m.earthPct)}%</td><td>${fmt(m.longest)} h</td><td><button data-explore="${site.id}" aria-label="Explore ${site.name}">↗</button></td></tr>`;
  }).join('');
}
function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('scenario-form').addEventListener('submit',event=>{event.preventDefault();calculate();});
$('site').addEventListener('change',()=>{const site=SITES.find(s=>s.id===$('site').value);if(site){$('lat').value=site.lat;$('lon').value=site.lon;}status('Location changed. Select Calculate scenario to apply.');});
for(const id of ['lat','lon'])$(id).addEventListener('input',()=>{$('site').value='custom';status('Coordinates changed. Select Calculate scenario to apply.');});
for(const id of ['start','days'])$(id).addEventListener('change',()=>status('Dates changed. Select Calculate scenario to apply.'));
$('clearance').addEventListener('input',()=>{state.clearance=Number($('clearance').value);$('clearance-value').textContent=fmt(state.clearance)+'°';if(state.data){renderAll();renderComparison();}});
$('time').addEventListener('input',()=>{stop();state.index=Number($('time').value);renderCurrent();renderTimeline();renderMetrics();});
$('play').addEventListener('click',()=>{if(state.playing){stop();return;}if(state.index===state.data.samples.length-1)state.index=0;$('play').textContent='Ⅱ';$('play').setAttribute('aria-label','Pause timeline');state.playing=setInterval(()=>{state.index=Math.min(state.index+3,state.data.samples.length-1);$('time').value=state.index;renderCurrent();renderTimeline();renderMetrics();if(state.index===state.data.samples.length-1)stop();},250);});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
$('compare').addEventListener('click',compare);
$('comparison-body').addEventListener('click',event=>{const id=event.target.closest('[data-explore]')?.dataset.explore;if(!id||state.busy)return;const record=state.comparison.find(r=>r.site.id===id);if(!record?.data)return;stop();state.data=record.data;state.name=record.site.name;state.index=0;$('site').value=id;$('lat').value=record.site.lat;$('lon').value=record.site.lon;$('start').value=record.data.start;$('days').value=record.data.days;$('time').value=0;$('time').max=record.data.samples.length-1;renderAll();renderComparison();status('Showing '+record.site.name+' · '+record.data.mode);$('sky-title').scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
$('reset').addEventListener('click',async()=>{$('site').value='polar-a';$('lat').value=-89.5;$('lon').value=0;$('start').value='2026-11-15';$('days').value=30;$('clearance').value=0;state.clearance=0;$('clearance-value').textContent='0.0°';await calculate();});
$('export').addEventListener('click',()=>{const d=state.data,h=state.clearance,header='time_utc,latitude_deg,longitude_east_deg,clearance_deg,sun_azimuth_deg,sun_elevation_deg,earth_azimuth_deg,earth_elevation_deg,sun_above_clearance,earth_above_clearance,horizontal_solar_factor,source';const rows=d.samples.map(s=>[new Date(s.time).toISOString(),d.lat,d.lon,h,s.sunAz,s.sunEl,s.earthAz,s.earthEl,s.sunEl>h,s.earthEl>h,horizontalSolarFactor(s.sunEl,h),'NASA/JPL Horizons'].join(','));download(`lunar-heuristics-${d.start}.csv`,[header,...rows].join('\n'),'text/csv');status('Scenario CSV downloaded · includes coordinates, clearance, and source attribution.');});
$('provenance').addEventListener('click',()=>{const {mode,...data}=state.data;download('lunar-heuristics-source.json',JSON.stringify({...data,analysisClearanceDeg:state.clearance},null,2),'application/json');});
window.addEventListener('resize',()=>{if(state.data){renderCurrent();renderTimeline();}});
renderLocator();await calculate();if(state.data)await compare();
