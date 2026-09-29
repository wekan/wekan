'use strict';

// #3256 (maintainer decision 2026-09-29): the Map board view - an uploaded
// image (a floor plan, a site map, a machine drawing) with the board's cards
// as markers on it. A card's place is stored as percentages of the image's
// width and height (card.mapX, card.mapY, 0-100), so a marker stays on the same
// spot at any screen size.

const round = value => Math.round(value * 100) / 100;

// A coordinate from 0 to 100, or null.
// Only a number or a numeric string: Number(null) is 0, and a card whose mapX
// is null must not count as placed in the top-left corner.
function clampPercent(value) {
  let n = NaN;
  if (typeof value === 'number') n = value;
  else if (typeof value === 'string' && value.trim() !== '') n = Number(value);
  if (!Number.isFinite(n)) return null;
  return round(Math.min(100, Math.max(0, n)));
}

// Where a pointer at (clientX, clientY) falls on an image drawn in `rect`.
function percentFromPoint({ clientX, clientY }, rect) {
  if (!rect || !(rect.width > 0) || !(rect.height > 0)) return null;
  return {
    x: clampPercent(((clientX - rect.left) / rect.width) * 100),
    y: clampPercent(((clientY - rect.top) / rect.height) * 100),
  };
}

function isPlaced(card) {
  return !!card && clampPercent(card.mapX) !== null && clampPercent(card.mapY) !== null;
}

// The marker for a placed card: its place, its first label's colour, and a
// short text - the card number when the board numbers cards.
function mapMarker(card, board) {
  if (!isPlaced(card)) return null;
  const labels = (board && board.labels) || [];
  const first = (card.labelIds || []).map(id => labels.find(label => label._id === id)).find(Boolean);
  return {
    x: clampPercent(card.mapX),
    y: clampPercent(card.mapY),
    color: first ? first.color : null,
    text: card.cardNumber ? String(card.cardNumber) : '',
    title: String(card.title || ''),
  };
}

module.exports = { clampPercent, percentFromPoint, isPlaced, mapMarker };
