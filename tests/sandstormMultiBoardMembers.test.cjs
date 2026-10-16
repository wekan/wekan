'use strict';

// Regression coverage for #2405, #2428 and #3684. A multi-board Sandstorm grain
// keeps WeKan's normal, permission-checked board-member picker. Beside it, the
// Powerbox button picks a person through Sandstorm - and, unlike the control
// #2405 removed, adds them to the board that is open, through the same
// inviteUserToBoard checks. Redeeming the request itself goes through
// imports/sandstorm/bridgeClient.mjs (tests/sandstormCapnpRpc.test.cjs).

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const sidebar = read('client/components/sidebar/sidebar.jade');
const sidebarJs = read('client/components/sidebar/sidebar.js');
const shared = read('sandstorm.js');
const server = read('server/sandstorm.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const members = sidebar.slice(
  sidebar.indexOf('template(name="membersWidget")'),
  sidebar.indexOf('template(name="boardOrgGeneral")'),
);

test('Sandstorm keeps the normal permission-checked board member picker', () => {
  assert.match(members, /if currentUser\.canInviteToBoard\s+a\.member\.add-member\.js-manage-board-members/);
});

test('the Powerbox button is back, for Sandstorm and for people who may invite', () => {
  assert.match(members,
    /if currentUser\.canInviteToBoard\s+a\.member\.add-member\.js-manage-board-members[^\n]*\n\s+i\.fa\.fa-plus\n\s+if isSandstorm\n\s+a\.member\.add-member\.sandstorm-powerbox-request-identity/,
    'inside canInviteToBoard, and only when isSandstorm');
});

test('the button names the open board, and the claim invites the person to it', () => {
  assert.match(sidebarJs, /'click \.sandstorm-powerbox-request-identity'\(\) \{\s*window\.sandstormRequestIdentity\(Session\.get\('currentBoard'\)\);/);
  assert.match(shared, /window\.sandstormRequestIdentity = function\(boardId\)/);
  assert.match(shared, /'sandstormClaimIdentityRequest',\s*response\.token,\s*response\.descriptor,\s*boardId,/);
  assert.match(server, /async sandstormClaimIdentityRequest\(token, descriptor, boardId\)/);
  assert.match(server, /check\(boardId, Match\.Maybe\(String\)\)/);
  assert.match(server, /if \(!this\.userId\) throw new Meteor\.Error\('error-notAuthorized'\)/,
    'nobody but a logged-in grain user may redeem a request (negative)');
  assert.match(server, /await Meteor\.callAsync\('inviteUserToBoard', login\.userId, boardId\)/,
    'the same checks as the member picker, not a direct board update');
  const method = server.slice(server.indexOf('async sandstormClaimIdentityRequest('),
    server.indexOf('return { userId: login.userId };'));
  assert.doesNotMatch(method, /Boards\.|members/,
    'the claim must not add members around inviteUserToBoard (negative)');
});

test('Sandstorm cannot create an unusable local email account from the picker', () => {
  const popup = sidebar.slice(
    sidebar.indexOf('template(name="addMemberPopup")'),
    sidebar.indexOf('template(name="changePermissionsPopup")'),
  );
  assert.match(popup, /unless isSandstorm\s+button\.js-email-invite/);
});

test('grain configure permission remains the source of global admin rights', () => {
  assert.match(server, /const isAdmin = permissions\.indexOf\('configure'\) > -1/);
  assert.match(server, /Users\.updateAsync\(userId, \{ \$set: \{ isAdmin \} \}\)/);
  assert.match(server, /'services\.sandstorm\.permissions': 'configure'/);
});

console.log(`\nsandstormMultiBoardMembers: ${passed} tests passed`);
