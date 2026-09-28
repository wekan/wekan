'use strict';
const { isAssignedOnlyMember } = require('../../models/lib/boardCardScope');
const identity = card => JSON.stringify([card?._id, card?.boardId, card?.type, card?.linkedId]);

async function resolveRuleEmailSource({ activity, cache, canReadBoard }) {
  const chain = [], seen = new Set();
  let id = activity.cardId, linkedBoardId = null, card, sourceActivity = activity;
  const readable = async value => {
    const board = value && await cache.getBoard(value.boardId);
    if (!activity.userId || !value || value.deletedAt || !canReadBoard(activity.userId, board) ||
        (isAssignedOnlyMember(board, activity.userId) && !value.assignees?.includes(activity.userId))) {
      throw new Error('rule-email-source-not-authorized');
    }
  };
  while (true) {
    if (typeof id !== 'string' || !id || seen.has(id) || seen.size >= 32) throw new Error('rule-email-source-invalid');
    seen.add(id);
    card = await cache.getCard(id);
    await readable(card);
    if (!chain.length && card.boardId !== activity.boardId) throw new Error('rule-email-source-not-authorized');
    chain.push({ id, identity: identity(card) });
    sourceActivity = { ...activity, cardId: card._id, boardId: card.boardId };
    if (card.type === 'cardType-linkedCard') { id = card.linkedId; continue; }
    if (card.type === 'cardType-linkedBoard') {
      if (typeof card.linkedId !== 'string' || !card.linkedId) throw new Error('rule-email-source-invalid');
      linkedBoardId = card.linkedId;
      const board = await cache.getBoard(linkedBoardId);
      if (!canReadBoard(activity.userId, board)) throw new Error('rule-email-source-not-authorized');
      const view = Object.assign(Object.create(Object.getPrototypeOf(card)), card);
      for (const field of ['title', 'description', 'receivedAt', 'startAt', 'dueAt', 'endAt']) view[field] = board[field];
      card = view;
    }
    break;
  }
  const assertCurrent = async () => {
    for (const item of chain) {
      const current = await cache.getCard(item.id);
      await readable(current);
      if (identity(current) !== item.identity) throw new Error('rule-email-source-changed');
    }
    if (linkedBoardId && !canReadBoard(activity.userId, await cache.getBoard(linkedBoardId))) throw new Error('rule-email-source-not-authorized');
  };
  return { card, activity: sourceActivity, assertCurrent };
}
module.exports = { resolveRuleEmailSource };

// Stored commands currently bind only the triggering card, not a link's
// resolved source chain. Until that chain is stored and verified on retry,
// refuse linked commands (including already captured commands) before SMTP.
async function requireBoundStoredEmailSource(activity, cache) {
  const card = await cache.getCard(activity.cardId);
  if (!card || card.boardId !== activity.boardId || card.deletedAt) throw new Error('rule-email-source-not-authorized');
  if (['cardType-linkedCard', 'cardType-linkedBoard'].includes(card.type)) throw new Error('rule-email-source-binding-required');
}
module.exports.requireBoundStoredEmailSource = requireBoundStoredEmailSource;
