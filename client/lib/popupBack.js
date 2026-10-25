// A form that is its own popup from the opened card (a section hamburger) and
// also part of a Card Settings pane (docs/Features/Cards/Card-Fields.md):
// saved in its own popup it steps back from it; saved in the pane, Card
// Settings stays open.
export function backIfOwnPopup(evt, popupName) {
  const el = evt && (evt.currentTarget || evt.target);
  const popup = el && el.closest && el.closest('.js-pop-over');
  if (popup && popup.dataset.popup === popupName) Popup.back();
}
