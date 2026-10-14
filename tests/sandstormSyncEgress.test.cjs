'use strict';
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const result = spawnSync(process.execPath, ['--test', path.join(__dirname, 'sandstormSyncEgress.test.mjs')], {
  encoding: 'utf8', env: process.env,
});
process.stdout.write(result.stdout);
process.stderr.write(result.stderr);
assert.equal(result.status, 0, 'Sandstorm sync egress tests failed');
