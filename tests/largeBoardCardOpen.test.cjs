'use strict';

// #6745: on a large board, opening or closing a card took seconds. Run:
// node tests/largeBoardCardOpen.test.cjs
//
// One section per fix, in the order they were made:
//  1. opening a card writes the user document (profile.cardLastViews, #3078),
//     and the board view and the helpers every minicard runs read the WHOLE
//     user document - so one card open re-ran every list's card loop and every
//     minicard. They now read only the fields they use
//     (client/lib/currentUserWith.js); minimongo re-runs a field-limited query
//     only when a projected field changes.
//  2. a card of the board on screen opens and closes by its address without
//     re-creating the board.
//  3. the popup-card Session keys are cleared to null, never deleted.
//  4. jQuery UI sortable options are set only when their value changed.
//  5. the snap's cards-loading default is auto.
//  6. opening a card leaves no subscription behind.
// tests/playwright/specs/large-board-card-open.e2e.js measures 1 and 2 in the
// running app.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const { userFieldsProjection, isUserFieldPath } = require('../models/lib/userFieldsProjection.js');
const { cardLastViewsModifier, CARD_LAST_VIEWS_MAX } = require('../models/lib/unreadComments.js');
const {
  BOARD_LAYOUT_ROUTES, mountedBoardAfterEnter, mustRenderBoardLayout,
} = require('../models/lib/boardLayoutMount.js');
const { changedSortableOptions } = require('../models/lib/sortableOptions.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// The body of `name(...) {` or `name: function` / `registerHelper('name', function`
// in `source`, by brace matching from the first `{` after the name.
function bodyOf(source, marker) {
  const at = source.indexOf(marker);
  assert.ok(at >= 0, `marker not found: ${marker}`);
  const open = source.indexOf('{', at + marker.length - 1);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  throw new Error(`unbalanced body for ${marker}`);
}

const WHOLE_USER = /ReactiveCache\.getCurrentUser\(\)|Meteor\.user\(\)|Meteor\.user &&/;

console.log('largeBoardCardOpen:');

// ---- fix 1: per-minicard helpers read only the user fields they need ----

test('a projection lists exactly the fields asked for', () => {
  assert.deepStrictEqual(userFieldsProjection(['profile.showWeekOfYear']), { 'profile.showWeekOfYear': 1 });
  assert.deepStrictEqual(
    userFieldsProjection(['profile.cardLastViews.abc123', 'profile.mobileMode']),
    { 'profile.cardLastViews.abc123': 1, 'profile.mobileMode': 1 },
  );
  assert.deepStrictEqual(userFieldsProjection('_id'), { _id: 1 });
});

test('an id that could change the projection is refused, not passed through (negative)', () => {
  ['profile.$where', 'profile..x', 'profile.__proto__.x', '', 'profile.constructor', null, 42]
    .forEach(bad => assert.strictEqual(isUserFieldPath(bad), false, String(bad)));
  // Refused means null, so the caller reads the whole document: slower, never wrong.
  assert.strictEqual(userFieldsProjection(['profile.ok', 'profile.$bad']), null);
  assert.strictEqual(userFieldsProjection([]), null);
});

test('currentUserWith reads by id with the projection, and falls back to the whole user', () => {
  const src = read('client/lib/currentUserWith.js');
  assert.ok(/Meteor\.userId\(\)/.test(src), 'no user id, no read');
  assert.ok(/Meteor\.users\.findOne\(userId, fields \? \{ fields \} : \{\}\)/.test(src),
    'a field-limited findOne by id; an unsafe path reads the whole document');
});

// Every helper that runs once per minicard (or per date badge / checklist on it)
// and reads the current user. None may read the whole document again.
const PER_MINICARD = [
  ['client/components/cards/minicard.js', 'hasUnreadComments() {', 'profile.cardLastViews.'],
  ['client/components/cards/minicard.js', 'checklistCollapsed() {', 'profile.collapsedCardSections.'],
  ['client/components/cards/cardDate.js', 'showWeekOfYear() {', 'profile.showWeekOfYear'],
  ['client/lib/minicardLabelText.js', 'export function resolveShowLabelText(board) {', 'profile.showLabelTextOverride'],
  ['client/lib/dependencyLayers.js', 'export function dependencyVisibility() {', 'profile.showBoardDependencies'],
  ['client/lib/dateDisplay.js', 'export function dateDisplayPreferences() {', 'DATE_USER_FIELDS'],
  ['client/lib/dateDisplay.js', 'export function hasDateFormatPreference() {', 'DATE_USER_FIELDS'],
  ['client/lib/utils.js', '  getExplicitMobileMode() {', 'profile.mobileMode'],
  ['client/lib/utils.js', '  getCardCollapseState(card) {', 'profile.collapsedCards.'],
  ['client/lib/utils.js', '  dragHandlesPreference() {', 'profile.showDesktopDragHandles'],
  ['client/lib/utils.js', '  canCheckChecklistItem(card = Utils.getCurrentCard()) {', "['_id']"],
  ['client/components/cards/cardDetails.js', "registerHelper('cardHasUnreadComments'", 'profile.cardLastViews.'],
];

PER_MINICARD.forEach(([file, marker, field]) => {
  test(`${file} ${marker.trim().split('(')[0]} reads ${field} only`, () => {
    const body = bodyOf(read(file), marker);
    assert.ok(body.includes('currentUserWith('), 'reads through currentUserWith');
    assert.ok(body.includes(field), `names ${field}`);
    assert.ok(!WHOLE_USER.test(body), 'and never the whole user document (negative)');
  });
});

// The board view decides every list's card loop (listBody's idOrNull and
// containerSwimlaneId call Utils.boardView()). Measured in the running app
// (tests/playwright/specs/large-board-card-open.e2e.js): with the whole user
// document read here, one card open re-ran every list and Blaze re-evaluated
// every minicard - 37,452 invalidations for 40 cards, 390 after.
test('Utils.storedBoardView reads only the two board-view fields', () => {
  const body = bodyOf(read('client/lib/utils.js'), '  storedBoardView() {');
  assert.ok(/currentUserWith\(\['boardViewPreference', 'profile\.boardView'\]\)/.test(body));
  assert.ok(!WHOLE_USER.test(body), 'negative: not the whole user document');
});

test('allowBoardView reads only the feature-preview fields', () => {
  const src = read('client/lib/instanceFeatures.js');
  assert.ok(/PREVIEW_USER_FIELDS = \['featurePreview', 'isAdmin'\]/.test(src));
  assert.ok(/isBoardViewAvailable\(ReactiveCache\.getCurrentSetting\(\), currentUserWith\(PREVIEW_USER_FIELDS\), view\)/.test(src));
  assert.ok(!WHOLE_USER.test(src), 'negative: not the whole user document');
  // ...and those ARE the fields the decision reads.
  const lib = read('models/lib/instanceFeatures.js');
  const preview = bodyOf(lib, 'function canPreviewFeatures(setting, user) {');
  const read_ = (preview.match(/user\.([A-Za-z]+)/g) || []).map(m => m.slice(5)).sort();
  assert.deepStrictEqual([...new Set(read_)], ['featurePreview', 'isAdmin']);
});

test('customFieldsWD decides "board admin" from the user id, not the user document', () => {
  const body = bodyOf(read('models/cards.js'), '  customFieldsWD() {');
  assert.ok(/Meteor\.userId/.test(body) && /hasAdmin\(currentUserId\)/.test(body));
  assert.ok(!WHOLE_USER.test(body), 'negative: no Meteor.user() per minicard');
});

test('the date fields are the ones the date helpers use, nothing else', () => {
  const src = read('client/lib/dateDisplay.js');
  assert.ok(/DATE_USER_FIELDS = \['profile\.calendarSystem', 'profile\.dateFormat', 'profile\.dateFormatOverride'\]/.test(src));
  const users = read('models/users.js');
  assert.ok(/getDateFormat\(\) \{\s*const profile = this\.profile \|\| \{\};\s*return profile\.dateFormat/.test(users));
  assert.ok(/getCalendarSystem\(\) \{\s*const profile = this\.profile \|\| \{\};\s*return profile\.calendarSystem/.test(users));
});

test('opening a card $sets one cardLastViews entry, not the whole map', () => {
  const now = new Date('2026-10-07T10:00:00Z');
  const views = { a: new Date('2026-01-01T00:00:00Z'), b: new Date('2026-02-01T00:00:00Z') };
  assert.deepStrictEqual(cardLastViewsModifier(views, 'c', now), { $set: { 'profile.cardLastViews.c': now } });
  assert.deepStrictEqual(cardLastViewsModifier(undefined, 'a', now), { $set: { 'profile.cardLastViews.a': now } });
  assert.deepStrictEqual(cardLastViewsModifier(views, 'a', now), { $set: { 'profile.cardLastViews.a': now } },
    'an already-viewed card is still one entry');
});

test('at the cap the least recently viewed entries are dropped, the new one kept', () => {
  const now = new Date('2026-10-07T10:00:00Z');
  const views = {
    old: new Date('2025-01-01T00:00:00Z'),
    mid: new Date('2026-01-01T00:00:00Z'),
    new: new Date('2026-09-01T00:00:00Z'),
  };
  const modifier = cardLastViewsModifier(views, 'opened', now, 3);
  assert.deepStrictEqual(Object.keys(modifier.$set), ['profile.cardLastViews']);
  assert.deepStrictEqual(modifier.$set['profile.cardLastViews'], { new: views.new, mid: views.mid, opened: now });
  // Negative: below the cap nothing is rewritten.
  assert.deepStrictEqual(Object.keys(cardLastViewsModifier(views, 'opened', now, 4).$set),
    ['profile.cardLastViews.opened']);
  assert.ok(CARD_LAST_VIEWS_MAX >= 1000, 'the cap is far above a normal working set');
});

test('setCardLastViewed uses that modifier and still guards the key', () => {
  const body = bodyOf(read('models/users.js'), '  async setCardLastViewed(cardId) {');
  assert.ok(/assertSafeMapKey\(cardId\)/.test(body), 'PrototypeBleed guard kept');
  assert.ok(/cardLastViewsModifier\(views, cardId, new Date\(\)\)/.test(body));
  assert.ok(!/\$set: \{ 'profile\.cardLastViews': current \}/.test(body), 'negative: no whole-map rewrite');
});

// ---- fix 2: a card of the board on screen opens without re-creating the board ----

test('opening and closing a card on the mounted board keeps it mounted', () => {
  assert.strictEqual(mustRenderBoardLayout('B1', 'B1', 'card'), false, 'open by link / up-down keys');
  assert.strictEqual(mustRenderBoardLayout('B1', 'B1', 'board'), false, 'close, and query-only navigation');
});

test('another board, a first load or the list/swimlane routes still render (negative)', () => {
  assert.strictEqual(mustRenderBoardLayout('B1', 'B2', 'card'), true, 'a card on another board');
  assert.strictEqual(mustRenderBoardLayout(null, 'B1', 'card'), true, 'nothing mounted yet');
  assert.strictEqual(mustRenderBoardLayout('B1', 'B1', 'list'), true);
  assert.strictEqual(mustRenderBoardLayout('B1', 'B1', 'swimlane'), true);
  assert.strictEqual(mustRenderBoardLayout('B1', 'B1', 'board-short'), true);
  assert.strictEqual(mustRenderBoardLayout('B1', undefined, 'board'), true);
});

test('entering any page that is not the board forgets the mounted board (negative)', () => {
  BOARD_LAYOUT_ROUTES.forEach(name => assert.strictEqual(mountedBoardAfterEnter('B1', name), 'B1', name));
  ['rules', 'shortcuts', 'home', 'allboards', 'atSignIn', 'admin-setting', undefined]
    .forEach(name => assert.strictEqual(mountedBoardAfterEnter('B1', name), null, String(name)));
});

test('every route that renders the board goes through renderBoardLayout', () => {
  const router = read('config/router.js');
  assert.ok(/FlowRouter\.triggers\.enter\(\[\s*\(\{ route \}\) => \{\s*mountedBoardId = mountedBoardAfterEnter\(mountedBoardId, route && route\.name\);/.test(router),
    'leaving the board for another page is tracked');
  const card = bodyOf(router, "name: 'card',");
  assert.ok(/renderBoardLayout\(this, params\.boardId, 'card'\)/.test(card));
  const board = bodyOf(router, "name: 'board',");
  assert.ok(/renderBoardLayout\(this, currentBoard, 'board'\)/.test(board));
  // Negative: the only place the board content is rendered is renderBoardLayout,
  // so no route can re-create every minicard behind its back.
  const direct = router.match(/render\('defaultLayout', \{\s*content: 'board',?\s*\}\)/g) || [];
  assert.strictEqual(direct.length, 1, 'one render of the board content, inside renderBoardLayout');
  assert.ok(/function renderBoardLayout\(ctx, boardId, routeName\) \{\s*if \(mustRenderBoardLayout/.test(router));
});

// ---- fix 3: the popup-card Session keys are cleared to null, never deleted ----

// Every .js file under these directories, skipping generated output.
function sourceFiles(dirs) {
  const out = [];
  const walk = dir => {
    fs.readdirSync(path.join(repoRoot, dir), { withFileTypes: true }).forEach(entry => {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!['node_modules', '_build', '.build', '.tools'].includes(entry.name)) walk(rel);
      } else if (/\.js$/.test(entry.name)) out.push(rel);
    });
  };
  dirs.forEach(walk);
  return out;
}

test('a card close and the routes agree on null for popupCardId/popupCardBoardId', () => {
  const listBody = bodyOf(read('client/components/lists/listBody.js'), 'function closeCardWindow(');
  assert.ok(/Session\.set\('popupCardId', null\)/.test(listBody));
  assert.ok(/Session\.set\('popupCardBoardId', null\)/.test(listBody));
  assert.ok(/Session\.set\('popupCardBoardId', null\)/.test(bodyOf(read('config/router.js'), "name: 'card',")));
});

test('nowhere deletes them: a delete then set(null) re-runs every minicard (negative)', () => {
  const offenders = sourceFiles(['client', 'config', 'models', 'imports'])
    .filter(file => /Session\.delete\(\s*['"]popupCard(Board)?Id['"]/.test(read(file)));
  assert.deepStrictEqual(offenders, []);
});

// ---- fix 4: sortable options are set only when their value changed ----

test('an option already at the wanted value is not set again', () => {
  const current = { handle: '.minicard', disabled: false, items: '.swimlane' };
  const read = key => current[key];
  assert.deepStrictEqual(changedSortableOptions(read, { handle: '.minicard', disabled: false }), {});
  assert.deepStrictEqual(changedSortableOptions(read, { handle: '.handle', disabled: false }), { handle: '.handle' });
  assert.deepStrictEqual(changedSortableOptions(read, { disabled: true, items: '.swimlane' }), { disabled: true });
});

test('a changed preference or role still reaches the sortable (negative)', () => {
  const read = () => undefined;
  assert.deepStrictEqual(changedSortableOptions(read, { handle: '.handle', disabled: true }),
    { handle: '.handle', disabled: true }, 'a fresh sortable gets every option');
  assert.deepStrictEqual(changedSortableOptions(() => false, { disabled: 0 }), { disabled: 0 },
    'compared strictly, so a different type is a change');
});

test('every board sortable autorun goes through setSortableOptions', () => {
  const list = read('client/components/lists/list.js');
  assert.ok(/setSortableOptions\(\$cards, \{\s*handle:/.test(list), 'the per-list cards sortable');
  const swimlanes = read('client/components/swimlanes/swimlanes.js');
  assert.strictEqual((swimlanes.match(/setSortableOptions\(\$parent, \{/g) || []).length, 2, 'both lists sortables');
  const boardBody = read('client/components/boards/boardBody.js');
  assert.ok(/setSortableOptions\(\$swimlanesDom, \{/.test(boardBody), 'the swimlanes sortable');
  // Negative: no autorun sets handle/disabled/items one call at a time any more.
  [['client/components/lists/list.js', list], ['client/components/swimlanes/swimlanes.js', swimlanes],
    ['client/components/boards/boardBody.js', boardBody]].forEach(([file, src]) => {
    assert.ok(!/\.sortable\(\s*'option',\s*'(handle|disabled|items)'/.test(src), `${file} sets an option directly`);
  });
});

test('the swimlanes autorun no longer follows the open card (negative)', () => {
  const boardBody = read('client/components/boards/boardBody.js');
  const at = boardBody.indexOf('setSortableOptions($swimlanesDom, {');
  const call = boardBody.slice(at, boardBody.indexOf('});', at));
  assert.ok(/disabled: !Utils\.canModifyBoard\(\)/.test(call));
  assert.ok(!/canModifyCard\(\)/.test(call), 'canModifyCard() with no card reads Session currentCard');
});

// ---- fix 5: the snap defaults to auto, like every other platform ----

test('the snap default is auto, so a big board loads only its visible cards', () => {
  const config = read('snap-src/bin/config');
  assert.match(config, /^DEFAULT_CARDS_LOADING="auto"$/m);
  const description = config.match(/^DESCRIPTION_CARDS_LOADING="(.*)"$/m)[1];
  assert.ok(/'auto' \(default/.test(description), 'the description names auto as the default');
  const { resolveCardsLoadingMode, effectiveBoardCardsMode } = require('../models/lib/cardsLoading.js');
  assert.strictEqual(resolveCardsLoadingMode('auto'), 'auto');
  assert.strictEqual(effectiveBoardCardsMode('auto', 2000, 500), 'lazy');
  assert.strictEqual(effectiveBoardCardsMode('auto', 100, 500), 'all');
});

test('no snap text still calls all the default or points at a removed toggle (negative)', () => {
  const config = read('snap-src/bin/config');
  assert.ok(!/^DEFAULT_CARDS_LOADING="all"$/m.test(config));
  assert.ok(!/'all' \(default/.test(config));
  const help = read('snap-src/bin/wekan-help');
  assert.ok(!/cards-loading[^\n]*Admin Panel \/ Features|Card loading mode[^\n]*Admin Panel \/ Features/.test(help),
    'there is no Admin Panel toggle for it any more');
  assert.ok(/cards-loading='auto'/.test(help), 'and the help says how to go back to the default');
  assert.ok(!/all\s+\(default\)/.test(read('server/cards-loading.js')));
});

// ---- fix 6: opening a card does not leave a subscription behind ----

test('card details subscribes to unsaved-edits through the template', () => {
  const cardDetails = read('client/components/cards/cardDetails.js');
  const onCreated = bodyOf(cardDetails, 'Template.cardDetails.onCreated(');
  assert.ok(/this\.subscribe\('unsaved-edits'\)/.test(onCreated));
});

test('no template lifecycle hook subscribes outside the template (negative)', () => {
  // Meteor.subscribe in onCreated/onRendered runs in no computation, so the
  // subscription outlives the template - one more per card opened.
  const offenders = [];
  sourceFiles(['client']).forEach(file => {
    const src = read(file);
    let at = 0;
    const hook = /Template\.[A-Za-z0-9_]+\.(onCreated|onRendered)\(/g;
    let match;
    while ((match = hook.exec(src))) {
      at = match.index;
      const body = bodyOf(src.slice(at), match[0]);
      // Allowed inside an autorun (stopped with the template); a top-level bare one is not.
      const withoutAutoruns = body.replace(/\.autorun\([\s\S]*?\n {2}\}\);/g, '');
      if (/^ {2}Meteor\.subscribe\('unsaved-edits'/m.test(withoutAutoruns)) offenders.push(file);
    }
  });
  assert.deepStrictEqual(offenders, []);
});

console.log(`largeBoardCardOpen: ${passed} passed`);
