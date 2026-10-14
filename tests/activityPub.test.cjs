'use strict';

// #4198: ActivityPub - a public board publishes its card activity to
// followers, read-only.
// Run: node tests/activityPub.test.cjs

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const ap = require('../models/lib/activityPub.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const pair = () => crypto.generateKeyPairSync('rsa', { modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });

// Positive: the actor, a Note, and a signature a peer verifies.
const actor = ap.actorDocument({ _id: 'b1', title: 'Roadmap', slug: 'roadmap' }, { base: 'https://w.example', publicKeyPem: 'PEM' });
assert.equal(actor.id, 'https://w.example/ap/boards/b1');
assert.equal(actor.inbox, 'https://w.example/ap/boards/b1/inbox');
assert.equal(actor.publicKey.id, 'https://w.example/ap/boards/b1#main-key');
const note = ap.noteActivity({ _id: 'a1', cardId: 'c1', cardTitle: '<b>Ship</b>', boardSlug: 'roadmap', createdAt: 0 },
  { base: 'https://w.example', boardId: 'b1', text: 'moved card "<x>"' });
assert.equal(note.type, 'Create');
assert.equal(note.object.type, 'Note');
assert.match(note.object.content, /&lt;x&gt;/, 'escaped');
assert.doesNotMatch(note.object.content, /<b>|<x>/);
const k = pair();
const body = JSON.stringify({ type: 'Follow', actor: 'https://m.example/users/a' });
const headers = ap.signedPostHeaders('https://w.example/ap/boards/b1/inbox', body, { keyId: 'https://m.example/users/a#main-key', privateKeyPem: k.privateKey });
const ok = h => ap.verifySignedRequest({ method: 'POST', path: '/ap/boards/b1/inbox', headers: h, body, publicKeyPem: k.publicKey });
assert.equal(ok(headers), true);
assert.equal(ap.keyOwner('https://m.example/users/a#main-key'), 'https://m.example/users/a');
console.log('  ok - actor, escaped Notes, and HTTP signatures that verify');

// Negative: a forged, altered, stale or partial signature is refused.
assert.equal(ok({ ...headers, digest: ap.digestOf('other') }), false, 'another body');
assert.equal(ap.verifySignedRequest({ method: 'POST', path: '/ap/boards/b1/inbox', headers, body, publicKeyPem: pair().publicKey }), false, 'another key');
assert.equal(ap.verifySignedRequest({ method: 'POST', path: '/ap/boards/b2/inbox', headers, body, publicKeyPem: k.publicKey }), false, 'another inbox');
assert.equal(ap.verifySignedRequest({ method: 'POST', path: '/ap/boards/b1/inbox', headers, body, publicKeyPem: k.publicKey, now: Date.now() + 13 * 3600e3 }), false, 'stale');
const partial = { ...headers, signature: headers.signature.replace('headers="(request-target) host date digest"', 'headers="date"') };
assert.equal(ok(partial), false, 'a signature that does not cover the request');
assert.equal(ap.parseSignatureHeader('junk'), null);
console.log('  ok - forged, altered, stale and partial signatures refused');

const server = read('server/activityPub.js');
assert.match(server, /return board && board\.permission === 'public' && !board\.archived \? board : null;/, 'public boards only');
assert.match(server, /return !!\(setting && setting\.activityPubEnabled === true\);/, 'off by default');
assert.match(server, /if \(!isFollow && !isUnfollow\) return sendJson\(res, 202, \{\}\);/, 'nothing but Follow and Undo Follow is acted on');
assert.match(server, /if \(!sig \|\| ap\.keyOwner\(sig\.keyId\) !== activity\.actor\) return sendJson\(res, 401/);
assert.doesNotMatch(server, /(^|[^A-Za-z])fetch\(/, 'every outgoing request through fetchSafe');
assert.match(server, /ActivityPubKeys\.deny\(\{ insert: \(\) => true, update: \(\) => true, remove: \(\) => true \}\);/);
assert.doesNotMatch(read('server/publications/settings.js'), /activityPubKeys|privateKeyPem/);
assert.match(read('server/models/activities.js'), /require\('\/server\/activityPub'\)\.deliverActivityToFollowers\(doc\);/);
console.log('  ok - public boards only, off by default, read-only, through the SSRF guard');
// Every board route goes through the one helper, and it serves only a public,
// unarchived board while the feature is on (restBoardDomainsAccess relies on it).
assert.match(server, /async function activityPubPublicBoard\(boardId\) \{\s*if \(!\(await enabled\(\)\)\) return null;[\s\S]{0,120}return board && board\.permission === 'public' && !board\.archived \? board : null;/);
for (const m of server.matchAll(/WebApp\.handlers\.\w+\('\/ap\/boards\/:boardId[^']*'[\s\S]*?\n\}\);/g)) assert.match(m[0], /activityPubPublicBoard\(/, m[0].slice(0, 60));
console.log('\nactivityPub: all tests passed');
