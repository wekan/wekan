'use strict';

// A card opened as a popup docks at the top of the window and covers the header bars,
// like every other opened card. The ≥801px rule gave every .card-details top: 97px,
// the room the header takes, and the desktop-mode rules that dock a card (top: 8px,
// z-index 2001) skip a popup (:not(.card-details-popup)), so a popup card opened
// below the header - and, collapsed, floated over the swimlane as a bar.
// tests/playwright/specs/card-popup-over-header.e2e.js shows it in a browser.
//
// Run: node tests/cardPopupOverHeader.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const css = fs.readFileSync(path.join(__dirname, '..', 'client/components/cards/cardDetails.css'), 'utf8');

// The body of the first @media block with this query, by brace matching.
function mediaBlock(query) {
  const start = css.indexOf(`@media ${query} {`);
  assert.ok(start >= 0, `${query} block`);
  let depth = 0;
  for (let i = css.indexOf('{', start); i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    if (css[i] === '}') { depth -= 1; if (depth === 0) return css.slice(start, i + 1); }
  }
  throw new Error('unbalanced');
}

test('a popup card docks at the top, over the header, in the wide layout', () => {
  const wide = mediaBlock('screen and (min-width: 801px)');
  const rule = /\n  \.card-details\.card-details-popup \{([^}]*)\}/.exec(wide);
  assert.ok(rule, 'a rule for the popup card in the ≥801px block');
  assert.match(rule[1], /top:\s*8px;/);
  assert.match(rule[1], /z-index:\s*2001;/, 'above the header bars (1000)');
  // negative: it is no longer left at the header's height
  assert.doesNotMatch(rule[1], /97px/);
  // the base rule still has the 97px, for a card nothing else docks - so the popup rule is what changes it
  assert.match(wide, /\.card-details \{\s+top: 97px;/);
});

test('the popup rule comes after the base rule, so it wins by order as well as by specificity', () => {
  const wide = mediaBlock('screen and (min-width: 801px)');
  assert.ok(wide.indexOf('.card-details.card-details-popup {') > wide.indexOf('.card-details {\n    top: 97px;'));
});

test('mobile mode keeps its own full-window rule, and the popup wrapper still covers the header', () => {
  // body.mobile-mode .card-details is top: 0 !important with z-index 1100 !important (#6419).
  assert.match(css, /body\.mobile-mode \.card-details \{[^}]*z-index: 1100 !important;/);
  assert.match(css, /\.pop-over\[data-popup="cardDetailsPopup"\] \{[^}]*z-index: 100000 !important;/);
  // negative: the new rule is not written with !important, so it cannot beat the mobile ones
  const wide = mediaBlock('screen and (min-width: 801px)');
  const rule = /\n  \.card-details\.card-details-popup \{([^}]*)\}/.exec(wide)[1];
  assert.doesNotMatch(rule, /!important/);
});
