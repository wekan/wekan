import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Cards from '/models/cards';
import Activities from '/models/activities';

// A card moved to another board keeps its addedLabel activities, re-pointed at
// the new board's label of the same name (#3907's intent). The before-update
// hook that does it ran twice per update, and the second run deleted them all.
describe('Card move to another board', function () {
  this.timeout(30000);
  it('keeps the card\'s addedLabel activities, pointed at the new board\'s labels', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id(), from = Random.id(), to = Random.id(), cardId = Random.id();
    const ids = { fromList: Random.id(), fromLane: Random.id(), toList: Random.id(), toLane: Random.id() };
    const members = [{ userId: actor, isAdmin: true, isActive: true }];
    const context = { userId: actor, isSimulation: false, connection: null, setUserId() {}, unblock() {} };
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `move-labels-${actor}` });
      await Boards.rawCollection().insertMany([
        { _id: from, title: 'From', members, labels: [{ _id: 'urgent-from', name: 'Urgent', color: 'red' },
          { _id: 'gone-from', name: 'Gone', color: 'blue' }] },
        { _id: to, title: 'To', members, labels: [{ _id: 'urgent-to', name: 'Urgent', color: 'red' }] },
      ]);
      await Swimlanes.rawCollection().insertMany([{ _id: ids.fromLane, boardId: from, title: 'Lane', sort: 0 },
        { _id: ids.toLane, boardId: to, title: 'Lane', sort: 0 }]);
      await Lists.rawCollection().insertMany([{ _id: ids.fromList, boardId: from, title: 'List', sort: 0 },
        { _id: ids.toList, boardId: to, title: 'List', sort: 0 }]);
      await Cards.rawCollection().insertOne({ _id: cardId, boardId: from, listId: ids.fromList, swimlaneId: ids.fromLane,
        title: 'Pump', sort: 0, archived: false, labelIds: ['urgent-from', 'gone-from'] });
      await Activities.rawCollection().insertMany([
        { _id: Random.id(), activityType: 'addedLabel', cardId, boardId: from, labelId: 'urgent-from', userId: actor },
        { _id: Random.id(), activityType: 'addedLabel', cardId, boardId: from, labelId: 'gone-from', userId: actor },
      ]);
      const card = await Cards.findOneAsync(cardId);
      await DDP._CurrentMethodInvocation.withValue(context, () => card.move(to, ids.toLane, ids.toList));
      assert.deepEqual((await Cards.rawCollection().findOne({ _id: cardId })).labelIds, ['urgent-to']);
      const kept = await Activities.rawCollection().find({ cardId, activityType: 'addedLabel' }).toArray();
      // The first label maps by position to the new board's label; the second
      // has no counterpart there, so its activity goes, as updateActivities does.
      assert.deepEqual(kept.map(a => [a.labelId, a.boardId]), [['urgent-to', to]]);
    } finally {
      await Activities.rawCollection().deleteMany({ cardId });
      await Cards.rawCollection().deleteMany({ _id: cardId });
      await Lists.rawCollection().deleteMany({ boardId: { $in: [from, to] } });
      await Swimlanes.rawCollection().deleteMany({ boardId: { $in: [from, to] } });
      await Boards.rawCollection().deleteMany({ _id: { $in: [from, to] } });
      await Meteor.users.rawCollection().deleteMany({ _id: actor });
    }
  });
});
