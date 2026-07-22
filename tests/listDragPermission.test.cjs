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
  const start = utils.indexOf('canModifyBoard() {');
  assert.ok(start > -1, 'canModifyBoard must exist');
  const body = utils.slice(start, start + 400);
  // The current user must be required first, so a null/undefined (anonymous) user
  // short-circuits to falsy => !canModifyBoard() === true => the sortable disabled.
  assert.ok(/const currentUser = ReactiveCache\.getCurrentUser\(\)/.test(body),
    'must read the current user');
  assert.ok(/currentUser &&\s*[\s\S]*currentUser\.isBoardMember\(\)/.test(body),
    'must require currentUser && currentUser.isBoardMember() (anonymous => falsy)');
  assert.ok(/!currentUser\.isCommentOnly\(\)/.test(body) && /!currentUser\.isReadOnly\(\)/.test(body),
    'must also exclude comment-only / read-only members');
});

console.log(`\nlistDragPermission: ${passed} checks passed`);
