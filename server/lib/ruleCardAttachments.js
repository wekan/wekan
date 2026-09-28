'use strict';
const { liveAttachments } = require('../../models/lib/attachmentSoftDelete');
const { isAssignedOnlyMember } = require('../../models/lib/boardCardScope');
const { snapshotRuleEmailAttachments } = require('./ruleEmailAttachments');

// Resolve only the triggering card, never a linked card or an action-supplied
// attachment ID. Recheck access after I/O, before handing bytes to the mailer.
async function prepareRuleCardAttachments({ activity, cache, canReadBoard, openStream }) {
  const authorize = async () => {
    const card = await cache.getCard(activity.cardId);
    const board = card && await cache.getBoard(card.boardId);
    if (!activity.userId || !card || card.boardId !== activity.boardId ||
        !canReadBoard(activity.userId, board) ||
        (isAssignedOnlyMember(board, activity.userId) && !card.assignees?.includes(activity.userId))) {
      throw new Error('rule-email-attachments-not-authorized');
    }
    return card;
  };
  await authorize();
  const readFiles = () => cache.getAttachments(liveAttachments({ 'meta.cardId': activity.cardId }), { sort: { _id: 1 } });
  const files = await readFiles();
  const signature = JSON.stringify(files);
  const snapshots = await snapshotRuleEmailAttachments(files, async file => {
    await authorize();
    return openStream(file);
  });
  await authorize();
  if (JSON.stringify(await readFiles()) !== signature) throw new Error('rule-email-attachments-changed');
  return snapshots;
}
module.exports = { prepareRuleCardAttachments };
