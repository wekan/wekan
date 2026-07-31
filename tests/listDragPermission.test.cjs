'use strict';

// Regression guard for #1158 ("Disable List Dragging on Public Boards When User
// Isn't Logged In"): on a public read-only board an anonymous / read-only user
// could still DRAG lists (the reorder was denied server-side and snapped back,
// but the drag itself made mobile left/right scrolling almost impossible).
// Run: node tests/listDragPermission.test.cjs
//
// Fixed by #5462: every list sortable is `disabled: !Utils.canModifyBoard()`, and
// canModifyBoard() requires a current user who is an active, non-read-only board
// member — so an anonymous user (no currentUser) can never drag lists. These are
// source guards because the sortable init is jQuery-UI/Blaze-coupled.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const swimlanes = read('client/components/swimlanes/swimlanes.js');
const utils = read('client/lib/utils.js');

check('#1158: every list sortable in swimlanes.js is gated by canModifyBoard()', () => {
  const sortables = (swimlanes.match(/\.sortable\(\{/g) || []).length;
  const gated = (swimlanes.match(/disabled: !Utils\.canModifyBoard\(\)/g) || []).length;
  assert.ok(sortables >= 3, `expected the 3 list sortables, found ${sortables}`);
  assert.strictEqual(gated, sortables,
    `every list sortable must set disabled: !Utils.canModifyBoard() (found ${gated}/${sortables})`);
});

check('#1158: canModifyBoard() is falsy for an anonymous user (no currentUser)', () => {
  // This used to read the three flag exclusions out of canModifyBoard's own body.
  // It no longer has any: the UI helpers and the server allow rules both ask
  // models/lib/boardRoleCapabilities.js now, because writing the rule out in each
  // of them is how the three copies drifted apart (docs/Features/Members/Roles.md).
  // What #1158 actually needs is unchanged and is what is checked here: an
  // anonymous user must be FALSY, so `!Utils.canModifyBoard()` disables the list
  // sortable. That is a behaviour, so test the behaviour.
  const start = utils.indexOf('canModifyBoard() {');
  assert.ok(start > -1, 'canModifyBoard must exist');
  const body = utils.slice(start, start + 400);
  assert.ok(/currentUserCan\('write'\)/.test(body),
    'must ask the shared capability table for write access');

  const { memberCan } = require('../models/lib/boardRoleCapabilities');
  const members = [{ userId: 'ada', isActive: true }]; // a plain Normal member
  assert.strictEqual(memberCan(members, null, 'write'), false,
    'anonymous (no userId) => falsy => the sortable is disabled');
  assert.strictEqual(memberCan(members, 'zoe', 'write'), false,
    'and so is somebody who is not a member of this board');
  assert.strictEqual(memberCan(members, 'ada', 'write'), true,
    'while a normal member may still reorder lists');

  // The exclusions the old assertion named are still enforced - by the table.
  for (const flag of ['isCommentOnly', 'isReadOnly', 'isReadAssignedOnly']) {
    assert.strictEqual(
      memberCan([{ userId: 'ada', isActive: true, [flag]: true }], 'ada', 'write'), false,
      `${flag} must still be excluded from list dragging`);
  }
});

console.log(`\nlistDragPermission: ${passed} checks passed`);
