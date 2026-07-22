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
  pickDefaultSwimlane,
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

// --- #1971: pickDefaultSwimlane skips ARCHIVED swimlanes --------------------
// Bug: adding a card in List view assigned it to the first swimlane even when
// that swimlane was archived, so the card was invisible in Swimlane view.
const sl = (id, archived) => ({ _id: id, boardId: BOARD, archived: !!archived });

test('#1971: the reported case — default archived, active swimlanes exist -> first ACTIVE one', () => {
  // Default swimlane "Project" archived; "Project2"/"Project3" active.
  const swimlanes = [sl('project', true), sl('project2', false), sl('project3', false)];
  assert.strictEqual(pickDefaultSwimlane(swimlanes)._id, 'project2',
    'must skip the archived swimlane and pick the first active one');
});

test('#1971: an active first swimlane is returned unchanged (no behaviour change)', () => {
  const swimlanes = [sl('default', false), sl('other', false)];
  assert.strictEqual(pickDefaultSwimlane(swimlanes)._id, 'default');
});

test('#1971: a swimlane with no archived field counts as active', () => {
  assert.strictEqual(pickDefaultSwimlane([{ _id: 'a', boardId: BOARD }])._id, 'a');
});

test('#1971: when EVERY swimlane is archived, fall back to the first (never null/crash)', () => {
  // Callers read `._id`, so returning undefined here would crash; the server
  // self-heals a fresh default only when there are NO swimlanes at all.
  const swimlanes = [sl('a', true), sl('b', true)];
  assert.strictEqual(pickDefaultSwimlane(swimlanes)._id, 'a');
});

test('#1971 negative: no swimlanes at all -> undefined (server then self-heals a default)', () => {
  assert.strictEqual(pickDefaultSwimlane([]), undefined);
  assert.strictEqual(pickDefaultSwimlane(null), undefined);
  assert.strictEqual(pickDefaultSwimlane(undefined), undefined);
});

test('#1971 negative: skips null/undefined entries when choosing the active swimlane', () => {
  const swimlanes = [null, sl('archived', true), undefined, sl('live', false)];
  assert.strictEqual(pickDefaultSwimlane(swimlanes)._id, 'live');
});

// --- #1959: same root cause as #1971 (card invisible when its swimlane is
// deleted). New cards AND the List-view card drop resolve the target swimlane
// through getDefaultSwimline (now non-archived), and pre-existing orphaned cards
// surface in the first swimlane via #6443's orphanedCardsSwimlaneIds. -----------
test('#1959 wiring: List-view card drop resolves the swimlane via getDefaultSwimline', () => {
  const fs = require('fs');
  const path = require('path');
  const list = fs.readFileSync(
    path.join(__dirname, '..', 'client', 'components', 'lists', 'list.js'), 'utf8');
  assert.ok(/getDefaultSwimline\(\)\._id/.test(list),
    'the card-drop handler must resolve the default swimlane (now archived-skipping)');
  // #6443 orphaned-card surfacing that keeps already-orphaned cards visible.
  const lists = fs.readFileSync(path.join(__dirname, '..', 'models', 'lists.js'), 'utf8');
  assert.ok(/orphanedCardsSwimlaneIds\(swimlaneId\)/.test(lists),
    'orphaned cards (deleted swimlaneId) must still surface in the first swimlane');
});

// --- source guard: getDefaultSwimline routes through pickDefaultSwimlane -----
test('#1971 source guard: boards.js getDefaultSwimline uses pickDefaultSwimlane', () => {
  const fs = require('fs');
  const path = require('path');
  const src = fs.readFileSync(path.join(__dirname, '..', 'models', 'boards.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const uses = (src.match(/pickDefaultSwimlane\(/g) || []).length;
  assert.ok(uses >= 2, 'both getDefaultSwimline and getDefaultSwimlineAsync must use it');
  assert.ok(!/getSwimlane\(\{ boardId: this\._id \}\)/.test(src),
    'the unfiltered single-swimlane fetch (could return an archived one) must be gone');
});

console.log(`\n${passed} passing`);
