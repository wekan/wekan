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
const { executeRulePlan } = require('/server/lib/syncRuleExecution');

export const SyncRulePlans = new Mongo.Collection('listSyncRulePlans');
export const SyncRuleReceipts = new Mongo.Collection('listSyncRuleReceipts');
SyncRuleReceipts.deny({ insert: () => true, update: () => true, remove: () => true });
SyncRulePlans.deny({ insert: () => true, update: () => true, remove: () => true });
Meteor.startup(async () => {
  await ensureIndex(SyncRulePlans, { 'plan.boardId': 1, 'plan.cardId': 1 });
  await ensureIndex(SyncRuleReceipts, { effectId: 1 });
});

// Both capture and execution require the journal's list-incarnation,
// source-configuration, lease and actor-access guard in addition to these
// checks. This module is internal and does not activate manual/cron Sync.
function executionContext({ effectId, activity, policy, assertCurrent }) {
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
  return { saved, effectId, guard };
}

function capture({ saved, effectId, guard }) {
  return ensureRulePlan({ plans: SyncRulePlans.rawCollection(), activity: saved, effectId, assertCurrent: guard,
    build: activity => prepareRulePlan({ activity, effectId, assertCurrent: guard,
      selectRules: activity => RulesHelper.findMatchingRules(activity),
      readAction: id => Actions.rawCollection().findOne({ _id: id }) }) });
}

// Capturing configuration alone is never a rules-completion receipt.
export async function captureStoredSyncRulePlan(options) {
  return capture(executionContext(options));
}

// Adapters must provide their own durable command/mutation reconciliation.
// In particular ordinary RulesHelper.performAction is not an adapter here.
export async function runStoredSyncRules({ adapters, ...options }) {
  const context = executionContext(options);
  const plan = await capture(context);
  return executeRulePlan({ plan, activity: context.saved, effectId: context.effectId,
    receipts: SyncRuleReceipts.rawCollection(), adapters, assertCurrent: context.guard });
}
