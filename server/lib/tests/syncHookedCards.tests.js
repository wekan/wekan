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
import CustomFields from '/models/customFields';
const { createSyncHookedCards } = require('/server/lib/syncHookedCards');
const { prepareSyncOperationMutation } = require('/server/lib/syncOperationMutation');

// Run against the full app so the real schema, consistency and recording hooks
// are installed. Plain test mode deliberately does not claim this coverage.
describe('Sync hooked card adapter', function () {
  this.timeout(30000);
  it('keeps schema defaults and defers only the owning write, then records ordinary edits', async function () {
    if (!Meteor.isAppTest) this.skip();
    const userId=Random.id(),boardId=Random.id(),listId=Random.id(),swimlaneId=Random.id(),cardId=Random.id();
    const withActor=(actor,fn)=>DDP._CurrentMethodInvocation.withValue({userId:actor,isSimulation:false},fn);
    try {
      await Meteor.users.rawCollection().insertOne({_id:userId,username:'sync-hook-'+userId,profile:{}});
      await Boards.rawCollection().insertOne({_id:boardId,title:'Sync test',permission:'private',members:[{userId,isAdmin:true,isActive:true}],archived:false});
      await Swimlanes.rawCollection().insertOne({_id:swimlaneId,boardId,title:'Lane',type:'swimlane',archived:false,sort:0});
      await Lists.rawCollection().insertOne({_id:listId,boardId,swimlaneId,title:'List',archived:false,sort:0});
      // The planned card sets a value for the 'points' field, so the field has
      // to exist on this board: the admin-only-field guard (AdminFieldBleed)
      // rightly refuses a value for a field defined for no board.
      await CustomFields.rawCollection().insertOne({_id:'points',boardIds:[boardId],name:'Points',type:'number',settings:{},
        showOnCard:false,automaticallyOnCard:false,alwaysOnCard:false,showLabelOnMiniCard:false});
      const after={_id:cardId,boardId,listId,swimlaneId,title:'  Preserved  ',description:'',sort:0,archived:false};
      const creation={kind:'create',cardId,before:null,after};
      const writer=createSyncHookedCards({cards:Cards,step:creation,userId,withActor});
      await writer.insertOne(prepareSyncOperationMutation(creation).document);
      const saved=await Cards.findOneAsync(cardId);
      assert.equal(saved.title,after.title);assert.equal(saved.description,'');assert.equal(saved.userId,userId);
      assert.ok(saved.createdAt instanceof Date);assert.ok(saved.dateLastActivity instanceof Date);
      assert.equal(await Activities.find({cardId}).countAsync(),0);
      const step={kind:'update',cardId,before:after,after:{...after,title:'Updated'}};
      const mutation=prepareSyncOperationMutation(step),update=createSyncHookedCards({cards:Cards,step,userId,withActor});
      assert.equal((await update.updateOne(mutation.beforeSelector,mutation.modifier)).matchedCount,1);
      assert.equal(await ChangeHistory.find({cardId}).countAsync(),0);
      assert.equal(await Activities.find({cardId}).countAsync(),0);
      assert.equal((await update.updateOne(mutation.beforeSelector,mutation.modifier)).matchedCount,0);
      const beforeFields={...step.after,customFields:[]};
      const afterFields={...beforeFields,title:'Planned title',description:'Planned description',archived:true,
        archivedAt:new Date(),customFields:[{_id:'points',value:0}],
        syncLastSource:{estimate:0,estimateMapping:JSON.stringify(['points','customfield_1','points'])}};
      const fieldStep={kind:'archive',cardId,before:beforeFields,after:afterFields};
      const fieldMutation=prepareSyncOperationMutation(fieldStep);
      const fieldWriter=createSyncHookedCards({cards:Cards,step:fieldStep,userId,withActor});
      assert.equal((await fieldWriter.updateOne(fieldMutation.beforeSelector,fieldMutation.modifier)).matchedCount,1);
      assert.equal(await Activities.find({cardId}).countAsync(),0);
      assert.equal(await ChangeHistory.find({cardId}).countAsync(),0);
      const invalid={kind:'update',cardId,before:afterFields,after:{...afterFields,syncLastSource:{...afterFields.syncLastSource,spentTime:-1}}};
      const invalidMutation=prepareSyncOperationMutation(invalid);
      const invalidWriter=createSyncHookedCards({cards:Cards,step:invalid,userId,withActor});
      await assert.rejects(invalidWriter.updateOne(invalidMutation.beforeSelector,invalidMutation.modifier));
      assert.equal((await Cards.findOneAsync(cardId)).title,'Planned title');
      await withActor(userId,()=>Cards.updateAsync(cardId,{$set:{title:'Ordinary edit'}}));
      assert.equal(await Activities.find({cardId,activityType:'a-changedTitle'}).countAsync(),1);
      assert.equal(await ChangeHistory.find({cardId,group:'title'}).countAsync(),1);
    } finally {
      for(const collection of [Activities,ChangeHistory])await collection.rawCollection().deleteMany({cardId});
      await Cards.rawCollection().deleteMany({_id:cardId});
      await Lists.rawCollection().deleteMany({_id:listId});await Swimlanes.rawCollection().deleteMany({_id:swimlaneId});
      await Boards.rawCollection().deleteMany({_id:boardId});await Meteor.users.rawCollection().deleteMany({_id:userId});
      await CustomFields.rawCollection().deleteMany({_id:'points',boardIds:[boardId]});
    }
  });
});

const { prepareRulePlan } = require('/server/lib/syncRulePlan');
const { ensureRuleArchiveCommand } = require('/server/lib/syncRuleArchiveCommand');
const { applyRuleArchiveCommand } = require('/server/lib/syncRuleArchiveApply');
const { createRuleArchiveCards } = require('/server/lib/syncRuleArchiveCards');
describe('Stored archive hooked card adapter', function () {
  this.timeout(30000);
  it('archives a saved cascade through Cards and restores ordinary recording after interruption', async function () {
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
      f.preflightEffects = async () => {};
      f.completeEffects = async () => { throw Error('interrupted effects'); };
      await assert.rejects(applyRuleArchiveCommand(f), /interrupted effects/);
      assert.equal((await Cards.findOneAsync(child)).archived, true);
      assert.equal((await Cards.findOneAsync(root)).archived, false);
      assert.equal(await Activities.find({ cardId: { $in: ids } }).countAsync(), 0);
      assert.equal(await ChangeHistory.find({ cardId: { $in: ids } }).countAsync(), 0);
      const delivered = [];
      f.completeEffects = async ({ unit }) => { delivered.push(unit.cardId); return unit.effectId; };
      await applyRuleArchiveCommand(f);
      assert.deepEqual(delivered, [child, root]);
      for (const id of ids) {
        const card = await Cards.findOneAsync(id);
        assert.equal(card.archived, true); assert.equal(card.archivedAt.getTime(), 1000);
        assert.ok(card.dateLastActivity instanceof Date);
      }
      await assert.rejects(f.cards.updateOne({ _id: root }, { $set: { title: 'outside command' } }), /cards-invalid/);
      await withActor(userId, () => Cards.updateAsync(root, { $set: { archived: false } }));
      assert.equal(await Activities.find({ cardId: root, activityType: 'restoredCard' }).countAsync(), 1);
      assert.equal(await ChangeHistory.find({ cardId: root, group: 'lifecycle', userId }).countAsync(), 1);
    } finally {
      for (const collection of [Activities, ChangeHistory]) await collection.rawCollection().deleteMany({ cardId: { $in: ids } });
      await Cards.rawCollection().deleteMany({ _id: { $in: ids } });
      await Lists.rawCollection().deleteMany({ _id: listId }); await Swimlanes.rawCollection().deleteMany({ _id: swimlaneId });
      await Boards.rawCollection().deleteMany({ _id: boardId }); await Meteor.users.rawCollection().deleteMany({ _id: userId });
    }
  });
});
