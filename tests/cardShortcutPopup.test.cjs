'use strict';
// #6924: `d`, Shift+M and Shift+C open ONLY their popup - next to a hovered or
// selected minicard without opening the card, and on an opened card without
// showing its hamburger menu first. The popup is opened directly, so
// cardShortcutPopup must allow exactly what a click on the rendered control
// would: these tests drive it, and tie each rule to the template condition the
// control is rendered under.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const load = () => import('../client/lib/cardShortcutPopup.js');

const editor = { canModifyCard: true, isBoardAdmin: false, isWorker: false, isReadOnly: false,
  isReadAssignedOnly: false, allowsDueDate: true, hasDue: false };

test('each shortcut opens its own popup for somebody a click would let open it', async () => {
  const { cardShortcutPopup } = await load();
  assert.equal(cardShortcutPopup('due', editor), 'editCardDueDate');
  assert.equal(cardShortcutPopup('due', { ...editor, hasDue: true }), 'editCardDueDate');
  assert.equal(cardShortcutPopup('move', { ...editor, isBoardAdmin: true }), 'moveCard');
  assert.equal(cardShortcutPopup('copy', editor), 'copyCard');
  // A Worker edits an existing due date through its badge.
  assert.equal(cardShortcutPopup('due', { ...editor, isWorker: true, hasDue: true }), 'editCardDueDate');
  // cardMenuWrites: a member who may not modify the card but is not read-only.
  assert.equal(cardShortcutPopup('copy', { ...editor, canModifyCard: false }), 'copyCard');
});

test('negative: nothing opens where the control a click would use is not rendered', async () => {
  const { cardShortcutPopup } = await load();
  assert.equal(cardShortcutPopup('due', { ...editor, canModifyCard: false }), null, 'no badge or + without canModifyCard');
  assert.equal(cardShortcutPopup('due', { ...editor, allowsDueDate: false }), null, 'board has due dates off');
  assert.equal(cardShortcutPopup('due', { ...editor, isWorker: true }), null, 'a Worker gets no + to add one');
  assert.equal(cardShortcutPopup('move', editor), null, 'Move card is for board admins');
  assert.equal(cardShortcutPopup('copy', { ...editor, isWorker: true }), null, 'no Copy card for a Worker');
  for (const ro of [{ isReadOnly: true }, { isReadAssignedOnly: true }]) {
    const facts = { ...editor, ...ro, canModifyCard: false, isBoardAdmin: true };
    assert.equal(cardShortcutPopup('move', facts), null, 'read-only: no cardMenuWrites');
    assert.equal(cardShortcutPopup('copy', facts), null, 'read-only: no cardMenuWrites');
  }
  assert.equal(cardShortcutPopup('archive', editor), null, 'only the three shortcuts');
  assert.equal(cardShortcutPopup('due'), null, 'no facts, no popup');
});

test('the rules are the conditions the controls are rendered under', () => {
  const jade = read('client/components/cards/cardDetails.jade');
  const menu = jade.slice(jade.indexOf('template(name="cardDetailsActionsPopup")'));
  assert.match(menu, /if cardMenuWrites\s*\n\s*if currentUser\.isBoardAdmin\s*\n\s*li\s*\n\s*a\.js-move-card/);
  assert.match(menu, /unless currentUser\.isWorker\s*\n\s*li\s*\n\s*a\.js-copy-card/);
  const due = jade.slice(jade.indexOf('if $eq field "dueDate"'), jade.indexOf('if $eq field "endDate"'));
  assert.match(due, /if currentBoard\.allowsDueDate/);
  assert.match(due, /if getDue\s*\n\s*\+cardDueDate\(card=this canModifyCard=canModifyCard\)/);
  assert.match(due, /if canModifyCard\s*\n\s*unless currentUser\.isWorker\s*\n\s*a\.card-label\.add-label\.js-due-date/);
  assert.match(read('client/components/cards/cardDate.jade'), /template\(name="dateBadgeBody"\)\s*\n\s*if canModifyCard\s*\n\s*a\.js-edit-date/);
  const js = read('client/components/cards/cardDetails.js');
  assert.match(js, /cardMenuWrites\(\) \{\s*\n\s*if \(Utils\.canModifyCard\(this\)\) return true;[\s\S]{0,200}isReadOnly[\s\S]{0,80}isReadAssignedOnly/);
  // The same popups the controls open.
  assert.match(js, /'click \.js-move-card': Popup\.open\('moveCard'\)/);
  assert.match(js, /'click \.js-copy-card': Popup\.open\('copyCard'\)/);
  assert.match(js, /'click \.js-due-date': Popup\.open\('editCardDueDate'\)/);
});

test('the popup is anchored to the minicard, the hovered one first', async () => {
  const { findMinicard } = await load();
  const a = { id: 'a', getAttribute: () => 'card1' };
  const b = { id: 'b', getAttribute: () => 'card1' };
  const doc = { querySelector: sel => (sel === '.js-minicard[data-card-id="card1"]' ? a : null) };
  assert.equal(findMinicard(doc, 'card1'), a);
  assert.equal(findMinicard(doc, 'card1', b), b, 'the hovered copy of the card');
  assert.equal(findMinicard(doc, 'card1', { getAttribute: () => 'other' }), a, 'a hovered OTHER card is not it');
  assert.equal(findMinicard(doc, 'missing'), null);
  // negative: an id that is not a plain id never reaches a selector
  for (const bad of ['x"] , *', '', null, 'a b']) assert.equal(findMinicard(doc, bad), null);
});

test('keyboard.js opens only the popup: the card is not opened and no menu is shown', () => {
  const kb = read('client/lib/keyboard.js');
  const due = kb.slice(kb.indexOf('export function openDueDateEditorOfOpenedCard'), kb.indexOf("hotkeys('d, shift+d'"));
  const menu = kb.slice(kb.indexOf('function cardShortcutFacts'), kb.indexOf("hotkeys('shift+m'"));
  // An opened card's `d` still clicks its own rendered control (#6750, #6840).
  assert.match(due, /clickDueDateControlWhenRendered\(cardId\)/);
  assert.match(due, /return openCardShortcutPopupAtMinicard\('due'\);/);
  for (const fn of [due, menu]) {
    assert.doesNotMatch(fn, /Utils\.goCardId/, 'negative: the card is not opened');
    assert.doesNotMatch(fn, /cardMenuStep|\.js-open-card-details-menu'\)\.click|opened-menu/, 'negative: no menu first');
  }
  assert.match(menu, /const name = cardShortcutPopup\(action, cardShortcutFacts\(card\)\);\s*\n\s*if \(!name \|\| !anchor\) return false;/,
    'nothing opens without permission or an anchor');
  assert.match(menu, /Popup\.open\(name\)\.call\(card,/, 'the card is the popup data context');
  assert.match(menu, /Session\.get\('selectedCard'\) \|\| getHoveredCardId\(\)/, 'the same card every card shortcut uses');
  assert.match(menu, /if \(Utils\.getCurrentCardId\(\) !== cardId\) return;/, 'negative: stops when another card was opened');
  assert.match(menu, /Date\.now\(\) - started < 3000/, 'gives up rather than waiting forever');
  assert.match(menu, /Meteor\.userId\(\) === null \|\| !Utils\.canModifyBoard\(\)\) return false;/);
});
