'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const temporary = path.resolve(__dirname, '../.tools/tmp');
fs.mkdirSync(temporary, {recursive:true});

test('missing linked files and failed downloads request only the original URL', async () => {
 const {archiveItem} = await import('../tools/mirror-archive.mjs');
 const directory = fs.mkdtempSync(path.join(temporary, 'mirror-no-wayback-'));
 try {
  for (const failed of [false, true]) {
   const calls = [], events = [];
   await archiveItem(directory, 'comments', failed ? 'failed' : 'missing', 'https://example.com/lost', [
    {key:'linked', name:'lost.html', source:'https://example.com/lost', kind:'attachment', allLinks:true, createdAt:'2020-02-03T04:05:06Z'}
   ], {apply:true, temporary:directory, now:new Date(), record:(status, detail)=>events.push({status, detail}), fetchFile:async (url, options) => {
    calls.push(url);
    assert.equal(options.allLinks, true);
    if (failed) throw Error('network timeout');
    return {missing:true};
   }});
   assert.deepEqual(calls, ['https://example.com/lost']);
   assert.equal(events.at(-1).status, failed ? 'skipped' : 'missing');
  }
 } finally {fs.rmSync(directory, {recursive:true, force:true});}
});

test('live linked files are still archived', async () => {
 const {archiveItem} = await import('../tools/mirror-archive.mjs');
 const directory = fs.mkdtempSync(path.join(temporary, 'mirror-live-link-'));
 try {
  const source = path.join(directory, 'source.html');
  fs.writeFileSync(source, 'live page');
  const calls = [];
  await archiveItem(directory, 'comments', 'live', 'https://example.com/live', [
   {key:'linked', name:'live.html', source:'https://example.com/live', kind:'attachment', allLinks:true}
  ], {apply:true, temporary:directory, now:new Date(), record:()=>{}, fetchFile:async url => {calls.push(url);return {file:source};}});
  assert.deepEqual(calls, ['https://example.com/live']);
  assert.equal(fs.readFileSync(path.join(directory, 'live/live.html'), 'utf8'), 'live page');
 } finally {fs.rmSync(directory, {recursive:true, force:true});}
});

test('optional attachment rate limits defer without sleeping or violating saved cooldown',async()=>{
 const {createLimiter}=await import('../tools/mirror-rate-limits.mjs');const directory=fs.mkdtempSync(path.join(temporary,'mirror-history-rate-'));let slept=0,requests=0;
 try {const stateFile=path.join(directory,'state.json');const limiter=createLimiter({stateFile,now:()=>1000,pause:async()=>{slept++;},log:()=>{}});
 await assert.rejects(limiter.perform('example.com',async()=>{requests++;return new Response('',{status:429,headers:{'retry-after':'90'}});},{maxWaitMs:3000,noRetry:true}),/deferred/);
 await assert.rejects(limiter.perform('example.com',async()=>{requests++;},{maxWaitMs:3000,noRetry:true}),/deferred/);
 assert.equal(requests,1);assert.equal(slept,0);assert.ok(JSON.parse(fs.readFileSync(stateFile)).hosts['example.com']>=91000);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
