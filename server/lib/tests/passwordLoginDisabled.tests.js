/* eslint-env mocha */
// PASSWORD_LOGIN_ENABLED=false refuses password sign-ins on a running server,
// DDP and REST alike, and DISABLE_FORGOT_PASSWORD refuses Meteor's
// forgotPassword method (models/lib/passwordLoginPolicy.js,
// docs/Features/Admin-Panel/Settings-Enforced-On-Server.md).
import { expect } from 'chai';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Random } from 'meteor/random';
import { authEnv } from '/server/lib/authConfig';
import Settings from '/models/settings';

const PASSWORD = 'correct horse battery staple 42';

describe('password login disabled is refused on the server', function () {
  this.timeout(30000);
  const saved = {};
  let username;
  let userId;

  before(async function () {
    if (!Meteor.server.method_handlers.login || !Accounts._validateLogin) this.skip();
    username = `pwoff-${Random.id(8).toLowerCase()}`;
    userId = await Accounts.createUserAsync({ username, password: PASSWORD, from: 'admin' });
  });
  after(async function () {
    if (userId) await Meteor.users.removeAsync({ _id: userId });
  });

  const setEnv = (name, value) => {
    if (!(name in saved)) saved[name] = process.env[name];
    if (value === undefined) delete process.env[name]; else process.env[name] = value;
  };
  afterEach(function () {
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
      delete saved[name];
    }
  });
  // An Admin Panel value stored in this test database wins over the variable.
  const passwordLoginOff = () => {
    setEnv('PASSWORD_LOGIN_ENABLED', 'false');
    return authEnv('PASSWORD_LOGIN_ENABLED') === 'false';
  };

  const attempt = async (loginRequest, methodName = 'login') => {
    const user = await Meteor.users.findOneAsync(userId);
    const a = { type: 'password', allowed: true, user, methodName, methodArguments: [loginRequest] };
    await Accounts._validateLogin({ id: Random.id(), clientAddress: '198.51.100.7', httpHeaders: {} }, a);
    return a;
  };
  const restLogin = body => fetch(Meteor.absoluteUrl('users/login'), {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });

  it('refuses a DDP password sign-in, even with the right password', async function () {
    if (!passwordLoginOff()) this.skip();
    const a = await attempt({ user: { username }, password: PASSWORD });
    expect(a.allowed).to.equal(false);
    expect(a.error && a.error.error).to.equal('password-login-disabled');
  });

  it('refuses the login method itself the same way, for a right and a wrong password', async function () {
    if (!passwordLoginOff()) this.skip();
    for (const password of [PASSWORD, 'wrong password']) {
      let error;
      try {
        await Meteor.server.method_handlers.login.call({ connection: { id: Random.id(), clientAddress: '198.51.100.7',
          httpHeaders: {}, onClose() {} }, setUserId() {}, userId: null }, { user: { username }, password });
      } catch (e) { error = e; }
      expect(error && error.error, password).to.equal('password-login-disabled');
    }
  });

  it('refuses the sign-in that resetPassword and verifyEmail make', async function () {
    if (!passwordLoginOff()) this.skip();
    for (const methodName of ['resetPassword', 'verifyEmail']) {
      const a = await attempt('some-token', methodName);
      expect(a.allowed, methodName).to.equal(false);
      expect(a.error && a.error.error, methodName).to.equal('password-login-disabled');
    }
  });

  it('keeps the LDAP handler fallback while LDAP and LDAP_LOGIN_FALLBACK are on', async function () {
    if (!passwordLoginOff()) this.skip();
    setEnv('LDAP_ENABLE', 'true');
    setEnv('LDAP_LOGIN_FALLBACK', 'true');
    if (authEnv('LDAP_ENABLE') !== 'true' || authEnv('LDAP_LOGIN_FALLBACK') !== 'true') this.skip();
    const a = await attempt({ ldap: true, username, ldapPass: PASSWORD, ldapOptions: {} });
    expect(a.error && a.error.error).to.not.equal('password-login-disabled');
  });

  it('allows the DDP password sign-in while password login is on (negative)', async function () {
    setEnv('PASSWORD_LOGIN_ENABLED', 'true');
    if (authEnv('PASSWORD_LOGIN_ENABLED') === 'false') this.skip();
    const a = await attempt({ user: { username }, password: PASSWORD });
    expect(a.error && a.error.error).to.not.equal('password-login-disabled');
  });

  it('refuses POST /users/login with 403, for a known and an unknown user alike', async function () {
    if (!passwordLoginOff()) this.skip();
    setEnv('LDAP_ENABLE', 'false');
    for (const body of [{ username, password: PASSWORD }, { username: `nobody-${Random.id(6)}`, password: 'x' }]) {
      const res = await restLogin(body);
      expect(res.status).to.equal(403);
      const json = await res.json();
      expect(json.error).to.equal('password-login-disabled');
      expect(json.token).to.equal(undefined);
    }
  });

  it('signs in through POST /users/login while password login is on (negative)', async function () {
    setEnv('PASSWORD_LOGIN_ENABLED', 'true');
    setEnv('LDAP_ENABLE', 'false');
    if (authEnv('PASSWORD_LOGIN_ENABLED') === 'false' || authEnv('LDAP_ENABLE') === 'true') this.skip();
    const res = await restLogin({ username, password: PASSWORD });
    expect(res.status).to.equal(200);
    const json = await res.json();
    // sendJsonResult writes `data` as the body itself.
    expect(json.id).to.equal(userId);
    expect(json.token).to.be.a('string');
  });

  it('refuses forgotPassword while forgot password is disabled', async function () {
    const handler = Meteor.server.method_handlers.forgotPassword;
    if (!handler) this.skip();
    const setting = await Settings.findOneAsync({});
    if (!setting) this.skip();
    const before = setting.disableForgotPassword;
    await Settings.updateAsync(setting._id, { $set: { disableForgotPassword: true } });
    try {
      let error;
      try {
        await handler.call({ userId: null, connection: null }, { email: 'nobody@example.invalid' });
      } catch (e) { error = e; }
      expect(error && error.error).to.equal('forgot-password-disabled');
    } finally {
      await Settings.updateAsync(setting._id, before === undefined
        ? { $unset: { disableForgotPassword: '' } } : { $set: { disableForgotPassword: before } });
    }
  });
});
