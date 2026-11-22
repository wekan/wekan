import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import { CloudSettings, CloudDomains } from '/models/cloudPanel';

// CloudPanelBleed (server/cloudPanel.js, tests/cloudPanelGate.test.cjs): the
// Cloud Panel connects to MongoDB servers it is given, so it exists only
// where the server has the CLOUD environment variable. These run the real
// methods and the real login handler of the real server, which `meteor test`
// starts WITHOUT CLOUD - the case of every ordinary WeKan.
describe('Cloud Panel without CLOUD (CloudPanelBleed)', function () {
  this.timeout(60000);
  const saved = process.env.CLOUD;
  const admin = Random.id();
  const host = 'cloud-test.example.com';
  const call = (userId, name, ...args) => DDP._CurrentMethodInvocation.withValue(
    { userId, isSimulation: false, connection: { httpHeaders: { host }, clientAddress: '203.0.113.5' }, setUserId() {}, unblock() {} },
    () => Meteor.server.method_handlers[name].apply({ userId, connection: { httpHeaders: { host }, clientAddress: '203.0.113.5' } }, args));

  before(async function () {
    if (!Meteor.isAppTest) this.skip();
    delete process.env.CLOUD;
    await Meteor.users.rawCollection().insertOne({ _id: admin, username: `cloud-admin-${admin}`, isAdmin: true, profile: {} });
    // What an earlier version let a site administrator store from the
    // browser: this very host as the Cloud Panel Domain, and themselves.
    await CloudSettings.rawCollection().updateOne({ _id: 'cloud' },
      { $set: { settings: { domain: host, superAdminUsername: `cloud-admin-${admin}` } } }, { upsert: true });
    await CloudDomains.rawCollection().insertOne({ _id: `d-${admin}`, domain: `internal-${admin.toLowerCase()}.example.com`, mode: 'own',
      upstream: 'x:1', database: { host: '127.0.0.1', port: 9, database: 'admin' } });
  });

  after(async function () {
    if (!Meteor.isAppTest) return;
    if (saved === undefined) delete process.env.CLOUD; else process.env.CLOUD = saved;
    await Meteor.users.rawCollection().deleteOne({ _id: admin });
    await CloudSettings.rawCollection().deleteOne({ _id: 'cloud' });
    await CloudDomains.rawCollection().deleteOne({ _id: `d-${admin}` });
  });

  it('answers that there is no panel, whatever the database says', async function () {
    const who = await call(admin, 'cloudPanelWhoAmI');
    assert.equal(who.enabled, false);
    assert.equal(who.isCloudAdmin, false);
  });

  it('negative: refuses every other method to a site administrator', async function () {
    const names = Object.keys(Meteor.server.method_handlers).filter(n => n.startsWith('cloudPanel') && n !== 'cloudPanelWhoAmI');
    assert.ok(names.includes('cloudPanelTestDatabase') && names.includes('cloudPanelSetSettings'));
    for (const name of names) {
      // eslint-disable-next-line no-await-in-loop
      await assert.rejects(Promise.resolve().then(() => call(admin, name, `d-${admin}`, {}, {})), /not-authorized|not do that/, name);
    }
  });

  it('negative: the customer login stays out of every password login', async function () {
    const handlers = Accounts._loginHandlers.filter(h => h.name === 'password');
    assert.ok(handlers.length >= 2, 'registered beside accounts-password\'s own');
    const mine = handlers.find(h => /customerLogin/.test(String(h.handler)) || /cloudCustomer/.test(String(h.handler)));
    if (!mine) this.skip();
    const result = await mine.handler.call({ connection: { httpHeaders: { host } } }, { user: { username: 'anybody' }, password: 'x' });
    assert.equal(result, undefined);
  });
});
