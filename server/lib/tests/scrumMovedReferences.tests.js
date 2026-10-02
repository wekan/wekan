import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Cards from '/models/cards';
import ScrumSprints from '/models/scrumSprints';
import ScrumReleases from '/models/scrumReleases';

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

  // Maintainer decision of 2026-10-02: the destination's own sprint and
  // release of the same name, when exactly one matches.
  it('links a moved or copied card to the destination\'s sprint and release of the same name', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id(), from = Random.id(), to = Random.id();
    const ids = { list: Random.id(), lane: Random.id(), toList: Random.id(), toLane: Random.id(), card: Random.id(),
      copied: Random.id(), ambiguous: Random.id() };
    const members = [{ userId: actor, isAdmin: true, isActive: true }];
    const context = { userId: actor, isSimulation: false, connection: null, setUserId() {}, unblock() {} };
    const as = work => DDP._CurrentMethodInvocation.withValue(context, work);
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `linked-scrum-${actor}` });
      await Boards.rawCollection().insertMany([{ _id: from, title: 'From', members }, { _id: to, title: 'To', members }]);
      await ScrumSprints.rawCollection().insertMany([
        { _id: `s7-${from}`, boardId: from, name: 'Sprint 7', state: 'active' },
        { _id: `s8-${from}`, boardId: from, name: 'Sprint 8', state: 'planned' },
        { _id: `s7-${to}`, boardId: to, name: 'Sprint 7', state: 'planned' },
        { _id: `s8a-${to}`, boardId: to, name: 'Sprint 8', state: 'planned' },
        { _id: `s8b-${to}`, boardId: to, name: 'Sprint 8', state: 'active' }]);
      await ScrumReleases.rawCollection().insertMany([{ _id: `r-${from}`, boardId: from, name: '1.0', state: 'planned' },
        { _id: `r-${to}`, boardId: to, name: '1.0', state: 'planned' }]);
      await Swimlanes.rawCollection().insertMany([{ _id: ids.lane, boardId: from, title: 'Lane', sort: 0, archived: false },
        { _id: ids.toLane, boardId: to, title: 'Lane', sort: 0, archived: false }]);
      await Lists.rawCollection().insertMany([{ _id: ids.list, boardId: from, title: 'List', sort: 0, archived: false },
        { _id: ids.toList, boardId: to, title: 'List', sort: 0, archived: false }]);
      const card = (_id, sprint) => ({ _id, boardId: from, listId: ids.list, swimlaneId: ids.lane, title: _id, sort: 0,
        archived: false, scrum: { sprintId: sprint, releaseId: `r-${from}`, issueType: 'Story' }, scrumRevision: 1 });
      await Cards.rawCollection().insertMany([card(ids.card, `s7-${from}`), card(ids.copied, `s7-${from}`),
        card(ids.ambiguous, `s8-${from}`)]);
      await as(async () => (await Cards.findOneAsync(ids.card)).move(to, ids.toLane, ids.toList));
      assert.deepEqual((await Cards.rawCollection().findOne({ _id: ids.card })).scrum,
        { issueType: 'Story', sprintId: `s7-${to}`, releaseId: `r-${to}` }, 'linked by name');
      const copyId = await as(async () => (await Cards.findOneAsync(ids.copied)).copy(to, ids.toLane, ids.toList));
      assert.deepEqual((await Cards.rawCollection().findOne({ _id: copyId })).scrum,
        { issueType: 'Story', sprintId: `s7-${to}`, releaseId: `r-${to}` }, 'a copy too');
      // Negative: two sprints of that name there - the sprint is dropped, the
      // release still linked.
      await as(async () => (await Cards.findOneAsync(ids.ambiguous)).move(to, ids.toLane, ids.toList));
      assert.deepEqual((await Cards.rawCollection().findOne({ _id: ids.ambiguous })).scrum,
        { issueType: 'Story', releaseId: `r-${to}` });
    } finally {
      for (const model of [Cards, Lists, Swimlanes, ScrumSprints, ScrumReleases]) {
        await model.rawCollection().deleteMany({ boardId: { $in: [from, to] } });
      }
      await Boards.rawCollection().deleteMany({ _id: { $in: [from, to] } });
      await Meteor.users.rawCollection().deleteMany({ _id: actor });
    }
  });
});
