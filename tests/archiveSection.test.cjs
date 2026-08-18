// All Boards / Archive is a section of that page, drawn with the same board
// icons every other section uses.
//
// It had a table of its own, which meant the one place you go to bring a board
// back was the one place multi-selection, dragging and the tile layout did not
// work. docs/Features/Page/Archive.md
//
// Run: node tests/archiveSection.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

const jade = read('client/components/boards/boardsList.jade');
const js = read('client/components/boards/boardsList.js');

console.log('archiveSection:');

test('the Archive is drawn with board icons, like every other section', () => {
  const grid = jade.slice(jade.indexOf('.boards-right-grid'));
  // No template of its own in the grid any more.
  assert.ok(!/\+archivedBoards/.test(grid),
    'the archive table is not rendered in the boards grid');
  // The section falls through to the same `each boards` the others use.
  assert.ok(/each boards/.test(grid), 'the tiles are the shared ones');

  // ...and its query asks for ARCHIVED boards, which is the opposite of every
  // other section's.
  const at = js.indexOf('function boardsForView(tpl)');
  assert.notStrictEqual(at, -1);
  const body = js.slice(at, js.indexOf('\n}', at));
  assert.ok(/const showsArchive = tpl\.selectedMenu\.get\(\) === 'archive'/.test(body),
    'the archive section is recognised');
  assert.ok(/\{ archived: showsArchive \}/.test(body),
    'and the query follows it rather than being hard-coded to false');

  // The menu filter must not then filter them away. A workspace assignment
  // survives archiving, so the workspace branch would hide most of an archive.
  assert.ok(/sel === 'archive'/.test(body),
    'the archive has its own branch in the menu filter');

  // No "Add Board" tile: a board cannot be created already archived. One
  // helper rather than a condition in the markup, because Home excludes it too
  // and nesting a second `unless` moved the tile's own children out from under
  // it. docs/Features/Board/Home.md
  assert.ok(/if showsAddBoardTile\n\s+li\.js-add-board/.test(jade),
    'the tile is drawn only where a board can be created');
  const helper = js.slice(js.indexOf('  showsAddBoardTile() {'),
    js.indexOf('  // The count for a row.'));
  assert.ok(/sel !== 'archive'/.test(helper), 'and no Add Board tile in the Archive');
});

test('and the tiles are subscribed to, after the vars they read exist', () => {
  const at = js.indexOf("this.subscribe('archivedBoards'");
  assert.notStrictEqual(at, -1, 'the page subscribes to the archived boards');
  // The page's own query is `archived: false`, so nothing else brings them in.
  const menuAt = js.indexOf('this.selectedMenu = allBoardsMenuVar');
  const searchAt = js.indexOf('this.boardSearchVar =');
  assert.ok(menuAt !== -1 && searchAt !== -1, 'both vars are assigned');
  assert.ok(at > menuAt && at > searchAt,
    'the autorun comes AFTER them - it runs once immediately, so placed above '
    + 'them it read .get() off undefined and threw during onCreated');
  // Only while that section is open: an archive can be long.
  const auto = js.slice(js.lastIndexOf('this.autorun', at), at);
  assert.ok(/!== 'archive'\) return;/.test(auto),
    'and only while the Archive is the section being shown');
});

test('and the publication sends what a tile draws', () => {
  // Seven fields to a template that reads twelve renders grey, nameless tiles.
  const pub = read('server/publications/boards.js');
  const at = pub.indexOf("Meteor.publish('archivedBoards'");
  assert.notStrictEqual(at, -1);
  const body = pub.slice(at, pub.indexOf('\n});', at));
  for (const field of ['title', 'slug', 'archivedAt', 'color', 'type',
    'description', 'permission', 'members', 'stars']) {
    assert.ok(new RegExp(`\\b${field}: 1`).test(body),
      `the publication must send ${field} - a tile reads it`);
  }
});

test('and each tile says when it was archived', () => {
  assert.ok(/if isSelectedMenu 'archive'\n\s+p\.board-list-item-archived-at/.test(jade),
    'the date is drawn, and only in the Archive');
  assert.ok(/\{\{_ 'archived-at'\}\}/.test(jade), 'named by an existing key');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.strictEqual(en['archived-at'], 'archived at');

  const at = js.indexOf('archivedAtText() {');
  assert.notStrictEqual(at, -1, 'the helper exists');
  const body = js.slice(at, js.indexOf('\n  },', at));
  assert.ok(/formatDateByUserPreference\(this\.archivedAt\)/.test(body),
    "in the reader's own date format");
  // `archivedAt` was added after boards existed, so an older archived board has
  // none - and a missing date must not render as "Invalid Date".
  assert.ok(/if \(!this\.archivedAt\) return/.test(body),
    'a board archived before the field existed shows a dash, not Invalid Date');
  assert.ok(/from '\/imports\/lib\/dateUtils'/.test(js),
    'and the formatter is imported, or the helper throws at render');
});

test('dropping a board on Remaining brings it back', () => {
  const at = js.indexOf("'drop .js-select-menu'");
  assert.notStrictEqual(at, -1, 'Remaining accepts a drop');
  const body = js.slice(at, js.indexOf('\n  },', at));
  assert.ok(/board && board\.archived/.test(body),
    'an archived board is recognised');
  assert.ok(/Meteor\.call\('restoreBoard', boardId/.test(body),
    'and restored');
  // ...and out of any workspace too, which is the other half of what Remaining
  // means.
  assert.ok(/unassignBoardFromWorkspace/.test(body), 'and unassigned');
  // A whole multi-selection at once - that is the point of dragging rather
  // than opening each board's own menu.
  assert.ok(/boardIds\.forEach/.test(body), 'for every board of a selection');
  assert.ok(/BoardMultiSelection\.reset\(\)/.test(body),
    'and the selection is cleared, since those boards have left this list');
  assert.ok(/refreshArchivedBoardsCount/.test(body),
    'and the count beside the menu row is asked again');
});

test('and restoring is gated exactly as archiving is', () => {
  const server = read('server/models/boards.js');
  const restoreAt = server.indexOf('async restoreBoard(boardId) {');
  assert.notStrictEqual(restoreAt, -1, 'the method exists');
  const restore = server.slice(restoreAt, server.indexOf('\n  },', restoreAt));
  const archiveAt = server.indexOf('async archiveBoard(boardId) {');
  const archive = server.slice(archiveAt, server.indexOf('\n  },', archiveAt));
  // Restoring puts a board back in front of everyone who can see it, so it is
  // a board-admin action exactly as archiving is. If the two ever disagree,
  // one of them is the wrong way round.
  for (const [what, pattern] of [
    ['checks its argument', /check\(boardId, String\)/],
    ['refuses an unknown board', /error-board-doesNotExist/],
    ['requires board admin or a global admin', /!board\.hasAdmin\(userId\) && !\(user && user\.isAdmin\)/],
    ['and says so', /error-board-notAdmin/],
  ]) {
    assert.ok(pattern.test(restore), `restoreBoard ${what}`);
    assert.ok(pattern.test(archive), `archiveBoard ${what} - the two must agree`);
  }
  assert.ok(/await board\.restore\(\)/.test(restore), 'and it restores');
});

test('and a board in the Archive can be opened', () => {
  // Its tile is the shared one, so it already had a link. What it did not have
  // was the board: the `board` publication excluded an archived one unless it
  // was a template, so following that link answered "board not found".
  const grid = jade.slice(jade.indexOf('.boards-right-grid'));
  assert.ok(/a\.js-open-board\(href="\{\{pathFor 'board' id=_id slug=slug\}\}"/.test(grid),
    'the tile links to the board');

  const pub = read('server/publications/boards.js');
  const at = pub.indexOf("publishComposite('board'");
  assert.notStrictEqual(at, -1);
  const find = pub.slice(at, pub.indexOf('children: [', at));
  assert.ok(!/\$nor: \[\{ archived: true/.test(find),
    'an archived board is not withheld from a caller who asked for it by id');

  // What decides whether it may be sent is UNCHANGED: public, or a member.
  // Archived is not a permission, and this is the whole of the access control.
  assert.ok(/\$or,/.test(find), 'the membership clause still applies');
  assert.ok(/const \$or = /.test(pub) || /\$or\s*=/.test(pub),
    'and it is really built, not an empty name');

  // The CONTENTS flag is untouched, so an archived board opens showing its live
  // lists rather than its archived ones.
  assert.ok(/archived: isArchived/.test(pub),
    'lists, swimlanes and cards still follow the isArchived argument');
  const client = read('client/components/boards/boardBody.js');
  assert.ok(/Meteor\.subscribe\(\s*'board',\s*currentBoardId,\s*false,\s*subscriptionGeneration,\s*\)/s.test(client),
    'and the board page still asks for the live ones');
});

for (const [name, fn] of tests) {
  try { fn(); passed++; console.log('  ok -', name); }
  catch (err) { console.error(`  FAIL - ${name}\n    ${err.message}`); process.exitCode = 1; }
}
console.log(`\narchiveSection: ${passed} tests passed`);
