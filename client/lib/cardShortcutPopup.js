// #6924: the card shortcuts open ONLY their popup. `d` (Due date), Shift+M
// (Move card) and Shift+C (Copy card) on a hovered or selected minicard used
// to open the card first, and Shift+M / Shift+C went through the card's
// hamburger menu too - three things for one key. Now the popup opens by
// itself, next to the minicard, as a click on a minicard's due date or label
// opens only its popup; on an opened card, Move / Copy open next to the card's
// hamburger without showing the menu first.
//
// The popup is opened directly, so these are the rules a click would meet.
// Each one is the condition the opened card renders that control under, and
// tests/cardShortcutPopup.test.cjs ties every rule to that template:
//   due   cardDetails.jade: `if currentBoard.allowsDueDate`, then the date
//         badge (`if canModifyCard`) when the card has a due date, or the add
//         `+` (`if canModifyCard` / `unless currentUser.isWorker`) when not;
//   move  cardDetailsActionsPopup: `if cardMenuWrites` / `if currentUser.isBoardAdmin`;
//   copy  cardDetailsActionsPopup: `if cardMenuWrites` / `unless currentUser.isWorker`.
// cardMenuWrites (cardDetails.js) is: may modify the card, or is a member who
// is neither read-only nor read-assigned-only.
//
// Pure, no Meteor imports, so the test drives it without a browser.

export const CARD_SHORTCUT_POPUPS = Object.freeze({
  due: 'editCardDueDate',
  move: 'moveCard',
  copy: 'copyCard',
});

// facts: { canModifyCard, isBoardAdmin, isWorker, isReadOnly,
//          isReadAssignedOnly, allowsDueDate, hasDue } - booleans.
// Returns the popup name to open, or null when a click could not open it.
export function cardShortcutPopup(action, facts = {}) {
  const f = facts || {};
  const cardMenuWrites = Boolean(f.canModifyCard) || !(f.isReadOnly || f.isReadAssignedOnly);
  switch (action) {
    case 'due':
      if (f.allowsDueDate === false || !f.canModifyCard) return null;
      if (!f.hasDue && f.isWorker) return null;
      return CARD_SHORTCUT_POPUPS.due;
    case 'move':
      return cardMenuWrites && f.isBoardAdmin ? CARD_SHORTCUT_POPUPS.move : null;
    case 'copy':
      return cardMenuWrites && !f.isWorker ? CARD_SHORTCUT_POPUPS.copy : null;
    default:
      return null;
  }
}

const SAFE_ID = /^[A-Za-z0-9_-]+$/;

// The minicard element of a card, to anchor its popup: the hovered one when it
// is that card (a card can be on the board more than once), else the first.
// null for an id that is not a plain id, so it never reaches a selector.
export function findMinicard(root, cardId, hovered = null) {
  if (!root || typeof cardId !== 'string' || !SAFE_ID.test(cardId)) return null;
  if (hovered && hovered.getAttribute && hovered.getAttribute('data-card-id') === cardId) return hovered;
  return root.querySelector(`.js-minicard[data-card-id="${cardId}"]`) || null;
}
