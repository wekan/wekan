'use strict';

// Single source of truth for what "a broken card" means, plus the pure planner
// for repairing one.
//
// The Admin Panel → Problems → Summary page COUNTS broken cards and now also
// REPAIRS them from the same page. Those two had the rule written out twice —
// once in server/lib/systemStatus.js (countBrokenCards) and once in the repair —
// so they could drift and leave the admin pressing a Repair button that never
// makes the count go down. Both now use the selector and the planner here.
//
// A card is broken when it has no boardId, no swimlaneId or no listId: any of
// those makes it unreachable in the board views. Only two of the three can be
// repaired automatically:
//
//   * missing listId / swimlaneId -> the card still knows its board, so it can
//     be put on that board's first usable list / swimlane.
//   * missing boardId             -> the card belongs to no board at all. There
//     is no way to know which board it came from, and guessing would drop a
//     user's card onto an unrelated board, so these are reported as unfixable
//     and left alone. They are never deleted.

const MISSING = { $in: [null, ''] };

// The card types WeKan shows - CARD_TYPES of config/const.js, which this pure
// module does not import; tests/brokenCardTypes.test.cjs keeps the two equal.
// A card of any other type (or none) is shown nowhere, so it is broken too,
// and the repair gives it the plain card type, the schema's default.
const CARD_TYPES = Object.freeze(['cardType-card', 'cardType-linkedCard', 'cardType-linkedBoard', 'template-card']);
const DEFAULT_CARD_TYPE = 'cardType-card';
const UNKNOWN_TYPE = { type: { $nin: CARD_TYPES } };

// Mongo selector matching every broken card. Used by the count AND the repair.
function brokenCardsSelector() {
  return {
    $or: [
      { boardId: MISSING },
      { swimlaneId: MISSING },
      { listId: MISSING },
      UNKNOWN_TYPE,
    ],
  };
}

// Selector for the repairable subset: still has a board, missing a list
// and/or a swimlane, or of a type WeKan does not show.
function repairableCardsSelector() {
  return {
    boardId: { $nin: [null, ''] },
    $or: [{ listId: MISSING }, { swimlaneId: MISSING }, UNKNOWN_TYPE],
  };
}

// Selector for the cards no automatic repair can place.
function unfixableCardsSelector() {
  return { boardId: MISSING };
}

function isMissing(value) {
  return typeof value !== 'string' || value.length === 0;
}

// True when this card is counted as broken.
function isBrokenCard(card) {
  if (!card) return false;
  return isMissing(card.boardId) || isMissing(card.swimlaneId) || isMissing(card.listId)
    || !CARD_TYPES.includes(card.type);
}

// Plan the repair of a set of cards (plain objects, no DB access).
// Returns:
//   { needsList: [ids], needsSwimlane: [ids], needsType: [ids], unfixable: [ids], boardIds: [ids] }
// `boardIds` is every board a repair will need a default list/swimlane for, so
// the caller can resolve each board once instead of once per card.
function planBrokenCardRepair(cards) {
  const needsList = [];
  const needsSwimlane = [];
  const needsType = [];
  const unfixable = [];
  const boardIds = new Set();

  for (const card of Array.isArray(cards) ? cards : []) {
    if (!card || isMissing(card._id)) continue;
    if (isMissing(card.boardId)) {
      // No board: nothing to attach it to.
      unfixable.push(card._id);
      continue;
    }
    let touched = false;
    if (isMissing(card.listId)) {
      needsList.push(card._id);
      touched = true;
    }
    if (isMissing(card.swimlaneId)) {
      needsSwimlane.push(card._id);
      touched = true;
    }
    if (touched) boardIds.add(card.boardId);
    // The type needs no board lookup: the plain card type is always right.
    if (!CARD_TYPES.includes(card.type)) needsType.push(card._id);
  }

  return { needsList, needsSwimlane, needsType, unfixable, boardIds: [...boardIds] };
}

module.exports = {
  CARD_TYPES,
  DEFAULT_CARD_TYPE,
  brokenCardsSelector,
  repairableCardsSelector,
  unfixableCardsSelector,
  isBrokenCard,
  planBrokenCardRepair,
};
