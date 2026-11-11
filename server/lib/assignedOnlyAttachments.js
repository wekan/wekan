import { ReactiveCache } from '/imports/reactiveCache';

const { isAssignedOnlyMember, assignedOnlyAllowsCard } = require('/models/lib/boardCardScope');

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

// May this member WRITE an attachment of this card - add one to it, soft-delete
// one of it, or copy or move one onto it? Board write access is not enough: an
// assigned-only member writes only on a card assigned to them, as on every
// other card path. The REST routes asked only for board write access, so a
// member whose assignment was removed kept adding and deleting files on that
// card with the ids they had seen (UnassignedAttachBleed,
// GHSA-w26g-rc43-q6cm). A board-level file has no card and is not theirs to
// change either. `source` names the refusing route for Admin Panel -> Problems.
export function mayWriteCardAttachment(board, userId, card, source) {
  if (!isAssignedOnlyMember(board, userId)) return true;
  const allowed = !!card && card.boardId === board._id && assignedOnlyAllowsCard(board, userId, card);
  if (!allowed) {
    try {
      require('/server/lib/securityLog').record({
        key: 'authz.assigned-attachment-write', action: 'blocked', source, userId,
        detail: 'Assigned-only member tried to change an attachment of a card not assigned to them.',
      });
    } catch (e) { /* logging must never break the guard */ }
  }
  return allowed;
}

// May this user write an attachment of this card, as its LIST sees it? A board
// admin can refuse a role write access in one list (#4527); the attachment
// API asked only for board write access and mayWriteCardAttachment above, so
// a member the list refused still added, deleted, copied and moved files on
// that list's cards (ListLockAttachBleed, a sibling of ListLockBleed,
// GHSA-4734-8vrg-8j3w). Every attachment write that names a card asks this
// too, beside the board and assigned-only checks. As for the REST card
// routes, only a list's REFUSAL counts: its grant does not open the API to a
// role the board does not let write. The card's own board decides, whatever
// board the caller named. A board-level file has no card and no list.
// `source` names the refusing route for Admin Panel -> Problems.
export async function mayWriteInCardList(board, userId, card, source) {
  if (!card) return true;
  const { listException } = require('/server/lib/listPermissionGate');
  const cardBoard = board && board._id === card.boardId ? board : await ReactiveCache.getBoard(card.boardId);
  if ((await listException(userId, cardBoard, card.listId, 'write')) !== false) return true;
  try {
    require('/server/lib/securityLog').record({
      key: 'authz.list-locked-attachment', action: 'blocked', source, userId,
      detail: 'An attachment write on a card in a list whose exception refuses the caller\'s role.',
    });
  } catch (e) { /* logging must never break the guard */ }
  return false;
}
