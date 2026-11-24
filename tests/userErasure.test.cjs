'use strict';

// WP-4 (docs/Compliance/README.md): erasing a person removes their data from
// every collection the personal-data inventory says goes with them - not only
// from the users document and board/card memberships.
// models/lib/userErasure.js holds the rules; this runs them against an
// in-memory database seeded with two people, and checks that only the erased
// one changes.
// Run: node --test tests/userErasure.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const { buildUserErasure, applyUserErasure, ERASED_COLLECTIONS } = require('../models/lib/userErasure');
const { INVENTORY } = require('../models/lib/personalDataInventory');

// ── in-memory driver collections: the selector and update shapes the rules use
function get(doc, p) { return p.split('.').reduce((v, k) => (v == null ? v : v[k]), doc); }
function valueMatches(v, cond) {
  if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
    if ('$in' in cond) return cond.$in.some(x => (x === null ? v == null : (Array.isArray(v) ? v.includes(x) : v === x)));
    if ('$exists' in cond) return cond.$exists === (v !== undefined);
  }
  return Array.isArray(v) ? v.includes(cond) : v === cond;
}
function matches(doc, sel) {
  return Object.entries(sel).every(([k, c]) => {
    if (k === '$or') return c.some(s => matches(doc, s));
    if (k.includes('.') && k.split('.')[0] === 'reactions') {
      return (doc.reactions || []).some(r => valueMatches(get(r, k.slice('reactions.'.length)), c));
    }
    return valueMatches(get(doc, k), c);
  });
}
function unsetPath(doc, p) {
  const parts = p.split('.'); let t = doc;
  for (const k of parts.slice(0, -1)) { if (!t || typeof t !== 'object') return; t = t[k]; }
  if (t) delete t[parts[parts.length - 1]];
}
function apply(doc, u) {
  for (const [k, v] of Object.entries(u.$set || {})) doc[k] = v;
  for (const k of Object.keys(u.$unset || {})) unsetPath(doc, k);
}
function fakeDb(seed) {
  const data = new Map(Object.entries(seed).map(([k, v]) => [k, JSON.parse(JSON.stringify(v))]));
  const coll = name => {
    if (!data.has(name)) data.set(name, []);
    const rows = () => data.get(name);
    return {
      find: sel => ({ toArray: async () => rows().filter(d => matches(d, sel)) }),
      deleteMany: async sel => { const before = rows().length; data.set(name, rows().filter(d => !matches(d, sel))); return { deletedCount: before - rows().length }; },
      updateMany: async (sel, u) => { let n = 0; for (const d of rows()) if (matches(d, sel)) { apply(d, u); n++; } return { modifiedCount: n }; },
      updateOne: async (sel, u) => { const d = rows().find(x => matches(x, sel)); if (d) apply(d, u); },
    };
  };
  return { coll, dump: name => data.get(name) || [] };
}

const ANN = { _id: 'ann', username: 'ann', emails: [{ address: 'Ann@Example.com' }] };
const BOB = { _id: 'bob', username: 'bob', emails: [{ address: 'bob@example.com' }] };

function seed() {
  const both = c => [{ _id: `${c}-ann`, userId: 'ann' }, { _id: `${c}-bob`, userId: 'bob' }];
  const s = {};
  for (const c of ['board_email_addresses', 'cloudChatMessages', 'github_import_jobs', 'idleSessions', 'notificationEmailCommands',
    'notificationEmailJobs', 'notificationTrayReceipts', 'orgUser', 'passkeyChallenges', 'presences', 'sandstorm_api_grants',
    'sessiondata', 'shortPasswordLogins', 'trello_export_jobs', 'trello_import_jobs', 'unsaved-edits', 'userPositionHistory',
    'windowsSsoTokens', 'cfs.avatars.filerecord']) s[c] = both(c);
  s.sqrlSessions = [{ _id: 's1', authUserId: 'ann' }, { _id: 's2', userId: 'bob' }];
  for (const c of ['notificationEmailControls', 'notificationEmailLeases', 'trello_api_credentials']) s[c] = [{ _id: 'ann' }, { _id: 'bob' }];
  s.billingRates = [{ _id: 'r1', userId: 'ann' }, { _id: 'r2', userId: 'bob', createdBy: 'ann' }];
  s.timeEntries = [{ _id: 't1', userId: 'ann', hours: 2 }, { _id: 't2', userId: 'ann', hours: 3, invoiceId: 'inv1', approvedBy: 'bob' },
    { _id: 't3', userId: 'bob', hours: 1, approvedBy: 'ann' }];
  s.invitation_codes = [{ _id: 'i1', email: 'ann@example.com' }, { _id: 'i2', email: 'carl@example.com', authorId: 'ann' }];
  s.email_bounces = [{ _id: 'b1', email: 'ann@example.com' }, { _id: 'b2', email: 'bob@example.com' }];
  s.listSyncCredentials = [{ _id: 'l1', runAsUserId: 'ann', token: 'x' }];
  s.checklistItems = [{ _id: 'c1', assigneeId: 'ann' }, { _id: 'c2', assigneeId: 'bob' }];
  s.recoveryEvents = [{ _id: 'e1', userId: 'ann', username: 'ann', ipv4: '10.0.0.1', type: 'restore' }];
  s.card_comment_reactions = [{ _id: 'x1', cardCommentId: 'cc', reactions: [{ reactionCodepoint: '&#128077;', userIds: ['ann', 'bob'] }] }];
  s.eventlog = [
    { _id: 'v1', userId: 'ann', username: 'ann', ipv4: '10.0.0.1', actors: { k1: { kind: 'user', value: 'ann', count: 2 }, k2: { kind: 'user', value: 'bob', count: 1 }, k3: { kind: 'ip', value: '10.0.0.1', count: 3 } } },
    { _id: 'v2', userId: 'bob', username: 'bob', actors: { k1: { kind: 'user', value: 'ann', count: 1 }, k2: { kind: 'user', value: 'bob', count: 4 } } },
  ];
  s.loginAddresses = [{ _id: 'a1', address: '10.0.0.1', users: { entries: { k1: { value: 'ann', count: 2 }, k2: { value: 'bob', count: 1 } } } }];
  return s;
}

test('every rule erases a collection the inventory points here for, and every such entry has a rule', () => {
  const here = INVENTORY.filter(e => e.erasureWhere === 'models/lib/userErasure.js').map(e => e.collection).sort();
  assert.deepEqual(here, [...ERASED_COLLECTIONS]);
  assert.equal(here.length, 34);
});

test('deleting Ann removes or unlinks her data everywhere, and leaves Bob as he was', async () => {
  const db = fakeDb(seed());
  const errors = [];
  await applyUserErasure(buildUserErasure(ANN, 'delete'), db.coll, (c, e) => errors.push(`${c}: ${e.message}`));
  assert.deepEqual(errors, []);
  for (const c of ['board_email_addresses', 'cloudChatMessages', 'idleSessions', 'notificationEmailJobs', 'sessiondata', 'windowsSsoTokens', 'cfs.avatars.filerecord']) {
    assert.deepEqual(db.dump(c).map(d => d._id), [`${c}-bob`], c);
  }
  assert.deepEqual(db.dump('sqrlSessions').map(d => d._id), ['s2']);
  assert.deepEqual(db.dump('trello_api_credentials').map(d => d._id), ['bob']);
  assert.deepEqual(db.dump('billingRates'), [{ _id: 'r2', userId: 'bob' }], 'her rate gone, and she no longer set his');
  // Time: her own entry gone; the invoiced one kept without her; Bob's no longer approved by her.
  assert.deepEqual(db.dump('timeEntries'), [{ _id: 't2', hours: 3, invoiceId: 'inv1', approvedBy: 'bob' }, { _id: 't3', userId: 'bob', hours: 1 }]);
  assert.deepEqual(db.dump('invitation_codes'), [{ _id: 'i2', email: 'carl@example.com' }], 'by her e-mail, any case');
  assert.deepEqual(db.dump('email_bounces').map(d => d._id), ['b2']);
  assert.deepEqual(db.dump('listSyncCredentials'), [{ _id: 'l1', token: 'x' }]);
  assert.deepEqual(db.dump('checklistItems'), [{ _id: 'c1' }, { _id: 'c2', assigneeId: 'bob' }]);
  assert.deepEqual(db.dump('recoveryEvents'), [{ _id: 'e1', type: 'restore' }]);
  assert.deepEqual(db.dump('card_comment_reactions')[0].reactions[0].userIds, ['bob']);
  const [v1, v2] = db.dump('eventlog');
  assert.deepEqual(Object.keys(v1.actors), ['k2', 'k3']);
  assert.equal(v1.username, undefined);
  assert.equal(v1.ipv4, undefined, 'her address as the most recent occurrence goes with her');
  assert.equal(v2.username, 'bob', 'a row whose most recent occurrence is Bob keeps him');
  assert.deepEqual(Object.keys(v2.actors), ['k2']);
  assert.deepEqual(Object.keys(db.dump('loginAddresses')[0].users.entries), ['k2']);
});

test('anonymising Ann keeps the references to her account, and erases the rest the same way', async () => {
  const db = fakeDb(seed());
  await applyUserErasure(buildUserErasure(ANN, 'anonymize'), db.coll);
  assert.deepEqual(db.dump('checklistItems')[0], { _id: 'c1', assigneeId: 'ann' }, 'the item stays assigned to the anonymous account');
  assert.equal(db.dump('timeEntries').length, 3, 'her logged time stays, linked only to the anonymous id');
  assert.deepEqual(db.dump('sessiondata').map(d => d._id), ['sessiondata-bob']);
  assert.deepEqual(db.dump('card_comment_reactions')[0].reactions[0].userIds, ['bob']);
});

test('negative: no id, or an id that is not a string, erases nothing', () => {
  for (const bad of [null, undefined, {}, { _id: '' }, { _id: { $ne: null } }, { _id: 7 }]) {
    assert.equal(buildUserErasure(bad), null);
  }
});

test('negative: one collection that fails does not keep the others from being erased', async () => {
  const db = fakeDb(seed());
  const failing = name => (name === 'sessiondata' ? { deleteMany: async () => { throw new Error('down'); } } : db.coll(name));
  const errors = [];
  await applyUserErasure(buildUserErasure(ANN), failing, c => errors.push(c));
  assert.deepEqual(errors, ['sessiondata']);
  assert.deepEqual(db.dump('windowsSsoTokens').map(d => d._id), ['windowsSsoTokens-bob']);
});

test('both erasure paths run the rules: deletion after the account is removed, anonymisation before its name is replaced', () => {
  assert.match(read('models/users.js'), /runUserErasure\(doc, 'delete'\)/);
  const anon = read('server/models/users.js');
  const at = anon.indexOf('async anonymizeUser(');
  const body = anon.slice(at, anon.indexOf('\n  },', at));
  const erase = body.indexOf("runUserErasure(await Users.findOneAsync(targetUserId), 'anonymize')");
  assert.ok(erase > 0, 'anonymizeUser runs the rules');
  assert.ok(erase < body.indexOf('buildAnonymizeUpdate(placeholder)'), 'with the name and e-mails still there to find rows by');
});
