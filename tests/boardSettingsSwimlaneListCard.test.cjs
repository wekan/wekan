'use strict';

// #6680 follow-up: "Swimlane", "List" and "Card" settings move INTO Board
// Settings (the board's cog menu, `boardMenuPopup`), each in its own
// sub-popup, with an <hr> above and below the group of three:
//
//   - The list-width and swimlane-height resize locks and the board-wide
//     "same width for all lists" toggle used to be header icons - they move
//     to Board Settings / Swimlane and Board Settings / List.
//   - Minicard/Card settings (the shared `boardCardSettingsPopup` table) used
//     to be reached from the card's own menu ("Show on Card") and the
//     minicard's own menu ("Show on Minicard") - `tests/showOnCardMenus.test.cjs`
//     pinned that arrangement; it moves back to Board Settings / Card, one
//     entry rather than two.
//
// This is a static wiring test (no Meteor runtime here).
//
// Run: node tests/boardSettingsSwimlaneListCard.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('boardSettingsSwimlaneListCard:');

const sidebarJade = read('client/components/sidebar/sidebar.jade');
const sidebarJs = read('client/components/sidebar/sidebar.js');
const headerJade = read('client/components/main/header.jade');
const headerJs = read('client/components/main/header.js');
const headerCss = read('client/components/main/header.css');
const cardJade = read('client/components/cards/cardDetails.jade');
const cardJs = read('client/components/cards/cardDetails.js');
const minicardJs = read('client/components/cards/minicard.js');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));

const boardMenu = sidebarJade.slice(sidebarJade.indexOf('template(name="boardMenuPopup")'),
  sidebarJade.indexOf('template(name="boardSwimlaneSettingsPopup")'));

// ── gone from the header ────────────────────────────────────────────────────

test('the three toggles are gone from the header (negative)', () => {
  for (const cls of ['js-toggle-list-width-resize-lock', 'js-toggle-swimlane-height-resize-lock',
    'js-toggle-same-width-for-all-lists']) {
    assert.ok(!headerJade.includes(cls), `header.jade no longer has .${cls}`);
    assert.ok(!headerJs.includes(cls), `header.js no longer has a handler for .${cls}`);
  }
  assert.ok(!headerJs.includes('canLockBoardResize'), 'the header-only gating helper is gone');
  assert.ok(!headerJs.includes('isListWidthResizeLocked') && !headerJs.includes('isSwimlaneHeightResizeLocked')
    && !headerJs.includes('isSameWidthForAllLists'), 'and the header helpers that read the board fields');
  assert.ok(!headerCss.includes('js-toggle-list-width-resize-lock'),
    'and the header CSS sized for those buttons');
});

// ── the group in Board Settings ─────────────────────────────────────────────

test('Board Settings has an <hr> above and below the Swimlane/List/Card group', () => {
  const lines = boardMenu.split('\n').map(l => l.trim());
  const swimlaneAt = lines.findIndex(l => l.includes('js-open-board-swimlane-settings'));
  const cardAt = lines.findIndex(l => l.includes('js-open-board-card-settings'));
  assert.ok(swimlaneAt !== -1 && cardAt !== -1 && swimlaneAt < cardAt, 'the group exists, in order');
  // Reduce to only the structural markup lines that matter here (hr, ul, the
  // admin if-gate, li) - dropping comment prose entirely, rather than trying
  // to detect where a multi-line jade comment ends.
  const structural = /^(hr|ul\.pop-over-list|if currentUser\.isBoardAdmin|li)$/;
  const before = lines.slice(0, swimlaneAt).filter(l => structural.test(l));
  assert.strictEqual(before[before.length - 4], 'hr',
    'an hr directly precedes the group\'s ul (only ul/if/li wrappers in between)');
  const after = lines.slice(cardAt + 1).filter(l => structural.test(l));
  assert.strictEqual(after[0], 'hr', 'an hr directly follows the group');
});

test('Swimlane and List are board-admin only; Card is open to any board member', () => {
  const group = boardMenu.slice(boardMenu.indexOf('js-open-board-swimlane-settings') - 200,
    boardMenu.indexOf('js-open-board-card-settings') + 40);
  assert.ok(/if currentUser\.isBoardAdmin\n(?:[\s\S]*?)li\n(?:[\s\S]*?)js-open-board-swimlane-settings/.test(group),
    'Swimlane sits behind an isBoardAdmin gate');
  // Card is a sibling `li` of the ul, indented two less than the admin-gated
  // entries, so it is NOT inside that if-block.
  const cardLine = group.slice(0, group.indexOf('js-open-board-card-settings'))
    .split('\n').filter(l => l.trim() === 'li').pop();
  assert.strictEqual(cardLine, '      li', 'Card\'s li is a direct child of the ul, not the admin-only if-block');
});

test('the three entries open their own popups, named Swimlane/List/Card', () => {
  for (const [cls, key] of [
    ['js-open-board-swimlane-settings', 'swimlane'],
    ['js-open-board-list-settings', 'list'],
    ['js-open-board-card-settings', 'card-settings'],
  ]) {
    assert.ok(boardMenu.includes(`a.${cls}(title="{{_ '${key}'}}")`), `${cls} is titled from '${key}'`);
  }
});

test('the popups are reached with existing translations, not new title keys', () => {
  assert.ok(/'click \.js-open-board-swimlane-settings': Popup\.open\('boardSwimlaneSettings', \{ titleKey: 'swimlane' \}\)/
    .test(sidebarJs), 'Swimlane reuses the existing "swimlane" key');
  assert.ok(/'click \.js-open-board-list-settings': Popup\.open\('boardListSettings', \{ titleKey: 'list' \}\)/
    .test(sidebarJs), 'List reuses the existing "list" key');
  assert.ok(!en['boardSwimlaneSettingsPopup-title'] && !en['boardListSettingsPopup-title'],
    'no new *Popup-title keys were added for them');
  // Card opens the pre-existing shared table template directly - its title
  // key (boardCardSettingsPopup-title = "Card Settings") already existed.
  assert.ok(/'click \.js-open-board-card-settings'/.test(sidebarJs), 'Card has its own handler');
  assert.ok(en['boardCardSettingsPopup-title'], 'and its title key already exists');
});

// ── Swimlane and List popups ────────────────────────────────────────────────

test('Board Settings / Swimlane has the swimlane-height resize lock', () => {
  const tpl = sidebarJade.slice(sidebarJade.indexOf('template(name="boardSwimlaneSettingsPopup")'),
    sidebarJade.indexOf('template(name="boardListSettingsPopup")'));
  assert.ok(tpl.includes('js-toggle-swimlane-height-resize-lock'), 'the toggle is here');
  assert.ok(/isSwimlaneHeightResizeLocked/.test(tpl), 'and reflects the board field');
  const helper = sidebarJs.slice(sidebarJs.indexOf('Template.boardSwimlaneSettingsPopup.helpers'));
  assert.ok(/getSwimlaneHeightResizeLocked\(\)/.test(helper.slice(0, 400)), 'read from the board');
  const handler = sidebarJs.slice(sidebarJs.indexOf('Template.boardSwimlaneSettingsPopup.events'));
  const body = handler.slice(0, handler.indexOf('});'));
  assert.ok(body.includes('setSwimlaneHeightResizeLocked') && body.includes('getSwimlaneHeightResizeLocked'),
    'the click handler flips it');
});

test('Board Settings / List has the list-width resize lock and same-width-for-all-lists', () => {
  const tpl = sidebarJade.slice(sidebarJade.indexOf('template(name="boardListSettingsPopup")'),
    sidebarJade.indexOf('template(name="exportBoardPopup")'));
  assert.ok(tpl.includes('js-toggle-list-width-resize-lock'), 'the list-width lock is here');
  assert.ok(tpl.includes('js-toggle-same-width-for-all-lists'), 'and same-width-for-all-lists');
  const helper = sidebarJs.slice(sidebarJs.indexOf('Template.boardListSettingsPopup.helpers'),
    sidebarJs.indexOf('Template.boardListSettingsPopup.events'));
  assert.ok(/getListWidthResizeLocked\(\)/.test(helper), 'reads the list-width lock');
  assert.ok(/getSameWidthForAllLists\(\)/.test(helper), 'and the same-width-for-all-lists field');
  const handler = sidebarJs.slice(sidebarJs.indexOf('Template.boardListSettingsPopup.events'));
  const body = handler.slice(0, handler.indexOf('});'));
  assert.ok(body.includes('setListWidthResizeLocked') && body.includes('setSameWidthForAllLists'),
    'both click handlers write the matching board field');
});

// ── the Card menu entries are gone ──────────────────────────────────────────

test('"Show on Card" / "Show on Minicard" are gone from the card and minicard menus (negative)', () => {
  assert.ok(!cardJade.includes('js-show-on-card') && !cardJade.includes('js-show-on-minicard'),
    'no menu entries in cardDetailsActionsPopup');
  assert.ok(!cardJs.includes("'click .js-show-on-card'") && !cardJs.includes("'click .js-show-on-minicard'"),
    'no click handlers');
  assert.ok(!sidebarJade.includes('template(name="showOnCardPopup")')
    && !sidebarJade.includes('template(name="showOnMinicardPopup")'),
    'the two wrapper popups are gone');
  assert.ok(!fs.existsSync(path.join(repoRoot, 'client/lib/cardMenuSource.js')),
    'and the module that only existed to tell the two menus apart is gone with them');
  assert.ok(!cardJs.includes('cardMenuSource') && !minicardJs.includes('cardMenuSource'),
    'no leftover references to it');
});

test('the shared settings table itself still exists - Board Settings/Card includes it', () => {
  assert.ok(sidebarJade.includes('template(name="boardCardSettingsPopup")'),
    'boardCardSettingsPopup was not deleted, only its two menu entry points were');
  assert.ok(/settingsSideClass\(\) \{/.test(sidebarJs), 'the side-hiding helper is unchanged');
});

test('Board Settings/Card shows both columns - no side is passed', () => {
  const handler = sidebarJs.slice(sidebarJs.indexOf("'click .js-open-board-card-settings'"),
    sidebarJs.indexOf('});', sidebarJs.indexOf("'click .js-open-board-card-settings'")));
  assert.ok(!/side\s*[:=]\s*['"]card['"]/.test(handler) && !/side\s*[:=]\s*['"]minicard['"]/.test(handler),
    'no side is set, so settingsSideClass() returns no show-*-only class');
});

test('a non-admin still reaches the one PERSONAL row ("Labels text") via personalOnly', () => {
  const handler = sidebarJs.slice(sidebarJs.indexOf("'click .js-open-board-card-settings'"),
    sidebarJs.indexOf('});', sidebarJs.indexOf("'click .js-open-board-card-settings'")));
  assert.ok(/isBoardAdmin/.test(handler), 'the handler checks board-admin status');
  assert.ok(/personalOnly:\s*true/.test(handler), 'and asks for personalOnly when the user is not an admin');
});

console.log(`\nboardSettingsSwimlaneListCard: ${passed} tests passed`);
