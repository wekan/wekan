'use strict';

// #1591: whole-minicard collapse. A caret at the minicard's top-left corner
// folds the minicard down to just its own caret + title, the same way a list
// or a swimlane collapses elsewhere at the board - and the same way a
// checklist folds on the minicard itself, which this mirrors most closely.
//
// The details-menu button and the optional drag handle must stay reachable
// regardless of collapse state, so they live OUTSIDE the collapse fold.
//
// Run: node tests/minicardCollapse.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const jade = read('client/components/cards/minicard.jade');
const js = read('client/components/cards/minicard.js');
const css = read('client/components/cards/minicard.css');
const utils = read('client/lib/utils.js');
const usersModel = read('models/users.js');
const serverUsersModel = read('server/models/users.js');

console.log('minicardCollapse:');

// ── markup ───────────────────────────────────────────────────────────────

test('the caret exists, mirroring the checklist caret\'s accessibility shape', () => {
  const caret = jade.slice(jade.indexOf('a.fa.minicard-collapse.js-collapse-minicard('));
  const body = caret.slice(0, caret.indexOf(')') + 1);
  assert.ok(/class="\{\{#if minicardCollapsed\}\}fa-caret-right\{\{else\}\}fa-caret-down\{\{\/if\}\}"/.test(body),
    'down when expanded, right when collapsed - the same two glyphs as elsewhere');
  assert.ok(/title="\{\{#if minicardCollapsed\}\}\{\{_ 'uncollapse'\}\}\{\{else\}\}\{\{_ 'collapse'\}\}\{\{\/if\}\}"/.test(body),
    'reuses the existing collapse/uncollapse i18n keys, same as list/swimlane collapse');
  assert.ok(/role="button" tabindex="0"/.test(body), 'keyboard-focusable, like the checklist caret');
  assert.ok(/aria-expanded="\{\{#if minicardCollapsed\}\}false\{\{else\}\}true\{\{\/if\}\}"/.test(body),
    'state exposed to assistive tech');
});

test('the caret comes right after the always-visible menu/handle block, before the title', () => {
  const menuAt = jade.indexOf('a.minicard-details-menu-with-handle.js-open-minicard-details-menu');
  const caretAt = jade.indexOf('a.fa.minicard-collapse.js-collapse-minicard');
  const titleAt = jade.indexOf('.minicard-title\n');
  assert.ok(menuAt > -1 && menuAt < caretAt, 'menu button is declared before the caret');
  assert.ok(caretAt < titleAt, 'caret sits right before the title');
});

test('the title renders unconditionally - it is not inside the collapse fold', () => {
  const between = jade.slice(jade.indexOf('a.fa.minicard-collapse.js-collapse-minicard'),
    jade.indexOf('unless minicardCollapsed'));
  assert.ok(/\.minicard-title\b/.test(between), 'the title block sits between the caret and the fold');
  assert.ok(!/unless minicardCollapsed[\s\S]*\.minicard-title\b/.test(
    jade.slice(0, jade.indexOf('.minicard-title\n'))),
    'nothing before the title guards it with the collapse condition');
});

test('everything else in the template is wrapped in unless/if minicardCollapsed', () => {
  const foldStart = jade.indexOf('unless minicardCollapsed');
  assert.ok(foldStart > -1, 'the fold exists');
  const fold = jade.slice(foldStart);
  // Content that must be hidden when collapsed.
  ['.dates', '.minicard-cover', '.minicard-upload-progress', 'if showLabels',
    'if showCustomFieldsOnMinicard', 'if showAssignee', 'if showMembers',
    'if showCreatorOnMinicard', 'if shouldShowChecklistAtMinicard', '.badges',
    'if shouldShowListOnMinicard', "$eq 'subtext-with-full-path'"]
    .forEach(needle => {
      assert.ok(fold.includes(needle), `${needle} is inside the collapse fold`);
    });
});

test('the details-menu button and the drag handle are NOT inside the collapse fold', () => {
  const foldStart = jade.indexOf('unless minicardCollapsed');
  const before = jade.slice(0, foldStart);
  assert.ok(/a\.minicard-details-menu-with-handle\.js-open-minicard-details-menu/.test(before),
    'the details-menu button is declared before the fold, so it always renders');
  assert.ok(/\.handle\.nodragscroll/.test(before),
    'the optional drag handle is declared before the fold too');
});

test('the minicard element itself carries a collapsed class for styling', () => {
  const opening = jade.slice(jade.indexOf('.minicard('), jade.indexOf(')\n'));
  assert.ok(/class="\{\{#if minicardCollapsed\}\}minicard-collapsed\{\{\/if\}\}"/.test(opening));
});

// ── behaviour ────────────────────────────────────────────────────────────

test('minicardCollapsed() helper mirrors list.js\'s collapsed() helper', () => {
  const helper = js.slice(js.indexOf('minicardCollapsed()'));
  const body = helper.slice(0, helper.indexOf('\n  },'));
  assert.ok(/Utils\.getCardCollapseState\(this\)/.test(body));
});

test('the click handler toggles state through Utils.setCardCollapseState, like listHeader.js', () => {
  const handler = js.slice(js.indexOf("'click .js-collapse-minicard'"));
  const body = handler.slice(0, handler.indexOf('\n  },'));
  assert.ok(/event\.preventDefault\(\)/.test(body));
  assert.ok(/event\.stopPropagation\(\)/.test(body),
    'a minicard is a link to the card - toggling the caret must not also open it');
  assert.ok(/Utils\.getCardCollapseState\(/.test(body), 'reads the current state');
  assert.ok(/Utils\.setCardCollapseState\([^,]+,\s*!collapsed\)/.test(body), 'and flips it');
});

test('the caret also responds to the keyboard, like the checklist caret', () => {
  const handler = js.slice(js.indexOf("'keydown .js-collapse-minicard'"));
  const body = handler.slice(0, handler.indexOf('\n  },'));
  assert.ok(/event\.key !== 'Enter' && event\.key !== ' '/.test(body));
  assert.ok(/\.trigger\('click'\)/.test(body));
});

// ── the Utils pair mirrors getListCollapseState/setListCollapseState ──────

test('Utils.getCardCollapseState/setCardCollapseState exist and mirror the list pair', () => {
  const get = utils.slice(utils.indexOf('getCardCollapseState(card)'));
  const getBody = get.slice(0, get.indexOf('\n  },'));
  assert.ok(/collapsedCard-\$\{card\._id\}/.test(getBody), 'same Session-key shape as collapsedList-<id>');
  assert.ok(/Session\.get\(key\)/.test(getBody), 'checks the Session cache first, for instant re-render');
  assert.ok(/user\.getCollapsedCardFromStorage\(card\.boardId, card\._id\)/.test(getBody),
    'falls back to the user-document read');

  const set = utils.slice(utils.indexOf('setCardCollapseState(card, collapsed)'));
  const setBody = set.slice(0, set.indexOf('\n  },'));
  assert.ok(/Session\.set\(key, !!collapsed\)/.test(setBody), 'writes the Session key immediately');
  assert.ok(/Meteor\.call\('setCardCollapsedState', card\.boardId, card\._id, !!collapsed\)/.test(setBody),
    'and persists through a Meteor method, like setListCollapsedState');
});

test('there is deliberately no anonymous/public fallback for card collapse, and it says why', () => {
  const region = utils.slice(utils.indexOf('// #1591: the same shape as a list'),
    utils.indexOf('getCardCollapseState(card)'));
  assert.ok(/no.*Users\.getPublicCollapsedCard/.test(region) || /no `Users\.getPublicCollapsedCard`/.test(region),
    'the comment explains the omission rather than leaving it silent');
  assert.ok(!/getPublicCollapsedCard/.test(utils.slice(utils.indexOf('getCardCollapseState(card)'))
    .slice(0, utils.indexOf('getCardCollapseState(card)') + 800)),
    'and the getter itself does not call a nonexistent public fallback');
});

// ── the user-document storage mirrors collapsedLists ───────────────────────

test('models/users.js: profile.collapsedCards schema field mirrors collapsedLists', () => {
  assert.ok(/'profile\.collapsedCards':\s*\{\s*\/\*\*?[\s\S]{0,300}?type: Object,\s*defaultValue: \{\},\s*blackbox: true,\s*\}/
    .test(usersModel), 'same shape as profile.collapsedLists');
});

test('models/users.js: getCollapsedCardFromStorage exists and mirrors getCollapsedListFromStorage', () => {
  assert.ok(/getCollapsedCardFromStorage\(boardId, cardId\)/.test(usersModel));
  const fn = usersModel.slice(usersModel.indexOf('getCollapsedCardFromStorage(boardId, cardId)'));
  const body = fn.slice(0, fn.indexOf('\n  },'));
  assert.ok(/getCollapsedCard\(boardId, cardId\)/.test(body));
});

test('server/models/users.js: setCardCollapsedState method mirrors setListCollapsedState', () => {
  assert.ok(/async setCardCollapsedState\(boardId, cardId, collapsed\)/.test(serverUsersModel));
  const fn = serverUsersModel.slice(serverUsersModel.indexOf('async setCardCollapsedState('));
  const body = fn.slice(0, fn.indexOf('\n  },'));
  assert.ok(/check\(boardId, String\)/.test(body));
  assert.ok(/check\(cardId, String\)/.test(body));
  assert.ok(/check\(collapsed, Boolean\)/.test(body));
  assert.ok(/not-logged-in/.test(body), 'logged-in only, same as setListCollapsedState');
  assert.ok(/profile\.collapsedCards/.test(body));
});

// ── CSS: an unobtrusive top-left caret ─────────────────────────────────────

test('the caret is styled, unobtrusive and matches the checklist caret in size', () => {
  const rule = css.slice(css.indexOf('.minicard .minicard-collapse {'));
  const body = rule.slice(0, rule.indexOf('}'));
  assert.ok(/font-size: 0\.875rem/.test(body), 'same size as the per-checklist caret');
  assert.ok(/cursor: pointer/.test(body));
});

console.log(`\nminicardCollapse: ${passed} tests passed`);
