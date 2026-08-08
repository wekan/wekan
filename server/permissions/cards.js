import Cards from '/models/cards';
import Boards from '/models/boards';
import { allowIsBoardMemberWithWriteAccess, denyCrossBoardMove } from '/server/lib/utils';
import { canUserSeeBoard } from '/server/lib/visibleBoardIds';

// GHSA-jvv9-498p-hxrg: may this user name that card as a parent? Only if they
// may see the board it is on — the same question the `board` publication asks
// before sending an ancestor card.
export async function canUserSeeParentCard(userId, parentId) {
  if (!parentId) return true;
  const parent = await Cards.findOneAsync(parentId, { fields: { boardId: 1 } });
  // A parent that does not exist is not something to point at either.
  if (!parent) return false;
  return await canUserSeeBoard(userId, parent.boardId);
}

// The deny-rule form: true means "refuse this write".
export async function denyInvisibleParentCard(userId, modifier) {
  const set = modifier && modifier.$set;
  if (!set) return false;
  const parentId = set.parentId;
  // Not setting a parent, or clearing it — nothing to check.
  if (typeof parentId !== 'string' || !parentId) return false;
  return !(await canUserSeeParentCard(userId, parentId));
}

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
//
// Security (GHSA-jvv9-498p-hxrg): the same shape of hole one field over.
// `parentId` may name a card on ANOTHER board, and write access here says
// nothing about read access there — so pointing a card at a card on a private
// board made the board publication walk that private board's ancestor chain and
// send its full card documents to everyone subscribed to THIS board. Deny a
// parent whose board the caller cannot see. (The publication no longer sends
// those ancestors either; this stops the bridge being built in the first place.)
Cards.deny({
  async update(userId, doc, fieldNames, modifier) {
    if (await denyCrossBoardMove(userId, modifier)) return true;
    return await denyInvisibleParentCard(userId, modifier);
  },
  fetch: [],
});

// Same rule on INSERT: a card can be created with a parentId already set.
Cards.deny({
  async insert(userId, doc) {
    if (!doc || !doc.parentId) return false;
    return !(await canUserSeeParentCard(userId, doc.parentId));
  },
  fetch: [],
});
