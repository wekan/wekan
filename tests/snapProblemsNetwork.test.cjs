'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const wrapper = fs.readFileSync(path.join(root, 'snap-src/bin/wekan-problems'), 'utf8');
const report = fs.readFileSync(path.join(root, 'snap-src/bin/wekan-problems.mjs'), 'utf8');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-problems-network-'));
const bin = path.join(temp, 'bin');
fs.mkdirSync(bin, { recursive: true });
fs.mkdirSync(path.join(temp, 'programs/server/node_modules'), { recursive: true });
fs.writeFileSync(path.join(bin, 'wekan-problems'), wrapper, { mode: 0o755 });
fs.writeFileSync(path.join(bin, 'startup-network'),
  'export MONGO_URL=mongodb://127.0.0.1:27123/wekan\n', { mode: 0o755 });
fs.writeFileSync(path.join(bin, 'node'),
  '#!/bin/sh\nprintf "%s\\n" "$WEKAN_PROBLEMS_URL"\n', { mode: 0o755 });

function run(settings) {
  fs.writeFileSync(path.join(bin, 'wekan-read-settings'), settings, { mode: 0o755 });
  return execFileSync('bash', [path.join(bin, 'wekan-problems'), 'login'], {
    encoding: 'utf8', env: { ...process.env, SNAP: temp,
      SNAP_COMMON: path.join(temp, 'common'), MONGO_URL: '', WEKAN_PROBLEMS_URL: '' },
  }).trim();
}

assert.equal(run('unset MONGO_URL\n'), 'mongodb://127.0.0.1:27123/wekan',
  'the command uses the same dynamically resolved URL as the Snap services');
assert.equal(run('export MONGO_URL=mongodb://database.example:27017/wekan\n'),
  'mongodb://database.example:27017/wekan',
  'an explicit external database URL remains authoritative');
assert.match(report, /process\.env\.WEKAN_PROBLEMS_URL[\s\S]*process\.env\.MONGO_URL/,
  'the Node report accepts both wrapper and conventional database variables');
assert.doesNotMatch(wrapper, /WEKAN_PROBLEMS_URL:-mongodb:\/\/127\.0\.0\.1:27019/,
  'the wrapper never reinstates the obsolete fixed port');

fs.rmSync(temp, { recursive: true, force: true });
console.log('snapProblemsNetwork: dynamic and explicit database URLs passed');
