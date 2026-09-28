'use strict';
const { archiveUnits } = require('./syncRuleArchiveApply');
const { validateRuleArchiveEffects, archiveEffectStep } = require('./syncRuleArchiveEffects');
const { createSyncHookedActivities } = require('./syncHookedActivities');
// Bind the entire validated cascade to ordinary Activities insertion. Each
// event is still restricted to its exact persisted payload; insertion defers
// ordinary rule/notification hooks until the durable delivery stage runs.
function createRuleArchiveActivities({ activities, effects, command, plan, activity, effectId, index, withActor }) {
  const context = { plan, activity, effectId, index };
  const saved = validateRuleArchiveEffects(effects, command, context);
  const units = archiveUnits(command, context), owners = new Map();
  for (let i = 0; i < units.length; i++) {
    const row = saved.rows[i];
    if (!row.activities) continue;
    const adapter = createSyncHookedActivities({ activities, plan: row, step: archiveEffectStep(units[i]),
      effectId: units[i].effectId, userId: command.actorId, withActor });
    for (const { activity: event } of row.activities.rows) {
      if (owners.has(event._id)) throw new Error('sync-rule-archive-activities-invalid');
      owners.set(event._id, adapter);
    }
  }
  const owner = id => {
    const adapter = owners.get(id);
    if (!adapter) throw new Error('sync-rule-archive-activities-invalid');
    return adapter;
  };
  return {
    findOneAsync: id => owner(id).findOneAsync(id),
    insertAsync: event => owner(event?._id).insertAsync(event),
  };
}
module.exports = { createRuleArchiveActivities };
