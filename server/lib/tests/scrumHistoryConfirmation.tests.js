import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import ChangeHistory from '/models/changeHistory';
import ScrumHistoryPending, { ScrumHistoryCompletions } from '/server/lib/scrumHistoryPending';
import { HistoryWriterGates } from '/server/lib/storedHistoryChain';
import { applyScrumHistory } from '/server/lib/scrumHistory';
const { historyDocument } = require('/models/lib/scrumHistory');
const { finishScrumHistory } = require('/server/lib/scrumHistoryFinalizer');

describe('Scrum History write confirmation', function () {
  this.timeout(15000);
  it('preflights the complete batch and retains recovery after false replies or raced moves', async function () {
    if (!Meteor.isAppTest) this.skip();
    const userId = Random.id(), boardId = Random.id(), cardId = Random.id(), secondId = Random.id(), listId = Random.id(), swimlaneId = Random.id();
    const originalUpdate = Cards.updateAsync;
    const originalRemove = ScrumHistoryPending.removeAsync;
    const originalFind = ScrumHistoryPending.findOneAsync;
    const actor = fn => DDP._CurrentMethodInvocation.withValue({ userId, isSimulation: false }, fn);
    try {
      await Meteor.users.rawCollection().insertOne({ _id: userId, username: `confirm-${userId}`, profile: {} });
      await Boards.rawCollection().insertOne({ _id: boardId, title: 'Confirmation', permission: 'private', archived: false,
        members: [{ userId, isAdmin: true, isActive: true }] });
      await Lists.rawCollection().insertOne({ _id: listId, boardId, swimlaneId, title: 'List', archived: false, sort: 0 });
      await Swimlanes.rawCollection().insertOne({ _id: swimlaneId, boardId, title: 'Lane', type: 'swimlane', archived: false, sort: 0 });
      const card = { _id: cardId, boardId, listId, swimlaneId, title: 'Card', archived: false,
        sort: 0, scrum: { issueType: 'Story' }, scrumRevision: 1 };
      const cards = [card, { ...card, _id: secondId, title: 'Second card' }];
      await Cards.rawCollection().insertMany(cards);
      const previousContent = { records: cards.map(item => ({ type: 'card', id: item._id,
        document: historyDocument('card', { ...item, scrum: {} }) })) };
      const newContent = { records: cards.map(item => ({ type: 'card', id: item._id, document: historyDocument('card', item) })) };
      const id = await ChangeHistory.record({ boardId, cardId, listId, swimlaneId, userId,
        entityType: 'scrum', entityId: cardId, group: 'scrum', changeType: 'edited', previousContent, newContent });
      const row = await ChangeHistory.findOneAsync(id);
      // Simulate an adapter/hook reporting success without the intended write.
      Cards.updateAsync = async function (query, modifier, ...args) {
        if (query?._id === cardId && modifier?.$set?.scrum) return 1;
        return originalUpdate.call(this, query, modifier, ...args);
      };
      await assert.rejects(actor(() => applyScrumHistory(row, previousContent, 'undo')), /scrum-conflict/);
      const journal = await ScrumHistoryPending.findOneAsync(boardId);
      assert.ok(journal?.operationId);
      assert.equal((await Cards.findOneAsync(cardId)).scrum.issueType, 'Story');
      assert.equal((await ChangeHistory.findOneAsync(id)).undone, false);
      assert.equal(await ChangeHistory.find({ boardId, restoredFromId: id }).countAsync(), 0);
      // Move without changing scrumRevision after the read/permission checks,
      // immediately before the actual conditional write reaches storage.
      const movedBoard = Random.id();
      Cards.updateAsync = async function (query, modifier, ...args) {
        if (query?._id === cardId && modifier?.$set?.scrum) {
          await Cards.rawCollection().updateOne({ _id: cardId }, { $set: { boardId: movedBoard } });
        }
        return originalUpdate.call(this, query, modifier, ...args);
      };
      await assert.rejects(actor(() => applyScrumHistory(row, previousContent, 'undo')), /scrum-conflict/);
      const moved = await Cards.findOneAsync(cardId);
      assert.equal(moved.boardId, movedBoard); assert.equal(moved.scrum.issueType, 'Story');
      assert.equal(moved.scrumRevision, 1);
      assert.equal((await ScrumHistoryPending.findOneAsync(boardId)).operationId, journal.operationId);
      assert.equal(await ChangeHistory.find({ boardId, restoredFromId: id }).countAsync(), 0);
      // Restore only the isolated test fixture to permit the original retry.
      await Cards.rawCollection().updateOne({ _id: cardId }, { $set: { boardId } });
      Cards.updateAsync = originalUpdate;
      // The second target already conflicts on retry. Do not apply the first
      // target before discovering it, even though that first write is valid.
      await Cards.rawCollection().updateOne({ _id: secondId }, { $inc: { scrumRevision: 1 } });
      await assert.rejects(actor(() => applyScrumHistory(row, previousContent, 'undo')), /scrum-conflict/);
      const untouched = await Cards.findOneAsync(cardId);
      assert.equal(untouched.scrum.issueType, 'Story'); assert.equal(untouched.scrumRevision, 1);
      assert.equal((await ScrumHistoryPending.findOneAsync(boardId)).operationId, journal.operationId);
      assert.equal(await ChangeHistory.find({ boardId, restoredFromId: id }).countAsync(), 0);
      // Reset only the isolated fixture, then prove valid recovery still works.
      await Cards.rawCollection().updateOne({ _id: secondId }, { $set: { scrumRevision: 1 } });
      // A success reply without deletion must not acknowledge completion.
      ScrumHistoryPending.removeAsync = async () => 1;
      await assert.rejects(actor(() => applyScrumHistory(row, previousContent, 'undo')), /scrum-history-pending/);
      assert.equal((await ScrumHistoryPending.findOneAsync(boardId)).operationId, journal.operationId);
      assert.equal((await ChangeHistory.findOneAsync(id)).undone, true);
      const receipt = await ScrumHistoryCompletions.findOneAsync(journal.operationId);
      assert.equal(receipt.rowId, id); assert.equal(receipt.userId, userId);
      const firstUndoneAt = (await ChangeHistory.findOneAsync(id)).undoneAt;
      // The inverse failure is also possible: storage succeeds, reply is lost.
      ScrumHistoryPending.removeAsync = async function (...args) {
        await originalRemove.apply(this, args);
        ScrumHistoryPending.findOneAsync = async () => { throw new Error('cleanup read unavailable'); };
        throw new Error('lost cleanup reply');
      };
      await assert.rejects(actor(() => applyScrumHistory(row, previousContent, 'undo')), /scrum-history-pending/);
      ScrumHistoryPending.findOneAsync = originalFind;
      // Resume the original finalizer from its durable identity, after its
      // checkpoint was removed. The public stack methods still need caller IDs.
      await finishScrumHistory({ history: ChangeHistory, pending: ScrumHistoryPending,
        completions: ScrumHistoryCompletions, row, journal });
      assert.deepEqual((await ChangeHistory.findOneAsync(id)).undoneAt, firstUndoneAt);
      assert.deepEqual((await Cards.findOneAsync(secondId)).scrum, {});
      assert.equal((await Cards.findOneAsync(secondId)).scrumRevision, 2);
      assert.deepEqual((await Cards.findOneAsync(cardId)).scrum, {});
      assert.equal((await Cards.findOneAsync(cardId)).scrumRevision, 2);
      assert.equal((await ChangeHistory.findOneAsync(id)).undone, true);
      assert.equal(await ScrumHistoryPending.findOneAsync(boardId), undefined);
      const restored = await ChangeHistory.find({ boardId, restoredFromId: id }).fetchAsync();
      assert.equal(restored.length, 1); assert.equal(restored[0].batchId, journal.operationId);
      assert.deepEqual(await ScrumHistoryCompletions.findOneAsync(journal.operationId), receipt);
    } finally {
      Cards.updateAsync = originalUpdate;
      ScrumHistoryPending.removeAsync = originalRemove;
      ScrumHistoryPending.findOneAsync = originalFind;
      await ScrumHistoryPending.rawCollection().deleteMany({ _id: boardId });
      await ScrumHistoryCompletions.rawCollection().deleteMany({ boardId });
      await ChangeHistory.rawCollection().deleteMany({ boardId });
      await HistoryWriterGates.rawCollection().deleteMany({ boardId });
      await Cards.rawCollection().deleteMany({ _id: { $in: [cardId, secondId] } });
      await Lists.rawCollection().deleteMany({ boardId });
      await Swimlanes.rawCollection().deleteMany({ boardId });
      await Boards.rawCollection().deleteMany({ _id: boardId });
      await Meteor.users.rawCollection().deleteMany({ _id: userId });
    }
  });
});

describe('Scrum History request replay', function () {
  this.timeout(15000);
  it('reuses the original request after uncertain cleanup and refuses revoked access or missing intent', async function () {
    if (!Meteor.isAppTest) this.skip();
    const userId=Random.id(),boardId=Random.id(),cardId=Random.id(),listId=Random.id(),swimlaneId=Random.id();
    const originalRemove=ScrumHistoryPending.removeAsync, originalFind=ScrumHistoryPending.findOneAsync;
    const { ScrumHistoryRequests } = require('/server/lib/scrumHistoryPending');
    const context={userId,isSimulation:false};
    const invoke=(method,...args)=>DDP._CurrentMethodInvocation.withValue(context,
      ()=>Meteor.server.method_handlers[method].apply(context,args));
    const undoId=Random.id(),redoId=Random.id();
    try {
      await Meteor.users.rawCollection().insertOne({_id:userId,username:`request-${userId}`,profile:{}});
      await Boards.rawCollection().insertOne({_id:boardId,title:'Request recovery',permission:'private',archived:false,
        members:[{userId,isAdmin:true,isActive:true}]});
      await Lists.rawCollection().insertOne({_id:listId,boardId,swimlaneId,title:'List',archived:false,sort:0});
      await Swimlanes.rawCollection().insertOne({_id:swimlaneId,boardId,title:'Lane',type:'swimlane',archived:false,sort:0});
      const card={_id:cardId,boardId,listId,swimlaneId,title:'Card',archived:false,sort:0,
        scrum:{issueType:'Story'},scrumRevision:1};
      await Cards.rawCollection().insertOne(card);
      const previousContent={records:[{type:'card',id:cardId,document:historyDocument('card',{...card,scrum:{}})}]};
      const newContent={records:[{type:'card',id:cardId,document:historyDocument('card',card)}]};
      const rowId=await ChangeHistory.record({boardId,cardId,listId,swimlaneId,userId,
        entityType:'scrum',entityId:cardId,group:'scrum',changeType:'edited',previousContent,newContent});
      let failRead=false;
      ScrumHistoryPending.removeAsync=async function(...args){
        await originalRemove.apply(this,args);failRead=true;throw new Error('lost cleanup reply');
      };
      ScrumHistoryPending.findOneAsync=async function(...args){
        if(failRead){failRead=false;throw new Error('lost cleanup read');}
        return originalFind.apply(this,args);
      };
      await assert.rejects(invoke('changeHistory.undoLast',boardId,undoId),/scrum-history-pending/);
      ScrumHistoryPending.removeAsync=originalRemove;ScrumHistoryPending.findOneAsync=originalFind;
      const request=await ScrumHistoryRequests.findOneAsync({boardId});
      assert.equal(request.selection.rowId,rowId);
      const receipt=await ScrumHistoryCompletions.findOneAsync(request._id);
      assert.ok(receipt);assert.equal(await ScrumHistoryPending.findOneAsync(boardId),undefined);
      const result=await invoke('changeHistory.undoLast',boardId,undoId);
      assert.equal(result.undone,true);
      const undoneRevision=(await Cards.findOneAsync(cardId)).scrumRevision;
      const outcomes=await Promise.all(Array.from({length:4},()=>invoke('changeHistory.undoLast',boardId,undoId)));
      for(const outcome of outcomes)assert.deepEqual(outcome,result);
      assert.equal((await Cards.findOneAsync(cardId)).scrumRevision,undoneRevision);
      const redos=await Promise.all(Array.from({length:4},()=>invoke('changeHistory.redoLast',boardId,redoId)));
      for(const redo of redos)assert.equal(redo.redone,true);
      const afterRedo=await Cards.findOneAsync(cardId);
      assert.equal(afterRedo.scrum.issueType,'Story');
      assert.equal(afterRedo.scrumRevision,undoneRevision+1);
      assert.deepEqual(await invoke('changeHistory.undoLast',boardId,undoId),result);
      assert.equal((await Cards.findOneAsync(cardId)).scrumRevision,afterRedo.scrumRevision);
      assert.equal((await ChangeHistory.findOneAsync(rowId)).undone,false);
      await Boards.rawCollection().updateOne({_id:boardId},{$set:{members:[]}});
      await assert.rejects(invoke('changeHistory.undoLast',boardId,undoId),/not-authorized/);
      await Boards.rawCollection().updateOne({_id:boardId},{$set:{members:[{userId,isAdmin:true,isActive:true}]}});
      await ScrumHistoryRequests.rawCollection().deleteOne({_id:request._id});
      await assert.rejects(invoke('changeHistory.undoLast',boardId,undoId),/scrum-history-request-conflict/);
      assert.deepEqual(await ScrumHistoryCompletions.findOneAsync(request._id),receipt);
      assert.equal((await Cards.findOneAsync(cardId)).scrumRevision,afterRedo.scrumRevision);
    } finally {
      ScrumHistoryPending.removeAsync=originalRemove;ScrumHistoryPending.findOneAsync=originalFind;
      await ScrumHistoryPending.rawCollection().deleteMany({_id:boardId});
      for(const collection of [ScrumHistoryRequests,ScrumHistoryCompletions,ChangeHistory,HistoryWriterGates,Lists,Swimlanes])
        await collection.rawCollection().deleteMany({boardId});
      await Cards.rawCollection().deleteMany({_id:cardId});
      await Boards.rawCollection().deleteMany({_id:boardId});
      await Meteor.users.rawCollection().deleteMany({_id:userId});
    }
  });
});
