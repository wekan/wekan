'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resolveRuleEmailSource: resolve } = require('../server/lib/ruleEmailSource');
function fixture() {
  const f = { activity: { cardId: 'link', boardId: 'local', userId: 'reader' },
    cards: { link: { _id: 'link', boardId: 'local', type: 'cardType-linkedCard', linkedId: 'source', description: 'STALE' },
      source: { _id: 'source', boardId: 'foreign', title: 'Live title', description: 'Live description' } },
    boards: { local: { readable: true }, foreign: { readable: true, members: [] } } };
  f.cache = { getCard: async id => f.cards[id], getBoard: async id => f.boards[id] };
  f.canReadBoard = (_, board) => !!board?.readable;
  return f;
}
test('uses current source card and board for all email sections while retaining actor context', async () => {
  const f = fixture(), context = await resolve(f);
  assert.equal(context.card.description, 'Live description');
  assert.deepEqual(context.activity, { cardId: 'source', boardId: 'foreign', userId: 'reader' });
  await context.assertCurrent(); assert.equal(f.cards.link.description, 'STALE');
});
test('missing, private, unassigned, deleted, cyclic and retargeted sources are refused', async () => {
  for (const mutate of [f => { delete f.cards.source; }, f => { f.boards.foreign.readable = false; },
    f => { f.boards.local.readable = false; }, f => { f.cards.source.deletedAt = new Date(); },
    f => { f.cards.source = { ...f.cards.source, type: 'cardType-linkedCard', linkedId: 'link' }; },
    f => { f.boards.foreign.members = [{ userId: 'reader', isActive: true, isReadAssignedOnly: true }]; }]) {
    const f = fixture(); mutate(f); await assert.rejects(resolve(f), /source-/);
  }
  const f = fixture(), context = await resolve(f); f.cards.link.linkedId = 'other';
  await assert.rejects(context.assertCurrent(), /changed/);
});
test('all link-chain permissions are rechecked after asynchronous preparation', async () => {
  for (const board of ['local', 'foreign']) {
    const f = fixture(), context = await resolve(f); f.boards[board].readable = false;
    await assert.rejects(context.assertCurrent(), /not-authorized/);
  }
});
test('linked boards replace stale public display fields but keep wrapper-owned children', async () => {
  const f = fixture(); Object.assign(f.cards.link, { type: 'cardType-linkedBoard', linkedId: 'foreign' });
  Object.assign(f.boards.foreign, { title: 'Live board', description: 'Board description', dueAt: new Date('2027-01-01') });
  const context = await resolve(f);
  assert.equal(context.card.title, 'Live board'); assert.equal(context.card.description, 'Board description');
  assert.equal(context.activity.cardId, 'link'); await context.assertCurrent();
  f.boards.foreign.readable = false; await assert.rejects(context.assertCurrent(), /not-authorized/);
});

test('stored commands refuse unbound links, including after an ordinary card becomes a link', async () => {
  const { requireBoundStoredEmailSource: guard } = require('../server/lib/ruleEmailSource');
  const f = fixture();
  await assert.rejects(guard(f.activity, f.cache), /binding-required/);
  f.cards.link.type = 'cardType-card'; await guard(f.activity, f.cache);
  f.cards.link.type = 'cardType-linkedBoard'; await assert.rejects(guard(f.activity, f.cache), /binding-required/);
  f.cards.link.deletedAt = new Date(); await assert.rejects(guard(f.activity, f.cache), /not-authorized/);
});
