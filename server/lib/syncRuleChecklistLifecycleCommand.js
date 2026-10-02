'use strict';
// Durable rule checklist creation and removal (the structural rule actions of
// TODO Later, "Remaining, and why"). Ordinarily (server/rulesHelper.js):
//
//   addChecklist     inserts { title: <checklistName with rule variables>,
//                    cardId, sort: 0 }; the insert hook writes the
//                    addChecklist activity (server/models/checklists.js) and
//                    the History lifecycle row 'added' with the whole stored
//                    document (server/models/changeHistoryHooks.js).
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

const RULE_CHECKLIST_LIFECYCLE_ACTIONS = ['addChecklist', 'removeChecklist'];

const commandId = invocationId => sha256(canonical(['sync-rule-checklist-lifecycle', invocationId]));
// A Meteor-sized id, derived from the command, so a replayed insert is the same checklist.
const checklistIdFor = id => sha256(canonical([id, 'checklist'])).slice(0, 24);
const unitEffectId = (id, checklistId) => sha256(canonical(['sync-rule-checklist-lifecycle-effect', id, checklistId]));

function identity({ plan, activity, effectId, index }) {
  validateRulePlan(plan, activity, effectId);
  const invocation = plan.actions[index];
  const actionType = invocation?.action?.actionType;
  if (!Number.isSafeInteger(index) || index < 0 || !RULE_CHECKLIST_LIFECYCLE_ACTIONS.includes(actionType)) fail('invalid');
  return { _id: commandId(invocation.id), version: 1, invocationId: invocation.id, planId: planId(effectId, activity._id),
    planHash: sha256(canonical(plan)), actorId: plan.actorId, boardId: plan.boardId, cardId: plan.cardId, actionType };
}

// What the hooks write for one checklist: the activity and the History plan.
function unitEffects({ base, where, document, createdAt, redoRows, added }) {
  const effectId = unitEffectId(base._id, document._id);
  const receiptId = sha256(canonical([effectId, 'activity']));
  const activity = { _id: `sync-rule-checklist-lifecycle-${receiptId}`, userId: base.actorId,
    activityType: added ? 'addChecklist' : 'removeChecklist', cardId: base.cardId, boardId: base.boardId,
    checklistId: document._id, checklistName: document.title, listId: where.listId, swimlaneId: where.swimlaneId,
    createdAt: new Date(createdAt), modifiedAt: new Date(createdAt) };
  const history = prepareChecklistLifecycleHistory({ documents: [document], changeType: added ? 'added' : 'removed',
    where: { ...where, cardId: base.cardId, boardId: base.boardId }, effectId, userId: base.actorId, createdAt, redoRows });
  return { receiptId, activity, history };
}

// Capture. For addChecklist, `title` is the action's checklistName with the
// rule variables substituted (RulesHelper.ruleChecklistTitle); for
// removeChecklist, `checklists` are the stored checklists the ordinary
// selector matches.
function prepareRuleChecklistLifecycleCommand({ plan, activity, effectId, index, card, title, checklists = [],
  createdAt, redoRows = [] }) {
  const base = identity({ plan, activity, effectId, index });
  if (!card || card._id !== base.cardId || card.boardId !== base.boardId || !text(card.listId) || !text(card.swimlaneId) ||
      !(createdAt instanceof Date) || !Number.isFinite(createdAt.getTime())) fail('card-invalid');
  const where = { listId: card.listId, swimlaneId: card.swimlaneId };
  const command = { ...base, ...where, createdAt: new Date(createdAt), redo: copy(redoRows) };
  if (base.actionType === 'addChecklist') {
    if (typeof title !== 'string') fail('invalid');
    Object.assign(command, { checklistId: checklistIdFor(base._id), title, recorded: null });
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

// addChecklist's second phase: the activity and History of the checklist as
// it was stored. Saved once on the command; a replay reuses what was saved.
function recordAddedChecklist(command, stored) {
  if (command.actionType !== 'addChecklist' || !stored || stored._id !== command.checklistId ||
      stored.cardId !== command.cardId) fail('invalid');
  const { receiptId, activity, history } = unitEffects({ base: command,
    where: { listId: command.listId, swimlaneId: command.swimlaneId }, document: stored,
    createdAt: command.createdAt, redoRows: command.redo, added: true });
  return { receiptId, activity, history };
}

function validRecorded(command, recorded) {
  if (recorded === null) return true;
  if (!recorded || Object.keys(recorded).sort().join(',') !== 'activity,history,receiptId') return false;
  const document = recorded.history?.rows?.[0]?.newContent?.document;
  if (!document || document._id !== command.checklistId) return false;
  // What the hooks would write for that stored document, exactly.
  const expected = recordAddedChecklist(command, document);
  return canonical(expected) === canonical(copy(recorded));
}

function validateRuleChecklistLifecycleCommand(row, context) {
  const base = identity(context);
  const extra = base.actionType === 'addChecklist' ? ['checklistId', 'title', 'recorded'] : ['units'];
  const keys = [...Object.keys(base), 'listId', 'swimlaneId', 'createdAt', 'redo', ...extra, 'checksum'].sort().join(',');
  if (!row || Object.keys(row).sort().join(',') !== keys ||
      Object.entries(base).some(([key, value]) => canonical(row[key]) !== canonical(value)) ||
      !text(row.listId) || !text(row.swimlaneId) || !(row.createdAt instanceof Date) || !Array.isArray(row.redo)) {
    fail('command-invalid');
  }
  const { checksum, recorded, ...content } = row;
  if (checksum !== sha256(canonical(content))) fail('command-invalid');
  if (base.actionType === 'addChecklist') {
    if (row.checklistId !== checklistIdFor(base._id) || typeof row.title !== 'string' || !validRecorded(row, recorded)) {
      fail('command-invalid');
    }
  } else {
    const where = { listId: row.listId, swimlaneId: row.swimlaneId };
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
