'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { cardCreationActivity } = require('../models/lib/cardCreationActivity');
const { prepareSyncCreationActivity, validateSyncCreationActivity, persistSyncCreationActivity } = require('../server/lib/syncCreationActivity');
const card = { _id: 'card', boardId: 'board', listId: 'list', swimlaneId: 'lane', title: 'Title' };
const step = { kind: 'create', cardId: 'card', before: null, after: card };
const args = { step, effectId: 'a'.repeat(64), userId: 'user', createdAt: new Date(1000),
  list: { _id: 'list', boardId: 'board', title: 'List' }, swimlane: { _id: 'lane', boardId: 'board', title: 'Lane' } };
function fixture() {
  const rows = new Map(); let inserts = 0, deliveries = 0;
  const plan = prepareSyncCreationActivity(args);
  return { plan, rows, get inserts() { return inserts; }, get deliveries() { return deliveries; },
    assertCurrent: async () => {}, completeDelivery: async ({ effectId }) => { deliveries++; return effectId; },
    activities: { findOneAsync: async id => rows.get(id), insertAsync: async row => { inserts++; rows.set(row._id, row); } } };
}
test('ordinary creation and durable plans share the same activity payload and await insertion', async () => {
  const source = fs.readFileSync('models/cards.js', 'utf8'); const emitted = [];
  const context = { ReactiveCache: { getList: async () => args.list, getSwimlane: async () => args.swimlane },
    require: path => { assert.equal(path, './lib/cardCreationActivity'); return { cardCreationActivity }; },
    Activities: { insertAsync: async row => { await Promise.resolve(); emitted.push(row); } } };
  vm.runInNewContext(source.slice(source.indexOf('async function cardCreation('), source.indexOf('\nasync function cardRemover(')), context);
  await context.cardCreation('user', card);
  assert.deepEqual(emitted, [{ userId: 'user', activityType: 'createCard', boardId: 'board', listName: 'List',
    listId: 'list', cardId: 'card', cardTitle: 'Title', swimlaneName: 'Lane', swimlaneId: 'lane' }]);
  const plan = prepareSyncCreationActivity(args);
  assert.equal(validateSyncCreationActivity(plan, step, args.effectId), true);
  assert.deepEqual(plan.activity, { _id: `sync-create-${args.effectId}`, ...emitted[0], createdAt: args.createdAt, modifiedAt: args.createdAt });
});
test('creation plans reject foreign references, unexpected payloads and changed card/effect identities', () => {
  for (const overrides of [{ list: { ...args.list, boardId: 'foreign' } }, { swimlane: { ...args.swimlane, _id: 'other' } },
    { userId: '' }, { createdAt: new Date(NaN) }, { effectId: 'invalid' },
    { step: { ...step, kind: 'update', before: card } }, { list: { ...args.list, title: 'x'.repeat(1024 * 1024) } }]) {
    assert.throws(() => prepareSyncCreationActivity({ ...args, ...overrides }));
  }
  const plan = prepareSyncCreationActivity(args);
  assert.throws(() => validateSyncCreationActivity(plan, { ...step, after: { ...card, title: 'Changed' } }, args.effectId));
  assert.throws(() => validateSyncCreationActivity(plan, step, 'b'.repeat(64)));
  plan.activity.credential = 'not permitted';
  assert.throws(() => validateSyncCreationActivity(plan, step, args.effectId));
});
test('existing creation activities still require delivery receipts; lost inserts are verified', async () => {
  const f = fixture(); const insert = f.activities.insertAsync;
  f.activities.insertAsync = async row => { await insert(row); throw new Error('lost insert reply'); };
  f.completeDelivery = async () => { throw new Error('delivery interrupted'); };
  await assert.rejects(persistSyncCreationActivity(f), /delivery interrupted/);
  assert.equal(f.inserts, 1);
  f.completeDelivery = async () => 'wrong';
  await assert.rejects(persistSyncCreationActivity(f), /delivery-unconfirmed/);
  let deliveries = 0;
  f.completeDelivery = async ({ effectId, activity }) => { deliveries++; activity.cardTitle = 'mutation'; return effectId; };
  assert.equal(await persistSyncCreationActivity(f), args.effectId);
  assert.equal(await persistSyncCreationActivity(f), args.effectId);
  assert.equal(deliveries, 2); assert.equal(f.inserts, 1); assert.equal(f.plan.activity.cardTitle, 'Title');
});
test('false insert replies, collisions and lease loss never acknowledge delivery', async () => {
  for (const mode of ['missing', 'collision', 'lease']) {
    const f = fixture();
    if (mode === 'missing') f.activities.insertAsync = async () => 'ok';
    if (mode === 'collision') f.rows.set(f.plan.activity._id, { ...f.plan.activity, cardId: 'other' });
    if (mode === 'lease') { let guards = 0; f.assertCurrent = async () => { if (++guards === 3) throw new Error('lease lost'); }; }
    await assert.rejects(persistSyncCreationActivity(f), /unconfirmed|lease lost/);
    assert.equal(f.deliveries, 0);
  }
  await assert.rejects(persistSyncCreationActivity({ ...fixture(), completeDelivery: undefined }), /invalid/);
});
