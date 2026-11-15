// The build replaces this import with the exact public/ file contents.
import { ASSETS } from './assets.generated.js';

const HOUR = 3600000;
const DAY = 86400000;
let queue = Promise.resolve();

export function validateQuery(params) {
  for (const key of ['lat','lon','start','days']) {
    if (params.getAll(key).length !== 1 || !params.get(key).trim()) throw Error('Supply latitude, longitude, start date and duration.');
  }
  const lat=Number(params.get('lat')), lon=Number(params.get('lon')), days=Number(params.get('days'));
  const start=params.get('start');
  if (!Number.isFinite(lat)||!Number.isFinite(lon)||lat < -90||lat > 90||lon < -180||lon > 180) throw Error('Latitude must be −90…90° and longitude −180…180°.');
  const time=Date.parse(start+'T00:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)||!Number.isFinite(time)||new Date(time).toISOString().slice(0,10)!==start||start<'2000-01-01'||start>'2100-12-31'||![7,14,30].includes(days)) throw Error('Choose a valid date from 2000–2100 and a 7, 14, or 30 day window.');
  return {lat,lon,start,days,time};
}

export function parseHorizons(payload) {
  if(payload.error)throw Error('Horizons could not calculate this scenario.');
  const raw=payload.result||'';
  if(!raw.includes('$$SOE')||!raw.includes('$$EOE'))throw Error('Horizons returned no ephemeris table.');
  const samples=raw.split('$$SOE')[1].split('$$EOE')[0].trim().split(/\r?\n/).map(line=>{
    const row=line.split(',');
    if(row.length<5||![row[0],row[3],row[4]].every(v=>v.trim()))throw Error('Incomplete ephemeris row.');
    const jd=Number(row[0]),az=Number(row[3]),el=Number(row[4]);
    if(![jd,az,el].every(Number.isFinite)||az<0||az>360||el< -90||el>90)throw Error('Invalid ephemeris values.');
    return {time:Math.round((jd-2440587.5)*DAY),az,el};
  });
  if(samples.length<2||samples.some((s,i)=>i>0&&s.time<=samples[i-1].time))throw Error('Incomplete ephemeris table.');
  return samples;
}

async function fetchBody(body, query, fetcher) {
  const {lat,lon,start,days,time}=query;
  const parameters={format:'json',COMMAND:String(body),OBJ_DATA:'NO',MAKE_EPHEM:'YES',EPHEM_TYPE:'OBSERVER',CENTER:'coord@301',COORD_TYPE:'GEODETIC',SITE_COORD:`${lon},${lat},0`,START_TIME:start,STOP_TIME:new Date(time+days*DAY).toISOString().slice(0,10),STEP_SIZE:'1 h',QUANTITIES:'4',CSV_FORMAT:'YES',CAL_FORMAT:'JD',APPARENT:'AIRLESS'};
  const params=new URLSearchParams(Object.entries(parameters).map(([k,v])=>[k,k==='format'?v:`'${v}'`]));
  const url='https://ssd.jpl.nasa.gov/api/horizons.api?'+params;
  const response=await fetcher(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(40000)});
  if(!response.ok)throw Error('NASA JPL is temporarily unavailable.');
  const payload=await response.json();
  return {samples:parseHorizons(payload),provenance:{url,parameters,raw:payload.result}};
}

export async function makeScenario(query, fetcher=fetch) {
  // Serialize targets; never issue simultaneous requests from one scenario.
  const sun=await fetchBody(10,query,fetcher), earth=await fetchBody(399,query,fetcher);
  if(sun.samples.length!==query.days*24+1||earth.samples.length!==sun.samples.length)throw Error('Incomplete sample coverage.');
  if(sun.samples.some((s,i)=>s.time!==earth.samples[i].time||s.time!==query.time+i*HOUR))throw Error('Ephemeris times do not match the requested interval.');
  return {lat:query.lat,lon:query.lon,start:query.start,days:query.days,retrievedAt:new Date().toISOString(),source:'NASA/JPL Horizons',stepMinutes:60,altitudeKm:0,terrain:false,
    samples:sun.samples.map((s,i)=>({time:s.time,sunAz:s.az,sunEl:s.el,earthAz:earth.samples[i].az,earthEl:earth.samples[i].el})),
    provenance:{sun:sun.provenance,earth:earth.provenance}};
}

function json(data,status=200) {return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':status===200?'public, max-age=86400':'no-store','X-Content-Type-Options':'nosniff'}});}

export default {
  async fetch(request,env,ctx) {
    if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
    const url=new URL(request.url);
    if(url.pathname==='/api/scenario'){
      if(request.method==='HEAD')return new Response(null,{status:405,headers:{Allow:'GET'}});
      let query;try{query=validateQuery(url.searchParams);}catch(error){return json({error:error.message},400);}
      const key=new Request(url.origin+'/api/scenario?'+new URLSearchParams({lat:query.lat,lon:query.lon,start:query.start,days:query.days}));
      const cache=globalThis.caches?.default;
      const cached=await cache?.match(key);if(cached)return cached;
      try {
        const job=queue.then(()=>makeScenario(query));queue=job.catch(()=>{});
        const result=json(await job);
        if(cache&&ctx)ctx.waitUntil(cache.put(key,result.clone()));
        return result;
      } catch {return json({error:'Could not reach NASA JPL. Retry, or use the bundled demo dates.'},502);}
    }
    const path=url.pathname==='/'?'/index.html':url.pathname;
    const asset=ASSETS[path];
    if(!asset)return new Response('Not found',{status:404});
    return new Response(request.method==='HEAD'?null:asset.body,{headers:{'Content-Type':asset.type,'Cache-Control':path.endsWith('.json')?'public, max-age=86400':'public, max-age=300','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}});
  }
};
