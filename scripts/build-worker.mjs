import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {resolve,relative,extname} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const publicDir=resolve(root,'public');
const assets={};
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.pdf':'application/pdf'};
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const file=resolve(dir,entry.name);if(entry.isDirectory())await walk(file);else{const type=types[extname(file)];if(!type)throw Error(`Unsupported asset: ${file}`);assets['/'+relative(publicDir,file).split('\\').join('/')]={type,body:await readFile(file,type==='application/pdf'?'base64':'utf8'),base64:type==='application/pdf'};}}}
await walk(publicDir);
const worker=(await readFile(resolve(root,'worker/index.js'),'utf8')).replace("import { ASSETS } from './assets.generated.js';",()=>`const ASSETS = ${JSON.stringify(assets)};`);
await mkdir(resolve(root,'dist/server'),{recursive:true});
await writeFile(resolve(root,'dist/server/index.js'),worker);
console.log(`Built ${Object.keys(assets).length} assets and Horizons endpoint (${Buffer.byteLength(worker)} bytes).`);
