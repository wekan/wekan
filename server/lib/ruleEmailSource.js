'use strict';
const { isAssignedOnlyMember } = require('../../models/lib/boardCardScope');
const { votingVisibility } = require('./ruleCardVoting');
const validVisibility = row => Array.isArray(row) && row.length === 4 &&
  row.slice(0, 3).every(value => typeof value === 'boolean') &&
  (row[3] === null || (typeof row[3] === 'string' && Number.isFinite(Date.parse(row[3])) && new Date(row[3]).toISOString() === row[3]));
const identity = card => JSON.stringify([card?._id, card?.boardId, card?.type, card?.linkedId]);

function validateRuleEmailSourceBinding(binding, activity) {
  const fail = () => { throw new Error('rule-email-source-binding-invalid'); };
  const id = value => typeof value === 'string' && value.length > 0 && value.length <= 1024;
  if (!binding || Object.keys(binding).sort().join(',') !== (binding.version === 3 ? 'cards,linkedBoardId,linkedBoardVisibility,version,visibility' :
        binding.version === 2 ? 'cards,linkedBoardId,version,visibility' : 'cards,linkedBoardId,version') ||
      ![1, 2, 3].includes(binding.version) || !Array.isArray(binding.cards) || !binding.cards.length || binding.cards.length > 32) fail();
  if (binding.version >= 2 && (!Array.isArray(binding.visibility) || binding.visibility.length !== binding.cards.length ||
      !binding.visibility.every(validVisibility))) fail();
  if (binding.version === 3 && (binding.linkedBoardId === null
    ? binding.linkedBoardVisibility !== null : !validVisibility(binding.linkedBoardVisibility))) fail();
  const seen = new Set();
  for (let i = 0; i < binding.cards.length; i++) {
    const row = binding.cards[i];
    if (!Array.isArray(row) || row.length !== 4 || !id(row[0]) || !id(row[1]) ||
        !row.slice(2).every(value => value === null || (typeof value === 'string' && value.length <= 1024)) ||
        seen.has(row[0])) fail();
    seen.add(row[0]);
    if (i === 0 && (row[0] !== activity.cardId || row[1] !== activity.boardId)) fail();
    const next = binding.cards[i + 1];
    if (next) {
      if (row[2] !== 'cardType-linkedCard' || row[3] !== next[0]) fail();
    } else if (row[2] === 'cardType-linkedCard' ||
        (row[2] === 'cardType-linkedBoard'
          ? !id(row[3]) || row[3] !== binding.linkedBoardId
          : binding.linkedBoardId !== null)) fail();
  }
}

async function assertRuleEmailSourceBinding({ binding, activity, cache, canReadBoard }) {
  // Legacy snapshots have no evidence of which source supplied their content.
  // Keep them readable, but never infer or recapture that evidence on retry.
  if (!binding) throw new Error('rule-email-source-binding-required');
  validateRuleEmailSourceBinding(binding, activity);
  for (const [index, row] of binding.cards.entries()) {
    const card = await cache.getCard(row[0]);
    const board = card && await cache.getBoard(card.boardId);
    if (!activity.userId || !card || card.deletedAt || !canReadBoard(activity.userId, board) ||
        (isAssignedOnlyMember(board, activity.userId) && !card.assignees?.includes(activity.userId))) {
      throw new Error('rule-email-source-not-authorized');
    }
    if (binding.version >= 2 && JSON.stringify(votingVisibility(card, board)) !== JSON.stringify(binding.visibility[index])) {
      throw new Error('rule-email-source-visibility-changed');
    }
    if (identity(card) !== JSON.stringify(row)) throw new Error('rule-email-source-changed');
  }
  if (binding.linkedBoardId) {
    const board = await cache.getBoard(binding.linkedBoardId);
    if (!canReadBoard(activity.userId, board)) throw new Error('rule-email-source-not-authorized');
    if (binding.version === 3 && JSON.stringify(votingVisibility(board, board)) !== JSON.stringify(binding.linkedBoardVisibility)) {
      throw new Error('rule-email-source-visibility-changed');
    }
  }
}

async function resolveRuleEmailSource({ activity, cache, canReadBoard }) {
  const chain = [], seen = new Set();
  let id = activity.cardId, linkedBoardId = null, linkedBoardVisibility = null, card, sourceActivity = activity;
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
    chain.push({ id, identity: identity(card), visibility: votingVisibility(card, await cache.getBoard(card.boardId)) });
    sourceActivity = { ...activity, cardId: card._id, boardId: card.boardId };
    if (card.type === 'cardType-linkedCard') { id = card.linkedId; continue; }
    if (card.type === 'cardType-linkedBoard') {
      if (typeof card.linkedId !== 'string' || !card.linkedId) throw new Error('rule-email-source-invalid');
      linkedBoardId = card.linkedId;
      const board = await cache.getBoard(linkedBoardId);
      if (!canReadBoard(activity.userId, board)) throw new Error('rule-email-source-not-authorized');
      linkedBoardVisibility = votingVisibility(board, board);
      const view = Object.assign(Object.create(Object.getPrototypeOf(card)), card);
      for (const field of ['title', 'description', 'receivedAt', 'startAt', 'dueAt', 'endAt']) view[field] = board[field];
      card = view;
    }
    break;
  }
  const binding = { version: 3, cards: chain.map(item => JSON.parse(item.identity)), linkedBoardId,
    visibility: chain.map(item => item.visibility), linkedBoardVisibility };
  validateRuleEmailSourceBinding(binding, activity);
  const assertCurrent = () => assertRuleEmailSourceBinding({ binding, activity, cache, canReadBoard });
  return { card, activity: sourceActivity, binding, assertCurrent };
}
module.exports = { resolveRuleEmailSource, validateRuleEmailSourceBinding, assertRuleEmailSourceBinding };
