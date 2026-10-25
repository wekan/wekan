import { Session } from 'meteor/session';

// #6802: opening a NEW drawing - the whole window, saved as an SVG attachment
// (cardDrawing.js) - from Add Card and from Add attachment. This module draws
// nothing and defines no template, so it can be imported from anywhere: the
// Drawing popup's own module touches Template.cardDrawingPopup when it is
// loaded, and importing THAT from attachments.js ran it before cardDetails.jade
// had defined the template, and the client did not start.

// #6802: open a NEW drawing of the card, maximized - the whole window - and
// saved as an SVG attachment of the card. The popup is anchored to `opener`, or
// to the opened card.
export function openNewDrawing(cardId, opener) {
  if (!cardId) return;
  const el = opener || document.querySelector('.js-card-details') || document.body;
  Popup.open('cardDrawing', { dataContext: { _id: cardId, drawingNewFile: true } })({
    currentTarget: el, target: el, preventDefault() {}, stopPropagation() {},
  });
}

// #6802: after Add Card's Drawing button the new card is being opened; the
// drawing opens over it once its window is there (or after 5 s, anchored to the
// page, so it opens in any case).
export function openNewDrawingWhenOpen(cardId) {
  const started = Date.now();
  const tick = () => {
    // The NEW card is the one on the route, and its window is drawn - an
    // earlier card's window may still be there for a moment.
    const routed = Session.get('currentCard') === cardId || window.location.pathname.includes(cardId);
    const details = document.querySelector('.js-card-details');
    if ((routed && details) || Date.now() - started > 5000) {
      // A beat more, so opening the card does not close the popup it just got.
      setTimeout(() => openNewDrawing(cardId, details || undefined), 250);
      return;
    }
    setTimeout(tick, 100);
  };
  setTimeout(tick, 0);
}

