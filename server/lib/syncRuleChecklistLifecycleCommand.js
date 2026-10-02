'use strict';
// Durable rule checklist creation and removal (the structural rule actions of
// TODO Later, "Remaining, and why"). Ordinarily (server/rulesHelper.js):
//
//   addChecklist     inserts { title: <checklistName with rule variables>,
//                    cardId, sort: 0 }; the insert hook writes the
//                    addChecklist activity (server/models/checklists.js) and
//                    the History lifecycle row 'added' with the whole stored
//                    document (server/models/changeHistoryHooks.js).
//   addChecklistWithItems  the same checklist, then one item per
//                    comma-separated title of checklistItems (rule variables
//                    substituted), sort 0, 1, ...; each item's insert hook
//                    writes addChecklistItem and its own 'added' row.
//   removeChecklist  removes every checklist { title: <checklistName as
//                    written>, cardId, sort: 0 }; for each, the remove hooks
//                    write the removeChecklist activity BEFORE the removal and
//                    the lifecycle row 'removed' with the document after it.
//
// One saved command per rule invocation. addChecklist's checklist id is
// derived from the invocation, so the insert happens once; its activity and
// History hold the document AS STORED (schema defaults and timestamps), so
// they are recorded right after the insert, once, and replays reuse them.
// removeChecklist saves every matching checklist at capture, one unit each,
// with its activity and History. Replays apply the saved command, never the
// rule's current configuration. Pure: tested by
// tests/syncRuleChecklistLifecycleCommand.test.cjs.
const { EJSON } = require('bson');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { validateRulePlan, planId } = require('./syncRulePlan');
const { prepareChecklistLifecycleHistory } = require('./syncHistoryBatch');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const fail = code => { throw new Error(`sync-rule-checklist-lifecycle-${code}`); };
const text = value => typeof value === 'string' && value.length > 0;

const RULE_CHECKLIST_LIFECYCLE_ACTIONS = ['addChecklist', 'addChecklistWithItems', 'removeChecklist'];
const ADDS = ['addChecklist', 'addChecklistWithItems'];

const commandId = invocationId => sha256(canonical(['sync-rule-checklist-lifecycle', invocationId]));
// A Meteor-sized id, derived from the command, so a replayed insert is the same checklist.
const checklistIdFor = id => sha256(canonical([id, 'checklist'])).slice(0, 24);
const itemIdFor = (id, index) => sha256(canonical([id, 'checklist-item', index])).slice(0, 24);
const unitEffectId = (id, checklistId) => sha256(canonical(['sync-rule-checklist-lifecycle-effect', id, checklistId]));

function identity({ plan, activity, effectId, index }) {
  validateRulePlan(plan, activity, effectId);
  const invocation = plan.actions[index];
  const actionType = invocation?.action?.actionType;
  if (!Number.isSafeInteger(index) || index < 0 || !RULE_CHECKLIST_LIFECYCLE_ACTIONS.includes(actionType)) fail('invalid');
  return { _id: commandId(invocation.id), version: 1, invocationId: invocation.id, planId: planId(effectId, activity._id),
    planHash: sha256(canonical(plan)), actorId: plan.actorId, boardId: plan.boardId, cardId: plan.cardId, actionType };
}

// What the hooks write for one checklist, or one item: the activity and the
// History plan.
function unitEffects({ base, where, document, createdAt, redoRows, added, item = false }) {
  const effectId = unitEffectId(base._id, document._id);
  const receiptId = sha256(canonical([effectId, 'activity']));
  const activity = item
    ? { _id: `sync-rule-checklist-lifecycle-${receiptId}`, userId: base.actorId, activityType: 'addChecklistItem',
      cardId: base.cardId, boardId: where.boardId, checklistId: document.checklistId, checklistItemId: document._id,
      checklistItemName: document.title, listId: where.listId, swimlaneId: where.swimlaneId,
      createdAt: new Date(createdAt), modifiedAt: new Date(createdAt) }
    : { _id: `sync-rule-checklist-lifecycle-${receiptId}`, userId: base.actorId,
      activityType: added ? 'addChecklist' : 'removeChecklist', cardId: base.cardId, boardId: where.boardId,
      checklistId: document._id, checklistName: document.title, listId: where.listId, swimlaneId: where.swimlaneId,
      createdAt: new Date(createdAt), modifiedAt: new Date(createdAt) };
  const history = prepareChecklistLifecycleHistory({ documents: [document], changeType: added ? 'added' : 'removed',
    where: { ...where, cardId: base.cardId }, effectId, userId: base.actorId, createdAt, redoRows,
    entityType: item ? 'checklistItem' : 'checklist' });
  return { receiptId, activity, history };
}

// Capture. For addChecklist, `title` is the action's checklistName with the
// rule variables substituted (RulesHelper.ruleChecklistTitle); for
// removeChecklist, `checklists` are the stored checklists the ordinary
// selector matches.
// `cardBoardId` is the board the card is on: the plan's, unless the runner
// verified a cross-board move of this same plan put it elsewhere (2026-10-03).
function prepareRuleChecklistLifecycleCommand({ plan, activity, effectId, index, card, title, itemTitles = [],
  checklists = [], createdAt, redoRows = [], cardBoardId = plan?.boardId }) {
  const base = identity({ plan, activity, effectId, index });
  if (!card || card._id !== base.cardId || !text(cardBoardId) || card.boardId !== cardBoardId ||
      !text(card.listId) || !text(card.swimlaneId) ||
      !(createdAt instanceof Date) || !Number.isFinite(createdAt.getTime())) fail('card-invalid');
  const where = { boardId: cardBoardId, listId: card.listId, swimlaneId: card.swimlaneId };
  const command = { ...base, cardBoardId, listId: where.listId, swimlaneId: where.swimlaneId, createdAt: new Date(createdAt),
    redo: copy(redoRows) };
  if (ADDS.includes(base.actionType)) {
    if (typeof title !== 'string') fail('invalid');
    Object.assign(command, { checklistId: checklistIdFor(base._id), title, recorded: null });
    if (base.actionType === 'addChecklistWithItems') {
      if (!Array.isArray(itemTitles) || itemTitles.length > 1000 || itemTitles.some(t => typeof t !== 'string')) fail('invalid');
      command.items = itemTitles.map((itemTitle, i) => ({ itemId: itemIdFor(base._id, i), title: itemTitle, sort: i }));
    }
  } else {
    if (!Array.isArray(checklists) || checklists.length > 1000 ||
        checklists.some(row => !row || !text(row._id) || row.cardId !== base.cardId)) fail('invalid');
    command.units = checklists.map(stored => ({ checklistId: stored._id, stored: copy(stored),
      ...unitEffects({ base, where, document: stored, createdAt, redoRows, added: false }) }));
  }
  const { recorded, ...content } = command;
  command.checksum = sha256(canonical(content));
  return validateRuleChecklistLifecycleCommand(command, { plan, activity, effectId, index });
}

// The adds' second phase: the activities and History of the checklist and its
// items as they were stored, in the order the hooks write them. Saved once on
// the command; a replay reuses what was saved.
function recordAddedChecklist(command, stored, storedItems = []) {
  const expectedItems = command.items || [];
  if (!ADDS.includes(command.actionType) || !stored || stored._id !== command.checklistId ||
      stored.cardId !== command.cardId || !Array.isArray(storedItems) || storedItems.length !== expectedItems.length ||
      storedItems.some((item, i) => !item || item._id !== expectedItems[i].itemId || item.checklistId !== stored._id ||
        item.cardId !== command.cardId)) fail('invalid');
  const where = { boardId: command.cardBoardId, listId: command.listId, swimlaneId: command.swimlaneId };
  const unit = (document, item) => unitEffects({ base: command, where, document, createdAt: command.createdAt,
    redoRows: command.redo, added: true, item });
  return { units: [unit(stored, false), ...storedItems.map(item => unit(item, true))] };
}

function validRecorded(command, recorded) {
  if (recorded === null) return true;
  if (!recorded || Object.keys(recorded).join(',') !== 'units' || !Array.isArray(recorded.units) ||
      !recorded.units.length) return false;
  const documents = recorded.units.map(unit => unit?.history?.rows?.[0]?.newContent?.document);
  if (documents.some(document => !document)) return false;
  // What the hooks would write for those stored documents, exactly.
  try {
    return canonical(recordAddedChecklist(command, documents[0], documents.slice(1))) === canonical(copy(recorded));
  } catch { return false; }
}

function validateRuleChecklistLifecycleCommand(row, context) {
  const base = identity(context);
  const extra = base.actionType === 'addChecklist' ? ['checklistId', 'title', 'recorded']
    : base.actionType === 'addChecklistWithItems' ? ['checklistId', 'title', 'items', 'recorded'] : ['units'];
  const keys = [...Object.keys(base), 'cardBoardId', 'listId', 'swimlaneId', 'createdAt', 'redo', ...extra, 'checksum']
    .sort().join(',');
  if (!row || Object.keys(row).sort().join(',') !== keys ||
      Object.entries(base).some(([key, value]) => canonical(row[key]) !== canonical(value)) ||
      !text(row.cardBoardId) || !text(row.listId) || !text(row.swimlaneId) || !(row.createdAt instanceof Date) || !Array.isArray(row.redo)) {
    fail('command-invalid');
  }
  const { checksum, recorded, ...content } = row;
  if (checksum !== sha256(canonical(content))) fail('command-invalid');
  if (ADDS.includes(base.actionType)) {
    if (row.checklistId !== checklistIdFor(base._id) || typeof row.title !== 'string' || !validRecorded(row, recorded)) {
      fail('command-invalid');
    }
    if (base.actionType === 'addChecklistWithItems' && (!Array.isArray(row.items) || row.items.length > 1000 ||
        row.items.some((item, i) => !item || Object.keys(item).sort().join(',') !== 'itemId,sort,title' ||
          item.itemId !== itemIdFor(base._id, i) || item.sort !== i || typeof item.title !== 'string'))) {
      fail('command-invalid');
    }
  } else {
    const where = { boardId: row.cardBoardId, listId: row.listId, swimlaneId: row.swimlaneId };
    if (!Array.isArray(row.units) || row.units.length > 1000) fail('command-invalid');
    for (const unit of row.units) {
      if (!unit || Object.keys(unit).sort().join(',') !== 'activity,checklistId,history,receiptId,stored' ||
          unit.stored?._id !== unit.checklistId || unit.stored.cardId !== base.cardId) fail('command-invalid');
      const expected = unitEffects({ base, where, document: unit.stored, createdAt: row.createdAt, redoRows: row.redo,
        added: false });
      if (canonical(expected) !== canonical({ receiptId: unit.receiptId, activity: unit.activity, history: unit.history })) {
        fail('command-invalid');
      }
    }
  }
  return copy(row);
}

module.exports = { RULE_CHECKLIST_LIFECYCLE_ACTIONS, commandId, checklistIdFor, prepareRuleChecklistLifecycleCommand,
  recordAddedChecklist, validateRuleChecklistLifecycleCommand };
