'use strict';

// Plain-Node test (no Meteor) that the minicard title and the add-card composer
// keep an ISOLATED bidirectional context. Run: node tests/minicardBidiIsolation.test.cjs
//
// Regression guard for #6444: in an RTL language (e.g. Arabic) the board root is
// dir="rtl" and both the minicard title (a dir="auto" .viewer) and the add-card
// composer textarea are dir="auto". Without bidi isolation these runs share the
// surrounding bidirectional state, so typing a strong RTL character into ONE
// list's composer re-resolved the shared context and visibly reflowed the
// displayed minicard titles of OTHER lists (no data change; reverts on refresh).
// `unicode-bidi: isolate` makes each a self-contained run so they cannot perturb
// one another. This locks that in on the actual CSS.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(
  path.join(__dirname, '..', 'client', 'components', 'cards', 'minicard.css'),
  'utf8',
);

// Return the body { ... } of the first CSS rule whose selector text contains
// `needle`, so assertions are scoped to that rule and not the whole file.
function ruleBody(cssText, needle) {
  const idx = cssText.indexOf(needle);
  if (idx === -1) return null;
  const open = cssText.indexOf('{', idx);
  const close = cssText.indexOf('}', open);
  if (open === -1 || close === -1) return null;
  return cssText.slice(open + 1, close);
}

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- POSITIVE: both dir="auto" runs are bidi-isolated -----------------------
test('minicard title is bidi-isolated (unicode-bidi: isolate)', () => {
  const body = ruleBody(css, '.minicard .minicard-title {');
  assert.ok(body, '.minicard .minicard-title rule exists');
  assert.ok(/unicode-bidi:\s*isolate/.test(body), 'title must use unicode-bidi: isolate');
});

test('add-card composer textarea is bidi-isolated', () => {
  const body = ruleBody(css, '.minicard.minicard-composer textarea.minicard-composer-textarea');
  assert.ok(body, 'composer textarea rule exists');
  assert.ok(/unicode-bidi:\s*isolate/.test(body), 'composer must use unicode-bidi: isolate');
});

// --- NEGATIVE: the un-isolated state that caused #6444 must not return -------
test('NEGATIVE: title does not fall back to a non-isolating unicode-bidi value', () => {
  const body = ruleBody(css, '.minicard .minicard-title {');
  // `normal` and `embed` do NOT isolate a run from its neighbours; only
  // isolate / isolate-override / plaintext do. Guard against a regression to
  // the leaky values.
  assert.ok(!/unicode-bidi:\s*normal/.test(body));
  assert.ok(!/unicode-bidi:\s*embed\b/.test(body));
});

test('NEGATIVE: composer does not fall back to a non-isolating unicode-bidi value', () => {
  const body = ruleBody(css, '.minicard.minicard-composer textarea.minicard-composer-textarea');
  assert.ok(!/unicode-bidi:\s*normal/.test(body));
  assert.ok(!/unicode-bidi:\s*embed\b/.test(body));
});

console.log(`\n${passed} tests passed`);
