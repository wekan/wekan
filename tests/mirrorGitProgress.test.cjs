'use strict';
const assert = require('node:assert/strict');
const child = require('node:child_process');
const { syncBuiltinESMExports } = require('node:module');
const fs = require('node:fs');
const path = require('node:path');
process.env.TMPDIR = path.resolve(__dirname, '../.tools/tmp');
fs.mkdirSync(process.env.TMPDIR, { recursive: true });
(async () => {
  const original = child.spawnSync;
  const calls = [];
  child.spawnSync = (tool, args, options) => { calls.push({ tool, args, options }); return { status: 0, stdout: options.stdio ? null : 'refs/heads/main\n' }; };
  syncBuiltinESMExports();
  try {
    const { command } = await import('../tools/mirror-active-forges.mjs');
    for (const operation of ['clone', 'fetch', 'push']) {
      assert.equal(command('git', [operation, '--dry-run']), '');
      const c = calls.at(-1);
      assert.equal(c.args[1], '--progress');
      assert.deepEqual(c.options.stdio, ['pipe', 'inherit', 'inherit']);
    }
    assert.equal(command('git', ['for-each-ref']), 'refs/heads/main\n');
    assert.equal(calls.at(-1).options.stdio, undefined);
    child.spawnSync = () => ({ status: 2, stdout: null });
    syncBuiltinESMExports();
    assert.throws(() => command('git', ['merge', 'FETCH_HEAD']), /exit 2/);
  } finally { child.spawnSync = original; syncBuiltinESMExports(); }
  console.log('mirrorGitProgress: streaming, forced progress, inventory capture and failures verified without Git execution');
})().catch(error => { console.error(error); process.exitCode = 1; });
