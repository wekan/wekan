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

test('the Home row sits under the two board lists, and is always there', () => {
  // NOT the top row: the top row is the one the page opens on, and after login
  // you are already IN the Home board - opening All Boards there means "show me
  // my boards", which the one board you just left does not answer.
  assert.deepStrictEqual(urls.menuSectionOrder(true),
    ['starred', 'remaining', 'home', 'templates', 'archive']);
  assert.deepStrictEqual(urls.menuSectionOrder(false),
    ['remaining', 'starred', 'home', 'templates', 'archive']);
  for (const starred of [true, false]) {
    const order = urls.menuSectionOrder(starred);
    assert.strictEqual(order[0], urls.defaultSection(starred),
      'Starred on top when anything is starred, Remaining when nothing is');
    assert.notStrictEqual(order[0], 'home', 'and never Home');
    // The row is there whether or not a board is at it: the place to drop a
    // board onto has to exist before there is anything in it.
    assert.ok(order.includes('home'));
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
  assert.ok(/menuSectionOrder\(hasStarredBoards\(\)\)/.test(meta),
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
  assert.ok(!/getBoards|ReactiveCache\.getBoard\(/.test(fn),
    'no board query in it');
  // The order of the menu no longer turns on it - Home is not the top row -
  // but the count and the section both do, and both must answer the moment the
  // user document is there rather than when the boards subscription catches up.
});

test('a board is dragged ONTO Home to set it, and the drop replaces', () => {
  const drop = stripComments(listJs.slice(listJs.indexOf("  'drop .js-home-menu'(evt) {"),
    listJs.indexOf("  'drop .js-select-menu'(evt) {")));
  assert.ok(/Meteor\.call\('setDefaultBoard', boardIds\[0\]/.test(drop),
    'one board is set');
  assert.ok(!/toggleDefaultBoard/.test(drop),
    'it does NOT toggle: a drop that sometimes cleared would depend on state '
    + 'the reader cannot see while dragging');
  assert.ok(/if \(boardIds\.length !== 1\)/.test(drop)
    && /alert\(TAPi18n\.__\('select-only-one-board'\)\)/.test(drop),
  'zero or several dragged boards ask for exactly one');
  assert.ok(drop.indexOf('boardIds.length !== 1')
      < drop.indexOf("Meteor.call('setDefaultBoard'"),
  'the invalid multi-drag stops before changing Home');
  assert.ok(drop.indexOf('return;') < drop.indexOf('BoardMultiSelection.reset()'),
    'a rejected multi-selection remains selected so it can be narrowed');

  // The row says it is a target while a board is in the air, like Remaining.
  assert.ok(/'dragover \.js-home-menu'/.test(listJs) && /'dragleave \.js-home-menu'/.test(listJs),
    'the row highlights on dragover and stops on dragleave');
  const hint = listJs.slice(listJs.indexOf("document.querySelectorAll('.js-select-menu')"));
  assert.ok(/!archivedMulti && type === 'home'/.test(hint),
    'and is hinted as a valid target except for an archived multi-selection');
});

test('a board dragged out of Home may land ONLY on the Remove target', () => {
  const src = stripComments(listJs);
  // The mark is the PRESENCE OF A TYPE, not a value, because `dragover` cannot
  // call getData() - the drag data store is protected until the drop, and only
  // the list of types is exposed. A refusal has to happen in dragover, so the
  // fact has to live somewhere dragover can read.
  assert.ok(/const DRAG_FROM_HOME = 'application\/x-board-from-home'/.test(src),
    'the fact lives in the type name');
  const reader = src.slice(src.indexOf('function isDragFromHome(evt)'),
    src.indexOf('function menuItemCountOf('));
  assert.ok(/dataTransfer\.types/.test(reader), 'read from types, not getData');
  assert.ok(!/getData\(/.test(reader), 'which getData cannot answer in dragover');
  assert.ok(/setData\(DRAG_FROM_HOME/.test(src) && /markDragFromHome\(evt, tpl/.test(src),
    'and it is set when the drag starts in Home');

  // Every other target REFUSES, in dragover, by not calling preventDefault -
  // which is what makes the cursor say no while the board is still in the air.
  for (const target of ['dragover .js-select-menu', 'dragover .js-open-archived-board',
    'dragover .workspace-node']) {
    const at = src.indexOf(`  '${target}'(evt`);
    assert.notStrictEqual(at, -1, `${target} exists`);
    const head = src.slice(at, at + 400);
    const refuseAt = head.indexOf('if (isDragFromHome(evt)) return;');
    const allowAt = head.indexOf('evt.preventDefault()');
    assert.notStrictEqual(refuseAt, -1, `${target} refuses a board from Home`);
    assert.ok(allowAt === -1 || refuseAt < allowAt,
      `${target}: refused BEFORE preventDefault, or the drop is allowed anyway`);
  }
  // ...and the drops themselves bail too, for a browser that delivers one.
  for (const target of ['drop .js-select-menu', 'drop .js-open-archived-board',
    'drop .workspace-node']) {
    const at = src.indexOf(`  '${target}'(evt`);
    const head = src.slice(at, at + 600);
    assert.ok(/if \(isDragFromHome\(evt\)\) return;/.test(head),
      `${target} acts on nothing that came from Home`);
  }
  // Nothing takes a board off Home as a SIDE EFFECT of landing somewhere any
  // more - that was the earlier design, and it made every drop a Home drop.
  assert.ok(!/clearHomeIfDraggedFromHome/.test(src),
    'no drop clears Home on the way past');
});

test('the Remove target is the launcher bar: it appears while you drag', () => {
  const src = stripComments(listJs);
  // Android: pick an icon up and a Remove bar appears at the top of the screen;
  // it is not there the rest of the time. An affordance that shows up when the
  // gesture is possible explains itself.
  assert.ok(/const draggingFromHome = new ReactiveVar\(false\)/.test(src),
    'a reactive "a board from Home is in the air"');
  assert.ok(/draggingFromHome\.set\(true\)/.test(src), 'set when the drag starts');
  const dragend = src.slice(src.indexOf("  'dragend .js-board'(evt) {"), src.indexOf("  'dragend .js-board'(evt) {") + 400);
  assert.ok(/draggingFromHome\.set\(false\)/.test(dragend),
    'and cleared when it ends - dropped, cancelled or released over nothing');

  const helper = listJs.slice(listJs.indexOf('  showsHomeRemoveTarget() {'),
    listJs.indexOf('  // The "Add Board" tile'));
  assert.ok(/=== 'home'/.test(helper) && /draggingFromHome\.get\(\)/.test(helper),
    'shown only in Home, and only while dragging');
  assert.ok(/if showsHomeRemoveTarget\n\s+li\.home-remove-target\.js-home-remove/
    .test(listJade), 'the bar is drawn by that helper');
  assert.ok(/i\.fa\.fa-trash/.test(listJade), 'with the trash icon');
  assert.ok(/\{\{_ 'home-board-remove'\}\}/.test(listJade), 'and its name beside it');

  const css = read('client/components/boards/boardsList.css');
  const rest = css.slice(css.indexOf('.home-remove-target {'), css.indexOf('.home-remove-target .fa'));
  const over = css.slice(css.indexOf('.home-remove-target.is-over {'));
  assert.ok(/flex-basis: 100%/.test(rest), 'the whole row, above the tiles');
  assert.ok(!/#c0392b/.test(rest),
    'not red at rest - that would be a standing warning about a board nobody '
    + 'is touching');
  assert.ok(/#c0392b/.test(over.slice(0, over.indexOf('}'))),
    'red under the icon, which is the answer to "what if I let go here"');
});

test('dropping on it takes the board off Home, and asks first', () => {
  const drop = stripComments(listJs.slice(listJs.indexOf("  'drop .js-home-remove'(evt) {"),
    listJs.indexOf("  'drop .js-home-menu'(evt) {")));
  assert.ok(/confirm\(TAPi18n\.__\('home-board-remove-confirm'\)\)/.test(drop),
    'asked before doing - a drop is easy to make by accident');
  const askAt = drop.indexOf("confirm(TAPi18n.__('home-board-remove-confirm'))");
  const doAt = drop.indexOf("Meteor.call('clearDefaultBoard'");
  assert.ok(doAt !== -1 && askAt < doAt, 'and nothing happens before the answer');
  assert.ok(/if \(!confirm/.test(drop), 'a No does nothing at all');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.ok(/not deleted/.test(en['home-board-remove-confirm']),
    'and the question says the board itself is not going anywhere - which is '
    + 'what a reader wants to know when a trash can is under a board they care '
    + 'about');
  assert.ok(/'dragover \.js-home-remove'/.test(listJs)
    && /'dragleave \.js-home-remove'/.test(listJs), 'it highlights under the icon');
});

test('no Add Board tile in Home, and an empty Home says what to drag', () => {
  const helper = listJs.slice(listJs.indexOf('  showsAddBoardTile() {'),
    listJs.indexOf('  // The count for a row.'));
  assert.ok(/sel !== 'home'/.test(helper),
    'a board created here would not be the board that opens after login');
  assert.ok(/if isSelectedMenu 'home'\n\s+unless boards\.length\n\s+li\.board-list-item-empty/
    .test(listJade), 'an empty Home draws its hint instead of a blank pane');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.strictEqual(en['home-board-empty'],
    'Drag only one board here to open it after login',
    'the hint states that Home accepts exactly one board');
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
    'clearDefaultBoard', 'application/x-board-from-home', 'launcher',
    'preventDefault']) {
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
