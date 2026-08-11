'use strict';

// #6465, the two newest comments:
//
//   csonkaoszimt: "is there a way to implement the whole closing an open card by
//                  clicking on it again thing?"
//   Heart1010:    "agree, closing by clicking again would be nice."
//                 "And I found this small glitch at the problems page (v10.81.0)"
//
// Run: node tests/cardClickToggle.test.cjs
//
// TWO THINGS, and the first is not a missing feature - it is an unreachable one.
//
// clickOnMiniCard already ended with:
//
//     } else if (Session.equals('currentCard', card._id)) {
//       Utils.goBoardId(Session.get('currentBoard'));   // close it
//
// but the TITLE branch above it returns before that is ever reached, and the
// title covers most of a minicard. So the second click almost always landed in
// the title branch and re-opened the card that was already open, which is why
// this reads to users as a feature that was never built. The title branch now
// makes the same decision, and the phone's popup path does too.
//
// The second is the Problems page glitch in the screenshot: a checkbox that is
// both checked and focused drew as a blue DIAMOND. The checked rule turns the
// square into a tick by rotating the element 40deg, and a browser draws its focus
// ring around the element AS IT IS - rotated. The ring moves to the row instead,
// which is not rotated. Keyboard focus stays visible; it just is not a diamond.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const listBody = read('client/components/lists/listBody.js');
const settingCss = read('client/components/settings/settingBody.css');
const problemsJade = read('client/components/settings/problemsSummary.jade');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// The click handler, so the assertions are about it and not about the file.
const handler = (() => {
  const at = listBody.indexOf('this.clickOnMiniCard = (evt) => {');
  assert.notStrictEqual(at, -1, 'listBody.js must still define clickOnMiniCard');
  return listBody.slice(at, listBody.indexOf('\n  this.toggleMultiSelection', at));
})();

// ── clicking an open card again ─────────────────────────────────────────────

test('the title branch closes the card when it is already the open one', () => {
  const titleAt = handler.indexOf('if (clickedTitle && !clickedLinkedReference)');
  assert.notStrictEqual(titleAt, -1, 'the title branch must still exist');
  const branch = handler.slice(titleAt, handler.indexOf('if (Utils.isMiniScreen())', titleAt));
  assert.ok(/Session\.equals\('currentCard', card\._id\)/.test(branch),
    'the title is most of a minicard, so this is where the second click lands - ' +
    'it has to ask whether the card is already open');
  assert.ok(/Utils\.goBoardId\(Session\.get\('currentBoard'\)\)/.test(branch),
    'and close it the same way the existing branch below does');
  const check = branch.indexOf("Session.equals('currentCard'");
  const open = branch.indexOf('openCardWindow(card._id)');
  assert.ok(check !== -1 && open !== -1 && check < open,
    'the close decision must come BEFORE re-opening, or it never happens');
});

test('opening a DIFFERENT card from a title click still works', () => {
  const titleAt = handler.indexOf('if (clickedTitle && !clickedLinkedReference)');
  const branch = handler.slice(titleAt, handler.indexOf('if (Utils.isMiniScreen())', titleAt));
  assert.ok(/Session\.set\('currentCard', card\._id\)/.test(branch) &&
            /openCardWindow\(card\._id\)/.test(branch),
    'a click on a card that is not open must still open it');
  assert.ok(/Session\.delete\('popupCardId'\)/.test(branch),
    'and still clear the phone popup ids, which is what that branch did before');
});

test('the original toggle further down is untouched', () => {
  // Clicking a non-title part of an open card already closed it; this fix must
  // not change that path.
  assert.ok(/\} else if \(Session\.equals\('currentCard', card\._id\)\) \{[\s\S]{0,200}Utils\.goBoardId/.test(handler),
    'the else-if that already toggled must stay, so both click targets agree');
});

test('on a phone, the second click closes the card popup', () => {
  const at = handler.indexOf('if (Utils.isMiniScreen())');
  const branch = handler.slice(at, handler.indexOf('} else if', at));
  assert.ok(/Session\.equals\('popupCardId', card\._id\) && Popup\.isOpen\(\)/.test(branch),
    'on a mini screen the card is a popup, so "already open" is a different ' +
    'question - and it has to be asked before opening another one');
  assert.ok(/Popup\.back\(\)/.test(branch), 'and closed as a popup, not by routing');
});

test('multi-selection still wins over everything', () => {
  const multi = handler.indexOf('MultiSelection.isActive() || evt.shiftKey');
  const title = handler.indexOf('if (clickedTitle && !clickedLinkedReference)');
  assert.ok(multi !== -1 && multi < title,
    'selecting cards must still take precedence, or a click during ' +
    'multi-selection would open or close a card instead of ticking it');
});

// ── the Problems page checkbox ──────────────────────────────────────────────

test('the checked checkbox is still the rotated tick', () => {
  const at = settingCss.indexOf('.setting-content input[type="checkbox"]:checked {');
  assert.notStrictEqual(at, -1, 'the checked style must still exist');
  const rule = settingCss.slice(at, settingCss.indexOf('}', at));
  assert.ok(/transform: rotate\(40deg\)/.test(rule),
    'the tick IS the rotation - this fix is about the focus ring, not the tick');
});

test('the focus ring is not drawn on the rotated element', () => {
  assert.ok(/\.setting-content input\[type="checkbox"\]:focus[\s\S]{0,120}outline: none/.test(settingCss),
    'a ring around a 40deg-rotated box renders as the blue diamond in the report');
});

test('...but focus is still visible, on the row that is not rotated', () => {
  assert.ok(/label:has\(> input\[type="checkbox"\]:focus-visible\)[\s\S]{0,160}outline: 2px solid/.test(settingCss),
    'removing focus indication outright would be worse than the glitch; it moves ' +
    'to the containing label');
  assert.ok(/:focus-visible/.test(settingCss),
    'and :focus-visible, so a mouse click does not leave a ring behind');
});

test('the markup the ring relies on is really there', () => {
  assert.ok(/label\.admin-problem-item\s*\n\s*input\.js-problem-check\(type="checkbox"/.test(problemsJade),
    'the fix puts the outline on the label because the checkbox is inside one; ' +
    'if that nesting changes, the ring has nowhere to go');
});

console.log(`\n${passed} passed`);
