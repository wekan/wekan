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
    const { binding } = await resolve(f); assert.equal(binding.version, 5);
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
  const legacy = structuredClone(binding); legacy.version = 1; delete legacy.visibility; delete legacy.linkedBoardVisibility; delete legacy.scrumVisibility; delete legacy.relatedSources; delete legacy.adminAccess; delete legacy.customFieldPolicies;
  validate(legacy, f.activity); // Before voting was added, no voter data could be captured.
  const previous = structuredClone(binding); previous.version = 2; delete previous.linkedBoardVisibility; delete previous.scrumVisibility; delete previous.relatedSources; delete previous.adminAccess; delete previous.customFieldPolicies;
  validate(previous, f.activity); // Version 2 had card voting, but no linked-board voting.
  const invalid = structuredClone(binding); invalid.linkedBoardVisibility = [true, true, false, null];
  assert.throws(() => validate(invalid, f.activity), /binding-invalid/);
});

test('linked-board voting policy is persisted independently of wrapper policy', async () => {
  const { assertRuleEmailSourceBinding: guard, validateRuleEmailSourceBinding: validate } = require('../server/lib/ruleEmailSource');
  for (const mutate of [f => { f.boards.foreign.vote.public = false; },
    f => { f.boards.foreign.poker.end = null; }, f => { f.boards.foreign.allowsVote = false; },
    f => { f.boards.foreign.allowsPoker = false; }]) {
    const f = fixture(); Object.assign(f.cards.link, { type: 'cardType-linkedBoard', linkedId: 'foreign' });
    Object.assign(f.boards.foreign, { vote: { public: true }, poker: { end: new Date('2020-01-01') } });
    const { binding } = await resolve(f); await guard({ ...f, binding });
    assert.deepEqual(binding.linkedBoardVisibility, [true, true, true, '2020-01-01T00:00:00.000Z']);
    const invalid = structuredClone(binding); invalid.linkedBoardVisibility = null;
    assert.throws(() => validate(invalid, f.activity), /binding-invalid/);
    mutate(f); await assert.rejects(guard({ ...f, binding }), /visibility-changed/);
  }
});
test('stored source evidence rechecks Scrum disclosure policy and validates its shape', async () => {
  const { assertRuleEmailSourceBinding: guard, validateRuleEmailSourceBinding: validate } = require('../server/lib/ruleEmailSource');
  const f = fixture(); f.boards.foreign.scrum = { visibility: { cardAcceptanceCriteria: true } };
  const { binding } = await resolve(f); await guard({ ...f, binding });
  f.boards.foreign.scrum.visibility.cardAcceptanceCriteria = false;
  await assert.rejects(guard({ ...f, binding }), /visibility-changed/);
  for (const mutate of [b => { delete b.scrumVisibility; }, b => { b.scrumVisibility.pop(); },
    b => { b.scrumVisibility[0][0] = 'true'; }, b => { b.scrumVisibility[0].push(false); }]) {
    const changed = structuredClone(binding); mutate(changed);
    assert.throws(() => validate(changed, f.activity), /binding-invalid/);
  }
  const previous = structuredClone(binding); previous.version = 3; delete previous.scrumVisibility; delete previous.relatedSources; delete previous.adminAccess; delete previous.customFieldPolicies;
  validate(previous, f.activity);
});
test('captured related sources remain bound after the reference is removed or retargeted', async () => {
  const { assertRuleEmailSourceBinding: guard } = require('../server/lib/ruleEmailSource');
  for (const change of [f => { f.boards.foreign.readable = false; },
    f => { f.cards.source.boardId = 'local'; }, f => { f.cards.source.deletedAt = new Date(); },
    f => { f.boards.foreign.members = [{ userId: 'reader', isActive: true, isReadAssignedOnly: true }]; }]) {
    const f = fixture(); f.cards.link.type = 'cardType-card';
    const root = await resolve(f), related = await resolve({ ...f, activity: { ...f.activity, cardId: 'source', boardId: 'foreign' } });
    root.addRelatedSource(related.binding); root.addRelatedSource(related.binding);
    assert.equal(root.binding.relatedSources.length, 1);
    await guard({ ...f, binding: structuredClone(root.binding), requireRelatedSources: true });
    change(f); await assert.rejects(root.assertCurrent(), /source-/);
  }
  const f = fixture(), source = await resolve(f), old = structuredClone(source.binding);
  old.version = 4; delete old.relatedSources; delete old.adminAccess; delete old.customFieldPolicies;
  await guard({ ...f, binding: old });
  await assert.rejects(guard({ ...f, binding: old, requireRelatedSources: true }), /binding-required/);
});
test('related source evidence cannot contain recursive chains or malformed scopes', async () => {
  const { validateRuleEmailSourceBinding: validate } = require('../server/lib/ruleEmailSource');
  const f = fixture(), root = await resolve(f);
  for (const row of [root.binding, { version: 4, cards: [] }, null]) {
    const invalid = structuredClone(root.binding); invalid.relatedSources = [row];
    assert.throws(() => validate(invalid, f.activity), /binding-invalid/);
  }
});

test('a stored snapshot prepared with board-admin access stops after that access is revoked', async () => {
  const f = fixture(); let admin = true; f.boards.foreign.hasAdmin = () => admin;
  const source = await resolve(f); await source.assertCurrent();
  admin = false; await assert.rejects(source.assertCurrent(), /not-authorized/);
});

test('captured custom-field policy rejects later public-to-admin changes', async () => {
  const f = fixture(); const definitions = [{ _id: 'field', boardIds: ['foreign'], adminOnly: false }];
  f.cache.getCustomFields = async () => definitions;
  const source = await resolve(f); source.addCustomFieldPolicy('foreign', definitions);
  await source.assertCurrent(); definitions[0].adminOnly = true;
  await assert.rejects(source.assertCurrent(), /field-policy-changed/);
});
