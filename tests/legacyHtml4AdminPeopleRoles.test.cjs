'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const service = read('server/lib/adminInviteRoles.js');
const method = read('server/methods/adminInviteRoles.js');
const publication = read('server/publications/inviteToBoardRolesSettings.js');
const permissions = read('server/permissions/inviteToBoardRolesSettings.js');
const pages = read('server/lib/legacyHtml4Pages.js');
const route = read('server/legacyHtml4.js');
const client = read('client/components/settings/peopleBody.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('legacyHtml4AdminPeopleRoles:');

test('one allowlisted Global Admin service owns both write paths', () => {
  assert.ok(/requireGlobalAdmin[\s\S]*?isAdmin[\s\S]*?not-authorized/.test(service));
  assert.ok(/unique\.some\(role => !INVITE_TO_BOARD_ROLES\.includes\(role\)\)/.test(service));
  assert.ok(method.includes('setInviteRolesForAdmin(this.userId, roles)'));
  assert.ok(route.includes('setInviteRolesForAdmin(session.userId'));
  assert.ok(client.includes("Meteor.call('setInviteToBoardRoles'"));
  assert.ok(/import \{ TAPi18n \} from '\/imports\/i18n'/.test(client),
    'the modern capability table imports its translator under Rspack');
  assert.ok(!/InviteToBoardRolesSettings\.update\(/.test(client));
});

test('HTML4 retains every invite choice, role capability and bulk control', () => {
  assert.ok(/path !== '\/admin\/people\/roles'/.test(pages));
  assert.ok(/INVITE_TO_BOARD_ROLES\.map/.test(pages));
  assert.ok(/BOARD_ROLES\.filter/.test(pages));
  assert.ok(/ROLE_CAPABILITIES\[role\]/.test(pages));
  for (const operation of ['save-invite-roles', 'all-invite-roles',
    'clear-invite-roles', 'search-roles']) assert.ok(pages.includes(operation));
});

test('admin settings do not leak and direct DDP writes are reported', () => {
  assert.ok(/ReactiveCache\.getCurrentUser\(\)/.test(publication));
  assert.ok(/inviteRolesForAdmin\(user\._id\)/.test(publication));
  assert.ok(/fields: \{ allowedRoles: 1 \}/.test(publication));
  assert.ok(/InviteToBoardRolesSettings\.deny\(/.test(permissions));
  for (const verb of ['insert', 'update', 'remove']) {
    assert.ok(new RegExp(`async ${verb}\\(userId\\)[\\s\\S]*?RolesBleed`).test(permissions));
  }
  assert.ok(/RolesBleed/.test(service));
});

console.log(`\nlegacyHtml4AdminPeopleRoles: ${passed} tests passed`);
