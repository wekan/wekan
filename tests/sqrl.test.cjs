'use strict';

// #2460: SQRL login. A software SQRL client signs with real Ed25519 keys and
// talks to the real protocol handler (models/lib/sqrl.js) over an in-memory
// store that behaves like server/sqrl.js's: each nut is taken once.
// Run: node tests/sqrl.test.cjs

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {
  TIF, toBase64url, fromBase64url, parseNameValues, encodeNameValues, siteOf, sqrlLink, handleSqrlRequest,
  sqrlLocks, sqrlRefusesLogin,
} = require('../models/lib/sqrl.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const site = siteOf('https://wekan.example.org/');
const LATER = new Date(Date.now() + 600000);

// --- the server's storage, in memory -----------------------------------------
function memoryStore() {
  const nuts = new Map();
  const sessions = new Map();
  const users = new Map(); // userId -> { idk, suk, vuk, disabled }
  return {
    nuts, sessions, users,
    async takeNut(nut) { const doc = nuts.get(nut) || null; nuts.delete(nut); return doc; },
    async putNut(doc) { nuts.set(doc._id, doc); },
    async getSession(id) { return sessions.get(id) || null; },
    async findIdentity(idk) {
      for (const [userId, s] of users) if (s.idk === idk) return { userId, ...s };
      return null;
    },
    async associate(userId, keys) {
      if (users.has(userId)) return false;
      users.set(userId, { ...keys, disabled: false });
      return true;
    },
    async replace(userId, keys) { Object.assign(users.get(userId), keys); },
    async setOptions(userId, options) { Object.assign(users.get(userId), options); },
    async setDisabled(userId, disabled) { users.get(userId).disabled = disabled; },
    async remove(userId) { users.delete(userId); },
    async complete(id, { userId, cps }) {
      const s = sessions.get(id);
      if (!s || s.state !== 'pending') return null;
      if (s.purpose === 'associate') { s.state = 'done'; return null; }
      s.authUserId = userId;
      s.state = cps ? 'cps' : 'ready';
      return cps ? 'one-time-token' : null;
    },
  };
}

function startSession(store, { purpose, userId = null, ip = '203.0.113.7' }) {
  const nut = crypto.randomBytes(16).toString('base64url');
  const link = sqrlLink(site, nut, 'WeKan');
  store.sessions.set(nut, { _id: nut, purpose, userId, ip, state: 'pending', expiresAt: LATER });
  store.nuts.set(nut, { _id: nut, session: nut, expect: toBase64url(link), expiresAt: LATER });
  return { nut, server: toBase64url(link) };
}

const verify = (message, signature, key) => {
  try {
    const publicKey = crypto.createPublicKey({ key: { kty: 'OKP', crv: 'Ed25519', x: key }, format: 'jwk' });
    return crypto.verify(null, Buffer.from(message, 'utf8'), publicKey, Buffer.from(signature, 'base64url'));
  } catch (e) {
    return false;
  }
};

// --- a SQRL client -------------------------------------------------------------
function identity() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  return { key: publicKey.export({ format: 'jwk' }).x, privateKey };
}
const sign = (who, message) => crypto.sign(null, Buffer.from(message, 'utf8'), who.privateKey).toString('base64url');

// One request: returns the parsed reply and where to send the next one.
async function request(store, at, fields, { id, previous, unlock, ip = '203.0.113.7', signer, tamper } = {}) {
  const client = encodeNameValues({ ver: 1, idk: id.key, pidk: previous && previous.key, ...fields });
  const server = tamper || at.server;
  const parts = { client, server, ids: sign(signer || id, client + server) };
  if (previous) parts.pids = sign(previous, client + server);
  if (unlock) parts.urs = sign(unlock, client + server);
  const raw = await handleSqrlRequest({ site, nut: at.nut, body: new URLSearchParams(parts).toString(), ip, store, verify,
    newNut: () => crypto.randomBytes(16).toString('base64url') });
  const reply = parseNameValues(fromBase64url(raw));
  return { reply, tif: parseInt(reply.tif, 16), next: { nut: reply.nut, server: raw } };
}

(async () => {
  // The link: the site, a nut, the friendly name; x= for a WeKan in a path.
  assert.equal(sqrlLink(site, 'N', 'WeKan'), `sqrl://wekan.example.org/sqrl?nut=N&sfn=${toBase64url('WeKan')}`);
  const inPath = siteOf('https://example.org/wekan/');
  assert.equal(sqrlLink(inPath, 'N', 'W'), `sqrl://example.org/wekan/sqrl?nut=N&x=6&sfn=${toBase64url('W')}`);
  assert.equal(siteOf('http://wekan.example.org'), null, 'never over plain http');
  assert.equal(siteOf('https://user:pw@wekan.example.org'), null);
  assert.equal(siteOf('not a url'), null);
  console.log('  ok - the sqrl:// link');

  const store = memoryStore();
  const alice = identity();
  const aliceUnlock = identity();
  const suk = crypto.randomBytes(32).toString('base64url');

  // Member Settings: Alice adds her identity.
  let at = startSession(store, { purpose: 'associate', userId: 'alice' });
  let r = await request(store, at, { cmd: 'query' }, { id: alice });
  assert.equal(r.tif, TIF.IP_MATCH, 'a new identity: not known yet, same address');
  assert.equal(r.reply.ver, '1');
  assert.equal(r.reply.qry, `/sqrl?nut=${r.reply.nut}`);
  const sessionId = at.nut;
  r = await request(store, r.next, { cmd: 'ident', suk, vuk: aliceUnlock.key }, { id: alice });
  assert.equal(r.tif & TIF.COMMAND_FAILED, 0);
  assert.equal(r.tif & TIF.ID_MATCH, TIF.ID_MATCH);
  assert.deepEqual(store.users.get('alice'), { idk: alice.key, suk, vuk: aliceUnlock.key, disabled: false, sqrlOnly: false, hardlock: false });
  assert.equal(store.sessions.get(sessionId).state, 'done');
  console.log('  ok - an identity is added from Member Settings');

  // The sign-in page: Alice's client signs in the waiting page.
  at = startSession(store, { purpose: 'login' });
  r = await request(store, at, { cmd: 'query' }, { id: alice });
  assert.equal(r.tif, TIF.ID_MATCH | TIF.IP_MATCH);
  r = await request(store, r.next, { cmd: 'ident' }, { id: alice });
  assert.equal(r.tif & TIF.COMMAND_FAILED, 0);
  assert.equal(store.sessions.get(at.nut).state, 'ready');
  assert.equal(store.sessions.get(at.nut).authUserId, 'alice');
  assert.equal(r.reply.url, undefined);
  // Same device (cps): the client is handed a one-time sign-in address instead.
  at = startSession(store, { purpose: 'login' });
  r = await request(store, at, { cmd: 'ident', opt: 'cps' }, { id: alice });
  assert.equal(store.sessions.get(at.nut).state, 'cps');
  assert.equal(r.reply.url, 'https://wekan.example.org/sign-in?sqrl=one-time-token');
  // A phone on another network says so with noiptest.
  at = startSession(store, { purpose: 'login' });
  r = await request(store, at, { cmd: 'ident', opt: 'noiptest' }, { id: alice, ip: '198.51.100.9' });
  assert.equal(r.tif & (TIF.COMMAND_FAILED | TIF.IP_MATCH), 0);
  assert.equal(store.sessions.get(at.nut).state, 'ready');
  console.log('  ok - sign-in: the waiting page, the same device, another network');

  // sqrlonly and hardlock: every ident carries the member's current choice,
  // and a flag left out switches it off again.
  at = startSession(store, { purpose: 'login' });
  r = await request(store, at, { cmd: 'ident', opt: 'sqrlonly~hardlock' }, { id: alice });
  assert.equal(r.tif & TIF.COMMAND_FAILED, 0);
  assert.equal(store.users.get('alice').sqrlOnly, true);
  assert.equal(store.users.get('alice').hardlock, true);
  at = startSession(store, { purpose: 'login' });
  await request(store, at, { cmd: 'ident', opt: 'sqrlonly' }, { id: alice });
  assert.deepEqual([store.users.get('alice').sqrlOnly, store.users.get('alice').hardlock], [true, false]);
  at = startSession(store, { purpose: 'login' });
  await request(store, at, { cmd: 'ident' }, { id: alice });
  assert.deepEqual([store.users.get('alice').sqrlOnly, store.users.get('alice').hardlock], [false, false]);
  // Negative: a query, or a failed ident, changes nothing.
  at = startSession(store, { purpose: 'login' });
  await request(store, at, { cmd: 'query', opt: 'sqrlonly~hardlock' }, { id: alice });
  assert.equal(store.users.get('alice').sqrlOnly, false, 'a query sets nothing');
  at = startSession(store, { purpose: 'login' });
  r = await request(store, at, { cmd: 'ident', opt: 'sqrlonly' }, { id: alice, ip: '198.51.100.9' });
  assert.equal(r.tif & TIF.COMMAND_FAILED, TIF.COMMAND_FAILED);
  assert.equal(store.users.get('alice').sqrlOnly, false, 'a refused ident sets nothing');
  const intruder = identity();
  at = startSession(store, { purpose: 'login' });
  r = await request(store, at, { cmd: 'ident', opt: 'sqrlonly' }, { id: alice, signer: intruder });
  assert.equal(store.users.get('alice').sqrlOnly, false, 'a forged ident sets nothing');
  console.log('  ok - sqrlonly and hardlock follow the client\'s opt on every ident');

  // What the locks refuse.
  const locked = { idk: 'k', sqrlOnly: true, hardlock: true, disabled: false };
  assert.equal(sqrlRefusesLogin(locked, { type: 'password' }), 'sqrl-only');
  for (const type of ['oidc', 'ldap', 'saml', 'cas', 'passkey', 'nextcloud', 'password', 'google', undefined]) {
    assert.equal(sqrlRefusesLogin(locked, { type }), 'sqrl-only', `${type}: refused`);
  }
  assert.equal(sqrlRefusesLogin(locked, { type: 'sqrl' }), null, 'SQRL itself signs in');
  assert.equal(sqrlRefusesLogin(locked, { type: 'resume' }), null, 'a session SQRL started resumes');
  assert.equal(sqrlRefusesLogin(locked, { type: 'password', methodName: 'resetPassword' }), 'sqrl-hardlock');
  assert.equal(sqrlRefusesLogin({ ...locked, sqrlOnly: false }, { type: 'password', methodName: 'resetPassword' }), 'sqrl-hardlock');
  assert.equal(sqrlRefusesLogin({ ...locked, sqrlOnly: false }, { type: 'password', methodName: 'login' }), null);
  // Negative: nothing is locked by an unset, disabled or absent identity.
  for (const sqrl of [null, undefined, {}, { idk: 'k' }, { ...locked, disabled: true }, { ...locked, idk: undefined },
    { idk: 'k', sqrlOnly: 'yes', hardlock: 1 }]) {
    assert.deepEqual(sqrlLocks(sqrl), { sqrlOnly: false, hardlock: false }, JSON.stringify(sqrl));
    assert.equal(sqrlRefusesLogin(sqrl, { type: 'password', methodName: 'resetPassword' }), null);
  }
  console.log('  ok - sqrlonly refuses every other sign-in, hardlock the reset; a disabled identity locks nothing');

  // Negative: a forged signature, a replayed nut, a changed server value.
  const mallory = identity();
  at = startSession(store, { purpose: 'login' });
  r = await request(store, at, { cmd: 'ident' }, { id: alice, signer: mallory });
  assert.equal(r.tif, TIF.CLIENT_FAILURE | TIF.COMMAND_FAILED, 'signed with another key');
  assert.equal(store.sessions.get(at.nut).state, 'pending');
  const fresh = startSession(store, { purpose: 'login' });
  await request(store, fresh, { cmd: 'query' }, { id: alice });
  r = await request(store, fresh, { cmd: 'ident' }, { id: alice });
  assert.equal(r.tif, TIF.TRANSIENT_ERROR | TIF.COMMAND_FAILED, 'a nut is used once');
  assert.equal(store.sessions.get(fresh.nut).state, 'pending');
  at = startSession(store, { purpose: 'login' });
  r = await request(store, at, { cmd: 'query' }, { id: alice });
  const tampered = encodeNameValues({ ...r.reply, tif: '0' });
  r = await request(store, r.next, { cmd: 'ident' }, { id: alice, tamper: tampered });
  assert.equal(r.tif & TIF.CLIENT_FAILURE, TIF.CLIENT_FAILURE, 'the server value must be the reply sent');
  assert.equal(store.sessions.get(at.nut).state, 'pending');
  console.log('  ok - forged signatures, replayed nuts and altered replies are refused');

  // Negative: an unknown identity cannot sign in; another address without
  // noiptest is refused; an identity cannot be added to a second account.
  at = startSession(store, { purpose: 'login' });
  r = await request(store, at, { cmd: 'ident' }, { id: mallory });
  assert.equal(r.tif & TIF.COMMAND_FAILED, TIF.COMMAND_FAILED);
  assert.equal(store.sessions.get(at.nut).state, 'pending');
  at = startSession(store, { purpose: 'login' });
  r = await request(store, at, { cmd: 'ident' }, { id: alice, ip: '198.51.100.9' });
  assert.equal(r.tif & (TIF.COMMAND_FAILED | TIF.IP_MATCH), TIF.COMMAND_FAILED);
  assert.equal(store.sessions.get(at.nut).state, 'pending');
  at = startSession(store, { purpose: 'associate', userId: 'bob' });
  r = await request(store, at, { cmd: 'ident', suk, vuk: aliceUnlock.key }, { id: alice });
  assert.equal(r.tif & TIF.BAD_ID_ASSOCIATION, TIF.BAD_ID_ASSOCIATION, 'Alice\'s identity is not Bob\'s');
  assert.equal(store.users.has('bob'), false);
  at = startSession(store, { purpose: 'login' });
  r = await request(store, at, { cmd: 'frobnicate' }, { id: alice });
  assert.equal(r.tif & (TIF.NOT_SUPPORTED | TIF.COMMAND_FAILED), TIF.NOT_SUPPORTED | TIF.COMMAND_FAILED);
  const huge = await handleSqrlRequest({ site, nut: 'x', body: 'client=' + 'A'.repeat(9000), ip: '', store, verify, newNut: () => 'n' });
  assert.equal(parseInt(parseNameValues(fromBase64url(huge)).tif, 16), TIF.CLIENT_FAILURE | TIF.COMMAND_FAILED);
  console.log('  ok - unknown identities, other addresses, someone else\'s identity, junk');

  // Disable, then enable only with the unlock key (the rescue code's).
  at = startSession(store, { purpose: 'login' });
  r = await request(store, at, { cmd: 'disable' }, { id: alice });
  assert.equal(r.tif & TIF.SQRL_DISABLED, TIF.SQRL_DISABLED);
  assert.equal(r.reply.suk, suk, 'the client needs suk to re-enable');
  r = await request(store, r.next, { cmd: 'ident' }, { id: alice });
  assert.equal(r.tif & TIF.COMMAND_FAILED, TIF.COMMAND_FAILED, 'a disabled identity cannot sign in');
  assert.equal(store.sessions.get(at.nut).state, 'pending');
  r = await request(store, r.next, { cmd: 'enable' }, { id: alice, unlock: mallory });
  assert.equal(store.users.get('alice').disabled, true, 'not with another unlock key');
  r = await request(store, r.next, { cmd: 'enable' }, { id: alice, unlock: aliceUnlock });
  assert.equal(r.tif & TIF.COMMAND_FAILED, 0);
  assert.equal(store.users.get('alice').disabled, false);
  console.log('  ok - disable needs the identity, enable needs the unlock key');

  // Rekeying: the previous identity, with its unlock key, hands over.
  const alice2 = identity();
  const alice2Unlock = identity();
  at = startSession(store, { purpose: 'login' });
  r = await request(store, at, { cmd: 'query' }, { id: alice2, previous: alice });
  assert.equal(r.tif, TIF.PREVIOUS_ID_MATCH | TIF.IP_MATCH);
  const noUnlock = await request(store, r.next, { cmd: 'ident', suk, vuk: alice2Unlock.key }, { id: alice2, previous: alice });
  assert.equal(store.users.get('alice').idk, alice.key, 'not without the unlock request signature');
  r = await request(store, noUnlock.next, { cmd: 'ident', suk, vuk: alice2Unlock.key }, { id: alice2, previous: alice, unlock: aliceUnlock });
  assert.equal(r.tif & TIF.COMMAND_FAILED, 0);
  assert.equal(store.users.get('alice').idk, alice2.key);
  assert.equal(store.sessions.get(at.nut).state, 'ready');
  console.log('  ok - an identity is replaced only with the old one\'s unlock key');

  // Remove, with the unlock key.
  at = startSession(store, { purpose: 'login' });
  r = await request(store, at, { cmd: 'remove' }, { id: alice2 });
  assert.ok(store.users.has('alice'), 'not without urs');
  r = await request(store, r.next, { cmd: 'remove' }, { id: alice2, unlock: alice2Unlock });
  assert.equal(store.users.has('alice'), false);
  console.log('  ok - remove needs the unlock key');

  // Server: sessions are signed in once, by their own page; nothing published.
  const server = read('server/sqrl.js');
  assert.match(server, /SqrlSessions\.deny\(\{ insert: \(\) => true, update: \(\) => true, remove: \(\) => true \}\);/);
  assert.match(server, /SqrlNuts\.deny\(\{ insert: \(\) => true, update: \(\) => true, remove: \(\) => true \}\);/);
  assert.match(server, /findOneAndDelete\(\{ _id: nut \}\)/, 'a nut is taken atomically');
  assert.match(server, /\{ _id: options\.sqrl\.session, secretHash: hash\(options\.sqrl\.secret\), state: 'ready' \}/);
  assert.match(server, /\{ cpsHash: hash\(options\.sqrl\.cps\), state: 'cps' \}/);
  assert.match(server, /if \(!\(await SqrlSessions\.updateAsync\(\{ _id: doc\._id, state: doc\.state \}, \{ \$set: \{ state: 'used' \} \}\)\)\) return invalid;/,
    'used once, even by two requests at the same time');
  assert.match(server, /if \(!user \|\| !user\.sqrl \|\| user\.sqrl\.disabled\) return invalid;/);
  assert.match(server, /findOneAsync\(\{ _id: session, secretHash: hash\(secret\) \}\)/, 'only the page that started it can watch it');
  assert.match(server, /if \(purpose === 'associate' && !this\.userId\) throw/);
  assert.match(server, /if \(!user \|\| user\.isAdmin !== true\) throw new Meteor\.Error\('not-authorized'\);/);
  assert.match(server, /if \(Meteor\.settings\?\.public\?\.sandstorm\) return false;/);
  assert.match(server, /ensureIndex\(Meteor\.users, \{ 'sqrl\.idk': 1 \}, \{ unique: true, sparse: true \}\)/);
  for (const f of fs.readdirSync(path.join(ROOT, 'server/publications'))) {
    assert.doesNotMatch(read(`server/publications/${f}`), /\bsqrl(?!Enabled)/, `${f} never publishes an identity`);
  }
  const usersModel = read('models/users.js');
  assert.match(usersModel, /export const USER_UPDATE_ALLOWED_EXACT = \['username', 'profile', 'modifiedAt'\];/, 'the client writes only these');
  assert.match(usersModel, /export const USER_UPDATE_ALLOWED_PREFIXES = \['profile\.'\];/, 'and profile.*, never sqrl');
  assert.match(read('server/imports.js'), /^import '\/server\/sqrl';$/m);
  console.log('  ok - the server: single use, own page only, admin switch, unpublished');

  // UI: the sign-in page, Member Settings and the Admin Panel switch.
  const jade = read('client/components/main/layouts.jade');
  assert.match(jade, /if sqrlOffered\s*\n\s*button\.primary\.js-sqrl-sign-in\(type="button"\)/);
  assert.match(jade, /a\.sqrl-qr\(href=sqrlShown\.link aria-label="\{\{_ 'sqrl-open-client'\}\}"\) \{\{\{sqrlShown\.svg\}\}\}/);
  assert.match(read('client/components/main/layouts.js'), /FlowRouter\.getQueryParam\('sqrl'\)[\s\S]{0,120}signInWithSqrlToken\(sqrlToken\)/);
  assert.match(read('client/components/users/userHeader.jade'), /template\(name="sqrlPopup"\)/);
  assert.match(read('client/components/users/userHeader.js'), /runSqrlSession\('associate'/);
  assert.match(read('client/components/settings/settingBody.js'), /Meteor\.callAsync\('saveSqrlEnabled'/);
  assert.match(read('client/lib/sqrl.js'), /sqrlEnabled === true\) && !Meteor\.settings\?\.public\?\.sandstorm/);
  assert.match(read('package.json'), /"qrcode-generator": "1\.4\.4"/);
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const key of ['sqrl-sign-in', 'sqrl-scan', 'sqrl-open-client', 'sqrlPopup-title', 'sqrl-add', 'sqrl-remove', 'sqrl-enabled']) {
    assert.ok(en[key], key);
  }
  console.log('  ok - the sign-in page, Member Settings and the Admin Panel');
  // The locks are enforced on every path that signs a member in.
  const lockServer = read('server/sqrl.js');
  assert.match(lockServer, /Accounts\.validateLoginAttempt\(async attempt => \{[\s\S]{0,300}sqrlRefusesLogin\(sqrl, \{ type: attempt\.type, methodName: attempt\.methodName \}\)/);
  assert.match(lockServer, /if \(!sqrl \|\| !\(await sqrlEnabled\(\)\)\) return true;/, 'SQRL turned off lifts the locks');
  assert.match(lockServer, /Accounts\.sendResetPasswordEmail = async function \(userId, \.\.\.rest\) \{\s*if \(await sqrlHardlocked\(userId\)\) return undefined;/);
  assert.match(lockServer, /store = \{[\s\S]*setOptions\(userId, \{ sqrlOnly, hardlock \}\)/);
  assert.match(read('server/apiAuthRoutes.js'), /await require\('\/server\/sqrl'\)\.sqrlRefusesRestLogin\(user\)/);
  assert.match(read('server/header-login.js'), /await require\('\/server\/sqrl'\)\.sqrlRefusesRestLogin\(headerUser\)/);
  assert.match(read('server/models/users.js'), /async setEmail\([\s\S]{0,900}!currentUser\?\.isAdmin && \(await require\('\/server\/sqrl'\)\.sqrlHardlocked\(userId\)\)/);
  // Negative: no other place mints a login token without asking. Every file
  // that makes one is listed, and each either asks the locks or is the
  // admin's own impersonation token (the admin is the last resort).
  const minters = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) { if (!['node_modules', '_build', '.build', 'tests'].includes(entry.name)) walk(rel); }
      else if (/\.js$/.test(entry.name) && /Accounts\._generateStampedLoginToken\(\)/.test(read(rel))) minters.push(rel);
    }
  };
  ['server', 'models', 'config', 'imports', 'packages'].forEach(walk);
  assert.deepEqual(minters.sort(), ['server/apiAuthRoutes.js', 'server/header-login.js', 'server/models/users.js'],
    'a new place that mints login tokens must ask sqrlRefusesRestLogin');
  assert.match(read('server/models/users.js'), /\/api\/createtoken\/:userId[\s\S]{0,200}Authentication\.checkUserId\(req\.userId\)/, 'admin only');
  console.log('  ok - every sign-in path, the reset e-mail and the e-mail change ask the locks');

  console.log('\nsqrl: all tests passed');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
