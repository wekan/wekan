'use strict';

// SamlSubjectBleed (GHSA-966m-4qgp-j8w4, CWE-287): SAML login matched mutable
// usernames/emails and overwrote the stored NameID, so another IdP subject
// claiming the same username took over the account. Accounts are now resolved
// by issuer + qualified NameID, never rebound, linked atomically, and email is
// verified only on an explicit assertion. Conflicts trip saml.subject-conflict.
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
      // MongoDB and FerretDB: null in $in also matches a missing field.
      if ('$in' in expected) return expected.$in.some(value => (value === null ? actual == null : actual === value));
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

// A binding stored before the optional qualifiers were written has no
// nameQualifier / spNameQualifier keys at all. A query for '' does not match a
// missing field, so the returning user was found only by username and refused
// as account-already-bound-to-saml.
const withoutQualifiers = (user) => {
  delete user.services.saml.nameQualifier; delete user.services.saml.spNameQualifier; return user;
};

test('a binding without the optional qualifiers logs in, and is normalized', async () => {
  const old = withoutQualifiers({ ...victim(), authenticationMethod: 'ldap' });
  for (const mergeExistingUsers of [false, true]) {
    const h = harness([clone(old)], { mergeExistingUsers });
    assert.equal((await h.login(subject)).userId, 'victim');
    assert.equal(h.users.length, 1, 'no second account');
    assert.equal(h.users[0].services.saml.nameQualifier, '');
    assert.equal(h.users[0].services.saml.spNameQualifier, '');
    // and the normalized record matches exactly on the next login
    assert.equal((await h.login(subject)).userId, 'victim');
  }
});

test('a missing qualifier never matches a NON-empty one, and a missing issuer stays refused (negative)', async () => {
  const old = withoutQualifiers(victim());
  for (const patch of [{ nameQualifier: 'idp-scope' }, { spNameQualifier: 'sp-scope' }]) {
    const h = harness([clone(old)], { mergeExistingUsers: true });
    await assert.rejects(h.login({ ...subject, ...patch }), { error: 'saml-account-conflict' });
    assert.deepEqual(h.users, [old], 'nothing was written');
  }
  // A stored non-empty qualifier is not matched by an empty one either.
  const scoped = victim(); scoped.services.saml.nameQualifier = 'idp-scope';
  const h = harness([clone(scoped)], { mergeExistingUsers: true });
  await assert.rejects(h.login(subject), { error: 'saml-account-conflict' });
  assert.equal(h.users[0].services.saml.nameQualifier, 'idp-scope');
  // Only the two optional qualifiers are tolerant.
  const sel = identity.samlIdentitySelector(identity.samlIdentity(subject));
  assert.deepEqual(sel['services.saml.nameQualifier'], { $in: ['', null] });
  assert.deepEqual(sel['services.saml.spNameQualifier'], { $in: ['', null] });
  for (const field of ['issuer', 'nameID', 'nameIDFormat']) assert.equal(typeof sel[`services.saml.${field}`], 'string', field);
  const exact = identity.samlIdentitySelector(identity.samlIdentity({ ...subject, nameQualifier: 'q' }));
  assert.equal(exact['services.saml.nameQualifier'], 'q');
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

// SAML linking report (v12.33, F5 BIG-IP, LDAP-provisioned accounts): every
// refusal said "SAML identity does not match this account", so a missing
// email_verified attribute looked like an attack, and nothing was logged.
const ldapUser = () => ({ _id: 'ldap', username: 'jdoe', authenticationMethod: 'ldap', emails: [{ address: subject.email, verified: true }] });
const GENERIC = /^SAML identity does not match this account\. Contact your administrator\.$/;
async function quietly(fn) {
  const warn = console.warn, lines = [];
  console.warn = (...args) => lines.push(args.join(' '));
  try { return { result: await fn().catch(err => err), lines }; } finally { console.warn = warn; }
}

test('each link refusal has its own reason in the server log, and assertion faults say what is missing', async () => {
  const cases = [
    [{ mergeExistingUsers: true, localProfileMatchAttribute: 'username' }, { username: 'jdoe' }, /email_verified=true/, /no-email_verified/],
    [{ mergeExistingUsers: true, localProfileMatchAttribute: 'username', identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent' }, { username: 'jdoe', email: undefined, email_verified: true }, /has no email address/, /assertion-has-no-email$/],
    [{ localProfileMatchAttribute: 'username' }, { username: 'jdoe', email_verified: true }, GENERIC, /merge-disabled/],
    [{ mergeExistingUsers: true, localProfileMatchAttribute: 'username' }, { username: 'jdoe', email: 'other@example.invalid', email_verified: true }, GENERIC, /not-a-verified-email-of-this-account/],
  ];
  for (const [config, attrs, message, reason] of cases) {
    const h = harness([ldapUser()], config);
    const { result, lines } = await quietly(() => h.login({ ...subject, ...attrs }));
    assert.equal(result.error, 'saml-account-conflict', JSON.stringify(attrs));
    assert.match(result.message, message, JSON.stringify(attrs));
    assert.equal(lines.length, 1);
    assert.match(lines[0], /refused to link the SAML login of "jdoe" to existing account "jdoe"/);
    assert.match(lines[0], reason);
    assert.deepEqual(h.users, [ldapUser()], 'nothing was linked');
  }
  // A bound account keeps the generic message: its state is not the IdP's to fix.
  const bound = victim();
  const { result, lines } = await quietly(() => harness([bound], { mergeExistingUsers: true }).login({ ...subject, nameID: 'attacker', email_verified: true }));
  assert.match(result.message, GENERIC);
  assert.match(lines[0], /account-already-bound-to-saml/);
});

test('an email login name finds the existing account by its verified email when merging is on', async () => {
  for (const config of [{ mergeExistingUsers: true }, { mergeExistingUsers: true, localProfileMatchAttribute: 'email' }]) {
    const h = harness([ldapUser()], config);
    assert.equal((await h.login({ ...subject, email_verified: 'true' })).userId, 'ldap');
    assert.equal(h.users.length, 1, 'no second account was created');
    assert.deepEqual(h.users[0].services.saml, { ...identity.samlIdentity(subject), sessionIndex: '' });
  }
});

test('the email lookup never links without merging, IdP attestation, or a verified local email (negative)', async () => {
  // Merging off: no email lookup at all, so this is an ordinary new SAML account.
  let h = harness([ldapUser()]);
  const { result } = await quietly(() => h.login({ ...subject, username: 'x', email_verified: true }));
  assert.equal(h.users.find(u => u._id === 'ldap').services, undefined, String(result && result.message));
  // Merging on but the IdP does not attest the email: refused, nothing linked.
  h = harness([ldapUser()], { mergeExistingUsers: true });
  const refused = await quietly(() => h.login({ ...subject }));
  assert.equal(refused.result.error, 'saml-account-conflict');
  assert.deepEqual(h.users, [ldapUser()]);
  // The local email is unverified: the lookup does not even find it.
  const unverified = { ...ldapUser(), emails: [{ address: subject.email, verified: false }] };
  h = harness([unverified], { mergeExistingUsers: true });
  await quietly(() => h.login({ ...subject, email_verified: true }));
  assert.equal(h.users.find(u => u._id === 'ldap').services, undefined);
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
