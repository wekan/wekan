'use strict';
// #6904: Shift+M opens Move card and Shift+C opens Copy card for the opened
// card, through that card's own hamburger menu.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const keyboard = read('client/lib/keyboard.js');

// A minimal DOM: elements with classes, children, a data context and clicks.
class Node {
  constructor(classes = [], children = [], data) {
    this.classes = classes;
    this.children = children;
    this.data = data;
    this.clicks = 0;
  }
  click() { this.clicks += 1; if (this.onclick) this.onclick(); }
  matches(selector) {
    return selector.split(',').some(part => {
      const chain = part.trim().split(/\s+/).map(s => s.replace(/^\./, ''));
      if (!this.classes.includes(chain[chain.length - 1])) return false;
      let node = this.parent;
      for (let i = chain.length - 2; i >= 0; i--) {
        while (node && !node.classes.includes(chain[i])) node = node.parent;
        if (!node) return false;
        node = node.parent;
      }
      return true;
    });
  }
  all() {
    const out = [];
    for (const child of this.children) {
      child.parent = this;
      out.push(child, ...child.all());
    }
    return out;
  }
  querySelectorAll(selector) { return this.all().filter(n => n.matches(selector)); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
}
const dataOf = element => element.data;
const details = id => new Node(['card-details', 'js-card-details'], [
  new Node(['card-details-header'], [new Node(['card-details-menu', 'js-open-card-details-menu'])]),
], id && { _id: id });
// The open hamburger menu, with the items the user's permissions render.
const menu = items => new Node(['pop-over', 'js-pop-over'], [
  new Node(['pop-over-list'], items.map(cls => new Node([cls]))),
]);

test('the opened card\'s menu is opened, then its Move card or Copy card item is clicked', async () => {
  const { cardMenuStep, CARD_MENU_ACTIONS } = await import('../client/lib/cardMenuHotkey.js');
  assert.deepEqual({ ...CARD_MENU_ACTIONS }, { move: '.js-move-card', copy: '.js-copy-card' });
  for (const [action, cls] of [['move', 'js-move-card'], ['copy', 'js-copy-card']]) {
    const page = new Node([], [details('other'), details('card1')]);
    const opener = page.querySelectorAll('.js-open-card-details-menu')[1];
    // Clicking the opener renders the menu, as Popup.open does.
    opener.onclick = () => { page.children.push(menu(['js-move-card', 'js-copy-card'])); };
    assert.equal(cardMenuStep(page, { cardId: 'card1', dataOf, action, menuOpened: false }), 'opened-menu');
    assert.equal(opener.clicks, 1, 'the OPENED card\'s menu, not the first card details on the page');
    assert.equal(page.querySelectorAll('.js-open-card-details-menu')[0].clicks, 0);
    assert.equal(cardMenuStep(page, { cardId: 'card1', dataOf, action, menuOpened: true }), 'clicked-item');
    assert.equal(page.querySelector(`.${cls}`).clicks, 1);
  }
  // A menu already open is used as it is.
  const open = new Node([], [details('card1'), menu(['js-copy-card'])]);
  assert.equal(cardMenuStep(open, { cardId: 'card1', dataOf, action: 'copy', menuOpened: false }), 'clicked-item');
  assert.equal(open.querySelector('.js-open-card-details-menu').clicks, 0);
});

test('negative: no permission, no card, an unknown action or a stray element does nothing', async () => {
  const { cardMenuStep, findCardMenuItem } = await import('../client/lib/cardMenuHotkey.js');
  // A Worker's menu has no Copy card, a non-admin's no Move card: the menu was
  // opened and has no such item, so the caller closes it.
  const noMove = new Node([], [details('card1'), menu(['js-copy-card'])]);
  assert.equal(cardMenuStep(noMove, { cardId: 'card1', dataOf, action: 'move', menuOpened: true }), 'no-item');
  assert.equal(noMove.querySelector('.js-copy-card').clicks, 0, 'never clicks the other action instead');
  // Card details not rendered yet, or another card is open: wait, click nothing.
  const empty = new Node([], []);
  assert.equal(cardMenuStep(empty, { cardId: 'card1', dataOf, action: 'move', menuOpened: false }), 'waiting');
  const other = new Node([], [details('card2')]);
  assert.equal(cardMenuStep(other, { cardId: 'card1', dataOf, action: 'move', menuOpened: false }), 'waiting');
  assert.equal(other.querySelector('.js-open-card-details-menu').clicks, 0);
  // The menu was opened but has not rendered yet: keep waiting, do not reopen.
  const pending = new Node([], [details('card1')]);
  assert.equal(cardMenuStep(pending, { cardId: 'card1', dataOf, action: 'move', menuOpened: true }), 'waiting');
  assert.equal(pending.querySelector('.js-open-card-details-menu').clicks, 0);
  assert.equal(cardMenuStep(pending, { cardId: 'card1', dataOf, action: 'archive', menuOpened: false }), 'no-item');
  // A Move card element outside the popup is never clicked.
  const stray = new Node([], [new Node(['js-move-card'])]);
  assert.equal(findCardMenuItem(stray, 'move'), null);
  assert.equal(findCardMenuItem(null, 'move'), null);
});

test('Shift+M and Shift+C are bound once, and the plain m and c keep their own actions', () => {
  const bindings = [...keyboard.matchAll(/hotkeys\(\s*(['"])([^'"]*)\1/g)].map(m => m[2]);
  const keysOf = binding => binding.split(',').map(k => k.trim().toLowerCase());
  for (const [key, action] of [['shift+m', 'move'], ['shift+c', 'copy']]) {
    assert.deepEqual(bindings.filter(b => keysOf(b).includes(key)), [key], `${key} has one binding`);
    const at = keyboard.indexOf(`hotkeys('${key}'`);
    assert.match(keyboard.slice(at, at + 160), new RegExp(`openCardMenuActionOfOpenedCard\\('${action}'\\)`));
  }
  assert.deepEqual(bindings.filter(b => keysOf(b).includes('m')), ['m'], 'm stays assign yourself');
  assert.deepEqual(bindings.filter(b => keysOf(b).includes('c')), ['c'], 'c stays archive');

  const fn = keyboard.slice(keyboard.indexOf('function runCardMenuActionWhenRendered'), keyboard.indexOf("hotkeys('shift+m'"));
  assert.match(fn, /if \(Utils\.getCurrentCardId\(\) !== cardId\) return;/,
    'negative: stops when another card was opened meanwhile');
  assert.match(fn, /Date\.now\(\) - started < 3000/, 'gives up rather than waiting forever');
  assert.match(fn, /result === 'no-item'\) \{\s*\n\s*Popup\.close\(\);/, 'a menu without the item is closed again');
  assert.match(fn, /Meteor\.userId\(\) === null \|\| !Utils\.canModifyBoard\(\)\) return false;/);
  assert.doesNotMatch(fn, /Popup\.open/, 'never opens the popup past the menu item');
  assert.match(fn, /Session\.get\('selectedCard'\) \|\| getHoveredCardId\(\)/, 'with no opened card, the same card as d');
});

test('the menu items it clicks are the ones the menu renders only with permission', () => {
  const jade = read('client/components/cards/cardDetails.jade');
  const popup = jade.slice(jade.indexOf('template(name="cardDetailsActionsPopup")'));
  assert.match(popup, /if cardMenuWrites\s*\n\s*if currentUser\.isBoardAdmin\s*\n\s*li\s*\n\s*a\.js-move-card/);
  assert.match(popup, /unless currentUser\.isWorker\s*\n\s*li\s*\n\s*a\.js-copy-card/);
  const details = read('client/components/cards/cardDetails.js');
  assert.match(details, /'click \.js-move-card': Popup\.open\('moveCard'\)/);
  assert.match(details, /'click \.js-copy-card': Popup\.open\('copyCard'\)/);
  assert.match(details, /'click \.js-open-card-details-menu': Popup\.open\('cardDetailsActions'\)/);
});

test('appears in the keyboard shortcuts list with the already translated popup titles', () => {
  const mapping = keyboard.slice(keyboard.indexOf('Template.keyboardShortcuts.helpers'));
  assert.match(mapping, /keys: \['SHIFT \+ m'\],\s*\n\s*action: 'moveCardPopup-title'/);
  assert.match(mapping, /keys: \['SHIFT \+ c'\],\s*\n\s*action: 'copyCardPopup-title'/);
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.equal(en['moveCardPopup-title'], 'Move Card');
  assert.equal(en['copyCardPopup-title'], 'Copy Card');
});
