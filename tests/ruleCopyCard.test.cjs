'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const activity = { cardId: 'card', boardId: 'source', userId: 'actor' };
const action = { actionType: 'copyCard', boardId: 'dest', listId: 'list', swimlaneId: 'lane' };
async function fixture() {
  const { copyRuleCard } = await import('../server/lib/ruleCopyCard.js');
  const boards = { source: { _id: 'source', write: true }, dest: { _id: 'dest', write: true } };
  const list = { _id: 'list', boardId: 'dest' }, lane = { _id: 'lane', boardId: 'dest' };
  const calls = [];
  const card = { _id: 'card', boardId: 'source', listId: 'old', sort: 3,
    async getSort(...args) { calls.push(['sort', ...args]); return 9; },
    async copy(...args) { calls.push(['copy', ...args, this.sort]); return 'new'; } };
  const cache = { getCard: async () => card, getBoard: async id => boards[id],
    getList: async id => id === 'list' ? list : null, getSwimlane: async id => id === 'lane' ? lane : null };
  const run = (a = action, event = activity) => copyRuleCard({ activity: event, action: a, cache, canWrite: (_, board) => board.write });
  return { run, card, boards, list, lane, calls };
}
test('copy action awaits the full existing copy and leaves the source unchanged', async () => {
  const f = await fixture();
  assert.equal(await f.run(), 'new');
  assert.deepEqual(f.calls, [['sort', 'list', 'lane', false], ['copy', 'dest', 'lane', 'list', 10]]);
  assert.equal(f.card.sort, 3); assert.equal(f.card.boardId, 'source'); assert.equal(f.card.listId, 'old');
  f.card.copy = async () => { throw new Error('copy failed'); };
  await assert.rejects(f.run(), /copy failed/);
});
test('denied, deleted, archived and forged placements do not copy', async () => {
  for (const mutate of [f => { f.boards.dest.write = false; }, f => { f.boards.source.write = false; },
    f => { delete f.boards.dest; }, f => { f.card.boardId = 'unrelated'; },
    f => { f.card.archived = true; }, f => { f.boards.dest.archived = true; },
    f => { f.list.boardId = 'foreign'; }, f => { f.list.archived = true; },
    f => { f.lane.boardId = 'foreign'; }, f => { f.lane.archived = true; }]) {
    const f = await fixture(); mutate(f); assert.equal(await f.run(), null); assert.deepEqual(f.calls, []);
  }
  const f = await fixture();
  assert.equal(await f.run({ ...action, listId: '' }), null);
  assert.equal(await f.run({ ...action, listId: 'missing' }), null);
  assert.equal(await f.run(action, { ...activity, userId: null }), null);
});
test('causal recursive copies stop but independent concurrent events still copy', async () => {
  const f = await fixture(); let count = 0;
  f.card.copy = async () => { count++; await new Promise(resolve => setImmediate(resolve)); assert.equal(await f.run(), null); return 'new'; };
  assert.deepEqual(await Promise.all([f.run(), f.run()]), ['new', 'new']);
  assert.equal(count, 2);
});
