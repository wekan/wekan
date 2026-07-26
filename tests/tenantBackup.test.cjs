'use strict';
// The pure modules are ES modules (every app file is one in Meteor), so they are
// loaded with a dynamic import - the same way tests/cardUrl.test.cjs loads its module.
(async () => {

// Multitenancy option D — per-tenant backup and restore.
// Plain Node, no Meteor: models/lib/tenantBackup.js is pure, and it is where a
// cross-tenant write would come from, so the restore-side guard gets most of the
// tests here — including the ones where a hand-edited archive tries to widen its
// own scope.
// Run: node tests/tenantBackup.test.cjs
//
// See docs/Design/Multitenancy/Multitenancy.md (D.8).

const assert = require('assert');
const b = await import('../models/lib/tenantBackup.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('tenantBackup:');

const CTX = { orgId: 'orgA', boardIds: ['b1', 'b2'], triggerIds: ['t1'], actionIds: ['a1'] };

// ── what is in a tenant archive ──────────────────────────────────────────────

test('a tenant archive carries boards and everything hanging off them', () => {
  const names = b.names();
  ['boards', 'lists', 'swimlanes', 'cards', 'card_comments', 'checklists',
    'checklistItems', 'customFields', 'activities', 'rules', 'triggers', 'actions',
    'integrations', 'attachments'].forEach(name => {
    assert.ok(names.includes(name), `${name} must be part of a tenant backup`);
  });
});

test('a tenant archive carries NO accounts, settings, orgs or teams', () => {
  // Accounts are one global namespace (D.6), the settings singletons are
  // per-instance, and restoring an org/team document could resurrect a deleted
  // tenant or rewrite another tenant's membership.
  ['users', 'org', 'team', 'settings', 'accountSettings', 'lockoutSettings',
    'invitation_codes', 'impersonatedUsers'].forEach(name => {
    assert.ok(!b.isTenantCollection(name), `${name} must never be in a tenant backup`);
    assert.ok(b.isForbiddenInTenantBackup(name), `${name} must be refused by name`);
  });
});

test('avatars are not a tenant collection either', () => {
  assert.strictEqual(b.isTenantCollection('avatars'), false);
});

// ── export selectors ─────────────────────────────────────────────────────────

test('the tenant\'s boards are the boards that list the Organization', () => {
  assert.deepStrictEqual(b.tenantBoardSelector('orgA'),
    { orgs: { $elemMatch: { orgId: 'orgA' } } });
  assert.strictEqual(b.tenantBoardSelector(''), null);
  assert.strictEqual(b.tenantBoardSelector(null), null);
});

test('each collection is exported under the selector its shape needs', () => {
  assert.deepStrictEqual(b.exportSelector('boards', CTX), { _id: { $in: ['b1', 'b2'] } });
  assert.deepStrictEqual(b.exportSelector('cards', CTX), { boardId: { $in: ['b1', 'b2'] } });
  assert.deepStrictEqual(b.exportSelector('customFields', CTX), { boardIds: { $in: ['b1', 'b2'] } });
  assert.deepStrictEqual(b.exportSelector('attachments', CTX), { 'meta.boardId': { $in: ['b1', 'b2'] } });
  // Triggers and actions carry no board of their own: they are reached through the
  // rules of the tenant's boards.
  assert.deepStrictEqual(b.exportSelector('triggers', CTX), { _id: { $in: ['t1'] } });
  assert.deepStrictEqual(b.exportSelector('actions', CTX), { _id: { $in: ['a1'] } });
});

test('an empty tenant exports nothing rather than everything', () => {
  // The bug this prevents: an empty $in exports nothing, but a MISSING selector
  // would have exported the whole collection.
  const empty = { orgId: 'orgA', boardIds: [], triggerIds: [], actionIds: [] };
  assert.strictEqual(b.exportSelector('cards', empty), null);
  assert.strictEqual(b.exportSelector('boards', empty), null);
  assert.strictEqual(b.exportSelector('triggers', empty), null);
  assert.strictEqual(b.exportSelector('users', CTX), null, 'not a tenant collection');
});

// ── the restore-side guard ───────────────────────────────────────────────────

test('a document of the tenant\'s own board is restored', () => {
  assert.strictEqual(b.docBelongsToTenant('boards', { _id: 'b1' }, CTX), true);
  assert.strictEqual(b.docBelongsToTenant('cards', { _id: 'c1', boardId: 'b2' }, CTX), true);
  assert.strictEqual(b.docBelongsToTenant('attachments', { _id: 'f1', meta: { boardId: 'b1' } }, CTX), true);
  assert.strictEqual(b.docBelongsToTenant('triggers', { _id: 't1' }, CTX), true);
});

test('a document of ANOTHER tenant\'s board is refused', () => {
  // The whole point: a hand-edited archive naming someone else's board.
  assert.strictEqual(b.docBelongsToTenant('boards', { _id: 'other' }, CTX), false);
  assert.strictEqual(b.docBelongsToTenant('cards', { _id: 'c9', boardId: 'other' }, CTX), false);
  assert.strictEqual(b.docBelongsToTenant('attachments', { _id: 'f9', meta: { boardId: 'other' } }, CTX), false);
  assert.strictEqual(b.docBelongsToTenant('triggers', { _id: 'tX' }, CTX), false);
  assert.strictEqual(b.docBelongsToTenant('actions', { _id: 'aX' }, CTX), false);
});

test('a document with no board at all is refused', () => {
  assert.strictEqual(b.docBelongsToTenant('cards', { _id: 'c1' }, CTX), false);
  assert.strictEqual(b.docBelongsToTenant('attachments', { _id: 'f1' }, CTX), false);
  assert.strictEqual(b.docBelongsToTenant('cards', null, CTX), false);
  assert.strictEqual(b.docBelongsToTenant('cards', { boardId: ['b1'] }, CTX), false);
});

test('a collection that is not part of a tenant backup is refused whatever it says', () => {
  assert.strictEqual(b.docBelongsToTenant('users', { _id: 'u1', boardId: 'b1' }, CTX), false);
  assert.strictEqual(b.docBelongsToTenant('settings', { _id: 's', boardId: 'b1' }, CTX), false);
});

test('a custom field shared with a board OUTSIDE the tenant is refused', () => {
  // Restoring it would rewrite a document another tenant's boards also read.
  assert.strictEqual(b.docBelongsToTenant('customFields', { _id: 'cf', boardIds: ['b1', 'b2'] }, CTX), true);
  assert.strictEqual(b.docBelongsToTenant('customFields', { _id: 'cf', boardIds: ['b1', 'other'] }, CTX), false);
  assert.strictEqual(b.docBelongsToTenant('customFields', { _id: 'cf', boardIds: [] }, CTX), false);
});

test('an archive cannot widen its own scope: the allowed boards are the intersection', () => {
  assert.deepStrictEqual(b.allowedRestoreBoardIds(['b1', 'other', 'b2'], ['b1', 'b2']),
    ['b1', 'b2']);
  assert.deepStrictEqual(b.allowedRestoreBoardIds(['other'], ['b1']), []);
  assert.deepStrictEqual(b.allowedRestoreBoardIds([], ['b1']), []);
  assert.deepStrictEqual(b.allowedRestoreBoardIds(['b1'], []), []);
  assert.deepStrictEqual(b.allowedRestoreBoardIds(null, null), []);
});

// ── where archives live, and who may use them ────────────────────────────────

const PARTS = { y: 2026, mo: '07', da: '26', h: '12', mi: '00', s: '00' };

test('an instance archive and a tenant archive live in different places', () => {
  assert.strictEqual(b.tenantBackupRelativeDir(null, PARTS), 'backup/2026/07/26/12_00_00');
  assert.strictEqual(b.tenantBackupRelativeDir('orgA', PARTS),
    'backup/org/orgA/2026/07/26/12_00_00');
});

test('the org of an archive is read back from its path', () => {
  assert.strictEqual(
    b.orgIdOfBackupPath('/data/files/backup/org/orgA/2026/07/26/12_00_00/backup.zip'), 'orgA');
  assert.strictEqual(
    b.orgIdOfBackupPath('/data/files/backup/2026/07/26/12_00_00/backup.zip'), null);
  assert.strictEqual(b.orgIdOfBackupPath(''), null);
  assert.strictEqual(b.orgIdOfBackupPath(undefined), null);
});

test('a Windows path is read the same way', () => {
  assert.strictEqual(
    b.orgIdOfBackupPath('C:\\wekan\\files\\backup\\org\\orgA\\2026\\07\\26\\12_00_00\\backup.zip'),
    'orgA');
});

test('a directory called "org" somewhere else does NOT make an archive a tenant archive', () => {
  // …which would otherwise let an instance archive be treated as one tenant's.
  assert.strictEqual(
    b.orgIdOfBackupPath('/data/files/org/backup/2026/07/26/12_00_00/backup.zip'), null);
  assert.strictEqual(
    b.orgIdOfBackupPath('/srv/org/orgA/backup.zip'), null);
});

test('a per-tenant admin may use only their own tenant\'s archives', () => {
  const tenantPath = '/f/backup/org/orgA/2026/07/26/12_00_00/backup.zip';
  const otherPath = '/f/backup/org/orgB/2026/07/26/12_00_00/backup.zip';
  const instancePath = '/f/backup/2026/07/26/12_00_00/backup.zip';
  assert.strictEqual(b.canUseBackupPath({ adminOrgIds: ['orgA'], backupPath: tenantPath }), true);
  assert.strictEqual(b.canUseBackupPath({ adminOrgIds: ['orgA'], backupPath: otherPath }), false);
  // NEVER the instance archive: it contains every tenant.
  assert.strictEqual(b.canUseBackupPath({ adminOrgIds: ['orgA'], backupPath: instancePath }), false);
  assert.strictEqual(b.canUseBackupPath({ adminOrgIds: [], backupPath: tenantPath }), false);
  // The site admin may use any of them.
  assert.strictEqual(b.canUseBackupPath({ isSiteAdmin: true, backupPath: instancePath }), true);
  assert.strictEqual(b.canUseBackupPath({ isSiteAdmin: true, backupPath: otherPath }), true);
});

// ── the scope of a backup request ────────────────────────────────────────────

test('the whole instance is the site admin\'s scope alone', () => {
  assert.deepStrictEqual(b.resolveBackupScope({ isSiteAdmin: true, orgId: null }),
    { ok: true, orgId: null });
  // A per-tenant admin asking for it is REFUSED, not quietly given their own org.
  assert.deepStrictEqual(b.resolveBackupScope({ adminOrgIds: ['orgA'], orgId: null }),
    { ok: false, error: 'not-authorized' });
  assert.deepStrictEqual(b.resolveBackupScope({ adminOrgIds: ['orgA'], orgId: '' }),
    { ok: false, error: 'not-authorized' });
  assert.deepStrictEqual(b.resolveBackupScope({}), { ok: false, error: 'not-authorized' });
});

test('a per-tenant admin may back up their own Organization, and no other', () => {
  assert.deepStrictEqual(b.resolveBackupScope({ adminOrgIds: ['orgA'], orgId: 'orgA' }),
    { ok: true, orgId: 'orgA' });
  assert.deepStrictEqual(b.resolveBackupScope({ adminOrgIds: ['orgA'], orgId: 'orgB' }),
    { ok: false, error: 'not-authorized' });
  assert.deepStrictEqual(b.resolveBackupScope({ isSiteAdmin: true, orgId: 'orgB' }),
    { ok: true, orgId: 'orgB' });
});

test('a scope that is not a string is refused rather than coerced', () => {
  assert.deepStrictEqual(b.resolveBackupScope({ isSiteAdmin: true, orgId: { $ne: '' } }),
    { ok: false, error: 'bad-scope' });
  assert.deepStrictEqual(b.resolveBackupScope({ isSiteAdmin: true, orgId: 7 }),
    { ok: false, error: 'bad-scope' });
});

console.log(`\n${passed} tests passed`);

})();
