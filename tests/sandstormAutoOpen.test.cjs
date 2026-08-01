'use strict';

// Tests for the Sandstorm "open one board on start" decision
// (models/lib/sandstormAutoOpen.js): saved-default wins, single-board opens+saves,
// zero/many stays, and everything waits until inputs are ready. Includes negatives.
//
// Run: node tests/sandstormAutoOpen.test.cjs

const assert = require('assert');
const { decideSandstormAutoOpen } = require('../models/lib/sandstormAutoOpen.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('waits until the grain login (userId) has landed', () => {
  assert.deepStrictEqual(
    decideSandstormAutoOpen({ userReady: false, boardsReady: true, boardCount: 1, onlyBoardId: 'a' }),
    { action: 'wait' },
  );
});

test('a saved Home board always wins', () => {
  assert.deepStrictEqual(
    decideSandstormAutoOpen({ userReady: true, savedDefaultId: 'saved1', boardsReady: false }),
    { action: 'redirect', boardId: 'saved1' },
  );
  // even when there are many boards, the saved choice still wins
  assert.deepStrictEqual(
    decideSandstormAutoOpen({ userReady: true, savedDefaultId: 'saved1', boardsReady: true, boardCount: 5 }),
    { action: 'redirect', boardId: 'saved1' },
  );
});

test('waits for the boards subscription before counting', () => {
  assert.deepStrictEqual(
    decideSandstormAutoOpen({ userReady: true, savedDefaultId: null, boardsReady: false, boardCount: 0 }),
    { action: 'wait' },
  );
});

test('exactly one board -> just open it (NOT saved)', () => {
  assert.deepStrictEqual(
    decideSandstormAutoOpen({ userReady: true, savedDefaultId: null, boardsReady: true, boardCount: 1, onlyBoardId: 'only1' }),
    { action: 'redirect', boardId: 'only1' },
  );
});

test('many boards + no saved default -> stay on All Boards', () => {
  assert.deepStrictEqual(
    decideSandstormAutoOpen({ userReady: true, savedDefaultId: null, boardsReady: true, boardCount: 3 }),
    { action: 'stay' },
  );
});

test('zero boards + no saved default -> stay on All Boards (negative: no redirect)', () => {
  assert.deepStrictEqual(
    decideSandstormAutoOpen({ userReady: true, savedDefaultId: null, boardsReady: true, boardCount: 0 }),
    { action: 'stay' },
  );
});

test('single count but missing id -> stay (never redirect to undefined)', () => {
  assert.deepStrictEqual(
    decideSandstormAutoOpen({ userReady: true, savedDefaultId: null, boardsReady: true, boardCount: 1, onlyBoardId: undefined }),
    { action: 'stay' },
  );
});

// --- source guards: the feature is wired end-to-end ---
const fs = require('fs');
const path = require('path');
const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

test('router runs the Sandstorm auto-open reactively and only for Sandstorm', () => {
  const r = read('config/router.js');
  assert.ok(/decideSandstormAutoOpen/.test(r), 'uses the pure decision');
  assert.ok(/if \(isSandstorm\)\s*{\s*\n\s*startSandstormAutoOpen\(\)/.test(r), 'gated to Sandstorm');
  assert.ok(/Meteor\.subscribe\('boards'\)/.test(r) && /boardsHandle\.ready\(\)/.test(r), 'waits for boards ready');
  assert.ok(/Tracker\.autorun/.test(r), 'reactive (waits out async grain login)');
  // NEGATIVE guard: auto-open must NOT persist anything (no setDefaultBoard call).
  assert.ok(!/setDefaultBoard/.test(r), 'does not save the single board');
});

test('auto-open persists nothing: nothing on that path saves a Home board', () => {
  // This used to read "the name `setDefaultBoard` appears nowhere", which was a
  // proxy for "there is no unconditional setter" back when the only way to set
  // a Home board was the explicit toggle. There IS one now - dropping a board
  // on the Home row replaces whatever was there (docs/Features/Board/Home.md) -
  // so the guard checks what it was actually protecting: the auto-open path
  // does not save anything. A grain that opens its one board must not thereby
  // decide which board that user starts in.
  assert.ok(!/setDefaultBoard/.test(read('models/lib/sandstormAutoOpen.js')),
    'the decision does not save');
  const users = read('server/models/users.js');
  const at = users.indexOf('async setDefaultBoard(boardId) {');
  assert.notStrictEqual(at, -1, 'the setter is a Meteor method');
  const fn = users.slice(at, users.indexOf('\n  },', at));
  // It is reachable only by being CALLED as a method - by a user, about a board
  // they are a member of - which is what keeps it off every automatic path.
  assert.ok(/check\(boardId, String\)/.test(fn), 'it checks its argument');
  assert.ok(/'members\.userId': this\.userId/.test(fn),
    'and only accepts a board the caller can actually open');
});

console.log(`\nAll ${passed} sandstorm-auto-open tests passed`);
