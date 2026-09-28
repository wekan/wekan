import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Random } from 'meteor/random';
import { sendStoredWebhook } from '/server/notifications/storedWebhookHttp';
const { prepareWebhookPlan, deliveryId } = require('/server/lib/syncWebhookPlan');
const { deliverStoredWebhookHttp } = require('/server/lib/syncWebhookHttp');
const Responses = new Mongo.Collection('__testStoredWebhookResponses');
Responses.deny({ insert: () => true, update: () => true, remove: () => true });

describe('Stored webhook HTTP adapter', function () {
  this.timeout(30000);
  it('replays stored acceptance in the actual server module and rejects private targets without recording delivery', async function () {
    if (!Meteor.isAppTest) this.skip();
    const activity = { _id: Random.id(), boardId: Random.id(), cardId: Random.id(), userId: Random.id() };
    const integrationId = Random.id(), id = deliveryId(activity._id, integrationId);
    async function item(url, is2way) {
      const plan = await prepareWebhookPlan({ activity,
        integrations: [{ _id: integrationId, boardId: activity.boardId, enabled: true, url,
          type: is2way ? 'bidirectional-webhooks' : 'outgoing-webhooks' }],
        prepare: async () => ({ url, headers: { 'Content-Type': 'application/json' }, body: '{}', is2way, language: 'en' }) });
      const target = plan.targets[0];
      return { activity, target, deliveryId: id,
        request: { ...target.request, headers: { ...target.request.headers, 'X-Wekan-Delivery-Id': id } } };
    }
    const responses = Responses.rawCollection(), guards = { assertCurrent: async () => {}, assertTarget: async () => true };
    try {
      await assert.rejects(sendStoredWebhook({ ...guards, responses, item: await item('http://127.0.0.1/hook', false) }), /Blocked IP/);
      assert.equal(await responses.countDocuments({ _id: id }), 0);
      const captured = await item('https://unreachable.invalid/hook', true);
      await assert.rejects(deliverStoredWebhookHttp({ ...guards, responses, item: captured,
        requestHttp: async () => ({ status: 200, text: async () => '{"comment":"Captured reply"}' }),
        completeResponse: async () => { throw new Error('interrupted action'); } }), /interrupted action/);
      assert.equal(await responses.countDocuments({ _id: id }), 1);
      let actions = 0;
      assert.equal(await sendStoredWebhook({ ...guards, responses, item: captured, completeResponse: async action => {
        actions++; assert.equal(action.data.comment, 'Captured reply'); return action.deliveryId;
      } }), id);
      assert.equal(actions, 1);
      await assert.rejects(sendStoredWebhook({ ...guards, responses, item: captured, assertTarget: async () => false,
        completeResponse: async () => assert.fail('revoked') }), /target-denied/);
    } finally { await responses.deleteMany({ _id: id }); }
  });
});
