'use strict';
const { liveAttachments } = require('../../models/lib/attachmentSoftDelete');
const { isAssignedOnlyMember } = require('../../models/lib/boardCardScope');
const { snapshotRuleEmailAttachments } = require('./ruleEmailAttachments');

// Resolve only the triggering card, never a linked card or an action-supplied
// attachment ID. Recheck access after I/O, before handing bytes to the mailer.
async function prepareRuleCardAttachments({ activity, cache, canReadBoard, openStream, onManifest = () => {} }) {
  const authorize = async () => {
    const card = await cache.getCard(activity.cardId);
    const board = card && await cache.getBoard(card.boardId);
    if (!activity.userId || !card || card.deletedAt || card.boardId !== activity.boardId ||
        !canReadBoard(activity.userId, board) ||
        (isAssignedOnlyMember(board, activity.userId) && !card.assignees?.includes(activity.userId))) {
      throw new Error('rule-email-attachments-not-authorized');
    }
    return card;
  };
  const card = await authorize();
  const coverId = card.coverId;
  const readFiles = () => cache.getAttachments(liveAttachments({ 'meta.cardId': activity.cardId }), { sort: { _id: 1 } });
  const files = await readFiles();
  if (files.some(file => file.meta?.cardId !== activity.cardId || file.deletedAt)) throw new Error('rule-email-attachments-changed');
  const signature = JSON.stringify(files);
  const snapshots = await snapshotRuleEmailAttachments(files, async file => {
    await authorize();
    return openStream(file);
  });
  const lines = [];
  for (let index = 0; index < snapshots.length; index++) {
    const snapshot = snapshots[index], file = files[index];
    lines.push(`File: ${snapshot.filename}`, `Size (bytes): ${Buffer.byteLength(snapshot.content, 'base64')}`,
      `Type: ${snapshot.contentType}`);
    if (typeof coverId === 'string' && coverId && file._id === coverId) lines.push('Cover: true');
    const uploaded = file.uploadedAt || file.uploadedAtOstrio || file.createdAt;
    if (uploaded instanceof Date && Number.isFinite(+uploaded)) lines.push(`Uploaded: ${uploaded.toISOString()}`);
    const userId = file.userId || file.meta?.userId;
    if (typeof userId === 'string' && userId) {
      const user = await cache.getUser(userId);
      lines.push(`Uploaded by: ${user?.profile?.fullname || user?.username || 'Unknown user'}`);
    }
    lines.push('');
  }
  const manifest = lines.length ? `Attachments:\n${lines.join('\n').trimEnd()}` : '';
  if (Buffer.byteLength(manifest, 'utf8') > 256 * 1024) throw new Error('rule-email-attachment-manifest-too-large');
  if (JSON.stringify(await readFiles()) !== signature) throw new Error('rule-email-attachments-changed');
  if ((await authorize()).coverId !== coverId) throw new Error('rule-email-attachments-changed');
  onManifest(manifest);
  return snapshots;
}
module.exports = { prepareRuleCardAttachments };
