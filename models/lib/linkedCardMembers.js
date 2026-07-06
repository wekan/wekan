'use strict';

// Pure helpers for resolving which card / board a (possibly linked) card's
// member changes act on. Extracted from the card member popup so the choice is
// unit-testable without Meteor.
//
// #5676 (can not add members to a Linked Card): a linked card
// (type 'cardType-linkedCard') is only a placeholder on the board that links it —
// its members are stored on the REAL card it points at (`linkedId`), which lives
// on another board. Card.getMembers() / assignMember() / unassignMember() already
// read and write that real card, but the member PICKER listed the *viewing*
// board's members (Utils.getCurrentBoard()). So on a board that links a card from
// another board, the picker offered members that don't belong where the
// membership is actually stored, and toggling them did not behave as a consistent
// add/remove. The picker must instead offer the members of the board the real
// card lives on — the same board whose membership getMembers() reflects.

const TYPE_LINKED_CARD = 'cardType-linkedCard';
const TYPE_LINKED_BOARD = 'cardType-linkedBoard';

// The card id that a member add/remove must target: the real card behind a link,
// otherwise the card itself. Returns null when there is no usable id.
function memberTargetCardId(card) {
  if (!card) return null;
  if (card.type === TYPE_LINKED_CARD && card.linkedId) return card.linkedId;
  return card._id || null;
}

// The board id whose active members are valid for this card's membership.
// `resolveCard(id)` returns the card doc for a given id and is used to hop a
// linked card to its real card's board. Returns null when it can't be resolved
// (e.g. the real card isn't loaded yet), so the caller can fall back.
function memberTargetBoardId(card, resolveCard) {
  if (!card) return null;
  if (card.type === TYPE_LINKED_CARD && card.linkedId) {
    const realCard =
      typeof resolveCard === 'function' ? resolveCard(card.linkedId) : null;
    return realCard ? realCard.boardId || null : null;
  }
  if (card.type === TYPE_LINKED_BOARD && card.linkedId) {
    // A linked-board card's members are the linked board's own members, so the
    // linkedId *is* the board id whose members are valid.
    return card.linkedId;
  }
  return card.boardId || null;
}

module.exports = { memberTargetCardId, memberTargetBoardId };
