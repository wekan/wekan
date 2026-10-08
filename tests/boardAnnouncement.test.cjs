'use strict';
// #1566: "announcements for boards ... the same way we have announcement for
// the site but one different for each board." A board admin writes one in the
// board menu; every member sees it on the board until they dismiss it, and
// again when it is edited.
//
// Run: node tests/boardAnnouncement.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { showBoardAnnouncement, cleanBoardAnnouncement, boardAnnouncementVersion, MAX_BOARD_ANNOUNCEMENT } = require('../models/lib/boardAnnouncement');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('boardAnnouncement:');

const at = new Date('2026-10-08T10:00:00Z');
const board = { _id: 'B', announcement: { enabled: true, body: 'Release freeze on Friday', updatedAt: at } };

test('shown until dismissed, and again after an edit', () => {
  assert.equal(showBoardAnnouncement(board, {}), true);
  assert.equal(showBoardAnnouncement(board, { B: at.toISOString() }), false);
  assert.equal(showBoardAnnouncement(board, { A: at.toISOString() }), true, 'dismissed on another board only');
  const edited = { ...board, announcement: { ...board.announcement, updatedAt: new Date('2026-10-09T10:00:00Z') } };
  assert.equal(showBoardAnnouncement(edited, { B: at.toISOString() }), true);
});

test('negative: disabled, empty or missing shows nothing', () => {
  assert.equal(showBoardAnnouncement({ _id: 'B', announcement: { ...board.announcement, enabled: false } }, {}), false);
  assert.equal(showBoardAnnouncement({ _id: 'B', announcement: { enabled: true, body: '   ', updatedAt: at } }, {}), false);
  assert.equal(showBoardAnnouncement({ _id: 'B' }, {}), false);
  assert.equal(showBoardAnnouncement(null, {}), false);
});

test('saving trims, bounds and dates it; empty text cannot be enabled', () => {
  assert.deepEqual(cleanBoardAnnouncement(true, '  Hello  ', at), { enabled: true, body: 'Hello', updatedAt: at });
  assert.equal(cleanBoardAnnouncement(true, '   ', at).enabled, false);
  assert.throws(() => cleanBoardAnnouncement(true, 'x'.repeat(MAX_BOARD_ANNOUNCEMENT + 1)), /longer than/);
  assert.throws(() => cleanBoardAnnouncement(true, { $gt: '' }), /must be text/);
  assert.equal(boardAnnouncementVersion(board), at.toISOString());
});

test('admin-only to write, any visible board member to dismiss, and shown as plain text', () => {
  const sidebar = read('client/components/sidebar/sidebar.jade');
  const menu = sidebar.slice(sidebar.indexOf('template(name="boardMenuPopup")'));
  assert.ok(menu.indexOf('if currentUser.isBoardAdmin') < menu.indexOf('a.js-open-board-announcement'));
  const users = read('models/users.js');
  const dismiss = users.slice(users.indexOf('async dismissBoardAnnouncement(boardId) {'));
  assert.match(dismiss, /assertSafeMapKey\(boardId\);/);
  assert.match(dismiss, /board\.isVisibleBy\(/, 'only a board the user can see');
  assert.match(dismiss, /const version = boardAnnouncementVersion\(board\);/, 'the server reads the version');
  const jade = read('client/components/boards/boardAnnouncement.jade');
  assert.match(jade, /\| #\{boardAnnouncementBody\}/);
  assert.doesNotMatch(jade, /!=|\{\{\{/, 'never unescaped');
  assert.match(read('models/boards.js'), /'announcement\.body': \{ type: String, optional: true, max: 2000 \}/);
});

console.log(`\nboardAnnouncement: ${passed} tests passed`);
