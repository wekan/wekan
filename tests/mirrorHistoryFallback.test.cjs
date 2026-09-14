'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const temporary = path.resolve(__dirname,'../.tools/tmp');
fs.mkdirSync(temporary,{recursive:true});
test('missing and network-failed links recover closest creation-date capture with provenance',async()=>{
 const {downloadHistoricalUrl}=await import('../tools/mirror-archive.mjs');
 const directory=fs.mkdtempSync(path.join(temporary,'mirror-history-'));
 try {for(const failed of [false,true]){
  const calls=[],events=[];
  const recovered=path.join(directory,'recovered.html');fs.writeFileSync(recovered,'historical page');
  const result=await downloadHistoricalUrl('https://example.com/lost',{temporary:directory,allLinks:true,createdAt:'2020-02-03T04:05:06Z'},async url=>{
   calls.push(url);
   if(calls.length===1){if(failed)throw Error('network timeout');return {missing:true};}
   if(calls.length===2){assert.equal(new URL(url).searchParams.get('timestamp'),'20200203040506');const file=path.join(directory,'lookup.json');fs.writeFileSync(file,JSON.stringify({archived_snapshots:{closest:{available:true,status:'200',timestamp:'20200203040600',url:'http://web.archive.org/web/20200203040600/https://example.com/lost'}}}));return {file};}
   return {file:recovered,originalName:'lost.html'};
  },(status,detail)=>events.push(status));
  assert.equal(result.file,recovered);assert.match(result.recoveredFrom,/^https:\/\/web\.archive\.org/);assert.equal(result.captureTimestamp,'20200203040600');assert.deepEqual(events,['checking','recovered']);assert.equal(calls.length,3);
 }}finally{fs.rmSync(directory,{recursive:true,force:true});}
});
test('live links bypass history and unsafe links never reach archive.org',async()=>{
 const {downloadHistoricalUrl}=await import('../tools/mirror-archive.mjs');let calls=0;
 assert.deepEqual(await downloadHistoricalUrl('https://example.com/',{createdAt:'2020-01-01'},async()=>{calls++;return {file:'live'};}),{file:'live'});assert.equal(calls,1);
 calls=0;await assert.rejects(downloadHistoricalUrl('http://127.0.0.1/',{createdAt:'2020-01-01'},async()=>{calls++;throw Error('Linked URL does not resolve exclusively to public Internet addresses');}),/public Internet/);assert.equal(calls,1);
});
test('optional attachment rate limits defer without sleeping or violating saved cooldown',async()=>{
 const {createLimiter}=await import('../tools/mirror-rate-limits.mjs');const directory=fs.mkdtempSync(path.join(temporary,'mirror-history-rate-'));let slept=0,requests=0;
 try {const stateFile=path.join(directory,'state.json');const limiter=createLimiter({stateFile,now:()=>1000,pause:async()=>{slept++;},log:()=>{}});
 await assert.rejects(limiter.perform('example.com',async()=>{requests++;return new Response('',{status:429,headers:{'retry-after':'90'}});},{maxWaitMs:3000,noRetry:true}),/deferred/);
 await assert.rejects(limiter.perform('example.com',async()=>{requests++;},{maxWaitMs:3000,noRetry:true}),/deferred/);
 assert.equal(requests,1);assert.equal(slept,0);assert.ok(JSON.parse(fs.readFileSync(stateFile)).hosts['example.com']>=91000);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
