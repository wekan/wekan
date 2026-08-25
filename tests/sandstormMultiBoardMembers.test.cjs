'use strict';

// Regression coverage for #2405, #2428 and #3684. A multi-board Sandstorm
// grain must use the maintained board-member workflow; its old Powerbox-only
// control cannot attach an identity to the board and capnp.node is unavailable
// with the Node 24 bundle.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const sidebar = read('client/components/sidebar/sidebar.jade');
const sandstorm = read('sandstorm.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('Sandstorm uses the normal permission-checked board member picker', () => {
  const members = sidebar.slice(
    sidebar.indexOf('template(name="membersWidget")'),
    sidebar.indexOf('template(name="boardOrgGeneral")'),
  );
  assert.match(members, /if currentUser\.canInviteToBoard\s+a\.member\.add-member\.js-manage-board-members/);
  assert.doesNotMatch(members, /sandstorm-powerbox-request-identity/);
});

test('Sandstorm cannot create an unusable local email account from the picker', () => {
  const popup = sidebar.slice(
    sidebar.indexOf('template(name="addMemberPopup")'),
    sidebar.indexOf('template(name="addMemberPopupTest")'),
  );
  assert.match(popup, /unless isSandstorm\s+button\.js-email-invite/);
});

test('grain configure permission remains the source of global admin rights', () => {
  assert.match(sandstorm, /const isAdmin = permissions\.indexOf\('configure'\) > -1/);
  assert.match(sandstorm, /Users\.updateAsync\(userId, \{ \$set: \{ isAdmin \} \}\)/);
  assert.match(sandstorm, /'services\.sandstorm\.permissions': 'configure'/);
});

console.log(`\nsandstormMultiBoardMembers: ${passed} tests passed`);
