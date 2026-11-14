// #6904: Shift+M opens Move card and Shift+C opens Copy card for the opened
// card, the two card actions used most. Like the `d` due date shortcut
// (client/lib/dueDateHotkey.js) the shortcut does not open the popup itself:
// it clicks the opened card's hamburger menu and then that menu's own Move
// card or Copy card item. So it can never do more than those clicks could:
// the menu renders Move card only for a board admin and Copy card only for a
// user who is not a Worker, and only when the card may be written
// (cardMenuWrites). Without the item there is nothing to click, and the menu
// is closed again.
//
// Pure DOM logic, no Meteor imports, so tests/cardMenuKeyboardShortcut.test.cjs
// can drive it without a browser.

import { findOpenedCardDetails } from './dueDateHotkey.js';

export const CARD_MENU_ACTIONS = Object.freeze({
  move: '.js-move-card',
  copy: '.js-copy-card',
});

export const CARD_MENU_OPENER_SELECTOR = '.js-open-card-details-menu';
// The card's hamburger menu, once open, is the popup's list of actions.
export const CARD_MENU_POPUP_SELECTOR = '.js-pop-over .pop-over-list';

// The hamburger button of the opened card's details, or null.
export function findCardMenuOpener(root, { cardId, dataOf } = {}) {
  const details = findOpenedCardDetails(root, { cardId, dataOf });
  return details ? details.querySelector(CARD_MENU_OPENER_SELECTOR) || null : null;
}

// The Move card / Copy card item of the open card menu, or null. Only an item
// inside the popup counts: the same classes are not used elsewhere, but a
// stale element outside the popup must never be clicked.
export function findCardMenuItem(root, action) {
  const selector = CARD_MENU_ACTIONS[action];
  if (!root || !selector) return null;
  return root.querySelector(`${CARD_MENU_POPUP_SELECTOR} ${selector}`) || null;
}

// One step of the shortcut, called until it answers 'done' or 'gave-up':
//   'clicked-item'  the menu item was there and was clicked - finished;
//   'opened-menu'   the menu was opened, the item is looked for next time;
//   'no-item'       the menu is open but has no such item (no permission):
//                   the caller closes the menu - finished;
//   'waiting'       neither the card's details nor its menu are there yet.
export function cardMenuStep(root, { cardId, dataOf, action, menuOpened }) {
  if (!CARD_MENU_ACTIONS[action]) return 'no-item';
  const item = findCardMenuItem(root, action);
  if (item) {
    item.click();
    return 'clicked-item';
  }
  if (menuOpened) {
    return root.querySelector(CARD_MENU_POPUP_SELECTOR) ? 'no-item' : 'waiting';
  }
  const opener = findCardMenuOpener(root, { cardId, dataOf });
  if (!opener) return 'waiting';
  opener.click();
  return 'opened-menu';
}
