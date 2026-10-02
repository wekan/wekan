import { ReactiveCache } from '/imports/reactiveCache';

const { isAssignedOnlyMember } = require('/models/lib/boardCardScope');

// An assigned-only member (isReadAssignedOnly, isNormalAssignedOnly,
// isCommentAssignedOnly) sees only the cards assigned to them, and so only
// those cards' attachments. The board publication applies that; the attachment
// API asked only board.hasMember(), so its list endpoints enumerated - and its
// download and info endpoints served - every attachment on the board.

// The attachment selector clause for this member, or null when unrestricted.
export async function assignedOnlyAttachmentScope(board, userId) {
  if (!isAssignedOnlyMember(board, userId)) return null;
  const cards = await ReactiveCache.getCards(
    { boardId: board._id, assignees: userId },
    { fields: { _id: 1 } },
  );
  return { 'meta.cardId': { $in: (cards || []).map(card => card._id) } };
}

// May this member read this attachment of this board? A refusal is an
// attempt - the listings no longer name another card's attachment to this
// member - so it is recorded under AssignedBleed (medium: never disables).
export async function mayReadBoardAttachment(board, userId, attachment) {
  if (!isAssignedOnlyMember(board, userId)) return true;
  const cardId = attachment && attachment.meta && attachment.meta.cardId;
  const card = cardId ? await ReactiveCache.getCard(cardId) : null;
  const allowed = !!card && card.boardId === board._id
    && Array.isArray(card.assignees) && card.assignees.includes(userId);
  if (!allowed) {
    try {
      require('/server/lib/securityLog').record({
        key: 'authz.assigned', action: 'blocked', source: 'attachment-api:read', userId,
        detail: 'Assigned-only member asked for an attachment of a card not assigned to them.',
      });
    } catch (e) { /* logging must never break the guard */ }
  }
  return allowed;
}
