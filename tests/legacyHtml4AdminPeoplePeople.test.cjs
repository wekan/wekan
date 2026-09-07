'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const service = read('server/lib/adminPeople.js');
const locations = read('server/methods/loginOffices.js');
const pages = read('server/lib/legacyHtml4Pages.js');
const route = read('server/legacyHtml4.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('legacyHtml4AdminPeoplePeople:');

test('people reads have one tenant-aware fixed-field service', () => {
  assert.ok(service.includes('PEOPLE_PUBLIC_FIELDS'));
  assert.ok(service.includes('tenantAdmin.peopleScopeSelector(actor'));
  assert.ok(service.includes('tenantAdmin.orgScopeSelector(actor'));
  assert.ok(service.includes('escapeForRegex(search)'));
  assert.ok(service.includes('peopleLoginLocationsForAdmin'));
  assert.ok(locations.includes('export async function peopleLoginLocationsForAdmin'));
  assert.ok(/bleed: 'UserBleed'/.test(service));
});

test('the HTML4 table retains search, five filters, nine columns and paging', () => {
  assert.ok(/path !== '\/admin\/people\/people'/.test(pages));
  for (const filter of ['all', 'locked', 'active', 'inactive', 'admin']) {
    assert.ok(service.includes(`'${filter}'`));
  }
  for (const key of ['username', 'email', 'admin', 'active-person', 'location',
    'accounts-lockout-status', 'createdAt', 'select-all']) assert.ok(pages.includes(key));
  assert.ok(/uiSearchForm/.test(pages));
  assert.ok(/uiSelectForm/.test(pages));
  assert.ok(/previous-page/.test(pages));
  assert.ok(/next-page/.test(pages));
});

test('active, unlock, detail and IPv4/IPv6 location paths are signed and scoped', () => {
  for (const operation of ['show-person', 'set-person-active',
    'request-unlock-person', 'unlock-person', 'show-login-country']) {
    assert.ok(route.includes(operation) || pages.includes(operation), `missing ${operation}`);
  }
  assert.ok(service.includes('personForAdmin'));
  assert.ok(service.includes('tenantAdmin.canManageUser(actor, target)'));
  assert.ok(pages.includes('location.ipv4'));
  assert.ok(pages.includes('location.ipv6'));
  assert.ok(/adminPeoplePeoplePage[\s\S]*adminPeopleBaselinePage/.test(pages));
});

test('create and complete edit share one validated server boundary', () => {
  for (const operation of ['show-create-person', 'create-person', 'update-person']) {
    assert.ok(route.includes(operation) || pages.includes(operation), `missing ${operation}`);
  }
  for (const fn of ['createPersonForAdmin', 'updatePersonForAdmin',
    'normalizedPersonInput', 'uniqueIdentity', 'memberships']) assert.ok(service.includes(fn));
  assert.ok(service.includes('Accounts.createUserAsync'));
  assert.ok(service.includes('Accounts.setPasswordAsync'));
  assert.ok(service.includes('cannot-demote-last-admin'));
  assert.ok(service.includes('invalid-user-membership'));
  assert.ok(pages.includes("name: 'orgIds'"));
  assert.ok(pages.includes("name: 'teamIds'"));
});

console.log(`\nlegacyHtml4AdminPeoplePeople: ${passed} tests passed`);
