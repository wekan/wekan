// #6750: the `d` keyboard shortcut opens the Due date editor of the opened
// card. It does not open the popup itself: it finds the control the card
// details already render for the due date - the `+` (`.js-due-date`) when the
// card has no due date, the date badge (`.js-edit-date`) when it has one - and
// the caller clicks it. So the shortcut can never do more than a click could:
// the card details render those controls only when the board allows due dates,
// the user may modify the card (canModifyCard) and, for the `+`, is not a
// Worker. With no such control there is nothing to click, and nothing happens.
//
// Pure DOM logic, no Meteor imports, so tests/dueDateKeyboardShortcut.test.cjs
// can drive it without a browser.

export const DUE_DATE_CONTROL_SELECTOR =
  '.card-details-item-due .js-edit-date, .card-details-item-due .js-due-date';

// root: a document or element holding the card details.
// cardId: the opened card (Utils.getCurrentCardId()); nothing without one.
// canModifyCard: Utils.canModifyCard(card) - checked again here so a stale
//   control left in the DOM cannot be used by somebody who may not edit.
// dataOf: returns the data context of a `.js-card-details` element
//   (Blaze.getData in the client), so the control of the OPENED card is chosen
//   when more than one card details is on the page.
function dataCardId(data) {
  if (!data) return null;
  if (typeof data._id === 'string') return data._id;
  if (data.card && typeof data.card._id === 'string') return data.card._id;
  return null;
}

export function findDueDateControl(root, { cardId, canModifyCard, dataOf } = {}) {
  if (!root || !cardId || !canModifyCard) return null;
  const details = Array.from(root.querySelectorAll('.js-card-details'));
  const known = details.map(element => {
    try {
      return dataCardId(dataOf ? dataOf(element) : null);
    } catch (e) {
      return null;
    }
  });
  // The opened card's own details. A details element whose card cannot be
  // read is used only when it is the ONLY card details on the page - then it
  // is the opened card - never when another card's details could be meant.
  let target = details.find((element, i) => known[i] === cardId);
  if (!target && details.length === 1 && known[0] === null) target = details[0];
  if (!target) return null;
  return target.querySelector(DUE_DATE_CONTROL_SELECTOR) || null;
}
