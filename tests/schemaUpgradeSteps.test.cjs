'use strict';

// Plain-Node BEHAVIORAL tests (no Meteor) for the startup schema upgrade
// (server/lib/schemaUpgradeSteps.js) — the #6473 follow-up that brings TEXT
// DATA from every old WeKan version to the newest database structure on all
// platforms and both databases. Guards the whole contract so later changes
// that would break migrating SOME data shape fail here:
//  - every step migrates its old shape (positive) and leaves healthy/explicit
//    data alone (negative);
//  - the re-check is VERSION-GATED: mandatory only after a new WeKan release,
//    a single findOne while the version is unchanged;
//  - big-database speed: checks are bounded probes/distinct() set-joins and
//    fixes are server-side updateMany batches (asserted via op counters);
//  - a failing or unresolved step never blocks startup and forces the next
//    boot to re-check.
//
// Runs against a minimal in-memory mongodb-driver-compatible Db fake (only
// the operators the module actually uses).
// Run: node tests/schemaUpgradeSteps.test.cjs

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const {
  runSchemaUpgrade,
  getUpgradeState,
  BOARD_ALLOWS_TRUE_DEFAULTS,
  randomId,
  versionNeedsHeal,
  MARKER_ID,
  steps,
} = require('../server/lib/schemaUpgradeSteps');

let passed = 0;
function test(name, fn) {
  const r = fn();
  if (r && typeof r.then === 'function') {
    return r.then(() => { passed += 1; console.log('  ok -', name); });
  }
  passed += 1;
  console.log('  ok -', name);
  return Promise.resolve();
}

// ── minimal in-memory Db fake (mongodb driver surface the module uses) ───────
function getPath(doc, key) {
  return key.split('.').reduce((v, part) => (v == null ? v : v[part]), doc);
}
function matchCond(value, cond) {
  if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
    if ('$exists' in cond) return cond.$exists === (value !== undefined);
    if ('$in' in cond) {
      return cond.$in.some(x => (x === null ? value === undefined || value === null : String(value) === String(x)));
    }
    if ('$nin' in cond) {
      return !cond.$nin.some(x => (x === null ? value === undefined || value === null : String(value) === String(x)));
    }
    if ('$ne' in cond) {
      return String(value) !== String(cond.$ne);
    }
    if ('$elemMatch' in cond) {
      if (!Array.isArray(value)) return false;
      return value.some(el => matches(el, cond.$elemMatch));
    }
    // numeric type/range (nonfinite-sort-repair). Multiple ops AND together.
    if ('$type' in cond || '$gte' in cond || '$lte' in cond) {
      let ok = true;
      if ('$type' in cond) ok = ok && (cond.$type === 'number' ? typeof value === 'number' : false);
      if ('$gte' in cond) ok = ok && (typeof value === 'number' && value >= cond.$gte);
      if ('$lte' in cond) ok = ok && (typeof value === 'number' && value <= cond.$lte);
      return ok;
    }
    throw new Error('fake db: unsupported operator in ' + JSON.stringify(cond));
  }
  return String(value) === String(cond) || value === cond;
}
function matches(doc, filter) {
  for (const [key, cond] of Object.entries(filter || {})) {
    if (key === '$or') {
      if (!cond.some(sub => matches(doc, sub))) return false;
      continue;
    }
    if (key === '$nor') {
      if (cond.some(sub => matches(doc, sub))) return false;
      continue;
    }
    if (!matchCond(getPath(doc, key), cond)) return false;
  }
  return true;
}
function applyUpdate(doc, update) {
  for (const [k, v] of Object.entries(update.$set || {})) {
    const parts = k.split('.');
    let target = doc;
    for (const p of parts.slice(0, -1)) {
      if (typeof target[p] !== 'object' || target[p] === null) target[p] = {};
      target = target[p];
    }
    target[parts[parts.length - 1]] = v;
  }
  for (const k of Object.keys(update.$unset || {})) {
    const parts = k.split('.');
    let target = doc;
    for (const p of parts.slice(0, -1)) {
      target = target && target[p];
      if (!target) break;
    }
    if (target) delete target[parts[parts.length - 1]];
  }
}
function fakeDb(initial = {}) {
  const data = new Map(Object.entries(initial).map(([k, docs]) => [k, docs.map(d => JSON.parse(JSON.stringify(d)))]));
  const ops = { findOne: 0, find: 0, distinct: 0, updateMany: 0, updateOne: 0, insertOne: 0, insertMany: 0, countDocuments: 0 };
  const coll = name => {
    if (!data.has(name)) data.set(name, []);
    const docs = () => data.get(name);
    return {
      async findOne(filter = {}, opts = {}) {
        ops.findOne++;
        let found = docs().filter(d => matches(d, filter));
        if (opts.sort) {
          const [[k, dir]] = Object.entries(opts.sort);
          found = found.sort((a, b) => ((a[k] || 0) - (b[k] || 0)) * dir);
        }
        return found[0] ? JSON.parse(JSON.stringify(found[0])) : null;
      },
      find(filter = {}) {
        ops.find++;
        const found = docs().filter(d => matches(d, filter)).map(d => JSON.parse(JSON.stringify(d)));
        let i = 0;
        return {
          async toArray() { return found; },
          async close() {},
          [Symbol.asyncIterator]() {
            return { async next() { return i < found.length ? { value: found[i++], done: false } : { value: undefined, done: true }; } };
          },
        };
      },
      async distinct(field, filter = {}) {
        ops.distinct++;
        const vals = new Set();
        for (const d of docs()) if (matches(d, filter)) {
          const v = getPath(d, field);
          if (v !== undefined) vals.add(typeof v === 'string' ? v : String(v));
        }
        return [...vals];
      },
      async countDocuments(filter = {}) {
        ops.countDocuments++;
        return docs().filter(d => matches(d, filter)).length;
      },
      async deleteOne(filter) {
        const i = docs().findIndex(d => matches(d, filter));
        if (i >= 0) { docs().splice(i, 1); return { deletedCount: 1 }; }
        return { deletedCount: 0 };
      },
      async insertOne(doc) { ops.insertOne++; docs().push(JSON.parse(JSON.stringify(doc))); return { insertedId: doc._id }; },
      async insertMany(list) { ops.insertMany++; for (const d of list) docs().push(JSON.parse(JSON.stringify(d))); return { insertedCount: list.length }; },
      async updateOne(filter, update, opts = {}) {
        ops.updateOne++;
        const target = docs().find(d => matches(d, filter));
        if (target) { applyUpdate(target, update); return { modifiedCount: 1 }; }
        if (opts.upsert) {
          const fresh = { ...(filter._id ? { _id: filter._id } : {}) };
          applyUpdate(fresh, update);
          docs().push(fresh);
          return { upsertedId: fresh._id, modifiedCount: 0 };
        }
        return { modifiedCount: 0 };
      },
      async updateMany(filter, update) {
        ops.updateMany++;
        let n = 0;
        for (const d of docs()) if (matches(d, filter)) { applyUpdate(d, update); n++; }
        return { modifiedCount: n };
      },
    };
  };
  return { collection: coll, _dump: name => data.get(name) || [], _ops: ops };
}

const tmpWritable = fs.mkdtempSync(path.join(os.tmpdir(), 'schema-upgrade-'));
const opts = { writablePath: tmpWritable, appVersion: 'v9.97.0' };

(async () => {

await test('randomId produces Meteor-style 17-char ids', () => {
  const id = randomId();
  assert.strictEqual(id.length, 17);
  assert.ok(/^[23456789A-HJKLMNP-Zabcdefghijkmnop-z]+$/.test(id));
  assert.notStrictEqual(randomId(), randomId());
  // custom lengths still exact despite rejection resampling
  assert.strictEqual(randomId(64).length, 64);
});

await test('negative: randomId uses rejection sampling, not biased modulo (CodeQL js/biased-cryptographic-random)', () => {
  const src = read('server/lib/schemaUpgradeSteps.js');
  const fn = src.match(/function randomId\([\s\S]*?\n\}/)[0];
  assert.ok(fn.includes('256 % ID_CHARS.length'),
    'bytes at/above the largest alphabet multiple must be rejected, or ids skew toward the first characters');
  assert.ok(/if \(bytes\[i\] < limit\)/.test(fn), 'out-of-range bytes are resampled, never wrapped');
});

// ── swimlane-structure ────────────────────────────────────────────────────────

await test('swimlane-structure: creates Default swimlane, backfills lists/cards, rescues dangling listId', async () => {
  const db = fakeDb({
    boards: [{ _id: 'b1', title: 'Old board' }],
    lists: [{ _id: 'l1', boardId: 'b1', title: 'Todo' }],           // no swimlaneId
    cards: [
      { _id: 'c1', boardId: 'b1', listId: 'l1', title: 'ok card' }, // no swimlaneId
      { _id: 'c2', boardId: 'b1', listId: 'GONE', title: 'orphan' },// dangling listId
    ],
  });
  const res = await runSchemaUpgrade(db, opts);
  assert.ok(res.ran.includes('swimlane-structure'));
  const sw = db._dump('swimlanes');
  assert.strictEqual(sw.length, 1);
  assert.strictEqual(sw[0].title, 'Default');
  const l1 = db._dump('lists').find(l => l._id === 'l1');
  assert.strictEqual(l1.swimlaneId, undefined,
    'lists are NOT stamped: empty/missing swimlaneId means SHARED across swimlanes');
  const c1 = db._dump('cards').find(c => c._id === 'c1');
  assert.strictEqual(c1.swimlaneId, String(sw[0]._id));
  const c2 = db._dump('cards').find(c => c._id === 'c2');
  assert.strictEqual(c2.listId, 'l1', 'orphan rescued to the board\'s first list');
});

await test('swimlane-structure: creates a Rescued Data list when the board has none', async () => {
  const db = fakeDb({
    boards: [{ _id: 'b1' }],
    swimlanes: [{ _id: 's1', boardId: 'b1', title: 'Default', sort: 0 }],
    cards: [{ _id: 'c1', boardId: 'b1', listId: 'GONE', swimlaneId: 's1' }],
  });
  const res = await runSchemaUpgrade(db, opts);
  assert.ok(res.ran.includes('swimlane-structure'));
  const rescued = db._dump('lists').find(l => l.title === 'Rescued Data');
  assert.ok(rescued, 'Rescued Data list created');
  assert.strictEqual(db._dump('cards')[0].listId, String(rescued._id));
});

await test('speed: card fixes are server-side updateMany batches, never per-card round trips', async () => {
  const manyCards = [];
  for (let i = 0; i < 500; i++) manyCards.push({ _id: 'c' + i, boardId: 'b1', listId: 'l1', title: 't' + i });
  const db = fakeDb({
    boards: [{ _id: 'b1' }],
    lists: [{ _id: 'l1', boardId: 'b1' }],
    cards: manyCards,                        // 500 cards all missing swimlaneId
  });
  await runSchemaUpgrade(db, opts);
  assert.ok(db._dump('cards').every(c => c.swimlaneId), 'all 500 cards fixed');
  assert.ok(db._ops.updateOne < 20,
    `per-document updateOne calls must stay constant-ish (got ${db._ops.updateOne}) — thousands of cards must not mean thousands of round trips`);
  assert.ok(db._ops.updateMany >= 2, 'fixes go through updateMany');
});

await test('negative: swimlane-structure does not run on healthy data', async () => {
  const db = fakeDb({
    boards: [{ _id: 'b1', archived: false }],
    swimlanes: [{ _id: 's1', boardId: 'b1', archived: false }],
    lists: [{ _id: 'l1', boardId: 'b1', swimlaneId: 's1', archived: false }],
    cards: [{ _id: 'c1', boardId: 'b1', listId: 'l1', swimlaneId: 's1', archived: false }],
  });
  const res = await runSchemaUpgrade(db, opts);
  assert.ok(!res.ran.includes('swimlane-structure'));
  assert.ok(!res.ran.includes('archived-flag-backfill'));
});

// ── views visibility: Swimlanes view + Lists view (#1959, #1971) ─────────────

await test('archived-flag-backfill: docs missing `archived` become visible to archived:false view queries', async () => {
  const db = fakeDb({
    boards: [{ _id: 'b1' }],                                 // LibreBoard-era: no archived field
    swimlanes: [{ _id: 's1', boardId: 'b1' }],
    lists: [{ _id: 'l1', boardId: 'b1', swimlaneId: 's1' }],
    cards: [{ _id: 'c1', boardId: 'b1', listId: 'l1', swimlaneId: 's1' }],
  });
  const res = await runSchemaUpgrade(db, opts);
  assert.ok(res.ran.includes('archived-flag-backfill'));
  for (const coll of ['boards', 'swimlanes', 'lists', 'cards']) {
    assert.strictEqual(db._dump(coll)[0].archived, false, `${coll} now matches archived:false`);
  }
});

await test('negative: archived-flag-backfill never flips explicitly archived docs', async () => {
  const db = fakeDb({
    boards: [{ _id: 'b1', archived: true }],
    swimlanes: [{ _id: 's1', boardId: 'b1', archived: false }],
  });
  await runSchemaUpgrade(db, opts);
  assert.strictEqual(db._dump('boards')[0].archived, true, 'archived board stays archived');
});

await test('#1959: card under a DELETED swimlane is rescued to the board\'s visible swimlane', async () => {
  const db = fakeDb({
    boards: [{ _id: 'b1', archived: false }],
    swimlanes: [{ _id: 'sVisible', boardId: 'b1', archived: false, sort: 0 }],
    lists: [{ _id: 'l1', boardId: 'b1', swimlaneId: 'sVisible', archived: false }],
    cards: [{ _id: 'c1', boardId: 'b1', listId: 'l1', swimlaneId: 'sDELETED', archived: false }],
  });
  const res = await runSchemaUpgrade(db, opts);
  assert.ok(res.ran.includes('swimlane-structure'));
  assert.strictEqual(db._dump('cards')[0].swimlaneId, 'sVisible', 'card visible in Swimlanes view again');
});

await test('#1971: card under an ARCHIVED swimlane is rescued to a visible one', async () => {
  const db = fakeDb({
    boards: [{ _id: 'b1', archived: false }],
    swimlanes: [
      { _id: 'sArchived', boardId: 'b1', archived: true, sort: 0 },
      { _id: 'sVisible', boardId: 'b1', archived: false, sort: 1 },
    ],
    lists: [{ _id: 'l1', boardId: 'b1', swimlaneId: 'sVisible', archived: false }],
    cards: [{ _id: 'c1', boardId: 'b1', listId: 'l1', swimlaneId: 'sArchived', archived: false }],
  });
  await runSchemaUpgrade(db, opts);
  assert.strictEqual(db._dump('cards')[0].swimlaneId, 'sVisible');
});

await test('#1971: when EVERY swimlane is archived, a visible Default is created for the rescue', async () => {
  const db = fakeDb({
    boards: [{ _id: 'b1', archived: false }],
    swimlanes: [{ _id: 'sArchived', boardId: 'b1', archived: true, sort: 0 }],
    lists: [{ _id: 'l1', boardId: 'b1', swimlaneId: 'sArchived', archived: false }],
    cards: [{ _id: 'c1', boardId: 'b1', listId: 'l1', swimlaneId: 'sArchived', archived: false }],
  });
  await runSchemaUpgrade(db, opts);
  const visible = db._dump('swimlanes').find(s => s.archived === false);
  assert.ok(visible, 'a visible Default swimlane was created');
  assert.strictEqual(db._dump('cards')[0].swimlaneId, String(visible._id));
});

await test('negative: ARCHIVED cards under archived swimlanes are left alone (intentionally hidden)', async () => {
  const db = fakeDb({
    boards: [{ _id: 'b1', archived: false }],
    swimlanes: [
      { _id: 'sArchived', boardId: 'b1', archived: true, sort: 0 },
      { _id: 'sVisible', boardId: 'b1', archived: false, sort: 1 },
    ],
    lists: [{ _id: 'l1', boardId: 'b1', swimlaneId: 'sVisible', archived: false }],
    cards: [{ _id: 'c1', boardId: 'b1', listId: 'l1', swimlaneId: 'sArchived', archived: true }],
  });
  await runSchemaUpgrade(db, opts);
  assert.strictEqual(db._dump('cards')[0].swimlaneId, 'sArchived', 'archived card untouched');
});

await test('cross-board: card pointing at ANOTHER board\'s swimlane is pulled back to its own board', async () => {
  const db = fakeDb({
    boards: [{ _id: 'b1', archived: false }, { _id: 'b2', archived: false }],
    swimlanes: [
      { _id: 's1', boardId: 'b1', archived: false, sort: 0 },
      { _id: 's2', boardId: 'b2', archived: false, sort: 0 },
    ],
    lists: [{ _id: 'l1', boardId: 'b1', swimlaneId: 's1', archived: false }],
    cards: [{ _id: 'c1', boardId: 'b1', listId: 'l1', swimlaneId: 's2', archived: false }],
  });
  await runSchemaUpgrade(db, opts);
  assert.strictEqual(db._dump('cards')[0].swimlaneId, 's1');
});

await test('merge-per-swimlane-lists: v8.x duplicate list copies merged into one shared list', async () => {
  const db = fakeDb({
    boards: [{ _id: 'b1', archived: false, fixMissingListsCompleted: true }],
    swimlanes: [
      { _id: 's1', boardId: 'b1', archived: false, sort: 0 },
      { _id: 's2', boardId: 'b1', archived: false, sort: 1 },
    ],
    lists: [
      { _id: 'l1', boardId: 'b1', title: 'Todo', swimlaneId: 's1', archived: false, createdAt: 1 },
      { _id: 'l2', boardId: 'b1', title: 'Todo', swimlaneId: 's2', archived: false, createdAt: 2 },
    ],
    cards: [
      { _id: 'c1', boardId: 'b1', listId: 'l1', swimlaneId: 's1', archived: false },
      { _id: 'c2', boardId: 'b1', listId: 'l2', swimlaneId: 's2', archived: false },
    ],
  });
  const res = await runSchemaUpgrade(db, opts);
  assert.ok(res.ran.includes('merge-per-swimlane-lists'));
  const lists = db._dump('lists');
  assert.strictEqual(lists.length, 1, 'duplicate copy deleted');
  assert.strictEqual(lists[0].swimlaneId, '', 'canonical list is SHARED (renders in every swimlane)');
  const cards = db._dump('cards');
  assert.ok(cards.every(c => c.listId === 'l1'), 'cards repointed to the canonical list');
  assert.strictEqual(cards[0].swimlaneId, 's1', 'cards KEEP their swimlane (per-swimlane grouping preserved)');
  assert.strictEqual(cards[1].swimlaneId, 's2');
  const b = db._dump('boards')[0];
  assert.strictEqual(b.fixMissingListsCompleted, undefined, 'era marker cleared so repair tools work again');
});

await test('merge-per-swimlane-lists: v7.98 stamped lists (Shape A) become shared again', async () => {
  const db = fakeDb({
    boards: [{ _id: 'b1', archived: false }],
    swimlanes: [
      { _id: 's1', boardId: 'b1', archived: false, sort: 0 },
      { _id: 's2', boardId: 'b1', archived: false, sort: 1 },
    ],
    lists: [{ _id: 'l1', boardId: 'b1', title: 'Todo', swimlaneId: 's1', archived: false }],
    cards: [{ _id: 'c2', boardId: 'b1', listId: 'l1', swimlaneId: 's2', archived: false }], // other swimlane's card
  });
  const res = await runSchemaUpgrade(db, opts);
  assert.ok(res.ran.includes('merge-per-swimlane-lists'));
  assert.strictEqual(db._dump('lists')[0].swimlaneId, '', 'stamped list unshared so every swimlane renders it');
  assert.strictEqual(db._dump('cards')[0].swimlaneId, 's2', 'card untouched');
});

await test('negative: merge-per-swimlane-lists leaves healthy and RENAMED per-swimlane lists alone', async () => {
  const db = fakeDb({
    boards: [{ _id: 'b1', archived: false, fixMissingListsCompleted: true }],
    swimlanes: [
      { _id: 's1', boardId: 'b1', archived: false, sort: 0 },
      { _id: 's2', boardId: 'b1', archived: false, sort: 1 },
    ],
    lists: [
      { _id: 'l1', boardId: 'b1', title: 'Todo (team A)', swimlaneId: 's1', archived: false },
      { _id: 'l2', boardId: 'b1', title: 'Todo (team B)', swimlaneId: 's2', archived: false },
    ],
    cards: [
      { _id: 'c1', boardId: 'b1', listId: 'l1', swimlaneId: 's1', archived: false },
      { _id: 'c2', boardId: 'b1', listId: 'l2', swimlaneId: 's2', archived: false },
    ],
  });
  await runSchemaUpgrade(db, opts);
  const lists = db._dump('lists');
  assert.strictEqual(lists.length, 2, 'differently RENAMED copies are kept (their names carry meaning)');
  assert.ok(lists.every(l => l.swimlaneId === ''), 'both become shared');
  assert.ok(db._dump('cards').every((c, i) => c.listId === ['l1', 'l2'][i]), 'cards keep their own list');
});

await test('write path (#1959/#1971): card insert hook validates client-supplied swimlaneIds', () => {
  const hook = read('server/migrations/ensureValidSwimlaneIds.js');
  assert.ok(hook.includes('#1959/#1971'), 'the visibility fix is documented at the hook');
  const insertHook = hook.match(/Cards\.before\.insert\([\s\S]*?\n    \}\);/)[0];
  assert.ok(/if \(doc\.swimlaneId\) \{/.test(insertHook),
    'a PROVIDED swimlaneId must be validated, not only a missing one');
  assert.ok(insertHook.includes('archived: false'), 'must resolve to a VISIBLE swimlane');
  assert.ok(insertHook.includes('boardId: doc.boardId'), 'must belong to the same board');
});

// ── checklist-items-embedded ─────────────────────────────────────────────────

await test('checklist-items-embedded: extracts pre-v0.79 embedded items to ChecklistItems', async () => {
  const db = fakeDb({
    checklists: [{
      _id: 'ck1', cardId: 'c1', title: 'Todo',
      items: [
        { title: 'second', sort: 2, isFinished: true },
        { title: 'first', sort: 1, isFinished: false },
        { sort: 3 },   // untitled item — original migration used 'Checklist'
      ],
    }],
  });
  const res = await runSchemaUpgrade(db, opts);
  assert.ok(res.ran.includes('checklist-items-embedded'));
  const items = db._dump('checklistItems');
  assert.strictEqual(items.length, 3);
  assert.deepStrictEqual(items.map(i => i.title), ['first', 'second', 'Checklist'], 'sorted by embedded sort');
  assert.deepStrictEqual(items.map(i => i.sort), [0, 1, 2], 're-numbered like the v8.00 migration');
  assert.strictEqual(items[1].isFinished, true);
  assert.ok(items.every(i => i.checklistId === 'ck1' && i.cardId === 'c1' && i._id.length === 17));
  assert.strictEqual(db._dump('checklists')[0].items, undefined, 'embedded array removed');
});

await test('negative: checklist extraction does not duplicate items on a re-run after a crash', async () => {
  const db = fakeDb({
    checklists: [{ _id: 'ck1', cardId: 'c1', items: [{ title: 'a', sort: 0 }, { title: 'b', sort: 1 }] }],
    // 'a' was already extracted before the interruption:
    checklistItems: [{ _id: 'x1', checklistId: 'ck1', cardId: 'c1', title: 'a', sort: 0, isFinished: false }],
  });
  await runSchemaUpgrade(db, opts);
  const items = db._dump('checklistItems');
  assert.strictEqual(items.length, 2, 'no duplicate of "a"');
});

// ── customfields-boardIds ────────────────────────────────────────────────────

await test('customfields-boardIds: scalar boardId becomes boardIds array', async () => {
  const db = fakeDb({ customFields: [{ _id: 'cf1', name: 'Severity', boardId: 'b1' }] });
  const res = await runSchemaUpgrade(db, opts);
  assert.ok(res.ran.includes('customfields-boardIds'));
  const cf = db._dump('customFields')[0];
  assert.deepStrictEqual(cf.boardIds, ['b1']);
  assert.strictEqual(cf.boardId, undefined);
});

await test('negative: customfields with an existing boardIds array only lose the stale scalar', async () => {
  const db = fakeDb({ customFields: [{ _id: 'cf1', boardId: 'old', boardIds: ['b1', 'b2'] }] });
  await runSchemaUpgrade(db, opts);
  const cf = db._dump('customFields')[0];
  assert.deepStrictEqual(cf.boardIds, ['b1', 'b2'], 'existing array untouched');
  assert.strictEqual(cf.boardId, undefined);
});

// ── board-allows-defaults ────────────────────────────────────────────────────

await test('board-allows-defaults: missing true-default flags are backfilled, explicit false respected', async () => {
  const db = fakeDb({ boards: [
    { _id: 'b1', allowsComments: false },                    // user turned comments OFF
    { _id: 'b2' },                                           // ancient board: nothing set
  ] });
  const res = await runSchemaUpgrade(db, opts);
  assert.ok(res.ran.includes('board-allows-defaults'));
  const [b1, b2] = db._dump('boards');
  assert.strictEqual(b1.allowsComments, false, 'explicit user choice untouched');
  assert.strictEqual(b1.allowsChecklists, true, 'missing flag backfilled');
  assert.strictEqual(b2.allowsDescriptionText, true);
  assert.strictEqual(b2.allowsAttachments, true);
});

await test('the true-defaults list stays in sync with models/boards.js', () => {
  const src = read('models/boards.js');
  const re = /(allows[A-Za-z0-9]+):\s*\{[^}]*?defaultValue:\s*(true|false)/g;
  const fromSchema = [];
  let m;
  while ((m = re.exec(src))) if (m[2] === 'true') fromSchema.push(m[1]);
  assert.deepStrictEqual([...BOARD_ALLOWS_TRUE_DEFAULTS].sort(), fromSchema.sort(),
    'BOARD_ALLOWS_TRUE_DEFAULTS must match the schema defaults (update both together)');
});

// ── board-members-isactive ───────────────────────────────────────────────────

await test('board-members-isactive: missing isActive becomes true, explicit false stays false', async () => {
  const db = fakeDb({ boards: [
    { _id: 'b1', members: [{ userId: 'u1' }, { userId: 'u2', isActive: false }, { userId: 'u3', isActive: true }] },
  ] });
  const res = await runSchemaUpgrade(db, opts);
  assert.ok(res.ran.includes('board-members-isactive'));
  const members = db._dump('boards')[0].members;
  assert.strictEqual(members[0].isActive, true, 'pre-2015 member regains access');
  assert.strictEqual(members[1].isActive, false, 'deactivated member stays deactivated');
  assert.strictEqual(members[2].isActive, true);
});

// ── board-permission-lowercase ───────────────────────────────────────────────

await test('board-permission-lowercase: PUBLIC boards become public again (batched updateMany)', async () => {
  const db = fakeDb({ boards: [
    { _id: 'b1', permission: 'PUBLIC' },
    { _id: 'b2', permission: 'private' },
  ] });
  const res = await runSchemaUpgrade(db, opts);
  assert.ok(res.ran.includes('board-permission-lowercase'));
  assert.strictEqual(db._dump('boards')[0].permission, 'public');
  assert.strictEqual(db._dump('boards')[1].permission, 'private', 'already-lowercase untouched');
});

// ── nonfinite-sort-repair (#6481) ────────────────────────────────────────────
// The global fakeDb JSON-clones documents, which turns Infinity/NaN into null,
// so build a NON-cloning db here to keep the non-finite sorts intact and drive
// the step object directly (it uses only findOne + updateMany).
function liveSortDb(initial) {
  const data = new Map(Object.entries(initial));
  return {
    collection(name) {
      if (!data.has(name)) data.set(name, []);
      const arr = data.get(name);
      return {
        async findOne(filter) { return arr.find(d => matches(d, filter)) || null; },
        async updateMany(filter, update) {
          let n = 0;
          for (const d of arr) if (matches(d, filter)) { applyUpdate(d, update); n++; }
          return { modifiedCount: n };
        },
      };
    },
    _dump: name => data.get(name) || [],
  };
}
const sortStep = steps.find(s => s.name === 'nonfinite-sort-repair');

await test('nonfinite-sort-repair: +Inf / -Inf / NaN sorts reset to 0, finite ones untouched', async () => {
  const cards = [
    { _id: 'c1', sort: Infinity },
    { _id: 'c2', sort: -Infinity },
    { _id: 'c3', sort: NaN },
    { _id: 'c4', sort: 5 },        // finite -> keep
    { _id: 'c5', sort: 0 },        // finite -> keep
    { _id: 'c6' },                 // missing sort -> not numeric, ignore
    { _id: 'c7', sort: 'x' },      // non-numeric -> ignore
  ];
  const db = liveSortDb({ cards });
  assert.strictEqual(await sortStep.check(db), true, 'non-finite sorts are detected');
  const res = await sortStep.run(db);
  assert.strictEqual(res.fixed, 3, 'exactly the three non-finite cards are repaired');
  const by = id => cards.find(c => c._id === id);
  assert.strictEqual(by('c1').sort, 0);
  assert.strictEqual(by('c2').sort, 0);
  assert.strictEqual(by('c3').sort, 0);
  assert.strictEqual(by('c4').sort, 5, 'finite sort left as-is');
  assert.strictEqual(by('c5').sort, 0);
  assert.strictEqual(by('c6').sort, undefined, 'missing sort not invented');
  assert.strictEqual(by('c7').sort, 'x', 'non-numeric sort not touched');
  // idempotent: a second run finds nothing to do
  assert.strictEqual(await sortStep.check(db), false);
});

await test('nonfinite-sort-repair: repairs every sorted collection (lists/swimlanes/checklists/checklistItems)', async () => {
  const db = liveSortDb({
    lists: [{ _id: 'l1', sort: Infinity }],
    swimlanes: [{ _id: 's1', sort: NaN }],
    checklists: [{ _id: 'k1', sort: -Infinity }],
    checklistItems: [{ _id: 'i1', sort: Infinity }, { _id: 'i2', sort: 2 }],
  });
  const res = await sortStep.run(db);
  assert.strictEqual(res.fixed, 4);
  assert.strictEqual(db._dump('lists')[0].sort, 0);
  assert.strictEqual(db._dump('swimlanes')[0].sort, 0);
  assert.strictEqual(db._dump('checklists')[0].sort, 0);
  assert.strictEqual(db._dump('checklistItems')[0].sort, 0);
  assert.strictEqual(db._dump('checklistItems')[1].sort, 2);
});

await test('negative: nonfinite-sort-repair does not run on healthy finite sorts', async () => {
  const db = liveSortDb({ cards: [{ _id: 'c1', sort: 0 }, { _id: 'c2', sort: 1e300 }, { _id: 'c3', sort: -1e300 }] });
  assert.strictEqual(await sortStep.check(db), false);
  const res = await sortStep.run(db);
  assert.strictEqual(res.fixed, 0);
});

await test('negative: the non-finite predicate uses only finite literals (FerretDB rejects Infinity/NaN in filters)', () => {
  const src = read('server/lib/schemaUpgradeSteps.js');
  const block = src.slice(src.indexOf('const NON_FINITE_SORT'), src.indexOf('const SORTED_COLLECTIONS'));
  assert.ok(!/Infinity|NaN/.test(block), 'predicate must not embed Infinity/NaN literals');
  assert.ok(/\$type/.test(block) && /\$nor/.test(block), 'matches non-finite numeric sorts via $type + $nor bounds');
});

// ── fs-path-heal ─────────────────────────────────────────────────────────────

await test('fs-path-heal: stale-path record repointed to the binary found under the old uploads layout', async () => {
  const attachDir = path.join(tmpWritable, 'files', 'attachments');
  const oldDir = path.join(tmpWritable, 'files', 'uploads', 'attachments');
  fs.mkdirSync(attachDir, { recursive: true });
  fs.mkdirSync(oldDir, { recursive: true });
  fs.writeFileSync(path.join(oldDir, 'legacy.bin'), 'legacy-bytes');
  const db = fakeDb({ attachments: [{
    _id: 'a1', name: 'legacy.bin',
    versions: { original: { storage: 'fs', path: '/nonexistent/old/legacy.bin', size: 12 } },
  }] });
  const res = await runSchemaUpgrade(db, opts);
  assert.ok(res.ran.includes('fs-path-heal'));
  const a = db._dump('attachments')[0];
  assert.ok(a.versions.original.path.startsWith(attachDir), 'repointed into the current layout');
  assert.ok(fs.existsSync(a.versions.original.path), 'binary copied');
  assert.strictEqual(fs.readFileSync(a.versions.original.path, 'utf8'), 'legacy-bytes');
  assert.strictEqual(a.versions.original.storage, 'fs');
});

await test('fs-path-heal: flagless record without gridFsFileId (failed v6.10-18 GridFS copy) is healed too', () => {
  assert.strictEqual(versionNeedsHeal({}, { size: 1, path: '/gone' }), true, 'no flag + no gridFsFileId + missing path');
  assert.strictEqual(versionNeedsHeal({}, { size: 1, meta: { gridFsFileId: 'x' } }), false, 'gridfs reference -> not an fs heal case');
  assert.strictEqual(versionNeedsHeal({}, { storage: 's3', path: '/gone' }), false, 'cloud storage untouched');
});

await test('negative: fs-path-heal with an unfindable binary leaves the version UN-STAMPED so the next boot re-checks', async () => {
  const db = fakeDb({ avatars: [{
    _id: 'av1', name: 'gone.png',
    versions: { original: { storage: 'fs', path: '/nonexistent/gone.png' } },
  }] });
  const res = await runSchemaUpgrade(db, opts);
  assert.ok(res.ran.includes('fs-path-heal'));
  assert.strictEqual(res.results['fs-path-heal'].unresolved, 1);
  const marker = await db.collection('_wekan_migration').findOne({ _id: MARKER_ID });
  assert.ok(!marker || !marker.lastCheck || marker.lastCheck.version !== opts.appVersion,
    'unresolved work must keep the version un-stamped (re-check next boot)');
});

// ── version gating: re-check mandatory only after a NEW RELEASE ───────────────

await test('same WeKan version: second boot is gated to a single findOne (no scans, no fixes)', async () => {
  const db = fakeDb({});
  const first = await runSchemaUpgrade(db, opts);
  assert.strictEqual(first.gated, false);
  const marker = await db.collection('_wekan_migration').findOne({ _id: MARKER_ID });
  assert.strictEqual(marker.lastCheck.version, opts.appVersion, 'version + datetime recorded');
  assert.ok(marker.lastCheck.at, 'datetime of the re-check saved');
  // plant NEW old-shape data; same version -> must NOT be scanned or touched
  await db.collection('checklists').insertOne({ _id: 'ck9', cardId: 'c9', items: [{ title: 'x', sort: 0 }] });
  const before = { ...db._ops };
  const second = await runSchemaUpgrade(db, opts);
  assert.strictEqual(second.gated, true, 'gated: version unchanged');
  assert.strictEqual(second.ran.length, 0);
  assert.strictEqual(db._dump('checklistItems').length, 0, 'no work performed while gated');
  assert.ok(db._ops.findOne - before.findOne <= 2, 'gated boot costs at most the marker read (+product name)');
  assert.strictEqual(db._ops.updateMany, before.updateMany, 'no writes while gated');
});

await test('NEW WeKan version: the re-check is mandatory and picks up newly-broken data', async () => {
  const db = fakeDb({});
  await runSchemaUpgrade(db, opts);                       // v9.97.0 clean
  await db.collection('checklists').insertOne({ _id: 'ck9', cardId: 'c9', items: [{ title: 'x', sort: 0 }] });
  const res = await runSchemaUpgrade(db, { ...opts, appVersion: 'v9.98.0' });
  assert.strictEqual(res.gated, false, 'new release -> full re-check');
  assert.ok(res.ran.includes('checklist-items-embedded'));
  assert.strictEqual(db._dump('checklistItems').length, 1, 'the new old-shape data was migrated');
  const marker = await db.collection('_wekan_migration').findOne({ _id: MARKER_ID });
  assert.strictEqual(marker.lastCheck.version, 'v9.98.0');
});

await test('force option overrides the version gate', async () => {
  const db = fakeDb({});
  await runSchemaUpgrade(db, opts);
  await db.collection('boards').insertOne({ _id: 'b1', permission: 'PUBLIC' });
  const res = await runSchemaUpgrade(db, { ...opts, force: true });
  assert.strictEqual(res.gated, false);
  assert.strictEqual(db._dump('boards')[0].permission, 'public');
});

await test('negative: unresolved work prevents the version stamp, so the SAME version re-checks next boot', async () => {
  const db = fakeDb({ avatars: [{ _id: 'av1', name: 'gone.png', versions: { original: { storage: 'fs', path: '/nonexistent/gone.png' } } }] });
  await runSchemaUpgrade(db, opts);                       // unresolved heal
  const res2 = await runSchemaUpgrade(db, opts);          // same version
  assert.strictEqual(res2.gated, false, 'must re-check because the previous run was not clean');
});

// ── orchestrator semantics ───────────────────────────────────────────────────

await test('healthy database: everything skipped, version stamped', async () => {
  const db = fakeDb({});
  const res = await runSchemaUpgrade(db, opts);
  assert.strictEqual(res.ran.length, 0);
  const marker = await db.collection('_wekan_migration').findOne({ _id: MARKER_ID });
  assert.ok(marker && marker.lastCheck, 'lastCheck written so later boots cost one findOne');
});

await test('a throwing step never breaks the run: later steps still execute, version stays un-stamped', async () => {
  const db = fakeDb({ boards: [{ _id: 'b1', permission: 'PUBLIC' }] });
  const real = db.collection;
  db.collection = name => {
    const c = real(name);
    if (name === 'checklists') return { ...c, findOne: async () => { throw new Error('boom'); } };
    return c;
  };
  const res = await runSchemaUpgrade(db, opts);
  assert.ok(res.results['checklist-items-embedded'].error, 'failure recorded');
  assert.ok(res.ran.includes('board-permission-lowercase'), 'later steps still ran');
  assert.strictEqual(db._dump('boards')[0].permission, 'public');
  const marker = await db.collection('_wekan_migration').findOne({ _id: MARKER_ID });
  assert.ok(!marker || !marker.lastCheck, 'failed step keeps the version un-stamped');
});

// ── progress state for the migration dashboard ───────────────────────────────

await test('dashboard state: progress, per-step results, and the product name when set', async () => {
  const db = fakeDb({
    settings: [{ _id: 's1', productName: 'AcmeBoards' }],
    boards: [{ _id: 'b1', permission: 'PUBLIC' }],
  });
  await runSchemaUpgrade(db, opts);
  const state = getUpgradeState();
  assert.strictEqual(state.product, 'AcmeBoards', 'dashboard shows the Admin Panel product name, not WeKan');
  assert.strictEqual(state.running, false);
  assert.ok(state.startedAt && state.finishedAt);
  assert.strictEqual(state.steps['board-permission-lowercase'].status, 'done');
  assert.strictEqual(state.steps['board-permission-lowercase'].fixed, 1);
  assert.strictEqual(state.steps['checklist-items-embedded'].status, 'skipped');
});

await test('negative: no product name set -> dashboard says WeKan', async () => {
  const db = fakeDb({});
  await runSchemaUpgrade(db, opts);
  assert.strictEqual(getUpgradeState().product, 'WeKan');
});

// ── wiring ───────────────────────────────────────────────────────────────────

await test('the startup wrapper is imported, non-blocking, and serves the dashboard route', () => {
  assert.ok(read('server/imports.js').includes("import '/server/startupSchemaUpgrade'"));
  const wrapper = read('server/startupSchemaUpgrade.js');
  assert.ok(wrapper.includes('runSchemaUpgrade'));
  assert.ok(wrapper.includes('Meteor.startup'));
  assert.ok(wrapper.includes('WEKAN_SKIP_SCHEMA_UPGRADE'), 'opt-out env var exists');
  assert.ok(wrapper.includes("WebApp.handlers.get('/schema-upgrade-status'"), 'dashboard route registered');
  assert.ok(wrapper.includes('state.product'), 'dashboard uses the product name');
  assert.ok(/Deliberately NOT awaited/i.test(wrapper), 'upgrade must not block WeKan from serving');
  assert.ok(wrapper.includes("require('/package.json').version"), 'version for the release gate');
});

await test('the importer no longer stamps the flags that disabled the repair tools', () => {
  const importer = read('releases/migrate-mongodb-to-ferretdb.mjs');
  const fn = importer.match(/function upgradeBoard\(doc\) \{[\s\S]*?\n\}/)[0];
  assert.ok(!fn.includes('comprehensiveMigrationCompleted: true'));
  assert.ok(!fn.includes('fixMissingListsCompleted:        true'));
  assert.ok(fn.includes('migrationVersion: SCHEMA_VER'));
});

await test('speed: importer text phase batches with insertMany and only falls back per-document', () => {
  const importer = read('releases/migrate-mongodb-to-ferretdb.mjs');
  const flush = importer.match(/const flush = async \(\) => \{[\s\S]*?\n  \};/)[0];
  assert.ok(flush.includes('insertMany(batch, { ordered: false })'),
    'one round trip per batch — per-document replaceOne made big migrations take hours');
  assert.ok(flush.includes('replaceOne({ _id: doc._id }, doc, { upsert: true })'),
    'per-document fallback for resumed/re-run migrations still exists');
});

await test('speed: importer file phases use the preloaded target map, not per-file findOne', () => {
  const importer = read('releases/migrate-mongodb-to-ferretdb.mjs');
  assert.ok(importer.includes('async function getTgtRec(collName, id)'));
  assert.ok((importer.match(/await getTgtRec\(/g) || []).length >= 4,
    'CFS phase, FS-store phase, pass A and pass B all use the cache');
  assert.ok(importer.includes('TGT_PRELOAD_LIMIT'),
    'very large collections fall back to per-file lookups to bound memory');
});

console.log(`schemaUpgradeSteps.test.cjs: ${passed} tests passed`);
})().catch(e => { console.error('FAIL:', e); process.exit(1); });
