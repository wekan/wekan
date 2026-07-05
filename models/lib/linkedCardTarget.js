'use strict';

// Pure guard for the "Link to this card" feature (#5808). Linking a card to an
// existing linked card (or to one that links back) builds a chain/cycle of
// linkedId references. The card helpers resolve linkedId only ONE hop
// (getTitle/getBoardTitle/getRealId read `getCard(linkedId).<field>` directly),
// so a link whose target is itself a linked card resolves to another pointer
// instead of a real card — the card renders as an empty/broken pointer and
// becomes effectively inaccessible (the reported "both cards inaccessible /
// freeze"). Mirrors the #3328 parent/subtask cycle guard, but for linkedId.
//
// Rule: a link target must be a REAL card (not a linked card, linked board, or
// template card), must not be one of the linking board's own cards (self / same
// board), and must not already link back to one of them (direct mutual link).

const LINK_TYPES = new Set(['cardType-linkedCard', 'cardType-linkedBoard']);

// A card that is itself a link (card or board) — never a valid link target,
// because linking to it would create a chain of linkedId pointers.
function isLinkPointerCard(card) {
  return !!card && LINK_TYPES.has(card.type);
}

// Whether `target` may be linked from the board whose real card ids are
// `ownRealCardIds` (Card.getRealId() of every card already on that board).
function isLinkableCardTarget(target, ownRealCardIds = []) {
  if (!target || !target._id) return false;
  // No chains of links, and no template cards.
  if (isLinkPointerCard(target) || target.type === 'template-card') return false;
  const own = ownRealCardIds instanceof Set ? ownRealCardIds : new Set(ownRealCardIds);
  // Not one of our own cards (self / same-board link).
  if (own.has(target._id)) return false;
  // Not a card that already links back to one of our cards (direct mutual link).
  if (target.linkedId && own.has(target.linkedId)) return false;
  return true;
}

module.exports = { isLinkPointerCard, isLinkableCardTarget };
