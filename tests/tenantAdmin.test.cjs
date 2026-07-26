'use strict';
// The pure modules are ES modules (every app file is one in Meteor), so they are
// loaded with a dynamic import - the same way tests/cardUrl.test.cjs loads its module.
(async () => {

// Multitenancy option D — per-tenant Global Admins.
// Plain Node, no Meteor: models/lib/tenantAdmin.js is pure so the SAME rules run on
// the client (which menu entries to draw), on the server (which is the one that
// counts) and here. Most of this file is negative tests, because the interesting
// cases are the ones where a tenant admin must be told no.
// Run: node tests/tenantAdmin.test.cjs
//
// See docs/Design/Multitenancy/Multitenancy.md (D.7).

const assert = require('assert');
const t = await import('../models/lib/tenantAdmin.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('tenantAdmin:');

const SITE_ADMIN = { _id: 'root', isAdmin: true };
const ADMIN_A = {
  _id: 'adminA',
  orgs: [{ orgId: 'orgA', orgDisplayName: 'A', isAdmin: true }],
};
const ADMIN_AB = {
  _id: 'adminAB',
  orgs: [
    { orgId: 'orgA', orgDisplayName: 'A', isAdmin: true },
    { orgId: 'orgB', orgDisplayName: 'B', isAdmin: true },
  ],
};
const MEMBER_A = {
  _id: 'memberA',
  orgs: [{ orgId: 'orgA', orgDisplayName: 'A' }],
};
const MEMBER_B = {
  _id: 'memberB',
  orgs: [{ orgId: 'orgB', orgDisplayName: 'B' }],
};
const NOBODY = { _id: 'nobody' };

// ── who is what ──────────────────────────────────────────────────────────────

test('the site admin is the site admin, and nobody else is', () => {
  assert.strictEqual(t.isSiteAdmin(SITE_ADMIN), true);
  assert.strictEqual(t.isSiteAdmin(ADMIN_A), false);
  assert.strictEqual(t.isSiteAdmin(MEMBER_A), false);
  assert.strictEqual(t.isSiteAdmin(null), false);
  // A truthy-but-not-true value is not the flag.
  assert.strictEqual(t.isSiteAdmin({ isAdmin: 'yes' }), false);
});

test('adminOrgIds lists only memberships flagged isAdmin', () => {
  assert.deepStrictEqual(t.adminOrgIds(ADMIN_A), ['orgA']);
  assert.deepStrictEqual(t.adminOrgIds(ADMIN_AB), ['orgA', 'orgB']);
  assert.deepStrictEqual(t.adminOrgIds(MEMBER_A), []);
  assert.deepStrictEqual(t.adminOrgIds(NOBODY), []);
  assert.deepStrictEqual(t.adminOrgIds(null), []);
  // Being a site admin does not by itself make you an admin OF an org.
  assert.deepStrictEqual(t.adminOrgIds(SITE_ADMIN), []);
});

test('memberOrgIds lists every membership, admin or not', () => {
  assert.deepStrictEqual(t.memberOrgIds(ADMIN_A), ['orgA']);
  assert.deepStrictEqual(t.memberOrgIds(MEMBER_B), ['orgB']);
  assert.deepStrictEqual(t.memberOrgIds(NOBODY), []);
});

test('the Admin Panel opens for the site admin and for a per-tenant admin only', () => {
  assert.strictEqual(t.canOpenAdminPanel(SITE_ADMIN), true);
  assert.strictEqual(t.canOpenAdminPanel(ADMIN_A), true);
  assert.strictEqual(t.canOpenAdminPanel(MEMBER_A), false);
  assert.strictEqual(t.canOpenAdminPanel(null), false);
});

test('manageableOrgIds says "all" with null, and "none" with an empty array', () => {
  // The two must never be confused: null means every org, [] means no org at all.
  assert.strictEqual(t.manageableOrgIds(SITE_ADMIN), null);
  assert.deepStrictEqual(t.manageableOrgIds(ADMIN_AB), ['orgA', 'orgB']);
  assert.deepStrictEqual(t.manageableOrgIds(MEMBER_A), []);
});

// ── what a tenant admin may NOT do ───────────────────────────────────────────

test('a per-tenant admin may manage members of their own org', () => {
  assert.strictEqual(t.canManageUser(ADMIN_A, MEMBER_A), true);
  assert.strictEqual(t.canManageUser(ADMIN_AB, MEMBER_B), true);
});

test('a per-tenant admin may NOT manage a member of another org', () => {
  assert.strictEqual(t.canManageUser(ADMIN_A, MEMBER_B), false);
  assert.strictEqual(t.canManageUser(ADMIN_A, NOBODY), false);
});

test('a per-tenant admin may NEVER manage a site admin', () => {
  // Even if the site admin happens to be a member of their org: locking out or
  // taking over the instance owner is privilege escalation, not tenancy.
  const siteAdminInOrgA = {
    _id: 'root2', isAdmin: true, orgs: [{ orgId: 'orgA', orgDisplayName: 'A' }],
  };
  assert.strictEqual(t.canManageUser(ADMIN_A, siteAdminInOrgA), false);
  assert.strictEqual(t.canManageUser(SITE_ADMIN, siteAdminInOrgA), true);
});

test('someone who administers nothing may manage nobody', () => {
  assert.strictEqual(t.canManageUser(MEMBER_A, MEMBER_A), false);
  assert.strictEqual(t.canManageUser(null, MEMBER_A), false);
  assert.strictEqual(t.canManageUser(ADMIN_A, null), false);
});

test('appointing a per-tenant admin is allowed inside your own org only', () => {
  assert.strictEqual(t.canSetOrgAdmin(SITE_ADMIN, 'orgA'), true);
  assert.strictEqual(t.canSetOrgAdmin(SITE_ADMIN, 'orgZ'), true);
  assert.strictEqual(t.canSetOrgAdmin(ADMIN_A, 'orgA'), true);
  assert.strictEqual(t.canSetOrgAdmin(ADMIN_A, 'orgB'), false);
  assert.strictEqual(t.canSetOrgAdmin(MEMBER_A, 'orgA'), false);
});

test('a per-tenant admin can never write the site-wide isAdmin flag', () => {
  const fields = { username: 'x', isAdmin: true, loginDisabled: false };
  assert.deepStrictEqual(t.sanitizeUserFields(ADMIN_A, fields),
    { username: 'x', loginDisabled: false });
  // The site admin's update passes through unchanged.
  assert.deepStrictEqual(t.sanitizeUserFields(SITE_ADMIN, fields), fields);
  // …and the input is never mutated.
  assert.strictEqual(fields.isAdmin, true);
});

// ── scoping the queries ──────────────────────────────────────────────────────

test('the site admin sees every user; the query is passed through', () => {
  assert.deepStrictEqual(t.peopleScopeSelector(SITE_ADMIN, {}), {});
  assert.deepStrictEqual(t.peopleScopeSelector(SITE_ADMIN, { username: 'x' }),
    { username: 'x' });
});

test('a per-tenant admin only ever sees members of the orgs they administer', () => {
  assert.deepStrictEqual(t.peopleScopeSelector(ADMIN_A, {}),
    { 'orgs.orgId': { $in: ['orgA'] } });
  assert.deepStrictEqual(t.peopleScopeSelector(ADMIN_AB, null),
    { 'orgs.orgId': { $in: ['orgA', 'orgB'] } });
});

test('a crafted query cannot argue the restriction away — both must hold', () => {
  // The interesting attack: pass a query that mentions the same field, hoping the
  // merge overwrites the restriction. $and keeps both.
  const crafted = { 'orgs.orgId': { $in: ['orgB'] } };
  assert.deepStrictEqual(t.peopleScopeSelector(ADMIN_A, crafted),
    { $and: [crafted, { 'orgs.orgId': { $in: ['orgA'] } }] });
});

test('someone with no rights gets a selector that matches nothing', () => {
  // NOT an empty selector, which would return every user in the instance.
  assert.deepStrictEqual(t.peopleScopeSelector(MEMBER_A, {}), t.MATCH_NOTHING);
  assert.deepStrictEqual(t.orgScopeSelector(null, {}), t.MATCH_NOTHING);
  assert.notDeepStrictEqual(t.peopleScopeSelector(MEMBER_A, {}), {});
});

test('the Organizations pane is scoped by org id the same way', () => {
  assert.deepStrictEqual(t.orgScopeSelector(SITE_ADMIN, {}), {});
  assert.deepStrictEqual(t.orgScopeSelector(ADMIN_A, {}), { _id: { $in: ['orgA'] } });
  assert.deepStrictEqual(t.orgScopeSelector(ADMIN_A, { orgIsActive: true }),
    { $and: [{ orgIsActive: true }, { _id: { $in: ['orgA'] } }] });
});

// ── menus ────────────────────────────────────────────────────────────────────

const PEOPLE_MENU = [
  { id: 'registration-setting' },
  { id: 'email-setting' },
  { id: 'domains-setting' },
  { id: 'org-setting' },
  { id: 'team-setting' },
  { id: 'people-setting' },
  { id: 'locked-users-setting' },
  { id: 'roles-setting' },
  { id: 'templates-setting' },
];

test('the site admin keeps the whole People menu', () => {
  assert.deepStrictEqual(t.tenantAdminPeopleMenu(PEOPLE_MENU, SITE_ADMIN), PEOPLE_MENU);
});

test('a per-tenant admin gets Organizations and People, in menu order', () => {
  assert.deepStrictEqual(t.tenantAdminPeopleMenu(PEOPLE_MENU, ADMIN_A),
    [{ id: 'org-setting' }, { id: 'people-setting' }]);
});

test('the instance-wide People panes are not offered to a per-tenant admin', () => {
  const ids = t.tenantAdminPeopleMenu(PEOPLE_MENU, ADMIN_A).map(i => i.id);
  ['registration-setting', 'email-setting', 'domains-setting', 'team-setting',
    'locked-users-setting', 'roles-setting', 'templates-setting'].forEach(id => {
    assert.ok(!ids.includes(id), `${id} is instance-wide and must not be offered`);
  });
});

test('someone who is neither gets no menu at all', () => {
  assert.deepStrictEqual(t.tenantAdminPeopleMenu(PEOPLE_MENU, MEMBER_A), []);
  assert.deepStrictEqual(t.tenantAdminPeopleMenu(PEOPLE_MENU, null), []);
});

test('a null entry in the menu (a pane dropped elsewhere) is not kept', () => {
  // peopleMenu() drops the E-mail entry to null on Sandstorm.
  assert.deepStrictEqual(
    t.tenantAdminPeopleMenu([null, { id: 'org-setting' }], ADMIN_A),
    [{ id: 'org-setting' }]);
});

test('Attachments offers a per-tenant admin Backup and nothing else', () => {
  const menu = [
    { id: 'backup' }, { id: 'move' }, { id: 'gridfs' }, { id: 's3' },
    { id: 'database-migration' },
  ];
  assert.deepStrictEqual(t.tenantAdminAttachmentsMenu(menu, ADMIN_A), [{ id: 'backup' }]);
  assert.deepStrictEqual(t.tenantAdminAttachmentsMenu(menu, SITE_ADMIN), menu);
});

test('the Admin Panel tabs: Problems is the instance, so site-admin only', () => {
  assert.strictEqual(t.canOpenTab(SITE_ADMIN, 'settings'), true);
  assert.strictEqual(t.canOpenTab(SITE_ADMIN, 'problems'), true);
  assert.strictEqual(t.canOpenTab(ADMIN_A, 'people'), true);
  assert.strictEqual(t.canOpenTab(ADMIN_A, 'attachments'), true);
  // Settings is offered for ONE pane: Visibility, for its Change color section.
  assert.strictEqual(t.canOpenTab(ADMIN_A, 'settings'), true);
  assert.strictEqual(t.canOpenTab(ADMIN_A, 'problems'), false);
  assert.strictEqual(t.canOpenTab(MEMBER_A, 'people'), false);
  assert.strictEqual(t.canOpenTab(MEMBER_A, 'settings'), false);
});

test('Settings offers a per-tenant admin the Visibility pane and nothing else', () => {
  const menu = [
    { id: 'version-setting' }, { id: 'tableVisibilityMode-setting' },
    { id: 'announcement-setting' }, { id: 'accessibility-setting' },
    { id: 'translation-setting' }, { id: 'layout-setting' }, { id: 'webhook-setting' },
  ];
  assert.deepStrictEqual(t.tenantAdminSettingsMenu(menu, ADMIN_A),
    [{ id: 'tableVisibilityMode-setting' }]);
  assert.deepStrictEqual(t.tenantAdminSettingsMenu(menu, SITE_ADMIN), menu);
  assert.deepStrictEqual(t.tenantAdminSettingsMenu(menu, MEMBER_A), []);
});

// ── whose theme does "Change color" set? ─────────────────────────────────────

test('the site admin sets the instance theme, wherever they are', () => {
  assert.deepStrictEqual(t.themeTarget(SITE_ADMIN, null), { scope: 'instance' });
  assert.deepStrictEqual(t.themeTarget(SITE_ADMIN, 'orgA'), { scope: 'instance' });
});

test('an Organization\'s admin sets that Organization\'s theme', () => {
  assert.deepStrictEqual(t.themeTarget(ADMIN_A, null), { scope: 'org', orgId: 'orgA' });
  assert.deepStrictEqual(t.themeTarget(ADMIN_A, 'orgA'), { scope: 'org', orgId: 'orgA' });
});

test('an admin of several Organizations sets the one whose host they are on', () => {
  assert.deepStrictEqual(t.themeTarget(ADMIN_AB, 'orgB'), { scope: 'org', orgId: 'orgB' });
  // …and their first one when the host belongs to no Organization of theirs.
  assert.deepStrictEqual(t.themeTarget(ADMIN_AB, null), { scope: 'org', orgId: 'orgA' });
  assert.deepStrictEqual(t.themeTarget(ADMIN_AB, 'orgZ'), { scope: 'org', orgId: 'orgA' });
});

test('someone who administers nothing sets no theme at all', () => {
  assert.strictEqual(t.themeTarget(MEMBER_A, 'orgA'), null);
  assert.strictEqual(t.themeTarget(null, null), null);
});

console.log(`\n${passed} tests passed`);

})();
