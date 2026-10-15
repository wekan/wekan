import { ReactiveCache } from '/imports/reactiveCache';

const { isAssignedOnlyMember } = require('/models/lib/boardCardScope');

// An assigned-only member (isReadAssignedOnly, isNormalAssignedOnly,
// isCommentAssignedOnly) sees only the cards assigned to them, and so only
// those cards' attachments. The board publication applies that; the attachment
// API asked only board.hasMember(), so its list endpoints enumerated - and its
// download and info endpoints served - every attachment on the board.

// The ids of the cards of this board assigned to this member, or null when the
// member is not restricted.
export async function assignedOnlyCardIds(board, userId) {
  if (!isAssignedOnlyMember(board, userId)) return null;
  const cards = await ReactiveCache.getCards(
    { boardId: board._id, assignees: userId },
    { fields: { _id: 1 } },
  );
  return (cards || []).map(card => card._id);
}

// The attachment selector clause for this member, or null when unrestricted.
export async function assignedOnlyAttachmentScope(board, userId) {
  const ids = await assignedOnlyCardIds(board, userId);
  return ids && { 'meta.cardId': { $in: ids } };
}

// Files of the board itself, not of a card: its background (sidebar or API
// upload) and its map image. Every member sees them as part of the board.
// Any other attachment without a card is still refused to an assigned-only
// member.
const BOARD_LEVEL_SOURCES = new Set(['board-background', 'api-background', 'board-map']);
export function isBoardLevelFile(attachment) {
  const meta = (attachment && attachment.meta) || {};
  return !meta.cardId && BOARD_LEVEL_SOURCES.has(meta.source);
}

// May this member read this attachment of this board? A refusal is an
// attempt - no listing names another card's attachment to this member - so it
// is recorded under AssignedBleed (medium: never disables). `source` names the
// path that refused, for Admin Panel -> Problems.
export async function mayReadBoardAttachment(board, userId, attachment, source = 'attachment-api:read') {
  if (!isAssignedOnlyMember(board, userId)) return true;
  if (isBoardLevelFile(attachment)) return true;
  const cardId = attachment && attachment.meta && attachment.meta.cardId;
  const card = cardId ? await ReactiveCache.getCard(cardId) : null;
  const allowed = !!card && card.boardId === board._id
    && Array.isArray(card.assignees) && card.assignees.includes(userId);
  if (!allowed) {
    try {
      require('/server/lib/securityLog').record({
        key: 'authz.assigned', action: 'blocked', source, userId,
        detail: 'Assigned-only member asked for an attachment of a card not assigned to them.',
      });
    } catch (e) { /* logging must never break the guard */ }
  }
  return allowed;
}
