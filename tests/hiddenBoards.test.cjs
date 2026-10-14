'use strict';

// #4265: leaving a board that came through a team hides it in a per-user list
// it can be restored from; the team membership stays.
// Run: node tests/hiddenBoards.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { planQuitBoard, reachesBoardOtherwise, hiddenBoardsAfter } = require('../models/lib/boardInvites.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const board = { teams: [{ teamId: 't1', isActive: true }], orgs: [{ orgId: 'o1', isActive: false }], domains: [{ domain: 'example.com' }] };

// Positive.
assert.equal(reachesBoardOtherwise(board, { teamIds: ['t1'] }), true, 'through a team');
assert.equal(reachesBoardOtherwise(board, { emailDomains: ['example.com'] }), true, 'through an e-mail domain');
assert.deepEqual(planQuitBoard({ isMember: false, isInvited: false, reachableOtherwise: true }),
  { ok: true, removeMember: false, pullInvite: false, hide: true }, 'a team-only board is hidden, not refused');
assert.deepEqual(planQuitBoard({ isMember: true, isInvited: false, reachableOtherwise: true }),
  { ok: true, removeMember: true, pullInvite: false, hide: true }, 'a member who also has it through a team: both');
assert.deepEqual(hiddenBoardsAfter(['a'], 'b', true), ['a', 'b']);
assert.deepEqual(hiddenBoardsAfter(['a', 'b'], 'b', true), ['a', 'b'], 'once');
assert.deepEqual(hiddenBoardsAfter(['a', 'b'], 'a', false), ['b'], 'restore');
console.log('  ok - a board reached through a team is hidden on leaving, and restorable');

// Negative: the old behaviour where nothing else reaches the board; no team
// membership is touched.
assert.equal(reachesBoardOtherwise(board, { orgIds: ['o1'] }), false, 'an inactive organization link does not count');
assert.equal(reachesBoardOtherwise(board, { teamIds: ['t2'] }), false);
assert.equal(reachesBoardOtherwise(null, { teamIds: ['t1'] }), false);
assert.deepEqual(planQuitBoard({ isMember: true, isInvited: false }), { ok: true, removeMember: true, pullInvite: false, hide: false });
assert.equal(planQuitBoard({ isMember: false, isInvited: false }).error, 'error-board-notAMember');
assert.equal(hiddenBoardsAfter(Array.from({ length: 1200 }, (_, i) => `b${i}`), 'x', true).length, 1000, 'bounded');
assert.deepEqual(hiddenBoardsAfter('junk', 'x', false), []);
const server = read('server/models/boards.js');
const quit = server.slice(server.indexOf('async quitBoard('), server.indexOf('async acceptInvite('));
assert.doesNotMatch(quit, /\$pull: \{ teams|\$pull: \{ orgs|removeBoardTeam|removeBoardOrg/, 'the team and organization are not touched');
assert.match(quit, /if \(plan\.hide\) \{\s*await Users\.updateAsync\(userId, \{ \$set: \{\s*'profile\.hiddenBoards': hiddenBoardsAfter\(/);
assert.match(server, /async restoreHiddenBoard\(boardId\) \{\s*check\(boardId, String\);\s*if \(!this\.userId\) throw/);
console.log('  ok - members-only boards leave as before; team links untouched');

// All Boards leaves hidden boards out, both the paged and the drag views.
assert.match(read('server/publications/boards.js'), /if \(hidden\.length\) selector\.\$and = \[\.\.\.\(selector\.\$and \|\| \[\]\), \{ _id: \{ \$nin: hidden \} \}\];/);
assert.match(read('client/components/boards/boardsList.js'), /if \(Array\.isArray\(hidden\) && hidden\.length\) query\.\$and\.push\(\{ _id: \{ \$nin: hidden \} \}\);/);
assert.match(read('client/components/boards/boardsList.jade'), /if canHideBoard\s*\n\s*a\.js-hide-board/);
const header = read('client/components/users/userHeader.jade');
assert.match(header, /a\.js-hidden-boards/);
assert.match(header, /template\(name="hiddenBoardsPopup"\)[\s\S]{0,400}a\.js-restore-hidden-board\(data-id=_id\)/);
assert.match(read('models/users.js'), /'profile\.hiddenBoards': \{[\s\S]{0,400}type: Array,/);
console.log('  ok - All Boards leaves them out; Member Settings restores them');

console.log('\nhiddenBoards: all tests passed');
