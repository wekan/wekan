'use strict';
(async () => {

// Unit + negative tests for the list-sync reconcile logic
// (models/lib/listSyncReconcile.js), the core of "sync a list from an
// external tracker, getting newest changes, where old entries are at list
// history" - the maintainer's explicit ask. Pins:
//   - new external items become toCreate
//   - a changed title/description becomes toUpdate
//   - an external item that disappeared becomes toArchive (NOT deleted)
//   - the sync job reuses the EXISTING externalParsers.js parsers rather than
//     writing a second fetch/parse implementation (source-scan negative test)
//   - a stored credential is never returned to the client (source-scan
//     negative test on models/listSyncCredentials.js and its methods)
// Run: node tests/listSyncReconcile.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { planListSyncReconcile } = await import('../models/lib/listSyncReconcile.js');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// ── create / update / archive ───────────────────────────────────────────────

check('a new external item with no matching card is proposed for creation', () => {
  const plan = planListSyncReconcile({
    externalTasks: [{ externalId: 'PROJ-1', title: '[PROJ-1] Fix bug', description: '' }],
    existingCards: [],
  });
  assert.strictEqual(plan.toCreate.length, 1);
  assert.strictEqual(plan.toCreate[0].externalId, 'PROJ-1');
  assert.strictEqual(plan.toUpdate.length, 0);
  assert.strictEqual(plan.toArchive.length, 0);
});

check('a matching item with an unchanged title/description produces no update', () => {
  const plan = planListSyncReconcile({
    externalTasks: [{ externalId: 'PROJ-1', title: 'same', description: 'same' }],
    existingCards: [{ _id: 'c1', syncExternalId: 'PROJ-1', title: 'same', description: 'same' }],
  });
  assert.strictEqual(plan.toCreate.length, 0);
  assert.strictEqual(plan.toUpdate.length, 0);
  assert.strictEqual(plan.toArchive.length, 0);
});

check('a changed title upstream produces a toUpdate with only the changed field', () => {
  const plan = planListSyncReconcile({
    externalTasks: [{ externalId: 'PROJ-1', title: 'new title', description: 'same' }],
    existingCards: [{ _id: 'c1', syncExternalId: 'PROJ-1', title: 'old title', description: 'same' }],
  });
  assert.strictEqual(plan.toUpdate.length, 1);
  assert.deepStrictEqual(plan.toUpdate[0], { cardId: 'c1', changes: { title: 'new title' } });
});

check('a changed description upstream produces a toUpdate with only that field', () => {
  const plan = planListSyncReconcile({
    externalTasks: [{ externalId: 'PROJ-1', title: 'same', description: 'new body' }],
    existingCards: [{ _id: 'c1', syncExternalId: 'PROJ-1', title: 'same', description: 'old body' }],
  });
  assert.deepStrictEqual(plan.toUpdate[0], { cardId: 'c1', changes: { description: 'new body' } });
});

check('an external item that disappeared is proposed for ARCHIVE, not delete', () => {
  const plan = planListSyncReconcile({
    externalTasks: [],
    existingCards: [{ _id: 'c1', syncExternalId: 'PROJ-1', title: 't', description: '', archived: false }],
  });
  assert.strictEqual(plan.toArchive.length, 1);
  assert.strictEqual(plan.toArchive[0], 'c1');
  // Negative: nothing in the reconcile module's public shape offers a
  // "delete" verb at all - toArchive is the only thing that removes a card
  // from the active list.
  assert.deepStrictEqual(Object.keys(plan).sort(), ['toArchive', 'toCreate', 'toUpdate']);
});

check('an already-archived card whose item disappeared is not re-proposed for archive', () => {
  const plan = planListSyncReconcile({
    externalTasks: [],
    existingCards: [{ _id: 'c1', syncExternalId: 'PROJ-1', title: 't', description: '', archived: true }],
  });
  assert.strictEqual(plan.toArchive.length, 0);
});

check('a card synced from a DIFFERENT external id is untouched by an unrelated item', () => {
  const plan = planListSyncReconcile({
    externalTasks: [{ externalId: 'PROJ-2', title: 'other', description: '' }],
    existingCards: [{ _id: 'c1', syncExternalId: 'PROJ-1', title: 't', description: '', archived: false }],
  });
  assert.strictEqual(plan.toCreate.length, 1);
  assert.strictEqual(plan.toArchive.length, 1); // PROJ-1 no longer present upstream
  assert.strictEqual(plan.toArchive[0], 'c1');
});

check('a card with no syncExternalId (hand-created card sharing the list) is ignored entirely', () => {
  const plan = planListSyncReconcile({
    externalTasks: [{ externalId: 'PROJ-1', title: 't', description: '' }],
    existingCards: [{ _id: 'manual', title: 'hand-made', description: '' }],
  });
  assert.strictEqual(plan.toCreate.length, 1); // still creates PROJ-1
  assert.strictEqual(plan.toArchive.length, 0); // the hand-made card is never touched
});

// ── reuse, not a second implementation ──────────────────────────────────────

check('server/listSync.js imports its parsers from models/lib/externalParsers.js (no duplicate parser)', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'server', 'listSync.js'), 'utf8');
  assert.ok(src.includes("from '/models/lib/externalParsers'"));
  assert.ok(!/function\s+parse(Jira|Github|Gitlab|Gitea)/.test(src));
});

check('server/lib/listSyncFetch.js only fetches raw JSON, it does not parse issue/task shapes', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'server', 'lib', 'listSyncFetch.js'), 'utf8');
  // A second parser would read fields like `.fields.status` or `.assignee` -
  // the fetcher must not.
  assert.ok(!/\.fields\.(status|summary|description)/.test(src));
  assert.ok(!/column_name/.test(src));
});

// ── credential never published ──────────────────────────────────────────────

check('no Meteor.publish exists anywhere for listSyncCredentials', () => {
  const serverDir = path.join(__dirname, '..', 'server');
  const publicationsDir = path.join(serverDir, 'publications');
  const files = fs.existsSync(publicationsDir)
    ? fs.readdirSync(publicationsDir).map(f => path.join(publicationsDir, f))
    : [];
  files.push(path.join(serverDir, 'listSync.js'));
  files.push(path.join(serverDir, 'methods', 'listSync.js'));
  for (const file of files) {
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) continue;
    const src = fs.readFileSync(file, 'utf8');
    const matches = src.match(/Meteor\.publish\(\s*['"]listSyncCredentials['"]/g);
    assert.ok(!matches, `unexpected publish of listSyncCredentials in ${file}`);
  }
});

check('the setListSyncSource/hasListSyncCredential methods never return a raw token', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'server', 'methods', 'listSync.js'), 'utf8',
  );
  // hasListSyncCredential must return a boolean, never the credential doc.
  const hasCredMatch = /async hasListSyncCredential\([^)]*\)\s*{([\s\S]*?)\n  },/.exec(src);
  assert.ok(hasCredMatch, 'could not locate hasListSyncCredential body');
  assert.ok(/return !!credential/.test(hasCredMatch[1]));
  assert.ok(!/return credential;/.test(hasCredMatch[1]));
});

console.log(`listSyncReconcile.test.cjs: ${passed} passed`);
})();
