const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadScrumSnapshotInputs } = require('../server/lib/scrumSnapshotInputs');
const scrum = require('../models/lib/scrum');
const { sprintSnapshot, DEFAULT_SCRUM_SETTINGS } = scrum;
// Sprints have no card cap (maintainer decision of 2026-10-03): the rows are
// stored in chunks (server/lib/scrumSnapshotStore.js). Past the old limit.
const limit = 20000;
test('lifecycle reads are scoped, projected and read every card and list', async () => {
  for (const includeArchived of [false, true]) {
    const cards = { find(query, options) {
      assert.deepEqual(query, { boardId: 'b', 'scrum.sprintId': 's',
        ...(includeArchived ? {} : { archived: { $ne: true } }) });
      assert.equal('limit' in options, false);
      assert.deepEqual(Object.keys(options.fields).sort(),
        ['listId','archived','dueComplete','poker.estimation','customFields','scrum','scrumRevision'].sort());
      return { fetchAsync: async () => Array.from({ length: limit + 1 }, (_, i) => ({ _id: `c${i}` })) };
    } };
    const lists = { find(query, options) {
      assert.deepEqual(query, { boardId: 'b' });
      assert.equal('limit' in options, false);
      assert.deepEqual(options.fields, { scrum: 1 });
      return { fetchAsync: async () => [] };
    } };
    const input = await loadScrumSnapshotInputs({ cards, lists, boardId: 'b', sprintId: 's', includeArchived });
    assert.equal(sprintSnapshot(input.cards, DEFAULT_SCRUM_SETTINGS, input.lists).cards.length, limit + 1);
  }
});
test('a sprint past the old 10,000 limit is complete and completion scans lists once', () => {
  let reads = 0;
  const lists = Array.from({ length: limit }, (_, i) => ({ _id: `l${i}`,
    get scrum() { reads++; return { category: i % 2 ? 'done' : 'todo' }; } }));
  const cards = Array.from({ length: limit }, (_, i) => ({ _id: `c${i}`, listId: `l${i}`, dueComplete: true }));
  const result = sprintSnapshot(cards, { ...DEFAULT_SCRUM_SETTINGS, completionPolicy: 'doneLists' }, lists);
  assert.equal(result.cards.length, limit);
  assert.equal(result.cards.filter(card => card.done).length, limit / 2);
  assert.equal(reads, limit);
  // Negative: no cap is left to refuse a large sprint or board.
  assert.equal('SCRUM_SNAPSHOT_LIMIT' in scrum, false);
  assert.equal(sprintSnapshot([], DEFAULT_SCRUM_SETTINGS, [...lists, { _id: 'extra' }]).cards.length, 0);
  const due = sprintSnapshot(cards, { ...DEFAULT_SCRUM_SETTINGS, completionPolicy: 'dueComplete' }, lists);
  assert.equal(due.cards.filter(card => card.done).length, limit);
  assert.equal(reads, limit); // the due-complete policy needs no list traversal
});
