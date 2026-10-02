import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Cards from '/models/cards';

// A card or swimlane moved to another board loses the sprint, release and
// rank of the board it left (models/lib/scrumCopy.js movedScrumMetadata):
// they used to stay and point at that board's records.
describe('Scrum references on moves to another board', function () {
  this.timeout(30000);
  it('drops the board it left\'s sprint and release from a moved card and swimlane, and only then', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id(), from = Random.id(), to = Random.id();
    const ids = { list: Random.id(), lane: Random.id(), toList: Random.id(), toLane: Random.id(), card: Random.id(),
      stay: Random.id() };
    const members = [{ userId: actor, isAdmin: true, isActive: true }];
    const context = { userId: actor, isSimulation: false, connection: null, setUserId() {}, unblock() {} };
    const as = work => DDP._CurrentMethodInvocation.withValue(context, work);
    const scrum = { sprintId: 's1', pastSprintIds: ['s0'], releaseId: 'r1', backlogRank: 3, issueType: 'Bug',
      acceptanceCriteria: 'Works' };
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `moved-scrum-${actor}` });
      await Boards.rawCollection().insertMany([{ _id: from, title: 'From', members }, { _id: to, title: 'To', members }]);
      await Swimlanes.rawCollection().insertMany([
        { _id: ids.lane, boardId: from, title: 'Lane', sort: 0, archived: false, scrum: { sprintId: 's1', purpose: 'Ops' },
          scrumRevision: 1 },
        { _id: ids.toLane, boardId: to, title: 'Lane', sort: 0, archived: false }]);
      await Lists.rawCollection().insertMany([{ _id: ids.list, boardId: from, title: 'List', sort: 0, archived: false },
        { _id: ids.toList, boardId: to, title: 'List', sort: 0, archived: false }]);
      await Cards.rawCollection().insertMany([
        { _id: ids.card, boardId: from, listId: ids.list, swimlaneId: ids.lane, title: 'Moves', sort: 0, archived: false,
          scrum, scrumRevision: 2 },
        { _id: ids.stay, boardId: from, listId: ids.list, swimlaneId: ids.lane, title: 'Stays', sort: 1, archived: false,
          scrum, scrumRevision: 2 }]);
      // Negative first: a move on the same board keeps everything.
      const stay = await Cards.findOneAsync(ids.stay);
      await as(() => stay.move(from, ids.lane, ids.list, 5));
      const stayed = await Cards.rawCollection().findOne({ _id: ids.stay });
      assert.deepEqual([stayed.scrum, stayed.scrumRevision], [scrum, 2]);
      // To another board: the board-scoped references go, the card's own stay.
      const card = await Cards.findOneAsync(ids.card);
      await as(() => card.move(to, ids.toLane, ids.toList));
      const moved = await Cards.rawCollection().findOne({ _id: ids.card });
      assert.deepEqual([moved.boardId, moved.scrum, moved.scrumRevision],
        [to, { issueType: 'Bug', acceptanceCriteria: 'Works' }, 3]);
      // A swimlane moved to another board likewise keeps only its purpose.
      const lane = await Swimlanes.findOneAsync(ids.lane);
      await as(() => lane.move(to));
      const movedLane = await Swimlanes.rawCollection().findOne({ _id: ids.lane });
      assert.deepEqual([movedLane.boardId, movedLane.scrum, movedLane.scrumRevision], [to, { purpose: 'Ops' }, 2]);
    } finally {
      for (const model of [Cards, Lists, Swimlanes]) await model.rawCollection().deleteMany({ boardId: { $in: [from, to] } });
      await Boards.rawCollection().deleteMany({ _id: { $in: [from, to] } });
      await Meteor.users.rawCollection().deleteMany({ _id: actor });
    }
  });
});
