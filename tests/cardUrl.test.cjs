'use strict';

// Plain-Node unit test (no Meteor) for the card relative-URL builder.
// Run: node tests/cardUrl.test.cjs
//
// Regression guard for #6427 ("Wrong URL in email message"): card activity
// notification emails linked to '/b/undefined/board/<cardId>' instead of the
// real board. Root cause: on the SERVER, ReactiveCache.getBoard() (used by
// Card.board()) is async and returns a Promise, not a board document. The
// synchronous Card.originRelativeUrl() interpolated that Promise, so
// board._id / board.slug were undefined -> '/b/undefined/board/<cardId>'.
// The client was unaffected because there Card.board() is synchronous.

const assert = require('assert');
const { isThenable, buildCardRelativeUrl } = require('../models/lib/cardUrl');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const CARD = { _id: '5L5wwZrHmGmhW3nwj', boardId: 'dvz4P4ee5igqbaaLP' };
const BOARD = { _id: 'dvz4P4ee5igqbaaLP', slug: 'innohub' };

// --- isThenable ------------------------------------------------------------
test('isThenable: a real Promise is thenable', () => {
  assert.strictEqual(isThenable(Promise.resolve(BOARD)), true);
});

test('isThenable: a plain board object is not thenable', () => {
  assert.strictEqual(isThenable(BOARD), false);
});

test('isThenable: null/undefined are not thenable', () => {
  assert.strictEqual(isThenable(null), false);
  assert.strictEqual(isThenable(undefined), false);
});

// --- POSITIVE: client path (synchronous board object) ----------------------
test('builds the full URL with real boardId and slug (client path)', () => {
  assert.strictEqual(
    buildCardRelativeUrl(CARD, BOARD),
    '/b/dvz4P4ee5igqbaaLP/innohub/5L5wwZrHmGmhW3nwj',
  );
});

// --- POSITIVE: server path (already-awaited board passed in) ---------------
test('server callers pass the awaited board and get the correct slug', () => {
  // server/models/activities.js awaits the board before calling absoluteUrl().
  const awaitedBoard = { _id: 'dvz4P4ee5igqbaaLP', slug: 'innohub' };
  assert.strictEqual(
    buildCardRelativeUrl(CARD, awaitedBoard),
    '/b/dvz4P4ee5igqbaaLP/innohub/5L5wwZrHmGmhW3nwj',
  );
});

// --- POSITIVE: falls back to card.boardId + generic slug -------------------
test('falls back to card.boardId when no board is provided', () => {
  assert.strictEqual(
    buildCardRelativeUrl(CARD, undefined),
    '/b/dvz4P4ee5igqbaaLP/board/5L5wwZrHmGmhW3nwj',
  );
});

test('uses generic "board" slug when the board has no slug', () => {
  assert.strictEqual(
    buildCardRelativeUrl(CARD, { _id: 'dvz4P4ee5igqbaaLP' }),
    '/b/dvz4P4ee5igqbaaLP/board/5L5wwZrHmGmhW3nwj',
  );
});

// --- NEGATIVE: the exact #6427 bug must NOT reappear -----------------------
// Simulate the server bug: Card.board() returns an unawaited Promise. The
// builder must ignore the Promise and fall back to card.boardId, NEVER emitting
// '/b/undefined/board/...'.
test('NEGATIVE: an unawaited Promise board never yields /b/undefined/...', () => {
  const promiseBoard = Promise.resolve(BOARD); // what Card.board() returns on server
  const url = buildCardRelativeUrl(CARD, promiseBoard);
  assert.strictEqual(url, '/b/dvz4P4ee5igqbaaLP/board/5L5wwZrHmGmhW3nwj');
  assert.ok(!url.includes('undefined'), 'URL must not contain "undefined"');
});

// Prove the pre-fix behavior was broken: reading _id/slug straight off the
// Promise (the old code) produces exactly the '/b/undefined/board/<cardId>'
// string from the issue. This documents what we are guarding against.
test('NEGATIVE: reading fields off the Promise reproduces the #6427 bad URL', () => {
  const promiseBoard = Promise.resolve(BOARD);
  const buggyUrl = `/b/${promiseBoard._id}/${promiseBoard.slug || 'board'}/${CARD._id}`;
  assert.strictEqual(buggyUrl, '/b/undefined/board/5L5wwZrHmGmhW3nwj');
  // ...and the fixed builder does NOT produce that string.
  assert.notStrictEqual(buildCardRelativeUrl(CARD, promiseBoard), buggyUrl);
});

// --- NEGATIVE: genuinely missing data returns undefined, not a broken URL --
test('NEGATIVE: returns undefined when there is no board id at all', () => {
  assert.strictEqual(buildCardRelativeUrl({ _id: 'c1' }, undefined), undefined);
  assert.strictEqual(buildCardRelativeUrl({ _id: 'c1' }, Promise.resolve(BOARD)), undefined);
});

test('NEGATIVE: returns undefined for a missing card', () => {
  assert.strictEqual(buildCardRelativeUrl(null, BOARD), undefined);
  assert.strictEqual(buildCardRelativeUrl(undefined, BOARD), undefined);
});

console.log(`\n${passed} passing`);
