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
