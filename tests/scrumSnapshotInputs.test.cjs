const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadScrumSnapshotInputs } = require('../server/lib/scrumSnapshotInputs');
const { sprintSnapshot, DEFAULT_SCRUM_SETTINGS, SCRUM_SNAPSHOT_LIMIT: limit } = require('../models/lib/scrum');
test('lifecycle reads are scoped, projected and include a rejection sentinel', async () => {
  for (const includeArchived of [false, true]) {
    const cards = { find(query, options) {
      assert.deepEqual(query, { boardId: 'b', 'scrum.sprintId': 's',
        ...(includeArchived ? {} : { archived: { $ne: true } }) });
      assert.equal(options.limit, limit + 1);
      assert.deepEqual(Object.keys(options.fields).sort(),
        ['listId','archived','dueComplete','poker.estimation','customFields','scrum','scrumRevision'].sort());
      return { fetchAsync: async () => Array.from({ length: options.limit }, () => ({ _id: 'c' })) };
    } };
    const lists = { find(query, options) {
      assert.deepEqual(query, { boardId: 'b' });
      assert.equal(options.limit, limit + 1);
      assert.deepEqual(options.fields, { scrum: 1 });
      return { fetchAsync: async () => [] };
    } };
    const input = await loadScrumSnapshotInputs({ cards, lists, boardId: 'b', sprintId: 's', includeArchived });
    assert.throws(() => sprintSnapshot(input.cards, DEFAULT_SCRUM_SETTINGS, input.lists), /snapshot limit/);
  }
});
test('the exact card/list boundary is complete and completion scans lists once', () => {
  let reads = 0;
  const lists = Array.from({ length: limit }, (_, i) => ({ _id: `l${i}`,
    get scrum() { reads++; return { category: i % 2 ? 'done' : 'todo' }; } }));
  const cards = Array.from({ length: limit }, (_, i) => ({ _id: `c${i}`, listId: `l${i}`, dueComplete: true }));
  const result = sprintSnapshot(cards, { ...DEFAULT_SCRUM_SETTINGS, completionPolicy: 'doneLists' }, lists);
  assert.equal(result.cards.length, limit);
  assert.equal(result.cards.filter(card => card.done).length, limit / 2);
  assert.equal(reads, limit);
  assert.throws(() => sprintSnapshot([], DEFAULT_SCRUM_SETTINGS, [...lists, { _id: 'extra' }]), /list limit/);
  const due = sprintSnapshot(cards, { ...DEFAULT_SCRUM_SETTINGS, completionPolicy: 'dueComplete' }, lists);
  assert.equal(due.cards.filter(card => card.done).length, limit);
  assert.equal(reads, limit); // the due-complete policy needs no list traversal
});
