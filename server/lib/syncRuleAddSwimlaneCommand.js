'use strict';
// Durable rule addSwimlane (the structural rule actions of TODO Later). The
// ordinary action (server/rulesHelper.js) inserts { title: <swimlaneName with
// rule variables>, boardId, sort: 0 }, and the insert hook
// (server/models/swimlanes.js) writes the createSwimlane activity.
//
// One saved command per rule invocation: the swimlane's id is derived from the
// invocation so a replay inserts it once, and the activity - fully known before
// the insert - has a derived id too, so it is written once, and delivered
// durably: a board-level activity, with no card or list (2026-10-03). Pure: tested by
// tests/syncRuleAddSwimlaneCommand.test.cjs.
const { EJSON } = require('bson');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { validateRulePlan, planId } = require('./syncRulePlan');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const fail = code => { throw new Error(`sync-rule-add-swimlane-${code}`); };

const commandId = invocationId => sha256(canonical(['sync-rule-add-swimlane', invocationId]));
const swimlaneIdFor = id => sha256(canonical([id, 'swimlane'])).slice(0, 24);

function identity({ plan, activity, effectId, index }) {
  validateRulePlan(plan, activity, effectId);
  const invocation = plan.actions[index];
  if (!Number.isSafeInteger(index) || index < 0 || invocation?.action?.actionType !== 'addSwimlane') fail('invalid');
  return { _id: commandId(invocation.id), version: 1, invocationId: invocation.id, planId: planId(effectId, activity._id),
    planHash: sha256(canonical(plan)), actorId: plan.actorId, boardId: plan.boardId, cardId: plan.cardId,
    actionType: 'addSwimlane' };
}

function effects(base, title, createdAt) {
  const swimlane = { _id: swimlaneIdFor(base._id), title, boardId: base.boardId, sort: 0 };
  // The hook's activity, exactly, with a derived id.
  const activity = { _id: `sync-rule-add-swimlane-${sha256(canonical([base._id, 'activity']))}`, userId: base.actorId,
    type: 'swimlane', activityType: 'createSwimlane', boardId: base.boardId, swimlaneId: swimlane._id,
    createdAt: new Date(createdAt), modifiedAt: new Date(createdAt) };
  return { swimlane, activity };
}

function prepareRuleAddSwimlaneCommand({ plan, activity, effectId, index, title, createdAt }) {
  const base = identity({ plan, activity, effectId, index });
  if (typeof title !== 'string' || !(createdAt instanceof Date) || !Number.isFinite(createdAt.getTime())) fail('invalid');
  const command = { ...base, createdAt: new Date(createdAt), ...effects(base, title, createdAt) };
  command.checksum = sha256(canonical(command));
  return validateRuleAddSwimlaneCommand(command, { plan, activity, effectId, index });
}

function validateRuleAddSwimlaneCommand(row, context) {
  const base = identity(context);
  const keys = [...Object.keys(base), 'createdAt', 'swimlane', 'activity', 'checksum'].sort().join(',');
  if (!row || Object.keys(row).sort().join(',') !== keys ||
      Object.entries(base).some(([key, value]) => canonical(row[key]) !== canonical(value)) ||
      !(row.createdAt instanceof Date) || typeof row.swimlane?.title !== 'string') fail('command-invalid');
  const { checksum, ...content } = row;
  if (checksum !== sha256(canonical(content)) ||
      canonical(effects(base, row.swimlane.title, row.createdAt)) !== canonical({ swimlane: row.swimlane, activity: row.activity })) {
    fail('command-invalid');
  }
  return copy(row);
}

module.exports = { commandId, swimlaneIdFor, prepareRuleAddSwimlaneCommand, validateRuleAddSwimlaneCommand };
