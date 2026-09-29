import { canReadBoard } from '/models/lib/boardVisibility';
import { ReactiveCache } from '/imports/reactiveCache';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Email, EmailInternals } from 'meteor/email';
import { DDP } from 'meteor/ddp';
import ChangeHistory from '/models/changeHistory';
import { runStoredSyncActivityDelivery } from './storedActivityDelivery';
import Rules from '/models/rules';
import { EmailSendSlots } from '/server/notifications/emailQueue';
import Activities from '/models/activities';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Actions from '/models/actions';
import { RulesHelper } from '/server/rulesHelper';
import { getFeatureFlags } from '/models/lib/featureFlags';
import { ensureIndex } from '/server/lib/mongoStartup';
const { EJSON } = require('bson');
const { assertRuleEmailSourceBinding } = require('/server/lib/ruleEmailSource');
const { canonical } = require('/models/lib/changeHistoryIntegrity');
const { memberCan } = require('/models/lib/boardRoleCapabilities');
const { isAssignedOnlyMember } = require('/models/lib/boardCardScope');
const { validateSyncEffectPolicy, assertSyncEffectPolicy, syncEffectPolicy } = require('/server/lib/syncEffectPolicy');
const { prepareRulePlan, ensureRulePlan } = require('/server/lib/syncRulePlan');
const { dispatchRuleEmail } = require('/server/lib/syncRuleEmailDispatch');
const { ruleEmailRecipients } = require('/server/lib/syncRuleEmailAcceptance');
const { createEmailSendSlots } = require('/server/lib/emailSendSlots');
const withEmailSlot = createEmailSendSlots(EmailSendSlots.rawCollection());
const { executeRulePlan } = require('/server/lib/syncRuleExecution');
const { ensureRuleEmailCommand } = require('/server/lib/syncRuleEmailCommand');
const { ensureRuleArchiveCommand } = require('/server/lib/syncRuleArchiveCommand');
const { ensureRuleArchiveEffects, prepareRuleArchiveEffects, applyRuleArchiveEffects } = require('/server/lib/syncRuleArchiveEffects');
const { createRuleArchiveCards } = require('/server/lib/syncRuleArchiveCards');
const { createRuleArchiveActivities } = require('/server/lib/syncRuleArchiveActivities');
const { exactFieldSelector } = require('/models/lib/exactFieldSelector');
const { validateSyncTrigger, assertSyncActivation } = require('/server/lib/syncActivation');
const { onlyChildrenSelector } = require('/models/lib/cardParents');

export const SyncRuleArchiveCommands = new Mongo.Collection('listSyncRuleArchiveCommands');
export const SyncRuleArchiveEffects = new Mongo.Collection('listSyncRuleArchiveEffects');
export const SyncRuleArchiveReceipts = new Mongo.Collection('listSyncRuleArchiveReceipts');
for (const collection of [SyncRuleArchiveCommands, SyncRuleArchiveEffects, SyncRuleArchiveReceipts]) {
  collection.deny({ insert: () => true, update: () => true, remove: () => true });
}
export const SyncRulePlans = new Mongo.Collection('listSyncRulePlans');
export const SyncRuleEmailAttempts = new Mongo.Collection('listSyncRuleEmailAttempts');
SyncRuleEmailAttempts.deny({ insert: () => true, update: () => true, remove: () => true });
export const SyncRuleEmailResolutions = new Mongo.Collection('listSyncRuleEmailResolutions');
SyncRuleEmailResolutions.deny({ insert: () => true, update: () => true, remove: () => true });
// Who accepted a partially accepted attempt (#2713); addresses only, no SMTP text.
export const SyncRuleEmailOutcomes = new Mongo.Collection('listSyncRuleEmailOutcomes');
SyncRuleEmailOutcomes.deny({ insert: () => true, update: () => true, remove: () => true });
export const SyncRuleEmailCommands = new Mongo.Collection('listSyncRuleEmailCommands');
SyncRuleEmailCommands.deny({ insert: () => true, update: () => true, remove: () => true });
export const SyncRuleReceipts = new Mongo.Collection('listSyncRuleReceipts');
SyncRuleReceipts.deny({ insert: () => true, update: () => true, remove: () => true });
SyncRulePlans.deny({ insert: () => true, update: () => true, remove: () => true });
Meteor.startup(async () => {
  await ensureIndex(SyncRuleArchiveCommands, { boardId: 1, cardId: 1 });
  await ensureIndex(SyncRuleArchiveEffects, { commandHash: 1 });
  await ensureIndex(SyncRuleArchiveReceipts, { commandId: 1 });
  await ensureIndex(SyncRulePlans, { 'plan.boardId': 1, 'plan.cardId': 1 });
  await ensureIndex(SyncRuleReceipts, { effectId: 1 });
  await ensureIndex(SyncRuleEmailCommands, { boardId: 1, cardId: 1 });
  await ensureIndex(SyncRuleEmailAttempts, { state: 1, startedAt: 1 });
  await ensureIndex(SyncRuleEmailResolutions, { commandId: 1, attemptId: 1, decision: 1 });
});

// Both capture and execution require the journal's list-incarnation,
// source-configuration, lease and actor-access guard in addition to these
// checks. This module is internal and does not activate manual/cron Sync.
function executionContext({ effectId, activity, policy, assertCurrent, trigger }) {
  const saved = EJSON.parse(EJSON.stringify(activity), { relaxed: true });
  policy = validateSyncEffectPolicy(policy);
  if (!policy.activities || typeof assertCurrent !== 'function' || typeof saved?.listId !== 'string' || !saved.listId) {
    throw new Error('sync-rule-stage-invalid');
  }
  validateSyncTrigger(trigger);
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
    assertSyncActivation({ board, trigger, flags: getFeatureFlags() });
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
  const indices = new Map(plan.actions.map((row, index) => [row.id, index]));
  const durableAdapters = {
    sendEmail: ({ invocation }) => runStoredSyncRuleEmail({ ...options, index: indices.get(invocation.id) }),
    ...adapters,
  };
  return executeRulePlan({ plan, activity: context.saved, effectId: context.effectId,
    receipts: SyncRuleReceipts.rawCollection(), adapters: durableAdapters, assertCurrent: context.guard });
}

// Capture the ordinary rule's substituted, localized transport fields once.
// A saved command is not a send/enqueue or rules-completion acknowledgement.
export async function captureStoredSyncRuleEmailCommand({ index, ...options }) {
  const context = executionContext(options);
  const plan = await capture(context);
  return ensureRuleEmailCommand({ commands: SyncRuleEmailCommands.rawCollection(), plan,
    activity: context.saved, effectId: context.effectId, index, assertCurrent: context.guard,
    prepare: ({ activity, invocation }) => RulesHelper.prepareEmailCommand(activity, invocation.action) });
}

// Explicit internal send entry point; never called by ordinary/manual/cron
// rules yet. Uncertain attempts require future operator resolution.
export async function runStoredSyncRuleEmail({ index, ...options }) {
  const context = executionContext(options), plan = await capture(context);
  const command = await ensureRuleEmailCommand({ commands: SyncRuleEmailCommands.rawCollection(), plan,
    activity: context.saved, effectId: context.effectId, index, assertCurrent: context.guard,
    prepare: ({ activity, invocation }) => RulesHelper.prepareEmailCommand(activity, invocation.action) });
  // A dropped attempt (an administrator's drop or legacy discard, #2713) sends
  // nothing, so it needs no source access: complete before the binding guard,
  // which refuses the legacy command it was recorded for.
  const dropped = await SyncRuleEmailAttempts.rawCollection().findOne({ _id: command._id });
  if (dropped?.state === 'dropped' && dropped.commandHash === command.checksum &&
      dropped.invocationId === command.invocationId) return command.invocationId;
  const invocation = plan.actions[index], MailComposer = EmailInternals.NpmModules.mailcomposer.module;
  const recipients = ruleEmailRecipients(command.mail, MailComposer);
  const guard = async () => {
    await context.guard();
    await assertRuleEmailSourceBinding({ binding: command.sourceBinding, activity: context.saved, cache: ReactiveCache, canReadBoard, requireRelatedSources: invocation.action.includeCardDetails === true });
    const [rule, action] = await Promise.all([
      Rules.rawCollection().findOne({ _id: invocation.rule._id }),
      Actions.rawCollection().findOne({ _id: invocation.action._id }),
    ]);
    if (!rule || !action || canonical(rule) !== canonical(invocation.rule) ||
        canonical(action) !== canonical(invocation.action)) throw new Error('sync-rule-email-configuration-changed');
    const current = await RulesHelper.prepareEmailAction(context.saved, action);
    if (current.to !== command.mail.to || current.from !== command.mail.from) {
      throw new Error('sync-rule-email-destination-changed');
    }
    const addresses = recipients.map(address => new RegExp(`^${address.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'));
    const users = await Meteor.users.find({ 'emails.address': { $in: addresses } },
      { fields: { loginDisabled: 1 } }).fetchAsync();
    if (users.some(user => user.loginDisabled)) throw new Error('sync-rule-email-recipient-denied');
    await assertRuleEmailSourceBinding({ binding: command.sourceBinding, activity: context.saved, cache: ReactiveCache, canReadBoard, requireRelatedSources: invocation.action.includeCardDetails === true });
    await context.guard();
  };
  return withEmailSlot(({ assertCurrent }) => dispatchRuleEmail({ command, plan,
    activity: context.saved, effectId: context.effectId, index, MailComposer,
    attempts: SyncRuleEmailAttempts.rawCollection(), outcomes: SyncRuleEmailOutcomes.rawCollection(), assertCurrent,
    send: async (mail, { assertCurrent: beforeSend }) => { await beforeSend(); return Email.sendAsync(mail); },
  }), { assertOwner: guard });
}


// Internal capture only. The caller owns the journal lease and scope guard.
// Do not enable mutation execution until History coordination and downstream
// delivery are bound. No browser method, publication or TTL exposes this data.
async function archiveContext({ index, ...options }) {
  const context = executionContext(options), plan = await capture(context);
  const invocation = plan.actions[index];
  if (!Number.isSafeInteger(index) || index < 0 ||
      !['archive', 'unarchive'].includes(invocation?.action?.actionType)) {
    throw new Error('sync-rule-archive-command-invalid');
  }
  const guard = async () => {
    await context.guard();
    const [rule, action] = await Promise.all([
      Rules.rawCollection().findOne({ _id: invocation.rule._id }),
      Actions.rawCollection().findOne({ _id: invocation.action._id }),
    ]);
    if (!rule || !action || canonical(rule) !== canonical(invocation.rule) ||
        canonical(action) !== canonical(invocation.action)) throw new Error('sync-rule-archive-configuration-changed');
    await context.guard();
  };
  const assertCard = async snapshot => {
    await guard();
    const [card, list, user, board] = await Promise.all([
      Cards.findOneAsync(exactFieldSelector(snapshot, ['_id', 'boardId', 'listId', 'parentId'])),
      Lists.findOneAsync({ _id: snapshot.listId, boardId: snapshot.boardId }),
      Meteor.users.findOneAsync(context.saved.userId), Boards.findOneAsync(snapshot.boardId),
    ]);
    if (!card || !list || !user || user.loginDisabled || !board ||
        !memberCan(board.members, user._id, 'write') ||
        (isAssignedOnlyMember(board, user._id) && !card.assignees?.includes(user._id))) {
      throw new Error('sync-rule-archive-card-denied');
    }
    await guard();
  };
  return { context, plan, index, guard, assertCard };
}
async function captureArchive({ context, plan, index, guard, assertCard }) {
  const command = await ensureRuleArchiveCommand({ commands: SyncRuleArchiveCommands.rawCollection(),
    plan, activity: context.saved, effectId: context.effectId, index, assertCurrent: guard, assertCard,
    readCard: id => Cards.findOneAsync(id, { transform: null }),
    // #3626: the children archived WITH a card are the ones it is the one
    // parent of - the same set card.archive() takes (models/lib/cardParents.js).
    readChildren: parentId => Cards.find(onlyChildrenSelector(parentId), { transform: null, limit: 1001 }).fetchAsync() });
  // Existing commands skip discovery, but never skip current descendant access.
  for (const card of command.cards) await assertCard(card);
  await guard();
  return command;
}


export async function captureStoredSyncRuleArchiveCommand(options) {
  return captureArchive(await archiveContext(options));
}

// The owner must reserve the BOARD History chain across this entire callback,
// supplying its captured head/redo rows and a live ownership check. There is
// deliberately no no-op/default reservation: ordinary writers must participate
// before manual/cron integration can enable this entry point.
export async function runStoredSyncRuleArchive({ withHistoryReservation,
  completeDelivery = runStoredSyncActivityDelivery, ...options }) {
  if (typeof withHistoryReservation !== 'function' || typeof completeDelivery !== 'function') {
    throw new Error('sync-rule-archive-history-reservation-required');
  }
  const captured = await archiveContext(options);
  const command = await captureArchive(captured);
  return withHistoryReservation(command.boardId, async reservation => {
    if (!reservation || typeof reservation.assertCurrent !== 'function' ||
        !Object.hasOwn(reservation, 'previousHash') || !Array.isArray(reservation.redoRows)) {
      throw new Error('sync-rule-archive-history-reservation-required');
    }
    const guard = async () => {
      await reservation.assertCurrent(); await captured.guard(); await reservation.assertCurrent();
    };
    await guard();
    const input = { command, plan: captured.plan, activity: captured.context.saved,
      effectId: captured.context.effectId, index: captured.index, assertCurrent: guard };
    const effects = await ensureRuleArchiveEffects({ ...input, effects: SyncRuleArchiveEffects.rawCollection(),
      build: async () => {
        await guard();
        const user = await Meteor.users.findOneAsync(command.actorId);
        const ids = [...new Set(command.cards.map(card => card.listId))];
        const lists = await Lists.find({ _id: { $in: ids }, boardId: command.boardId }, { transform: null }).fetchAsync();
        await guard();
        return prepareRuleArchiveEffects({ ...input, username: user?.username || '', lists,
          policy: options.policy, previousHash: reservation.previousHash, redoRows: reservation.redoRows });
      } });
    const withActor = (userId, work) => DDP._CurrentMethodInvocation.withValue({ userId, isSimulation: false }, work);
    const result = await applyRuleArchiveEffects({ ...input, effects,
      cards: createRuleArchiveCards({ ...input, cards: Cards, withActor }), history: ChangeHistory,
      activities: createRuleArchiveActivities({ ...input, effects, activities: Activities, withActor }),
      receipts: SyncRuleArchiveReceipts.rawCollection(), assertCard: captured.assertCard,
      readPolicy: async () => syncEffectPolicy(getFeatureFlags()),
      completeDelivery: context => completeDelivery({ ...context, trigger: options.trigger, assertCurrent: async () => {
        await guard(); await context.assertCurrent(); await guard();
      } }) });
    await guard(); return result;
  });
}
