'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
(async () => {
 const m = await import('../tools/mirror-active-forges.mjs');
 for (const name of ['gitlab', 'codeberg', 'sourceforge']) {
  const calls = [];
  m.syncGit({ name, url: 'https://example.invalid/repo.git' }, (tool, args) => { calls.push(args); return args.includes('symbolic-ref') ? 'main\n' : ''; }, () => true);
  const checkout = path.join(m.root, '.tools', `wekan-${name}`);
  assert.ok(calls.every(args => args[0] === '-C' && args[1] === checkout));
  assert.ok(!calls.some(args => args.includes('clone')));
  assert.ok(calls.some(args => args.includes('push')));
 }
 assert.throws(() => m.syncGit({ name: 'gitlab', url: 'https://example.invalid' }, () => 'dirty', () => true), /local changes/);
 console.log('mirrorGitDirectories: existing mirror checkouts reused; dirty checkout protected; no actual Git execution');
})().catch(error => { console.error(error); process.exitCode = 1; });

(async () => {
 const fs = require('node:fs');
 const m = await import('../tools/mirror-active-forges.mjs');
 const settings = await import('../tools/mirror-settings.mjs');
 const temporary = path.join(m.root, '.tools/tmp');
 fs.mkdirSync(temporary, {recursive:true});
 const work = fs.mkdtempSync(path.join(temporary, 'mirror fresh macos '));
 try {
  settings.saveSettings(work, {source:'github', mirrors:['gitlab','codeberg','sourceforge']});
  assert.deepEqual(settings.loadSettings(work).mirrors, ['gitlab','sourceforge']);
  assert.deepEqual(settings.loadSettings(work, ['gitlab','codeberg','sourceforge']).mirrors, ['gitlab','codeberg','sourceforge']);
  const calls=[];
  const run=(tool,args)=>{ calls.push(args); return args.includes('for-each-ref') ? 'refs/mirror-source/github/heads/main\n' : ''; };
  m.syncGit({name:'gitlab',url:'https://example.invalid/repo.git'},run,()=>false,work);
  assert.ok(calls.some(args=>args[0]==='clone' && args.at(-1)===path.join(work,'wekan-github')));
  assert.ok(calls.some(args=>args[0]==='clone' && args.at(-1)===path.join(work,'wekan-gitlab')));
  assert.ok(!calls.some(args=>args[0]==='-C' && args[1]===m.root));
  assert.ok(!calls.some(args=>args.includes('push') && (args.includes('--force') || args.includes('--mirror'))));
  const stopped=[];
  assert.throws(()=>m.syncGit({name:'gitlab',url:'https://example.invalid/repo.git'},(tool,args)=>{ stopped.push(args); if(args.includes('clone')) throw new Error('clone failed'); return ''; },()=>false,work), /clone failed/);
  assert.ok(!stopped.some(args=>args.includes('push')));
 } finally { fs.rmSync(work,{recursive:true,force:true}); }
 console.log('mirror bootstrap: source/destination clones, spaces, stale Codeberg settings and clone failure verified with injected commands');
})().catch(error => { console.error(error); process.exitCode = 1; });
