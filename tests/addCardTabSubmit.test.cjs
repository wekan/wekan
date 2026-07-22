'use strict';

// Regression guard for #1195 ("Pressing Tab while entering a card loses contents").
// Run: node tests/addCardTabSubmit.test.cjs
//
// The add-card form's Tab handler (Template.addCardForm pressKey, keyCode === 9) is a
// deliberate power feature: Tab moves to the NEXT column's add-card form. But it used
// to open that next form while ABANDONING whatever was typed in the current one, so the
// typed card text was silently lost. The fix submits the current card first (when the
// textarea has non-whitespace content), THEN opens the next column's form. This handler
// is DOM/Blaze-coupled (jQuery, Template), so this is a source guard on the ordering.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(
  path.join(__dirname, '..', 'client', 'components', 'lists', 'listBody.js'),
  'utf8',
);

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Isolate the Tab branch: from `keyCode === 9` up to the end of pressKey.
const tabBranch = (() => {
  const start = src.indexOf('evt.keyCode === 9');
  assert.ok(start > -1, 'the Tab (keyCode === 9) branch must exist');
  // pressKey ends shortly after the openForm block; take a generous slice.
  return src.slice(start, start + 1600);
})();

check('#1195: the Tab branch submits the current card when the textarea has content', () => {
  assert.ok(/\.find\('textarea'\)\.val\(\)/.test(tabBranch),
    'must read the current form textarea value');
  assert.ok(/\.trim\(\) !== ''/.test(tabBranch),
    'must guard on non-whitespace content');
  assert.ok(/button\[type=submit\]'\)\.click\(\)/.test(tabBranch),
    'must click the submit button to save the current card');
});

check('#1195: it still opens the next column form (feature preserved)', () => {
  assert.ok(/openForm\(/.test(tabBranch), 'must still open the next list form');
});

check('#1195: the submit happens BEFORE opening the next column form (no content loss)', () => {
  const submitIdx = tabBranch.indexOf("button[type=submit]']") >= 0
    ? tabBranch.indexOf('button[type=submit]')
    : tabBranch.indexOf('.click()');
  const openIdx = tabBranch.indexOf('openForm(');
  assert.ok(submitIdx > -1 && openIdx > -1 && submitIdx < openIdx,
    'the current-card submit must run before the next-column openForm');
});

check('#1195 negative: the submit is CONDITIONAL, not fired for an empty textarea', () => {
  // The click must be inside an `if (... typed ... trim() !== '')` guard, so pressing
  // Tab in an empty add-card box does not create a blank card.
  const guardThenClick =
    /if\s*\([^)]*typed[^)]*trim\(\)[^)]*\)\s*\{\s*[^}]*button\[type=submit\]'\)\.click\(\)/s;
  assert.ok(guardThenClick.test(tabBranch),
    'the submit click must sit inside the non-empty-content guard');
});

console.log(`\naddCardTabSubmit: ${passed} checks passed`);
