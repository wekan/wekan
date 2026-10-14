// #2460: SQRL login (models/lib/sqrl.js holds the protocol). The sign-in page
// and Member Settings each start a session; the member's SQRL client answers
// it by posting signed requests to /sqrl; the page polls until the session
// is complete and then signs in with the session's secret, which only that
// page holds. A member's identity is a top-level user field, `sqrl`, never
// published and not writable from the client.
import crypto from 'node:crypto';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { WebApp } from 'meteor/webapp';
import { Accounts } from 'meteor/accounts-base';
import { check, Match } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Random } from 'meteor/random';
import Settings from '/models/settings';
import { ensureIndex } from '/server/lib/mongoStartup';
import { clientAddress } from '/server/lib/apiUsageLog';

const { SESSION_MS, MAX_BODY_BYTES, toBase64url, siteOf, sqrlLink, handleSqrlRequest, sqrlLocks, sqrlRefusesLogin } = require('/models/lib/sqrl');

// { _id, purpose: 'login' | 'associate', userId, ip, secretHash, state:
// 'pending' | 'ready' | 'cps' | 'done' | 'used', authUserId, cpsHash, expiresAt }
export const SqrlSessions = new Mongo.Collection('sqrlSessions');
SqrlSessions.deny({ insert: () => true, update: () => true, remove: () => true });
// { _id: nut, session, expect: the `server` value its request must carry, expiresAt }
export const SqrlNuts = new Mongo.Collection('sqrlNuts');
SqrlNuts.deny({ insert: () => true, update: () => true, remove: () => true });

const hash = value => crypto.createHash('sha256').update(String(value)).digest('hex');
const newNut = () => crypto.randomBytes(16).toString('base64url');

function site() {
  const s = siteOf(process.env.ROOT_URL || Meteor.absoluteUrl());
  if (!s) throw new Meteor.Error('sqrl-needs-https', 'SQRL needs WeKan at an https:// ROOT_URL.');
  return s;
}

async function sqrlEnabled() {
  if (Meteor.settings?.public?.sandstorm) return false;
  const setting = await Settings.findOneAsync({}, { fields: { sqrlEnabled: 1 } });
  return !!(setting && setting.sqrlEnabled === true);
}

// Ed25519, from the raw 32-byte public keys SQRL uses.
function verify(message, signature, key) {
  try {
    const publicKey = crypto.createPublicKey({ key: { kty: 'OKP', crv: 'Ed25519', x: key }, format: 'jwk' });
    return crypto.verify(null, Buffer.from(message, 'utf8'), publicKey, Buffer.from(signature, 'base64url'));
  } catch (e) {
    return false;
  }
}

const store = {
  // Single use: taken from the collection whatever happens next.
  async takeNut(nut) {
    const result = await SqrlNuts.rawCollection().findOneAndDelete({ _id: nut });
    // The driver returns the document, or { value, ok } with includeResultMetadata.
    if (result && 'ok' in result && 'value' in result) return result.value;
    return result || null;
  },
  putNut(doc) { return SqrlNuts.insertAsync(doc); },
  getSession(_id) { return SqrlSessions.findOneAsync({ _id }); },
  async findIdentity(idk) {
    const user = await Meteor.users.findOneAsync({ 'sqrl.idk': idk }, { fields: { sqrl: 1 } });
    return user ? { userId: user._id, ...user.sqrl } : null;
  },
  async associate(userId, keys) {
    return (await Meteor.users.updateAsync({ _id: userId, 'sqrl.idk': { $exists: false } },
      { $set: { sqrl: { ...keys, disabled: false, addedAt: new Date() } } })) > 0;
  },
  replace(userId, { idk, suk, vuk }) {
    return Meteor.users.updateAsync(userId, { $set: { 'sqrl.idk': idk, 'sqrl.suk': suk, 'sqrl.vuk': vuk } });
  },
  setOptions(userId, { sqrlOnly, hardlock }) {
    return Meteor.users.updateAsync(userId, { $set: { 'sqrl.sqrlOnly': sqrlOnly === true, 'sqrl.hardlock': hardlock === true } });
  },
  setDisabled(userId, disabled) { return Meteor.users.updateAsync(userId, { $set: { 'sqrl.disabled': disabled } }); },
  remove(userId) { return Meteor.users.updateAsync(userId, { $unset: { sqrl: 1 } }); },
  // The session is done: an associate session is simply finished; a sign-in
  // session is ready for its page, or - same device - for a one-time token.
  async complete(_id, { userId, cps = false }) {
    const session = await SqrlSessions.findOneAsync({ _id });
    if (!session) return null;
    if (session.purpose === 'associate') {
      await SqrlSessions.updateAsync({ _id, state: 'pending' }, { $set: { state: 'done' } });
      return null;
    }
    if (!cps) {
      await SqrlSessions.updateAsync({ _id, state: 'pending' }, { $set: { state: 'ready', authUserId: userId } });
      return null;
    }
    const token = Random.secret(43);
    const changed = await SqrlSessions.updateAsync({ _id, state: 'pending' }, { $set: { state: 'cps', authUserId: userId, cpsHash: hash(token) } });
    return changed ? token : null;
  },
};

// The SQRL client's requests. HTTP status says only that the request arrived;
// success or failure is in the reply's tif.
WebApp.handlers.post('/sqrl', async (req, res) => {
  const send = (code, text) => {
    res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(text);
  };
  try {
    if (!(await sqrlEnabled())) return send(404, '');
    const body = await new Promise((resolve, reject) => {
      if (typeof req.body === 'string') return resolve(req.body);
      if (req.body && typeof req.body === 'object' && Object.keys(req.body).length) {
        return resolve(new URLSearchParams(req.body).toString());
      }
      const chunks = [];
      let size = 0;
      req.on('data', c => { size += c.length; if (size > MAX_BODY_BYTES) { reject(new Error('too-large')); req.destroy(); } else chunks.push(c); });
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      req.on('error', reject);
    });
    const nut = new URLSearchParams(String(req.url || '').split('?')[1] || '').get('nut');
    const reply = await handleSqrlRequest({ site: site(), nut, body, ip: clientAddress(req), store, verify, newNut });
    return send(200, reply);
  } catch (e) {
    return send(400, '');
  }
});

Meteor.methods({
  // Starts a session: 'login' from the sign-in page, 'associate' from Member
  // Settings (signed in). Returns the link, and the secret that will sign in.
  async sqrlStart(purpose) {
    check(purpose, Match.OneOf('login', 'associate'));
    if (!(await sqrlEnabled())) throw new Meteor.Error('sqrl-not-enabled');
    if (purpose === 'associate' && !this.userId) throw new Meteor.Error('not-logged-in');
    const s = site();
    const setting = await Settings.findOneAsync({}, { fields: { productName: 1 } });
    const nut = newNut();
    const secret = Random.secret(43);
    const expiresAt = new Date(Date.now() + SESSION_MS);
    const link = sqrlLink(s, nut, (setting && setting.productName) || 'WeKan');
    await SqrlSessions.insertAsync({ _id: nut, purpose, userId: purpose === 'associate' ? this.userId : null,
      ip: (this.connection && this.connection.clientAddress) || '', secretHash: hash(secret), state: 'pending', expiresAt });
    await SqrlNuts.insertAsync({ _id: nut, session: nut, expect: toBase64url(link), expiresAt });
    return { session: nut, secret, link, expiresAt };
  },

  // What the page waits for. Only the page that started the session knows
  // its secret, so nobody else can watch it.
  async sqrlPoll(session, secret) {
    check(session, String);
    check(secret, String);
    const doc = await SqrlSessions.findOneAsync({ _id: session, secretHash: hash(secret) });
    if (!doc || doc.expiresAt <= new Date()) return 'expired';
    return doc.state;
  },

  async sqrlMine() {
    if (!this.userId) throw new Meteor.Error('not-logged-in');
    const user = await Meteor.users.findOneAsync(this.userId, { fields: { sqrl: 1 } });
    const sqrl = user && user.sqrl;
    const locks = sqrlLocks(sqrl);
    return { enabled: await sqrlEnabled(), added: !!(sqrl && sqrl.idk), disabled: !!(sqrl && sqrl.disabled), addedAt: sqrl ? sqrl.addedAt : null,
      sqrlOnly: locks.sqrlOnly, hardlock: locks.hardlock };
  },

  // The signed-in member drops their identity; signing in again with SQRL
  // needs it added again.
  async sqrlRemoveMine() {
    if (!this.userId) throw new Meteor.Error('not-logged-in');
    await Meteor.users.updateAsync(this.userId, { $unset: { sqrl: 1 } });
    return true;
  },

  async saveSqrlEnabled(value) {
    check(value, Boolean);
    const user = this.userId && await Meteor.users.findOneAsync(this.userId, { fields: { isAdmin: 1 } });
    if (!user || user.isAdmin !== true) throw new Meteor.Error('not-authorized');
    const setting = await Settings.findOneAsync({});
    if (!setting) throw new Meteor.Error('settings-not-found');
    await Settings.updateAsync(setting._id, { $set: { sqrlEnabled: value } });
    return value;
  },
});

// Accounts.callLoginMethod({ methodArguments: [{ sqrl: { session, secret } }] })
// from the waiting page, or [{ sqrl: { cps: token } }] from the page the SQRL
// client opened. Either is used once.
Accounts.registerLoginHandler('sqrl', async options => {
  if (!options || !options.sqrl) return undefined;
  check(options.sqrl, Match.OneOf({ session: String, secret: String }, { cps: String }));
  const invalid = { error: new Meteor.Error(403, 'sqrl-invalid') };
  if (!(await sqrlEnabled())) return invalid;
  const selector = options.sqrl.cps
    ? { cpsHash: hash(options.sqrl.cps), state: 'cps' }
    : { _id: options.sqrl.session, secretHash: hash(options.sqrl.secret), state: 'ready' };
  const doc = await SqrlSessions.findOneAsync({ ...selector, purpose: 'login' });
  if (!doc || doc.expiresAt <= new Date()) return invalid;
  if (!(await SqrlSessions.updateAsync({ _id: doc._id, state: doc.state }, { $set: { state: 'used' } }))) return invalid;
  const user = await Meteor.users.findOneAsync(doc.authUserId, { fields: { sqrl: 1 } });
  if (!user || !user.sqrl || user.sqrl.disabled) return invalid;
  return { userId: user._id };
});

// sqrlonly: every other way of signing in is refused while the member's SQRL
// identity is enabled; hardlock: so is a password-reset sign-in. Only while
// SQRL itself is on - an admin who turns SQRL off gives every member their
// other ways back.
Accounts.validateLoginAttempt(async attempt => {
  if (!attempt.user || !attempt.allowed) return true;
  const sqrl = attempt.user.sqrl;
  if (!sqrl || !(await sqrlEnabled())) return true;
  const refused = sqrlRefusesLogin(sqrl, { type: attempt.type, methodName: attempt.methodName });
  if (refused) throw new Meteor.Error(403, refused);
  return true;
});

// The REST login (/users/login) and the header login mint their tokens
// without validateLoginAttempt; they ask here.
export async function sqrlRefusesRestLogin(user) {
  if (!user || !user.sqrl || !(await sqrlEnabled())) return false;
  return !!sqrlRefusesLogin(user.sqrl, { type: 'password' });
}

// The password-reset e-mail of a hardlocked account is not sent. The answer
// is the same as for a sent one, so it says nothing about the account.
export async function sqrlHardlocked(userId) {
  if (!userId || !(await sqrlEnabled())) return false;
  const user = await Meteor.users.findOneAsync(userId, { fields: { sqrl: 1 } });
  return sqrlLocks(user && user.sqrl).hardlock;
}
const sendResetPasswordEmail = Accounts.sendResetPasswordEmail;
Accounts.sendResetPasswordEmail = async function (userId, ...rest) {
  if (await sqrlHardlocked(userId)) return undefined;
  return sendResetPasswordEmail.call(this, userId, ...rest);
};

for (const name of ['sqrlStart', 'sqrlMine', 'sqrlRemoveMine', 'saveSqrlEnabled']) {
  DDPRateLimiter.addRule({ type: 'method', name, connectionId: () => true }, 10, 10000);
}
// The page polls every two seconds.
DDPRateLimiter.addRule({ type: 'method', name: 'sqrlPoll', connectionId: () => true }, 20, 10000);

Meteor.startup(async () => {
  await ensureIndex(SqrlSessions, { expiresAt: 1 }, { expireAfterSeconds: 0 });
  await ensureIndex(SqrlSessions, { cpsHash: 1 }, { sparse: true });
  await ensureIndex(SqrlNuts, { expiresAt: 1 }, { expireAfterSeconds: 0 });
  await ensureIndex(Meteor.users, { 'sqrl.idk': 1 }, { unique: true, sparse: true });
});
