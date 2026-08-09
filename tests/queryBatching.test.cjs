'use strict';

// Three round-trip counts that were linear in the input, and are not any more.
//
// None of these was a wrong answer - they were the right answer asked one
// document at a time. A query per item is invisible on a developer's board with
// four cards and is the whole cost of the request on a real one, because each
// await is a full round-trip that starts only when the last one finished.
//
// Run: node tests/queryBatching.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const cards = read('server/models/cards.js');
const search = read('server/publications/cards.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// ───────────────────────────── the bulk label endpoint (up to 500 cards) ─────

const bulkLabels = cards.match(
  /\/\/ ONE read for every card, not one per card\.[\s\S]*?await Promise\.all\(writes\);/,
);

test('the bulk label endpoint reads every card in ONE query', () => {
  assert.ok(bulkLabels, 'the batched block is there');
  assert.ok(
    /getCards\(\s*\{ _id: \{ \$in: cardIds \}, boardId: paramBoardId, archived: false \}/.test(bulkLabels[0]),
    'one $in read for the whole batch',
  );
  assert.ok(/new Map\(\(cards \|\| \[\]\)\.map\(card => \[card\._id, card\]\)\)/.test(bulkLabels[0]),
    'and the result is indexed, not searched per id');
});

test('negative: no per-card read remains in that handler', () => {
  assert.ok(!/for \(const cardId of cardIds\) \{[\s\S]{0,200}?await ReactiveCache\.getCard\(/.test(bulkLabels[0]),
    'a getCard inside the loop is the thing this replaced');
});

test('the writes are issued together, not one waiting for the last', () => {
  // They genuinely differ per card - each merges its own labelIds - so they
  // stay individual updates. What changed is that they no longer serialize.
  assert.ok(/writes\.push\(\s*Cards\.direct\.updateAsync\(/.test(bulkLabels[0]));
  assert.ok(/await Promise\.all\(writes\);/.test(bulkLabels[0]),
    'and every one must land before the 200 says they did');
});

test('the response still preserves the caller\'s order and reports misses', () => {
  // The loop iterates cardIds, NOT the query result: a batch read comes back in
  // the database's order and without the ids that matched nothing, so iterating
  // it would silently reorder `updated` and lose `notFound`.
  assert.ok(/for \(const cardId of cardIds\) \{/.test(bulkLabels[0]));
  assert.ok(/const card = cardById\.get\(cardId\);/.test(bulkLabels[0]));
  assert.ok(/if \(!card\) \{\s*\n\s*notFound\.push\(cardId\);/.test(bulkLabels[0]));
});

test('the cap that bounds the batch is still there', () => {
  assert.ok(/const BULK_CARDS_MAX = \d+;/.test(cards));
  const max = Number(cards.match(/const BULK_CARDS_MAX = (\d+);/)[1]);
  assert.ok(max > 0 && max <= 1000, `the cap is ${max}`);
});

test('negative: the bulk DELETE is deliberately NOT batched', () => {
  // Its per-card work is real - cardRemover runs the sub-item hooks and each
  // card gets its own activity - so batching the reads would save one query in
  // a loop that does far more than query. Left alone on purpose.
  const del = cards.match(/const deleted = \[\];[\s\S]*?for \(const cardId of cardIds\) \{[\s\S]*?await cardRemover\(/);
  assert.ok(del, 'the delete handler still reads per card, and that is fine');
});

// ─────────────────────────────── global search: one lookup for every name ────

const batchBlock = search.match(
  /\/\/ Resolve every username the query names in ONE lookup\.[\s\S]*?const resolvePredicates = key => \{[\s\S]*?\n    \};/,
);

test('global search resolves every named username in ONE query', () => {
  assert.ok(batchBlock, 'the batched block is there');
  assert.ok(/getUsers\(\s*\{ username: \{ \$in: \[\.\.\.namedUsernames\] \} \}/.test(batchBlock[0]),
    'one $in over every name the query mentions');
  assert.ok(/fields: \{ _id: 1, username: 1 \}/.test(batchBlock[0]),
    'and only the two fields it needs');
});

test('the names are collected across all four operators before asking', () => {
  assert.ok(/for \(const key of \[OPERATOR_USER, OPERATOR_MEMBER, OPERATOR_ASSIGNEE, OPERATOR_CREATOR\]\)/
    .test(batchBlock[0]));
  assert.ok(/new Set\(\)/.test(batchBlock[0]),
    'a name typed under two operators is one lookup, not two');
});

test('negative: no per-username query remains', () => {
  assert.ok(!/for \(const username of queryParams\.getPredicates\([^)]*\)\) \{\s*\n\s*const user = await ReactiveCache\.getUser\(/.test(search),
    'an awaited getUser per predicate is the thing this replaced');
});

test('an unknown name is still reported against the operator it was typed under', () => {
  // This is what makes it worth keeping a per-operator step at all: "ann is not
  // a user" is not useful if it does not say WHERE ann was typed.
  assert.ok(/errors\.addNotFound\(key, username\)/.test(batchBlock[0]));
  assert.ok(/resolvePredicates\(OPERATOR_USER\)/.test(search));
  ['OPERATOR_MEMBER', 'OPERATOR_ASSIGNEE', 'OPERATOR_CREATOR'].forEach(op => {
    assert.ok(new RegExp(`\\[${'OPERATOR_MEMBER, OPERATOR_ASSIGNEE, OPERATOR_CREATOR'}\\]`).test(search),
      `${op} still goes through the same resolver`);
  });
});

test('the selectors built from the resolved ids are unchanged', () => {
  // user: matches members OR assignees; the other three are their own field.
  assert.ok(/\$or: \[\{ members: \{ \$in: users \} \}, \{ assignees: \{ \$in: users \} \}\]/.test(search));
  assert.ok(/selector\[key\] = \{ \$in: users \};/.test(search));
});

// ─────────────────────────────────── FerretDB: the $or that never pushed down ─

test('FerretDB pushes a top-level $or down when every branch can be', () => {
  const go = path.join(repoRoot, '.tools/FerretDB/internal/backends/sqlite/query.go');
  if (!fs.existsSync(go)) {
    console.log('  -- .tools/FerretDB not cloned; skipping the Go side');
    return;
  }
  const src = fs.readFileSync(go, 'utf8');
  assert.ok(/func pushdownOrCondition/.test(src));
  assert.ok(/if k == "\$or" \{/.test(src), 'the top-level $or is no longer skipped outright');
  // ALL OR NOTHING: an OR that drops a branch removes rows the Go filter never
  // sees, which is the opposite of every other pushdown's superset contract.
  assert.ok(/if !condOK \{\s*\n\s*return "", nil, false\s*\n\s*\}/.test(src),
    'one unpushable branch must refuse the whole $or');
  assert.ok(/\$and, another \$or/.test(src) || /nested operator inside a branch/.test(src),
    'a nested operator branch is refused, not silently dropped');
});

test('negative: the other top-level operators still stay in Go', () => {
  const go = path.join(repoRoot, '.tools/FerretDB/internal/backends/sqlite/query.go');
  if (!fs.existsSync(go)) return;
  const src = fs.readFileSync(go, 'utf8');
  const block = src.match(/if strings\.HasPrefix\(k, "\$"\) \{[\s\S]*?continue\n\t\t\}/)[0];
  assert.ok(/k == "\$or"/.test(block), 'only $or learned this');
  assert.ok(!/\$and|\$nor|\$not/.test(block), 'nothing else was quietly included');
  assert.ok(/continue/.test(block), 'and everything else still falls through to the Go filter');
});

console.log(`\n${passed} tests passed`);
