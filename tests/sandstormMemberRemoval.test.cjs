'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const template = read('client/components/sidebar/sidebar.jade');
const events = read('client/components/sidebar/sidebar.js');
const english = JSON.parse(read('imports/i18n/data/en.i18n.json'));

test('Sandstorm does not hide the board-admin remove action', () => {
  const popup = template.slice(
    template.indexOf('template(name="memberPopup")'),
    template.indexOf('template(name="mapImportedMemberPopup")'),
  );
  assert.match(popup, /else if currentUser\.isBoardAdmin\s+a\.js-remove-member/);
  assert.doesNotMatch(popup, /unless isSandstorm[\s\S]*js-remove-member/);
});

test('Sandstorm removal explicitly says grain access is not revoked', () => {
  const popup = template.slice(
    template.indexOf('template(name="removeMemberPopup")'),
    template.indexOf('template(name="leaveBoardPopup")'),
  );
  assert.match(popup, /if isSandstorm\s+p\.warning \{\{_ 'sandstorm-remove-member-warning'\}\}/);
  assert.match(english['sandstorm-remove-member-warning'], /does not revoke access/i);
  assert.match(english['sandstorm-remove-member-warning'], /Share access/);
});

test('ordinary deployments do not receive the Sandstorm warning', () => {
  const popup = template.slice(
    template.indexOf('template(name="removeMemberPopup")'),
    template.indexOf('template(name="leaveBoardPopup")'),
  );
  const warningAt = popup.indexOf("sandstorm-remove-member-warning");
  const gateAt = popup.indexOf('if isSandstorm');
  const buttonAt = popup.indexOf('button.js-confirm');
  assert.ok(gateAt >= 0 && gateAt < warningAt && warningAt < buttonAt);
});

test('confirmation removes card roles before deactivating board membership', () => {
  const handler = events.slice(
    events.indexOf("'click .js-remove-member'"),
    events.indexOf("'click .js-leave-member'"),
  );
  const memberCards = handler.indexOf('members: memberId');
  const assigneeCards = handler.indexOf('assignees: memberId');
  const boardRemoval = handler.indexOf('.removeMember(memberId)');
  assert.ok(memberCards >= 0 && memberCards < boardRemoval);
  assert.ok(assigneeCards >= 0 && assigneeCards < boardRemoval);
  assert.match(handler, /await ReactiveCache\.getBoard\(boardId\)\.removeMember\(memberId\)/);
});

console.log(`\n${passed} passed`);
