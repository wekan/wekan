// Durable list Sync: the write phase of manual and scheduled Sync through the
// write-ahead journal (server/lib/syncOperationJournal.js), with every card's
// History, activities, rules, notifications and webhooks applied from a saved
// plan and replayed after a restart. When it applies is decided by
// server/lib/listSyncSteps.js; otherwise server/listSync.js writes directly,
// as it always has.
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import Cards from '/models/cards';
import Activities from '/models/activities';
import ChangeHistory from '/models/changeHistory';
import Swimlanes from '/models/swimlanes';
import Boards from '/models/boards';
import Rules from '/models/rules';
import Actions from '/models/actions';
import Triggers from '/models/triggers';
import { getFeatureFlags } from '/models/lib/featureFlags';
import { runStoredSyncActivityDelivery } from '/server/notifications/storedActivityDelivery';
import { withListSyncLease } from '/server/lib/listSyncLease';
import { runStoredListSyncOperation, readPendingListSyncOperation, discardPreparingListSyncOperation,
  listPendingListSyncOperations } from '/server/lib/listSyncOperations';
const { randomUUID } = require('node:crypto');
const { memberCan } = require('/models/lib/boardRoleCapabilities');
const { ruleActionIds } = require('/models/lib/ruleParts');
const { isAssignedOnlyMember } = require('/models/lib/boardCardScope');
const { durableSyncEligibility, durableRuleActionTypes, followableActionIds, buildListSyncSteps } = require('/server/lib/listSyncSteps');
const { createSyncEffectPlanner, validateSyncEffects, applySyncEffectsStep } = require('/server/lib/syncEffects');
const { syncOperationEffectId } = require('/server/lib/syncOperationApply');
const { createSyncHookedCards } = require('/server/lib/syncHookedCards');
const { createSyncHookedActivities } = require('/server/lib/syncHookedActivities');
const { syncEffectPolicy } = require('/server/lib/syncEffectPolicy');
const { syncSourceKey } = require('/models/lib/listSyncSourceIdentity');
const { durableRuleActionType } = require('/server/lib/syncRuleMoveCommand');

const withActor = (userId, work) => DDP._CurrentMethodInvocation.withValue({ userId, isSimulation: false }, work);
const readPolicy = async () => syncEffectPolicy(getFeatureFlags());

export function currentSyncActor() {
  return DDP._CurrentMethodInvocation.get()?.userId || null;
}

export async function durableSyncDecision({ list, board, trigger, actorId }) {
  // Every action of every rule on the board, extra actions included (#4294).
  // A rule whose action is gone cannot be proven durable either.
  const readActions = async boardId => {
    const rules = await Rules.find({ boardId }, { fields: { actionId: 1, extraActionIds: 1, triggerId: 1 } }).fetchAsync();
    const actionIds = [...new Set(rules.flatMap(rule => ruleActionIds(rule)).filter(Boolean))];
    const actions = actionIds.length
      ? await Actions.find({ _id: { $in: actionIds } },
        { fields: { actionType: 1, listName: 1, swimlaneName: 1, boardId: 1 } }).fetchAsync() : [];
    if (actions.length !== actionIds.length) return null;
    // A move to another board must end every plan it is in (listSyncSteps.js).
    const triggerIds = rules.map(rule => rule.triggerId).filter(Boolean);
    const triggers = triggerIds.length
      ? await Triggers.find({ _id: { $in: triggerIds } }, { fields: { activityType: 1 } }).fetchAsync() : [];
    const typeOf = new Map(triggers.map(trigger => [trigger._id, trigger.activityType]));
    const types = new Map(actions.map(action => [action._id, action.actionType]));
    const movable = followableActionIds(rules.map(rule => ({ actionIds: ruleActionIds(rule).filter(Boolean),
      activityType: typeOf.get(rule.triggerId) ?? null })), id => types.get(id));
    return actions.map(action => ({ ...action, crossBoardMovable: movable.has(action._id) }));
  };
  // A destination board counts only when the actor may write there, as the
  // stored stages of its rules require.
  const readBoard = async boardId => {
    const destination = typeof boardId === 'string' && boardId ? await Boards.findOneAsync(boardId) : null;
    return destination && memberCan(destination.members, actorId, 'write') &&
      !isAssignedOnlyMember(destination, actorId) ? destination : null;
  };
  // Every board a durable cross-board rule action reaches must have opted in
  // and have only durable rule actions itself (listSyncSteps.js).
  const ruleActionTypes = await durableRuleActionTypes({ boardId: list.boardId, readActions, readBoard,
    typeOf: durableRuleActionType });
  return durableSyncEligibility({ list, board, trigger, flags: getFeatureFlags(), ruleActionTypes, actorId });
}

// Only a full-list writer runs Sync; checked again on every guard.
async function assertListWriter({ board, userId }) {
  const user = await Meteor.users.findOneAsync(userId, { fields: { loginDisabled: 1 } });
  return !!user && !user.loginDisabled && !!board && memberCan(board.members, userId, 'write') &&
    !isAssignedOnlyMember(board, userId);
}

function scopeOf(list) {
  return { listId: list._id, boardId: list.boardId, incarnation: list.syncCredentialIncarnation,
    revision: list.syncRevision, sourceKey: syncSourceKey(list.syncSource) };
}

// Everything a saved step needs to be applied - its own actor and trigger,
// never the current request's.
function applier({ actorId, trigger }) {
  return (step, context) => {
    const effectId = syncOperationEffectId(context.operationId, context.index);
    return applySyncEffectsStep({ step, effects: context.effects, operationId: context.operationId,
      index: context.index, userId: actorId, assertCurrent: context.assertCurrent, readPolicy,
      cards: createSyncHookedCards({ cards: Cards, step, userId: actorId, withActor }),
      history: ChangeHistory,
      activities: context.effects.activities
        ? createSyncHookedActivities({ activities: Activities, plan: context.effects, step, effectId, userId: actorId, withActor })
        : Activities,
      completeDelivery: delivery => runStoredSyncActivityDelivery({ ...delivery, trigger }) });
  };
}
const validateEffects = (effects, step, context) =>
  validateSyncEffects(effects, step, syncOperationEffectId(context.operationId, context.index));

// Finish the list's unfinished operation first: a new run cannot start while
// one is pending, and it must not be left behind.
async function resumePending({ listId, lease }) {
  const pending = await readPendingListSyncOperation(listId);
  if (!pending) return null;
  if (pending.state === 'preparing') {
    await discardPreparingListSyncOperation({ listId, operationId: pending.operationId, assertCurrent: lease.assertCurrent });
    return { discarded: pending.operationId };
  }
  if (!pending.trigger) throw Object.assign(new Error('sync-operation-trigger-unknown'), { code: 'sync-operation-trigger-unknown' });
  return runStoredListSyncOperation({ scope: pending.scope, actorId: pending.actorId, trigger: pending.trigger,
    intentId: pending.intentId, lease,
    assertAccess: current => assertListWriter(current),
    build: () => { throw new Error('sync-operation-replay-cannot-build'); },
    prepareEffects: () => { throw new Error('sync-operation-replay-cannot-build'); },
    validateEffects, apply: applier({ actorId: pending.actorId, trigger: pending.trigger }) });
}

// The durable write phase of one reconcile. `lease` is the list lease the run
// holds, with its mapping checks folded into assertCurrent.
export async function runDurableListSync({ list, trigger, actorId, lease, plan, creations, fetched,
  estimateMapping, timeMappings, now = new Date() }) {
  await resumePending({ listId: list._id, lease });
  const policy = await readPolicy();
  const scope = scopeOf(list);
  return runStoredListSyncOperation({ scope, actorId, trigger, intentId: randomUUID(), lease,
    assertAccess: current => assertListWriter(current),
    build: async ({ assertCurrent }) => {
      await assertCurrent();
      const ids = [...plan.toUpdate.map(row => row.cardId), ...plan.toArchive];
      const cards = ids.length ? await Cards.find({ _id: { $in: ids }, boardId: list.boardId, listId: list._id },
        { transform: null }).fetchAsync() : [];
      const steps = buildListSyncSteps({ creations, updates: plan.toUpdate, archives: plan.toArchive, fetched,
        current: new Map(cards.map(card => [card._id, card])), estimateMapping, timeMappings, now });
      await assertCurrent();
      return steps;
    },
    prepareEffects: await (async () => {
      const user = await Meteor.users.findOneAsync(actorId, { fields: { username: 1 } });
      const swimlanes = await Swimlanes.find({ boardId: list.boardId }, { fields: { _id: 1, boardId: 1, title: 1 },
        transform: null }).fetchAsync();
      const redoRows = await ChangeHistory.find({ boardId: list.boardId, userId: actorId, undone: true,
        superseded: { $ne: true } }, { transform: null, limit: 10000 }).fetchAsync();
      return createSyncEffectPlanner({ userId: actorId, username: user?.username || '', createdAt: now,
        list: { _id: list._id, boardId: list.boardId, title: list.title || '' },
        swimlanes: swimlanes.map(lane => ({ _id: lane._id, boardId: lane.boardId, title: lane.title || '' })),
        redoRows, policy });
    })(),
    validateEffects, apply: applier({ actorId, trigger }) });
}

// Replay after a restart: every unfinished operation, under its list's lease.
export async function replayStoredListSync() {
  const result = { resumed: 0, discarded: 0, busy: 0, failed: 0 };
  for (const { _id: listId } of await listPendingListSyncOperations()) {
    try {
      const outcome = await withListSyncLease(listId, lease => resumePending({ listId, lease }));
      if (outcome?.discarded) result.discarded++; else if (outcome) result.resumed++;
    } catch (error) {
      if (error?.error === 'sync-busy') result.busy++;
      else {
        result.failed++;
        // Kept for the next pass; say why, or a stuck replay is invisible.
        console.error('List Sync replay failed; it is retried on the next pass:', error?.message || error);
      }
    }
  }
  return result;
}
