import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import Rules from '/models/rules';
import Triggers from '/models/triggers';
import Actions from '/models/actions';
import { canDeleteBoardRule } from '/models/lib/ruleDeletePermission';
import { tripCanary } from '/server/lib/canary';
import { TAPi18n } from '/imports/i18n';
import { secureTransfer } from '/server/lib/secureTransfer';
import { TriggersDef } from '/server/triggersDef';
import { allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';
import { CARD_COLORS } from '/models/metadata/colors';
import {
  normalizeRuleTrigger,
  parseRuleTransferText,
  stripRuleTransferDoc,
} from '/models/lib/ruleTransfer';
const {
  workflowAction,
  workflowSourceLabel,
  workflowTrigger,
} = require('/models/lib/ruleWorkflowCatalog');
const {
  EXTERNAL_RULE_FORMATS,
  parseTrelloButler,
  parseWorkflowData,
} = require('/models/lib/ruleExternalImport');
const {
  buildParameterizedAction,
  buildParameterizedTrigger,
} = require('/models/lib/ruleParameterizedCatalog');

const MAX_RULE_TITLE_LENGTH = 500;
const MAX_RULE_IMPORT_BYTES = 1024 * 1024;
const MAX_RULE_IMPORT_COUNT = 1000;
const RULE_ACTION_TYPES = new Set([
  'addChecklist', 'addChecklistWithItems', 'addLabel', 'addMember', 'addSwimlane',
  'archive', 'checkAll', 'checkItem', 'createCard', 'linkCard',
  'markCardComplete', 'markCardIncomplete', 'moveAllCardsInList',
  'moveCardToBottom', 'moveCardToTop', 'removeChecklist', 'removeDate',
  'removeLabel', 'removeMember', 'sendEmail', 'setColor', 'setDate',
  'setDateRelative', 'sortList', 'unarchive', 'uncheckAll', 'uncheckItem',
  'updateDate',
]);
const RULE_TRIGGER_TYPES = new Set([
  ...Object.keys(TriggersDef), 'button', 'scheduledTrigger',
]);

function normalizedRuleTitle(value) {
  const title = typeof value === 'string' ? value.trim() : '';
  if (!title || title.length > MAX_RULE_TITLE_LENGTH) {
    throw new Meteor.Error('invalid-title', 'Rule title must contain 1-500 characters');
  }
  return title;
}

async function editableRule(userId, ruleId, routeBoardId) {
  if (typeof userId !== 'string' || typeof ruleId !== 'string') {
    throw new Meteor.Error('not-authorized');
  }
  const rule = await ReactiveCache.getRule(ruleId);
  if (!rule) throw new Meteor.Error('not-found', 'Rule not found');
  if (routeBoardId !== undefined && routeBoardId !== rule.boardId) {
    tripCanary('rule.cross-board-write', { userId });
    throw new Meteor.Error('not-authorized', 'Rule does not belong to route board');
  }
  const [board, user] = await Promise.all([
    ReactiveCache.getBoard(rule.boardId),
    ReactiveCache.getUser(userId),
  ]);
  if (!board) throw new Meteor.Error('not-found', 'Board not found');
  if (!canDeleteBoardRule(board, userId, { isSiteAdmin: !!user?.isAdmin })) {
    throw new Meteor.Error('not-authorized', 'Must be a board admin');
  }
  return rule;
}

async function editableBoard(userId, boardId) {
  if (typeof userId !== 'string' || typeof boardId !== 'string') {
    throw new Meteor.Error('not-authorized');
  }
  const [board, user] = await Promise.all([
    ReactiveCache.getBoard(boardId),
    ReactiveCache.getUser(userId),
  ]);
  if (!board) throw new Meteor.Error('not-found', 'Board not found');
  if (!canDeleteBoardRule(board, userId, { isSiteAdmin: !!user?.isAdmin })) {
    throw new Meteor.Error('not-authorized', 'Must be a board admin');
  }
  return board;
}

function workflowDescription(entry) {
  return workflowSourceLabel(entry, TAPi18n.getDefaultTranslations('r-'));
}

function importedRuleEntry(entry, index) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)
    || !entry.trigger || typeof entry.trigger !== 'object' || Array.isArray(entry.trigger)
    || !entry.action || typeof entry.action !== 'object' || Array.isArray(entry.action)) {
    throw new Meteor.Error('invalid-rule-import', `Invalid rule at index ${index}`);
  }
  const trigger = normalizeRuleTrigger(stripRuleTransferDoc(entry.trigger));
  const action = stripRuleTransferDoc(entry.action);
  if (!RULE_TRIGGER_TYPES.has(trigger.activityType)
    || !RULE_ACTION_TYPES.has(action.actionType)) {
    throw new Meteor.Error('invalid-rule-import', `Unknown rule type at index ${index}`);
  }
  return {
    title: normalizedRuleTitle(entry.title || 'Imported rule'), trigger, action,
  };
}

async function insertRuleTuple(boardId, entry) {
  let triggerId;
  let actionId;
  try {
    triggerId = await Triggers.insertAsync({ ...entry.trigger, boardId });
    actionId = await Actions.insertAsync({ boardId, ...entry.action });
    const ruleDoc = {
      title: entry.title, triggerId, actionId, boardId,
    };
    if (entry.trigger.activityType === 'button') {
      ruleDoc.buttonType = entry.trigger.buttonType;
      ruleDoc.buttonLabel = entry.trigger.buttonLabel;
    }
    const ruleId = await Rules.insertAsync(ruleDoc);
    return { _id: ruleId, triggerId, actionId };
  } catch (error) {
    if (triggerId) await Triggers.removeAsync(triggerId).catch(() => {});
    if (actionId) await Actions.removeAsync(actionId).catch(() => {});
    throw error;
  }
}

function boardHasLabel(board, labelId) {
  return labelId === '*' || (Array.isArray(board.labels)
    && board.labels.some(label => label?._id === labelId));
}

async function boardUsername(board, username, required) {
  if (!username || username === '*') {
    if (required) throw new Meteor.Error('invalid-rule-parameter', 'Member is required');
    return null;
  }
  const user = await Meteor.users.findOneAsync({ username }, { fields: { _id: 1 } });
  if (!user || !board.hasMember(user._id)) {
    throw new Meteor.Error('invalid-rule-parameter', 'Member must belong to this board');
  }
  return user;
}

export async function createAccessibleParameterizedRule(userId, input = {}) {
  const board = await editableBoard(userId, input.boardId);
  const safe = secureTransfer({ title: input.title, fields: input.fields || {} }, {
    direction: 'import', source: 'rules:parameterized-builder', userId,
    maxDepth: 3, maxNodes: 100, maxArray: 100, maxString: 10000,
  });
  const fields = { ...safe.fields, sourceBoardId: board._id };
  if (fields.triggerUsername && fields.triggerUsername !== '*') {
    const triggerUser = await boardUsername(board, fields.triggerUsername, true);
    fields.triggerUserId = triggerUser._id;
  }
  const trigger = buildParameterizedTrigger(input.triggerKind, fields);
  const action = buildParameterizedAction(input.actionKind, fields);
  if (trigger.labelId && !boardHasLabel(board, trigger.labelId)) {
    throw new Meteor.Error('invalid-rule-parameter', 'Trigger label must belong to this board');
  }
  if (['addLabel', 'removeLabel'].includes(action.actionType)
    && !boardHasLabel(board, action.labelId)) {
    throw new Meteor.Error('invalid-rule-parameter', 'Action label must belong to this board');
  }
  if (['addMember', 'removeMember'].includes(action.actionType)
    && action.username !== '*') await boardUsername(board, action.username, true);
  if (action.actionType === 'addSwimlane' && !action.swimlaneName) {
    throw new Meteor.Error('invalid-rule-parameter', 'Swimlane name is required');
  }
  if (action.actionType === 'setColor' && !CARD_COLORS.includes(action.selectedColor)) {
    throw new Meteor.Error('invalid-rule-parameter', 'Unknown card color');
  }
  if (action.actionType === 'createCard' && !action.cardName) {
    throw new Meteor.Error('invalid-rule-parameter', 'Card name is required');
  }
  if (['addChecklist', 'removeChecklist', 'checkAll', 'uncheckAll',
    'checkItem', 'uncheckItem', 'addChecklistWithItems'].includes(action.actionType)
    && !action.checklistName) {
    throw new Meteor.Error('invalid-rule-parameter', 'Checklist name is required');
  }
  if (['checkItem', 'uncheckItem'].includes(action.actionType)
    && !action.checkItemName) {
    throw new Meteor.Error('invalid-rule-parameter', 'Checklist item name is required');
  }
  if (action.actionType === 'sendEmail' && !action.emailTo) {
    throw new Meteor.Error('invalid-rule-parameter', 'Email recipient is required');
  }
  if (['moveCardToTop', 'moveCardToBottom', 'linkCard'].includes(action.actionType)) {
    const destination = await ReactiveCache.getBoard(action.boardId);
    if (!destination || !allowIsBoardMemberWithWriteAccess(userId, destination)) {
      tripCanary('rule.cross-board-write', { userId });
      throw new Meteor.Error('not-authorized', 'Must have write access to destination board');
    }
  }
  return insertRuleTuple(board._id, {
    title: normalizedRuleTitle(safe.title), trigger, action,
  });
}

export async function renameAccessibleRule(userId, input = {}) {
  const rule = await editableRule(userId, input.ruleId, input.boardId);
  const title = normalizedRuleTitle(input.title);
  await Rules.updateAsync(rule._id, { $set: { title } });
  return { _id: rule._id, title };
}

export async function removeAccessibleRule(userId, input = {}) {
  const rule = await editableRule(userId, input.ruleId, input.boardId);
  await Rules.removeAsync(rule._id);
  if (rule.triggerId) await Triggers.removeAsync(rule.triggerId);
  if (rule.actionId) await Actions.removeAsync(rule.actionId);
  return { _id: rule._id };
}

export async function createAccessibleWorkflowRule(userId, input = {}) {
  const board = await editableBoard(userId, input.boardId);
  const trigger = workflowTrigger(input.triggerIndex);
  const action = workflowAction(input.actionIndex);
  if (!trigger || !action) throw new Meteor.Error('invalid-workflow-entry');
  const title = normalizedRuleTitle(input.title);
  let triggerId;
  let actionId;
  try {
    triggerId = await Triggers.insertAsync({
      ...trigger.doc, boardId: board._id, desc: workflowDescription(trigger),
    });
    actionId = await Actions.insertAsync({
      ...action.doc, boardId: board._id, desc: workflowDescription(action),
    });
    const ruleId = await Rules.insertAsync({
      title, boardId: board._id, triggerId, actionId,
    });
    return { _id: ruleId, triggerId, actionId };
  } catch (error) {
    if (triggerId) await Triggers.removeAsync(triggerId).catch(() => {});
    if (actionId) await Actions.removeAsync(actionId).catch(() => {});
    throw error;
  }
}

export async function replaceAccessibleWorkflowAction(userId, input = {}) {
  const rule = await editableRule(userId, input.ruleId, input.boardId);
  const action = workflowAction(input.actionIndex);
  if (!action) throw new Meteor.Error('invalid-workflow-entry');
  const oldActionId = rule.actionId;
  const actionId = await Actions.insertAsync({
    ...action.doc, boardId: rule.boardId, desc: workflowDescription(action),
  });
  try {
    await Rules.updateAsync(rule._id, { $set: { actionId } });
  } catch (error) {
    await Actions.removeAsync(actionId).catch(() => {});
    throw error;
  }
  if (oldActionId) await Actions.removeAsync(oldActionId);
  return { _id: rule._id, actionId };
}

export async function importAccessibleRules(userId, input = {}) {
  const board = await editableBoard(userId, input.boardId);
  const text = typeof input.text === 'string' ? input.text : '';
  if (!text || Buffer.byteLength(text, 'utf8') > MAX_RULE_IMPORT_BYTES) {
    throw new Meteor.Error('invalid-rule-import', 'Rules import must be 1 MiB or less');
  }
  let parsed;
  let unmapped = [];
  try {
    if (input.format === 'trello') {
      ({ rules: parsed, unmapped } = parseTrelloButler(text));
    } else if (EXTERNAL_RULE_FORMATS.has(input.format)) {
      const workflow = secureTransfer(JSON.parse(text), {
        direction: 'import', source: `rules:${input.format}:workflow`, userId,
        maxDepth: 20, maxNodes: 100000, maxArray: 10000,
        maxString: 256 * 1024,
      });
      ({ rules: parsed, unmapped } = parseWorkflowData(workflow, input.format));
    } else {
      parsed = parseRuleTransferText(text, input.format);
    }
  } catch (error) {
    throw new Meteor.Error('invalid-rule-import', error.message);
  }
  const safe = secureTransfer(parsed, {
    direction: 'import', source: `rules:${input.format}`, userId,
    maxDepth: 20, maxNodes: 100000, maxArray: MAX_RULE_IMPORT_COUNT,
    maxString: 256 * 1024,
  });
  if (!Array.isArray(safe) || safe.length > MAX_RULE_IMPORT_COUNT) {
    throw new Meteor.Error('invalid-rule-import', 'Too many rules');
  }
  // Validate and normalize the WHOLE batch before the first insert.
  const entries = safe.map(importedRuleEntry);
  const inserted = [];
  for (const entry of entries) inserted.push(await insertRuleTuple(board._id, entry));
  return {
    count: inserted.length,
    unmappedCount: unmapped.length,
    ruleIds: inserted.map(result => result._id),
  };
}

export {
  MAX_RULE_IMPORT_BYTES,
  MAX_RULE_IMPORT_COUNT,
  MAX_RULE_TITLE_LENGTH,
  normalizedRuleTitle,
};
