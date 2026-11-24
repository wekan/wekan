import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';

// Admin Panel / Settings / Privacy and security / Allowed addresses
// (server/adminPanelAddresses.js, tests/adminPanelAddresses.test.cjs): the
// real user read of the real server, inside a method call from an address the
// list has and from one it does not. The list comes from the environment, so
// no setting of the test database is touched.
describe('Admin Panel allowed addresses', function () {
  this.timeout(60000);
  const saved = process.env.ADMIN_PANEL_ALLOWED_IP_ADDRESSES;
  const admin = Random.id();
  const member = Random.id();
  const connectionAt = clientAddress => ({ httpHeaders: {}, clientAddress, id: Random.id() });
  const as = (userId, clientAddress, name, fn) => {
    const connection = connectionAt(clientAddress);
    return DDP._CurrentMethodInvocation.withValue(
      { userId, name, isSimulation: false, connection, setUserId() {}, unblock() {} }, () => fn({ userId, connection }));
  };
  const call = (userId, clientAddress, name, ...args) => as(userId, clientAddress, name,
    self => Meteor.server.method_handlers[name].apply(self, args));

  before(async function () {
    if (!Meteor.isAppTest) this.skip();
    process.env.ADMIN_PANEL_ALLOWED_IP_ADDRESSES = '192.0.2.0/24, 2001:db8::/32';
    await Meteor.users.rawCollection().insertOne({ _id: admin, username: `apa-admin-${admin}`, isAdmin: true, profile: {} });
    await Meteor.users.rawCollection().insertOne({ _id: member, username: `apa-member-${member}`, profile: {} });
  });

  after(async function () {
    if (!Meteor.isAppTest) return;
    if (saved === undefined) delete process.env.ADMIN_PANEL_ALLOWED_IP_ADDRESSES; else process.env.ADMIN_PANEL_ALLOWED_IP_ADDRESSES = saved;
    await Meteor.users.rawCollection().deleteMany({ _id: { $in: [admin, member] } });
  });

  it('an administrator at an allowed address is an administrator', async function () {
    for (const at of ['192.0.2.7', '::ffff:192.0.2.7', '2001:db8::9']) {
      // eslint-disable-next-line no-await-in-loop
      const user = await as(admin, at, 'x', () => Meteor.users.findOneAsync(admin));
      assert.equal(user.isAdmin, true, at);
      // eslint-disable-next-line no-await-in-loop
      assert.ok(await as(admin, at, 'x', () => Meteor.users.findOneAsync({ _id: admin, isAdmin: true })), at);
    }
  });

  it('negative: from any other address the same administrator reads as a member', async function () {
    const user = await as(admin, '203.0.113.9', 'x', () => Meteor.users.findOneAsync(admin));
    assert.equal(user.isAdmin, false);
    assert.equal(user.username, `apa-admin-${admin}`, 'still found: their boards work');
    // Not found: Meteor 3's findOneAsync answers undefined, the driver null.
    assert.equal(await as(admin, '203.0.113.9', 'x', () => Meteor.users.findOneAsync({ _id: admin, isAdmin: true })) == null, true);
    const stored = await Meteor.users.findOneAsync(admin);
    assert.equal(stored.isAdmin, true, 'outside any caller the stored flag is read as it is');
  });

  it('negative: the admin methods refuse from outside the list, and the lockout is refused inside it', async function () {
    await assert.rejects(Promise.resolve().then(() => call(admin, '203.0.113.9', 'getAdminPanelAllowedAddresses')), /not-authorized/);
    await assert.rejects(Promise.resolve().then(() => call(admin, '203.0.113.9', 'saveAdminPanelAllowedAddresses', '203.0.113.0/24')), /not-authorized/);
    const config = await call(admin, '192.0.2.7', 'getAdminPanelAllowedAddresses');
    assert.equal(config.source, 'env');
    assert.equal(config.yourAddress, '192.0.2.7');
    await assert.rejects(Promise.resolve().then(() => call(admin, '192.0.2.7', 'saveAdminPanelAllowedAddresses', '198.51.100.0/24')), /lock you out/);
    assert.deepEqual(await call(admin, '203.0.113.9', 'adminPanelAddressStatus'), { refused: true, yourAddress: '203.0.113.9' });
    assert.deepEqual(await call(admin, '192.0.2.7', 'adminPanelAddressStatus'), { refused: false });
  });

  it('negative: a member is not affected, from anywhere', async function () {
    const user = await as(member, '203.0.113.9', 'x', () => Meteor.users.findOneAsync(member));
    assert.equal(user.username, `apa-member-${member}`);
    assert.deepEqual(await call(member, '203.0.113.9', 'adminPanelAddressStatus'), { refused: false });
  });

  it('"any" in the environment lifts the restriction', async function () {
    process.env.ADMIN_PANEL_ALLOWED_IP_ADDRESSES = 'any';
    try {
      const user = await as(admin, '203.0.113.9', 'x', () => Meteor.users.findOneAsync(admin));
      assert.equal(user.isAdmin, true);
    } finally {
      process.env.ADMIN_PANEL_ALLOWED_IP_ADDRESSES = '192.0.2.0/24, 2001:db8::/32';
    }
  });
});
