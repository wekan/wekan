'use strict';

// Unit tests for the #4758 card-link redirect decision
// (models/lib/cardLinkRedirect.js): a card link keeps working after the card is
// moved to another board. Run: node tests/cardLinkRedirect.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { cardBoardRedirectTarget } = require('../models/lib/cardLinkRedirect');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// ── the moved-card case (the feature) ───────────────────────────────────────
check('#4758: a card whose board differs from the URL redirects to its board', () => {
  assert.strictEqual(
    cardBoardRedirectTarget('OLD_BOARD', { _id: 'c1', boardId: 'NEW_BOARD' }),
    'NEW_BOARD',
  );
});

// ── the normal case: no redirect ────────────────────────────────────────────
check('a card already on the URL board does not redirect', () => {
  assert.strictEqual(
    cardBoardRedirectTarget('B1', { _id: 'c1', boardId: 'B1' }),
    null,
  );
});

// ── not resolvable: stay on the URL board (card hidden / gone / not loaded) ──
check('a missing / not-yet-loaded card does not redirect (null)', () => {
  assert.strictEqual(cardBoardRedirectTarget('B1', null), null);
  assert.strictEqual(cardBoardRedirectTarget('B1', undefined), null);
});
check('a card doc without a usable boardId does not redirect', () => {
  assert.strictEqual(cardBoardRedirectTarget('B1', {}), null);
  assert.strictEqual(cardBoardRedirectTarget('B1', { boardId: '' }), null);
  assert.strictEqual(cardBoardRedirectTarget('B1', { boardId: 42 }), null);
  assert.strictEqual(cardBoardRedirectTarget('B1', { boardId: null }), null);
});
check('no redirect loop: after landing on the card board, target is null again', () => {
  // 1st hit on the old URL redirects to NEW_BOARD...
  assert.strictEqual(cardBoardRedirectTarget('OLD', { boardId: 'NEW' }), 'NEW');
  // ...the redirect re-runs the route with boardId=NEW, which now matches -> stop.
  assert.strictEqual(cardBoardRedirectTarget('NEW', { boardId: 'NEW' }), null);
});

// ── source guard: the router drives it via the permission-checked 'card' sub ─
check('router wires the redirect via the card publication (permission-checked)', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'config', 'router.js'), 'utf8');
  assert.ok(/maybeRedirectMovedCard\(params\.boardId, params\.cardId\)/.test(src),
    'the card route must call maybeRedirectMovedCard');
  assert.ok(/Meteor\.subscribe\('card', cardId\)/.test(src),
    'must resolve the card via the permission-checked `card` publication');
  assert.ok(/cardBoardRedirectTarget\(urlBoardId, ReactiveCache\.getCard\(cardId\)\)/.test(src),
    'must decide via the pure cardBoardRedirectTarget helper');
  assert.ok(/FlowRouter\.getParam\('cardId'\) === cardId/.test(src),
    'must guard the redirect against a stale check after navigating away');
});

console.log(`\ncardLinkRedirect: ${passed} checks passed`);
