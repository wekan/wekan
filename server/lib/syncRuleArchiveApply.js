'use strict';
const { EJSON } = require('bson');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { exactFieldSelector } = require('../../models/lib/exactFieldSelector');
const { validateRuleArchiveCommand } = require('./syncRuleArchiveCommand');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const fields = ['_id', 'boardId', 'listId', 'swimlaneId', 'parentId', 'title', 'archived', 'archivedAt'];
const fail = message => { throw new Error(`sync-rule-archive-${message}`); };
function archiveUnits(command, context) {
  command = validateRuleArchiveCommand(command, context);
  // Ordinary rule execution skips the whole cascade for a satisfied root.
  if (command.cards.at(-1).archived === command.archived) return [];
  return command.cards.map((before, index) => {
    const after = { ...copy(before), archived: command.archived };
    if (command.archived) after.archivedAt = new Date(command.createdAt);
    return { effectId: sha256(canonical(['sync-rule-archive-card', command._id, index])),
      before: copy(before), after, cardId: before._id };
  });
}
// Internal execution under the owner's live lease. cards must preserve schema
// validation and business hooks while deferring the saved effects. The effects
// adapter must validate ALL saved effect plans in preflight, then reconcile
// durable History/activity/delivery evidence before returning each effectId.
// This module never interprets a matching card as evidence of effect delivery.
async function applyRuleArchiveCommand({ command, plan, activity, effectId, index,
  cards, receipts, assertCurrent, assertCard, preflightEffects, completeEffects }) {
  command = validateRuleArchiveCommand(command, { plan, activity, effectId, index });
  const units = archiveUnits(command, { plan, activity, effectId, index });
  if (![assertCurrent, assertCard, preflightEffects, completeEffects].every(fn => typeof fn === 'function') ||
      !['findOne', 'updateOne'].every(key => typeof cards?.[key] === 'function') ||
      !['findOne', 'insertOne'].every(key => typeof receipts?.[key] === 'function')) fail('adapter-invalid');
  const guard = async unit => {
    await assertCurrent();
    await assertCard(copy(unit ? unit.before : command.cards.at(-1)));
    await assertCurrent();
  };
  const expected = units.map(unit => ({ _id: unit.effectId, kind: 'rule-archive-card',
    commandId: command._id, checksum: command.checksum, version: 1 }));
  const final = { _id: command._id, kind: 'rule-archive', commandId: command._id,
    checksum: command.checksum, version: 1 };
  const read = async receipt => {
    await assertCurrent(); const saved = await receipts.findOne({ _id: receipt._id }); await assertCurrent();
    if (saved && canonical(saved) !== canonical(receipt)) fail('receipt-invalid');
    return !!saved;
  };
  const confirm = async receipt => {
    await assertCurrent(); let error;
    try { await receipts.insertOne(copy(receipt)); } catch (caught) { error = caught; }
    if (!await read(receipt)) throw error || new Error('sync-rule-archive-receipt-unconfirmed');
  };
  await guard();
  const completed = [];
  for (let i = 0; i < units.length; i++) {
    await guard(units[i]); completed.push(await read(expected[i]));
  }
  const firstMissing = completed.indexOf(false);
  if (firstMissing !== -1 && completed.slice(firstMissing + 1).some(Boolean)) fail('receipt-incomplete');
  if (await read(final)) {
    if (completed.some(value => !value)) fail('receipt-incomplete');
    return command.invocationId;
  }
  // Refuse a changed later card before touching an earlier one.
  for (let i = 0; i < units.length; i++) {
    if (completed[i]) continue;
    const unit = units[i]; await guard(unit);
    const after = await cards.findOne(exactFieldSelector(unit.after, fields));
    await guard(unit);
    if (!after) {
      const before = await cards.findOne(exactFieldSelector(unit.before, fields));
      await guard(unit); if (!before) fail('card-changed');
    }
  }
  await preflightEffects({ command: copy(command), units: copy(units), completed: [...completed], assertCurrent });
  await guard();
  for (let i = 0; i < units.length; i++) {
    if (completed[i]) continue;
    const unit = units[i], afterSelector = exactFieldSelector(unit.after, fields);
    await guard(unit);
    let matched = await cards.findOne(afterSelector); await guard(unit);
    if (!matched) {
      const $set = { archived: command.archived };
      if (command.archived) $set.archivedAt = new Date(command.createdAt);
      let failure;
      try { await cards.updateOne(exactFieldSelector(unit.before, fields), { $set }); }
      catch (error) { failure = error; }
      await guard(unit); matched = await cards.findOne(afterSelector); await guard(unit);
      if (!matched) throw failure || new Error('sync-rule-archive-write-unconfirmed');
    }
    const result = await completeEffects({ unit: copy(unit), assertCurrent: () => guard(unit) });
    if (result !== unit.effectId) fail('effects-unconfirmed');
    await guard(unit); await confirm(expected[i]);
  }
  await guard(); await confirm(final); await guard();
  return command.invocationId;
}
module.exports = { archiveUnits, applyRuleArchiveCommand };
