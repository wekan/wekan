'use strict';

// Plain-Node unit test (no Meteor) for the subtask ancestor-chain walk used by
// the `board` publication's "Parent cards (for subtasks)" child.
// Run: ELECTRON_RUN_AS_NODE=1 <node> tests/subtaskAncestors.test.cjs
//
// Regression guard for #3453 ("Full path display of subtasks cards disappears
// after a refresh of the subtask board"). The 'prefix-with-full-path' subtask
// setting renders parentString(' > ') — the subtask's WHOLE ancestor chain —
// client-side from minimongo. A cross-board subtask's ancestors live on the
// parent board, so after F5 they only exist on the client if the subtask
// board's publication ships them. Publishing only the DIRECT parents (the old
// behaviour) truncated the path to one level; collectAncestorIds() must walk
// every level, terminate on cyclic/corrupt data (#3328), and never lose ids.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { collectAncestorIds } = require('../server/lib/subtaskAncestors');

let passed = 0;
const tests = [];
function test(name, fn) {
  tests.push([name, fn]);
}

// A fetchParents stub over a card "database": id -> parentId (undefined = top
// level, id absent from the map = deleted card). Records each batch queried.
function makeFetch(cardsById, calls) {
  return async ids => {
    if (calls) calls.push([...ids]);
    return ids
      .filter(id => Object.prototype.hasOwnProperty.call(cardsById, id))
      .map(id => ({ _id: id, parentId: cardsById[id] }));
  };
}

// --- POSITIVE: the full path is collected ------------------------------------

test('single-level chain: the direct parent is published', async () => {
  // subtask (on Board2) -> parent P1 (on Board1): the original #3453 repro.
  const fetch = makeFetch({ P1: undefined });
  const ids = await collectAncestorIds(['P1'], fetch);
  assert.deepStrictEqual(ids.sort(), ['P1']);
});

test('#3453 full path: EVERY ancestor level is collected, not just the direct parent', async () => {
  // sub -> P1 -> P2 -> P3 (P1..P3 on another board). 'prefix-with-full-path'
  // renders "P3 > P2 > P1", so all three docs must be published.
  const fetch = makeFetch({ P1: 'P2', P2: 'P3', P3: undefined });
  const ids = await collectAncestorIds(['P1'], fetch);
  assert.deepStrictEqual(ids.sort(), ['P1', 'P2', 'P3']);
});

test('multiple subtasks: chains are merged and shared ancestors appear once', async () => {
  const fetch = makeFetch({ P1: 'ROOT', P2: 'ROOT', ROOT: undefined });
  const ids = await collectAncestorIds(['P1', 'P2', 'P1'], fetch);
  assert.deepStrictEqual(ids.sort(), ['P1', 'P2', 'ROOT']);
});

test('walks one batched query per ancestor level (no per-card queries)', async () => {
  const calls = [];
  const fetch = makeFetch({ A1: 'B1', A2: 'B2', B1: 'C1', B2: 'C1', C1: undefined }, calls);
  const ids = await collectAncestorIds(['A1', 'A2'], fetch);
  assert.deepStrictEqual(ids.sort(), ['A1', 'A2', 'B1', 'B2', 'C1']);
  // Level 1: [A1, A2]; level 2: [B1, B2]; level 3: [C1]. C1 is top level, so
  // the walk stops after 3 queries.
  assert.deepStrictEqual(calls, [['A1', 'A2'], ['B1', 'B2'], ['C1']]);
});

// --- NEGATIVE / robustness ----------------------------------------------------

test('no parents at all: returns [] and never queries', async () => {
  const calls = [];
  const fetch = makeFetch({}, calls);
  assert.deepStrictEqual(await collectAncestorIds([], fetch), []);
  assert.deepStrictEqual(await collectAncestorIds(undefined, fetch), []);
  assert.deepStrictEqual(await collectAncestorIds(null, fetch), []);
  assert.strictEqual(calls.length, 0);
});

test('falsy parent ids are ignored', async () => {
  const calls = [];
  const fetch = makeFetch({ P1: undefined }, calls);
  const ids = await collectAncestorIds([null, '', undefined, 'P1', 0], fetch);
  assert.deepStrictEqual(ids.sort(), ['P1']);
  assert.deepStrictEqual(calls, [['P1']]);
});

test('deleted ancestor: walk stops at the gap and still terminates', async () => {
  // P1's parent GONE was deleted: its id is still returned (matches nothing
  // when published — harmless) and the walk must not loop or throw.
  const fetch = makeFetch({ P1: 'GONE' });
  const ids = await collectAncestorIds(['P1'], fetch);
  assert.deepStrictEqual(ids.sort(), ['GONE', 'P1']);
});

test('#3328 cyclic chain terminates and yields each ancestor exactly once', async () => {
  // Corrupt/legacy data: P1 -> P2 -> P1. Without the seen-set this loops
  // forever inside the publication.
  const fetch = makeFetch({ P1: 'P2', P2: 'P1' });
  const ids = await collectAncestorIds(['P1'], fetch);
  assert.deepStrictEqual(ids.sort(), ['P1', 'P2']);
});

test('self-parent card terminates', async () => {
  const calls = [];
  const fetch = makeFetch({ P1: 'P1' }, calls);
  const ids = await collectAncestorIds(['P1'], fetch);
  assert.deepStrictEqual(ids, ['P1']);
  assert.deepStrictEqual(calls, [['P1']]);
});

test('fetch returning null/undefined is treated as "no parents found"', async () => {
  const ids = await collectAncestorIds(['P1'], async () => null);
  assert.deepStrictEqual(ids, ['P1']);
  const ids2 = await collectAncestorIds(['P1'], async () => undefined);
  assert.deepStrictEqual(ids2, ['P1']);
});

// --- wiring: the `board` publication actually uses the full-chain walk --------

test('board publication publishes the FULL ancestor chain (uses collectAncestorIds)', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'server', 'publications', 'boards.js'),
    'utf8',
  );
  assert.ok(
    /require\(['"]\/server\/lib\/subtaskAncestors['"]\)|from ['"]\/server\/lib\/subtaskAncestors['"]/.test(src),
    'boards.js must import collectAncestorIds from /server/lib/subtaskAncestors',
  );
  // The "Parent cards (for subtasks)" child must publish the walked ancestor
  // set, not the one-level parentIds snapshot (the #3453 truncation).
  const parentChild = src.slice(src.indexOf('// Parent cards (for subtasks)'));
  assert.ok(
    parentChild.includes('collectAncestorIds('),
    'the parent-cards child must walk the full ancestor chain',
  );
  assert.ok(
    /getCards\(\s*\{\s*_id:\s*\{\s*\$in:\s*ancestorIds\s*\}\s*\}/.test(parentChild),
    'the parent-cards child must publish the collected ancestor ids',
  );
});

// --- runner --------------------------------------------------------------------

(async () => {
  for (const [name, fn] of tests) {
    await fn();
    passed += 1;
    console.log('  ok -', name);
  }
  console.log(`\nsubtaskAncestors: ${passed} tests passed`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
