'use strict';
// InactiveBleed: disabled accounts must not authenticate or retain sessions.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
let user, update, events = [], loggerFails = false;
const context = vm.createContext({
  Meteor: { users: {
    findOneAsync: async () => user,
    rawCollection: () => ({ updateOne: async (selector, modifier) => {
      update = { selector, modifier };
      return { matchedCount: user && selector.loginDisabled.$in.includes(user.loginDisabled ?? null) ? 1 : 0 };
    } }),
  }, Error: class extends Error {} },
  Accounts: { _hashLoginToken: token => `hash:${token}` },
  require: () => ({ record: event => { if (loggerFails) throw Error('log unavailable'); events.push(event); } }),
});
vm.runInContext(read('server/lib/activeUser.js').replace(/^import .*;\n/gm, '').replace(/export /g, ''), context);
(async () => {
  for (const disabled of [undefined, false, '']) {
    user = { _id: 'active', loginDisabled: disabled };
    assert.equal((await context.activeUserByToken('token', 'test'))._id, 'active');
    await context.insertActiveLoginToken('active', { token: 'secret', when: new Date() });
    assert.equal(update.modifier.$push['services.resume.loginTokens'].hashedToken, 'hash:secret');
  }
  assert.equal(events.length, 0, 'normal use is not a security event');
  user = { _id: 'disabled', loginDisabled: true };
  assert.equal(await context.activeUserByToken('token', 'test'), null);
  assert.equal(await context.activeUserById('disabled', 'test'), null);
  await assert.rejects(context.insertActiveLoginToken('disabled', { token: 'secret', when: new Date() }));
  assert(events.every(e => e.key === 'authn.inactive' && e.action === 'blocked'));
  assert.equal(await context.activeUserById(undefined, 'test'), null);
  loggerFails = true;
  assert.equal(context.allowActiveUser(user, 'test'), false);
  user = null;
  assert.equal(await context.activeUserByToken('unknown', 'test'), null);
  const modifier = { $set: { loginDisabled: true }, $push: { 'services.resume.loginTokens': {} } };
  context.revokeDisabledTokensModifier(modifier);
  assert.equal(modifier.$set['services.resume.loginTokens'].length, 0);
  assert(!('services.resume.loginTokens' in modifier.$push));
  const enable = { $set: { loginDisabled: false } };
  context.revokeDisabledTokensModifier(enable);
  assert(!('services.resume.loginTokens' in enable.$set));

  // Every application token lookup and token issuance must go through the guard.
  function scan(dir) {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      if (entry.name === 'tests' || entry.name === 'node_modules') continue;
      const file = `${dir}/${entry.name}`;
      if (entry.isDirectory()) scan(file);
      else if (file.endsWith('.js') && file !== 'server/lib/activeUser.js') {
        const source = read(file);
        assert(!source.includes('services.resume.loginTokens.hashedToken'), `${file}: unguarded token lookup`);
        assert(!/\$push\s*:\s*\{\s*['"]services\.resume\.loginTokens['"]/.test(source), `${file}: direct token insertion`);
        assert(!/Accounts\._insert(?:Hashed)?LoginToken\(/.test(source), `${file}: unguarded token issuance`);
      }
    }
  }
  for (const dir of ['server', 'models', 'imports', 'packages', 'client']) scan(dir);
  assert(!read('server/header-login.js').includes('$push'));
  assert(!read('packages/wekan-ldap/server/loginHandler.js').includes('loginTokens'));
  assert(!read('packages/wekan-ldap/server/loginHandler.js').includes('_generateStampedLoginToken'));
  // Exercise the real attachment helper, including accounts-express's prefilled
  // identity and the legacy user-id/token pair, against the shared guard.
  context.findOrCreateHeaderLoginUser = async () => null;
  context.require = () => ({
    record: () => {}, activeUserById: context.activeUserById,
    activeUserByToken: context.activeUserByToken,
  });
  const attachmentSource = read('server/routes/attachmentApi.js');
  vm.runInContext(attachmentSource.slice(attachmentSource.indexOf('async function authenticateApiRequest('),
    attachmentSource.indexOf('// Helper function to send JSON response')), context);
  user = { _id: 'member' };
  assert.equal(await context.authenticateApiRequest({ userId: 'member', headers: {} }), 'member');
  assert.equal(await context.authenticateApiRequest({ headers: { 'x-user-id': 'member', 'x-auth-token': 'valid' } }), 'member');
  await assert.rejects(context.authenticateApiRequest({ headers: { 'x-user-id': 'other', 'x-auth-token': 'valid' } }));
  user.loginDisabled = true;
  await assert.rejects(context.authenticateApiRequest({ userId: 'member', headers: {} }));
  await assert.rejects(context.authenticateApiRequest({ headers: { 'x-user-id': 'member', 'x-auth-token': 'valid' } }));
  const users = read('server/models/users.js');
  const create = users.slice(users.indexOf('  async setCreateUser('), users.indexOf('  async setUsername('));
  assert(create.includes('await adminCreation.withValue'));
  assert(create.includes('Accounts.createUserAsync('));
  assert(!create.includes('Accounts.createUser('));
  assert(users.includes('const creation = adminCreation.get()'));
  assert(users.includes('revokeDisabledTokensModifier(modifier)'));
  assert(users.includes('observeChangesAsync({ added: revoke })'));
  const ui = read('client/components/settings/peopleBody.js').split("'click .js-toggle-active-status':")[1].split("'click .js-toggle-lock-status':")[0];
  assert(ui.includes("Meteor.callAsync('editUser'"));
  assert(!/Users\.update/.test(ui));
  console.log('PASS disabled account decisions, atomic issuance, revocation, logging, creation and tree-wide auth audit');
})().catch(error => { console.error(error); process.exitCode = 1; });
