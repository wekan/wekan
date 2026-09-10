'use strict';

// My Attachments (#3461) - a third sibling of My Cards / My Due Cards in the
// member menu, listing every attachment the CURRENT user has uploaded, across
// every board they can see.
//
// Two kinds of coverage:
//   * the query logic, tested as arithmetic (no server, no database) - own
//     uploads only, and only on a board the caller says is visible;
//   * the wiring - the menu entry, the route, the page title and the
//     publication - checked by reading the actual source, the same way
//     tests/pageSidebar.test.cjs and tests/headerBars.test.cjs check My
//     Cards / My Due Cards.
//
// Run: node tests/myAttachments.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const {
  myAttachmentsSelector,
  myAttachmentsPageOptions,
  DEFAULT_LIMIT,
  MAX_LIMIT,
} = require('../models/lib/myAttachmentsQuery');

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

console.log('myAttachments:');

test('the selector matches only the uploader\'s OWN attachments', () => {
  const selector = myAttachmentsSelector('user1', ['boardA']);
  assert.strictEqual(selector.userId, 'user1');
  // Never "any uploader on a visible board" - only this user's uploads.
  assert.ok(!('meta.userId' in selector));
});

test('and only on a board the caller says is visible', () => {
  const selector = myAttachmentsSelector('user1', ['boardA', 'boardB']);
  assert.deepStrictEqual(selector['meta.boardId'], { $in: ['boardA', 'boardB'] });
});

test('a user who can see no board gets nothing to query, not an unfiltered one', () => {
  // The dangerous default is a selector with no board restriction at all -
  // that would return every user's attachment on every board. Nothing to see
  // must mean nothing queried, never an accidentally-open selector.
  assert.strictEqual(myAttachmentsSelector('user1', []), null);
  assert.strictEqual(myAttachmentsSelector('user1', undefined), null);
  assert.strictEqual(myAttachmentsSelector('user1', null), null);
});

test('no signed-in user gets nothing, whatever boards are passed', () => {
  assert.strictEqual(myAttachmentsSelector('', ['boardA']), null);
  assert.strictEqual(myAttachmentsSelector(null, ['boardA']), null);
  assert.strictEqual(myAttachmentsSelector(undefined, ['boardA']), null);
});

test('a non-string board id in the list is dropped, not passed through to Mongo', () => {
  const selector = myAttachmentsSelector('user1', ['boardA', null, 42, '', 'boardB']);
  assert.deepStrictEqual(selector['meta.boardId'].$in, ['boardA', 'boardB']);
});

test('paging is clamped the same way dueCards\' is - never unbounded', () => {
  assert.deepStrictEqual(myAttachmentsPageOptions(undefined, undefined),
    { limit: DEFAULT_LIMIT, skip: 0 });
  assert.deepStrictEqual(myAttachmentsPageOptions(10000, -5), { limit: MAX_LIMIT, skip: 0 });
  // 0 is falsy, so it falls back to the default - the same `Math.floor(limit)
  // || 200` behaviour dueCards' own limit has.
  assert.deepStrictEqual(myAttachmentsPageOptions(0, 3), { limit: DEFAULT_LIMIT, skip: 3 });
  assert.deepStrictEqual(myAttachmentsPageOptions(50, 100), { limit: 50, skip: 100 });
});

test('the menu has a My Attachments entry, right after My Due Cards', () => {
  const jade = read('client/components/users/userHeader.jade');
  const myCardsAt = jade.indexOf('js-my-cards');
  const dueCardsAt = jade.indexOf('js-due-cards');
  const myAttachmentsAt = jade.indexOf('js-my-attachments');
  const globalSearchAt = jade.indexOf('js-global-search');
  assert.notStrictEqual(myAttachmentsAt, -1, 'the entry must exist');
  assert.ok(myCardsAt < dueCardsAt && dueCardsAt < myAttachmentsAt && myAttachmentsAt < globalSearchAt,
    'My Attachments sits right after My Due Cards, before Global Search');
  assert.match(jade, /a\.js-my-attachments\(href="\{\{pathFor 'my-attachments'\}\}"\)/);
  assert.match(jade, /\| \{\{_ 'my-attachments'\}\}/);

  const js = read('client/components/users/userHeader.js');
  assert.match(js, /'click \.js-my-attachments'\(\) \{\s*Popup\.back\(\);/,
    'clicking it closes the member menu, like My Cards and My Due Cards');
});

test('the route exists and renders the page, signed-in only', () => {
  const router = read('config/router.js');
  const at = router.indexOf("FlowRouter.route('/my-attachments'");
  assert.notStrictEqual(at, -1);
  const body = router.slice(at, at + 500);
  assert.match(body, /name: 'my-attachments'/);
  assert.match(body, /triggersEnter: \[ensureSignedInUnlessSandstorm\]/);
  assert.match(body, /content: 'myAttachments'/);
});

test('the page template and its handlers exist and are registered', () => {
  const jade = read('client/components/main/myAttachments.jade');
  assert.match(jade, /template\(name="myAttachments"\)/);

  const js = read('client/components/main/myAttachments.js');
  assert.match(js, /Template\.myAttachments\.onCreated/);
  assert.match(js, /Meteor\.subscribe\(\s*'myAttachments'/);
  // Same cross-board "open card in place" mechanism myCards.js uses (#3640).
  assert.match(js, /'click \.js-my-attachment-card'/);
  assert.match(js, /Meteor\.subscribe\('popupCardData', cardId/);
  assert.match(js, /Popup\.open\('cardDetails'\)/);

  const main = read('client/features/main.js');
  for (const f of [
    "'/client/components/main/myAttachments.jade'",
    "'/client/components/main/myAttachments.js'",
  ]) {
    assert.ok(main.includes(f), `${f} must be imported, or the template does not exist at runtime`);
  }
});

test('the first header bar names the page', () => {
  const { PAGE_TITLE_KEYS } = require('../models/lib/pageTitles');
  assert.strictEqual(PAGE_TITLE_KEYS['my-attachments'], 'my-attachments');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.strictEqual(en['my-attachments'], 'My Attachments');
});

test('the server publication filters by uploader AND board visibility, not one alone', () => {
  const pub = read('server/publications/cards.js');
  const at = pub.indexOf("publishComposite('myAttachments'");
  assert.notStrictEqual(at, -1, 'the publication must exist');
  const body = pub.slice(at, pub.indexOf('\n});', at) + 4);

  assert.match(body, /if \(!userId\)/, 'refuses an anonymous subscriber');
  assert.match(body, /boardVisibilitySelectors\(/,
    'uses the SAME board-visibility rule as the rest of the app (GHSA-gwc4-fw7p-gw58), not a hand-rolled duplicate');
  assert.match(body, /myAttachmentsSelector\(userId, userBoards\)/,
    'the selector is built from the resolved userId and the resolved visible-board set - never an unfiltered query');

  // Every one of the composite's own board ids comes from meta.*, matching
  // the attachment's own boardId/cardId/listId/swimlaneId - never a caller-
  // supplied id that could point somewhere the subscriber cannot see.
  for (const field of ['cardId', 'boardId', 'listId', 'swimlaneId']) {
    assert.ok(body.includes(`attachment.meta && attachment.meta.${field}`),
      `the ${field} child lookup must come from the attachment's own meta, not an argument`);
  }
});

for (const [name, fn] of tests) {
  try { fn(); passed++; console.log('  ok -', name); }
  catch (err) { console.error(`  FAIL - ${name}\n    ${err.message}`); process.exitCode = 1; }
}
console.log(`\nmyAttachments: ${passed} tests passed`);
