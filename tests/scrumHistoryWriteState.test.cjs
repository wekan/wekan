'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { scrumHistoryWriteState: state } = require('../server/lib/scrumHistoryWriteState');
const { historyDocument } = require('../models/lib/scrumHistory');
for (const type of ['board', 'card', 'list', 'swimlane', 'scrum-sprint', 'scrum-release', 'scrum-event']) {
  test(`${type}: unchanged, pending and applied states require the operation's revision`, () => {
    const metadata = ['board', 'card', 'list', 'swimlane'].includes(type);
    const field = metadata ? 'scrumRevision' : 'revision';
    const current = { _id: 'item', boardId: 'board', [field]: 4, ...(metadata ? { scrum: { value: 'before' } } : { name: 'before' }) };
    const changed = { ...current, [field]: 5, ...(metadata ? { scrum: { value: 'after' } } : { name: 'after' }) };
    const before = historyDocument(type, current), after = historyDocument(type, changed);
    const options = { type, current, before, after, revision: 4 };
    assert.equal(state(options), 'pending');
    assert.equal(state({ ...options, current: changed }), 'applied');
    assert.equal(state({ ...options, after: before }), 'applied');
    for (const value of [4, 6, -1, '5', Number.NaN]) {
      assert.throws(() => state({ ...options, current: { ...changed, [field]: value } }), /revision conflict/);
    }
    assert.throws(() => state({ ...options, current: { ...current, [field]: 5 } }), /revision conflict/);
    assert.throws(() => state({ ...options, after: before, current: { ...current, [field]: 5 } }), /revision conflict/);
  });
}
test('creation/deletion and legacy revision zero distinguish acknowledged writes from later replacements', () => {
  const after = { _id: 'sprint', boardId: 'board', name: 'Restored', startsAt: new Date(0) };
  const options = { type: 'scrum-sprint', current: null, before: null, after, revision: null };
  assert.equal(state(options), 'pending');
  assert.equal(state({ ...options, current: { ...after, revision: 1 } }), 'applied');
  assert.throws(() => state({ ...options, current: { ...after, revision: 2 } }), /conflict/);
  assert.equal(state({ type: 'scrum-sprint', current: null, before: after, after: null, revision: 1 }), 'applied');
  assert.equal(state({ type: 'scrum-sprint', current: after, before: after, after: null, revision: 0 }), 'pending');
  assert.throws(() => state({ ...options, revision: 0 }), /conflict/);
});

const { verifyScrumHistoryWrites: verify } = require('../server/lib/scrumHistoryWriteState');
function verification() {
  const rows = [1, 2].map(i => ({ _id: `card-${i}`, boardId: 'board', scrum: { value: 'after' }, scrumRevision: 2 }));
  const targets = rows.map(row => ({ type: 'card', id: row._id, document: historyDocument('card', row) }));
  return { rows, options: { targets, before: targets.map(entry => ({ ...entry, document: { ...entry.document, scrum: {} } })),
    revisions: [1, 1], read: async entry => rows.find(row => row._id === entry.id), assertCurrent: async () => {} } };
}
test('confirmed batch readback rejects missing, unapplied and newer-revision values', async () => {
  await verify(verification().options);
  for (const damage of [f => { f.rows.pop(); }, f => { f.rows[1].scrum = {}; f.rows[1].scrumRevision = 1; },
    f => { f.rows[0].scrumRevision = 3; }]) {
    const f = verification(); damage(f); await assert.rejects(verify(f.options), /conflict/);
  }
});
test('batch readback retains failures and checks ownership after reads', async () => {
  const f = verification(); f.options.read = async () => { throw Error('read unavailable'); };
  await assert.rejects(verify(f.options), /read unavailable/);
  const g = verification(); let read = false;
  g.options.read = async entry => { read = true; return g.rows.find(row => row._id === entry.id); };
  g.options.assertCurrent = async () => { if (read) throw Error('ownership lost'); };
  await assert.rejects(verify(g.options), /ownership lost/);
  const h = verification(); h.options.before[1].id = 'other';
  await assert.rejects(verify(h.options), /conflict/);
});
test('read-only preflight accepts mixed pending/applied steps and rejects later conflicts before writes', async () => {
  const { inspectScrumHistoryWrites: inspect } = require('../server/lib/scrumHistoryWriteState');
  const f = verification();
  f.rows[0].scrum = {}; f.rows[0].scrumRevision = 1;
  assert.deepEqual(await inspect(f.options), ['pending', 'applied']);
  f.rows[1].scrumRevision = 3;
  let applied = false;
  await assert.rejects((async () => {
    await inspect(f.options); applied = true;
  })(), /conflict/);
  assert.equal(applied, false);
  assert.equal(f.rows[0].scrumRevision, 1);
  assert.deepEqual(f.rows[0].scrum, {});
});

// Incarnations (maintainer decision of 2026-09-30): matching values and
// revision do not prove a record is the one this operation planned against or
// created - one deleted and recreated under the same _id can match both.
const { plannedIncarnations } = require('../server/lib/scrumHistoryWriteState');
test('a record recreated under the same _id is not taken for the original', () => {
  const current = { _id: 's1', boardId: 'b', name: 'Sprint', revision: 3, incarnation: 'life-1' };
  const before = historyDocument('scrum-sprint', current);
  assert.equal(before.incarnation, undefined, 'History content never carries an incarnation');
  // Deleting it: pending while the planned lifetime is there...
  assert.equal(state({ type: 'scrum-sprint', current, before, after: null, revision: 3,
    incarnation: { before: 'life-1', after: null } }), 'pending');
  // ...but a same-looking record from ANOTHER lifetime must not be deleted (negative).
  assert.throws(() => state({ type: 'scrum-sprint', current: { ...current, incarnation: 'life-2' }, before,
    after: null, revision: 3, incarnation: { before: 'life-1', after: null } }), /revision conflict/);
  // Creating it: only the incarnation this operation chose counts as its insert.
  const created = { ...current, revision: 1, incarnation: 'planned' };
  const plan = { type: 'scrum-sprint', before: null, after: before, revision: null,
    incarnation: { before: null, after: 'planned' } };
  assert.equal(state({ ...plan, current: null }), 'pending');
  assert.equal(state({ ...plan, current: created }), 'applied');
  assert.throws(() => state({ ...plan, current: { ...created, incarnation: 'someone-else' } }), /revision conflict/);
  // An update keeps the same lifetime.
  const updated = { ...current, name: 'Renamed', revision: 4 };
  const change = { type: 'scrum-sprint', before, after: historyDocument('scrum-sprint', updated), revision: 3,
    incarnation: { before: 'life-1', after: 'life-1' } };
  assert.equal(state({ ...change, current: updated }), 'applied');
  assert.throws(() => state({ ...change, current: { ...updated, incarnation: 'life-9' } }), /revision conflict/);
});

test('checkpoints and records from before incarnations keep working; bad shapes are refused', () => {
  const legacy = { _id: 's1', boardId: 'b', name: 'Sprint', revision: 3 };
  const doc = historyDocument('scrum-sprint', legacy);
  assert.equal(state({ type: 'scrum-sprint', current: legacy, before: doc, after: null, revision: 3 }), 'pending',
    'a checkpoint without incarnations is judged as before');
  assert.equal(state({ type: 'scrum-sprint', current: legacy, before: doc, after: null, revision: 3,
    incarnation: { before: null, after: null } }), 'pending', 'a record without one is lifetime null');
  for (const incarnation of [null, {}, { before: 'x' }, { before: 1, after: null }, { before: '', after: null }]) {
    assert.throws(() => state({ type: 'scrum-sprint', current: legacy, before: doc, after: null, revision: 3, incarnation }), /revision conflict/);
  }
});

test('a new checkpoint plans the lifetime each target has and will have', () => {
  let n = 0;
  const planned = plannedIncarnations({ newId: () => `new-${++n}`,
    targets: [{ type: 'scrum-sprint', document: { name: 'x' } }, { type: 'scrum-release', document: null },
      { type: 'scrum-event', document: { name: 'y' } }, { type: 'card', document: { scrum: {} } }],
    current: [null, { incarnation: 'r-1' }, { incarnation: 'e-1' }, { _id: 'c' }] });
  assert.deepEqual(planned, [{ before: null, after: 'new-1' }, { before: 'r-1', after: null },
    { before: 'e-1', after: 'e-1' }, { before: null, after: null }]);
  assert.throws(() => plannedIncarnations({ targets: [{}], current: [], newId: () => 'x' }), /revision conflict/);
});

test('every place a Scrum record is created gives it a fresh incarnation', () => {
  const fs = require('node:fs'), path = require('node:path');
  const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
  assert.match(read('server/scrum.js'), /if \(!before\) \{[\s\S]*?after\.incarnation = Random\.id\(\);/);
  assert.match(read('server/lib/scrumTransferImport.js'), /revision: 1,\n\s*incarnation: Random\.id\(\),/);
  const history = read('server/lib/scrumHistory.js');
  assert.match(history, /incarnations: plannedIncarnations\(\{ targets, current, newId: \(\) => Random\.id\(\) \}\)/);
  assert.match(history, /\.\.\.\(incarnation\?\.after \? \{ incarnation: incarnation\.after \} : \{\}\)/);
  // Negative: an update never unsets it, although History content leaves it out.
  assert.match(history, /\['_id','revision','updatedAt','updatedBy','incarnation'\]\.includes\(key\)/);
  assert.doesNotMatch(read('models/lib/scrum.js'), /incarnation/, 'a client can not supply one');
});
