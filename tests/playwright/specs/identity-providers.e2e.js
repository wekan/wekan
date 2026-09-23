'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { waitForMeteor } = require('../helpers/auth');
const provider = process.env.WEKAN_TEST_IDENTITY_URL;
test.use({ launchOptions: { args: ['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1'] } });
const hosts = { 'accounts.google.com': 'google', 'github.com': 'github', 'www.facebook.com': 'facebook',
  'api.twitter.com': 'twitter', 'www.meteor.com': 'meteor-developer', 'api.weibo.com': 'weibo', 'secure.meetup.com': 'meetup' };
async function control(request, mode = 'allow', user = 'alice') { await request.post(`${provider}/__control`, { data: { mode, user } }); }
async function events(request) { return (await request.get(`${provider}/__events`)).json(); }
async function session(page) { return page.evaluate(() => window.Meteor?.userId() || null); }
async function signIn(page) { await page.goto('/sign-in'); await waitForMeteor(page); }
async function invoke(page, method, options = {}) {
  await page.evaluate(({ method, options }) => {
    window.identityResult = null;
    Meteor[method](options, error => { window.identityResult = error ? { error: error.error || error.message, reason: error.reason } : { ok: true }; });
  }, { method, options });
}
test.describe('real identity provider protocol contracts', () => {
  test.skip(!provider, 'Run tests/integration/login-providers/run.cjs against a prepared bundle');
  test.beforeEach(async ({ context, request, adminUser }) => {
    // Seed only an unrelated admin, preventing first-user administrator promotion.
    expect(adminUser.id).toBeTruthy();
    await control(request);
    const setting = db.findOne('settings', {});
    db.updateOne('settings', { _id: setting._id }, { $set: { displayAuthenticationMethod: true, defaultAuthenticationMethod: 'password' } });
    await context.route('**/_oauth/twitter/?requestTokenAndRedirect=*', async route => {
      const response = await request.get(route.request().url(), { maxRedirects: 0 });
      const target = new URL(response.headers().location);
      expect(target.hostname).toBe('api.twitter.com');
      const authorization = await request.get(`${provider}/authorize/twitter${target.search}`, { maxRedirects: 0 });
      await route.fulfill({ status: authorization.status(), headers: authorization.headers(), body: await authorization.body() });
    });
    await context.route('https://**/*', async route => {
      const url = new URL(route.request().url());
      const service = hosts[url.hostname];
      if (!service) return route.abort('blockedbyclient');
      const response = await request.get(`${provider}/authorize/${service}${url.search}`, { maxRedirects: 0 });
      await route.fulfill({ status: response.status(), headers: response.headers(), body: await response.body() });
    });
  });
  test.afterEach(async ({ request }, testInfo) => {
    const trace = testInfo.outputPath('identity-requests.json');
    require('node:fs').writeFileSync(trace, JSON.stringify(await events(request), null, 2));
    await testInfo.attach('identity-requests', { path: trace, contentType: 'application/json' });
    const users = db.find('users', { $or: [{ 'emails.address': { $regex: '^alice\\..*@example\\.invalid$' } }, { 'services.weibo.id': '123456789' }, { 'services.meetup.id': 'alice-meetup' }] });
    db.cleanup({ userIds: users.map(user => user._id) });
  });

  for (const [password, succeeds] of [['Alice-test-password', true], ['incorrect-test-password', false]]) {
    test(`LDAP real search and bind: ${succeeds ? 'creates mapped user and session' : 'wrong password is refused'}`, async ({ page, request }) => {
      await signIn(page);
      await page.locator('.select-authentication').selectOption('ldap');
      await page.locator('#at-field-username_and_email').fill('alice');
      await page.locator('#at-field-password').fill(password);
      await page.locator('#at-btn').click();
      if (succeeds) {
        await expect.poll(() => session(page)).toBeTruthy();
        const user = db.findOne('users', { _id: await session(page) });
        expect(user.username).toBe('alice'); expect(user.emails[0].address).toBe('alice.ldap@example.invalid');
        expect(user.authenticationMethod).toBe('ldap'); expect(user.isAdmin).not.toBe(true);
        expect(user.profile.fullname).toBe('Alice Directory');
        await page.reload(); await waitForMeteor(page); await expect.poll(() => session(page)).toBe(user._id);
      } else {
        await expect(page.locator('#login-error-message')).toContainText('LDAP Authentication failed');
        expect(await session(page)).toBeNull();
        expect(db.findOne('users', { username: 'alice' })).toBeNull();
      }
      const wire = await events(request);
      expect(wire.some(e => e.operation === 'search' && e.base === 'dc=example,dc=invalid' && e.filter.includes('alice'))).toBe(true);
      expect(wire.some(e => e.operation === 'bind' && e.dn === 'uid=alice,dc=example,dc=invalid' && e.accepted === succeeds)).toBe(true);
    });
  }

  test('LDAP REST login returns a working token and rejects a wrong password', async ({ request, page }) => {
    const denied = await request.post('/users/login', { data: { username: 'alice', password: 'incorrect-test-password' } });
    expect(denied.status()).toBe(401);
    expect((await denied.json()).token).toBeUndefined();
    const accepted = await request.post('/users/login', { data: { username: 'alice', password: 'Alice-test-password' } });
    expect(accepted.ok()).toBe(true);
    const returned = await accepted.json();
    expect(returned.id).toBeTruthy(); expect(returned.token).toBeTruthy();
    expect(new Date(returned.tokenExpires).getTime()).toBeGreaterThan(Date.now());
    await signIn(page);
    await page.evaluate(token => new Promise((resolve, reject) => Meteor.loginWithToken(token,
      error => error ? reject(new Error(JSON.stringify(error))) : resolve())), returned.token);
    expect(await session(page)).toBe(returned.id);
    expect(db.findOne('users', { _id: returned.id }).authenticationMethod).toBe('ldap');
    expect((await events(request)).filter(e => e.operation === 'bind' && e.dn.startsWith('uid=')).map(e => e.accepted)).toEqual([false, true]);
  });

  for (const mode of ['allow', 'deny', 'bad-token', 'empty-userinfo']) {
    test(`OAuth2/OIDC authorization, token and profile exchange: ${mode}`, async ({ page, request }) => {
      await control(request, mode); await signIn(page);
      await invoke(page, 'loginWithOidc');
      await expect.poll(() => page.evaluate(() => window.identityResult)).toBeTruthy();
      if (mode === 'allow') {
        await expect.poll(() => session(page)).toBeTruthy();
        const user = db.findOne('users', { _id: await session(page) });
        expect(user.services.oidc.id).toBe('alice-oidc'); expect(user.services.oidc.email).toBe('alice.oidc@example.invalid');
        expect(user.isAdmin).not.toBe(true);
        const wire = await events(request);
        expect(wire.find(e => e.operation === 'authorize').params.scope).toContain('openid');
        expect(wire.find(e => e.operation === 'token')).toMatchObject({ clientId: 'fixture-client', secretMatches: true, grant: 'authorization_code', accepted: true });
        expect(wire.some(e => e.operation === 'userinfo' && e.bearerAccepted)).toBe(true);
      } else {
        expect((await page.evaluate(() => window.identityResult)).error).toBeTruthy();
        expect(await session(page)).toBeNull();
        expect(db.find('users', { 'services.oidc.id': 'alice-oidc' })).toHaveLength(0);
      }
    });
  }

  for (const mode of ['allow', 'unsigned', 'tampered', 'expired']) {
    test(`SAML signed assertion and mapped account: ${mode}`, async ({ page, request }) => {
      await control(request, mode); await signIn(page);
      await invoke(page, 'loginWithSaml', { provider: 'fixture' });
      await expect.poll(() => page.evaluate(() => window.identityResult)).toBeTruthy();
      const result = await page.evaluate(() => window.identityResult);
      if (mode === 'allow') {
        expect(result).toEqual({ ok: true });
        const user = db.findOne('users', { _id: await session(page) });
        expect(user.emails[0].address).toBe('alice.saml@example.invalid');
        expect(user.authenticationMethod).toBe('saml'); expect(user.profile.fullname).toBe('Alice SAML');
      } else { expect(result.error).toBeTruthy(); expect(await session(page)).toBeNull(); }
      expect((await events(request)).some(e => e.protocol === 'saml' && e.operation === 'authorize')).toBe(true);
    });
  }

  for (const mode of ['allow', 'deny']) {
    test(`CAS ticket validation: ${mode}`, async ({ page, request }) => {
      await control(request, mode); await signIn(page);
      await invoke(page, 'loginWithCas');
      await expect.poll(async () => (await events(request)).some(e => e.protocol === 'cas' && e.operation === 'validate')).toBe(true);
      if (mode === 'allow') {
        await expect.poll(() => session(page)).toBeTruthy();
        const user = db.findOne('users', { _id: await session(page) });
        expect(user.username).toBe('alice.cas'); expect(user.emails[0].address).toBe('alice.cas@example.invalid');
        expect(user.profile.fullname).toBe('Alice CAS'); expect(user.authenticationMethod).toBe('cas');
      } else {
        await expect.poll(() => page.evaluate(() => window.identityResult)).toBeTruthy();
        expect((await page.evaluate(() => window.identityResult)).error).toBeTruthy(); expect(await session(page)).toBeNull();
      }
    });
  }

  for (const service of ['google', 'github', 'facebook', 'twitter', 'meteor-developer', 'weibo', 'meetup']) {
    for (const mode of ['allow', 'deny']) test(`${service} real Meteor adapter: ${mode}`, async ({ page, request }) => {
      await control(request, mode); await signIn(page);
      await page.locator(`.js-oauth-provider[data-provider="${service}"]`).click();
      if (mode === 'allow') {
        await expect.poll(() => session(page)).toBeTruthy();
        const user = db.findOne('users', { _id: await session(page) });
        expect(user.services[service].id).toBe(service === 'weibo' ? '123456789' : `alice-${service}`);
        expect(user.authenticationMethod).toBe(service);
        expect(user.profile.fullname).toBe(service === 'weibo' ? 'alice.weibo' : service === 'twitter' ? 'Alice Twitter' : `Alice ${service}`);
        if (!['weibo', 'meetup'].includes(service)) expect(user.emails[0].address).toBe(`alice.${service}@example.invalid`);
        expect(user.isAdmin).not.toBe(true);
        const wire = await events(request);
        expect(wire.some(e => e.operation === 'token' && e.secretMatches && e.accepted)).toBe(true);
        expect(wire.some(e => e.operation === 'userinfo' && e.bearerAccepted)).toBe(true);
      } else {
        await expect(page.locator('#login-error-message')).not.toBeEmpty();
        expect(await session(page)).toBeNull();
      }
    });
  }
});

// Local accounts still exercise the real password hashing and Accounts methods.
test.describe('local password, TOTP and emailed one-time code', () => {
  test.skip(!provider, 'Requires local identity/SMTP runner');
  test.beforeEach(async ({ adminUser }) => { expect(adminUser.id).toBeTruthy(); });
  test.afterEach(() => db.cleanup({ userIds: db.find('users', { username: { $in: ['alice.password', 'alice.passwordless'] } }).map(u => u._id) }));
  async function create(page, username) {
    await signIn(page);
    await page.goto('/sign-up'); await waitForMeteor(page);
    await page.locator('#at-field-username').fill(username);
    await page.locator('#at-field-email').fill(`${username}@example.invalid`);
    await page.locator('#at-field-password').fill('Alice-local-password-42!');
    await page.locator('#at-field-password_again').fill('Alice-local-password-42!');
    await page.locator('#at-btn').click();
    await expect.poll(() => db.findOne('users', { username })).toBeTruthy();
    await page.evaluate(username => new Promise((resolve, reject) => Meteor.loginWithPassword(username,
      'Alice-local-password-42!', error => error ? reject(new Error(JSON.stringify(error))) : resolve())), username);
    return session(page);
  }
  async function logout(page) { await page.evaluate(() => new Promise(resolve => Meteor.logout(resolve))); await signIn(page); }
  async function password(page, value, enter = false) {
    await page.locator('#at-field-username_and_email').fill('alice.password');
    await page.locator('#at-field-password').fill(value);
    if (enter) await page.locator('#at-field-password').press('Enter');
    else await page.locator('#at-btn').click();
  }
  function totp(secret) {
    const crypto = require('node:crypto');
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = ''; for (const c of secret.replace(/=+$/, '')) bits += alphabet.indexOf(c).toString(2).padStart(5, '0');
    const bytes = []; for (let n = 0; n + 8 <= bits.length; n += 8) bytes.push(parseInt(bits.slice(n, n + 8), 2));
    const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
    const digest = crypto.createHmac('sha1', Buffer.from(bytes)).update(counter).digest(); const offset = digest[19] & 15;
    return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, '0');
  }
  test('password and TOTP enforce both factors and preserve the real user session', async ({ page }) => {
    const id = await create(page, 'alice.password'); await logout(page);
    await password(page, 'incorrect-password'); await expect(page.locator('#login-error-message')).not.toBeEmpty(); expect(await session(page)).toBeNull();
    await password(page, 'Alice-local-password-42!'); await expect.poll(() => session(page)).toBe(id);
    await page.reload(); await waitForMeteor(page);
    await expect.poll(() => session(page)).toBe(id);
    await logout(page); await password(page, 'Alice-local-password-42!', true);
    await expect.poll(() => session(page)).toBe(id);
    const activation = await page.evaluate(() => Meteor.callAsync('generate2faActivationQrCode', 'WeKan fixture'));
    await page.evaluate(code => Meteor.callAsync('enableUser2fa', code), totp(activation.secret));
    await logout(page); await password(page, 'Alice-local-password-42!');
    await expect(page.locator('#two-factor-code-input')).toBeVisible(); expect(await session(page)).toBeNull();
    await page.locator('#two-factor-code-input').fill(totp(activation.secret) === '000000' ? '111111' : '000000');
    await page.locator('#two-factor-code-container input[type=submit]').click();
    await expect(page.locator('#two-factor-code-error')).toBeVisible(); expect(await session(page)).toBeNull();
    await page.locator('#two-factor-code-input').fill(totp(activation.secret));
    await page.locator('#two-factor-code-container input[type=submit]').click();
    await expect.poll(() => session(page)).toBe(id);
  });
  test('passwordless sends SMTP code, rejects a wrong code and rejects reuse', async ({ page, request }) => {
    const id = await create(page, 'alice.passwordless'); await logout(page);
    await page.locator('#passwordless-email').fill('alice.passwordless@example.invalid');
    await page.locator('.js-passwordless-send').click();
    let message;
    await expect.poll(async () => {
      const mail = await (await request.get(`${provider}/__mail`)).json();
      message = mail.filter(m => m.recipients.includes('alice.passwordless@example.invalid') && m.data.includes('token')).at(-1);
      return !!message;
    }).toBe(true);
    const text = message.data.replace(/=\r\n/g, '');
    const match = /logged in:(?:<br\s*\/?>(?:\r?\n)?)?\s*([A-F0-9]{6,})/i.exec(text);
    expect(match, text).toBeTruthy(); const code = match[1];
    await page.locator('#passwordless-code').fill(code === '000000' ? '111111' : '000000');
    await page.locator('#passwordless-code-form input[type=submit]').click();
    await expect(page.locator('#login-error-message')).not.toBeEmpty(); expect(await session(page)).toBeNull();
    await page.locator('#passwordless-code').fill(code);
    await page.locator('#passwordless-code-form input[type=submit]').click(); await expect.poll(() => session(page)).toBe(id);
    expect(db.findOne('users', { _id: id }).services.passwordless).toBeUndefined();
    expect(db.findOne('users', { _id: id }).emails[0].verified).toBe(true);
    await logout(page);
    const reused = await page.evaluate(code => new Promise(resolve => Meteor.passwordlessLoginWithToken({ email: 'alice.passwordless@example.invalid' }, code, error => resolve(!!error))), code);
    expect(reused).toBe(true); expect(await session(page)).toBeNull();
  });
});


test.describe('trusted reverse proxy identity', () => {
  test.skip(!provider, 'Requires isolated identity runner');
  test.beforeEach(async ({ adminUser }) => { expect(adminUser.id).toBeTruthy(); });
  test.afterEach(() => db.cleanup({ userIds: db.find('users', { username: 'alice.header' }).map(u => u._id) }));
  for (const trusted of [true, false]) test(`header login ${trusted ? 'accepts trusted proxy identity' : 'rejects an untrusted client'}`, async ({ page, context }) => {
    await context.setExtraHTTPHeaders({ 'x-fixture-user': 'alice.header', 'x-fixture-email': 'alice.header@example.invalid',
      'x-fixture-firstname': 'Alice', 'x-fixture-lastname': 'Header', 'x-forwarded-for': trusted ? '192.0.2.10' : '198.51.100.11' });
    await signIn(page);
    if (trusted) {
      await expect.poll(() => session(page)).toBeTruthy();
      const user = db.findOne('users', { _id: await session(page) });
      expect(user.username).toBe('alice.header'); expect(user.profile.fullname).toBe('Alice Header');
      expect(user.emails[0].address).toBe('alice.header@example.invalid'); expect(user.isAdmin).not.toBe(true);
      const cookie = (await context.cookies()).find(c => c.name === 'meteor_login_token');
      expect(cookie.httpOnly).toBe(true); expect(['Lax', 'Strict']).toContain(cookie.sameSite);
    } else {
      expect(await session(page)).toBeNull();
      expect((await context.cookies()).some(c => c.name === 'meteor_login_token')).toBe(false);
      expect(db.findOne('users', { username: 'alice.header' })).toBeNull();
    }
  });
});
