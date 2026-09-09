'use strict';

// #6680 "A way to lock your board settings": the maintainer's chosen shape is
// not a single whole-board edit/live mode, but three independent board
// settings: lock/unlock list-width drag-resize, lock/unlock swimlane-height
// drag-resize, and a board-wide "same width for all lists" (the existing
// per-user Set-Width popup mode, now also settable for the whole board by an
// admin).
//
// These three started as header icons, then moved to Board Settings /
// Swimlane and Board Settings / List (a follow-up to #6680) - together with
// the rest of a board's settings, reached from the board's cog menu, rather
// than living as icons in the header. tests/boardSettingsSwimlaneListCard.test.cjs
// pins where they live now; this file keeps pinning the parts that did not
// move.
//
// This is a static wiring test (no Meteor runtime here), pinning:
//   - the three board schema fields and their getter/setter methods exist;
//   - the drag-resize code actually checks the lock before starting a drag;
//   - the board-wide same-width value is writable by any board member with
//     write access (not only admins), the same shape already used for
//     drag-reordering boards (canUpdateBoardSort).
//
// Run: node tests/listSwimlaneResizeLock.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('listSwimlaneResizeLock:');

const boardsModel = read('models/boards.js');
const listJs = read('client/components/lists/list.js');
const swimlanesJs = read('client/components/swimlanes/swimlanes.js');
const permissions = read('server/permissions/boards.js');
const serverUtils = read('server/lib/utils.js');

test('the board schema has the three new fields', () => {
  for (const field of ['listWidthResizeLocked', 'swimlaneHeightResizeLocked',
    'sameWidthForAllLists', 'sameWidthForAllListsValue']) {
    assert.ok(boardsModel.includes(`${field}:`), `models/boards.js defines ${field}`);
  }
});

test('each lock field has a getter and a setter on Boards', () => {
  for (const [get, set] of [
    ['getListWidthResizeLocked', 'setListWidthResizeLocked'],
    ['getSwimlaneHeightResizeLocked', 'setSwimlaneHeightResizeLocked'],
    ['getSameWidthForAllLists', 'setSameWidthForAllLists'],
    ['getSameWidthForAllListsValue', 'setSameWidthForAllListsValue'],
  ]) {
    assert.ok(boardsModel.includes(`${get}()`), `Boards has ${get}()`);
    assert.ok(boardsModel.includes(`async ${set}(`), `Boards has ${set}()`);
  }
});

test('the list resize-handle drag start refuses when the board is locked', () => {
  const at = listJs.indexOf('function canResizeList(list)');
  assert.ok(at !== -1, 'canResizeList exists');
  const body = listJs.slice(at, listJs.indexOf('\n}', at));
  assert.ok(/getListWidthResizeLocked\(\)\)\s*return false/.test(body),
    'canResizeList returns false when the board lock is on, before any other rule');
});

test('the swimlane resize-handle drag start refuses when the board is locked', () => {
  const at = swimlanesJs.indexOf('const startResize = (e) => {');
  assert.ok(at !== -1, 'startResize exists');
  const body = swimlanesJs.slice(at, swimlanesJs.indexOf('isResizing = true', at));
  assert.ok(body.includes('getSwimlaneHeightResizeLocked()'),
    'startResize checks the board lock before setting isResizing');
});

test('the swimlane resize-handle is hidden while locked, like the list one', () => {
  // Refusing to start a drag is not enough on its own: the blue drag-height
  // line still showed on hover, which read as broken rather than locked.
  // Hide the handle itself, the same way list.js hides .js-list-resize-handle.
  const at = swimlanesJs.indexOf('function initializeSwimlaneResize(');
  assert.ok(at !== -1, 'initializeSwimlaneResize exists');
  const body = swimlanesJs.slice(at, swimlanesJs.indexOf('const startResize = (e) => {', at));
  assert.ok(/getSwimlaneHeightResizeLocked\(\)\)\s*\{\s*\$resizeHandle\.hide\(\);/.test(body),
    'the handle is hidden when the board lock is on');
  assert.ok(/\$resizeHandle\.show\(\);/.test(body),
    'and shown again when it is not');
  assert.ok(/tpl\.autorun\(/.test(body),
    'wrapped in an autorun, so toggling the lock updates it live');
});

test('board-wide same-width mode overrides personal fixed-width, and any board member with write access may drag it', () => {
  assert.ok(listJs.includes('isBoardWideFixedListWidth'), 'a board-wide check exists');
  const effAt = listJs.indexOf('function effectiveListWidth(list)');
  const effBody = listJs.slice(effAt, listJs.indexOf('\nfunction ', effAt + 1));
  assert.ok(/boardWideFixed\s*\|\|\s*isFixedListWidth/.test(effBody),
    'board-wide fixed width is checked before the personal one');
  const saveAt = listJs.indexOf('function saveListWidth(list, width)');
  const saveBody = listJs.slice(saveAt, listJs.indexOf('\nfunction ', saveAt + 1));
  assert.ok(/isBoardWideFixedListWidth\(boardId\)/.test(saveBody),
    'saving a board-wide-fixed list persists to the board, not localStorage/profile');
});

test('the board-wide same-width VALUE can be updated by any member with write access (sole-field rule, like board sort)', () => {
  assert.ok(serverUtils.includes('export function canUpdateBoardSameWidthValue'),
    'server/lib/utils.js exports the helper');
  const at = serverUtils.indexOf('export function canUpdateBoardSameWidthValue');
  const body = serverUtils.slice(at, serverUtils.indexOf('\n}', at));
  // SortBleed-shaped guard: exactly one field, and it must be this one.
  assert.ok(/fields\.length === 1/.test(body) && /fields\[0\] === 'sameWidthForAllListsValue'/.test(body),
    'the rule approves a modifier ONLY when sameWidthForAllListsValue is the sole field');
  assert.ok(permissions.includes('canUpdateBoardSameWidthValue'),
    'server/permissions/boards.js wires the helper into a Boards.allow rule');
});

test('turning sameWidthForAllLists itself on/off stays admin-only (negative)', () => {
  // Only ONE allow rule may approve a modifier that touches the boolean
  // toggle field itself: the default admin-only rule. There must be no
  // separate allow rule naming 'sameWidthForAllLists' (without Value) the
  // way there is for the *Value field, or a non-admin could flip the mode.
  assert.ok(!/fields\[0\] === 'sameWidthForAllLists'[^V]/.test(serverUtils),
    'no allow rule targets the boolean field on its own');
});

console.log(`\nlistSwimlaneResizeLock: ${passed} tests passed`);
