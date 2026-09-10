'use strict';

// #3078: highlight a minicard when it has comments the current user has not
// seen yet. Run: node tests/unreadComments.test.cjs
//
// There was no per-user "last viewed" tracking anywhere in WeKan to reuse -
// searched models/cards.js, models/cardComments.js, models/watchable.js and
// the notifications' profile.notifications (which tracks per-user read state
// for ACTIVITIES, not per-card view time). The closest existing shape was
// Users' profile.collapsedCardSections - a per-user map keyed by cardId used
// for fold state - so profile.cardLastViews (models/users.js) follows it: a
// blackbox map of cardId -> Date, set by Template.cardDetails.onCreated (the
// existing card-open trigger, not a new one) and read by the minicard.
//
// The decision itself - is THIS card unread for THIS user - is pure and
// dependency-free in models/lib/unreadComments.js so it can be tested here
// without a server, a database or Blaze.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const { hasUnreadComments } = require('../models/lib/unreadComments.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('unreadComments:');

test('a card with a comment created after last-viewed is flagged', () => {
  const lastViewedAt = new Date('2026-01-01T00:00:00Z');
  const comments = [
    { createdAt: new Date('2025-12-31T00:00:00Z') }, // before - does not count
    { createdAt: new Date('2026-01-02T00:00:00Z') }, // after - this is the unread one
  ];
  assert.strictEqual(hasUnreadComments(comments, lastViewedAt), true);
});

test('a card with only comments made before last-viewed is not flagged (negative)', () => {
  const lastViewedAt = new Date('2026-01-01T00:00:00Z');
  const comments = [
    { createdAt: new Date('2025-06-01T00:00:00Z') },
    { createdAt: new Date('2025-12-31T23:59:59Z') },
  ];
  assert.strictEqual(hasUnreadComments(comments, lastViewedAt), false);
});

test('a comment created at exactly the last-viewed instant is not unread (negative)', () => {
  const lastViewedAt = new Date('2026-01-01T00:00:00Z');
  const comments = [{ createdAt: new Date('2026-01-01T00:00:00Z') }];
  assert.strictEqual(hasUnreadComments(comments, lastViewedAt), false);
});

test('a card with zero comments is never flagged, viewed or not (negative)', () => {
  assert.strictEqual(hasUnreadComments([], null), false);
  assert.strictEqual(hasUnreadComments([], new Date()), false);
  assert.strictEqual(hasUnreadComments(undefined, null), false);
});

test('a never-viewed card with any comment is flagged - nothing to compare against', () => {
  const comments = [{ createdAt: new Date('2020-01-01T00:00:00Z') }];
  assert.strictEqual(hasUnreadComments(comments, null), true);
  assert.strictEqual(hasUnreadComments(comments, undefined), true);
});

test('a malformed lastViewedAt is treated as never-viewed rather than throwing', () => {
  const comments = [{ createdAt: new Date('2020-01-01T00:00:00Z') }];
  assert.strictEqual(hasUnreadComments(comments, 'not-a-date'), true);
});

test('a comment missing createdAt never counts as unread (negative)', () => {
  const lastViewedAt = new Date('2026-01-01T00:00:00Z');
  assert.strictEqual(hasUnreadComments([{ text: 'no createdAt' }], lastViewedAt), false);
  // ...but the card is still flagged if it was never viewed, because it does
  // have a comment - just one whose age cannot be judged.
  assert.strictEqual(hasUnreadComments([{ text: 'no createdAt' }], null), true);
});

test('opening the card records a last-viewed timestamp that clears the flag', () => {
  // Simulate the round trip the real code takes: setCardLastViewed() writes
  // profile.cardLastViews[cardId] = new Date(); the minicard then reads it
  // back with getCardLastViewedAt() and asks hasUnreadComments().
  const cardId = 'card1';
  const profile = { cardLastViews: {} };
  function setCardLastViewed(id) { profile.cardLastViews[id] = new Date(); }
  function getCardLastViewedAt(id) { return profile.cardLastViews[id] || null; }

  const oldComment = { createdAt: new Date(Date.now() - 60 * 60 * 1000) };
  assert.strictEqual(
    hasUnreadComments([oldComment], getCardLastViewedAt(cardId)),
    true,
    'never viewed - flagged because it has a comment',
  );

  setCardLastViewed(cardId);
  assert.strictEqual(
    hasUnreadComments([oldComment], getCardLastViewedAt(cardId)),
    false,
    'just viewed - the existing comment is now in the past, so it clears',
  );

  const newComment = { createdAt: new Date(Date.now() + 1000) };
  assert.strictEqual(
    hasUnreadComments([oldComment, newComment], getCardLastViewedAt(cardId)),
    true,
    'a comment added after that view is unread again',
  );
});

test('models/users.js reuses the same shape as collapsedCardSections, not a new mechanism', () => {
  const users = read('models/users.js');
  assert.ok(/'profile\.cardLastViews'/.test(users),
    'a dedicated per-user, per-card map, named for what it stores');
  assert.ok(/getCardLastViewedAt\(cardId\)/.test(users) && /setCardLastViewed\(cardId\)/.test(users),
    'a getter/setter pair next to getCollapsedCardSection/setCollapsedCardSection');
  assert.ok(!/CardLastViews = new Mongo\.Collection/.test(users),
    'not a whole new top-level collection - see the CLAUDE.md scope note in this file');
});

test('opening a card (Template.cardDetails onCreated) is what clears the flag', () => {
  const cardDetails = read('client/components/cards/cardDetails.js');
  const onCreatedIdx = cardDetails.indexOf('Template.cardDetails.onCreated');
  assert.ok(onCreatedIdx >= 0, 'onCreated exists');
  const body = cardDetails.slice(onCreatedIdx, onCreatedIdx + 3000);
  assert.ok(/setCardLastViewed\(openedCardId\)/.test(body),
    'the existing card-open hook is reused, not a new open event');
});

test('the minicard flags itself from the same pure decision, not a re-implementation', () => {
  const minicard = read('client/components/cards/minicard.js');
  assert.ok(/from '\/models\/lib\/unreadComments'/.test(minicard),
    'imports the shared decision');
  assert.ok(/hasUnreadComments\(comments, user\.getCardLastViewedAt\(card\._id\)\)/.test(minicard),
    'and calls it with this card\'s own comments and last-viewed time');

  const jade = read('client/components/cards/minicard.jade');
  assert.ok(/class="\{\{#if hasUnreadComments\}\}minicard-unread-comments\{\{\/if\}\}"/.test(jade),
    'the template applies a class, not a background swap that would fight colorStyle');

  const css = read('client/components/cards/minicard.css');
  assert.ok(/\.minicard\.minicard-unread-comments/.test(css),
    'and the class has a rule');
  assert.ok(!/\.minicard\.minicard-unread-comments\s*\{[^}]*background-color/.test(css),
    'the highlight must not be a background-color fill that could hide a label swatch (negative)');
});

test('the tooltip key exists in English and is a real, non-placeholder label', () => {
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.strictEqual(en['card-has-unread-comments'], 'Has unread comments');
});

console.log(`\nunreadComments: ${passed} tests passed`);
