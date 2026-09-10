'use strict';

// Regression coverage for #3640: clicking a card in the "My Cards" view
// navigated the browser away to that card's own board instead of opening the
// card detail POPUP in place, which lost the user's position in the
// cross-board My Cards list.
//
// My Cards (client/components/main/myCards.jade) renders each card as
// `a.minicard-wrapper.js-minicard(href=card.originRelativeUrl)`. The `href`
// still exists (so middle-click/ctrl-click/right-click "open in new tab"
// keep working, and there is a usable fallback with JS disabled), but a plain
// left click must be intercepted and open the shared `cardDetails` popup
// in-place instead of following the link, exactly the way the app already
// opens cards from other cross-board contexts: global search results
// (client/components/cards/resultCard.js) and the Board Table view's Edit
// link (client/components/boards/tableView.js). Both of those establish the
// mechanism this fix reuses: subscribe the `popupCardData` publication for
// the clicked card, then set the `popupCardId` / `popupCardBoardId` Session
// variables cardDetails.js/currentCard.js read, and open the `cardDetails`
// popup template.
//
// Run: node tests/myCardsInlineCardPopup.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  // eslint-disable-next-line no-console
  console.log(`ok - ${name}`);
}

const repoRoot = path.join(__dirname, '..');
const myCardsJs = fs.readFileSync(
  path.join(repoRoot, 'client/components/main/myCards.js'),
  'utf8',
);
const myCardsJade = fs.readFileSync(
  path.join(repoRoot, 'client/components/main/myCards.jade'),
  'utf8',
);
const resultCardJs = fs.readFileSync(
  path.join(repoRoot, 'client/components/cards/resultCard.js'),
  'utf8',
);
const tableViewJs = fs.readFileSync(
  path.join(repoRoot, 'client/components/boards/tableView.js'),
  'utf8',
);

test('the My Cards board-view minicard link carries the js-minicard hook', () => {
  // The link keeps its `href` (fallback / open-in-new-tab), but must also
  // carry the class the click handler below delegates on.
  assert.match(
    myCardsJade,
    /a\.minicard-wrapper\.js-minicard\(href=card\.originRelativeUrl\)/,
    'expected the card link in myCards.jade to carry the .js-minicard class',
  );
});

test('My Cards intercepts the click instead of letting the <a href> navigate', () => {
  const handlerMatch = myCardsJs.match(
    /'click \.js-minicard'\(evt\)\s*{([\s\S]*?)\n\s{2}},/,
  );
  assert.ok(handlerMatch, 'expected a `click .js-minicard` event handler in myCards.js');
  const body = handlerMatch[1];
  assert.match(
    body,
    /evt\.preventDefault\(\)/,
    'the handler must preventDefault() so the <a href> full-page navigation never happens',
  );
});

test('the handler opens the shared cardDetails popup in place, not a board route', () => {
  const handlerMatch = myCardsJs.match(
    /'click \.js-minicard'\(evt\)\s*{([\s\S]*?)\n\s{2}},/,
  );
  const body = handlerMatch[1];

  // Must NOT drive a full route change to the card's own board (that is the
  // bug being fixed: FlowRouter.go / Utils.goCardId / window.location would
  // all leave the My Cards page and lose the list underneath).
  assert.doesNotMatch(
    body,
    /FlowRouter\.go|window\.location|goCardId/,
    'the fix must not navigate away via the router or window.location',
  );

  // Must use the same cross-board popup mechanism as resultCard.js (global
  // search) and tableView.js (Board Table view edit link): subscribe
  // popupCardData, then set popupCardId/popupCardBoardId and open the
  // cardDetails popup.
  assert.match(body, /Meteor\.subscribe\(\s*'popupCardData'/);
  assert.match(body, /Session\.set\('popupCardId'/);
  assert.match(body, /Session\.set\('popupCardBoardId'/);
  assert.match(body, /Popup\.open\('cardDetails'\)/);
});

test('My Cards reuses the exact same popup mechanism as resultCard.js and tableView.js', () => {
  // Pin the SHAPE, not just this one call site (CLAUDE.md: a negative test
  // proves the fault is gone everywhere it could recur, not just here).
  [myCardsJs, resultCardJs, tableViewJs].forEach(source => {
    assert.match(source, /Meteor\.subscribe\(\s*['"]popupCardData['"]/);
    assert.match(source, /Session\.set\(['"]popupCardId['"]/);
    assert.match(source, /Session\.set\(['"]popupCardBoardId['"]/);
    assert.match(source, /Popup\.open\(['"]cardDetails['"]\)/);
  });
});

// eslint-disable-next-line no-console
console.log(`\n${passed} passed`);
