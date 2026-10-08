import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Cards from '/models/cards';
import Swimlanes from '/models/swimlanes';
import Activities from '/models/activities';
import ChangeHistory from '/models/changeHistory';
import ScrumSprints from '/models/scrumSprints';
import ScrumReleases from '/models/scrumReleases';
import { syncOneList } from '/server/listSync';
const { cardReleaseIds } = require('/models/lib/scrum');

// Planning Sync (2026-10-08): GitLab's iteration and milestone as the card's
// sprint and release, on the direct and durable paths alike, made on this
// board by name when missing and never taken from another board
// (models/lib/listSyncPlanning.js, server/lib/listSyncPlanning.js).
describe('List Sync Scrum planning', function () {
  this.timeout(60000);
  for (const durable of [false, true]) {
    it(`syncs GitLab's iteration and milestone into the card's planning on the ${durable ? 'durable' : 'direct'} path`, async function () {
      if (!Meteor.isAppTest) this.skip();
      const actor = Random.id(), boardId = Random.id(), otherBoardId = Random.id(), listId = Random.id(), laneId = Random.id();
      const context = { userId: actor, isSimulation: false, connection: null, setUserId() {}, unblock() {} };
      const as = work => DDP._CurrentMethodInvocation.withValue(context, work);
      let issues = [];
      const fetchers = { gitlab: async () => issues };
      const run = () => as(async () => syncOneList(await Lists.findOneAsync(listId), { fetchers }));
      const card = () => Cards.rawCollection().findOne({ boardId, syncExternalId: '7' });
      const iteration = { id: 501, iid: 5, title: 'Iteration 5', state: 2, start_date: '2026-10-01', due_date: '2026-10-14' };
      const milestone = { id: 12, iid: 3, title: '2026.10', state: 'active', due_date: '2026-10-31' };
      try {
        await Meteor.users.rawCollection().insertOne({ _id: actor, username: `planning-${actor}`, profile: {} });
        for (const _id of [boardId, otherBoardId]) {
          await Boards.rawCollection().insertOne({ _id, title: 'Planning', permission: 'private', archived: false,
            syncEffectsEnabled: durable, scrum: { enabled: true }, members: [{ userId: actor, isAdmin: true, isActive: true }] });
        }
        // Another board already has this release, under this very source id:
        // it is never this board's.
        await ScrumReleases.rawCollection().insertOne({ _id: Random.id(), boardId: otherBoardId, name: '2026.10',
          state: 'planned', provenance: { system: 'gitlab', projectId: 'https://gitlab.example.org', recordId: '12' } });
        await Swimlanes.rawCollection().insertOne({ _id: laneId, boardId, title: 'Lane', archived: false, sort: 0 });
        await Lists.rawCollection().insertOne({ _id: listId, boardId, title: 'Issues', archived: false, sort: 0,
          swimlaneId: laneId, syncCredentialIncarnation: Random.id() });
        const config = { type: 'gitlab', url: 'https://gitlab.example.org', projectKey: '42', token: 'token',
          fields: ['title', 'sprint', 'releases'] };
        // Negative: GitHub issues have no sprint to sync.
        await assert.rejects(as(() => Meteor.server.method_handlers.setListSyncSource.apply(context,
          [listId, { ...config, type: 'github' }])), /sprint/);
        await as(() => Meteor.server.method_handlers.setListSyncSource.apply(context, [listId, config]));

        issues = [{ iid: 7, title: 'Pump', state: 'opened', iteration, milestone }];
        const first = await run();
        assert.equal(first.error, undefined, JSON.stringify(first));
        if (durable) assert.equal(first.durable, true, JSON.stringify(first));
        const sprint = await ScrumSprints.findOneAsync({ boardId, 'provenance.recordId': '501' });
        const release = await ScrumReleases.findOneAsync({ boardId, 'provenance.recordId': '12' });
        assert.ok(sprint && release, 'made on this board');
        assert.deepEqual([sprint.name, sprint.state, sprint.plannedEnd.toISOString()], ['Iteration 5', 'planned', '2026-10-14T00:00:00.000Z']);
        let synced = await card();
        assert.equal(synced.scrum.sprintId, sprint._id);
        assert.deepEqual(cardReleaseIds(synced.scrum), [release._id]);
        assert.equal(await ScrumReleases.find({ boardId: otherBoardId }).countAsync(), 1, 'the other board is untouched');

        // Replay: nothing changes, nothing more is made.
        const revision = synced.scrumRevision;
        assert.equal((await run()).error, undefined);
        assert.equal((await card()).scrumRevision, revision);
        assert.equal(await ScrumSprints.find({ boardId }).countAsync(), 1);

        // A source without the attributes says nothing: the planning stays.
        issues = [{ iid: 7, title: 'Pump', state: 'opened' }];
        assert.equal((await run()).error, undefined);
        assert.equal((await card()).scrum.sprintId, sprint._id);

        // The source clears them: cleared, recorded in Scrum History.
        issues = [{ iid: 7, title: 'Pump', state: 'opened', iteration: null, milestone: null }];
        assert.equal((await run()).error, undefined);
        synced = await card();
        assert.equal(synced.scrum.sprintId, null);
        assert.deepEqual(cardReleaseIds(synced.scrum), []);
        assert.deepEqual(synced.scrum.pastSprintIds, [sprint._id]);
        assert.ok(await ChangeHistory.findOneAsync({ boardId, entityType: 'scrum', cardId: synced._id }));
      } finally {
        for (const model of [Cards, Activities, ChangeHistory, Swimlanes, ScrumSprints, ScrumReleases]) {
          await model.rawCollection().deleteMany({ boardId: { $in: [boardId, otherBoardId] } });
        }
        await Lists.rawCollection().deleteMany({ _id: listId });
        await Boards.rawCollection().deleteMany({ _id: { $in: [boardId, otherBoardId] } });
        await Meteor.users.rawCollection().deleteMany({ _id: actor });
      }
    });
  }
});
