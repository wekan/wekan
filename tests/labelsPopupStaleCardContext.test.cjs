'use strict';

// Regression coverage for #6686: "Labels popup not dismissed when switching
// cards: stale card context + duplicated list -> labels applied to the wrong
// card".
//
// client/lib/popup.js keeps ONE global singleton popup (Popup.current) with a
// stack (Popup._stack) of { dataContext, openerElement, ... } entries. Nothing
// ever called Popup.close()/back() when a card's details view was closed or
// swapped for another card (Session/Blaze just destroys the cardDetails
// template instance), so:
//
//   1. the popup stayed open/visible after the card that opened it went away;
//   2. opening the same popup (e.g. Labels) from a DIFFERENT card pushed a new
//      stack entry on top of the stale one instead of replacing it, so the
//      still-rendered old entry (still bound to the closed card's data)
//      stacked alongside the new one;
//   3. because of (2), the popup could keep operating on the previous card's
//      data context, toggling labels on the wrong card.
//
// Two fixes:
//   a) client/lib/popup.js: Popup.open() now resets the stack when a *fresh*
//      (not clicked from within the currently open popup) popup is opened
//      while a previous popup is still open, instead of pushing on top of it.
//   b) client/components/cards/cardDetails.js: Template.cardDetails.onDestroyed
//      closes Popup when it is still showing the destroyed card's data at the
//      base of its stack, so closing/switching a card dismisses its popup.
//
// The real mechanism is Blaze/jQuery-coupled; this test models the pure
// decision logic for both fixes and pins source guards on the actual files.
//
// Run: node tests/labelsPopupStaleCardContext.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- (a) Pure model of the stack-reset decision in Popup.open(). ---
// Mirrors the shape added to client/lib/popup.js: when a popup is already
// open, a *fresh* open (clickFromPopup === false) must replace the stack; a
// sub-popup opened from inside the currently open popup (clickFromPopup ===
// true) must keep growing it.
function decideStackOnOpen(stack, { isOpen, clickFromPopup, newEntry }) {
  let nextStack = stack;
  if (isOpen && !clickFromPopup) {
    nextStack = [];
  }
  return [...nextStack, newEntry];
}

test('NEGATIVE (pre-fix behaviour): opening Labels on card B while card A\'s stale popup is still open stacks both entries', () => {
  const staleStack = [{ dataContext: { _id: 'cardA' }, popupName: 'cardLabelsPopup' }];
  // Old behaviour: no reset at all, always push.
  const oldNextStack = [...staleStack, { dataContext: { _id: 'cardB' }, popupName: 'cardLabelsPopup' }];
  assert.equal(oldNextStack.length, 2, 'reproduces #6686: card A\'s entry is still in the stack');
  assert.equal(oldNextStack[0].dataContext._id, 'cardA');
});

test('fresh open while a previous popup is open replaces the stack (fixes duplication + wrong-card data)', () => {
  const staleStack = [{ dataContext: { _id: 'cardA' }, popupName: 'cardLabelsPopup' }];
  const nextStack = decideStackOnOpen(staleStack, {
    isOpen: true,
    clickFromPopup: false,
    newEntry: { dataContext: { _id: 'cardB' }, popupName: 'cardLabelsPopup' },
  });
  assert.equal(nextStack.length, 1, 'card A\'s stale entry must be gone');
  assert.equal(nextStack[0].dataContext._id, 'cardB');
});

test('a sub-popup opened from within the current popup still grows the stack', () => {
  const openStack = [{ dataContext: { _id: 'cardB' }, popupName: 'cardLabelsPopup' }];
  const nextStack = decideStackOnOpen(openStack, {
    isOpen: true,
    clickFromPopup: true,
    newEntry: { dataContext: { _id: 'cardB' }, popupName: 'editLabelPopup' },
  });
  assert.equal(nextStack.length, 2, 'editLabel sub-popup must still stack on top of cardLabelsPopup');
  assert.equal(nextStack[1].popupName, 'editLabelPopup');
});

// --- (b) Pure model of the close-on-destroy decision in cardDetails.js. ---
function shouldCloseOnCardDetailsDestroyed({ openedCardId, isPopupOpen, baseStackDataContextId }) {
  if (!openedCardId || !isPopupOpen) return false;
  return baseStackDataContextId === openedCardId;
}

test('destroying the cardDetails instance that opened the still-open popup closes it', () => {
  assert.equal(
    shouldCloseOnCardDetailsDestroyed({
      openedCardId: 'cardA',
      isPopupOpen: true,
      baseStackDataContextId: 'cardA',
    }),
    true,
  );
});

test('NEGATIVE: an unrelated popup (different card/context) is left untouched', () => {
  assert.equal(
    shouldCloseOnCardDetailsDestroyed({
      openedCardId: 'cardA',
      isPopupOpen: true,
      baseStackDataContextId: 'cardC',
    }),
    false,
  );
  assert.equal(
    shouldCloseOnCardDetailsDestroyed({
      openedCardId: 'cardA',
      isPopupOpen: false,
      baseStackDataContextId: undefined,
    }),
    false,
  );
});

// --- Source guards on the actual files. ---
const repoRoot = path.resolve(__dirname, '..');
const popupLib = fs.readFileSync(path.join(repoRoot, 'client/lib/popup.js'), 'utf8');
const cardDetails = fs.readFileSync(path.join(repoRoot, 'client/components/cards/cardDetails.js'), 'utf8');

test('Popup.open() resets the stack for a fresh open while a previous popup is still open', () => {
  const idx = popupLib.indexOf('$(previousOpenerElement).removeClass');
  assert.ok(idx !== -1, 'the previous-popup cleanup branch must still exist');
  const body = popupLib.slice(idx, idx + 1200);
  assert.ok(/if \(!clickFromPopup\(evt\)\) {\s*self\._stack = \[\];/.test(body),
    'a fresh (non-sub-popup) open must clear the stale stack, not push on top of it');
});

test('Template.cardDetails remembers which card it was opened for', () => {
  assert.ok(/this\.openedCardId = openedCardId;/.test(cardDetails),
    'onCreated must stash openedCardId on the template instance for onDestroyed to use');
});

test('Template.cardDetails.onDestroyed closes a popup still showing the destroyed card\'s data', () => {
  const idx = cardDetails.indexOf('Template.cardDetails.onDestroyed(function () {');
  assert.ok(idx !== -1, 'onDestroyed handler must exist');
  const body = cardDetails.slice(idx, idx + 900);
  assert.ok(/Popup\.isOpen\(\)/.test(body), 'must check whether a popup is currently open');
  assert.ok(/baseStackEntry\?\.dataContext\?\._id === openedCardId/.test(body),
    'must only close a popup whose base stack entry belongs to this destroyed card');
  assert.ok(/Popup\.close\(\)/.test(body), 'must actually close the stale popup');
});

console.log(`\nAll ${passed} labels-popup stale-card-context tests passed`);
