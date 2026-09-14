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
