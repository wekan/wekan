import { ReactiveCache } from '/imports/reactiveCache';
import { findWhere } from '/imports/lib/collectionHelpers';

// Whether `userId` may read the card `cardId`, and which board it is on - the
// rule of the 'card' publication (server/publications/cards.js), here once so
// that the publication and the opened card's #6808 check cannot disagree: the
// card exists and has a board, the board is visible to the user, and an
// assigned-only member reads only the cards assigned to them.
export async function readableCard(userId, cardId) {
  const card = await ReactiveCache.getCard({ _id: cardId });
  if (!card || !card.boardId) return null;
  const board = await ReactiveCache.getBoard({ _id: card.boardId });
  if (!board || !board.isVisibleBy({ _id: userId })) return null;
  if (userId && board.members) {
    const member = findWhere(board.members, { userId, isActive: true });
    if (member && (member.isNormalAssignedOnly || member.isCommentAssignedOnly || member.isReadAssignedOnly)) {
      if (!card.assignees || !card.assignees.includes(userId)) return null;
    }
  }
  return card;
}
