'use strict';

// wekan/wekan#3144: "Activities for archived card displayed as undefined on board
// settings."
//   1. move a card around, so it has some activities
//   2. archive it
//   3. open the board sidebar - the sentences that named that card name nothing
// "Instead undefined, suggest to display '{{ card title }} [archived]'."
// Run: node tests/activityCardLink.test.cjs
//
// The feed asked `activity.card()` and rendered its title. An archived card is not
// published to the client, so the lookup returned nothing and each sentence was
// built around a hole - a card that still exists, still has a title, and whose
// activities are right there on the page, went nameless in its own history.
//
// The activity already knew the title in most cases: createCard, moveCard and
// moveCardBoard have stored `cardTitle` for years. So the fix is not to publish
// archived cards to every sidebar - it is to read what the activity recorded, and
// to record it on the two activities that were not storing it, which are exactly
// the ones about archiving.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const { activityCardLinkData, recordedTitle } = require('../models/lib/activityCardLink.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('activityCardLink:');

const ACTIVITY = {
  _id: 'a1',
  activityType: 'archivedCard',
  boardId: 'board-1',
  cardId: 'card-1',
  cardTitle: 'Buy milk',
};

test('an archived card that IS here is named and marked', () => {
  const link = activityCardLinkData(ACTIVITY, { _id: 'card-1', boardId: 'board-1', title: 'Buy milk', archived: true });
  assert.strictEqual(link.title, 'Buy milk');
  assert.strictEqual(link.archived, true, 'so the feed can add the [archived] the reporter asked for');
  assert.strictEqual(link.url, '/b/board-1/board/card-1', 'and it is still a link');
});

test('a card this client cannot see falls back to the recorded title - the reported case', () => {
  const link = activityCardLinkData(ACTIVITY, null);
  assert.strictEqual(link.title, 'Buy milk',
    'the activity recorded the title; nothing else was needed to name the card');
  assert.strictEqual(link.url, '/b/board-1/board/card-1',
    'and the URL is built from the ids the activity carries, so the link still works');
  assert.strictEqual(link.fromActivity, true);
});

test('a missing card is NOT called archived (negative)', () => {
  // It usually is - a deleted card takes its activities with it - but with lazy
  // card loading a card can simply be outside the window this client was sent,
  // and "archived" would then be a statement the feed cannot support.
  const link = activityCardLinkData(ACTIVITY, null);
  assert.strictEqual(link.archived, false);
});

test('the LIVE title wins over the recorded one', () => {
  // A card renamed since the activity happened should read as it reads now.
  const link = activityCardLinkData(ACTIVITY, { _id: 'card-1', boardId: 'board-1', title: 'Buy oat milk' });
  assert.strictEqual(link.title, 'Buy oat milk');
  assert.strictEqual(link.fromActivity, false);
});

test('the board slug is used when the board document is at hand', () => {
  const link = activityCardLinkData(ACTIVITY, { _id: 'card-1', boardId: 'board-1', title: 'x' },
    { _id: 'board-1', slug: 'shopping' });
  assert.strictEqual(link.url, '/b/board-1/shopping/card-1');
});

test('nothing to name returns null, so the caller can say "this card" (negative)', () => {
  // An old activity from before the titles were recorded, on a card this client
  // cannot see. There is no title anywhere - and the answer to that is a word,
  // not an empty gap in the middle of a sentence.
  assert.strictEqual(activityCardLinkData({ _id: 'a', cardId: 'c', boardId: 'b' }, null), null);
  assert.strictEqual(activityCardLinkData(null, null), null);
  assert.strictEqual(activityCardLinkData(undefined, undefined), null);
});

test('junk titles are not titles (negative)', () => {
  for (const junk of ['', '   ', null, 0, 42, {}, []]) {
    assert.strictEqual(recordedTitle({ cardTitle: junk }), null, `accepted ${JSON.stringify(junk)}`);
    assert.strictEqual(activityCardLinkData({ cardId: 'c', boardId: 'b', cardTitle: junk }, null), null);
  }
  // A card document with a junk title falls back to the activity's.
  const link = activityCardLinkData(ACTIVITY, { _id: 'card-1', boardId: 'board-1', title: '  ' });
  assert.strictEqual(link.title, 'Buy milk');
});

test('an activity with no cardId still names the card, without a link', () => {
  const link = activityCardLinkData({ cardTitle: 'Orphaned' }, null);
  assert.strictEqual(link.title, 'Orphaned');
  assert.strictEqual(link.url, null, 'nothing to link to, and no "/b/undefined/..." invented');
});

// ── the two ends of it ──────────────────────────────────────────────────────
test('archiving a card records its title with the activity', () => {
  const cards = read('models/cards.js');
  const at = cards.indexOf("activityType: 'archivedCard'");
  assert.notStrictEqual(at, -1, 'the archive activity is still written here');
  const block = cards.slice(at, at + 500);
  assert.ok(/cardTitle: doc\.title/.test(block),
    'the one activity guaranteed to be about a card the client can no longer look '
    + 'up has to carry the title');
  const restored = cards.indexOf("activityType: 'restoredCard'");
  assert.ok(/cardTitle: doc\.title/.test(cards.slice(restored, restored + 500)),
    'and its opposite, so a restore reads the same way');
});

test('the feed asks the shared rule, and every call site passes the activity', () => {
  const feed = read('client/components/activities/activities.js');
  assert.ok(/activityCardLinkData/.test(feed), 'the feed uses the shared decision');
  assert.ok(!/createCardLink\(this\.activity\.card\(\)/.test(feed),
    'no call site may pass only the card - the activity is what knows the title '
    + 'when the card is gone');
  const fn = feed.slice(feed.indexOf('function createCardLink('));
  assert.ok(/TAPi18n\.__\('archived'\)/.test(fn),
    'the [archived] marker is translated, not an English word in a template');
  assert.ok(/TAPi18n\.__\('this-card'\)/.test(fn),
    'and the last-resort wording is translated too');
  assert.ok(/sanitizeHTML/.test(fn),
    'a title from the database is still sanitised before it reaches the page');
});

test('the marker and the fallback use keys that exist in en.i18n.json', () => {
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.strictEqual(typeof en.archived, 'string', 'the "archived" key must exist');
  assert.strictEqual(typeof en['this-card'], 'string', 'and "this-card"');
});

console.log(`\nactivityCardLink: ${passed} tests passed`);
