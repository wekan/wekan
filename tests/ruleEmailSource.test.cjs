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

test('stored bindings recheck topology and access rather than resolving a replacement source', async () => {
  const { assertRuleEmailSourceBinding: guard } = require('../server/lib/ruleEmailSource');
  for (const mutate of [f => { f.cards.link.linkedId = 'other'; },
    f => { f.cards.link.type = 'cardType-card'; }, f => { f.cards.source.boardId = 'local'; },
    f => { f.cards.source.deletedAt = new Date(); }, f => { delete f.cards.source; },
    f => { f.boards.local.readable = false; }, f => { f.boards.foreign.readable = false; },
    f => { f.boards.foreign.members = [{ userId: 'reader', isActive: true, isReadAssignedOnly: true }]; }]) {
    const f = fixture(), { binding } = await resolve(f);
    await guard({ ...f, binding: structuredClone(binding) });
    mutate(f); await assert.rejects(guard({ ...f, binding }), /source-/);
  }
  const f = fixture();
  await assert.rejects(guard(f), /binding-required/);
  f.cards.link.type = 'cardType-card';
  await assert.rejects(guard(f), /binding-required/); // Legacy ordinary mail has no source evidence either.
  const { binding } = await resolve(f); await guard({ ...f, binding });
  f.cards.link.type = 'cardType-linkedCard'; await assert.rejects(guard({ ...f, binding }), /changed/);
});
test('saved bindings reject unknown fields, wrong roots, cycles and incomplete chains', async () => {
  const { validateRuleEmailSourceBinding: validate } = require('../server/lib/ruleEmailSource');
  const f = fixture(), { binding } = await resolve(f);
  for (const mutate of [b => { b.version = 99; }, b => { b.extra = true; },
    b => { b.cards = []; }, b => { b.cards[0][0] = 'other'; }, b => { b.cards[0][1] = 'other'; },
    b => { b.cards[0][2] = 'cardType-card'; }, b => { b.cards[0][3] = 'other'; },
    b => { b.cards.pop(); }, b => { b.cards.push(b.cards[0]); },
    b => { b.cards[1][2] = 'cardType-linkedBoard'; }, b => { b.linkedBoardId = 'foreign'; },
    b => { b.cards[1].push('extra'); }]) {
    const changed = structuredClone(binding); mutate(changed);
    assert.throws(() => validate(changed, f.activity), /binding-invalid/);
  }
});
test('stored board bindings require the same board and its current read permission', async () => {
  const { assertRuleEmailSourceBinding: guard } = require('../server/lib/ruleEmailSource');
  const f = fixture(); f.cards.link.type = 'cardType-linkedBoard'; f.cards.link.linkedId = 'foreign';
  const { binding } = await resolve(f); await guard({ ...f, binding });
  assert.equal(binding.linkedBoardId, 'foreign');
  f.boards.foreign.readable = false; await assert.rejects(guard({ ...f, binding }), /not-authorized/);
  f.boards.foreign.readable = true; f.cards.link.linkedId = 'local';
  await assert.rejects(guard({ ...f, binding }), /changed/);
});

test('stored source evidence rejects revoked public voting, reopened poker and hidden sections', async () => {
  const { assertRuleEmailSourceBinding: guard } = require('../server/lib/ruleEmailSource');
  for (const mutate of [f => { f.cards.source.vote.public = false; },
    f => { f.cards.source.poker.end = null; }, f => { f.boards.foreign.allowsVote = false; },
    f => { f.boards.foreign.allowsPoker = false; }]) {
    const f = fixture(); f.cards.source.vote = { public: true };
    f.cards.source.poker = { end: new Date('2020-01-01') };
    const { binding } = await resolve(f); assert.equal(binding.version, 2);
    await guard({ ...f, binding }); mutate(f);
    await assert.rejects(guard({ ...f, binding }), /visibility-changed/);
  }
});
test('visibility binding schema cannot omit or coerce disclosure policy', async () => {
  const { validateRuleEmailSourceBinding: validate } = require('../server/lib/ruleEmailSource');
  const f = fixture(), { binding } = await resolve(f);
  for (const mutate of [b => { delete b.visibility; }, b => { b.visibility.pop(); },
    b => { b.visibility[0][0] = 'true'; }, b => { b.visibility[0][3] = 'invalid'; },
    b => { b.visibility[0].push('extra'); }]) {
    const changed = structuredClone(binding); mutate(changed);
    assert.throws(() => validate(changed, f.activity), /binding-invalid/);
  }
  const legacy = structuredClone(binding); legacy.version = 1; delete legacy.visibility;
  validate(legacy, f.activity); // Before voting was added, no voter data could be captured.
});
