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
const sidebarCss = read('client/components/sidebar/sidebar.css');
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
  // The group's FIRST entry is Board View (docs/Features/Board/Board-View-
  // Settings.md, tests/boardViewSettings.test.cjs), which sits directly
  // above Swimlane; the hr-above check is anchored on it, so that the group
  // still starts right after the rule. The Swimlane -> Card order stays.
  // Since the menu reorder (tests/boardMenuOrder.test.cjs) the rule above
  // it closes the Rules / Change color / Change Background Image group and
  // the rule below it opens the Export group; the group itself is unchanged.
  const firstAt = lines.findIndex(l => l.includes('js-open-board-view-settings'));
  const swimlaneAt = lines.findIndex(l => l.includes('js-open-board-swimlane-settings'));
  const cardAt = lines.findIndex(l => l.includes('js-open-board-card-settings'));
  assert.ok(firstAt !== -1 && swimlaneAt !== -1 && cardAt !== -1 && firstAt < swimlaneAt && swimlaneAt < cardAt,
    'the group exists, in order: Board View, Swimlane, ..., Card');
  // Reduce to only the structural markup lines that matter here (hr, ul, the
  // admin if-gate, li) - dropping comment prose entirely, rather than trying
  // to detect where a multi-line jade comment ends.
  const structural = /^(hr|ul\.pop-over-list|if currentUser\.isBoardAdmin|li)$/;
  const before = lines.slice(0, firstAt).filter(l => structural.test(l));
  assert.strictEqual(before[before.length - 4], 'hr',
    'an hr directly precedes the group\'s ul (only ul/if/li wrappers in between)');
  const after = lines.slice(cardAt + 1).filter(l => structural.test(l));
  assert.strictEqual(after[0], 'hr', 'an hr directly follows the group');
});

test('no doubled hr between the group and Archive Board (negative)', () => {
  // The group's closing hr and Archive Board's own opening hr used to be two
  // consecutive `hr` lines - only the second was ever reachable, one board
  // admin away from Move Board to Archive, and it read as a doubled rule.
  // The menu was then reordered (tests/boardMenuOrder.test.cjs): the
  // Export / Notifications / Outgoing Webhooks group now sits between this
  // group and the Archive group, so exactly TWO rules separate Card from
  // Move Board to Archive - one under each group - and never two in a row.
  const archiveAt = boardMenu.indexOf('js-archive-board');
  const cardAt = boardMenu.indexOf('js-open-board-card-settings');
  const structural = /^(hr|ul\.pop-over-list|if currentUser\.isBoardAdmin|li|unless currentBoard\.isTemplatesBoard)$/;
  const between = boardMenu.slice(cardAt, archiveAt).split('\n').map(l => l.trim())
    .filter(l => structural.test(l));
  assert.strictEqual(between.filter(l => l === 'hr').length, 2,
    'one hr under the Swimlane/List/Card group and one under the Export group');
  assert.ok(!between.some((l, i) => l === 'hr' && between[i + 1] === 'hr'),
    'no two consecutive hr lines');
});

test('Swimlane and List are board-admin only; Card is open to any board member', () => {
  // The slice starts before the group's first entry (Board View, whose jade
  // comment now sits between the if-gate and Swimlane), so the gate is still
  // inside the window the regex reads.
  const group = boardMenu.slice(boardMenu.indexOf('js-open-board-view-settings') - 600,
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

// #2489 follow-up: "WIP Limit Groups" used to be a fourth top-level entry of
// the Board Settings group, between List and Card. A group most often caps
// one swimlane's lists together, so it was deliberately moved INTO Board
// Settings / Swimlane as a row there - the path is now Board Settings /
// Swimlane / WIP Limit Groups. The wipLimitGroupsPopup itself and its
// handlers are unchanged; only where it is opened from moved.
test('Board Settings / Swimlane has the WIP Limit Groups row, opening the existing popup', () => {
  const tpl = sidebarJade.slice(sidebarJade.indexOf('template(name="boardSwimlaneSettingsPopup")'),
    sidebarJade.indexOf('template(name="boardListSettingsPopup")'));
  assert.ok(tpl.includes(`a.js-open-board-wip-limit-groups(title="{{_ 'wip-limit-groups'}}")`),
    'the row is in the Swimlane popup, titled from the existing wip-limit-groups key');
  assert.ok(tpl.indexOf('js-toggle-swimlane-height-resize-lock') < tpl.indexOf('js-open-board-wip-limit-groups'),
    'below the resize lock');
  assert.ok(en['wip-limit-groups'], 'the key already exists');
  const handler = sidebarJs.slice(sidebarJs.indexOf('Template.boardSwimlaneSettingsPopup.events'));
  const body = handler.slice(0, handler.indexOf('});'));
  assert.ok(/'click \.js-open-board-wip-limit-groups': Popup\.open\('wipLimitGroups', \{ titleKey: 'wip-limit-groups' \}\)/
    .test(body), 'the Swimlane popup opens the unchanged wipLimitGroupsPopup, stacked on itself');
  assert.ok(sidebarJade.includes('template(name="wipLimitGroupsPopup")'), 'the popup still exists');
});

test('the top-level Board Settings list no longer has a WIP Limit Groups entry (negative)', () => {
  assert.ok(!boardMenu.includes('js-open-board-wip-limit-groups'),
    'no js-open-board-wip-limit-groups link in the Board Settings menu');
  assert.ok(!boardMenu.includes("{{_ 'wip-limit-groups'}}"),
    'the menu does not render the wip-limit-groups label');
  const menuEvents = sidebarJs.slice(sidebarJs.indexOf('Template.boardMenuPopup.events'),
    sidebarJs.indexOf('Template.boardSwimlaneSettingsPopup.helpers'));
  assert.ok(!/'click \.js-open-board-wip-limit-groups'/.test(menuEvents),
    'and boardMenuPopup has no handler for it - the one handler lives in the Swimlane popup');
  assert.strictEqual((sidebarJs.match(/'click \.js-open-board-wip-limit-groups'/g) || []).length, 1,
    'exactly one handler opens it');
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

// ── the layout: sections on the left, Show on Minicard / Show on Card on the right

test('Board Settings / Card is the Admin Panel left menu and pane, with Show on Minicard and Show on Card', () => {
  // docs/Features/Cards/Card-Fields.md (2026-10-25): the same popup the opened
  // card's "+ Add" opens. It was one "Card field order" heading over two long
  // lists; the rows are grouped into sections now, each line with its minicard
  // and its card checkbox side by side.
  const tpl = sidebarJade.slice(sidebarJade.indexOf('template(name="boardCardSettingsPopup")'));
  const form = tpl.slice(0, tpl.indexOf('\ntemplate(name='));
  assert.ok(form.includes('+leftMenu(settingsMenuItems)') && form.includes('+paneTitle(settingsPaneTitle)'));
  // The heading text is its own span, with Select all / Select none under it
  // (tests/cardSettingsSelectAllAligned.test.cjs). Since 2026-10-27 each
  // section has two lists again, the card's first (each in its own order,
  // reordered by drag and drop - tests/cardSettingsCoverage.test.cjs).
  const minicard = form.indexOf("span.card-settings-side-head.card-settings-side-head-minicard\n                  span {{_ 'show-on-minicard'}}");
  const card = form.indexOf("span.card-settings-side-head.card-settings-side-head-card\n                  span {{_ 'show-on-card'}}");
  assert.ok(minicard !== -1 && card !== -1 && card < minicard, 'Show on Card\'s list, then Show on Minicard\'s');
  assert.ok(en['show-on-card'] && en['show-on-minicard'], 'existing, translated keys');
  assert.ok(!form.includes('card-field-order-heading'), 'the old single heading is gone (negative)');
});

test('a menu that asks for one side hides the other side\'s list', () => {
  // The card's list carries On this card and Show empty too, so the
  // minicard's own view hides them with it.
  assert.ok(sidebarCss.includes(
    '.board-card-settings.show-card-only .card-settings-list-minicard,\n'
    + '.board-card-settings.show-minicard-only .card-settings-list-card {'),
    'show-card-only hides the minicard list and show-minicard-only the card list');
});

console.log(`\nboardSettingsSwimlaneListCard: ${passed} tests passed`);
