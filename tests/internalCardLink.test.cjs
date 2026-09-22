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
  const guard = details.indexOf('if (!cardSubscription?.ready()) return;');
  const missing = details.indexOf('if (!openCardIsUnavailable(card, openedBoardId)) return;');
  assert.ok(guard > 0 && missing > guard);
});
