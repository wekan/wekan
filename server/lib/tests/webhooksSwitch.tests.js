/* eslint-env mocha */
// Admin Panel / Settings / Features / Turn off all webhooks and Admin Panel /
// Problems / Webhooks against the running server (models/lib/webhooksSwitch.js,
// server/webhooksSwitch.js). The source guards are tests/webhooksSwitch.test.cjs.
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { expect } from 'chai';
import Settings from '/models/settings';
import Integrations from '/models/integrations';
import { deliverActivityWebhook } from '/server/notifications/outgoing';
import { webhooksOff, clearWebhooksSwitchCache } from '/server/webhooksSwitch';

const call = (name, userId, ...args) => Meteor.server.method_handlers[name].call({ userId, connection: null }, ...args);

describe('webhooks switch (runtime)', function () {
  this.timeout(20000);
  let settingId;
  let adminId;
  let memberId;
  let hookId;

  before(async function () {
    const setting = await Settings.findOneAsync({});
    settingId = setting && setting._id;
    adminId = await Meteor.users.insertAsync({ username: `whadmin-${Random.id(6)}`, isAdmin: true, profile: {} });
    memberId = await Meteor.users.insertAsync({ username: `whmember-${Random.id(6)}`, profile: {} });
    hookId = Random.id();
    // An address the SSRF guard refuses at once: with webhooks on, delivering
    // to it throws, so returning quietly proves nothing was attempted.
    await Integrations.rawCollection().insertOne({ _id: hookId, boardId: '_global', enabled: true, activities: ['all'],
      type: 'outgoing-webhooks', userId: adminId, url: 'http://127.0.0.1:1/hook', token: 'runtime-secret', createdAt: new Date() });
  });

  after(async function () {
    if (settingId) await Settings.updateAsync(settingId, { $unset: { webhooksDisabled: 1 } });
    clearWebhooksSwitchCache();
    await Integrations.rawCollection().deleteOne({ _id: hookId });
    await Meteor.users.removeAsync({ _id: { $in: [adminId, memberId] } });
  });

  it('only a site administrator turns it on, and the server then sends nothing', async function () {
    if (!settingId) this.skip();
    let error;
    try { await call('saveWebhooksDisabled', memberId, true); } catch (e) { error = e; }
    expect(error && error.error).to.equal('not-authorized');
    expect(await webhooksOff()).to.equal(false);

    let sendError;
    try { await deliverActivityWebhook({ _id: hookId, boardId: '_global' }, 'act-createCard', { boardId: 'b' }, adminId); }
    catch (e) { sendError = e; }
    expect(sendError && sendError.error).to.equal('invalid-webhook-url', 'with webhooks on the request is attempted');

    expect(await call('saveWebhooksDisabled', adminId, true)).to.equal(true);
    expect(await webhooksOff()).to.equal(true);
    expect(await deliverActivityWebhook({ _id: hookId, boardId: '_global' }, 'act-createCard', { boardId: 'b' }, adminId))
      .to.equal(undefined);
    expect((await Integrations.findOneAsync(hookId)).url).to.equal('http://127.0.0.1:1/hook', 'the webhook is kept');
    expect(await call('saveWebhooksDisabled', adminId, false)).to.equal(false);
  });

  it('refuses the login and registration webhook while off', async function () {
    if (!settingId) this.skip();
    await call('saveWebhooksDisabled', adminId, true);
    let error;
    try { await call('saveAccountWebhook', adminId, { url: 'https://hooks.example/login' }); } catch (e) { error = e; }
    expect(error && error.error).to.equal('webhooks-disabled');
    await call('saveWebhooksDisabled', adminId, false);
  });

  it('the report is a site administrator\'s, and shows that a token is set, never the token', async function () {
    let error;
    try { await call('webhooksReportPage', memberId, {}); } catch (e) { error = e; }
    expect(error && error.error).to.equal('not-authorized');
    const page = await call('webhooksReportPage', adminId, { search: '127.0.0.1:1', limit: 100 });
    const row = page.rows.find(r => r._id === hookId);
    expect(row).to.exist;
    expect(row.isGlobal).to.equal(true);
    expect(row.tokenSet).to.equal(true);
    expect(JSON.stringify(page)).to.not.include('runtime-secret');
  });
});
