'use strict';

// Board Settings / Board View (docs/Features/Board/Board-View-Settings.md):
// per board, which Board View menu entries a public / private board offers
// and which one it opens in.
//
// Pins: the menu entry sits in Board Settings directly above Swimlane; the
// popup has the five columns in order and hides the two public ones when
// Admin Panel hides public boards; every view of the Board View menu has a
// row, in the menu's order, with the menu's own label key; the three schema
// fields and the two setters exist; the pure module's radio semantics
// (one default per side, a default is always shown, hiding the default is
// refused); the view menu filters by the board and Utils.boardView() falls
// back to the board's default so nobody is stuck on a hidden view; and the
// four new column headers are translated in every locale.
//
// Run: node tests/boardViewSettings.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('boardViewSettings:');

const bvs = require('../models/lib/boardViewSettings.js');
const sidebarJade = read('client/components/sidebar/sidebar.jade');
const sidebarJs = read('client/components/sidebar/sidebar.js');
const boardHeaderJade = read('client/components/boards/boardHeader.jade');
const boardHeaderJs = read('client/components/boards/boardHeader.js');
const utilsJs = read('client/lib/utils.js');
const boardsJs = read('models/boards.js');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));

const COLUMN_KEYS = [
  'default-on-public-board',
  'show-on-public-board',
  'default-on-private-board',
  'show-on-private-board',
  'description',
];

// ---------------------------------------------------------------- the menu

test('Board Settings lists "Board View" directly above "Swimlane", board-admin only', () => {
  const at = sidebarJade.indexOf('a.js-open-board-view-settings');
  const swimlane = sidebarJade.indexOf('a.js-open-board-swimlane-settings');
  assert.ok(at !== -1, 'the Board View entry exists');
  assert.ok(at < swimlane, 'Board View comes before Swimlane');
  const between = sidebarJade.slice(at, swimlane);
  assert.ok(!/a\.js-open-board-/.test(between.slice(1)), 'nothing else sits between Board View and Swimlane');
  const entry = sidebarJade.slice(at, at + 120);
  assert.ok(entry.includes("{{_ 'board-view'}}"), 'it is labelled with the existing board-view key');
  const admin = sidebarJade.lastIndexOf('if currentUser.isBoardAdmin', at);
  assert.ok(admin !== -1 && at - admin < 500, 'it is inside the isBoardAdmin block');
  assert.ok(/'click \.js-open-board-view-settings': Popup\.open\('boardViewSettings', \{ titleKey: 'board-view' \}\)/.test(sidebarJs),
    'the click opens boardViewSettings titled with the existing board-view key');
  assert.strictEqual(en['board-view'], 'Board View');
});

// --------------------------------------------------------------- the popup

const popupAt = sidebarJade.indexOf('template(name="boardViewSettingsPopup")');
const popup = sidebarJade.slice(popupAt, sidebarJade.indexOf('\ntemplate(', popupAt + 1));

test('the popup exists and its header row has the five columns in order', () => {
  assert.ok(popupAt !== -1, 'boardViewSettingsPopup template exists');
  const header = popup.slice(0, popup.indexOf('each boardViewRows'));
  let last = -1;
  COLUMN_KEYS.forEach(key => {
    const at = header.indexOf(`h4 {{_ '${key}'}}`);
    assert.ok(at !== -1, `header column ${key}`);
    assert.ok(at > last, `${key} is in order`);
    last = at;
  });
  assert.ok(/form\.board-view-settings/.test(popup), 'same table pattern as Card Settings (a form of rows)');
});

test('the two public columns are not rendered when Admin Panel hides public boards', () => {
  // Both the header cells and the row cells sit under `unless
  // publicBoardsHidden`, and the helper reads the one setting Admin Panel /
  // Settings / Visibility / "Public boards" writes.
  const header = popup.slice(0, popup.indexOf('each boardViewRows'));
  const guardAt = header.indexOf('unless publicBoardsHidden');
  assert.ok(guardAt !== -1, 'header public columns are guarded');
  assert.ok(header.indexOf("'default-on-public-board'") > guardAt && header.indexOf("'show-on-public-board'") > guardAt);
  assert.ok(header.indexOf("'default-on-private-board'") > header.indexOf("'show-on-public-board'"));
  const rows = popup.slice(popup.indexOf('each boardViewRows'));
  const rowGuard = rows.indexOf('unless ../publicBoardsHidden');
  assert.ok(rowGuard !== -1, 'row public cells are guarded');
  assert.ok(rows.indexOf('data-visibility="public"') > rowGuard);
  assert.ok(/publicBoardsHidden\(\) \{[\s\S]*?tableVisibilityMode-allowPrivateOnly/.test(sidebarJs),
    'publicBoardsHidden reads tableVisibilityMode-allowPrivateOnly');
  assert.ok(/hide-public-columns/.test(popup) && /\.board-view-settings\.hide-public-columns \.board-view-settings-row \{\s*grid-template-columns: 1fr 1fr 2fr;/.test(read('client/components/sidebar/sidebar.css')),
    'the table collapses to three columns');
  assert.ok(/\.board-view-settings-row \{[\s\S]*?grid-template-columns: 1fr 1fr 1fr 1fr 2fr;/.test(read('client/components/sidebar/sidebar.css')),
    'five columns otherwise');
});

test('every row has a Default and a Show checkbox for each side, and the label the menu uses', () => {
  const rows = popup.slice(popup.indexOf('each boardViewRows'));
  ['public', 'private'].forEach(side => {
    assert.ok(rows.includes(`a.flex.js-board-view-default(data-visibility="${side}"`), `Default on ${side}`);
    assert.ok(rows.includes(`a.flex.js-board-view-show(data-visibility="${side}"`), `Show on ${side}`);
  });
  assert.ok(rows.includes('| {{_ labelKey}}'), 'the Description cell is the view label key');
  assert.ok(rows.includes('.board-view-settings-row(data-view="{{view}}")'));
  assert.ok(/boardViewRows\(\) \{[\s\S]*?boardViewSettings\.orderedBoardViews\(board\)/.test(sidebarJs),
    'rows come from the shared BOARD_VIEWS table, in the board\'s order');
});

// ------------------------------------------- one row per view, menu order

const menu = boardHeaderJade.slice(boardHeaderJade.indexOf('template(name="boardChangeViewPopup")'),
  boardHeaderJade.indexOf('\n//- The Create Board form'));

test('the Board View menu and the popup render the same BOARD_VIEWS table, every view once, Swimlanes first', () => {
  // The menu is rendered from the table (one `each` loop), so the popup's
  // rows and the menu's entries are the same list by construction; every
  // view has a click handler (per-view class), a label key and an icon.
  assert.ok(bvs.BOARD_VIEWS.length >= 25, `the table has ${bvs.BOARD_VIEWS.length} views`);
  assert.match(menu, /each boardViewMenuEntries\n\s*li\n\s*a\(class="\{\{jsClass\}\}"\)\n\s*i\.fa\(class="\{\{icon\}\}"\)\n\s*\| \{\{_ labelKey\}\}/);
  bvs.BOARD_VIEWS.forEach(v => {
    assert.ok(typeof en[v.labelKey] === 'string' && en[v.labelKey], `${v.labelKey} is an English key`);
    assert.ok(/^fa-[a-z-]+$/.test(v.icon), `${v.view} has an icon`);
    assert.ok(boardHeaderJs.includes(`'click .${bvs.boardViewJsClass(v.view)}'`), `${v.view} has a click handler`);
  });
  assert.strictEqual(bvs.BOARD_VIEWS[0].view, 'board-view-swimlanes');
  assert.strictEqual(bvs.BOARD_VIEWS[0].labelKey, 'swimlanes');
  assert.ok(!/with "board-view-/.test(menu), 'no static entry is left beside the loop (negative)');
});

test('a view the menu does not have is not a row, and a duplicate is not either (negative)', () => {
  assert.ok(!bvs.isKnownBoardView('board-view-nope'));
  assert.strictEqual(new Set(bvs.BOARD_VIEWS.map(v => v.view)).size, bvs.BOARD_VIEWS.length);
});

// ------------------------------------------------------------- the schema

test('the board schema has boardViewSettings, defaultPublicBoardView and defaultPrivateBoardView', () => {
  assert.ok(/boardViewSettings: \{[\s\S]*?type: Object,\s*blackbox: true,\s*optional: true,/.test(boardsJs));
  ['defaultPublicBoardView', 'defaultPrivateBoardView'].forEach(field => {
    const re = new RegExp(`${field}: \\{[\\s\\S]*?type: String,\\s*optional: true,\\s*defaultValue: 'board-view-swimlanes',`);
    assert.ok(re.test(boardsJs), `${field} defaults to Swimlanes`);
  });
  assert.strictEqual(bvs.DEFAULT_BOARD_VIEW, 'board-view-swimlanes');
});

test('the Board instance setters apply the pure modifiers and write nothing on a refused click', () => {
  assert.ok(/async setBoardViewShown\(view, visibility, shown\) \{\s*const \$set = boardViewSettings\.showBoardViewModifier\(this, view, visibility, shown\);\s*if \(!\$set\) return false;\s*return await Boards\.updateAsync\(this\._id, \{ \$set \}\);/.test(boardsJs));
  assert.ok(/async setDefaultBoardView\(view, visibility\) \{\s*const \$set = boardViewSettings\.defaultBoardViewModifier\(this, view, visibility\);\s*if \(!\$set\) return false;\s*return await Boards\.updateAsync\(this\._id, \{ \$set \}\);/.test(boardsJs));
  assert.ok(sidebarJs.includes('board.setBoardViewShown(view, visibility, !board.isBoardViewShown(view, visibility))'));
  assert.ok(sidebarJs.includes('board.setDefaultBoardView(view, visibility)'));
  // Who may persist: the same board-admin allow rule as every board setting.
  assert.ok(/update: allowIsBoardAdminOrSiteAdmin/.test(read('server/permissions/boards.js')));
});

// ------------------------------------------------------ the pure decisions

test('a board that never opened the popup shows every view on both sides and opens in Swimlanes', () => {
  const board = { permission: 'public' };
  assert.strictEqual(bvs.visibleBoardViews(board, 'public').length, bvs.BOARD_VIEWS.length);
  assert.strictEqual(bvs.visibleBoardViews(board, 'private').length, bvs.BOARD_VIEWS.length);
  assert.strictEqual(bvs.defaultBoardView(board, 'public'), 'board-view-swimlanes');
  assert.strictEqual(bvs.defaultBoardView(board, 'private'), 'board-view-swimlanes');
  assert.strictEqual(bvs.defaultBoardView({}, 'bogus'), 'board-view-swimlanes');
  assert.strictEqual(bvs.resolveBoardView(board, undefined), 'board-view-swimlanes');
  assert.strictEqual(bvs.resolveBoardView(board, 'board-view-lists'), 'board-view-lists');
});

test('Show is per side: hiding on public leaves private shown, and vice versa', () => {
  const set = bvs.showBoardViewModifier({ permission: 'public' }, 'board-view-cal', 'public', false);
  assert.deepStrictEqual(set, { 'boardViewSettings.board-view-cal.showOnPublic': false });
  const board = { boardViewSettings: { 'board-view-cal': { showOnPublic: false } } };
  assert.strictEqual(bvs.isBoardViewShown(board, 'board-view-cal', 'public'), false);
  assert.strictEqual(bvs.isBoardViewShown(board, 'board-view-cal', 'private'), true);
  assert.strictEqual(bvs.isBoardViewShown(board, 'board-view-lists', 'public'), true);
  assert.deepStrictEqual(bvs.showBoardViewModifier(board, 'board-view-cal', 'private', false),
    { 'boardViewSettings.board-view-cal.showOnPrivate': false });
  assert.deepStrictEqual(bvs.showBoardViewModifier(board, 'board-view-cal', 'public', true),
    { 'boardViewSettings.board-view-cal.showOnPublic': true });
});

test('Default is a radio per side: setting one un-sets the previous, and it also shows the view', () => {
  const board = {
    defaultPublicBoardView: 'board-view-swimlanes',
    defaultPrivateBoardView: 'board-view-swimlanes',
    boardViewSettings: { 'board-view-roadmap': { showOnPublic: false, showOnPrivate: false } },
  };
  const set = bvs.defaultBoardViewModifier(board, 'board-view-roadmap', 'public');
  assert.deepStrictEqual(set, {
    defaultPublicBoardView: 'board-view-roadmap',
    'boardViewSettings.board-view-roadmap.showOnPublic': true,
  });
  // Apply it the way Mongo would and read back: one default, the old one gone.
  const after = { ...board, defaultPublicBoardView: 'board-view-roadmap',
    boardViewSettings: { 'board-view-roadmap': { showOnPublic: true, showOnPrivate: false } } };
  assert.strictEqual(bvs.defaultBoardView(after, 'public'), 'board-view-roadmap');
  assert.strictEqual(bvs.defaultBoardView(after, 'private'), 'board-view-swimlanes', 'the private default is untouched');
  assert.strictEqual(bvs.isBoardViewShown(after, 'board-view-roadmap', 'public'), true);
  assert.strictEqual(bvs.isBoardViewShown(after, 'board-view-roadmap', 'private'), false, 'the private Show is untouched');
  const only = bvs.BOARD_VIEWS.filter(v => bvs.defaultBoardView(after, 'public') === v.view);
  assert.strictEqual(only.length, 1, 'exactly one default on public');
});

test('the default view cannot be hidden, and an unknown view is refused (negative)', () => {
  const board = { defaultPublicBoardView: 'board-view-lists', defaultPrivateBoardView: 'board-view-swimlanes' };
  assert.strictEqual(bvs.showBoardViewModifier(board, 'board-view-lists', 'public', false), null, 'public default stays shown');
  assert.strictEqual(bvs.showBoardViewModifier(board, 'board-view-swimlanes', 'private', false), null, 'private default stays shown');
  assert.notStrictEqual(bvs.showBoardViewModifier(board, 'board-view-lists', 'private', false), null, 'Lists is not the private default, so it may be hidden there');
  assert.strictEqual(bvs.showBoardViewModifier(board, 'board-view-nope', 'public', false), null);
  assert.strictEqual(bvs.defaultBoardViewModifier(board, 'board-view-nope', 'public'), null);
  assert.strictEqual(bvs.defaultBoardViewModifier(board, '', 'public'), null);
});

test('resolveBoardView never leaves a user on a hidden view: it falls back to that side\'s default, then Swimlanes', () => {
  const board = {
    permission: 'public',
    defaultPublicBoardView: 'board-view-gantt',
    defaultPrivateBoardView: 'board-view-table',
    boardViewSettings: {
      'board-view-cal': { showOnPublic: false, showOnPrivate: true },
      'board-view-gantt': { showOnPublic: true },
    },
  };
  assert.strictEqual(bvs.resolveBoardView(board, 'board-view-cal'), 'board-view-gantt', 'hidden on public -> public default');
  assert.strictEqual(bvs.resolveBoardView({ ...board, permission: 'private' }, 'board-view-cal'), 'board-view-cal', 'shown on private -> kept');
  assert.strictEqual(bvs.resolveBoardView({ ...board, permission: 'private' }, undefined), 'board-view-table', 'no choice -> private default');
  assert.strictEqual(bvs.resolveBoardView(board, 'not-a-view'), 'board-view-gantt');
  // A hand-edited document whose default is itself hidden still renders Swimlanes.
  const broken = { permission: 'public', defaultPublicBoardView: 'board-view-gantt',
    boardViewSettings: { 'board-view-gantt': { showOnPublic: false } } };
  assert.strictEqual(bvs.resolveBoardView(broken, 'board-view-gantt'), 'board-view-swimlanes');
  assert.strictEqual(bvs.resolveBoardView(null, 'board-view-cal'), 'board-view-cal', 'off a board the stored choice is returned');
});

// ------------------------------------------------------- applied in the UI

test('the Board View menu lists only the views shown for the board\'s visibility, in the board\'s order', () => {
  assert.ok(/boardViewMenuEntries\(\) \{[\s\S]*?return boardViewMenuEntries\(board, Utils\.boardView\(\)\)/.test(boardHeaderJs));
  assert.ok(boardHeaderJs.includes("require('/models/lib/boardViewSettings')"));
  const board = {
    permission: 'public',
    boardViewOrder: ['board-view-pulse', 'board-view-lists'],
    boardViewSettings: { 'board-view-lists': { showOnPublic: false }, 'board-view-cal': { showOnPrivate: false } },
  };
  const pub = bvs.boardViewMenuEntries(board, 'board-view-pulse');
  assert.deepStrictEqual(pub.slice(0, 2).map(e => e.view), ['board-view-pulse', 'board-view-swimlanes'], 'custom order, Lists hidden on public');
  assert.ok(!pub.some(e => e.view === 'board-view-lists'));
  assert.ok(pub.some(e => e.view === 'board-view-cal'), 'Calendar is hidden on private only');
  assert.strictEqual(pub[0].isCurrent, true);
  assert.strictEqual(pub[0].jsClass, 'js-open-pulse-view');
  assert.ok(pub.every(e => !e.separatorAfter), 'a custom order has no separators');
  const priv = bvs.boardViewMenuEntries({ ...board, permission: 'private' }, 'board-view-cal');
  assert.ok(priv.some(e => e.view === 'board-view-lists') && !priv.some(e => e.view === 'board-view-cal'));
  assert.ok(priv.every(e => !e.isCurrent), 'the hidden current view is ticked nowhere');
});

// ------------------------------------------------------------ reordering

test('each popup row has keyboard-reachable up/down arrows, reusing the existing Move up/down keys', () => {
  const rows = popup.slice(popup.indexOf('each boardViewRows'));
  assert.ok(rows.includes('a.flex.js-board-view-order-up(href="#" role="button" class="{{#if isFirst}}is-disabled{{/if}}" title="{{_ \'card-field-order-move-up\'}}"'));
  assert.ok(rows.includes('a.flex.js-board-view-order-down(href="#" role="button" class="{{#if isLast}}is-disabled{{/if}}" title="{{_ \'card-field-order-move-down\'}}"'));
  assert.strictEqual(en['card-field-order-move-up'], 'Move up');
  assert.strictEqual(en['card-field-order-move-down'], 'Move down');
  assert.ok(!en['board-view-order-move-up'] && !en['board-view-move-up'], 'no new move keys (negative)');
  assert.ok(/boardViewRows\(\) \{[\s\S]*?boardViewSettings\.orderedBoardViews\(board\)/.test(sidebarJs), 'rows follow the board order');
  assert.ok(/'click \.js-board-view-order-up'\(evt\) \{[\s\S]*?board\.moveBoardView\(evt\.currentTarget\.closest\('\[data-view\]'\)\.dataset\.view, 'up'\)/.test(sidebarJs));
  assert.ok(/'click \.js-board-view-order-down'\(evt\) \{[\s\S]*?board\.moveBoardView\(evt\.currentTarget\.closest\('\[data-view\]'\)\.dataset\.view, 'down'\)/.test(sidebarJs));
  assert.ok(/boardViewOrder: \{[\s\S]*?type: Array,\s*optional: true,\s*\},\s*'boardViewOrder\.\$': \{\s*type: String,/.test(boardsJs), 'the schema field');
  assert.ok(/async moveBoardView\(view, direction\) \{[\s\S]*?boardViewSettings\.moveBoardView\(this\.boardViewOrder, view, direction\)[\s\S]*?\$set: \{ boardViewOrder: order \}/.test(boardsJs), 'the setter');
});

test('normalizeBoardViewOrder drops unknown keys and duplicates and appends missing views in default order', () => {
  const all = bvs.DEFAULT_BOARD_VIEW_ORDER;
  assert.deepStrictEqual(bvs.normalizeBoardViewOrder(undefined), all);
  assert.deepStrictEqual(bvs.normalizeBoardViewOrder([]), all);
  assert.deepStrictEqual(bvs.normalizeBoardViewOrder('board-view-lists'), all, 'a non-array is ignored');
  const stored = ['board-view-pulse', 'board-view-nope', 'board-view-lists', 'board-view-pulse', 42];
  const out = bvs.normalizeBoardViewOrder(stored);
  assert.deepStrictEqual(out.slice(0, 2), ['board-view-pulse', 'board-view-lists']);
  assert.deepStrictEqual(out.slice(2), all.filter(v => v !== 'board-view-pulse' && v !== 'board-view-lists'));
  assert.strictEqual(out.length, all.length, 'every view exactly once');
  assert.ok(!out.includes('board-view-nope'));
  assert.strictEqual(bvs.isDefaultBoardViewOrder(undefined), true);
  assert.strictEqual(bvs.isDefaultBoardViewOrder(all.slice()), true);
  assert.strictEqual(bvs.isDefaultBoardViewOrder(['board-view-lists']), false);
  assert.deepStrictEqual(bvs.orderedBoardViews({ boardViewOrder: ['board-view-cal'] })[0], bvs.BOARD_VIEWS[3]);
});

test('moveBoardView moves one step, and the first up / last down / unknown are no-ops (negative)', () => {
  const all = bvs.DEFAULT_BOARD_VIEW_ORDER;
  const up = bvs.moveBoardView(undefined, 'board-view-lists', 'up');
  assert.deepStrictEqual(up.slice(0, 2), ['board-view-lists', 'board-view-swimlanes']);
  assert.deepStrictEqual(up.slice(2), all.slice(2));
  const down = bvs.moveBoardView(up, 'board-view-lists', 'down');
  assert.deepStrictEqual(down, all, 'and back');
  assert.deepStrictEqual(bvs.moveBoardView(undefined, 'board-view-swimlanes', 'up'), all, 'first item up');
  assert.deepStrictEqual(bvs.moveBoardView(undefined, 'board-view-pulse', 'down'), all, 'last item down');
  assert.deepStrictEqual(bvs.moveBoardView(undefined, 'board-view-nope', 'up'), all, 'unknown');
  // Once the unknown key is dropped Pulse IS the first row, so its up is a no-op.
  assert.deepStrictEqual(bvs.moveBoardView(['board-view-nope', 'board-view-pulse'], 'board-view-pulse', 'up'),
    bvs.normalizeBoardViewOrder(['board-view-pulse']), 'first after cleanup');
  const input = ['board-view-cal', 'board-view-lists'];
  bvs.moveBoardView(input, 'board-view-lists', 'up');
  assert.deepStrictEqual(input, ['board-view-cal', 'board-view-lists'], 'the input is not mutated');
});

test('Utils.boardView() resolves the stored choice through the current board', () => {
  assert.ok(/boardView\(\) \{\s*const stored = Utils\.storedBoardView\(\);\s*const board = Utils\.getCurrentBoard\(\);\s*return board \? resolveBoardView\(board, stored\) : stored;/.test(utilsJs));
  assert.ok(/storedBoardView\(\) \{\s*const pending = pendingBoardView\.get\(\);/.test(utilsJs), 'the previous body is the stored choice');
  assert.ok(utilsJs.includes("require('/models/lib/boardViewSettings')"));
});

// ---------------------------------------------------------- translations

test('the four column headers exist in English and are translated in every non-English locale', () => {
  const NEW_KEYS = COLUMN_KEYS.slice(0, 4);
  assert.strictEqual(en['default-on-public-board'], 'Default on Public Board');
  assert.strictEqual(en['show-on-public-board'], 'Show on Public Board');
  assert.strictEqual(en['default-on-private-board'], 'Default on Private Board');
  assert.strictEqual(en['show-on-private-board'], 'Show on Private Board');
  const dir = path.join(ROOT, 'imports/i18n/data');
  const untranslated = [];
  fs.readdirSync(dir).forEach(file => {
    const tag = file.replace('.i18n.json', '');
    if (tag === 'en' || /^en[-_]/.test(tag)) return;
    const j = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    NEW_KEYS.forEach(key => {
      if (typeof j[key] !== 'string' || !j[key] || j[key] === en[key]) untranslated.push(`${tag}:${key}`);
    });
  });
  assert.deepStrictEqual(untranslated, [], 'every locale has its own value');
});

console.log(`boardViewSettings: ${passed} passed`);
