import { Meteor } from 'meteor/meteor';
import { EJSON } from 'meteor/ejson';
import Rules from '/models/rules';
import Triggers from '/models/triggers';
import Actions from '/models/actions';
import Boards from '/models/boards';
import ChangeHistory from '/models/changeHistory';
import { allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';
import { withoutRecording, isRecordingSuppressed } from './historyRecordingScope';

function document(doc) {
  if (!doc) return null;
  const { createdAt, updatedAt, modifiedAt, ...content } = doc;
  return EJSON.clone(content);
}
export async function ruleSnapshot(id, overrides = {}) {
  const rule = Object.prototype.hasOwnProperty.call(overrides, 'rule') ? overrides.rule : await Rules.findOneAsync(id);
  if (!rule) return { rule: null };
  const trigger = Object.prototype.hasOwnProperty.call(overrides, 'trigger') ? overrides.trigger : await Triggers.findOneAsync(rule.triggerId);
  const action = Object.prototype.hasOwnProperty.call(overrides, 'action') ? overrides.action : await Actions.findOneAsync(rule.actionId);
  return { rule: document(rule), trigger: document(trigger), action: document(action) };
}
export async function recordRuleChange(before, after, userId) {
  if (!userId || isRecordingSuppressed() || EJSON.equals(before, after)) return;
  const rule = after.rule || before.rule;
  if (!rule) return;
  await ChangeHistory.record({
    boardId: rule.boardId, entityType: 'rule', entityId: rule._id, group: 'rules',
    changeType: !before.rule ? 'added' : !after.rule ? 'removed' : 'edited',
    previousContent: before, newContent: after, userId,
  });
}
export async function withRuleHistory(id, userId, write) {
  const before = await ruleSnapshot(id);
  try { return await withoutRecording(write); }
  finally { await recordRuleChange(before, await ruleSnapshot(id), userId); }
}

// Compound rule edits are one history entry. These hooks also cover legacy
// collection writers, imports, renames, and individual trigger/action edits.
Meteor.startup(() => {
  Rules.after.insert(async (userId, rule) => {
    if (!isRecordingSuppressed()) await recordRuleChange({ rule: null }, await ruleSnapshot(rule._id), userId);
  });
  Rules.after.update(async function (userId, rule) {
    if (!isRecordingSuppressed()) await recordRuleChange(await ruleSnapshot(rule._id, { rule: this.previous }), await ruleSnapshot(rule._id), userId);
  });
  Rules.after.remove(async (userId, rule) => {
    if (!isRecordingSuppressed()) await recordRuleChange(await ruleSnapshot(rule._id, { rule }), { rule: null }, userId);
  });
  for (const [collection, field] of [[Triggers, 'trigger'], [Actions, 'action']]) {
    collection.after.update(async function (userId, doc) {
      if (isRecordingSuppressed()) return;
      const rules = await Rules.find({ [`${field}Id`]: doc._id }).fetchAsync();
      for (const rule of rules) await recordRuleChange(await ruleSnapshot(rule._id, { [field]: this.previous }), await ruleSnapshot(rule._id), userId);
    });
    collection.after.remove(async (userId, doc) => {
      if (isRecordingSuppressed()) return;
      const rules = await Rules.find({ [`${field}Id`]: doc._id }).fetchAsync();
      for (const rule of rules) await recordRuleChange(await ruleSnapshot(rule._id, { [field]: doc }), await ruleSnapshot(rule._id), userId);
    });
  }
});

export async function applyRuleHistory(row, content, direction) {
  const userId = Meteor.userId();
  const board = await Boards.findOneAsync(row.boardId);
  if (!userId || !board?.hasAdmin(userId)) throw new Meteor.Error('not-authorized', 'Must be a board admin');
  const current = await ruleSnapshot(row.entityId);
  if (current.rule && current.rule.boardId !== row.boardId) throw new Meteor.Error('not-authorized');
  // Undo/redo must not overwrite a later edit by somebody else. Explicit
  // Restore remains the existing History action for selecting an older value.
  const expected = direction === 'undo' ? row.newContent : row.previousContent;
  if (direction !== 'restore' && !EJSON.equals(current, expected)) throw new Meteor.Error('history-conflict', 'The rule changed after this history entry');
  if (!content || !Object.prototype.hasOwnProperty.call(content, 'rule')) return false;
  if (!content.rule) {
    if (!current.rule) return false;
    await Rules.removeAsync(row.entityId);
    for (const [collection, field] of [[Triggers, 'trigger'], [Actions, 'action']]) {
      const id = current.rule[`${field}Id`];
      if (!await Rules.findOneAsync({ [`${field}Id`]: id })) await collection.removeAsync(id);
    }
    return true;
  }
  const { rule, trigger, action } = content;
  if (rule._id !== row.entityId || rule.boardId !== row.boardId || !trigger || !action || trigger._id !== rule.triggerId || action._id !== rule.actionId || trigger.boardId !== row.boardId) return false;
  if (action.boardId !== row.boardId && !allowIsBoardMemberWithWriteAccess(userId, await Boards.findOneAsync(action.boardId))) throw new Meteor.Error('not-authorized', 'Must have write access to the destination board');
  // Validate every target before the first write; imported IDs cannot replace
  // another board's document or another rule's shared trigger/action.
  for (const [collection, field, doc] of [[Triggers, 'trigger', trigger], [Actions, 'action', action]]) {
    const existing = await collection.findOneAsync(doc._id);
    if (existing && existing.boardId !== doc.boardId) return false;
    if (await Rules.findOneAsync({ [`${field}Id`]: doc._id, _id: { $ne: rule._id } })) return false;
  }
  for (const [collection, doc] of [[Triggers, trigger], [Actions, action], [Rules, rule]]) {
    const { _id, ...fields } = EJSON.clone(doc);
    const existing = await collection.findOneAsync(_id);
    if (existing) {
      const unset = Object.fromEntries(Object.keys(existing)
        .filter(key => !['_id', 'createdAt', 'updatedAt', 'modifiedAt'].includes(key) && !Object.prototype.hasOwnProperty.call(fields, key))
        .map(key => [key, '']));
      const modifier = { $set: fields };
      if (Object.keys(unset).length) modifier.$unset = unset;
      await collection.updateAsync(_id, modifier);
    } else await collection.insertAsync({ _id, ...fields });
  }
  return true;
}
