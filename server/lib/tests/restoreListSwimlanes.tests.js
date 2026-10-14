import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import Cards from '/models/cards';
import Lists from '/models/lists';
import PositionHistory from '/models/positionHistory';
import Swimlanes from '/models/swimlanes';
import { planRestorableListSwimlanes } from '/server/lib/restoreListSwimlanes';

// #6766 on a running server: Admin Panel / Problems' "Lists missing their
// swimlane" counts only lists that really lost their binding - not lists made
// board-wide since the un-binding stopped, and never one whose cards are in
// another swimlane, which a restore would hide.
describe('Lists missing their swimlane (runtime, #6766)', function () {
  this.timeout(60000);
  const boardId = Random.id(), s1 = Random.id(), s2 = Random.id();
  const [lost, created, shared] = [Random.id(), Random.id(), Random.id()];
  const createdBefore = new Date('2026-06-01T00:00:00Z'), createdAfter = new Date('2026-10-14T00:00:00Z');

  before(async function () {
    if (!Meteor.isAppTest) this.skip();
    await Swimlanes.rawCollection().insertMany([
      { _id: s1, boardId, title: 'One', archived: false, sort: 0 },
      { _id: s2, boardId, title: 'Two', archived: false, sort: 1 },
    ]);
    await Lists.rawCollection().insertMany([
      { _id: lost, boardId, title: 'Lost', swimlaneId: '', archived: false, sort: 0 },
      { _id: created, boardId, title: 'Nieuw', swimlaneId: '', archived: false, sort: 1 },
      { _id: shared, boardId, title: 'TE DOEN', swimlaneId: '', archived: false, sort: 2 },
    ]);
    await PositionHistory.rawCollection().insertMany([lost, created, shared].map(id => ({
      _id: Random.id(), boardId, entityType: 'list', entityId: id, originalSwimlaneId: s1,
      createdAt: id === created ? createdAfter : createdBefore,
    })));
    await Cards.rawCollection().insertMany([
      { _id: Random.id(), boardId, listId: lost, swimlaneId: s1, title: 'a', archived: false, type: 'cardType-card' },
      { _id: Random.id(), boardId, listId: shared, swimlaneId: s1, title: 'b', archived: false, type: 'cardType-card' },
      { _id: Random.id(), boardId, listId: shared, swimlaneId: s2, title: 'c', archived: true, type: 'cardType-card' },
    ]);
  });

  after(async function () {
    if (!Meteor.isAppTest) return;
    await Cards.rawCollection().deleteMany({ boardId });
    await PositionHistory.rawCollection().deleteMany({ boardId });
    await Lists.rawCollection().deleteMany({ boardId });
    await Swimlanes.rawCollection().deleteMany({ boardId });
  });

  it('only the list that lost its binding is restorable', async () => {
    const plan = (await planRestorableListSwimlanes()).filter(item => item.boardId === boardId);
    assert.deepEqual(plan.map(item => item.listId), [lost]);
  });

  it('negative: neither the new board-wide list nor the shared one is offered', async () => {
    const ids = (await planRestorableListSwimlanes()).map(item => item.listId);
    assert.ok(!ids.includes(created), 'created after the un-binding stopped');
    assert.ok(!ids.includes(shared), 'an archived card in another swimlane counts too');
  });
});
