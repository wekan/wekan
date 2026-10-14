'use strict';

// #4198: ActivityPub - a PUBLIC board publishes its card activity to
// followers on the fediverse (Mastodon, Friendica, ...), read-only. Off unless
// Admin Panel / Settings / Visibility turns it on, and only for boards whose
// visibility is public: what is published is what anybody could already see.
// Each public board is an actor (`@board-<id>@host`), its outbox lists its
// recent card activity as Notes, and followers' servers get each new one.
// Nothing a remote server sends changes a board: the inbox accepts Follow
// and Undo Follow only. Pure: tests/activityPub.test.cjs.

const crypto = require('crypto');

const AS = 'https://www.w3.org/ns/activitystreams';
const SEC = 'https://w3id.org/security/v1';

function boardActorId(base, boardId) { return `${base}/ap/boards/${boardId}`; }

function actorDocument(board, { base, publicKeyPem }) {
  const id = boardActorId(base, board._id);
  return {
    '@context': [AS, SEC],
    id,
    type: 'Group',
    preferredUsername: `board-${board._id}`,
    name: board.title || '',
    summary: board.description || '',
    url: `${base}/b/${board._id}/${board.slug || 'board'}`,
    inbox: `${id}/inbox`,
    outbox: `${id}/outbox`,
    followers: `${id}/followers`,
    manuallyApprovesFollowers: false,
    publicKey: { id: `${id}#main-key`, owner: id, publicKeyPem },
  };
}

function escapeHtml(s) {
  return String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

// A Create(Note) for one card activity: who, what, which card - plain text
// in escaped HTML, and the card's address.
function noteActivity(entry, { base, boardId, text }) {
  const actor = boardActorId(base, boardId);
  const id = `${actor}/activities/${entry._id}`;
  const cardUrl = entry.cardId ? `${base}/b/${boardId}/${entry.boardSlug || 'board'}/${entry.cardId}` : `${base}/b/${boardId}/${entry.boardSlug || 'board'}`;
  const published = new Date(entry.createdAt || Date.now()).toISOString();
  return {
    '@context': AS,
    id,
    type: 'Create',
    actor,
    published,
    to: [`${AS}#Public`],
    cc: [`${actor}/followers`],
    object: {
      id: `${id}/note`,
      type: 'Note',
      attributedTo: actor,
      published,
      url: cardUrl,
      to: [`${AS}#Public`],
      cc: [`${actor}/followers`],
      content: `<p>${escapeHtml(text)}</p><p><a href="${escapeHtml(cardUrl)}">${escapeHtml(entry.cardTitle || cardUrl)}</a></p>`,
    },
  };
}

// --- HTTP Signatures (draft-cavage), as Mastodon uses them ---------------

function parseSignatureHeader(value) {
  const out = {};
  for (const m of String(value || '').matchAll(/(\w+)="([^"]*)"/g)) out[m[1]] = m[2];
  return out.keyId && out.signature ? out : null;
}

function signingString(headerNames, { method, path, headers }) {
  return headerNames.map(name => (name === '(request-target)'
    ? `(request-target): ${String(method).toLowerCase()} ${path}`
    : `${name}: ${headers[name]}`)).join('\n');
}

function digestOf(body) {
  return `SHA-256=${crypto.createHash('sha256').update(body).digest('base64')}`;
}

// Headers for a signed POST of `body` to `url`, by key `keyId`.
function signedPostHeaders(url, body, { keyId, privateKeyPem, date = new Date() }) {
  const u = new URL(url);
  const headers = { host: u.host, date: date.toUTCString(), digest: digestOf(body), 'content-type': 'application/activity+json' };
  const names = ['(request-target)', 'host', 'date', 'digest'];
  const signature = crypto.sign('sha256', Buffer.from(signingString(names, { method: 'post', path: u.pathname + u.search, headers })), privateKeyPem)
    .toString('base64');
  return { ...headers, signature: `keyId="${keyId}",algorithm="rsa-sha256",headers="${names.join(' ')}",signature="${signature}"` };
}

// Whether a request's signature, date and digest hold, given the signer's key.
function verifySignedRequest({ method, path, headers, body, publicKeyPem, now = Date.now(), maxSkewMs = 12 * 3600 * 1000 }) {
  const sig = parseSignatureHeader(headers.signature);
  if (!sig || !publicKeyPem) return false;
  const names = String(sig.headers || 'date').split(/\s+/);
  for (const required of ['(request-target)', 'host', 'date', 'digest']) if (!names.includes(required)) return false;
  const date = Date.parse(headers.date || '');
  if (!Number.isFinite(date) || Math.abs(now - date) > maxSkewMs) return false;
  if (headers.digest !== digestOf(body || '')) return false;
  try {
    return crypto.verify('sha256', Buffer.from(signingString(names, { method, path, headers })), publicKeyPem, Buffer.from(sig.signature, 'base64'));
  } catch (e) {
    return false;
  }
}

function keyOwner(keyId) {
  return String(keyId || '').split('#')[0];
}

module.exports = { AS, boardActorId, actorDocument, noteActivity, parseSignatureHeader, signingString, digestOf,
  signedPostHeaders, verifySignedRequest, keyOwner };
