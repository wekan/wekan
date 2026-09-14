'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const tmp=path.resolve(__dirname,'../.tools/tmp');fs.mkdirSync(tmp,{recursive:true});
function fixture(){const directory=fs.mkdtempSync(path.join(tmp,'mirror-gh-'));let time=1000;return {directory,stateFile:path.join(directory,'limits.json'),now:()=>time,sleep:async ms=>{time+=ms;}};}
test('authenticated gh reads issues, comments and releases, preserving pagination headers',async()=>{
 const {createGithubClient}=await import('../tools/mirror-github.mjs');const f=fixture();const calls=[],logs=[];let probes=0;
 try{const request=createGithubClient({...f,token:'secret',cliAvailable:()=>{probes++;return true;},log:s=>logs.push(s),fetcher:async()=>{throw Error('HTTP must not run');},cliRead:async(url,headers,token)=>{calls.push(url);assert.equal(token,'secret');return new Response('[]',{headers:{Link:'<https://api.github.com/next>; rel="next"'}});}});
 for(const endpoint of ['repos/wekan/wekan/issues?page=2','repos/wekan/wekan/issues/1/comments','repos/wekan/wekan/releases']){const response=await request(endpoint);assert.deepEqual(await response.json(),[]);assert.match(response.headers.get('link'),/next/);}
 assert.equal(calls.length,3);assert.equal(probes,1);assert.match(logs[0],/authenticated gh api/);assert.ok(!logs.join('').includes('secret'));
 }finally{fs.rmSync(f.directory,{recursive:true,force:true});}
});
test('missing or unauthenticated gh falls back to public API without reading absent CLI credentials',async()=>{
 const {createGithubClient}=await import('../tools/mirror-github.mjs');
 for(const available of [false,true]){const f=fixture();try{let calls=0;const request=createGithubClient({...f,token:'',cliAvailable:()=>available,log:()=>{},cliRead:async()=>{throw Error('CLI must not run');},fetcher:async(url,o)=>{calls++;assert.equal(o.headers.Authorization,undefined);return new Response('[]');}});await request('repos/wekan/wekan/issues');assert.equal(calls,1);}finally{fs.rmSync(f.directory,{recursive:true,force:true});}}
});
test('gh authentication rejection retries public HTTP and binary assets remain streamed HTTP',async()=>{
 const {createGithubClient}=await import('../tools/mirror-github.mjs');const f=fixture();let cli=0,http=0;
 try{const request=createGithubClient({...f,token:'bad',cliAvailable:()=>true,log:()=>{},cliRead:async()=>{cli++;return new Response('invalid',{status:401});},fetcher:async(u,o)=>{http++;assert.equal(o.headers.Authorization,undefined);return new Response('[]');}});await request('repos/wekan/wekan/issues');assert.equal(cli,1);assert.equal(http,1);
 const binary=createGithubClient({...f,stateFile:path.join(f.directory,'binary.json'),token:'good',cliAvailable:()=>true,log:()=>{},cliRead:async()=>{throw Error('binary must not buffer through CLI');},fetcher:async()=>new Response('bytes')});assert.equal(await (await binary('repos/wekan/wekan/releases/assets/1',{headers:{Accept:'application/octet-stream'}})).text(),'bytes');
 }finally{fs.rmSync(f.directory,{recursive:true,force:true});}
});
test('gh adapter keeps HTTP error headers, bounds execution and never puts tokens in arguments',async()=>{
 const {githubCliRead}=await import('../tools/mirror-github.mjs');let calls=0;
 const response=await githubCliRead('https://api.github.com/repos/wekan/wekan/issues',{Accept:'application/vnd.github+json',Authorization:'Bearer secret'},'secret',async(tool,args,options)=>{
 calls++;assert.equal(tool,'gh');assert.ok(args.includes('--include'));assert.ok(!args.join(' ').includes('secret'));assert.equal(options.env.GH_TOKEN,'secret');assert.equal(options.shell,false);assert.equal(options.timeout,120000);assert.equal(options.maxBuffer,16*1024*1024);
 throw Object.assign(Error('HTTP 429'),{stdout:'HTTP/2.0 429 Too Many Requests\r\nRetry-After: 90\r\n\r\n{"message":"rate limit"}',stderr:'failed'});
 });assert.equal(calls,1);assert.equal(response.status,429);assert.equal(response.headers.get('retry-after'),'90');assert.deepEqual(await response.json(),{message:'rate limit'});
 await assert.rejects(githubCliRead('https://api.github.com/repos/wekan/wekan',{},'secret',async()=>{throw Error('timeout secret');}),/failed or timed out/);
});
