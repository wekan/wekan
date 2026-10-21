'use strict';

// #6793: "Comments shows only on originating board." Moving a card to another
// board left its comments behind; moving it back brought them back.
//
// The board publication (server/publications/boards.js) publishes a board's
// comments, comment reactions, text notes, checklists, checklist items and
// attachments as ONE cursor per collection filtered by the copy of the board id
// each of those rows carries (#6480). The Cards.after.update hook re-homed only
// checklists and checklist items when a card changed board, and Card.move()
// re-pointed attachments only inside `if (Meteor.isServer)` - which a drag in the
// browser never reaches. Comments, reactions and text notes kept the old board
// id, so they were published to the board the card had LEFT.
//
// Now one list (models/lib/cardChildrenBoard.js) names every such collection,
// one helper (server/lib/cardChildrenBoardSync.js) re-homes them, the move hook
// and the durable rule move both call it, and a startup step repairs rows a
// move already stranded. This suite pins:
//   - the planner (positive and negative),
//   - that EVERY card-child collection the board publication finds by board id
//     is on the list - so a future one cannot be published that way and forgotten,
//   - that every path is wired through the helper and nothing re-homes children
//     on its own, and no Cards write moves a card past the hook,
//   - the repair step, behaviourally, against an in-memory Db.
//
// Run: node tests/cardChildrenFollowMove.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const {
  CARD_CHILD_COLLECTIONS,
  cardChildBoardWrites,
  staleChildBoardId,
} = require('../models/lib/cardChildrenBoard');
const { steps } = require('../server/lib/schemaUpgradeSteps');

let passed = 0;
const pending = [];
function test(name, fn) {
  pending.push(async () => {
    await fn();
    passed += 1;
    console.log('  ok -', name);
  });
}

const models = writes => writes.map(w => w.model).sort();

// ── the planner ──────────────────────────────────────────────────────────────

test('a move to another board re-homes comments, reactions, notes, checklists, items and attachments', () => {
  const writes = cardChildBoardWrites('c1',
    { boardId: 'B2', listId: 'L2', swimlaneId: 'S2' },
    { boardId: 'B1', listId: 'L1', swimlaneId: 'S1' });
  assert.deepStrictEqual(models(writes), [
    'Attachments', 'CardCommentReactions', 'CardComments', 'CardTextNotes', 'ChecklistItems', 'Checklists',
  ]);
  const comments = writes.find(w => w.model === 'CardComments');
  assert.deepStrictEqual(comments.selector, { cardId: 'c1', boardId: { $ne: 'B2' } },
    'only rows that do not already agree are written - idempotent');
  assert.deepStrictEqual(comments.modifier, { $set: { boardId: 'B2' } });
  const attachments = writes.find(w => w.model === 'Attachments');
  assert.deepStrictEqual(attachments.selector, { 'meta.cardId': 'c1' });
  assert.deepStrictEqual(attachments.modifier,
    { $set: { 'meta.boardId': 'B2', 'meta.listId': 'L2', 'meta.swimlaneId': 'S2' } });
});

test('without a known previous place the move still re-homes everything (the hook may lack it)', () => {
  const writes = cardChildBoardWrites('c1', { boardId: 'B2', listId: 'L2', swimlaneId: 'S2' }, undefined);
  assert.strictEqual(writes.length, CARD_CHILD_COLLECTIONS.length);
});

test('negative: a card that did not move writes nothing', () => {
  const place = { boardId: 'B1', listId: 'L1', swimlaneId: 'S1' };
  assert.deepStrictEqual(cardChildBoardWrites('c1', place, { ...place }), []);
});

test('negative: a move inside the board touches only the attachments\' list meta (#6430)', () => {
  const writes = cardChildBoardWrites('c1',
    { boardId: 'B1', listId: 'L2', swimlaneId: 'S1' },
    { boardId: 'B1', listId: 'L1', swimlaneId: 'S1' });
  assert.deepStrictEqual(writes, [{
    model: 'Attachments', selector: { 'meta.cardId': 'c1' }, modifier: { $set: { 'meta.listId': 'L2' } },
  }], 'comments and checklists already carry the right board id; no multi-update for them');
});

test('negative: no card id, no writes', () => {
  assert.deepStrictEqual(cardChildBoardWrites('', { boardId: 'B2' }, {}), []);
  assert.deepStrictEqual(cardChildBoardWrites(undefined, { boardId: 'B2' }, {}), []);
  assert.deepStrictEqual(cardChildBoardWrites('c1', null, {}), []);
});

test('staleChildBoardId: the card\'s board when the row disagrees, null otherwise', () => {
  const comments = CARD_CHILD_COLLECTIONS.find(c => c.model === 'CardComments');
  const attachments = CARD_CHILD_COLLECTIONS.find(c => c.model === 'Attachments');
  assert.strictEqual(staleChildBoardId({ boardId: 'B1' }, 'B2', comments), 'B2');
  assert.strictEqual(staleChildBoardId({}, 'B2', comments), 'B2', 'a missing board id is stale too');
  assert.strictEqual(staleChildBoardId({ boardId: 'B2' }, 'B2', comments), null);
  assert.strictEqual(staleChildBoardId({ boardId: 'B1' }, undefined, comments), null,
    'a card that is gone cannot tell');
  assert.strictEqual(staleChildBoardId({ meta: { boardId: 'B1' } }, 'B2', attachments), 'B2');
  assert.strictEqual(staleChildBoardId({ meta: { boardId: 'B2' } }, 'B2', attachments), null);
});

// ── the list is complete ─────────────────────────────────────────────────────

const MODEL_FILE = name => `models/${name[0].toLowerCase()}${name.slice(1)}.js`;

test('every card-child collection the board publication finds by board id is on the list', () => {
  const pub = read('server/publications/boards.js');
  const published = new Set();
  for (const m of pub.matchAll(/ReactiveCache\.get(\w+)\(\s*\{\s*(?:boardId|'meta\.boardId')\s*:/g)) {
    published.add(m[1]);
  }
  assert.ok(published.has('CardComments'), 'the comments cursor is found by board id (the reason for #6793)');
  const listed = new Set(CARD_CHILD_COLLECTIONS.map(c => c.model));
  const missing = [];
  for (const name of published) {
    if (name === 'Cards') continue; // the card itself moves; it is not its own child
    const file = path.join(ROOT, MODEL_FILE(name));
    if (!fs.existsSync(file)) continue;
    const src = fs.readFileSync(file, 'utf8');
    // A collection whose rows belong to a card carries the card's id.
    const belongsToCard = /\n\s+cardId:\s*\{/.test(src) || /meta\.cardId/.test(src);
    if (belongsToCard && !listed.has(name)) missing.push(name);
  }
  assert.deepStrictEqual(missing, [],
    'published by board id and belonging to a card, but not re-homed when the card moves: ' + missing.join(', '));
});

test('negative: every listed collection really exists under that Mongo name', () => {
  for (const child of CARD_CHILD_COLLECTIONS) {
    const src = read(MODEL_FILE(child.model));
    assert.ok(src.includes(`'${child.name}'`), `${child.model} is stored as '${child.name}'`);
  }
});

// ── every path is wired, and nothing goes around it ──────────────────────────

test('the Cards.after.update hook re-homes the children on a board, list or swimlane change', () => {
  const server = read('server/models/cards.js');
  assert.ok(/import \{ syncCardChildrenBoard \} from '\/server\/lib\/cardChildrenBoardSync'/.test(server));
  const hook = server.match(/Cards\.after\.update\(async function\(userId, doc, fieldNames\) \{\n\s+if \(!fieldNames\.some\(field => field === 'boardId'[^\n]*\n\s+await syncCardChildrenBoard\(doc\._id, doc, this\.previous \|\| \{\}\);/);
  assert.ok(hook, 'one after.update hook, on every move path that writes through the collection');
});

test('the helper writes through each collection with .direct, so a moved comment logs no "edited" activity', () => {
  const sync = read('server/lib/cardChildrenBoardSync.js');
  assert.ok(sync.includes('cardChildBoardWrites(cardId, place, previous)'));
  assert.ok(sync.includes('collection.direct || collection'));
  for (const child of CARD_CHILD_COLLECTIONS) {
    assert.ok(new RegExp(`\\b${child.model}\\b`).test(sync), `${child.model} has a collection in the helper`);
  }
});

test('the durable rule move (which defers the hooks\' bookkeeping) re-homes through the same helper', () => {
  const plans = read('server/notifications/storedRulePlans.js');
  const fn = plans.match(/async function applyRuleMoveBoard\([\s\S]*?\n\}/)[0];
  assert.ok(fn.includes('await syncCardChildrenBoard(command.cardId, place, command.before.place);'));
});

test('negative: Card.move() no longer re-points attachments only on the server', () => {
  const model = read('models/cards.js');
  const move = model.match(/async move\(boardId, swimlaneId, listId, sort = null, moveReason\) \{[\s\S]*?\n  \},\n/)[0];
  assert.ok(!/Meteor\.isServer[\s\S]*meta\.boardId/.test(move),
    'a browser drag never reaches a Meteor.isServer branch; the hook does this for every path');
  assert.ok(!/Attachments\.collection\.updateAsync/.test(move));
});

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'tests' || entry.name.startsWith('.')) continue;
      walk(rel, out);
    } else if (entry.name.endsWith('.js')) out.push(rel);
  }
  return out;
}
const SOURCES = ['models', 'server', 'client', 'imports'].flatMap(dir => walk(dir));

test('negative: nothing outside the helper re-homes a card\'s children by hand', () => {
  const names = CARD_CHILD_COLLECTIONS.map(c => c.model).join('|');
  const adHoc = new RegExp(`\\b(?:${names})(?:\\.collection)?(?:\\.direct)?\\.(?:updateAsync|rawCollection\\(\\)\\.updateMany)\\(\\s*\\{\\s*'?(?:meta\\.)?cardId'?\\s*:[^}]*\\}\\s*,\\s*\\{\\s*\\$set:\\s*\\{\\s*'?(?:meta\\.)?boardId`);
  const offenders = SOURCES.filter(file => file !== path.join('server', 'lib', 'cardChildrenBoardSync.js')
    && adHoc.test(read(file)));
  assert.deepStrictEqual(offenders, [],
    'a hand-written re-home covers whichever collections its author remembered - that is #6793');
});

// A Cards write that skips the hooks (.direct, the raw driver) and changes the
// card's boardId must re-home the children itself. The REST card move was one
// (PUT /api/boards/:boardId/lists/:listId/cards/:cardId with newBoardId), and
// this guard is what found it.
function hooklessBoardMoves(src) {
  const bypass = /(?:Cards\.direct\.updateAsync|Cards\.rawCollection\(\)\.update(?:One|Many)|collection\('cards'\)\.update(?:One|Many))\(/g;
  const found = [];
  for (const m of src.matchAll(bypass)) {
    const call = src.slice(m.index, m.index + 600).split(/\);\n/)[0];
    const set = call.match(/\$set:\s*\{([^}]*)\}/);
    if (set && /(^|[\s,{])boardId\s*[:,]/.test(set[1])) {
      found.push({ call, after: src.slice(m.index + call.length, m.index + call.length + 1200) });
    }
  }
  return found;
}

test('negative: every hook-less Cards write that changes boardId re-homes the children itself', () => {
  const offenders = [];
  let seen = 0;
  for (const file of SOURCES) {
    for (const { call, after } of hooklessBoardMoves(read(file))) {
      seen += 1;
      if (!/syncCardChildrenBoard\(/.test(after)) offenders.push(`${file}: ${call.slice(0, 160)}`);
    }
  }
  assert.ok(seen >= 1, 'the REST board move is such a write; the scan must see it');
  assert.deepStrictEqual(offenders, [],
    'a card moved with a hook-less write leaves its comments on the old board');
});

test('negative: the guard above does fail on a hook-less move without the re-home', () => {
  const bad = "await Cards.direct.updateAsync(\n  { _id: id },\n  { $set: { boardId: to, listId: l } },\n);\nupdated = true;\n";
  const found = hooklessBoardMoves(bad);
  assert.strictEqual(found.length, 1);
  assert.ok(!/syncCardChildrenBoard\(/.test(found[0].after));
});

test('the REST card move to another board re-homes the children from the card as written', () => {
  const server = read('server/models/cards.js');
  assert.ok(server.includes('await syncCardChildrenBoard(paramCardId, (await Cards.findOneAsync(paramCardId)) || {}, beforeEdit);'));
});

// ── the repair of rows a move already stranded ───────────────────────────────

function getPath(doc, key) {
  return key.split('.').reduce((v, k) => (v == null ? v : v[k]), doc);
}
function setPath(doc, key, value) {
  const parts = key.split('.');
  let target = doc;
  for (const p of parts.slice(0, -1)) target = target[p] = target[p] || {};
  target[parts[parts.length - 1]] = value;
}
function matches(doc, filter) {
  return Object.entries(filter).every(([key, cond]) => {
    const value = getPath(doc, key);
    if (cond && typeof cond === 'object' && '$in' in cond) return cond.$in.includes(value);
    return value === cond;
  });
}
function fakeDb(initial) {
  const data = new Map(Object.entries(initial).map(([k, v]) => [k, JSON.parse(JSON.stringify(v))]));
  const ops = { find: 0, updateMany: 0 };
  return {
    _ops: ops,
    _dump: name => data.get(name) || [],
    collection(name) {
      if (!data.has(name)) data.set(name, []);
      const docs = data.get(name);
      return {
        find(filter = {}) {
          ops.find += 1;
          const found = docs.filter(d => matches(d, filter)).map(d => JSON.parse(JSON.stringify(d)));
          let i = 0;
          return {
            async toArray() { return found; },
            async close() {},
            [Symbol.asyncIterator]() {
              return { next: async () => (i < found.length ? { value: found[i++], done: false } : { done: true }) };
            },
          };
        },
        async updateMany(filter, update) {
          ops.updateMany += 1;
          let n = 0;
          for (const d of docs) {
            if (!matches(d, filter)) continue;
            for (const [k, v] of Object.entries(update.$set)) setPath(d, k, v);
            n += 1;
          }
          return { modifiedCount: n };
        },
      };
    },
  };
}

const repair = steps.find(s => s.name === 'card-children-boardid');

function strandedDb() {
  return fakeDb({
    cards: [
      { _id: 'moved', boardId: 'B2' },   // moved B1 -> B2 before this fix
      { _id: 'stayed', boardId: 'B1' },
    ],
    card_comments: [
      { _id: 'k1', cardId: 'moved', boardId: 'B1', text: 'left behind' },
      { _id: 'k2', cardId: 'moved', boardId: 'B1', text: 'also left behind' },
      { _id: 'k3', cardId: 'stayed', boardId: 'B1', text: 'fine' },
      { _id: 'k4', cardId: 'deleted-card', boardId: 'B9', text: 'orphan' },
    ],
    card_comment_reactions: [{ _id: 'r1', cardId: 'moved', boardId: 'B1', cardCommentId: 'k1' }],
    card_text_notes: [{ _id: 'n1', cardId: 'moved', boardId: 'B1' }],
    checklists: [{ _id: 'cl1', cardId: 'moved', boardId: 'B2' }],
    checklistItems: [{ _id: 'ci1', cardId: 'moved', boardId: 'B2' }],
    attachments: [{ _id: 'a1', meta: { cardId: 'moved', boardId: 'B1' } }],
  });
}

test('repair: the step is registered with the startup schema upgrade', () => {
  assert.ok(repair, 'card-children-boardid is one of the steps');
  const order = steps.map(s => s.name);
  assert.ok(order.indexOf('card-children-boardid') < order.indexOf('fs-path-heal'));
});

test('repair: stranded comments, reactions, notes and attachments get the card\'s board', async () => {
  const db = strandedDb();
  assert.strictEqual(await repair.check(db), true);
  const res = await repair.run(db);
  assert.deepStrictEqual(res, { fixed: 5, unresolved: 0 });
  const by = (coll, id) => db._dump(coll).find(d => d._id === id);
  assert.strictEqual(by('card_comments', 'k1').boardId, 'B2');
  assert.strictEqual(by('card_comments', 'k2').boardId, 'B2');
  assert.strictEqual(by('card_comment_reactions', 'r1').boardId, 'B2');
  assert.strictEqual(by('card_text_notes', 'n1').boardId, 'B2');
  assert.strictEqual(by('attachments', 'a1').meta.boardId, 'B2');
  assert.strictEqual(by('card_comments', 'k1').text, 'left behind', 'only the board id is written');
});

test('repair negative: rows that agree, and rows whose card is gone, are left alone', async () => {
  const db = strandedDb();
  await repair.run(db);
  const by = (coll, id) => db._dump(coll).find(d => d._id === id);
  assert.strictEqual(by('card_comments', 'k3').boardId, 'B1', 'a card that never moved keeps its comments');
  assert.strictEqual(by('card_comments', 'k4').boardId, 'B9', 'no card, nothing to copy - and not guessed');
});

test('repair negative: idempotent - a second pass finds nothing, and a healthy database writes nothing', async () => {
  const db = strandedDb();
  await repair.run(db);
  assert.strictEqual(await repair.check(db), false, 'the orphan does not keep the version gate open');
  const writes = db._ops.updateMany;
  assert.deepStrictEqual(await repair.run(db), { fixed: 0, unresolved: 0 });
  assert.strictEqual(db._ops.updateMany, writes);
});

test('repair: one updateMany per stranded card per collection, not one per row', async () => {
  const db = strandedDb();
  await repair.run(db);
  // comments (one card, two rows), reactions, notes, attachments
  assert.strictEqual(db._ops.updateMany, 4);
});

(async () => {
  for (const run of pending) await run();
  console.log(`cardChildrenFollowMove.test.cjs: ${passed} tests passed`);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
