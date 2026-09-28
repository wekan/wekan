'use strict';
const { EJSON } = require('bson');
const { canonical } = require('../../models/lib/changeHistoryIntegrity');
const { validateSyncEffects } = require('./syncEffects');
const { withSyncActivityDeferred } = require('./syncActivityScope');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const fail = () => { throw new Error('sync-hooked-activity-adapter-invalid'); };
// The caller still must acknowledge durable delivery separately. Inserting the
// event only persists its exact saved payload; it does not execute delivery.
function createSyncHookedActivities({ activities, plan, step, effectId, userId, withActor }) {
  validateSyncEffects(plan, step, effectId);
  if (!plan.activities || userId !== plan.history.userId || typeof withActor !== 'function' ||
      !['findOneAsync', 'insertAsync'].every(key => typeof activities?.[key] === 'function')) fail();
  const rows = step.kind === 'create' ? [plan.activities.activity] : plan.activities.rows.map(row => row.activity);
  const expected = new Map(rows.map(row => [row._id, copy(row)]));
  return {
    findOneAsync: async id => {
      if (!expected.has(id)) fail();
      return activities.findOneAsync(id, { transform: null });
    },
    insertAsync: async activity => {
      if (!expected.has(activity?._id) || canonical(activity) !== canonical(expected.get(activity._id))) fail();
      const document = copy(expected.get(activity._id));
      return withActor(userId, () => withSyncActivityDeferred(document,
        () => activities.insertAsync(copy(document))));
    },
  };
}
module.exports = { createSyncHookedActivities };
