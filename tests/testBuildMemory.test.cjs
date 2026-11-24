'use strict';

// The Meteor test build ran out of memory before any test started (FATAL
// ERROR: Zone Allocation failed) once the help texts grew every locale file:
// in test mode the whole client bundle - one file of 170 to 190 MB - was
// compiled again for legacy browsers, and V8's compiler gave up on it. No
// test uses the legacy browser build, so every `meteor test` run skips it.
// Meteor 3.6's watcher also walked all of .tools/ (it does not read
// .meteorignore), so the --once runs turn it off.
// Run: node --test tests/testBuildMemory.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

test('every meteor test run skips the legacy browser build and the watcher', () => {
  const runs = [
    ...read('build.sh').split('\n').filter(l => /\bmeteor test --full-app/.test(l) && !/^\s*(#|echo)/.test(l)),
    JSON.parse(read('package.json')).scripts.test,
  ];
  assert.ok(runs.length >= 3, `found ${runs.length}`);
  for (const run of runs) {
    assert.match(run, /--exclude-archs web\.browser\.legacy,web\.cordova/, run);
    assert.match(run, /METEOR_WATCH_FORCE_POLLING=true/, run);
  }
});
