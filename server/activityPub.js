// #4198: ActivityPub for public boards (models/lib/activityPub.js). Off unless
// Admin Panel / Settings / Visibility / ActivityPub is ticked; only a board
// whose permission is 'public' is an actor. Outgoing requests - fetching a
// follower's actor, delivering to its inbox - go through the SSRF guard.
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { WebApp } from 'meteor/webapp';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import crypto from 'crypto';
import Boards from '/models/boards';
import Activities from '/models/activities';
import Cards from '/models/cards';
import Settings from '/models/settings';
import { TAPi18n } from '/imports/i18n';
import { fetchSafe } from '/server/lib/ssrfGuard';

const ap = require('/models/lib/activityPub');

export const ActivityPubKeys = new Mongo.Collection('activityPubKeys');
ActivityPubKeys.deny({ insert: () => true, update: () => true, remove: () => true });
export const ActivityPubFollowers = new Mongo.Collection('activityPubFollowers');
ActivityPubFollowers.deny({ insert: () => true, update: () => true, remove: () => true });

const base = () => String(process.env.ROOT_URL || Meteor.absoluteUrl()).replace(/\/+$/, '');

let keysPromise = null;
function keys() {
  if (!keysPromise) {
    keysPromise = (async () => {
      const found = await ActivityPubKeys.findOneAsync('main');
      if (found) return found;
      const pair = crypto.generateKeyPairSync('rsa', { modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
      const doc = { _id: 'main', publicKeyPem: pair.publicKey, privateKeyPem: pair.privateKey };
      try { await ActivityPubKeys.insertAsync(doc); } catch (e) { return ActivityPubKeys.findOneAsync('main'); }
      return doc;
    })().catch(error => { keysPromise = null; throw error; });
  }
  return keysPromise;
}

async function enabled() {
  const setting = await Settings.findOneAsync({}, { fields: { activityPubEnabled: 1 } });
  return !!(setting && setting.activityPubEnabled === true);
}

async function activityPubPublicBoard(boardId) {
  if (!(await enabled())) return null;
  const board = typeof boardId === 'string' && await Boards.findOneAsync(boardId);
  return board && board.permission === 'public' && !board.archived ? board : null;
}

function sendJson(res, code, body, type = 'application/activity+json') {
  res.writeHead(code, { 'Content-Type': `${type}; charset=utf-8` });
  res.end(body === undefined ? '' : JSON.stringify(body));
}

function readBody(req, limit = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', c => { size += c.length; if (size > limit) { reject(new Error('too-large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function signedPost(url, payload, boardId) {
  const { privateKeyPem } = await keys();
  const body = JSON.stringify(payload);
  const headers = ap.signedPostHeaders(url, body, { keyId: `${ap.boardActorId(base(), boardId)}#main-key`, privateKeyPem });
  return fetchSafe(url, { method: 'POST', headers, body, totalTimeoutMs: 15000 });
}

async function fetchActor(actorUrl) {
  if (!/^https:\/\//.test(String(actorUrl || ''))) return null;
  const res = await fetchSafe(actorUrl, { headers: { Accept: 'application/activity+json' }, totalTimeoutMs: 15000, maxResponseBytes: 512 * 1024 });
  if (!res || !res.ok) return null;
  const actor = await res.json();
  return actor && actor.id === actorUrl && actor.publicKey && typeof actor.publicKey.publicKeyPem === 'string'
    && /^https:\/\//.test(String(actor.inbox || '')) ? actor : null;
}

WebApp.handlers.get('/.well-known/webfinger', async (req, res) => {
  const resource = String((req.query && req.query.resource) || '');
  const m = resource.match(/^acct:board-([A-Za-z0-9]{1,40})@/);
  const board = m && await activityPubPublicBoard(m[1]);
  if (!board) return sendJson(res, 404, { error: 'not found' }, 'application/jrd+json');
  return sendJson(res, 200, { subject: resource, links: [{ rel: 'self', type: 'application/activity+json',
    href: ap.boardActorId(base(), board._id) }] }, 'application/jrd+json');
});

WebApp.handlers.get('/ap/boards/:boardId', async (req, res) => {
  const board = await activityPubPublicBoard(req.params.boardId);
  if (!board) return sendJson(res, 404, { error: 'not found' });
  const { publicKeyPem } = await keys();
  return sendJson(res, 200, ap.actorDocument(board, { base: base(), publicKeyPem }));
});

function noteText(activity, card) {
  const params = { card: card ? `"${card.title || ''}"` : '', list: '', board: '', swimlane: '' };
  const key = `act-${activity.activityType}`;
  const text = TAPi18n.__(key, params, 'en');
  return (text === key ? activity.activityType : text).replace(/\s+/g, ' ').trim();
}

WebApp.handlers.get('/ap/boards/:boardId/outbox', async (req, res) => {
  const board = await activityPubPublicBoard(req.params.boardId);
  if (!board) return sendJson(res, 404, { error: 'not found' });
  const activities = await Activities.find({ boardId: board._id }, { sort: { createdAt: -1 }, limit: 20,
    fields: { activityType: 1, createdAt: 1, cardId: 1 } }).fetchAsync();
  const cards = new Map((await Cards.find({ _id: { $in: activities.map(a => a.cardId).filter(Boolean) }, boardId: board._id },
    { fields: { title: 1 } }).fetchAsync()).map(c => [c._id, c]));
  const items = activities.map(a => ap.noteActivity({ _id: a._id, createdAt: a.createdAt, cardId: a.cardId,
    cardTitle: cards.get(a.cardId)?.title, boardSlug: board.slug }, { base: base(), boardId: board._id, text: noteText(a, cards.get(a.cardId)) }));
  return sendJson(res, 200, { '@context': ap.AS, id: `${ap.boardActorId(base(), board._id)}/outbox`, type: 'OrderedCollection',
    totalItems: items.length, orderedItems: items });
});

WebApp.handlers.get('/ap/boards/:boardId/followers', async (req, res) => {
  const board = await activityPubPublicBoard(req.params.boardId);
  if (!board) return sendJson(res, 404, { error: 'not found' });
  const count = await ActivityPubFollowers.find({ boardId: board._id }).countAsync();
  return sendJson(res, 200, { '@context': ap.AS, id: `${ap.boardActorId(base(), board._id)}/followers`, type: 'OrderedCollection', totalItems: count });
});

// Follow and Undo Follow only, each with a verified HTTP signature by the
// actor it names. Anything else is refused; nothing here changes a board.
WebApp.handlers.post('/ap/boards/:boardId/inbox', async (req, res) => {
  try {
    const board = await activityPubPublicBoard(req.params.boardId);
    if (!board) return sendJson(res, 404, { error: 'not found' });
    const body = await readBody(req);
    let activity;
    try { activity = JSON.parse(body); } catch (e) { return sendJson(res, 400, { error: 'bad json' }); }
    const isFollow = activity && activity.type === 'Follow';
    const isUnfollow = activity && activity.type === 'Undo' && activity.object && activity.object.type === 'Follow';
    if (!isFollow && !isUnfollow) return sendJson(res, 202, {});
    const sig = ap.parseSignatureHeader(req.headers.signature);
    if (!sig || ap.keyOwner(sig.keyId) !== activity.actor) return sendJson(res, 401, { error: 'unsigned' });
    const actor = await fetchActor(activity.actor);
    if (!actor || !ap.verifySignedRequest({ method: 'POST', path: req.originalUrl || req.url, headers: req.headers, body,
      publicKeyPem: actor.publicKey.publicKeyPem })) return sendJson(res, 401, { error: 'bad signature' });
    if (isUnfollow) {
      await ActivityPubFollowers.removeAsync({ boardId: board._id, actor: actor.id });
      return sendJson(res, 202, {});
    }
    await ActivityPubFollowers.upsertAsync({ boardId: board._id, actor: actor.id },
      { $set: { inbox: actor.inbox, createdAt: new Date() } });
    const actorId = ap.boardActorId(base(), board._id);
    signedPost(actor.inbox, { '@context': ap.AS, id: `${actorId}/accepts/${Random.id()}`, type: 'Accept', actor: actorId, object: activity },
      board._id).catch(() => {});
    return sendJson(res, 202, {});
  } catch (error) {
    return sendJson(res, 500, { error: 'error' });
  }
});

// Called after a board activity, like the ntfy and browser push hooks.
export function deliverActivityToFollowers(activity) {
  if (!activity || !activity.boardId) return;
  Meteor.defer(async () => {
    try {
      const board = await activityPubPublicBoard(activity.boardId);
      if (!board) return;
      const followers = await ActivityPubFollowers.find({ boardId: board._id }, { limit: 5000 }).fetchAsync();
      if (!followers.length) return;
      const card = activity.cardId ? await Cards.findOneAsync({ _id: activity.cardId, boardId: board._id }, { fields: { title: 1 } }) : null;
      const note = ap.noteActivity({ _id: activity._id, createdAt: activity.createdAt, cardId: activity.cardId, cardTitle: card?.title,
        boardSlug: board.slug }, { base: base(), boardId: board._id, text: noteText(activity, card) });
      for (const inbox of [...new Set(followers.map(f => f.inbox))]) {
        await signedPost(inbox, note, board._id).catch(() => {});
      }
    } catch (error) {
      console.warn(`ActivityPub delivery skipped: ${error && error.message}`);
    }
  });
}

Meteor.methods({
  async saveActivityPubEnabled(value) {
    check(value, Boolean);
    const user = this.userId && await Meteor.users.findOneAsync(this.userId, { fields: { isAdmin: 1 } });
    if (!user || user.isAdmin !== true) throw new Meteor.Error('not-authorized');
    const setting = await Settings.findOneAsync({});
    if (!setting) throw new Meteor.Error('settings-not-found');
    await Settings.updateAsync(setting._id, { $set: { activityPubEnabled: value } });
    return value;
  },
});

Meteor.startup(async () => {
  const { ensureIndex } = require('/server/lib/mongoStartup');
  await ensureIndex(ActivityPubFollowers, { boardId: 1, actor: 1 }, { unique: true });
});
