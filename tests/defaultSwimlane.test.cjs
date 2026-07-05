'use strict';

// Plain-Node unit test (no Meteor) for the default-swimlane self-heal helpers.
// Run: node tests/defaultSwimlane.test.cjs
//
// Regression guard for #6429 ("Lots of unsolicited swimlanes being created in
// some boards"): Board.getDefaultSwimline()/getDefaultSwimlineAsync() self-heal
// a missing default swimlane with a check-then-insert (read the board's
// swimlanes, insert one if none exist). That races — concurrent/repeated server
// calls for a swimlane-less board each saw zero swimlanes and each inserted a
// new one, so boards accumulated 30 000+ empty "Default" swimlanes. The fix
// upserts on a DETERMINISTIC _id (`<boardId>-default`); the _id unique index
// then caps auto-created default swimlanes at one per board.

const assert = require('assert');
const {
  defaultSwimlaneId,
  defaultSwimlaneFields,
} = require('../models/lib/defaultSwimlane');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const BOARD = 'dvz4P4ee5igqbaaLP';

// A tiny in-memory stand-in for the swimlanes collection that models the two
// insert strategies. `upsertById` models a Mongo upsert on _id (the _id unique
// index means a second upsert with the same _id is a no-op) — the fix.
// `insertRandom` models the old behaviour (each call inserts a fresh Random.id
// document) — the bug.
function makeStore() {
  const docs = new Map(); // _id -> doc
  let auto = 0;
  return {
    countForBoard: boardId =>
      [...docs.values()].filter(d => d.boardId === boardId).length,
    upsertById(id, fields) {
      if (!docs.has(id)) docs.set(id, { _id: id, ...fields });
      return docs.get(id);
    },
    insertRandom(fields) {
      const id = `rnd${auto++}`;
      docs.set(id, { _id: id, ...fields });
      return id;
    },
  };
}

// Worst-case interleaving: EVERY caller runs its "are there any swimlanes?"
// check before ANY caller inserts, so all N see an empty board (exactly the
// server race in #6429). Then each caller that saw empty performs `insertFn`.
function runRace(store, boardId, n, insertFn) {
  const sawEmpty = [];
  for (let i = 0; i < n; i += 1) sawEmpty.push(store.countForBoard(boardId) === 0);
  for (let i = 0; i < n; i += 1) if (sawEmpty[i]) insertFn();
}

// --- defaultSwimlaneId ------------------------------------------------------
test('defaultSwimlaneId is deterministic and formatted <boardId>-default', () => {
  assert.strictEqual(defaultSwimlaneId(BOARD), `${BOARD}-default`);
  assert.strictEqual(defaultSwimlaneId(BOARD), defaultSwimlaneId(BOARD));
});

test('defaultSwimlaneId differs per board', () => {
  assert.notStrictEqual(defaultSwimlaneId('boardA'), defaultSwimlaneId('boardB'));
});

test('defaultSwimlaneId cannot collide with a Random.id() (contains "-default")', () => {
  // Random.id() is 17 URL-safe chars with no hyphen; our id always has one.
  assert.ok(defaultSwimlaneId(BOARD).includes('-default'));
});

// --- defaultSwimlaneFields --------------------------------------------------
test('defaultSwimlaneFields sets archived:false and type:"swimlane" explicitly', () => {
  // These must be present because their schema autoValue/defaultValue fire only
  // on insert, not on the upsert path — otherwise the upsert fails validation.
  const f = defaultSwimlaneFields(BOARD, 'Default');
  assert.strictEqual(f.archived, false);
  assert.strictEqual(f.type, 'swimlane');
  assert.strictEqual(f.boardId, BOARD);
  assert.strictEqual(f.sort, 0);
  assert.strictEqual(f.title, 'Default');
});

test('defaultSwimlaneFields falls back to "Default" for a non-string/empty title', () => {
  // i18n can return an object ('default (en)' warning) or nothing during migration.
  assert.strictEqual(defaultSwimlaneFields(BOARD, {}).title, 'Default');
  assert.strictEqual(defaultSwimlaneFields(BOARD, '').title, 'Default');
  assert.strictEqual(defaultSwimlaneFields(BOARD, undefined).title, 'Default');
  assert.strictEqual(defaultSwimlaneFields(BOARD, 'Par défaut').title, 'Par défaut');
});

// --- POSITIVE: the fix is idempotent under the race -------------------------
test('POSITIVE: N racing self-heals upserting the deterministic _id create exactly ONE swimlane', () => {
  const store = makeStore();
  runRace(store, BOARD, 1000, () =>
    store.upsertById(defaultSwimlaneId(BOARD), defaultSwimlaneFields(BOARD, 'Default')),
  );
  assert.strictEqual(store.countForBoard(BOARD), 1);
});

test('POSITIVE: once a default swimlane exists, later self-heals add nothing', () => {
  const store = makeStore();
  store.upsertById(defaultSwimlaneId(BOARD), defaultSwimlaneFields(BOARD, 'Default'));
  for (let i = 0; i < 50; i += 1) {
    store.upsertById(defaultSwimlaneId(BOARD), defaultSwimlaneFields(BOARD, 'Default'));
  }
  assert.strictEqual(store.countForBoard(BOARD), 1);
});

// --- NEGATIVE: the old check-then-insert reproduces #6429 -------------------
test('NEGATIVE: the old Random-id check-then-insert creates one swimlane PER racing call (#6429)', () => {
  const store = makeStore();
  runRace(store, BOARD, 1000, () =>
    store.insertRandom(defaultSwimlaneFields(BOARD, 'Default')),
  );
  // The bug: 1000 racing self-heals => 1000 empty "Default" swimlanes.
  assert.strictEqual(store.countForBoard(BOARD), 1000);
});

test('NEGATIVE: deterministic-id upsert and old random-insert diverge under the same race', () => {
  const fixed = makeStore();
  const buggy = makeStore();
  runRace(fixed, BOARD, 500, () =>
    fixed.upsertById(defaultSwimlaneId(BOARD), defaultSwimlaneFields(BOARD, 'Default')),
  );
  runRace(buggy, BOARD, 500, () => buggy.insertRandom(defaultSwimlaneFields(BOARD, 'Default')));
  assert.strictEqual(fixed.countForBoard(BOARD), 1);
  assert.strictEqual(buggy.countForBoard(BOARD), 500);
  assert.notStrictEqual(fixed.countForBoard(BOARD), buggy.countForBoard(BOARD));
});

console.log(`\n${passed} passing`);
