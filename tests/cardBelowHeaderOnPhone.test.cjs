'use strict';

// A phone in desktop mode: the opened card starts below the (multi-row) header bar and a
// dragged place is kept. Run: node tests/cardBelowHeaderOnPhone.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const css = fs.readFileSync(path.join(__dirname, '..', 'client/components/cards/cardDetails.css'), 'utf8');
const block = /@media screen and \(max-width: 800px\) \{\n  body\.desktop-mode \.card-details:not\(\.card-details-popup\):not\(\[style\*="top"\]\),[^{]*\{([^}]*)\}/.exec(css);

test('below 801px the desktop-mode card starts at the measured header height', () => {
  assert.ok(block, 'the phone rule exists');
  assert.match(block[1], /top: calc\(var\(--wekan-header-height, 0px\) \+ 8px\) !important;/);
});

test('negative: a card with an inline top (dragged) never matches it, so the drag sticks', () => {
  const selectors = css.slice(css.indexOf(block[0]), css.indexOf(block[1])).replace(/\/\*.*?\*\//g, '').split(',');
  assert.ok(selectors.every(s => /:not\(\[style\*="top"\]\)|card-details-maximized/.test(s)));
  // the variable is published by Utils, so the rule has a source
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'client/lib/utils.js'), 'utf8'), /--wekan-header-height/);
});

test('a card opened as a popup starts below the header too, not at the top of the window', () => {
  assert.ok(block[0].includes('.card-details.card-details-popup:not([style*="top"])'));
});
