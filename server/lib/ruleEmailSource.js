'use strict';
const { isAssignedOnlyMember } = require('../../models/lib/boardCardScope');
const { votingVisibility } = require('./ruleCardVoting');
const { sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { scrumVisibility } = require('./ruleCardScrum');
const validVisibility = row => Array.isArray(row) && row.length === 4 &&
  row.slice(0, 3).every(value => typeof value === 'boolean') &&
  (row[3] === null || (typeof row[3] === 'string' && Number.isFinite(Date.parse(row[3])) && new Date(row[3]).toISOString() === row[3]));
const identity = card => JSON.stringify([card?._id, card?.boardId, card?.type, card?.linkedId]);

function validateRuleEmailSourceBinding(binding, activity) {
  const fail = () => { throw new Error('rule-email-source-binding-invalid'); };
  const id = value => typeof value === 'string' && value.length > 0 && value.length <= 1024;
  if (!binding || Object.keys(binding).sort().join(',') !== (binding.version === 5 ? 'adminAccess,cards,customFieldPolicies,linkedBoardId,linkedBoardVisibility,relatedSources,scrumVisibility,version,visibility' :
        binding.version === 4 ? 'cards,linkedBoardId,linkedBoardVisibility,scrumVisibility,version,visibility' :
        binding.version === 3 ? 'cards,linkedBoardId,linkedBoardVisibility,version,visibility' :
        binding.version === 2 ? 'cards,linkedBoardId,version,visibility' : 'cards,linkedBoardId,version') ||
      ![1, 2, 3, 4, 5].includes(binding.version) || !Array.isArray(binding.cards) || !binding.cards.length || binding.cards.length > 32) fail();
  if (binding.version >= 2 && (!Array.isArray(binding.visibility) || binding.visibility.length !== binding.cards.length ||
      !binding.visibility.every(validVisibility))) fail();
  if (binding.version >= 3 && (binding.linkedBoardId === null
    ? binding.linkedBoardVisibility !== null : !validVisibility(binding.linkedBoardVisibility))) fail();
  if (binding.version >= 4 && (!Array.isArray(binding.scrumVisibility) || binding.scrumVisibility.length !== binding.cards.length ||
      !binding.scrumVisibility.every(row => Array.isArray(row) && row.length === 6 && row.every(value => typeof value === 'boolean')))) fail();
  if (binding.version === 5) {
    if (!Array.isArray(binding.customFieldPolicies) || binding.customFieldPolicies.length > binding.cards.length ||
        new Set(binding.customFieldPolicies.map(row => row?.boardId)).size !== binding.customFieldPolicies.length ||
        !binding.customFieldPolicies.every(row => row && Object.keys(row).sort().join(',') === 'boardId,hash' &&
          id(row.boardId) && binding.cards.some(card => card?.[1] === row.boardId) && typeof row.hash === 'string' && /^[a-f0-9]{64}$/.test(row.hash))) fail();
    if (!Array.isArray(binding.adminAccess) || binding.adminAccess.length !== binding.cards.length || !binding.adminAccess.every(value => typeof value === 'boolean')) fail();
    if (!Array.isArray(binding.relatedSources) || binding.relatedSources.length > 1000) fail();
    for (const related of binding.relatedSources) {
      // References contain one nonrecursive source chain, never other references.
      if (related?.version !== 4 || !Array.isArray(related.cards?.[0])) fail();
      validateRuleEmailSourceBinding(related, { cardId: related.cards[0][0], boardId: related.cards[0][1] });
    }
  }
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

async function assertRuleEmailSourceBinding({ binding, activity, cache, canReadBoard, requireRelatedSources = false }) {
  // Legacy snapshots have no evidence of which source supplied their content.
  // Keep them readable, but never infer or recapture that evidence on retry.
  if (!binding || (requireRelatedSources && binding.version < 5)) throw new Error('rule-email-source-binding-required');
  validateRuleEmailSourceBinding(binding, activity);
  for (const [index, row] of binding.cards.entries()) {
    const card = await cache.getCard(row[0]);
    const board = card && await cache.getBoard(card.boardId);
    if (!activity.userId || !card || card.deletedAt || !canReadBoard(activity.userId, board) ||
        (isAssignedOnlyMember(board, activity.userId) && !card.assignees?.includes(activity.userId))) {
      throw new Error('rule-email-source-not-authorized');
    }
    if (binding.version === 5 && binding.adminAccess[index] && !board.hasAdmin?.(activity.userId)) {
      throw new Error('rule-email-source-not-authorized');
    }
    if (binding.version >= 2 && JSON.stringify(votingVisibility(card, board)) !== JSON.stringify(binding.visibility[index])) {
      throw new Error('rule-email-source-visibility-changed');
    }
    if (binding.version >= 4 && JSON.stringify(scrumVisibility(board)) !== JSON.stringify(binding.scrumVisibility[index])) {
      throw new Error('rule-email-source-visibility-changed');
    }
    if (identity(card) !== JSON.stringify(row)) throw new Error('rule-email-source-changed');
  }
  if (binding.linkedBoardId) {
    const board = await cache.getBoard(binding.linkedBoardId);
    if (!canReadBoard(activity.userId, board)) throw new Error('rule-email-source-not-authorized');
    if (binding.version >= 3 && JSON.stringify(votingVisibility(board, board)) !== JSON.stringify(binding.linkedBoardVisibility)) {
      throw new Error('rule-email-source-visibility-changed');
    }
  }
  for (const policy of binding.customFieldPolicies || []) {
    const definitions = await cache.getCustomFields({ boardIds: { $in: [policy.boardId] } }, { sort: { _id: 1 } });
    if (sha256(JSON.stringify(definitions)) !== policy.hash) throw new Error('rule-email-source-field-policy-changed');
  }
  for (const related of binding.relatedSources || []) {
    await assertRuleEmailSourceBinding({ binding: related, cache, canReadBoard,
      activity: { ...activity, cardId: related.cards[0][0], boardId: related.cards[0][1] } });
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
    return board;
  };
  while (true) {
    if (typeof id !== 'string' || !id || seen.has(id) || seen.size >= 32) throw new Error('rule-email-source-invalid');
    seen.add(id);
    card = await cache.getCard(id);
    const cardBoard = await readable(card);
    if (!chain.length && card.boardId !== activity.boardId) throw new Error('rule-email-source-not-authorized');
    chain.push({ id, identity: identity(card), visibility: votingVisibility(card, cardBoard), scrumVisibility: scrumVisibility(cardBoard), adminAccess: !!cardBoard.hasAdmin?.(activity.userId) });
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
  const binding = { version: 5, customFieldPolicies: [], relatedSources: [], adminAccess: chain.map(item => item.adminAccess), cards: chain.map(item => JSON.parse(item.identity)), linkedBoardId,
    visibility: chain.map(item => item.visibility), scrumVisibility: chain.map(item => item.scrumVisibility), linkedBoardVisibility };
  validateRuleEmailSourceBinding(binding, activity);
  const assertCurrent = () => assertRuleEmailSourceBinding({ binding, activity, cache, canReadBoard });
  const addRelatedSource = source => {
    const { relatedSources, adminAccess, customFieldPolicies, ...snapshot } = JSON.parse(JSON.stringify(source));
    snapshot.version = 4;
    validateRuleEmailSourceBinding(snapshot, { cardId: snapshot.cards[0][0], boardId: snapshot.cards[0][1] });
    const previous = binding.relatedSources.find(row => row.cards[0][0] === snapshot.cards[0][0]);
    if (previous && JSON.stringify(previous) !== JSON.stringify(snapshot)) throw new Error('rule-email-source-changed');
    if (!previous) binding.relatedSources.push(snapshot);
    validateRuleEmailSourceBinding(binding, activity);
  };
  const addCustomFieldPolicy = (boardId, definitions) => {
    const hash = sha256(JSON.stringify(definitions));
    const previous = binding.customFieldPolicies.find(row => row.boardId === boardId);
    if (previous && previous.hash !== hash) throw new Error('rule-email-source-field-policy-changed');
    if (!previous) binding.customFieldPolicies.push({ boardId, hash });
    validateRuleEmailSourceBinding(binding, activity);
  };
  return { card, activity: sourceActivity, binding, assertCurrent, addRelatedSource, addCustomFieldPolicy };
}
async function resolveRuleEmailReference({ id, activity, cache, canReadBoard }) {
  if (typeof id !== 'string' || !id) return null;
  const target = await cache.getCard(id);
  if (!target || target._id !== id) return null;
  try {
    return await resolveRuleEmailSource({ activity: { ...activity, cardId: id, boardId: target.boardId }, cache, canReadBoard });
  } catch (error) {
    if (['rule-email-source-not-authorized', 'rule-email-source-invalid'].includes(error.message)) return null;
    throw error;
  }
}
module.exports = { resolveRuleEmailReference, resolveRuleEmailSource, validateRuleEmailSourceBinding, assertRuleEmailSourceBinding };
