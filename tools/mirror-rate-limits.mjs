import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';
import { spawnSync } from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function cooldown(headers,now,attempt=0) {
  const retry=headers.get('retry-after');
  const seconds=retry!==null && /^\d+(?:\.\d+)?$/.test(retry)?Number(retry)*1000:Math.max(0,Date.parse(retry || '')-now);
  const remaining=headers.get('x-ratelimit-remaining') ?? headers.get('ratelimit-remaining');
  const reset=Number(headers.get('x-ratelimit-reset') ?? headers.get('ratelimit-reset'))*1000;
  return Math.max(Number.isFinite(seconds)?seconds:0,remaining==='0'&&reset>now?reset-now+1000:0,60000*2**attempt);
}
export function createLimiter({stateFile=path.join(root,'.tools/mirror/rate-limits.json'),now=Date.now,pause=sleep,log=console.log,spacing=1000}={}) {
  const queues=new Map();
  const load=()=>{if(!fs.existsSync(stateFile))return {};const state=JSON.parse(fs.readFileSync(stateFile,'utf8'));if(state.version!==1 || !state.hosts || Object.values(state.hosts).some(n=>!Number.isFinite(n)))throw Error('Invalid forge rate-limit state');return state.hosts;};
  const save=(host,until)=>{const hosts=load();hosts[host]=Math.max(hosts[host]||0,until);fs.mkdirSync(path.dirname(stateFile),{recursive:true});const file=stateFile+`.incoming-${process.pid}`;fs.writeFileSync(file,JSON.stringify({version:1,hosts})+'\n');fs.renameSync(file,stateFile);};
  async function wait(host){let ms=(load()[host]||0)-now();if(ms>0)log(`[${host}] rate limit: waiting ${Math.ceil(ms/1000)} seconds`);while(ms>0){await pause(Math.min(ms,60000));ms=(load()[host]||0)-now();}}
  async function perform(host,operation){
    for(let attempt=0;attempt<6;attempt++){
      await wait(host);const result=await operation();const response=result.response || result;
      const headers=response.headers || new Headers();
      const remaining=headers.get('x-ratelimit-remaining') ?? headers.get('ratelimit-remaining');
      const reset=Number(headers.get('x-ratelimit-reset') ?? headers.get('ratelimit-reset'))*1000;
      if(remaining==='0'&&reset>now())save(host,reset+1000);
      const limited=response.status===429 || ((response.status===403 || response.status===503) && (headers.has('retry-after') || remaining==='0' || /rate limit|too many requests|abuse detection/i.test(result.error || ''))) || (response.status>=400 && /rate limit|too many requests|abuse detection/i.test(result.error || ''));
      if(limited){await response.body?.cancel?.();save(host,now()+cooldown(headers,now(),attempt));if(attempt===5)throw Error(`${host}: rate limit persisted after six attempts; saved cooldown will be respected next run`);continue;}
      save(host,now()+spacing);return result;
    }
  }
  return {wait,perform:(host,fn)=>{const result=(queues.get(host)||Promise.resolve()).then(()=>perform(host,fn));queues.set(host,result.then(()=>{},()=>{}));return result;}};
}
export const limiter=createLimiter();
export async function limitedFetch(url,options,fetcher=fetch){return limiter.perform(new URL(url).hostname,()=>fetcher(url,{...options,signal:AbortSignal.timeout(options?.timeoutMs || 3600000)}));}
export function parseCliResponse(result) {
  const combined=result.stdout?.startsWith('HTTP/')?result.stdout:result.stderr || '';
  const match=combined.match(/^HTTP\/\S+\s+(\d+)[^\r\n]*\r?\n([\s\S]*?)(?:\r?\n\r?\n|(?![\s\S]))/m);
  const headers=new Headers();
  if(match)for(const line of match[2].split(/\r?\n/)){const colon=line.indexOf(':');if(colon>0)headers.append(line.slice(0,colon),line.slice(colon+1).trim());}
  return {response:{status:match?Number(match[1]):result.status===0?200:500,headers},body:result.stdout?.startsWith('HTTP/')?result.stdout.slice((match?.index||0)+(match?.[0].length||0)):result.stdout,error:result.stderr};
}
export async function limitedCliJson(host,tool,args,input,execute=spawnSync){
  const result=await limiter.perform(host,()=>{const p=execute(tool,[...args.slice(0,1),'--include',...args.slice(1)],{cwd:root,input,encoding:'utf8',maxBuffer:128*1024*1024,shell:false,windowsHide:true});if(p.error)throw p.error;const value=parseCliResponse(p);value.exit=p.status;return value;});
  if(result.exit!==0 || result.response.status>=400)throw Error(`${tool} HTTP ${result.response.status}: ${(result.error || '').slice(0,500)}`);
  return result.body?.trim()?JSON.parse(result.body):{};
}
// Git/SSH/SFTP have no API headers. Respect saved host cooldown before starting
// them; failures with rate-limit wording save a conservative retry timestamp.
export function commandHost(tool,args){const joined=args.join(' ');if(tool==='gh')return 'github.com';if(tool==='glab')return 'gitlab.com';if(tool==='tea')return 'codeberg.org';return ['github.com','gitlab.com','codeberg.org','sourceforge.net'].find(host=>joined.includes(host)||host==='sourceforge.net'&&/\.sf\.net/.test(joined));}
export function waitCommand(host,{now=Date.now,stateFile=path.join(root,'.tools/mirror/rate-limits.json'),pause=ms=>Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,ms),log=console.log}={}){
 if(!host)return;
 let until=0;
 if(fs.existsSync(stateFile))until=JSON.parse(fs.readFileSync(stateFile,'utf8')).hosts?.[host]||0;
 if(host==='github.com'){
  const github=path.join(path.dirname(stateFile),'github-rate-limit.json');if(fs.existsSync(github))until=Math.max(until,...Object.values(JSON.parse(fs.readFileSync(github,'utf8')).until||{}));
 }
 let remaining=until-now();if(remaining>0)log(`[${host}] respecting saved cooldown before Git/SSH/CLI command`);while(remaining>0){pause(Math.min(remaining,60000));remaining=until-now();}
}
export function noteCommandFailure(host,message,{now=Date.now,stateFile=path.join(root,'.tools/mirror/rate-limits.json')}={}) {
 if(!host || !/rate limit|too many requests|retry.after/i.test(message))return;
 const state=fs.existsSync(stateFile)?JSON.parse(fs.readFileSync(stateFile,'utf8')):{version:1,hosts:{}};
 const seconds=Number(message.match(/retry.after[^\d]*(\d+)/i)?.[1] || 60);
 state.hosts[host]=Math.max(state.hosts[host]||0,now()+Math.max(60,seconds)*1000);
 fs.mkdirSync(path.dirname(stateFile),{recursive:true});const file=stateFile+`.incoming-${process.pid}`;fs.writeFileSync(file,JSON.stringify(state)+'\n');fs.renameSync(file,stateFile);
}
