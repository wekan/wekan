'use strict';

// Plain-Node regression guard (no Meteor) for issues #6467/#6468 (WeKan side):
// with FerretDB there is no oplog, so Meteor observes every query by POLLING —
// and Meteor's defaults re-run every observed query 50 ms after ANY write and
// at least every 10 s, which multiplied into hundreds of full queries per
// second and pinned FerretDB's CPU at 250-400% for 1-2 users. The snap and the
// bundle launcher must default to calmer polling when the database is
// FerretDB, while keeping user overrides.
// Run: node tests/ferretdbPolling.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const wekanControl = read('snap-src/bin/wekan-control');
const startWekan = read('releases/ferretdb/start-wekan.sh');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('snap: calm polling defaults exist for the ferretdb database', () => {
  assert.ok(wekanControl.includes('METEOR_POLLING_THROTTLE_MS=2000'));
  assert.ok(wekanControl.includes('METEOR_POLLING_INTERVAL_MS=30000'));
});

test('snap: the defaults are scoped to database=ferretdb', () => {
  const block = wekanControl.match(
    /if \[ "ferretdb" = "\$\{DATABASE\}" \]; then[\s\S]*?METEOR_POLLING_INTERVAL_MS[\s\S]*?\nfi/,
  );
  assert.ok(block, 'polling exports live inside a ferretdb-only guard — MongoDB uses the oplog');
});

test('snap: user-provided values are respected (only set when empty)', () => {
  assert.ok(/\[ -z "\$\{METEOR_POLLING_THROTTLE_MS\}" \] && export METEOR_POLLING_THROTTLE_MS=2000/.test(wekanControl));
  assert.ok(/\[ -z "\$\{METEOR_POLLING_INTERVAL_MS\}" \] && export METEOR_POLLING_INTERVAL_MS=30000/.test(wekanControl));
});

test('bundle launcher: same defaults, same override semantics', () => {
  assert.ok(startWekan.includes('METEOR_POLLING_THROTTLE_MS="${METEOR_POLLING_THROTTLE_MS:-2000}"'));
  assert.ok(startWekan.includes('METEOR_POLLING_INTERVAL_MS="${METEOR_POLLING_INTERVAL_MS:-30000}"'));
});

test('bundle launcher: defaults only apply when the bundled FerretDB is used', () => {
  assert.ok(/if \[ "\$want_ferret" = true \]; then\s*\n\s*export METEOR_POLLING_THROTTLE_MS/.test(startWekan),
    'pointing MONGO_URL at an external MongoDB must keep Meteor defaults');
});

test('negative: the snap does not advertise an oplog URL for ferretdb', () => {
  // The whole point of the polling defaults: with FerretDB there is no oplog.
  assert.ok(/\[ "ferretdb" != "\$\{DATABASE\}" \]/.test(wekanControl),
    'MONGO_OPLOG_URL stays MongoDB-only');
});

console.log(`\n${passed} tests passed`);
