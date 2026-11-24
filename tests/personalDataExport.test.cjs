'use strict';

// WP-5 (docs/Compliance/README.md row 1.1): "Download my data" - everything
// WeKan holds about one person, machine readable, without secrets, and only
// the person's own unless an administrator asks (recorded in the Audit log).
// Run: node --test tests/personalDataExport.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const X = require('../models/lib/personalDataExport');
const { decideExportTarget } = require('../models/lib/personalDataExportAccess');
const { INVENTORY } = require('../models/lib/personalDataInventory');

const ANN = { _id: 'ann1', username: 'ann' };

test('every collection the inventory says holds personal data is exported, or named with the reason it is not', () => {
  const plan = X.exportPlan(ANN);
  const queried = new Set(plan.queries.map(q => q.collection));
  const skipped = new Set(plan.skipped.map(s => s.collection));
  for (const entry of INVENTORY.filter(X.isPersonal)) {
    assert.ok(queried.has(entry.collection) !== skipped.has(entry.collection),
      `${entry.collection}: exported or named as not exported, exactly one`);
  }
  for (const s of plan.skipped) assert.ok(s.reason && s.reason.length > 10, `${s.collection} says why`);
  // The ones a person asks for most are in it.
  for (const c of ['cards', 'card_comments', 'timeEntries', 'workloadAbsences', 'attachments', 'activities', 'boards']) {
    assert.ok(queried.has(c), c);
  }
});

test('a new personal collection in the inventory is in the export without a change here', () => {
  const inv = [...INVENTORY, { collection: 'newThing', categories: ['usage'], subjectField: 'ownerId' }];
  const q = X.exportPlan(ANN, inv).queries.find(x => x.collection === 'newThing');
  assert.deepEqual(q.selector, { ownerId: 'ann1' });
});

test('a field that holds a username is asked with the username, not the id', () => {
  const q = X.exportPlan(ANN).queries.find(x => x.collection === 'shortPasswordLogins');
  assert.deepEqual(q.selector, { $or: [{ userId: 'ann1' }, { username: 'ann' }] });
  const ev = X.exportPlan(ANN).queries.find(x => x.collection === 'eventlog');
  assert.doesNotMatch(JSON.stringify(ev.selector), /actors/, 'the hashed tally is not a person field');
});

test('negative: no secret leaves in the export, at any depth', () => {
  const user = {
    _id: 'ann1', username: 'ann', profile: { fullname: 'Ann', token: 'p1' },
    services: { password: { bcrypt: 'x' }, resume: { loginTokens: [{ hashedToken: 'h' }] } },
    passkeys: [{ id: 'c1', publicKey: 'pk', name: 'laptop' }],
  };
  const out = JSON.stringify(X.userRecord(user));
  assert.doesNotMatch(out, /bcrypt|hashedToken|loginTokens|services/);
  assert.match(out, /laptop/, 'what a passkey is called stays');
  const row = X.exportRow('trello_api_credentials', { _id: 'ann1', apiKey: 'k', apiToken: 't', nested: [{ secret: 's', ok: 1 }] }, 'ann1');
  assert.deepEqual(row, { _id: 'ann1', nested: [{ ok: 1 }] });
});

test('a shared board, card or list gives the person their own part, not everyone\'s', () => {
  const board = X.exportRow('boards', { _id: 'b', title: 'B', description: 'secret plan',
    members: [{ userId: 'ann1', isAdmin: true }, { userId: 'bob', isAdmin: false }], watchers: [] }, 'ann1');
  assert.deepEqual(board, { _id: 'b', title: 'B', members: [{ userId: 'ann1', isAdmin: true }], watchers: [] });
  const card = X.exportRow('cards', { _id: 'c', title: 'C', boardId: 'b', listId: 'l', userId: 'bob',
    members: ['ann1', 'bob'], assignees: ['bob'], description: 'other people\'s text' }, 'ann1');
  assert.deepEqual(card, { _id: 'c', title: 'C', boardId: 'b', listId: 'l', createdByMe: false, roles: ['members'] });
});

test('who may download whose export', () => {
  assert.deepEqual(decideExportTarget(ANN, ''), { allowed: true, self: true, userId: 'ann1' });
  assert.deepEqual(decideExportTarget(ANN, 'ann1'), { allowed: true, self: true, userId: 'ann1' });
  assert.deepEqual(decideExportTarget({ _id: 'adm', isAdmin: true }, 'bob2'), { allowed: true, self: false, userId: 'bob2' });
});

test('negative: nobody else\'s, nobody signed out or disabled, and no id that is not one', () => {
  assert.equal(decideExportTarget(ANN, 'bob2').code, 403);
  assert.equal(decideExportTarget(null, '').code, 401);
  assert.equal(decideExportTarget({ _id: 'adm', isAdmin: true, loginDisabled: true }, '').code, 401);
  assert.equal(decideExportTarget({ _id: 'adm', isAdmin: true }, { $ne: 1 }).code, 400, 'not a string: refused');
  assert.equal(decideExportTarget({ _id: 'adm', isAdmin: true }, '../x').code, 400);
  assert.equal(X.exportPlan(null), null);
  assert.equal(X.exportPlan({ _id: { $ne: null } }), null);
});

test('the route: registered, signed in by token, an administrator\'s export of another account audited, never cached', () => {
  const route = read('server/routes/personalDataExport.js');
  assert.match(read('server/imports.js'), /import '\/server\/routes\/personalDataExport';/);
  assert.match(route, /WebApp\.handlers\.get\('\/api\/user\/export'/);
  assert.match(route, /activeUserByToken\(token, 'export', req\)/);
  assert.match(route, /decideExportTarget\(requester, wanted\)/);
  assert.match(route, /if \(!decision\.self\) await recordAdminRouteAction\(requester, 'exportUserPersonalData', \[target\._id\], ip\)/);
  assert.match(route, /Cache-Control', 'no-store'/);
  assert.match(read('server/lib/adminRouteAudit.js'), /export function recordAdminRouteAction\(/);
  // Into the same Audit log, through its hash chain since P3 (models/lib/auditChain.js).
  assert.match(read('server/lib/adminRouteAudit.js'), /require\('\/server\/lib\/auditChainAppend'\)\.appendAuditRow\(doc\)/, 'into the same Audit log');
});
