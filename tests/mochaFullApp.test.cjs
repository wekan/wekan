'use strict';

// The server Mocha suite runs in --full-app mode. Run: node tests/mochaFullApp.test.cjs
//
// 26 integration tests in server/lib/tests (notification delivery, stored
// history, Sync hooks, rule plans, webhooks) skip themselves unless
// Meteor.isAppTest, which only --full-app sets - and every runner used plain
// `meteor test`, so they had never run: one of them (syncHookedCards) was
// failing unseen. This keeps the runners in that mode and every such test
// file loaded.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

const build = read('build.sh');
const runs = build.split('\n').filter(line => /\bmeteor test\b/.test(line) && !/^\s*(#|echo)/.test(line)
  && !/pgrep|pkill/.test(line));
assert.ok(runs.length >= 2, 'build.sh runs the Mocha suite');
for (const line of runs) {
  assert.match(line, /meteor test --full-app /, line.trim());
  assert.match(line, /WRITABLE_PATH="\$\{WRITABLE_PATH:-\.\.\}"/, 'the app refuses to start without it');
  assert.match(line, /EMAIL_RECEIPT_SWEEP_INTERVAL_MS=1000/);
}
const scripts = JSON.parse(read('package.json')).scripts;
for (const name of ['test', 'test:watch']) assert.match(scripts[name], /meteor test --full-app /, name);
console.log('  ok - build.sh and npm test run the server suite in --full-app mode');

// Negative: a test file that needs full-app mode but is not imported by the
// test module would never run either.
// Every regex metacharacter, the backslash included (CodeQL
// js/incomplete-sanitization): a file name is data, not a pattern.
const escapeRegExp = text => text.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
const index = read('server/lib/tests/index.js');
const dir = path.join(ROOT, 'server/lib/tests');
const unloaded = fs.readdirSync(dir).filter(file => file.endsWith('.tests.js'))
  .filter(file => /Meteor\.isAppTest/.test(fs.readFileSync(path.join(dir, file), 'utf8')))
  .filter(file => !new RegExp(`['"]\\./${escapeRegExp(file.replace(/\.js$/, ''))}(\\.js)?['"]`).test(index));
assert.deepEqual(unloaded, [], 'full-app tests missing from server/lib/tests/index.js');
console.log('  ok - every full-app test file is loaded by the test module');
