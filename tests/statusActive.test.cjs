'use strict';

// Unit + negative tests for isStatusActive (#6520): deciding whether a persisted
// migration / board-repair status doc is STILL running or has a stale
// `running:true`. The bug was the Admin Panel → Problems "Status" page showing
// "Board data-repair — 146/146 boards" (and a matching "Migration or repair"
// warning) forever, because it trusted the raw `running` flag.
//
// Run: node tests/statusActive.test.cjs

const assert = require('assert');
const { isStatusActive, DEFAULT_STALE_MS } = require('../models/lib/statusActive.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const NOW = 1_700_000_000_000;
const recent = () => new Date(NOW - 1000).toISOString();
function active(doc) { return isStatusActive(doc, { now: NOW }); }

console.log('statusActive:');

test('a live repair mid-way, updated recently, IS active', () => {
  assert.strictEqual(active({
    running: true, phase: 'repairing', boardsDone: 40, boardsTotal: 146, updatedAt: recent(),
  }), true);
});

// The exact reported bug: a completion write raced with a late progress write and
// lost, leaving running:true at 146/146.
test('running:true but done === total is FINISHED, not active (146/146)', () => {
  assert.strictEqual(active({
    running: true, phase: 'repairing', boardsDone: 146, boardsTotal: 146, updatedAt: recent(),
  }), false);
});

test('done > total (overshoot) is also finished', () => {
  assert.strictEqual(active({
    running: true, phase: 'repairing', boardsDone: 150, boardsTotal: 146, updatedAt: recent(),
  }), false);
});

test('a terminal phase is never active, whatever the flag says', () => {
  for (const phase of ['completed', 'error', 'done']) {
    assert.strictEqual(active({
      running: true, phase, boardsDone: 10, boardsTotal: 146, updatedAt: recent(),
    }), false, `phase ${phase} must not be active`);
  }
});

test('running:false is never active', () => {
  assert.strictEqual(active({
    running: false, phase: 'repairing', boardsDone: 40, boardsTotal: 146, updatedAt: recent(),
  }), false);
});

// A process killed mid-repair leaves running:true with no completion write.
test('a stale running flag (no recent update) is not active — crashed run', () => {
  assert.strictEqual(active({
    running: true, phase: 'repairing', boardsDone: 40, boardsTotal: 146,
    updatedAt: new Date(NOW - DEFAULT_STALE_MS - 1000).toISOString(),
  }), false);
});

test('just inside the stale window is still active; just outside is not', () => {
  const base = { running: true, phase: 'repairing', boardsDone: 5, boardsTotal: 146 };
  assert.strictEqual(active({ ...base, updatedAt: new Date(NOW - DEFAULT_STALE_MS + 1000).toISOString() }), true);
  assert.strictEqual(active({ ...base, updatedAt: new Date(NOW - DEFAULT_STALE_MS - 1000).toISOString() }), false);
});

test('a running doc with no total yet (boardsTotal 0) is active if recent', () => {
  // The initial startup write sets boardsTotal:0 before the count is known - it
  // must still count as in progress (the done>=total guard only fires when a real
  // total is known).
  assert.strictEqual(active({
    running: true, phase: 'repairing', boardsDone: 0, boardsTotal: 0, updatedAt: recent(),
  }), true);
});

test('the text migration uses the collections pair while migrating', () => {
  assert.strictEqual(active({
    running: true, phase: 'migrating', collectionsDone: 3, collectionsTotal: 8, updatedAt: recent(),
  }), true);
  assert.strictEqual(active({
    running: true, phase: 'migrating', collectionsDone: 8, collectionsTotal: 8, updatedAt: recent(),
  }), false);
});

test('null / undefined / empty docs are not active (negative)', () => {
  for (const d of [null, undefined, {}, { running: true }]) {
    // { running:true } with no updatedAt and no total: recent-enough (updated 0 is
    // treated as "no timestamp", not stale) and no total to have reached, so it is
    // active - a freshly-flagged run. Only the first three must be false.
    if (d && d.running) continue;
    assert.strictEqual(active(d), false);
  }
  // A bare running flag with nothing else is treated as active (freshly started).
  assert.strictEqual(active({ running: true }), true);
});

test('a doc with no updatedAt is not treated as stale', () => {
  // updated === 0 means "no timestamp recorded", which must not read as ancient.
  assert.strictEqual(active({ running: true, phase: 'repairing', boardsDone: 1, boardsTotal: 5 }), true);
});

console.log(`\n${passed} tests passed`);
