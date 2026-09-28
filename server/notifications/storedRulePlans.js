import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import Activities from '/models/activities';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Actions from '/models/actions';
import { RulesHelper } from '/server/rulesHelper';
import { getFeatureFlags } from '/models/lib/featureFlags';
import { ensureIndex } from '/server/lib/mongoStartup';
const { EJSON } = require('bson');
const { canonical } = require('/models/lib/changeHistoryIntegrity');
const { memberCan } = require('/models/lib/boardRoleCapabilities');
const { isAssignedOnlyMember } = require('/models/lib/boardCardScope');
const { validateSyncEffectPolicy, assertSyncEffectPolicy, syncEffectPolicy } = require('/server/lib/syncEffectPolicy');
const { prepareRulePlan, ensureRulePlan } = require('/server/lib/syncRulePlan');

export const SyncRulePlans = new Mongo.Collection('listSyncRulePlans');
SyncRulePlans.deny({ insert: () => true, update: () => true, remove: () => true });
Meteor.startup(async () => {
  await ensureIndex(SyncRulePlans, { 'plan.boardId': 1, 'plan.cardId': 1 });
});

// Internal capture stage, not a rules receipt. The owning journal must supply
// its list-incarnation, source-configuration, lease and actor access guard.
// No action is executed; saved configuration still needs command preparation
// and durable effect application before manual/cron activation is possible.
export async function captureStoredSyncRulePlan({ effectId, activity, policy, assertCurrent }) {
  const saved = EJSON.parse(EJSON.stringify(activity), { relaxed: true });
  policy = validateSyncEffectPolicy(policy);
  if (!policy.activities || typeof assertCurrent !== 'function' || typeof saved?.listId !== 'string' || !saved.listId) {
    throw new Error('sync-rule-stage-invalid');
  }
  const guard = async () => {
    await assertCurrent();
    await assertSyncEffectPolicy(policy, async () => syncEffectPolicy(getFeatureFlags()));
    const [stored, user, board, card, list] = await Promise.all([
      Activities.findOneAsync(saved._id, { transform: null }),
      Meteor.users.findOneAsync(saved.userId), Boards.findOneAsync(saved.boardId),
      Cards.findOneAsync({ _id: saved.cardId, boardId: saved.boardId, listId: saved.listId }),
      Lists.findOneAsync({ _id: saved.listId, boardId: saved.boardId }),
    ]);
    if (!stored || canonical(stored) !== canonical(saved)) throw new Error('sync-rule-activity-changed');
    if (!user || user.loginDisabled || !board || !card || !list || !memberCan(board.members, user._id, 'write') ||
        (isAssignedOnlyMember(board, user._id) && !card.assignees?.includes(user._id))) {
      throw new Error('sync-rule-context-denied');
    }
    await assertCurrent();
  };
  return ensureRulePlan({ plans: SyncRulePlans.rawCollection(), activity: saved, effectId, assertCurrent: guard,
    build: activity => prepareRulePlan({ activity, effectId, assertCurrent: guard,
      selectRules: activity => RulesHelper.findMatchingRules(activity),
      readAction: id => Actions.rawCollection().findOne({ _id: id }) }) });
}
