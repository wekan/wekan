'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),tmp=path.join(root,'.tools/tmp');fs.mkdirSync(tmp,{recursive:true});process.env.TMPDIR=tmp;
const github=import('../tools/mirror-github.mjs'),rates=import('../tools/mirror-rate-limits.mjs');
function fixture(){const directory=fs.mkdtempSync(path.join(tmp,'mirror-limits-'));let time=1000000;const waits=[];return {directory,stateFile:path.join(directory,'state.json'),now:()=>time,pause:async ms=>{waits.push(ms);time+=ms;},waits};}
test('tokenless public REST reads work without gh, serialize and never send Authorization',async()=>{
 const m=await github,f=fixture(),calls=[];
 try{const request=m.createGithubClient({stateFile:f.stateFile,now:f.now,sleep:f.pause,tokenLoader:()=>'',log:()=>{},fetcher:async(url,options)=>{calls.push(options);return new Response('[]');}});await Promise.all([request('orgs/wekan/repos'),request('repos/wekan/wekan/issues')]);assert.equal(calls.length,2);assert.equal(calls[0].headers.Authorization,undefined);assert.deepEqual(f.waits,[1000]);await assert.rejects(request('repos/wekan/wekan/issues',{method:'POST',data:{title:'x'}}),/token is required/);}finally{fs.rmSync(f.directory,{recursive:true,force:true});}
});
test('GitHub primary reset, Retry-After and secondary exponential backoff are respected',async()=>{
 const m=await github,f=fixture();let requests=0;
 try{const request=m.createGithubClient({stateFile:f.stateFile,now:f.now,sleep:f.pause,token:'token',log:()=>{},fetcher:async()=>++requests===1?new Response('{"message":"rate limit"}',{status:429,headers:{'retry-after':'90','x-ratelimit-remaining':'0','x-ratelimit-reset':'1120'}}):new Response('[]')});await request('repos/wekan/wekan/issues');assert.equal(requests,2);assert.ok(f.waits.reduce((a,b)=>a+b,0)>=121000);assert.ok(f.waits.every(ms=>ms<=60000));assert.equal(m.retryDelay(new Headers(),0,2),240000);}finally{fs.rmSync(f.directory,{recursive:true,force:true});}
});
test('invalid GitHub tokens fall back only on reads; redirects cannot leak credentials',async()=>{
 const m=await github,f=fixture(),calls=[];
 try{const request=m.createGithubClient({stateFile:f.stateFile,now:f.now,sleep:f.pause,token:'bad',log:()=>{},fetcher:async(u,o)=>{calls.push({...o.headers});return calls.length===1?new Response('invalid',{status:401}):new Response('[]');}});await request('repos/wekan/wekan');assert.equal(calls[0].Authorization,'Bearer bad');assert.equal(calls[1].Authorization,undefined);
 const redirect=m.createGithubClient({stateFile:path.join(f.directory,'redirect.json'),now:f.now,sleep:f.pause,token:'good',log:()=>{},fetcher:async()=>new Response(null,{status:302,headers:{location:'https://example.com'}})});await assert.rejects(redirect('repos/wekan/wekan'),/Unsupported.*redirect/);
 }finally{fs.rmSync(f.directory,{recursive:true,force:true});}
});
test('every mirror host honors cooldowns, retries 429 and carries reset state to a new process client',async()=>{
 const m=await rates,f=fixture();let calls=0;
 try{for(const host of ['gitlab.com','codeberg.org','sourceforge.net']){const limiter=m.createLimiter({stateFile:f.stateFile,now:f.now,pause:f.pause,log:()=>{}});await limiter.perform(host,async()=>++calls%2?new Response(null,{status:429,headers:{'retry-after':'75'}}):new Response('{}'));}assert.equal(calls,6);assert.ok(f.waits.reduce((a,b)=>a+b,0)>=225000);const limiter=m.createLimiter({stateFile:f.stateFile,now:f.now,pause:f.pause,log:()=>{}});await limiter.perform('sourceforge.net',async()=>new Response('{}'));assert.equal(f.waits.at(-1),1000);assert.ok(!fs.readFileSync(f.stateFile,'utf8').includes('token'));}finally{fs.rmSync(f.directory,{recursive:true,force:true});}
});
test('CLI response headers from stdout or stderr keep status, body and rate limits',async()=>{
 const m=await rates;
 const gitlab=m.parseCliResponse({status:0,stdout:'HTTP/2.0 200 OK\r\nRateLimit-Remaining: 0\r\nRateLimit-Reset: 2000\r\n\r\n[]',stderr:''});assert.equal(gitlab.body,'[]');assert.equal(gitlab.response.headers.get('ratelimit-remaining'),'0');
 const tea=m.parseCliResponse({status:1,stdout:'{}',stderr:'HTTP/1.1 429 Too Many Requests\nRetry-After: 120\n\n'});assert.equal(tea.response.status,429);assert.equal(tea.response.headers.get('retry-after'),'120');
});
test('Git/SSH/SFTP cooldown waits and rate-limit failures persist without executing any remote command',async()=>{
 const m=await rates,f=fixture();
 try{m.noteCommandFailure('sourceforge.net','too many requests; Retry-After: 120',{stateFile:f.stateFile,now:f.now});let elapsed=0;m.waitCommand('sourceforge.net',{stateFile:f.stateFile,now:()=>f.now()+elapsed,pause:ms=>elapsed+=ms,log:()=>{}});assert.equal(elapsed,120000);assert.equal(m.commandHost('sftp',['wekan@frs.sourceforge.net']),'sourceforge.net');assert.equal(m.commandHost('git',['config','user.name']),undefined);}finally{fs.rmSync(f.directory,{recursive:true,force:true});}
});
test('continued rate limiting stops after bounded retries and a subsequent client honors the last saved cooldown',async()=>{
 const m=await rates,f=fixture();let calls=0;
 try{const limited=m.createLimiter({stateFile:f.stateFile,now:f.now,pause:f.pause,log:()=>{}});await assert.rejects(limited.perform('codeberg.org',async()=>{calls++;return new Response(null,{status:429});}),/six attempts/);assert.equal(calls,6);const before=f.waits.reduce((a,b)=>a+b,0);const later=m.createLimiter({stateFile:f.stateFile,now:f.now,pause:f.pause,log:()=>{}});await later.perform('codeberg.org',async()=>new Response('{}'));assert.ok(f.waits.reduce((a,b)=>a+b,0)-before>=60000*2**5);assert.ok(f.waits.every(ms=>ms<=60000));}finally{fs.rmSync(f.directory,{recursive:true,force:true});}
});
