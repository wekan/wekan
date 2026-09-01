'use strict';

// Pure Personal Inbox rules shared by the server and the Node guard suite.
// Inbox storage reuses WeKan's real board/list/swimlane/card collections; the
// deterministic ids make provisioning idempotent without a second collection.

const PERSONAL_INBOX_TITLE = '^Personal Inbox^';
const PERSONAL_INBOX_LIST_TITLE = 'Inbox';
const PERSONAL_INBOX_SWIMLANE_TITLE = 'Default';

function personalInboxResourceIds(userId) {
  if (typeof userId !== 'string' || !userId.trim()) return null;
  return {
    boardId: `personal-inbox-${userId}`,
    listId: `personal-inbox-list-${userId}`,
    swimlaneId: `personal-inbox-swimlane-${userId}`,
  };
}

function normalizeCaptureUrl(value) {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return '';
  if (raw.length > 2048) return null;
  try {
    const parsed = new URL(raw);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    // A captured link is displayed to every authorized member after the card is
    // moved. Never persist credentials hidden inside its authority component.
    if (parsed.username || parsed.password) return null;
    return parsed.toString();
  } catch (_) {
    return null;
  }
}

function isOwnedPersonalInbox(board, userId) {
  if (!board || !userId) return false;
  const members = Array.isArray(board.members) ? board.members : [];
  return (
    board.personalInboxOwnerId === userId &&
    board.permission === 'private' &&
    members.some(member =>
      member && member.userId === userId && member.isActive === true,
    )
  );
}

function isPersonalInboxCard(card, board, userId) {
  return Boolean(
    card &&
    board &&
    card.boardId === board._id &&
    isOwnedPersonalInbox(board, userId),
  );
}

module.exports = {
  PERSONAL_INBOX_TITLE,
  PERSONAL_INBOX_LIST_TITLE,
  PERSONAL_INBOX_SWIMLANE_TITLE,
  personalInboxResourceIds,
  normalizeCaptureUrl,
  isOwnedPersonalInbox,
  isPersonalInboxCard,
};
