// A form that is its own popup from the opened card (a section hamburger) and
// also part of a Card Settings pane (docs/Features/Cards/Card-Fields.md):
// saved in its own popup it steps back from it; saved in the pane, Card
// Settings stays open. `popupName` is one name or several (a form drawn by
// more than one popup). Returns whether it stepped back.
export function backIfOwnPopup(evt, popupName) {
  const names = Array.isArray(popupName) ? popupName : [popupName];
  const el = evt && (evt.currentTarget || evt.target);
  const popup = el && el.closest && el.closest('.js-pop-over');
  if (popup && names.includes(popup.dataset.popup)) {
    Popup.back();
    return true;
  }
  return false;
}
