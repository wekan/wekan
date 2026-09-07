'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const service = read('server/lib/adminOrganizations.js');
const orgMethods = read('server/models/org.js');
const tenantMethods = read('server/methods/tenant.js');
const adminMethods = read('server/methods/adminOrganizations.js');
const client = read('client/components/settings/peopleBody.js');
const pages = read('server/lib/legacyHtml4Pages.js');
const route = read('server/legacyHtml4.js');
const multipart = read('server/lib/legacyHtml4Multipart.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('legacyHtml4AdminPeopleOrganizations:');

test('HTML4 and Jade mutations share guarded services', () => {
  assert.ok(/async function actorFor[\s\S]*canOpenAdminPanel/.test(service));
  assert.ok(/bleed: 'TenantBleed'/.test(service));
  for (const name of ['createOrganizationForAdmin', 'updateOrganizationForAdmin',
    'setOrganizationFeatureForAdmin', 'setAllOrganizationsFeatureForAdmin']) {
    assert.ok(orgMethods.includes(name), `org methods miss ${name}`);
    assert.ok(route.includes(name), `HTML4 route misses ${name}`);
  }
  for (const name of ['saveOrganizationTenantFieldsForAdmin',
    'organizationMembersForAdmin', 'setOrganizationAdminForAdmin']) {
    assert.ok(tenantMethods.includes(name), `tenant methods miss ${name}`);
    assert.ok(route.includes(name) || pages.includes(name), `HTML4 path misses ${name}`);
  }
  assert.ok(adminMethods.includes('deleteOrganizationForAdmin'));
  assert.ok(adminMethods.includes('setBoardMembersSameOrgForAdmin'));
  assert.ok(!/Settings\.update\(setting\._id[\s\S]*boardMembersFromSameOrgOnly/.test(client));
  assert.ok(!/Org\.remove\(orgId\)/.test(client));
});

test('the common boundary fixes fields, scopes reads and validates tenant links', () => {
  assert.ok(service.includes('ORGANIZATION_FEATURE_FIELDS'));
  assert.ok(service.includes('tenantAdmin.orgScopeSelector(actor, query)'));
  assert.ok(service.includes("escapeForRegex(search)"));
  assert.ok(/slice\(0, 500\)/.test(service));
  assert.ok(/url\.protocol === 'http:' \|\| url\.protocol === 'https:'/.test(service));
  assert.ok(/conflictingHosts/.test(service));
  assert.ok(/find\(\{ 'orgs\.orgId': orgId \}\)\.countAsync/.test(service));
  assert.ok(/non-empty organization[\s\S]*'validation', 'medium'/.test(service));
  assert.ok(/out-of-scope user/.test(service));
});

test('HTML4 retains every Organizations operation and ten-column table', () => {
  assert.ok(/path !== '\/admin\/people\/organizations'/.test(pages));
  for (const operation of ['show-create-organization', 'create-organization',
    'show-edit-organization', 'update-organization', 'save-organization-tenant',
    'upload-organization-logo', 'set-organization-feature',
    'set-all-organizations-feature', 'set-board-members-same-org',
    'show-organization-admins', 'set-organization-admin',
    'request-delete-organization', 'delete-organization']) {
    assert.ok(pages.includes(operation) || route.includes(operation), `missing ${operation}`);
  }
  assert.ok(/columns: \[tr\(translate, 'actions'[\s\S]*org-sync-members-from-auth/.test(pages));
  assert.ok(/uiSearchForm/.test(pages));
  assert.ok(/uiFileForm[\s\S]*accept: 'image\/\*'/.test(pages));
  assert.ok(multipart.includes("'/admin/people/organizations'"));
  assert.ok(multipart.includes("'orgId'"));
});

console.log(`\nlegacyHtml4AdminPeopleOrganizations: ${passed} tests passed`);
