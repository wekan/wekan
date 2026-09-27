'use strict';
const { EJSON } = require('bson');
const { validateStep } = require('./syncOperationJournal');
const { exactFieldSelector } = require('../../models/lib/exactFieldSelector');
const encode = value => EJSON.stringify(value, { relaxed: false });
const copy = value => EJSON.parse(encode(value), { relaxed: true });

// Prepare storage predicates and a field-only mutation. This does not apply
// writes, infer durable effect completion or replace the caller's lease guard.
function prepareSyncOperationMutation(input) {
  validateStep(input);
  for (const snapshot of [input.before, input.after]) {
    if (snapshot && Object.values(snapshot).some(value => value === undefined)) {
      throw new Error('sync-operation-undefined-snapshot-value');
    }
  }
  const step = copy(input);
  if (step.before && (step.before.boardId !== step.after.boardId || step.before.listId !== step.after.listId)) {
    throw new Error('sync-operation-card-outside-scope');
  }
  const fields = [...new Set([...Object.keys(step.before || {}), ...Object.keys(step.after)])];
  const afterSelector = copy(exactFieldSelector(step.after, fields));
  if (step.kind === 'create') return { kind: 'create', document: step.after, afterSelector };
  const beforeSelector = copy(exactFieldSelector(step.before, fields));
  const $set = {}, $unset = {};
  for (const field of fields) {
    if (field === '_id') continue;
    if (!Object.hasOwn(step.after, field)) $unset[field] = '';
    else if (!Object.hasOwn(step.before, field) || encode(step.before[field]) !== encode(step.after[field])) {
      $set[field] = step.after[field];
    }
  }
  const modifier = {};
  if (Object.keys($set).length) modifier.$set = $set;
  if (Object.keys($unset).length) modifier.$unset = $unset;
  return { kind: step.kind, beforeSelector, afterSelector, modifier };
}
module.exports = { prepareSyncOperationMutation };
