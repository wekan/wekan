'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync, spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..'), tmp = path.join(root, '.tools/tmp');
fs.mkdirSync(tmp, { recursive: true }); process.env.TMPDIR = tmp;
const modulePromise = import('../tools/mirror-disk-snapshot.mjs');
function fixture() {
  const directory = fs.mkdtempSync(path.join(tmp, 'mirror-disk-'));
  const base = path.join(directory, '.tools/mirror/github.com/wekan/wekan');
  const calls = [], logs = [];
  const issue = n => ({ id: n, number: n, title: `Issue ${n}`, body: 'Saved body', html_url: `https://github.com/wekan/wekan/issues/${n}`, state: 'open', user: { login: 'reporter' } });
  const pull = { ...issue(2), html_url: 'https://github.com/wekan/wekan/pull/2', patch_url: 'https://github.com/wekan/wekan/pull/2.patch', pull_request: {} };
  const api = async endpoint => {
    calls.push(endpoint); const url = new URL(endpoint, 'https://api.github.com/');
    const p = Number(url.searchParams.get('page'));
    if (url.pathname.endsWith('/issues')) return p === 1 ? [issue(1), pull] : p === 2 ? [issue(3)] : [];
    if (url.pathname.endsWith('/pulls')) return p === 1 ? [pull] : [];
    if (url.pathname.endsWith('/issues/comments')) return p === 1 ? [{ id: 10, issue_url: 'https://api.github.com/repos/wekan/wekan/issues/1', html_url: 'https://github.com/wekan/wekan/issues/1#issuecomment-10', body: 'Comment body', user: { login: 'commenter' } }] : [];
    if (url.pathname.endsWith('/pulls/comments')) return p === 1 ? [{ id: 11, pull_request_url: 'https://api.github.com/repos/wekan/wekan/pulls/2', html_url: 'https://github.com/wekan/wekan/pull/2#discussion_r11', body: 'Inline comment' }] : [];
    if (url.pathname.endsWith('/reviews')) return p === 1 ? [{ id: 12, html_url: 'https://github.com/wekan/wekan/pull/2#pullrequestreview-12', body: 'Review body', state: 'APPROVED' }] : [];
    if (url.pathname.endsWith('/releases')) return p === 1 ? [{ id: 20, tag_name: 'v10.00', name: 'Release', html_url: 'https://github.com/wekan/wekan/releases/tag/v10.00', body: 'Release notes', assets: [] }] : [];
    return [];
  };
  const file = path.join(directory, 'download.txt'); fs.writeFileSync(file, 'download');
  const options = { root: directory, api, log: line => logs.push(line), fetchFile: async () => ({ file }), downloadAsset: async () => file };
  return { directory, base, calls, logs, api, options };
}
test('responses are saved before later requests; complete collection yields lazy conversations and static pages', async () => {
  const m = await modulePromise, f = fixture();
  try {
    const manifest = await m.collectGithub({ ...f.options, api: async endpoint => {
      if (endpoint.includes('/pulls?')) assert.ok(fs.existsSync(path.join(f.base, 'issues/1/issue.json')));
      if (endpoint.includes('/pulls/2/reviews')) assert.equal(JSON.parse(fs.readFileSync(path.join(f.base, 'issues/1/10/source-comment.json'))).body, 'Comment body');
      return f.api(endpoint);
    } });
    assert.equal(manifest.complete, true); assert.equal(manifest.archiveComplete, true);
    const snapshot = m.diskSnapshot(manifest);
    assert.ok(snapshot.issues instanceof m.DiskItems); assert.equal(Array.isArray(snapshot.issues), false);
    assert.equal(snapshot.issues.length, 3); assert.equal(snapshot.releases.length, 1);
    assert.equal(snapshot.issues.filter(i => !i.pull_request).map(i => i.number).length, 2);
    const conversation = [...snapshot.issues].find(i => i.number === 2);
    assert.equal(conversation.reviews.length, 1); assert.equal(conversation.commentsToMirror.length, 2);
    for (const name of ['issues/1/index.html', 'pulls/2/index.html', 'pulls/2/pull-request.patch', 'releases/10.00/release.json', 'index.csv', 'index.html']) assert.ok(fs.existsSync(path.join(f.base, name)), name);
    assert.match(fs.readFileSync(path.join(f.base, 'issues/1/index.html'), 'utf8'), /Comment body/);
    assert.equal(fs.readFileSync(path.join(f.base, 'issues/1/10/index.html'), 'utf8'), '');
    assert.ok(!fs.existsSync(path.join(f.base, 'source-collection.lock')));
    assert.ok(!JSON.stringify(manifest).includes('Comment body'), 'manifest contains references, not conversation bodies');
  } finally { fs.rmSync(f.directory, { recursive: true, force: true }); }
});
test('failed inventory preserves files and resumes the next page without refetching completed pages', async () => {
  const m = await modulePromise, f = fixture();
  try {
    await assert.rejects(m.collectGithub({ ...f.options, api: endpoint => {
      if (endpoint.includes('/issues?') && endpoint.includes('page=2')) throw Error('interrupted fixture');
      return f.api(endpoint);
    } }), /interrupted fixture/);
    assert.ok(fs.existsSync(path.join(f.base, 'issues/1/issue.json')));
    const saved = JSON.parse(fs.readFileSync(path.join(f.base, 'source-manifest.json')));
    assert.equal(saved.complete, false); assert.throws(() => m.diskSnapshot(saved), /Incomplete/);
    f.calls.length = 0; await m.collectGithub(f.options);
    assert.ok(!f.calls.some(e => e.includes('/issues?') && e.includes('page=1&')));
    assert.ok(f.calls.some(e => e.includes('/issues?') && e.includes('page=2&')));
    assert.ok(f.logs.some(line => line.includes('Resuming saved GitHub')));
  } finally { fs.rmSync(f.directory, { recursive: true, force: true }); }
});
test('interrupted review pagination resumes cached summaries and preserves unrelated archived issues', async () => {
  const m = await modulePromise, f = fixture();
  try {
    await assert.rejects(m.collectGithub({ ...f.options, api: endpoint => {
      if (endpoint.includes('/reviews?') && endpoint.includes('page=2')) throw Error('review interruption');
      return f.api(endpoint);
    } }), /review interruption/);
    assert.ok(fs.existsSync(path.join(f.base, 'issues/1/issue.json')));
    assert.ok(!fs.readdirSync(path.join(f.base, 'issues/1')).some(n => n.startsWith('old-') && n.endsWith('issue.json')), 'partial pull must not retire unrelated issue');
    assert.ok(fs.existsSync(path.join(f.base, 'pulls/2/review-12/source-review.json')));
    f.calls.length = 0;
    const manifest = await m.collectGithub(f.options);
    assert.ok(!f.calls.some(e => e.includes('/reviews?') && e.includes('page=1&')));
    assert.equal([...m.diskSnapshot(manifest).issues].find(i => i.number === 2).reviews[0].body, 'Review body');
  } finally { fs.rmSync(f.directory, { recursive: true, force: true }); }
});
test('subsequent complete scans keep old changed responses and reject unsafe manifest paths', async () => {
  const m = await modulePromise, f = fixture();
  try {
    await m.collectGithub(f.options);
    await m.collectGithub({ ...f.options, api: async endpoint => (await f.api(endpoint)).map(item => item.number === 1 ? { ...item, body: 'New body' } : item) });
    const names = fs.readdirSync(path.join(f.base, 'issues/1'));
    assert.ok(names.some(n => n.startsWith('old-') && n.endsWith('source-item.json')));
    assert.equal(JSON.parse(fs.readFileSync(path.join(f.base, 'issues/1/issue.json'))).body, 'New body');
    assert.throws(() => [...new m.DiskItems(f.base, ['../../outside.json'])], /Unsafe/);
  } finally { fs.rmSync(f.directory, { recursive: true, force: true }); }
});
test('collection of many large bodies fits a bounded heap instead of retaining the whole source', async () => {
  const directory = fs.mkdtempSync(path.join(tmp, 'mirror-low-heap-'));
  try {
    const moduleUrl = require('node:url').pathToFileURL(path.join(root, 'tools/mirror-disk-snapshot.mjs')).href;
    const script = `import { collectGithub } from ${JSON.stringify(moduleUrl)};
      const result = await collectGithub({ root: ${JSON.stringify(directory)}, cacheOnly: true, log: () => {}, api: async endpoint => {
        const url = new URL(endpoint, 'https://api.github.com/');
        const page = Number(url.searchParams.get('page'));
        if (!url.pathname.endsWith('/issues') || page > 32) return [];
        return [0,1].map(offset => {const number=(page-1)*2+offset+1;return {id:number,number,title:'Large issue',body:'x'.repeat(512*1024),html_url:'https://github.com/wekan/wekan/issues/'+number};});
      }}); if (result.issueFiles.length !== 64) throw Error('Incomplete stress fixture');`;
    const result = spawnSync(process.execPath, ['--max-old-space-size=48', '--input-type=module', '-e', script], { encoding: 'utf8', timeout: 90000, env: { ...process.env, TMPDIR: tmp } });
    assert.equal(result.status, 0, result.stderr);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test('SIGINT saves checkpoints, releases the lock and keeps downloaded issue data', async () => {
  const m = await modulePromise, f = fixture(); let child;
  try {
    const url = require('node:url').pathToFileURL(path.join(root, 'tools/mirror-disk-snapshot.mjs')).href;
    const script = `import { collectGithub } from ${JSON.stringify(url)};
      await collectGithub({root:${JSON.stringify(f.directory)},cacheOnly:true,log:()=>{},api:async endpoint=>{
        if(endpoint.includes('/issues?')&&endpoint.includes('page=1&'))return [{id:1,number:1,title:'Issue 1',body:'Saved before Ctrl+C',html_url:'https://github.com/wekan/wekan/issues/1'}];
        console.log('READY_TO_INTERRUPT');await new Promise(()=>{setInterval(()=>{},1000);});
      }});`;
    child = spawn(process.execPath, ['--input-type=module','-e',script], {stdio:['ignore','pipe','pipe']});
    const exited = new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',(code,signal)=>resolve({code,signal}));});
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(Error('fixture did not reach interruption point')),10000);
      child.stdout.on('data',chunk=>{if(String(chunk).includes('READY_TO_INTERRUPT')){clearTimeout(timer);resolve();}});
      child.on('error',reject);
    });
    child.kill('SIGINT'); const exit=await exited; assert.equal(exit.code,130);
    assert.equal(JSON.parse(fs.readFileSync(path.join(f.base,'issues/1/issue.json'))).body,'Saved before Ctrl+C');
    assert.ok(!fs.existsSync(path.join(f.base,'source-collection.lock')));
    const saved=JSON.parse(fs.readFileSync(path.join(f.base,'source-manifest.json')));
    assert.equal(saved.complete,false);
    await m.collectGithub(f.options);
    assert.ok(!f.calls.some(e=>e.includes('/issues?')&&e.includes('page=1&')));
  } finally {if(child&&child.exitCode===null)child.kill('SIGKILL');fs.rmSync(f.directory,{recursive:true,force:true});}
});
test('destination restart reuses the completed source and skips completed mirrors', async () => {
  const menu=await import('../tools/mirror-menu.mjs'),f=fixture();
  try {
    const settings={source:'github',mirrors:['gitlab','codeberg']},calls=[];
    const run=async(_,args)=>{
      calls.push(args);
      if(args.includes('--export-source')){
        const manifest={diskSnapshot:1,base:f.base,complete:true,issueFiles:[],releaseFiles:[]};
        fs.mkdirSync(f.base,{recursive:true});fs.writeFileSync(path.join(f.base,'source-manifest.json'),JSON.stringify(manifest));
      }
      if(args.some(a=>a.endsWith('mirror-codeberg.sh')))throw Error('interrupted destination fixture');
    };
    assert.equal(await menu.sync(settings,{directory:f.directory,run,log:()=>{}}),false);
    calls.length=0;
    assert.equal(await menu.sync(settings,{directory:f.directory,run:async(_,args)=>{calls.push(args);},log:()=>{}}),true);
    assert.equal(calls.length,1);assert.ok(calls[0][0].endsWith('mirror-codeberg.sh'));
    assert.equal(JSON.parse(fs.readFileSync(path.join(f.base,'sync-progress.json'))).complete,true);
  } finally {fs.rmSync(f.directory,{recursive:true,force:true});}
});
