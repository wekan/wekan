import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import Cards from '/models/cards';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Activities from '/models/activities';
import ChangeHistory from '/models/changeHistory';

const { prepareRulePlan } = require('/server/lib/syncRulePlan');
const { ensureRuleArchiveCommand } = require('/server/lib/syncRuleArchiveCommand');
const { applyRuleArchiveEffects, prepareRuleArchiveEffects } = require('/server/lib/syncRuleArchiveEffects');
const { createRuleArchiveActivities } = require('/server/lib/syncRuleArchiveActivities');
const { createRuleArchiveCards } = require('/server/lib/syncRuleArchiveCards');
describe('Stored archive collection effects', function () {
  this.timeout(30000);
  it('resumes real History and activity insertion without duplicate hooks or rows', async function () {
    if (!Meteor.isAppTest) this.skip();
    const userId = Random.id(), boardId = Random.id(), listId = Random.id(), swimlaneId = Random.id();
    const root = Random.id(), child = Random.id(), ids = [root, child];
    const withActor = (actor, fn) => DDP._CurrentMethodInvocation.withValue({ userId: actor, isSimulation: false }, fn);
    try {
      await Meteor.users.rawCollection().insertOne({ _id: userId, username: `archive-${userId}`, profile: {} });
      await Boards.rawCollection().insertOne({ _id: boardId, title: 'Archive test', permission: 'private',
        members: [{ userId, isAdmin: true, isActive: true }], archived: false });
      await Lists.rawCollection().insertOne({ _id: listId, boardId, swimlaneId, title: 'List', archived: false, sort: 0 });
      await Swimlanes.rawCollection().insertOne({ _id: swimlaneId, boardId, title: 'Lane', type: 'swimlane', archived: false, sort: 0 });
      for (const _id of ids) await Cards.rawCollection().insertOne({ _id, boardId, listId, swimlaneId,
        title: _id, archived: false, sort: 0, ...(_id === child ? { parentId: root } : {}) });
      const f = { activity: { _id: Random.id(), boardId, cardId: root, userId }, effectId: 'c'.repeat(64), index: 0,
        assertCurrent: async () => {}, assertCard: async () => {}, withActor };
      f.plan = await prepareRulePlan({ ...f,
        selectRules: async () => [{ _id: 'rule', boardId, triggerId: 'trigger', actionId: 'action' }],
        readAction: async () => ({ _id: 'action', actionType: 'archive' }) });
      let saved;
      f.command = await ensureRuleArchiveCommand({ ...f, commands: { findOne: async () => saved,
        insertOne: async row => { saved = row; } }, readCard: id => Cards.findOneAsync(id, { transform: null }),
        readChildren: parentId => Cards.find({ parentId }, { transform: null }).fetchAsync(), now: () => new Date(1000) });
      f.cards = createRuleArchiveCards({ ...f, cards: Cards });
      const receipts = new Map();
      f.receipts = { findOne: async ({ _id }) => receipts.get(_id), insertOne: async row => { receipts.set(row._id, row); } };
      f.policy = { activities: true, notifications: true };
      f.effects = prepareRuleArchiveEffects({ ...f, username: 'Saved author',
        lists: [{ _id: listId, boardId, title: 'Saved list' }] });
      f.history = ChangeHistory;
      f.activities = createRuleArchiveActivities({ ...f, activities: Activities });
      f.readPolicy = async () => f.policy;
      f.completeDelivery = async () => { throw Error('interrupted effects'); };
      await assert.rejects(applyRuleArchiveEffects(f), /interrupted effects/);
      assert.equal((await Cards.findOneAsync(child)).archived, true);
      assert.equal((await Cards.findOneAsync(root)).archived, false);
      assert.equal(await Activities.find({ cardId: { $in: ids } }).countAsync(), 1);
      assert.equal(await ChangeHistory.find({ cardId: { $in: ids } }).countAsync(), 1);
      const delivered = [];
      f.completeDelivery = async ({ activity, effectId }) => { delivered.push(activity.cardId); return effectId; };
      await applyRuleArchiveEffects(f);
      assert.deepEqual(delivered, [child, root]);
      assert.equal(await Activities.find({ cardId: { $in: ids } }).countAsync(), 2);
      assert.equal(await ChangeHistory.find({ cardId: { $in: ids } }).countAsync(), 2);
      for (const row of f.effects.rows) {
        const expected = row.activities.rows[0].activity;
        assert.deepEqual(await Activities.findOneAsync(expected._id, { transform: null }), expected);
      }
      await applyRuleArchiveEffects(f);
      assert.equal(delivered.length, 2);
      assert.equal(await Activities.find({ cardId: { $in: ids } }).countAsync(), 2);
      for (const id of ids) {
        const card = await Cards.findOneAsync(id);
        assert.equal(card.archived, true); assert.equal(card.archivedAt.getTime(), 1000);
        assert.ok(card.dateLastActivity instanceof Date);
      }
      await assert.rejects(f.cards.updateOne({ _id: root }, { $set: { title: 'outside command' } }), /cards-invalid/);
      await withActor(userId, () => Cards.updateAsync(root, { $set: { archived: false } }));
      assert.equal(await Activities.find({ cardId: root, activityType: 'restoredCard' }).countAsync(), 1);
      assert.equal(await ChangeHistory.find({ cardId: root, group: 'lifecycle', userId }).countAsync(), 2);
    } finally {
      for (const collection of [Activities, ChangeHistory]) await collection.rawCollection().deleteMany({ cardId: { $in: ids } });
      await Cards.rawCollection().deleteMany({ _id: { $in: ids } });
      await Lists.rawCollection().deleteMany({ _id: listId }); await Swimlanes.rawCollection().deleteMany({ _id: swimlaneId });
      await Boards.rawCollection().deleteMany({ _id: boardId }); await Meteor.users.rawCollection().deleteMany({ _id: userId });
    }
  });
});
