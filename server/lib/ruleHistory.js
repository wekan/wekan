import { Meteor } from 'meteor/meteor';
const { collectionWriteSucceeded } = require('/server/lib/collectionWriteOutcome');
import { EJSON } from 'meteor/ejson';
import Rules from '/models/rules';
import Triggers from '/models/triggers';
import Actions from '/models/actions';
import Boards from '/models/boards';
import ChangeHistory from '/models/changeHistory';
import { allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';
import { withoutRecording, isRecordingSuppressed } from './historyRecordingScope';
import { ruleTriggerIds, ruleActionIds } from '/models/lib/ruleParts';

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
  const snapshot = { rule: document(rule), trigger: document(trigger), action: document(action) };
  // #4294: a rule's further triggers and actions, in order. Only present when
  // the rule has them, so rows recorded before stay comparable.
  const extraTriggers = ruleTriggerIds(rule).slice(1), extraActions = ruleActionIds(rule).slice(1);
  if (extraTriggers.length) snapshot.extraTriggers = await Promise.all(extraTriggers.map(async id => document(await Triggers.findOneAsync(id))));
  if (extraActions.length) snapshot.extraActions = await Promise.all(extraActions.map(async id => document(await Actions.findOneAsync(id))));
  return snapshot;
}
// A snapshot with one extra trigger/action replaced by an older version.
async function ruleSnapshotWithPart(id, field, previous) {
  const snapshot = await ruleSnapshot(id);
  const key = field === 'trigger' ? 'extraTriggers' : 'extraActions';
  if (previous && Array.isArray(snapshot[key])) {
    snapshot[key] = snapshot[key].map(part => (part && part._id === previous._id ? document(previous) : part));
  }
  return snapshot;
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

export async function removeRuleWithUnusedParts(rule) {
  await Rules.removeAsync(rule._id);
  await removeUnusedRuleParts(rule);
}
// Rules that use this trigger or action, as their own or as an extra one.
const rulesUsing = (field, id) => ({ $or: [{ [`${field}Id`]: id }, { [`extra${field === 'trigger' ? 'Trigger' : 'Action'}Ids`]: id }] });
async function removeUnusedRuleParts(rule) {
  if (!rule) return;
  for (const [collection, field, list] of [[Triggers, 'trigger', ruleTriggerIds(rule)], [Actions, 'action', ruleActionIds(rule)]]) {
    for (const id of list) {
      if (id && !await Rules.findOneAsync(rulesUsing(field, id))) await collection.removeAsync(id);
    }
  }
}

export async function writeRuleComponent(rule, field, fields, { patch = false } = {}) {
  const collection = field === 'trigger' ? Triggers : Actions;
  const id = rule[`${field}Id`];
  const existing = id && await collection.findOneAsync(id);
  const { _id, ...previous } = document(existing) || {};
  const next = patch ? { ...previous, ...fields } : fields;
  if (existing && EJSON.equals(previous, next)) return id;
  const shared = existing && await Rules.findOneAsync({ [`${field}Id`]: id, _id: { $ne: rule._id } });
  if (!existing || shared) return collection.insertAsync(next);
  await collection.updateAsync(id, patch ? { $set: fields } : fields);
  return id;
}

// Compound rule edits are one history entry. These hooks also cover legacy
// collection writers, imports, renames, and individual trigger/action edits.
Meteor.startup(() => {
  Rules.after.insert(async (userId, rule) => {
    if (!isRecordingSuppressed()) await recordRuleChange({ rule: null }, await ruleSnapshot(rule._id), userId);
  });
  Rules.after.update(async function (userId, rule) {
    if (!collectionWriteSucceeded(this)) return;
    if (!isRecordingSuppressed()) await recordRuleChange(await ruleSnapshot(rule._id, { rule: this.previous }), await ruleSnapshot(rule._id), userId);
  });
  Rules.after.remove(async (userId, rule) => {
    if (!isRecordingSuppressed()) await recordRuleChange(await ruleSnapshot(rule._id, { rule }), { rule: null }, userId);
  });
  for (const [collection, field] of [[Triggers, 'trigger'], [Actions, 'action']]) {
    collection.after.update(async function (userId, doc) {
      if (!collectionWriteSucceeded(this)) return;
      if (isRecordingSuppressed()) return;
      const rules = await Rules.find(rulesUsing(field, doc._id)).fetchAsync();
      for (const rule of rules) {
        // The previous version of an extra part is not the rule's own part.
        const before = rule[`${field}Id`] === doc._id
          ? await ruleSnapshot(rule._id, { [field]: this.previous })
          : await ruleSnapshotWithPart(rule._id, field, this.previous);
        await recordRuleChange(before, await ruleSnapshot(rule._id), userId);
      }
    });
    collection.after.remove(async (userId, doc) => {
      if (isRecordingSuppressed()) return;
      const rules = await Rules.find(rulesUsing(field, doc._id)).fetchAsync();
      for (const rule of rules) {
        const before = rule[`${field}Id`] === doc._id
          ? await ruleSnapshot(rule._id, { [field]: doc })
          : await ruleSnapshotWithPart(rule._id, field, doc);
        await recordRuleChange(before, await ruleSnapshot(rule._id), userId);
      }
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
    await removeRuleWithUnusedParts(current.rule);
    return true;
  }
  const { rule, trigger, action } = content;
  const extraTriggers = Array.isArray(content.extraTriggers) ? content.extraTriggers : [];
  const extraActions = Array.isArray(content.extraActions) ? content.extraActions : [];
  // The saved extras must be exactly the rule's extra ids, in order.
  if (JSON.stringify(extraTriggers.map(doc => doc && doc._id)) !== JSON.stringify(ruleTriggerIds(rule).slice(1)) ||
      JSON.stringify(extraActions.map(doc => doc && doc._id)) !== JSON.stringify(ruleActionIds(rule).slice(1)) ||
      extraTriggers.some(doc => doc.boardId !== row.boardId) || extraActions.some(doc => doc.boardId !== row.boardId)) return false;
  if (rule._id !== row.entityId || rule.boardId !== row.boardId || !trigger || !action || trigger._id !== rule.triggerId || action._id !== rule.actionId || trigger.boardId !== row.boardId) return false;
  if (action.boardId !== row.boardId && !allowIsBoardMemberWithWriteAccess(userId, await Boards.findOneAsync(action.boardId))) throw new Meteor.Error('not-authorized', 'Must have write access to the destination board');
  // Validate every target before the first write; imported IDs cannot replace
  // another board's document or another rule's shared trigger/action.
  const shared = new Set();
  const parts = [[Triggers, 'trigger', trigger], [Actions, 'action', action],
    ...extraTriggers.map(doc => [Triggers, 'trigger', doc]), ...extraActions.map(doc => [Actions, 'action', doc])];
  for (const [collection, field, doc] of parts) {
    const existing = await collection.findOneAsync(doc._id);
    if (existing && existing.boardId !== doc.boardId) return false;
    if (await Rules.findOneAsync({ ...rulesUsing(field, doc._id), _id: { $ne: rule._id } })) {
      if (!existing || !EJSON.equals(document(existing), doc)) return false;
      shared.add(doc._id);
    }
  }
  for (const [collection, doc] of [...parts.map(([collection, , doc]) => [collection, doc]), [Rules, rule]]) {
    if (shared.has(doc._id)) continue;
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
  await removeUnusedRuleParts(current.rule);
  return true;
}
