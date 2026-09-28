'use strict';
const { EJSON } = require('bson');
const { canonical } = require('../../models/lib/changeHistoryIntegrity');
const { exactFieldSelector } = require('../../models/lib/exactFieldSelector');
const { archiveUnits } = require('./syncRuleArchiveApply');
const { withSyncRecordingDeferred } = require('./syncRecordingScope');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const fields = ['_id', 'boardId', 'listId', 'swimlaneId', 'parentId', 'title', 'archived', 'archivedAt'];
const fail = () => { throw new Error('sync-rule-archive-cards-invalid'); };
// Only these validated archive selectors/modifiers can reach the real Cards
// collection. The executor owns lease/access checks and durable effect replay.
function createRuleArchiveCards({ cards, command, plan, activity, effectId, index, withActor }) {
  const units = archiveUnits(command, { plan, activity, effectId, index });
  const actorId = command.actorId;
  if (typeof withActor !== 'function' ||
      !['findOneAsync', 'updateAsync'].every(key => typeof cards?.[key] === 'function')) fail();
  const mutations = units.map(unit => ({
    before: exactFieldSelector(unit.before, fields), after: exactFieldSelector(unit.after, fields),
    modifier: { $set: { archived: unit.after.archived,
      ...(unit.after.archived ? { archivedAt: new Date(unit.after.archivedAt) } : {}) } },
    scope: { cardId: unit.cardId, boardId: unit.after.boardId, listId: unit.after.listId,
      kinds: ['archive', 'history'] },
  }));
  return {
    findOne: async selector => {
      if (!mutations.some(row => [row.before, row.after].some(value => canonical(value) === canonical(selector)))) fail();
      return cards.findOneAsync(copy(selector), { transform: null });
    },
    updateOne: async (selector, modifier) => {
      const mutation = mutations.find(row => canonical(row.before) === canonical(selector) &&
        canonical(row.modifier) === canonical(modifier));
      if (!mutation) fail();
      const matchedCount = await withActor(actorId, () => withSyncRecordingDeferred(mutation.scope,
        () => cards.updateAsync(copy(selector), copy(modifier), { removeEmptyStrings: false, trimStrings: false })));
      return { matchedCount };
    },
  };
}
module.exports = { createRuleArchiveCards };
