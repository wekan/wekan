'use strict';

// Plain-Node unit test (no Meteor) for the All Boards board-tile data helpers.
// Run: node tests/boardTileData.test.cjs
//
// Regression guard for #5174 (screenshots: All Boards tiles show neither the
// per-list card-counter line nor the board-member avatars even though the
// Admin Panel "Hide ... on All Boards" settings say to show them) and #4825
// ("Show card count per list doesn't deactivate" — inconsistent per-tile
// rendering, members never shown). The old reactive tile helpers caused the
// #4214 "icons random dance" and were stubbed to return [], hiding the data
// for everyone. The fix computes the tile data once, server-side, through the
// pure helpers tested here (models/lib/boardTileData.js), consumed via the
// getAllBoardsTileData method and a set-once ReactiveVar on the client.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  showsCardCounterList,
  showsBoardMemberList,
  formatListCount,
  countCardsByListId,
  buildBoardTileData,
} = require('../models/lib/boardTileData');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- per-board opt-in flags: POSITIVE ----------------------------------------
test('board with "Show card count per list" enabled shows the counter line', () => {
  assert.strictEqual(showsCardCounterList({ allowsCardCounterList: true }), true);
});

test('board with "Show Board members avatars" enabled shows the member row', () => {
  assert.strictEqual(showsBoardMemberList({ allowsBoardMemberList: true }), true);
});

// --- per-board opt-in flags: NEGATIVE (#4825 "doesn't deactivate") -----------
test('#4825: board with the checkbox OFF must NOT show the counter line', () => {
  assert.strictEqual(showsCardCounterList({ allowsCardCounterList: false }), false);
  assert.strictEqual(showsBoardMemberList({ allowsBoardMemberList: false }), false);
});

test('#4825: board created before the feature (missing flag) is consistently OFF', () => {
  assert.strictEqual(showsCardCounterList({}), false);
  assert.strictEqual(showsBoardMemberList({}), false);
  // loose truthy values (old inconsistency source) are not honored either
  assert.strictEqual(showsCardCounterList({ allowsCardCounterList: 'true' }), false);
  assert.strictEqual(showsBoardMemberList({ allowsBoardMemberList: 1 }), false);
  assert.strictEqual(showsCardCounterList(null), false);
  assert.strictEqual(showsBoardMemberList(undefined), false);
});

// --- formatListCount ----------------------------------------------------------
test('list entries are formatted "Title: N"', () => {
  assert.strictEqual(formatListCount('To Do', 3), 'To Do: 3');
});

test('lists with no cards (or bogus counts) show ": 0"', () => {
  assert.strictEqual(formatListCount('Empty', undefined), 'Empty: 0');
  assert.strictEqual(formatListCount('Empty', -1), 'Empty: 0');
  assert.strictEqual(formatListCount('', 2), ': 2');
});

// --- countCardsByListId --------------------------------------------------------
test('card docs fold into per-list counts', () => {
  const counts = countCardsByListId([
    { listId: 'l1' },
    { listId: 'l1' },
    { listId: 'l2' },
    { listId: null },
    null,
  ]);
  assert.deepStrictEqual(counts, { l1: 2, l2: 1 });
});

test('no cards means no counts (not a crash)', () => {
  assert.deepStrictEqual(countCardsByListId([]), {});
  assert.deepStrictEqual(countCardsByListId(undefined), {});
});

// --- buildBoardTileData: POSITIVE ---------------------------------------------
test('#5174: enabled board tile carries its per-list counts in board order', () => {
  const boards = [
    {
      _id: 'b1',
      allowsCardCounterList: true,
      allowsBoardMemberList: true,
      members: [
        { userId: 'u1', isActive: true },
        { userId: 'u2' }, // no isActive field -> active
        { userId: 'u3', isActive: false }, // ex-member -> filtered out
        { isActive: true }, // no userId -> filtered out
      ],
    },
  ];
  const lists = [
    // deliberately out of order: sorted by `sort` ascending for the tile
    { _id: 'l2', boardId: 'b1', title: 'In Arbeit', sort: 2 },
    { _id: 'l1', boardId: 'b1', title: 'To Do', sort: 1 },
    { _id: 'l3', boardId: 'b1', title: 'Erledigt', sort: 3 },
  ];
  const tiles = buildBoardTileData(boards, lists, { l1: 1, l2: 1 });
  assert.deepStrictEqual(tiles.b1, {
    showLists: true,
    showMembers: true,
    lists: ['To Do: 1', 'In Arbeit: 1', 'Erledigt: 0'],
    memberIds: ['u1', 'u2'],
  });
});

test('every board on the page gets an entry (consistent rendering)', () => {
  const tiles = buildBoardTileData(
    [
      { _id: 'on', allowsCardCounterList: true, members: [] },
      { _id: 'off', allowsCardCounterList: false, members: [] },
      { _id: 'legacy', members: [] },
    ],
    [{ _id: 'l1', boardId: 'on', title: 'Done', sort: 0 }],
    {},
  );
  assert.deepStrictEqual(Object.keys(tiles).sort(), ['legacy', 'off', 'on']);
  assert.deepStrictEqual(tiles.on.lists, ['Done: 0']);
});

// --- buildBoardTileData: NEGATIVE ----------------------------------------------
test('#4825: disabled board tile carries NO list counts even when lists/cards exist', () => {
  const tiles = buildBoardTileData(
    [{ _id: 'b1', allowsCardCounterList: false, allowsBoardMemberList: false,
       members: [{ userId: 'u1', isActive: true }] }],
    [{ _id: 'l1', boardId: 'b1', title: 'To Do', sort: 0 }],
    { l1: 5 },
  );
  assert.strictEqual(tiles.b1.showLists, false);
  assert.deepStrictEqual(tiles.b1.lists, []);
  assert.strictEqual(tiles.b1.showMembers, false);
  assert.deepStrictEqual(tiles.b1.memberIds, []);
});

test('legacy board (missing flags) tile is empty, same as disabled', () => {
  const tiles = buildBoardTileData(
    [{ _id: 'b1', members: [{ userId: 'u1' }] }],
    [{ _id: 'l1', boardId: 'b1', title: 'To Do', sort: 0 }],
    { l1: 2 },
  );
  assert.deepStrictEqual(tiles.b1, {
    showLists: false,
    showMembers: false,
    lists: [],
    memberIds: [],
  });
});

test('lists of unknown/foreign boards do not leak into other tiles', () => {
  const tiles = buildBoardTileData(
    [{ _id: 'b1', allowsCardCounterList: true, members: [] }],
    [
      { _id: 'l1', boardId: 'b1', title: 'Mine', sort: 0 },
      { _id: 'lx', boardId: 'other', title: 'Foreign', sort: 0 },
      { _id: 'ly', title: 'No board', sort: 0 },
    ],
    { l1: 1, lx: 9 },
  );
  assert.deepStrictEqual(tiles.b1.lists, ['Mine: 1']);
  assert.strictEqual(tiles.other, undefined);
});

test('degenerate inputs do not crash', () => {
  assert.deepStrictEqual(buildBoardTileData(undefined, undefined, undefined), {});
  assert.deepStrictEqual(buildBoardTileData([null, {}], [null], null), {});
});

// --- wiring: the fix is actually hooked up ------------------------------------
const repo = path.join(__dirname, '..');
const clientJs = fs.readFileSync(
  path.join(repo, 'client/components/boards/boardsList.js'), 'utf8');
const clientJade = fs.readFileSync(
  path.join(repo, 'client/components/boards/boardsList.jade'), 'utf8');
const serverJs = fs.readFileSync(
  path.join(repo, 'server/publications/boards.js'), 'utf8');

test('server registers the getAllBoardsTileData method using the pure helpers', () => {
  assert.ok(/async getAllBoardsTileData\(\)/.test(serverJs),
    'getAllBoardsTileData method missing');
  assert.ok(serverJs.includes("from '/models/lib/boardTileData'"),
    'server must build the tile data through models/lib/boardTileData');
  assert.ok(serverJs.includes('buildBoardTileData(boards, lists, cardCounts)'),
    'server must return buildBoardTileData output');
});

test('client fetches the tile data ONCE (no reactive cursor loops, #4214)', () => {
  assert.ok(clientJs.includes("Meteor.call('getAllBoardsTileData'"),
    'boardsList.js must fetch tile data via the method');
  assert.ok(clientJs.includes('boardTileDataVar'),
    'boardsList.js must store tile data in a ReactiveVar');
  // The old reactive helpers must NOT come back inside the tile helpers:
  const helpersTail = clientJs.slice(clientJs.indexOf('boardLists(boardId)'));
  const helperBody = helpersTail.slice(0, helpersTail.indexOf('isStarred'));
  assert.ok(!/ReactiveCache\.getLists|ReactiveCache\.getCards/.test(helperBody),
    'tile helpers must not use reactive getLists/getCards cursors (#4214)');
  // ...and the stubs that hid the data for everyone must be gone:
  assert.ok(!/boardLists\(boardId\)\s*{\s*return \[\];/.test(clientJs),
    'boardLists stub must be replaced with real tile data');
});

test('template gates the tile blocks on the resolved per-board flags', () => {
  assert.ok(clientJade.includes('if showBoardMemberList _id'),
    'member row must be gated by showBoardMemberList');
  assert.ok(clientJade.includes('if showCardCounterList _id'),
    'counter line must be gated by showCardCounterList');
  // the raw board fields are not published to the All Boards page, so the
  // template must not gate on them directly anymore
  assert.ok(!/^\s*if allowsBoardMemberList\s*$/m.test(clientJade)
    && !/^\s*if allowsCardCounterList\s*$/m.test(clientJade),
    'template must not test the unpublished allows* fields directly');
  // the Admin Panel settings stay respected on top
  assert.ok(clientJade.includes('unless currentSetting.hideBoardMemberList'));
  assert.ok(clientJade.includes('unless currentSetting.hideCardCounterList'));
});

console.log(`\nboardTileData: all ${passed} tests passed`);
