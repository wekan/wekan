'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const { test } = require('node:test');
const { internalCardPath } = require('../models/lib/internalCardLink');

const current = 'https://wekan.example/b/board1/board';

test('internal card links keep their path and open in the current tab', () => {
  assert.equal(internalCardPath('https://wekan.example/b/board2/other/card3?x=1#comment', current),
    '/b/board2/other/card3?x=1#comment');
  assert.equal(internalCardPath('/b/board1/board/card4', current), '/b/board1/board/card4');
  const viewer = fs.readFileSync('client/components/main/editor.js', 'utf8');
  assert.match(viewer, /FlowRouter\.go\(cardPath\)/);
});

test('external links and board links keep their existing new-tab behavior', () => {
  assert.equal(internalCardPath('https://other.example/b/board1/board/card4', current), null);
  assert.equal(internalCardPath('/b/board1/board', current), null);
  assert.equal(internalCardPath('not a card link', current), null);
  const viewer = fs.readFileSync('client/components/main/editor.js', 'utf8');
  assert.match(viewer, /window\.open\(href, '_blank', 'noopener'\)/);
});

test('card removal waits until the destination card subscription is ready', () => {
  const details = fs.readFileSync('client/components/cards/cardDetails.js', 'utf8');
  assert.match(details, /this\.subscribe\('card', openedCardId\)/);
  // Since #6808 the readiness goes into openCardCloseDecision, which waits
  // ('wait') until the subscription is ready (tests/openCardClose6808.test.cjs).
  assert.match(details, /subReady: Boolean\(cardSubscription\?\.ready\(\)\),/);
  const { openCardCloseDecision } = require('../models/lib/openCardPresence');
  assert.equal(openCardCloseDecision({ subReady: false, connected: true, loggingIn: false, card: null, openedBoardId: 'b1' }), 'wait');
});
