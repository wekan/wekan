'use strict';
const { EJSON } = require('bson');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { validateRulePlan, planId } = require('./syncRulePlan');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
// Internal coordinator. Each adapter MUST reconcile its own durable command
// and mutation receipts before returning the invocation ID. A resolved ordinary
// performAction Promise is not a receipt. The owner holds the journal lease and
// supplies its live scope/policy guard. This module never acquires that lease.
async function executeRulePlan({ plan, activity, effectId, receipts, adapters, assertCurrent }) {
  plan = copy(plan); activity = copy(activity);
  validateRulePlan(plan, activity, effectId);
  if (typeof assertCurrent !== 'function' || typeof receipts?.findOne !== 'function' ||
      typeof receipts?.insertOne !== 'function') throw new Error('sync-rule-execution-invalid');
  const checksum = sha256(canonical(plan)), id = planId(effectId, activity._id);
  const completion = { _id: id, version: 1, kind: 'rules', effectId, checksum };
  const invocations = plan.actions.map(row => ({
    _id: row.id, version: 1, kind: row.action === null ? 'missing-action' : 'action',
    effectId, planId: id, checksum,
  }));
  const read = async expected => {
    await assertCurrent();
    const saved = await receipts.findOne({ _id: expected._id });
    await assertCurrent();
    if (saved && canonical(saved) !== canonical(expected)) throw new Error('sync-rule-receipt-invalid');
    return !!saved;
  };
  const confirm = async expected => {
    await assertCurrent();
    let failure;
    try { await receipts.insertOne(copy(expected)); } catch (error) { failure = error; }
    if (!await read(expected)) throw failure || new Error('sync-rule-receipt-unconfirmed');
  };
  // Inspect every saved receipt and resolve every required adapter before the
  // first effect. A malformed later receipt or unsupported action cannot cause
  // a partially dispatched plan merely because it appeared later in the list.
  const completed = [];
  for (const expected of invocations) completed.push(await read(expected));
  // Ordered execution can only leave a completed prefix. A later receipt
  // without its predecessor is damaged evidence, not permission to replay it.
  const firstMissing = completed.indexOf(false);
  if (firstMissing !== -1 && completed.slice(firstMissing + 1).some(Boolean)) {
    throw new Error('sync-rule-receipt-incomplete');
  }
  const done = await read(completion);
  if (done) {
    if (completed.some(value => !value)) throw new Error('sync-rule-receipt-incomplete');
    return effectId;
  }
  const handlers = plan.actions.map((row, index) => {
    if (completed[index] || row.action === null) return null;
    const type = row.action.actionType;
    if (!adapters || !Object.hasOwn(adapters, type) || typeof adapters[type] !== 'function') {
      throw new Error('sync-rule-adapter-required');
    }
    return adapters[type];
  });
  for (let index = 0; index < plan.actions.length; index++) {
    await assertCurrent();
    if (completed[index]) continue;
    const row = plan.actions[index];
    if (row.action !== null) {
      const receipt = await handlers[index]({ invocation: copy(row), activity: copy(activity),
        effectId, planId: id, assertCurrent });
      if (receipt !== row.id) throw new Error('sync-rule-action-unconfirmed');
      await assertCurrent();
    }
    await confirm(invocations[index]);
  }
  await confirm(completion);
  await assertCurrent();
  return effectId;
}
module.exports = { executeRulePlan };
