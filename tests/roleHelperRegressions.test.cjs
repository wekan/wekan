'use strict';

// Five role helpers that never worked, found while mapping every role check for
// custom board roles (#3022). Each tested a function REFERENCE or a value of
// the wrong kind, so it answered the same thing for everybody:
//   - canImportIntoBoard: `!user.isWorker` (a function: truthy) -> Import never offered
//   - rulesList canAdmin: `user.isBoardAdmin` (a function) -> rule controls for everyone
//   - changePermissionsPopup isLastAdmin: `activeAdmins() === 1` (a list) -> never
//   - membersWidget isWorker: `Boards.hasWorker(...)` (not a collection function)
//   - OIDC DEFAULT_BOARD_ID: `Array#contains` (does not exist) -> the role flags threw
// The negative test: no helper of that shape is left anywhere in client/.
// Run: node tests/roleHelperRegressions.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

test('each of the five asks the right thing', () => {
  assert.match(read('client/components/boards/exportScope.js'),
    /function canImportIntoBoard\(\) \{\n  return Boolean\(ReactiveCache\.getCurrentUser\(\) && Utils\.currentUserCan\('write'\)\);/);
  // #2217 moved the Rules page's one access rule to client/lib/rulesAccess.js;
  // it still CALLS isBoardAdmin, and canAdmin asks it.
  assert.match(read('client/components/rules/rulesList.js'), /return currentRulesAccess\(\) === 'edit';/);
  assert.match(read('client/lib/rulesAccess.js'), /isBoardAdmin: !!user\.isBoardAdmin\(\),\s*isSiteAdmin: user\.isAdmin === true,/);
  const sidebar = read('client/components/sidebar/sidebar.js');
  assert.match(sidebar, /currentBoard\.activeAdmins\(\)\.length === 1/);
  assert.doesNotMatch(sidebar, /Boards\.hasWorker\(/);
  const oidc = read('packages/wekan-oidc/oidc_server.js');
  assert.doesNotMatch(oidc, /\.contains\(/);
  assert.match(oidc, /defaultBoardParams\.includes\("isCommentOnly"\) \|\| defaultBoardParams\.includes\("isCommentsOnly"\)/);
});

test('negative: no role helper anywhere in client/ is tested as a bare reference', () => {
  const helpers = ['isWorker', 'isCommentOnly', 'isReadOnly', 'isReadAssignedOnly', 'isNoComments', 'isBoardAdmin', 'isBoardMember',
    'isNotCommentOnly', 'isNotWorker', 'isNotNoComments', 'canInviteToBoard'];
  const files = execFileSync('git', ['ls-files', 'client', 'models', 'packages'], { cwd: ROOT }).toString().split('\n')
    .filter(f => /\.js$/.test(f) && !f.includes('/tests/'));
  const offenders = [];
  // `user.isWorker` (or currentUser./this.) followed by anything but `(`, in an
  // expression: `!user.isWorker`, `user.isBoardAdmin)`, `&& user.isReadOnly &&`.
  // `user.isWorker && user.isWorker()` - checking the helper exists, then
  // calling it - is the one bare reference that is right.
  const shape = new RegExp(`[!(&|]\\s*(?:user|currentUser|this\\.user)\\.(${helpers.join('|')})\\b(?!\\s*[(=])(?!\\s*&&\\s*(?:user|currentUser|this\\.user)\\.\\1\\()`);
  for (const file of files) {
    read(file).split('\n').forEach((line, i) => {
      if (/^\s*\/\//.test(line)) return;
      if (shape.test(line)) offenders.push(`${file}:${i + 1}: ${line.trim()}`);
    });
  }
  assert.deepEqual(offenders, []);
  // And no list is compared with a number.
  const lists = files.filter(f => /activeAdmins\(\) === \d/.test(read(f)));
  assert.deepEqual(lists, []);
});
