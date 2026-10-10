/* eslint-env mocha */
import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Integrations from '/models/integrations';
import Settings from '/models/settings';
import '/server/methods/notificationDelivery';

// #3695 / #5171: setNotificationDelivery writes only validated values, and
// only for the level the caller may change.
describe('Notification delivery settings method', function () {
  this.timeout(30000);
  const call = (userId, ...args) => Meteor.server.method_handlers.setNotificationDelivery.apply({ userId }, args);
  const refused = async (promise, error) => {
    await assert.rejects(promise, err => err.error === error);
  };

  it('saves each level for the right caller and refuses everyone else', async function () {
    if (!Meteor.isAppTest) this.skip();
    const admin = Random.id(), boardAdmin = Random.id(), member = Random.id();
    const boardId = Random.id(), hookId = Random.id(), globalId = Random.id();
    const setting = await Settings.findOneAsync({});
    const original = setting && setting.notificationDelivery;
    try {
      await Meteor.users.rawCollection().insertMany([
        { _id: admin, username: `a-${admin}`, isAdmin: true, profile: {} },
        { _id: boardAdmin, username: `b-${boardAdmin}`, profile: {} },
        { _id: member, username: `m-${member}`, profile: {} },
      ]);
      await Boards.rawCollection().insertOne({ _id: boardId, title: 'Delivery board', permission: 'private',
        members: [{ userId: boardAdmin, isActive: true, isAdmin: true }, { userId: member, isActive: true, isAdmin: false }] });
      const base = { enabled: true, activities: ['all'], url: 'https://example.invalid/hook', type: 'outgoing-webhooks', createdAt: new Date(0) };
      await Integrations.rawCollection().insertMany([
        { ...base, _id: hookId, boardId, userId: boardAdmin },
        { ...base, _id: globalId, boardId: Integrations.Const.GLOBAL_WEBHOOK_ID, userId: admin },
      ]);

      // Board: its admin yes, a plain member no; every channel.
      await call(boardAdmin, 'board', boardId, 'email', { layout: 'clear', grouping: 'board', parts: ['card', 'board'] });
      await call(boardAdmin, 'board', boardId, 'webhook', { text: false, fields: ['names', 'ids'] });
      const board = await Boards.findOneAsync(boardId);
      assert.deepEqual(board.notificationDelivery.email, { layout: 'clear', parts: ['board', 'card'], grouping: 'board' });
      assert.deepEqual(board.notificationDelivery.webhook, { text: false, fields: ['ids', 'names'] });
      await refused(call(member, 'board', boardId, 'tray', { grouping: 'card' }), 'not-authorized');

      // A board webhook: the board admin; a global webhook: instance admins only.
      await call(boardAdmin, 'integration', hookId, 'webhook', { grouping: 'all', schedule: 'interval', intervalMinutes: 60 });
      assert.equal((await Integrations.findOneAsync(hookId)).notificationDelivery.webhook.grouping, 'all');
      await refused(call(member, 'integration', hookId, 'webhook', { text: false }), 'not-authorized');
      await refused(call(boardAdmin, 'integration', globalId, 'webhook', { text: false }), 'not-authorized');
      await refused(call(boardAdmin, 'integration', hookId, 'email', { layout: 'clear' }), 'invalid-channel');
      await call(admin, 'integration', globalId, 'webhook', { text: false });
      assert.deepEqual((await Integrations.findOneAsync(globalId)).notificationDelivery.webhook, { text: false });
      await call(boardAdmin, 'integration', hookId, 'webhook', null);
      assert.equal((await Integrations.findOneAsync(hookId)).notificationDelivery?.webhook, undefined);

      // Admin Panel: instance admins only.
      await refused(call(boardAdmin, 'admin', null, 'email', { grouping: 'none' }), 'not-authorized');
      if (setting) {
        await call(admin, 'admin', null, 'tray', { schedule: 'daily', dailyTime: '08:00', timezone: 'Europe/Helsinki' });
        assert.equal((await Settings.findOneAsync(setting._id)).notificationDelivery.tray.dailyTime, '08:00');
      }

      // Member: only their own e-mail and tray, and only their identity for webhooks.
      await call(member, 'member', null, 'email', { schedule: 'daily', dailyTime: '07:00', timezone: 'UTC' });
      assert.equal((await Meteor.users.findOneAsync(member)).profile.notificationDelivery.email.dailyTime, '07:00');
      await call(member, 'member', null, 'webhook', { hideIdentity: true });
      assert.equal((await Meteor.users.findOneAsync(member)).profile.webhookHideIdentity, true);
      await refused(call(member, 'member', null, 'webhook', { text: false }), 'invalid-notification-delivery');
      await refused(call(member, 'member', boardAdmin, 'email', { grouping: 'none' }), 'not-authorized');
      assert.equal((await Meteor.users.findOneAsync(boardAdmin)).profile.notificationDelivery, undefined);

      // Invalid values are refused before anything is written.
      for (const bad of [{ grouping: 'galaxy' }, { schedule: 'weekly' }, { dailyTime: '25:00' }, { token: 'x' }, { timezone: 'Mars/Base' }]) {
        await refused(call(boardAdmin, 'board', boardId, 'email', bad), 'invalid-notification-delivery');
      }
      await refused(call(admin, 'nobody', null, 'email', {}), 'invalid-scope');
      await refused(call(admin, 'admin', null, 'sms', {}), 'invalid-channel');
      await refused(call(null, 'member', null, 'email', { grouping: 'none' }), 'not-authorized');
      assert.equal((await Boards.findOneAsync(boardId)).notificationDelivery.email.grouping, 'board');
    } finally {
      await Meteor.users.rawCollection().deleteMany({ _id: { $in: [admin, boardAdmin, member] } });
      await Boards.rawCollection().deleteOne({ _id: boardId });
      await Integrations.rawCollection().deleteMany({ _id: { $in: [hookId, globalId] } });
      if (setting) {
        await Settings.rawCollection().updateOne({ _id: setting._id }, original
          ? { $set: { notificationDelivery: original } } : { $unset: { notificationDelivery: '' } });
      }
    }
  });
});
