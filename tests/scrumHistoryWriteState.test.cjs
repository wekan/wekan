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
