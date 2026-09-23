// File records are authoritative: activity history may be pruned or absent.
// Older exports stored the card association only in addAttachment activities.
export function importedAttachmentsByCard(board) {
  const result = Object.create(null);
  const legacyCards = new Map();
  for (const activity of board.activities || []) {
    if (activity.activityType === 'addAttachment') {
      legacyCards.set(activity.attachmentId, activity.cardId);
    }
  }
  const seen = new Set();
  for (const attachment of board.attachments || []) {
    const cardId = attachment.meta?.cardId || attachment.cardId || legacyCards.get(attachment._id);
    if (!cardId || (!attachment.file && !attachment.url) || seen.has(attachment._id)) continue;
    if (attachment._id) seen.add(attachment._id);
    (result[cardId] ||= []).push(attachment);
  }
  return result;
}
