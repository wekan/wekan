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
  // This guard used to require `Session.equals('currentCard', ...)` and
  // `Utils.goBoardId(...)` here, and it passed while the card stayed on screen:
  // on a desktop the window is rendered from `openCards`, not from the route,
  // so routing back to the board closed nothing (#6465, comment 5281667054 -
  // "Clicking the mini card again to close the popout is still not possible").
  // Both questions now go through the two helpers, which is what makes the
  // decision the same one the card's own X button makes.
  assert.ok(/cardWindowIsOpen\(card\._id\)/.test(branch),
    'the title is most of a minicard, so this is where the second click lands - ' +
    'it has to ask whether the card is already open');
  assert.ok(/closeCardWindow\(card\._id\)/.test(branch),
    'and close it the way the card details close themselves');
  const check = branch.indexOf('cardWindowIsOpen(card._id)');
  const open = branch.indexOf('openCardWindow(card._id)');
  assert.ok(check !== -1 && open !== -1 && check < open,
    'the close decision must come BEFORE re-opening, or it never happens');
});

test('"already open" is asked of the list that renders the window', () => {
  // The desktop card is a draggable window per id in `openCards`
  // (boardBody.jade `each openCards`), and clicking a minicard does not change
  // the URL at all - so `currentCard` alone cannot answer this. With "Open many
  // cards at once" on, `currentCard` is the LAST card clicked, which made every
  // earlier window impossible to close by clicking its minicard.
  const fn = listBody.slice(listBody.indexOf('function cardWindowIsOpen('));
  const body = fn.slice(0, fn.indexOf('\n}'));
  assert.ok(/!Utils\.isMiniScreen\(\)/.test(body) &&
            /Session\.get\('openCards'\) \|\| \[\]\)\.includes\(cardId\)/.test(body),
    'on a desktop-sized screen the open windows ARE the openCards list');
  assert.ok(/Session\.equals\('currentCard', cardId\)/.test(body),
    'and a card opened by its own URL, which sets only currentCard, still counts');
});

test('closing takes the card OUT of openCards', () => {
  const fn = listBody.slice(listBody.indexOf('function closeCardWindow('));
  const body = fn.slice(0, fn.indexOf('\n}\n'));
  assert.ok(/Session\.set\(\s*'openCards',\s*\(Session\.get\('openCards'\) \|\| \[\]\)\.filter\(id => id !== cardId\)/.test(body),
    'the window is rendered from this list, so nothing else can close it');
  assert.ok(/Session\.equals\('currentCard', cardId\)[\s\S]{0,80}Session\.set\('currentCard', null\)/.test(body),
    'and the closed card is no longer the current one');
  assert.ok(/popupCardId/.test(body) && /popupCardBoardId/.test(body),
    'the phone popup ids are cleared too, as the close button clears them');
  assert.ok(/FlowRouter\.current\(\)\?\.params\?\.cardId === cardId/.test(body),
    'a card opened by its own URL still needs the board navigated back to - and ' +
    'a card opened by a click does not, or the board view resets for nothing');
});

test('it closes a card exactly as the card details close button does', () => {
  // One behaviour, two entry points. If the close button ever stops removing
  // the id, this fix is wrong in the same way the old toggle was.
  const details = read('client/components/cards/cardDetails.js');
  const close = details.slice(details.indexOf("'click .js-close-card-details'"));
  const body = close.slice(0, close.indexOf('\n  },'));
  assert.ok(/openCards\.filter\(\(id\) => id !== cardId\)/.test(body),
    'the close button removes the id from openCards');
  assert.ok(/Session\.set\('currentCard', null\)/.test(body));
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

test('the toggle further down makes the same decision', () => {
  // Clicking a non-title part of an open card closes it too - through the same
  // two helpers, so a click anywhere on a minicard behaves alike. (It used to
  // route to the board here as well, and left the window open just the same.)
  assert.ok(/\} else if \(cardWindowIsOpen\(card\._id\)\) \{[\s\S]{0,200}closeCardWindow\(card\._id\)/.test(handler),
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
