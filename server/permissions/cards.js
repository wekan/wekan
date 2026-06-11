import Cards from '/models/cards';
import Boards from '/models/boards';
import { allowIsBoardMemberWithWriteAccess, denyCrossBoardMove } from '/server/lib/utils';

// Centralized update policy for Cards
// Security: deny any direct client updates to 'vote' fields; require write access otherwise
export const canUpdateCard = async function(userId, doc, fields) {
  if (!userId) return false;
  const fieldNames = fields || [];
  // Block direct updates to voting fields; voting must go through Meteor method 'cards.vote'
  if (fieldNames.some(f => typeof f === 'string' && (f === 'vote' || f.indexOf('vote.') === 0))) {
    return false;
  }
  // Block direct updates to poker fields; poker must go through Meteor methods
  if (fieldNames.some(f => typeof f === 'string' && (f === 'poker' || f.indexOf('poker.') === 0))) {
    return false;
  }
  // ReadOnly users cannot edit cards
  return allowIsBoardMemberWithWriteAccess(userId, await Boards.findOneAsync(doc.boardId));
};

Cards.allow({
  async insert(userId, doc) {
    // ReadOnly users cannot create cards
    return allowIsBoardMemberWithWriteAccess(userId, await Boards.findOneAsync(doc.boardId));
  },
  async update(userId, doc, fields) {
    return await canUpdateCard(userId, doc, fields);
  },
  async remove(userId, doc) {
    // ReadOnly users cannot delete cards
    return allowIsBoardMemberWithWriteAccess(userId, await Boards.findOneAsync(doc.boardId));
  },
  fetch: ['boardId'],
});

// Security (GHSA-gm7v-pc38-53jr): the allow rule above only checks write access
// on the card's SOURCE board, so a client could move a card into a private board
// it is not a member of by setting a new boardId. Deny any cross-board move where
// the caller lacks write access to the destination board.
Cards.deny({
  async update(userId, doc, fieldNames, modifier) {
    return await denyCrossBoardMove(userId, modifier);
  },
  fetch: [],
});
