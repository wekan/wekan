'use strict';

// Unit test for #6478: the position-history undo/redo stack selection rules.
// pickUndo/pickRedo decide which change Ctrl+Z / Ctrl+Y act on; the server
// (server/models/userPositionHistory.js) applies the same rule via Mongo sort.
//
// Run: node tests/undoRedoSelection.test.cjs

const assert = require('assert');
const { pickUndo, pickRedo } = require('../models/lib/undoRedoSelection');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const t = n => new Date(2026, 0, 1, 0, 0, n); // increasing timestamps by second

test('pickUndo returns the most recent non-undone change', () => {
  const entries = [
    { _id: 'a', createdAt: t(1) },
    { _id: 'b', createdAt: t(3) },
    { _id: 'c', createdAt: t(2) },
  ];
  assert.strictEqual(pickUndo(entries)._id, 'b');
});

test('pickUndo skips already-undone changes and checkpoints', () => {
  const entries = [
    { _id: 'a', createdAt: t(1) },
    { _id: 'b', createdAt: t(4), undone: true },   // already undone
    { _id: 'chk', createdAt: t(5), isCheckpoint: true }, // checkpoint
    { _id: 'c', createdAt: t(2) },
  ];
  assert.strictEqual(pickUndo(entries)._id, 'c');
});

test('pickUndo returns null when everything is undone/empty', () => {
  assert.strictEqual(pickUndo([]), null);
  assert.strictEqual(pickUndo([{ _id: 'a', createdAt: t(1), undone: true }]), null);
});

test('pickRedo returns the MOST-RECENTLY-undone change (by undoneAt, not createdAt)', () => {
  // a was created first but undone LAST, so redo must re-apply a before b.
  const entries = [
    { _id: 'a', createdAt: t(1), undone: true, undoneAt: t(9) },
    { _id: 'b', createdAt: t(2), undone: true, undoneAt: t(8) },
  ];
  assert.strictEqual(pickRedo(entries)._id, 'a');
});

test('pickRedo ignores non-undone changes and returns null when none undone', () => {
  const entries = [
    { _id: 'a', createdAt: t(1) },
    { _id: 'b', createdAt: t(2) },
  ];
  assert.strictEqual(pickRedo(entries), null);
});

test('undo then redo of the same change is symmetric (LIFO)', () => {
  // Two moves recorded; undo picks the newer (b); after marking b undone, undo
  // picks a; redo then re-applies the most-recently-undone (a), then b.
  let entries = [
    { _id: 'a', createdAt: t(1) },
    { _id: 'b', createdAt: t(2) },
  ];
  assert.strictEqual(pickUndo(entries)._id, 'b');
  entries = entries.map(e => (e._id === 'b' ? { ...e, undone: true, undoneAt: t(5) } : e));
  assert.strictEqual(pickUndo(entries)._id, 'a');
  entries = entries.map(e => (e._id === 'a' ? { ...e, undone: true, undoneAt: t(6) } : e));
  assert.strictEqual(pickUndo(entries), null, 'nothing left to undo');
  assert.strictEqual(pickRedo(entries)._id, 'a', 'redo re-applies the most-recently-undone first');
});

console.log(`\nAll ${passed} undo/redo selection tests passed`);
