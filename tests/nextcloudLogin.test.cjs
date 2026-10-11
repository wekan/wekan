'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { createHmac } = require('node:crypto');
const identityTools = require('../server/lib/nextcloudIdentity');
const env = { NEXTCLOUD_EXAPP: 'true', NEXTCLOUD_URL: 'https://cloud.example', WEKAN_NEXTCLOUD_PROXY_KEY: 'key', NEXTCLOUD_ADMIN_USERS: '["admin"]' };
function headers(userId) {
  const data = Buffer.from(JSON.stringify({ issuer: env.NEXTCLOUD_URL, userId })).toString('base64url');
  return { 'x-wekan-nextcloud-user': data, 'x-wekan-nextcloud-signature': createHmac('sha256', 'key').update(data).digest('hex') };
}
function load() {
  const users = new Map(); let login, validate;
  const tools = { ...identityTools,
    nextcloudIdentity: h => identityTools.nextcloudIdentity(h, env),
    nextcloudAdmin: u => identityTools.nextcloudAdmin(u, env) };
  const Accounts = {
    registerLoginHandler(_, fn) { login = fn; }, validateLoginAttempt(fn) { validate = fn; },
    async insertUserDoc(options, user) {
      assert.equal(options.from, 'admin');
      if (users.has(user._id)) throw new Error('duplicate');
      users.set(user._id, { ...user, isAdmin: tools.nextcloudAdmin(user.services.nextcloud.id) });
      return user._id;
    },
  };
  const Meteor = { server: { stream_server: { register() {} } }, settings: { public: {} }, Error, users: {
    findOneAsync: async id => users.get(id),
    updateAsync: async (id, update) => Object.assign(users.get(id), update.$set),
  } };
  const source = fs.readFileSync(require.resolve('../server/nextcloud.js'), 'utf8').replace(/^import .*;\n/gm, '');
  vm.runInNewContext(source, { Meteor, Accounts, WebApp: { httpServer: { prependListener() {} }, handlers: { use() {} } },
    process: { env }, check(options) { assert.equal(typeof options.nextcloud, 'boolean'); },
    require: name => name.endsWith('nextcloudTransport') ? { installNextcloudTransport() {} } : tools, Error });
  return { users, login: user => login.call({ connection: { httpHeaders: headers(user) } }, { nextcloud: true }),
    rawLogin: login, validate };
}
test('JIT provisioning creates one isolated account across concurrent tabs', async () => {
  const app = load();
  const [a, b] = await Promise.all([app.login('alice'), app.login('alice')]);
  assert.equal(a.userId, b.userId); assert.equal(app.users.size, 1);
  assert.equal(app.users.get(a.userId).isAdmin, false);
  assert.equal(app.users.get(a.userId).authenticationMethod, 'nextcloud');
  const admin = await app.login('admin'); assert.equal(app.users.get(admin.userId).isAdmin, true);
});
test('login and resume require the connection identity; disabled users stay disabled', async () => {
  const app = load(); const { userId } = await app.login('alice'); const user = app.users.get(userId);
  const attempt = { allowed: true, user, connection: { httpHeaders: headers('alice') } };
  assert.equal(app.validate(attempt), true);
  assert.equal(app.validate({ ...attempt, connection: { httpHeaders: headers('bob') } }), false);
  assert.equal(app.validate({ ...attempt, allowed: false }), false);
  await assert.rejects(app.rawLogin.call({ connection: { httpHeaders: {} } }, { nextcloud: true }), /not-authorized/);
  user.loginDisabled = true;
  assert.equal(app.validate(attempt), false);
  await assert.rejects(app.login('alice'), /not-authorized/);
});
test('HTTP file identity ignores stale bearer/cookie tokens in ExApp mode', async () => {
  const app = load(); const { userId } = await app.login('alice');
  const source = fs.readFileSync(require.resolve('../server/lib/requestUser.js'), 'utf8')
    .replace(/^import .*;\n/gm, '').replace(/^export default \{[\s\S]*$/m, '')
    .replace(/^export /gm, '');
  const context = { process: { env }, console, Meteor: { users: { findOneAsync: async id => app.users.get(id) } },
    require: name => {
      assert.equal(name, '/server/lib/nextcloudIdentity');
      return { ...identityTools, nextcloudIdentity: h => identityTools.nextcloudIdentity(h, env) };
    } };
  vm.createContext(context); vm.runInContext(source, context);
  assert.equal(await context.getUserIdFromRequest({ headers: { ...headers('alice'), cookie: 'meteor_login_token=bob-token' } }), userId);
  assert.equal(await context.getUserIdFromRequest({ headers: { cookie: 'meteor_login_token=bob-token' } }), null);
  app.users.get(userId).loginDisabled = true;
  assert.equal(await context.getUserIdFromRequest({ headers: headers('alice') }), null);
});
