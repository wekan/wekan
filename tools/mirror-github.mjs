// GitHub HTTP transport for human-run mirrors: serial, bounded retries, no token
// required for public REST reads. State contains timestamps only, never tokens.
import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as pause } from 'node:timers/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function retryDelay(headers, now, attempt=0) {
  const retry=headers.get('retry-after'),reset=Number(headers.get('x-ratelimit-reset'))*1000;
  const retryMs=retry===null?0:/^\d+(?:\.\d+)?$/.test(retry)?Number(retry)*1000:Math.max(0,Date.parse(retry)-now);
  const primary=headers.get('x-ratelimit-remaining')==='0'&&Number.isFinite(reset)?Math.max(0,reset-now)+1000:0;
  return Math.max(Number.isFinite(retryMs)?retryMs:0,primary,60000*2**attempt);
}
function tokenFromCli() {
  const result=spawnSync('gh',['auth','token','--hostname','github.com'],{encoding:'utf8',shell:false,windowsHide:true,stdio:['ignore','pipe','pipe']});
  return result.status===0?result.stdout.trim():'';
}
export function createGithubClient({fetcher=fetch,sleep=pause,now=Date.now,log=console.log,tokenLoader=tokenFromCli,token,stateFile=path.join(root,'.tools/mirror/github-rate-limit.json')}={}) {
  let queue=Promise.resolve(),credential=token;
  const load=()=>{if(!fs.existsSync(stateFile))return {};const state=JSON.parse(fs.readFileSync(stateFile,'utf8'));if(state.version!==1||!state.until||Object.values(state.until).some(n=>!Number.isFinite(n)))throw Error('Invalid GitHub rate-limit state');return state.until;};
  const save=(resource,until)=>{const state=load();state[resource]=Math.max(state[resource]||0,until);fs.mkdirSync(path.dirname(stateFile),{recursive:true});const incoming=stateFile+`.incoming-${process.pid}`;fs.writeFileSync(incoming,JSON.stringify({version:1,until:state})+'\n');fs.renameSync(incoming,stateFile);};
  async function wait(until) {let remaining=until-now();if(remaining<=0)return;log(`[github] rate limit: waiting ${Math.ceil(remaining/1000)} seconds`);while(remaining>0){await sleep(Math.min(remaining,60000));remaining=until-now();}}
  async function request(endpoint,{method='GET',data,headers:extra={}}={}) {
    let url=new URL(endpoint.startsWith('https://')?endpoint:`https://api.github.com/${endpoint.replace(/^\//,'')}`);
    if(!['api.github.com','uploads.github.com'].includes(url.hostname)||url.protocol!=='https:'||url.username||url.password)throw Error('Unsupported GitHub API URL');
    if(credential===undefined)credential=process.env.GH_TOKEN||process.env.GITHUB_TOKEN||tokenLoader()||'';
    const graphql=url.pathname==='/graphql';
    const query=graphql&&method==='POST'&&typeof data?.query==='string'&&/^\s*(?:query\b|\{)/.test(data.query);
    if(!credential && method!=='GET' && method!=='HEAD' && !query)throw Error('GitHub token is required for remote writes');
    if(!credential && graphql)throw Error('Public Projects GraphQL inventory requires a GitHub token; public REST mirroring remains available');
    const resource=graphql?'graphql':'core';
    const headers={Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'WeKan-mirror',...extra,...(credential?{Authorization:`Bearer ${credential}`}:{})};
    const body=data===undefined?undefined:data instanceof Blob?data:JSON.stringify(data);
    if(data!==undefined && !(data instanceof Blob))headers['Content-Type']='application/json';
    let redirects=0;
    for(let attempt=0;attempt<6;attempt++) {
      await wait(load()[resource]||0);
      log(`[github] ${method} ${url.hostname}${url.pathname}${url.searchParams.has('page') ? ` page ${url.searchParams.get('page')}` : ''} (attempt ${attempt + 1}/6)`);
      const response=await fetcher(url.href,{method,headers,body,redirect:'manual',signal:AbortSignal.timeout(3600000)});
      if(response.headers.get('x-ratelimit-remaining')==='0') {
        const reset=Number(response.headers.get('x-ratelimit-reset'))*1000;
        if(Number.isFinite(reset)&&reset>now())save(resource,reset+1000);
      }
      if([301,302,303,307,308].includes(response.status)) {
        const next=new URL(response.headers.get('location')||'',url);await response.body?.cancel();
        const fileRedirect=method==='GET'&&extra.Accept==='application/octet-stream'&&(next.hostname.endsWith('.githubusercontent.com')||/^github-production-[a-z0-9-]+\.s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com$/.test(next.hostname));
        if(++redirects>10 || (!fileRedirect && next.hostname!==url.hostname) || next.protocol!=='https:' || next.username || next.password)throw Error('Unsupported GitHub API redirect');
        if(next.hostname!==url.hostname)delete headers.Authorization;
        url=next;attempt--;continue;
      }
      if(response.status===401 && credential && (method==='GET'||query)) {
        await response.body?.cancel();credential='';delete headers.Authorization;
        log('[github] token rejected; retrying public REST access without a token');
        if(graphql)throw Error('GitHub token rejected for Projects GraphQL inventory');
        continue;
      }
      if([403,429,503].includes(response.status)) {
        const message=await response.text();
        if(response.status===429 || response.headers.has('retry-after') || response.headers.get('x-ratelimit-remaining')==='0' || /(?:secondary |API )?rate limit|abuse detection/i.test(message)) {
          const until=now()+retryDelay(response.headers,now(),attempt);save(resource,until);
          if(attempt===5)throw Error('GitHub rate limit persisted after six attempts; cooldown saved for the next run');
          await wait(until);continue;
        }
        throw Error(`GitHub HTTP ${response.status}: ${message.slice(0,500)}`);
      }
      if(!response.ok)throw Error(`GitHub HTTP ${response.status}: ${(await response.text()).slice(0,500)}`);
      // One-second spacing also obeys guidance for mutative request bursts.
      save(resource,Math.max(load()[resource]||0,now()+1000));
      return response;
    }
    throw Error('GitHub request did not complete');
  }
  return (endpoint,options)=>{const result=queue.then(()=>request(endpoint,options));queue=result.then(()=>{},()=>{});return result;};
}
export const githubRequest=createGithubClient();
export async function githubJson(endpoint,method='GET',data) {return (await githubRequest(endpoint,{method,data})).json();}
