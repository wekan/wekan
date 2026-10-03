'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const identity = require('../packages/wekan-accounts-saml/identity');
const source = fs.readFileSync('packages/wekan-accounts-saml/saml_server.js', 'utf8');
const subject = { issuer: 'idp', nameID: 'victim-subject', nameIDFormat: 'persistent', email: 'victim@example.invalid' };
const clone = value => JSON.parse(JSON.stringify(value));
function matches(doc, query) {
  return Object.entries(query).every(([key, expected]) => {
    const actual = key.split('.').reduce((value, part) => value?.[part], doc);
    if (expected && typeof expected === 'object') {
      if ('$exists' in expected) return (actual !== undefined) === expected.$exists;
      if ('$ne' in expected) return actual !== expected.$ne;
      if ('$elemMatch' in expected) return actual?.some(value => matches(value, expected.$elemMatch));
    }
    return actual === expected;
  });
}
function harness(initial = [], config = {}) {
  const users = clone(initial), events = [];
  let login, race;
  class MeteorError extends Error { constructor(code, reason) { super(reason || code); this.error = code; } }
  const context = vm.createContext({
    ...identity, ...require('../packages/wekan-accounts-saml/responseReplay'), console,
    global: { __wekanTripCanary: (...args) => { events.push(args); if (config.logThrows) throw Error('logger unavailable'); } },
    bodyParser: { urlencoded: () => () => {} }, WebApp: { connectHandlers: { use() {} } },
    ServiceConfiguration: { configurations: { findOneAsync: async () => ({ enabled: true, ...config }) } },
    Accounts: {
      LoginCancelledError: { numericError: 145 }, registerLoginHandler(fn) { login = fn; },
      async insertUserDoc(_options, doc) { const user = { _id: String(users.length + 1), ...clone(doc) }; users.push(user); return user._id; },
    },
    Meteor: { Error: MeteorError, methods() {}, users: {
      async findOneAsync(query) { const doc = users.find(user => typeof query === 'string' ? user._id === query : matches(user, query)); return doc && clone(doc); },
      async updateAsync(query, modifier) {
        if (race) { const fn = race; race = null; fn(users); }
        const user = users.find(user => matches(user, query)); if (!user) return 0;
        for (const [key, value] of Object.entries(modifier.$set)) {
          const parts = key.split('.'); let target = user;
          for (const part of parts.slice(0, -1)) target = target[part] ||= {};
          target[parts.at(-1)] = clone(value);
        }
        return 1;
      },
    } },
  });
  vm.runInContext(source.replace(/^import .*;$/gm, ''), context);
  return { users, events, race(fn) { race = fn; }, async login(profile) {
    context.testProfile = profile;
    vm.runInContext("_storeCredential('test', { profile: testProfile })", context);
    return login({ saml: { credentialToken: 'test' } });
  } };
}
function victim() { return { _id: 'victim', username: subject.email, authenticationMethod: 'saml', services: { saml: identity.samlIdentity(subject) } }; }

test('first login persists identity at insertion; repeat login follows subject despite renamed email', async () => {
  const h = harness(); const first = await h.login(subject);
  assert.equal(h.users[0].emails[0].verified, false);
  assert.equal(h.users[0].services.saml.issuer, subject.issuer);
  const again = await h.login({ ...subject, email: 'renamed@example.invalid', sessionIndex: 'new-session' });
  assert.equal(again.userId, first.userId); assert.equal(h.users.length, 1);
  assert.equal(h.users[0].services.saml.sessionIndex, 'new-session'); assert.equal(h.events.length, 0);
});

test('reported takeover and every identity component mismatch fail, even with merge enabled and broken logging', async () => {
  for (const mergeExistingUsers of [false, true]) for (const field of ['nameID', 'issuer', 'nameIDFormat', 'nameQualifier', 'spNameQualifier']) {
    const h = harness([victim()], { mergeExistingUsers, logThrows: true }); const before = clone(h.users);
    await assert.rejects(h.login({ ...subject, [field]: 'attacker' }), { error: 'saml-account-conflict' });
    assert.deepEqual(h.users, before); assert.equal(h.events[0][0], 'saml.subject-conflict');
  }
});

test('legacy identities never trust the next assertion to establish missing issuer', async () => {
  const old = victim(); delete old.services.saml.issuer;
  for (const mergeExistingUsers of [false, true]) {
    const h = harness([old], { mergeExistingUsers });
    await assert.rejects(h.login(subject), { error: 'saml-account-conflict' });
    assert.deepEqual(h.users, [old]);
  }
});

test('missing, malformed and transient subjects cannot fall back to email', async () => {
  for (const patch of [{ nameID: undefined }, { nameID: { $ne: null } }, { issuer: '' }, { email: [] }, { nameIDFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient' }]) {
    const h = harness(); await assert.rejects(h.login({ ...subject, ...patch }), { error: 'saml-no-identifier' }); assert.equal(h.users.length, 0);
  }
});

test('linking requires opt-in and explicit verified matching email on both sides', async () => {
  const local = { _id: 'local', username: subject.email, authenticationMethod: 'password', emails: [{ address: subject.email, verified: true }] };
  for (const claim of [undefined, false, 'false', ['true'], 1]) {
    const h = harness([local], { mergeExistingUsers: true });
    await assert.rejects(h.login({ ...subject, email_verified: claim }), { error: 'saml-account-conflict' }); assert.deepEqual(h.users, [local]);
  }
  await assert.rejects(harness([local]).login({ ...subject, email_verified: true }), { error: 'saml-account-conflict' });
  for (const claim of [true, 'true']) {
    const h = harness([local], { mergeExistingUsers: true });
    assert.equal((await h.login({ ...subject, email_verified: claim })).userId, 'local');
    await assert.rejects(h.login({ ...subject, nameID: 'attacker', email_verified: claim }), { error: 'saml-account-conflict' });
  }
  local.emails[0].verified = false;
  await assert.rejects(harness([local], { mergeExistingUsers: true }).login({ ...subject, email_verified: true }), { error: 'saml-account-conflict' });
});

test('conditional writes reject concurrent links and binding changes before login completes', async () => {
  const local = { _id: 'local', username: subject.email, emails: [{ address: subject.email, verified: true }] };
  for (const initial of [local, victim()]) {
    const h = harness([initial], { mergeExistingUsers: true });
    h.race(users => { users[0].services = { saml: { ...identity.samlIdentity(subject), nameID: 'other' } }; });
    await assert.rejects(h.login({ ...subject, email_verified: true }), { error: 'saml-account-conflict' });
    assert.equal(h.users[0].services.saml.nameID, 'other');
  }
});

test('whole tracked source tree has one SAML account-binding implementation and no blind replacement', () => {
  const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0')
    .filter(file => /\.js$/.test(file) && !/^(tests|old-CHANGELOG|_build|\.build|\.tools)\//.test(file));
  const writers = files.filter(file => /['"]services\.saml['"]\s*:/.test(fs.readFileSync(file, 'utf8')));
  assert.deepEqual(writers, ['packages/wekan-accounts-saml/saml_server.js']);
  assert.doesNotMatch(source, /nameID\s*:\s*profile\.nameID|verified:\s*true\s*\}\]\s*:\s*\[\]/);
  assert.match(source, /_id: user\._id, \.\.\.identitySelector/);
});

test('real signed assertions with identical email and different NameID cannot share an account', async t => {
  const path = require('node:path');
  const { SAML } = require('@node-saml/node-saml');
  const { startProvider } = require('./integration/login-providers/provider.cjs');
  const work = fs.mkdtempSync(path.resolve('.tools/tmp/saml-subject-'));
  t.after(() => fs.rmSync(work, { recursive: true, force: true }));
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', work + '/key.pem', '-out', work + '/cert.pem', '-days', '2', '-subj', '/CN=WeKan-test-only'], { stdio: 'ignore' });
  const certificate = fs.readFileSync(work + '/cert.pem', 'utf8');
  const provider = await startProvider({ certificate, privateKey: fs.readFileSync(work + '/key.pem', 'utf8') });
  t.after(() => provider.close());
  const saml = new SAML({ entryPoint: provider.url + '/saml', callbackUrl: 'http://wekan.invalid/_saml/validate/default', issuer: 'wekan-test', idpCert: certificate, validateInResponseTo: 'always', wantAssertionsSigned: false });
  const h = harness();
  provider.state.samlEmail = subject.email;
  async function signedProfile(nameID) {
    provider.state.samlNameID = nameID;
    const html = await (await fetch(await saml.getAuthorizeUrlAsync('token', undefined, {}))).text();
    return (await saml.validatePostResponseAsync({ SAMLResponse: /name="SAMLResponse" value="([^"]+)"/.exec(html)[1] })).profile;
  }
  const first = await h.login(await signedProfile('victim'));
  await assert.rejects(h.login(await signedProfile('attacker')), { error: 'saml-account-conflict' });
  assert.equal((await h.login(await signedProfile('victim'))).userId, first.userId);
  assert.equal(h.users.length, 1); assert.equal(h.users[0].services.saml.nameID, 'victim');
});
