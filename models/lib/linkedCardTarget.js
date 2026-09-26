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
// template card). A new mirror can point at a real card on its own board
// without creating a cycle. The picker excludes sources already mirrored.

const LINK_TYPES = new Set(['cardType-linkedCard', 'cardType-linkedBoard']);

// A card that is itself a link (card or board) — never a valid link target,
// because linking to it would create a chain of linkedId pointers.
function isLinkPointerCard(card) {
  return !!card && LINK_TYPES.has(card.type);
}

// `mirroredRealCardIds` contains only sources of existing mirrors, not all
// real cards on the destination board.
function isLinkableCardTarget(target, mirroredRealCardIds = []) {
  if (!target || !target._id) return false;
  // No chains of links, and no template cards.
  if (isLinkPointerCard(target) || target.type === 'template-card') return false;
  const mirrored = mirroredRealCardIds instanceof Set
    ? mirroredRealCardIds : new Set(mirroredRealCardIds);
  if (mirrored.has(target._id)) return false;
  // Even a malformed normal card must not carry another link pointer.
  if (target.linkedId) return false;
  return true;
}

export { isLinkPointerCard, isLinkableCardTarget };
