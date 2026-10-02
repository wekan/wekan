'use strict';
// Durable rule checklist actions (maintainer decision of 2026-09-30: durable
// adapters for rule actions): checkAll, uncheckAll, checkItem, uncheckItem.
// One saved command per rule invocation, captured with the same lookups the
// ordinary action uses (server/rulesHelper.js performAction), so a replay acts
// on the same items with the same outcome.
//
// The ordinary action writes each item in turn, and the checklist item hooks
// record, for EVERY write, even one that does not change the value:
//   before it   uncompleteChecklist, when the whole checklist was finished
//   after it    checkedItem / uncheckedItem
//               completeChecklist, when the whole checklist is finished
// plus a History row on the item when isFinished really changed. The command
// simulates that sequence on the captured items and saves one unit per item:
// its value before and after, its History plan and its activities, split into
// those written before the item and those after, as the hooks write them.
// Pure: tested by tests/syncRuleChecklistCommand.test.cjs.
const { EJSON } = require('bson');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { validateRulePlan, planId } = require('./syncRulePlan');
const { prepareCardFieldHistory, RULE_CHECKLIST_ITEM_FIELDS } = require('./syncHistoryBatch');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const fail = code => { throw new Error(`sync-rule-checklist-${code}`); };
const text = value => typeof value === 'string' && value.length > 0;

const RULE_CHECKLIST_ACTIONS = { checkAll: true, uncheckAll: false, checkItem: true, uncheckItem: false };
const commandId = invocationId => sha256(canonical(['sync-rule-checklist', invocationId]));

function identity({ plan, activity, effectId, index }) {
  validateRulePlan(plan, activity, effectId);
  const invocation = plan.actions[index];
  const actionType = invocation?.action?.actionType;
  if (!Number.isSafeInteger(index) || index < 0 || !Object.hasOwn(RULE_CHECKLIST_ACTIONS, actionType)) fail('invalid');
  return { _id: commandId(invocation.id), version: 1, invocationId: invocation.id, planId: planId(effectId, activity._id),
    planHash: sha256(canonical(plan)), actorId: plan.actorId, boardId: plan.boardId, cardId: plan.cardId, actionType };
}

function validSnapshot({ checklist, items, targetIds }) {
  if (checklist !== null && (!checklist || Object.keys(checklist).sort().join(',') !== '_id,hideAllChecklistItems,title' ||
      !text(checklist._id) || typeof checklist.title !== 'string' || typeof checklist.hideAllChecklistItems !== 'boolean')) return false;
  if (!Array.isArray(items) || items.length > 1000 || !Array.isArray(targetIds) || targetIds.length > 1000) return false;
  const ids = new Set();
  for (const item of items) {
    if (!item || Object.keys(item).filter(key => key !== 'isFinished').sort().join(',') !== '_id,title' ||
        !text(item._id) || typeof item.title !== 'string' || ids.has(item._id) ||
        (Object.hasOwn(item, 'isFinished') && typeof item.isFinished !== 'boolean')) return false;
    ids.add(item._id);
  }
  return (checklist !== null || (!items.length && !targetIds.length)) && targetIds.every(id => ids.has(id));
}

// The units the ordinary action's writes and hooks produce, in order.
function simulate({ base, checklist, items, targetIds, createdAt, redoRows }) {
  const target = RULE_CHECKLIST_ACTIONS[base.actionType];
  const state = new Map(items.map(item => [item._id, !!item.isFinished]));
  const finished = () => checklist.hideAllChecklistItems || (items.length > 0 && items.every(item => state.get(item._id)));
  // The card's board: the plan's, or one a cross-board move of this plan put
  // it on (2026-10-03), where its hooks record.
  const place = { boardId: base.cardBoardId, listId: base.listId, swimlaneId: base.swimlaneId };
  let redoLeft = redoRows;
  return targetIds.map((itemId, k) => {
    const item = items.find(row => row._id === itemId);
    const unitId = sha256(canonical(['sync-rule-checklist-unit', base._id, k]));
    const activity = (kind, fields) => {
      const receiptId = sha256(canonical([unitId, kind]));
      return { receiptId, activity: { _id: `sync-rule-checklist-${receiptId}`, userId: base.actorId, ...fields,
        cardId: base.cardId, boardId: base.cardBoardId, checklistId: checklist._id, listId: base.listId,
        swimlaneId: base.swimlaneId, createdAt, modifiedAt: createdAt } };
    };
    const beforeActivities = finished()
      ? [activity('uncomplete', { activityType: 'uncompleteChecklist', checklistName: checklist.title })] : [];
    const before = Object.hasOwn(item, 'isFinished') ? { isFinished: item.isFinished } : {};
    state.set(itemId, target);
    const afterActivities = [activity('check', { activityType: target ? 'checkedItem' : 'uncheckedItem',
      checklistItemId: itemId, checklistItemName: item.title })];
    if (finished()) afterActivities.push(activity('complete', { activityType: 'completeChecklist', checklistName: checklist.title }));
    const history = prepareCardFieldHistory({ before: { ...place, ...before }, after: { ...place, isFinished: target },
      effectId: unitId, userId: base.actorId, createdAt, redoRows: redoLeft, fields: RULE_CHECKLIST_ITEM_FIELDS,
      entityId: itemId, cardId: base.cardId });
    if (history.rows.length) redoLeft = [];
    return { itemId, before, after: { isFinished: target }, history, beforeActivities, afterActivities };
  });
}

// `cardBoardId` is the board the card is on: the plan's, unless the runner
// verified a cross-board move of this same plan put it elsewhere.
function prepareRuleChecklistCommand({ plan, activity, effectId, index, card, checklist, items, targetIds, createdAt,
  redoRows = [], cardBoardId = plan?.boardId }) {
  const base = identity({ plan, activity, effectId, index });
  if (!card || card._id !== base.cardId || !text(cardBoardId) || card.boardId !== cardBoardId ||
      !text(card.listId) || !text(card.swimlaneId) ||
      !(createdAt instanceof Date) || !Number.isFinite(createdAt.getTime())) fail('card-invalid');
  const snapshot = copy({ checklist: checklist ? { _id: checklist._id, title: checklist.title,
    hideAllChecklistItems: !!checklist.hideAllChecklistItems } : null,
  items: (items || []).map(item => ({ _id: item._id, title: item.title,
    ...(typeof item.isFinished === 'boolean' ? { isFinished: item.isFinished } : {}) })), targetIds: targetIds || [] });
  if (!validSnapshot(snapshot)) fail('snapshot-invalid');
  const located = { ...base, cardBoardId, listId: card.listId, swimlaneId: card.swimlaneId };
  const command = { ...located, ...snapshot, createdAt: new Date(createdAt),
    units: simulate({ base: located, ...snapshot, createdAt, redoRows }) };
  command.checksum = sha256(canonical(command));
  return validateRuleChecklistCommand(command, { plan, activity, effectId, index });
}

const withoutRedo = units => units.map(unit => ({ ...unit, history: { ...unit.history, redo: [] } }));
function validateRuleChecklistCommand(row, context) {
  const base = identity(context);
  const keys = [...Object.keys(base), 'cardBoardId', 'listId', 'swimlaneId', 'checklist', 'items', 'targetIds', 'createdAt', 'units',
    'checksum'].sort().join(',');
  if (!row || Object.keys(row).sort().join(',') !== keys ||
      Object.entries(base).some(([key, value]) => canonical(row[key]) !== canonical(value)) ||
      !text(row.cardBoardId) || !text(row.listId) || !text(row.swimlaneId) || !(row.createdAt instanceof Date) ||
      !validSnapshot(row) || !Array.isArray(row.units)) fail('command-invalid');
  const { checksum, ...content } = row;
  if (checksum !== sha256(canonical(content))) fail('command-invalid');
  // Everything but the captured redo rows follows from the saved snapshot.
  const expected = simulate({ base: { ...base, cardBoardId: row.cardBoardId, listId: row.listId, swimlaneId: row.swimlaneId },
    checklist: row.checklist,
    items: row.items, targetIds: row.targetIds, createdAt: row.createdAt, redoRows: [] });
  if (canonical(withoutRedo(expected)) !== canonical(withoutRedo(row.units)) ||
      row.units.filter(unit => unit.history.redo.length).length > 1) fail('command-invalid');
  return copy(row);
}

module.exports = { RULE_CHECKLIST_ACTIONS, commandId, prepareRuleChecklistCommand, validateRuleChecklistCommand };
