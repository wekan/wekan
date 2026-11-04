'use strict';

// The opened card covers the header bar on an iPad. iOS WebKit (iPad Safari and Chrome)
// makes every scrolling element a stacking context, so the card's z-index is compared
// only inside #content, and the header bar (#header-quick-access, z-index 1000, a flex
// item of body) was painted over the card's top row. While a card is open the header
// drops to the level of the content. tests/playwright/specs/card-over-header-ios-stacking
// .e2e.js simulates the trap and shows it in a browser.
//
// Run: node tests/cardOverHeaderStacking.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const header = read('client/components/main/header.css');

test('while a card is open the header bar is at the level of the content', () => {
  assert.match(header, /body:has\(\.card-details\) #header-quick-access \{\n  z-index: 0;\n\}/);
  // negative: it is conditional - the header keeps 1000 when no card is open
  assert.match(header, /\n#header-quick-access \{[^}]*z-index: 1000;/);
  assert.doesNotMatch(header.replace(/body:has\(\.card-details\) #header-quick-access \{\n  z-index: 0;\n\}/, ''), /#header-quick-access \{[^}]*z-index: 0;/);
});

test('it names the header that exists: #header-quick-access, not the old #header', () => {
  const rule = /body:has\(\.card-details\) (#[\w-]+)/.exec(header);
  assert.equal(rule[1], '#header-quick-access');
  assert.ok(read('client/components/main/header.jade').includes('#header-quick-access'), 'the template draws it');
  // the card's own level is above the header's normal one, so a browser without the trap needs nothing
  const card = read('client/components/cards/cardDetails.css');
  assert.match(card, /body\.desktop-mode \.card-details:not\(\.card-details-popup\) \{[^}]*z-index: 2001;/);
});

test('the content is the later sibling that paints over the header at the same level', () => {
  // #content comes after the header in the page and is positioned, so at z-index 0 against 0
  // it is painted last, which is what puts the card over the header's second row as well.
  const layouts = read('client/components/main/layouts.css');
  assert.match(layouts, /\n#content \{\n  position: relative;\n  flex: 1;/);
});
