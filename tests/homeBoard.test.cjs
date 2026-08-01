'use strict';

// Home: the board that opens after login, as a section of All Boards.
//
// The board has always been storable (`profile.defaultBoardId`, #2220) but
// there was nowhere that SAID which board it was - the setting was write-only,
// and the only way to find out what you had chosen was to log out. Home is now
// a row of the left menu with a section behind it.
//
// Home is a MARK on a board rather than a place boards are kept, exactly like a
// star: the board stays where it lives, and taking it off Home leaves it there.
// The one difference is how many - any number of boards can be starred, and one
// or none can be Home, because logging in opens one board.
//
// Run: node tests/homeBoard.test.cjs
// docs/Features/Board/Home.md

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
// Comments stripped: several of these guards check that a file does NOT do
// something, and the comment explaining why it does not says the thing.
const stripComments = src => src.replace(/\/\/[^\n]*/g, '');

const tests = [];
let passed = 0;
const test = (name, fn) => tests.push([name, fn]);

const urls = require('../models/lib/allBoardsUrls');
const listJs = read('client/components/boards/boardsList.js');
const listJade = read('client/components/boards/boardsList.jade');
const serverUsers = read('server/models/users.js');

test('Home is a section, with an address like the others', () => {
  assert.strictEqual(urls.SECTION_HOME, 'home');
  assert.ok(urls.ALL_BOARDS_SECTIONS.includes('home'));
  assert.strictEqual(urls.allBoardsPath('home', []), '/allboards/home');
  assert.strictEqual(urls.normalizeSection('home'), 'home',
    'a typed /allboards/home resolves to itself rather than falling back');

  // The header's path and the highlighted row must name it with the SAME key,
  // or a reader seeing two words for one place has to work out whether they
  // are one place.
  assert.strictEqual(urls.sectionTitleKey('home'), 'home');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.strictEqual(en.home, 'Home', 'an existing key, not a new one');
});

test('the Home row is first when there is a board at it', () => {
  // It is the board this user starts in, so the row that names it belongs
  // where they look first - above whichever of Starred / Remaining is on top.
  assert.deepStrictEqual(urls.menuSectionOrder(true, true),
    ['home', 'starred', 'remaining', 'templates', 'archive']);
  assert.deepStrictEqual(urls.menuSectionOrder(false, true),
    ['home', 'remaining', 'starred', 'templates', 'archive']);

  // ...and the row is STILL THERE with no Home board set, just not on top: the
  // place to drop a board onto has to exist before there is anything in it.
  for (const starred of [true, false]) {
    const order = urls.menuSectionOrder(starred, false);
    assert.ok(order.includes('home'), 'the row exists with no Home board');
    assert.notStrictEqual(order[0], 'home', 'but does not take the top');
    assert.deepStrictEqual([...order].sort(),
      [...urls.menuSectionOrder(starred, true)].sort(),
      'the same rows either way - only the order changes');
  }
});

test('but the page does not OPEN on Home', () => {
  // After login you are already in the Home board. Clicking All Boards from
  // there means "show me my boards", and answering with the one board you just
  // left is not showing you anything.
  for (const starred of [true, false]) {
    assert.notStrictEqual(urls.defaultSection(starred), 'home');
  }
  assert.strictEqual(urls.defaultSection(true), 'starred');
  assert.strictEqual(urls.defaultSection(false), 'remaining');
});

test('the row is drawn by the menu loop, with its own icon and drop class', () => {
  const meta = listJs.slice(listJs.indexOf('  menuSections() {'),
    listJs.indexOf('  showsAddBoardTile()'));
  assert.ok(/home: \{ icon: 'fa-home', labelKey: 'home'/.test(meta),
    'a home icon and the Home label');
  assert.ok(/extraClass: 'js-home-menu'/.test(meta),
    'and a class of its own, because the row is also a drop target');
  assert.ok(/menuSectionOrder\(hasStarredBoards\(\), hasHomeBoard\(\)\)/.test(meta),
    'ordered by the pure rule, not by a second copy of it here');
});

test('the count is 0 or 1, and 1 only if the board is still there', () => {
  const count = listJs.slice(listJs.indexOf("  } else if (type === 'home') {"),
    listJs.indexOf('Template.boardList.helpers'));
  assert.ok(/homeBoardId\(\)/.test(count), 'it counts the Home board');
  assert.ok(/allBoards\.some\(\(b\) => b\._id === id\)/.test(count),
    'and only if that board is one of the boards this user has');
  assert.ok(/\? 1 : 0/.test(count), 'so the row shows 1 or 0, never more');
});

test('the section shows that one board, wherever else it also lives', () => {
  const filter = listJs.slice(listJs.indexOf("    } else if (sel === 'home') {"),
    listJs.indexOf("    } else if (sel === 'archive') {"));
  assert.ok(/list\.filter\(\(b\) => b\._id === id\)/.test(filter),
    'exactly the Home board');
  assert.ok(/id \? .* : \[\]/.test(filter),
    'and nothing at all when there is no Home board - not every board');
});

test('Home is read from the user document, not from the boards', () => {
  const fn = stripComments(listJs.slice(listJs.indexOf('function homeBoardId()'),
    listJs.indexOf('function menuItemCountOf(')));
  assert.ok(/profile\.defaultBoardId/.test(fn),
    'the field the Home board has always been stored in');
  // The order of the menu turns on it, and an answer that depends on the
  // boards subscription would reorder the menu under the reader mid-load -
  // the same reason hasStarredBoards() reads the profile.
  assert.ok(/function hasHomeBoard\(\)/.test(fn), 'and a boolean for the order');
  assert.ok(!/getBoards|ReactiveCache\.getBoard\(/.test(fn),
    'no board query in it');
});

test('a board is dragged ONTO Home to set it, and the drop replaces', () => {
  const drop = stripComments(listJs.slice(listJs.indexOf("  'drop .js-home-menu'(evt) {"),
    listJs.indexOf("  'drop .js-select-menu'(evt) {")));
  assert.ok(/Meteor\.call\('setDefaultBoard', boardIds\[0\]/.test(drop),
    'it sets, unconditionally');
  assert.ok(!/toggleDefaultBoard/.test(drop),
    'it does NOT toggle: a drop that sometimes cleared would depend on state '
    + 'the reader cannot see while dragging');
  assert.ok(/BoardMultiSelection\.reset\(\)/.test(drop),
    'and a multi-selection is cleared, so it cannot look as though all of them '
    + 'went somewhere');

  // The row says it is a target while a board is in the air, like Remaining.
  assert.ok(/'dragover \.js-home-menu'/.test(listJs) && /'dragleave \.js-home-menu'/.test(listJs),
    'the row highlights on dragover and stops on dragleave');
  const hint = listJs.slice(listJs.indexOf("document.querySelectorAll('.js-select-menu')"));
  assert.ok(/type === 'remaining' \|\| type === 'home'/.test(hint),
    'and is hinted as a valid drop target while a board is being dragged');
});

test('and dragged OUT of Home to clear it - from Home, not from anywhere', () => {
  assert.ok(/application\/x-board-from-section/.test(stripComments(listJs)),
    'the drag carries where it started');
  // `draggedFromHome` reads it...
  const reader = stripComments(listJs.slice(listJs.indexOf('function draggedFromHome(evt)'),
    listJs.indexOf('function clearHomeIfDraggedFromHome(')));
  assert.ok(/=== 'home'/.test(reader), 'and a reader that answers whether it says Home');
  // ...and the clearer ASKS IT FIRST. Sliced to the clearer's own body, because
  // the reader's `=== 'home'` sitting above it would answer for it: dropping
  // the question from the caller left every drop clearing Home.
  const clearer = stripComments(listJs.slice(
    listJs.indexOf('function clearHomeIfDraggedFromHome(evt, boardIds) {'),
    listJs.indexOf('function menuItemCountOf(')));
  assert.ok(/if \(!draggedFromHome\(evt\)\) return;/.test(clearer),
    'a drag that did NOT start in Home clears nothing');
  const askAt = clearer.indexOf('draggedFromHome(evt)');
  const callAt = clearer.indexOf("Meteor.call('clearDefaultBoard'");
  assert.ok(callAt !== -1, 'and one that did clears it');
  assert.ok(askAt !== -1 && askAt < callAt, 'asked before anything is cleared');

  // Set at dragstart, or every drop would think it came from nowhere.
  assert.ok(/setDragSourceSection\(evt, tpl && tpl\.selectedMenu && tpl\.selectedMenu\.get\(\)\)/
    .test(listJs), 'recorded when the drag starts');

  // Every OTHER place a board can be dropped takes it off Home. "Any other
  // location" is the whole point: the mark comes off wherever it lands.
  for (const target of ['drop .js-select-menu', 'drop .js-open-archived-board',
    'drop .workspace-node']) {
    const at = listJs.indexOf(`  '${target}'`);
    assert.notStrictEqual(at, -1, `${target} exists`);
    const body = listJs.slice(at, at + 3000);
    assert.ok(/clearHomeIfDraggedFromHome\(/.test(body),
      `${target} takes the board off Home`);
  }
  // ...except the drop on Home itself, which is the one that does not.
  const selectMenu = listJs.slice(listJs.indexOf("  'drop .js-select-menu'(evt) {"));
  assert.ok(/menuType === 'home'\) return;/.test(selectMenu),
    'a drop on Home is handled by its own handler and clears nothing');
});

test('no Add Board tile in Home, and an empty Home says what to drag', () => {
  const helper = listJs.slice(listJs.indexOf('  showsAddBoardTile() {'),
    listJs.indexOf('  // The count for a row.'));
  assert.ok(/sel !== 'home'/.test(helper),
    'a board created here would not be the board that opens after login');
  assert.ok(/if isSelectedMenu 'home'\n\s+unless boards\.length\n\s+li\.board-list-item-empty/
    .test(listJade), 'an empty Home draws its hint instead of a blank pane');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.ok(en['home-board-empty'], 'the hint is translated');
  assert.ok(/\{\{_ 'home-board-empty'\}\}/.test(listJade), 'and named by its key');
  const css = read('client/components/boards/boardsList.css');
  assert.ok(/\.board-list-item-empty \{/.test(css), 'and styled like a tile');
});

test('the server refuses a Home board the user cannot open', () => {
  const setter = serverUsers.slice(serverUsers.indexOf('  async setDefaultBoard(boardId) {'),
    serverUsers.indexOf('  async clearDefaultBoard(boardId) {'));
  assert.ok(/check\(boardId, String\)/.test(setter), 'checked before anything else');
  assert.ok(/'members\.userId': this\.userId/.test(setter),
    'a member of the board...');
  assert.ok(/archived: false/.test(setter), '...and not an archived board');
  assert.ok(/throw new Meteor\.Error\('board-not-found'/.test(setter),
    'or it is refused - otherwise every login lands on a board that will not draw');

  // check() FIRST: a method that returns before checking its arguments raises
  // "Did not check() all arguments" on the audit-argument-checks package.
  const checkAt = setter.indexOf('check(boardId, String)');
  const returnAt = setter.indexOf('return');
  assert.ok(checkAt !== -1 && (returnAt === -1 || checkAt < returnAt),
    'nothing returns before the check');
});

test('and clears only the board that IS Home', () => {
  const clearer = serverUsers.slice(serverUsers.indexOf('  async clearDefaultBoard(boardId) {'));
  const body = clearer.slice(0, clearer.indexOf('\n  },'));
  assert.ok(/check\(boardId, String\)/.test(body), 'checked');
  assert.ok(/'profile\.defaultBoardId': boardId/.test(body),
    'the selector matches on the board being cleared, so dragging some OTHER '
    + 'board out of a list cannot clear somebody\'s Home board');
  assert.ok(/\$unset: \{ 'profile\.defaultBoardId': '' \}/.test(body), 'and unsets it');
});

test('Multi-Selection still toggles, and both write the same one field', () => {
  // Two ways to set a Home board that disagreed about where it is stored would
  // be two Home boards. There is one field.
  const sidebar = read('client/components/boards/allBoardsSidebar.js');
  assert.ok(/Meteor\.call\('toggleDefaultBoard'/.test(sidebar),
    'the sidebar row toggles - there you clicked a board you can see');
  for (const src of [listJs, sidebar, serverUsers, read('models/users.js'),
    read('config/router.js')]) {
    if (!/defaultBoardId|DefaultBoard/.test(src)) continue;
    assert.ok(!/homeBoardId'|profile\.homeBoard/.test(src),
      'nothing keeps a second copy of which board is Home');
  }
});

test('the design doc is there and says what the drags do', () => {
  const doc = read('docs/Features/Board/Home.md');
  for (const phrase of ['/allboards/home', 'replaces', 'star', 'setDefaultBoard',
    'clearDefaultBoard', 'application/x-board-from-section']) {
    assert.ok(doc.includes(phrase), `the doc must explain ${phrase}`);
  }
  assert.ok(/docs\/Features\/Board\/Home\.md/.test(listJs),
    'and the code points at it');
});

for (const [name, fn] of tests) {
  try { fn(); passed++; console.log('  ok -', name); }
  catch (err) { console.error(`  FAIL - ${name}\n    ${err.message}`); process.exitCode = 1; }
}
console.log(`\nhomeBoard: ${passed} tests passed`);
