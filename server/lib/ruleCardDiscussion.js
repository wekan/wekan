'use strict';
const { isAssignedOnlyMember } = require('../../models/lib/boardCardScope');
const { notDeleted } = require('../../models/lib/softDelete');

// Only public prose is rendered. Never serialize full comment/checklist
// documents: comments may hold private webhook response state.
async function prepareRuleCardDiscussion({ activity, cache, canReadBoard, commentsOnly = false, onRelatedSource = () => {} }) {
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
    commentsOnly ? [] : cache.getChecklists(notDeleted({ cardId: activity.cardId }), { sort: { sort: 1, _id: 1 } }),
    commentsOnly ? [] : cache.getChecklistItems(notDeleted({ cardId: activity.cardId }), { sort: { sort: 1, _id: 1 } }),
    cache.getCardComments(notDeleted({ cardId: activity.cardId, boardId: activity.boardId }), { sort: { createdAt: 1, _id: 1 } }),
  ]);
  const commentIds = comments.filter(comment => comment.cardId === activity.cardId &&
    comment.boardId === activity.boardId && !comment.deletedAt && typeof comment._id === 'string').map(comment => comment._id);
  const reactions = commentIds.length ? await cache.getCardCommentReactions({
    cardId: activity.cardId, boardId: activity.boardId, cardCommentId: { $in: commentIds },
  }, { sort: { _id: 1 } }) : [];
  const allowedComments = new Set(commentIds), reactionsByComment = new Map();
  for (const row of reactions) {
    if (row.cardId !== activity.cardId || row.boardId !== activity.boardId || !allowedComments.has(row.cardCommentId)) continue;
    if (!reactionsByComment.has(row.cardCommentId)) reactionsByComment.set(row.cardCommentId, new Map());
    const groups = reactionsByComment.get(row.cardCommentId);
    for (const reaction of Array.isArray(row.reactions) ? row.reactions : []) {
      if (!reaction || typeof reaction.reactionCodepoint !== 'string' || !/^&#\d{4,6};$/.test(reaction.reactionCodepoint)) continue;
      const code = Number(reaction.reactionCodepoint.slice(2, -1));
      if (code < 0x20 || (code >= 0x7f && code <= 0x9f) || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) continue;
      if (!groups.has(code)) groups.set(code, new Set());
      for (const id of Array.isArray(reaction.userIds) ? reaction.userIds : []) {
        if (typeof id === 'string' && id) groups.get(code).add(id);
      }
    }
  }
  const lines = [], related = [];
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
        if (typeof item.linkedCardId === 'string' && item.linkedCardId) {
          const { resolveRuleEmailReference } = require('./ruleEmailSource');
          const source = await resolveRuleEmailReference({ id: item.linkedCardId, activity, cache, canReadBoard });
          if (source) {
            related.push(source); onRelatedSource(source.binding);
            if (typeof source.card.title === 'string' && source.card.title) add(`    Converted subtask: ${source.card.title}`);
          }
        }
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
      const summary = [...(reactionsByComment.get(comment._id) || [])]
        .filter(([, users]) => users.size).sort(([a], [b]) => a - b)
        .map(([code, users]) => `${String.fromCodePoint(code)} ${users.size}`);
      if (summary.length) add(`Reactions: ${summary.join(', ')}`);
    }
  }
  for (const source of related) await source.assertCurrent();
  await authorize();
  return lines.join('\n');
}
module.exports = { prepareRuleCardDiscussion };
