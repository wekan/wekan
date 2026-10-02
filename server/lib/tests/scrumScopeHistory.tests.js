import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Cards from '/models/cards';
import ChangeHistory from '/models/changeHistory';
import ScrumSprints from '/models/scrumSprints';
import ScrumDailySnapshots from '/models/scrumDailySnapshots';

// A sprint's scope and burndown replayed change by change from History
// (models/lib/scrumScopeReplay.js), through the real Scrum methods and the
// ordinary card setters whose hooks write History.
describe('Scrum scope history', function () {
  this.timeout(30000);
  it('replays membership, estimate and completion changes, and flags writes History never saw', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id(), boardId = Random.id(), listId = Random.id(), laneId = Random.id();
    const ids = [Random.id(), Random.id(), Random.id()];
    const context = { userId: actor, isSimulation: false, connection: null, setUserId() {}, unblock() {} };
    const call = (name, ...args) => DDP._CurrentMethodInvocation.withValue(context,
      () => Meteor.server.method_handlers[name].apply(context, args));
    const as = work => DDP._CurrentMethodInvocation.withValue(context, work);
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `scope-${actor}` });
      await Boards.rawCollection().insertOne({ _id: boardId, title: 'Scope', permission: 'private', archived: false,
        members: [{ userId: actor, isAdmin: true, isActive: true }] });
      await Swimlanes.rawCollection().insertOne({ _id: laneId, boardId, title: 'Lane', sort: 0, archived: false });
      await Lists.rawCollection().insertOne({ _id: listId, boardId, title: 'List', sort: 0, archived: false });
      await Cards.rawCollection().insertMany(ids.map((_id, i) => ({ _id, boardId, listId, swimlaneId: laneId,
        title: `C${i}`, sort: i, archived: false, poker: { estimation: [3, 5, 2][i] } })));
      const sprint = await call('scrum.saveSprint', boardId, null, { name: 'S1', plannedStart: '2026-09-01', plannedEnd: '2026-12-30' }, null);
      for (const id of ids.slice(0, 2)) await call('scrum.updateCard', boardId, id, { sprintId: sprint._id }, 0);
      await call('scrum.startSprint', boardId, sprint._id, sprint.revision);
      // During the sprint: the third card joins, the second's estimate grows,
      // the first is done.
      await call('scrum.updateCard', boardId, ids[2], { sprintId: sprint._id }, 0);
      await as(() => Cards.updateAsync(ids[1], { $set: { 'poker.estimation': 8 } }));
      await as(() => Cards.updateAsync(ids[0], { $set: { dueComplete: true } }));
      const history = await call('scrum.getScopeHistory', boardId, sprint._id);
      assert.equal(history.consistent, true, JSON.stringify(history.inconsistentAt));
      assert.deepEqual(history.points.map(p => [p.scope, p.completed, p.remaining, p.cause]),
        [[8, 0, 8, 'start'], [10, 0, 10, 'scrum'], [13, 0, 13, 'customFields'], [13, 3, 10, 'dates']]);
      // Negative: a write History never saw makes the replay disagree with the
      // cards as they are now - flagged, not presented as fact.
      await Cards.rawCollection().updateOne({ _id: ids[1] }, { $set: { 'poker.estimation': 1 } });
      const unseen = await call('scrum.getScopeHistory', boardId, sprint._id);
      assert.deepEqual([unseen.consistent, unseen.inconsistentAt], [false, ['now']]);
      // A sprint that never started has nothing to replay; another board's
      // member cannot read it.
      const planned = await call('scrum.saveSprint', boardId, null, { name: 'S2', plannedStart: '2026-09-01', plannedEnd: '2026-12-30' }, null);
      assert.deepEqual((await call('scrum.getScopeHistory', boardId, planned._id)).points, []);
      const stranger = { ...context, userId: Random.id() };
      await assert.rejects(DDP._CurrentMethodInvocation.withValue(stranger, () =>
        Meteor.server.method_handlers['scrum.getScopeHistory'].apply(stranger, [boardId, sprint._id])), /not-authorized/);
    } finally {
      for (const model of [Cards, Lists, Swimlanes, ChangeHistory, ScrumSprints, ScrumDailySnapshots]) {
        await model.rawCollection().deleteMany({ boardId });
      }
      await Boards.rawCollection().deleteMany({ _id: boardId });
      await Meteor.users.rawCollection().deleteMany({ _id: actor });
    }
  });
});
