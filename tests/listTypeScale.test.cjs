'use strict';

// #6465: a list is a heading with items under it, and the sizes said otherwise.
//
// Reported by email with a screenshot: the "Add card" link and the "Add" button
// were bigger than the cards, and bigger than the list's own name. The
// measurements agreed - the list heading was 14px while a minicard title and the
// "Add card" link both inherited the 16px document size, and the Add button was a
// 50px-tall slab. So the column was labelled in fine print, the affordance for
// making a card shouted louder than the cards, and the biggest thing on screen
// while typing was a button.
//
// Sizes are relative, like h1 > h2 > body: what matters is the ORDER, not the
// exact numbers, so that is what this pins.
//
//   list heading  >  minicard title  >=  "Add card" link
//
// Run: node tests/listTypeScale.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const listCss = read('client/components/lists/list.css');
const minicardCss = read('client/components/cards/minicard.css');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Comments out, and @media blocks out with them: a phone and a print sheet have
// their own scales (the .mobile-view rules are deliberately much larger), and
// what is pinned here is the BASE one a desktop board is read at.
function baseCss(css) {
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let out = '';
  for (let i = 0; i < noComments.length; i += 1) {
    if (noComments.startsWith('@media', i)) {
      // Skip to the matching close brace of the at-rule.
      let depth = 0;
      let j = noComments.indexOf('{', i);
      for (; j < noComments.length; j += 1) {
        if (noComments[j] === '{') depth += 1;
        else if (noComments[j] === '}') {
          depth -= 1;
          if (depth === 0) break;
        }
      }
      i = j;
      continue;
    }
    out += noComments[i];
  }
  return out;
}

// The font-size that WINS for a selector, in px at the default root size: every
// rule whose selector list contains it exactly, last one first, since equal
// specificity means the later rule applies. `.list-header .list-header-name` has
// two rules in list.css, and reading the first one found the one that sets no size
// at all.
//
// rem counts, and px counts (#6587). The three sizes are written in rem now so
// they follow Member Settings / Font size, which sets the ROOT font size - a px
// size cannot, which is why a board's type was the one part of the UI that ignored
// the setting. 1rem is 16px at the default, so the scale reads the same either way
// and the ORDER below is what is actually pinned.
function fontSize(css, selector) {
  const base = baseCss(css);
  const sizes = [];
  for (const m of base.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = m[1].split(',').map(x => x.trim().replace(/\s+/g, ' '));
    if (!selectors.includes(selector)) continue;
    const size = /font-size:\s*(\d+(?:\.\d+)?)(px|rem)/.exec(m[2]);
    if (size) sizes.push(size[2] === 'rem' ? Number(size[1]) * 16 : Number(size[1]));
  }
  assert.ok(sizes.length > 0,
    `${selector} sets no px or rem font-size outside @media - it would inherit the `
    + 'document size, which is how this went wrong in the first place');
  return sizes[sizes.length - 1];
}

// Whether a selector's winning size is one the user's font-size preset can scale.
function scalesWithRootFontSize(css, selector) {
  const base = baseCss(css);
  let unit = null;
  for (const m of base.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = m[1].split(',').map(x => x.trim().replace(/\s+/g, ' '));
    if (!selectors.includes(selector)) continue;
    const size = /font-size:\s*(\d+(?:\.\d+)?)(px|rem|em)/.exec(m[2]);
    if (size) unit = size[2];
  }
  return unit === 'rem' || unit === 'em';
}

console.log('listTypeScale:');

const heading = fontSize(listCss, '.list-header .list-header-name');
const cardTitle = fontSize(minicardCss, '.minicard .minicard-title');
const addCard = fontSize(listCss, '.list-body .open-minicard-composer');

test('a list heading is bigger than the cards under it', () => {
  assert.ok(heading > cardTitle,
    `the list heading (${heading}px) must outrank a card title (${cardTitle}px) - `
    + 'it is the h2 of the column');
});

test('a card title is at least as big as the "Add card" affordance', () => {
  assert.ok(cardTitle >= addCard,
    `a card title (${cardTitle}px) must not be smaller than the "Add card" link `
    + `(${addCard}px): the cards are the content, the link is how you make one`);
});

test('and each of the three states its own size', () => {
  // fontSize() throws if one of them inherits instead. Stated as its own test so
  // the failure says why: an inherited size is what made the "Add card" link and
  // the card titles both land on the document's 16px, level with each other and
  // above the heading.
  for (const [what, size] of [['list heading', heading], ['card title', cardTitle],
    ['add-card link', addCard]]) {
    assert.ok(Number.isFinite(size) && size > 0, `${what} has a size of its own`);
  }
});

// #6587: "The font size setting in the user menu (Settings -> Font Size) has no
// effect on mini cards, while it correctly applies to other UI elements."
test('the board scale follows Member Settings / Font size', () => {
  for (const [what, css, selector] of [
    ['list heading', listCss, '.list-header .list-header-name'],
    ['card title', minicardCss, '.minicard .minicard-title'],
    ['add-card link', listCss, '.list-body .open-minicard-composer'],
  ]) {
    assert.ok(scalesWithRootFontSize(css, selector),
      `${what} is sized in px, so the user's font-size preset cannot reach it: the `
      + 'preset sets the ROOT font size, and only rem/em follow that');
  }
});

test('the preset is applied to the root element, and only there', () => {
  const uiFontCss = read('client/components/main/uiFont.css');
  const uiFontJs = read('client/components/main/uiFont.js');
  assert.ok(/html\.has-ui-font-size\s*\{[^}]*font-size:\s*var\(--wekan-ui-font-size\)/
    .test(uiFontCss),
    'rem is measured against the root, so the size has to be on <html> - on <body> '
    + 'it never reaches a rem-sized element');
  assert.ok(!/body\.has-ui-font-size\s*\{/.test(uiFontCss),
    'and it must be on ONE element only: on html AND body, a 130% preset compounds '
    + 'to 169% for everything sized relative to body');
  assert.ok(/ROOT_CLASSES/.test(uiFontJs) && /has-ui-font-size/.test(uiFontJs),
    'the marker class has to go on the same element the CSS matches, or the rule '
    + 'never applies at all');
});

test('the composer button is a control, not a slab', () => {
  const rule = /\.list-body \.minicards \.add-controls button \{([^}]*)\}/
    .exec(listCss.replace(/\/\*[\s\S]*?\*\//g, ''));
  assert.ok(rule, 'the add-controls button rule must be there');
  const minHeight = /min-height:\s*(\d+)px/.exec(rule[1]);
  assert.ok(minHeight, 'it sets a min-height');
  assert.ok(Number(minHeight[1]) <= 40,
    `min-height: ${minHeight[1]}px makes the Add button taller than the card it `
    + 'adds - 50px was the reported case');
  assert.ok(Number(minHeight[1]) >= 28,
    `min-height: ${minHeight[1]}px is too small to hit on a touch screen`);
});

console.log(`\n${passed} tests passed`);
