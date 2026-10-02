import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Cards from '/models/cards';
import Swimlanes from '/models/swimlanes';
import CustomFields from '/models/customFields';
import Activities from '/models/activities';
import ChangeHistory from '/models/changeHistory';
import { syncOneList } from '/server/listSync';

// GitLab estimate Sync (2026-10-02): an issue's weight or time estimate into
// a numeric field the board administrator picks, on the direct and durable
// paths alike (models/lib/listSyncEstimate.js).
describe('List Sync GitLab estimates', function () {
  this.timeout(60000);
  for (const durable of [false, true]) {
    it(`syncs GitLab's weight into the picked field, and clears it, on the ${durable ? 'durable' : 'direct'} path`, async function () {
      if (!Meteor.isAppTest) this.skip();
      const actor = Random.id(), boardId = Random.id(), listId = Random.id(), laneId = Random.id();
      const context = { userId: actor, isSimulation: false, connection: null, setUserId() {}, unblock() {} };
      const as = work => DDP._CurrentMethodInvocation.withValue(context, work);
      let issues = [];
      const fetchers = { gitlab: async () => issues };
      const run = () => as(async () => syncOneList(await Lists.findOneAsync(listId), { fetchers }));
      const card = () => Cards.rawCollection().findOne({ boardId, syncExternalId: '7' });
      let fieldId;
      try {
        await Meteor.users.rawCollection().insertOne({ _id: actor, username: `gitlab-${actor}`, profile: {} });
        await Boards.rawCollection().insertOne({ _id: boardId, title: 'GitLab', permission: 'private', archived: false,
          syncEffectsEnabled: durable, members: [{ userId: actor, isAdmin: true, isActive: true }] });
        await Swimlanes.rawCollection().insertOne({ _id: laneId, boardId, title: 'Lane', archived: false, sort: 0 });
        await Lists.rawCollection().insertOne({ _id: listId, boardId, title: 'Issues', archived: false, sort: 0,
          swimlaneId: laneId, syncCredentialIncarnation: Random.id() });
        fieldId = await CustomFields.direct.insertAsync({ boardIds: [boardId], name: 'Points', type: 'number', settings: {},
          showOnCard: false, automaticallyOnCard: false, alwaysOnCard: false, showLabelOnMiniCard: false });
        const config = { type: 'gitlab', url: 'https://gitlab.example.org', projectKey: '42', token: 'token',
          fields: ['title', 'estimate'], estimateCustomFieldId: fieldId, estimateSourceField: 'weight' };
        // Negative: no attribute chosen is refused.
        const { estimateSourceField, ...withoutAttribute } = config;
        await assert.rejects(as(() => Meteor.server.method_handlers.setListSyncSource.apply(context,
          [listId, withoutAttribute])), /GitLab estimate/);
        await as(() => Meteor.server.method_handlers.setListSyncSource.apply(context, [listId, config]));
        const list = await Lists.findOneAsync(listId);
        assert.equal(list.syncSource.estimateSourceField, 'weight');

        issues = [{ iid: 7, title: 'Pump', state: 'opened', weight: 3 }];
        const first = await run();
        assert.equal(first.error, undefined, JSON.stringify(first));
        if (durable) assert.equal(first.durable, true, JSON.stringify(first));
        const value = c => (c.customFields || []).find(field => field._id === fieldId)?.value;
        assert.equal(value(await card()), 3, 'the weight, in the picked field');
        issues = [{ iid: 7, title: 'Pump', state: 'opened', weight: 5 }];
        await run();
        assert.equal(value(await card()), 5);
        issues = [{ iid: 7, title: 'Pump', state: 'opened', weight: null }];
        await run();
        assert.equal(value(await card()), undefined, 'no weight clears it');
      } finally {
        for (const model of [Cards, Activities, ChangeHistory, Swimlanes]) await model.rawCollection().deleteMany({ boardId });
        await Lists.rawCollection().deleteMany({ _id: listId });
        await CustomFields.rawCollection().deleteMany({ boardIds: boardId });
        await Boards.rawCollection().deleteMany({ _id: boardId });
        await Meteor.users.rawCollection().deleteMany({ _id: actor });
      }
    });
  }
});
