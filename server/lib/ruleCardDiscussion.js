'use strict';
const { isAssignedOnlyMember } = require('../../models/lib/boardCardScope');
const { notDeleted } = require('../../models/lib/softDelete');

// Only public prose is rendered. Never serialize full comment/checklist
// documents: comments may hold private webhook response state.
async function prepareRuleCardDiscussion({ activity, cache, canReadBoard }) {
  const authorize = async () => {
    const card = await cache.getCard(activity.cardId);
    const board = card && await cache.getBoard(card.boardId);
    if (!activity.userId || !card || card.deletedAt || card.boardId !== activity.boardId ||
        !canReadBoard(activity.userId, board) ||
        (isAssignedOnlyMember(board, activity.userId) && !card.assignees?.includes(activity.userId))) {
      throw new Error('rule-email-card-content-not-authorized');
    }
  };
  await authorize();
  const [checklists, items, comments] = await Promise.all([
    cache.getChecklists(notDeleted({ cardId: activity.cardId }), { sort: { sort: 1, _id: 1 } }),
    cache.getChecklistItems(notDeleted({ cardId: activity.cardId }), { sort: { sort: 1, _id: 1 } }),
    cache.getCardComments(notDeleted({ cardId: activity.cardId, boardId: activity.boardId }), { sort: { createdAt: 1, _id: 1 } }),
  ]);
  const lines = [];
  let bytes = 0;
  const add = value => {
    const line = String(value ?? '');
    bytes += Buffer.byteLength(line, 'utf8') + 1;
    if (bytes > 768 * 1024) throw new Error('rule-email-card-content-too-large');
    lines.push(line);
  };
  const dateLine = (label, value, indent = '  ') => {
    if (value instanceof Date && Number.isFinite(+value)) add(`${indent}${label}: ${value.toISOString()}`);
  };
  const itemsByChecklist = new Map();
  for (const item of items) {
    if (item.cardId !== activity.cardId || item.deletedAt) continue;
    if (!itemsByChecklist.has(item.checklistId)) itemsByChecklist.set(item.checklistId, []);
    itemsByChecklist.get(item.checklistId).push(item);
  }
  if (checklists.length) {
    add('Checklists:');
    for (const checklist of checklists) {
      if (checklist.cardId !== activity.cardId || checklist.deletedAt) continue;
      add(checklist.title);
      dateLine('Due', checklist.dueAt);
      dateLine('Finished', checklist.finishedAt);
      if (typeof checklist.resetInterval === 'string' && checklist.resetInterval) add(`  Reset interval: ${checklist.resetInterval}`);
      dateLine('Last reset', checklist.lastResetAt);
      for (const item of itemsByChecklist.get(checklist._id) || []) {
        add(`  [${item.isFinished ? 'x' : ' '}] ${item.title || ''}`);
        dateLine('Due', item.dueAt, '    ');
      }
    }
  }
  if (comments.length) {
    if (lines.length) add('');
    add('Comments:');
    for (const comment of comments) {
      if (comment.cardId !== activity.cardId || comment.boardId !== activity.boardId || comment.deletedAt) continue;
      const time = comment.createdAt instanceof Date && Number.isFinite(+comment.createdAt) ? comment.createdAt.toISOString() : '';
      // Only public author display names; never account email or services.
      add(time ? `[${time}]` : '---');
      if (typeof comment.userId === 'string' && comment.userId) {
        const author = await cache.getUser(comment.userId);
        add(`Author: ${author?.profile?.fullname || author?.username || 'Unknown user'}`);
      }
      dateLine('Edited', comment.modifiedAt, '');
      add(comment.text);
    }
  }
  await authorize();
  return lines.join('\n');
}
module.exports = { prepareRuleCardDiscussion };
