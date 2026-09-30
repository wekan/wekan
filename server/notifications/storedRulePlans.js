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
import ChecklistItems from '/models/checklistItems';
import { RulesHelper } from '/server/rulesHelper';
import { getFeatureFlags } from '/models/lib/featureFlags';
import { ensureIndex } from '/server/lib/mongoStartup';
const { reuseWithinEvaluation } = require('/server/lib/syncGuardWindow');
const { EJSON } = require('bson');
const { assertRuleEmailSourceBinding } = require('/server/lib/ruleEmailSource');
const { canonical, sha256 } = require('/models/lib/changeHistoryIntegrity');
const { memberCan } = require('/models/lib/boardRoleCapabilities');
const { isAssignedOnlyMember } = require('/models/lib/boardCardScope');
const { validateSyncEffectPolicy, assertSyncEffectPolicy, syncEffectPolicy } = require('/server/lib/syncEffectPolicy');
const { prepareRulePlan, ensureRulePlan } = require('/server/lib/syncRulePlan');
const { dispatchRuleEmail } = require('/server/lib/syncRuleEmailDispatch');
const { syncReceiptPolicy, createSyncRuleEmailRetention } = require('/server/lib/syncRuleEmailRetention');
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
// Plan completion receipts with their time (syncRuleRetention.js); kept for good.
export const SyncRuleCompletions = new Mongo.Collection('listSyncRuleCompletions');
// Archive command completion receipts with their time (syncRuleArchiveRetention.js).
export const SyncRuleArchiveCompletions = new Mongo.Collection('listSyncRuleArchiveCompletions');
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
SyncRuleCompletions.deny({ insert: () => true, update: () => true, remove: () => true });
SyncRuleArchiveCompletions.deny({ insert: () => true, update: () => true, remove: () => true });
Meteor.startup(async () => {
  await ensureIndex(SyncRuleArchiveCommands, { boardId: 1, cardId: 1 });
  await ensureIndex(SyncRuleArchiveEffects, { commandHash: 1 });
  await ensureIndex(SyncRuleArchiveReceipts, { commandId: 1 });
  await ensureIndex(SyncRulePlans, { 'plan.boardId': 1, 'plan.cardId': 1 });
  await ensureIndex(SyncRuleReceipts, { effectId: 1 });
  await ensureIndex(SyncRuleEmailCommands, { boardId: 1, cardId: 1 });
  await ensureIndex(SyncRuleEmailAttempts, { state: 1, startedAt: 1 });
  await ensureIndex(SyncRuleEmailResolutions, { commandId: 1, attemptId: 1, decision: 1 });
  await ensureIndex(SyncRuleEmailAttempts, { finishedAt: 1, _id: 1 });
  // Retention (maintainer decision of 2026-09-30): compact finished rule email
  // commands after SYNC_RECEIPT_METADATA_DAYS (90). A failed pass is retried.
  const { days, intervalMs } = syncReceiptPolicy();
  const retention = createSyncRuleEmailRetention({ attempts: SyncRuleEmailAttempts.rawCollection(),
    commands: SyncRuleEmailCommands.rawCollection(), outcomes: SyncRuleEmailOutcomes.rawCollection(),
    receipts: SyncRuleReceipts.rawCollection(), days });
  Meteor.setInterval(() => {
    retention.sweep().catch(() => console.error('Rule email retention pass failed; it is retried on the next pass'));
  }, intervalMs);
  // ...and completed rule plans, with their rule and action documents.
  await ensureIndex(SyncRuleCompletions, { completedAt: 1, _id: 1 });
  const planRetention = createSyncRuleRetention({ plans: SyncRulePlans.rawCollection(),
    receipts: SyncRuleCompletions.rawCollection(), days });
  Meteor.setInterval(() => {
    planRetention.sweep().catch(() => console.error('Rule plan retention pass failed; it is retried on the next pass'));
  }, intervalMs);
  // ...and finished rule archive commands with their effects.
  await ensureIndex(SyncRuleArchiveCompletions, { completedAt: 1, _id: 1 });
  const archiveRetention = createSyncRuleArchiveRetention({ commands: SyncRuleArchiveCommands.rawCollection(),
    effects: SyncRuleArchiveEffects.rawCollection(), completions: SyncRuleArchiveCompletions.rawCollection(), days });
  Meteor.setInterval(() => {
    archiveRetention.sweep().catch(() => console.error('Rule archive retention pass failed; it is retried on the next pass'));
  }, intervalMs);
});
const { recordArchiveCompletion, readCompactedArchive, createSyncRuleArchiveRetention } = require('/server/lib/syncRuleArchiveRetention');
const { recordRuleCompletion, createSyncRuleRetention } = require('/server/lib/syncRuleRetention');
const { planId: rulePlanId } = require('/server/lib/syncRulePlan');

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
  const guard = reuseWithinEvaluation(async () => {
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
  });
  return { saved, effectId, guard };
}

// Only runStoredSyncRules accepts a compacted plan: it stands for finished
// work. Every other stage needs the whole plan and refuses one.
async function capture({ saved, effectId, guard }, { allowCompacted = false } = {}) {
  const plan = await ensureRulePlan({ plans: SyncRulePlans.rawCollection(), activity: saved, effectId, assertCurrent: guard,
    receipts: SyncRuleCompletions.rawCollection(),
    build: activity => prepareRulePlan({ activity, effectId, assertCurrent: guard,
      selectRules: activity => RulesHelper.findMatchingRules(activity),
      readAction: id => Actions.rawCollection().findOne({ _id: id }) }) });
  if (plan.compacted && !allowCompacted) throw new Error('sync-rule-plan-compacted');
  return plan;
}

// Capturing configuration alone is never a rules-completion receipt.
export async function captureStoredSyncRulePlan(options) {
  return capture(executionContext(options));
}

// Adapters must provide their own durable command/mutation reconciliation.
// In particular ordinary RulesHelper.performAction is not an adapter here.
export async function runStoredSyncRules({ adapters, ...options }) {
  const context = executionContext(options);
  const plan = await capture(context, { allowCompacted: true });
  // Compacted: its actions finished more than the retention period ago.
  if (plan.compacted) { await context.guard(); return context.effectId; }
  const indices = new Map(plan.actions.map((row, index) => [row.id, index]));
  // Durable adapters; server/lib/listSyncSteps.js DURABLE_RULE_ACTIONS lists
  // the same action types, and a board with any other one keeps direct Sync.
  // The archive runner returns the invocation id once its cards, History,
  // activities and their own delivery are confirmed.
  const archive = ({ invocation }) => runStoredSyncRuleArchive({ ...options, index: indices.get(invocation.id) });
  const cardField = ({ invocation }) => runStoredSyncRuleCard({ ...options, index: indices.get(invocation.id) });
  const durableAdapters = {
    sendEmail: ({ invocation }) => runStoredSyncRuleEmail({ ...options, index: indices.get(invocation.id) }),
    archive,
    unarchive: archive,
    ...Object.fromEntries(Object.keys(RULE_CARD_ACTIONS).map(type => [type, cardField])),
    ...Object.fromEntries(Object.keys(RULE_CHECKLIST_ACTIONS).map(type => [type, ({ invocation }) =>
      runStoredSyncRuleChecklist({ ...options, index: indices.get(invocation.id) })])),
    ...adapters,
  };
  const done = await executeRulePlan({ plan, activity: context.saved, effectId: context.effectId,
    receipts: SyncRuleReceipts.rawCollection(), adapters: durableAdapters, assertCurrent: context.guard });
  const id = rulePlanId(context.effectId, context.saved._id);
  const stored = await SyncRulePlans.rawCollection().findOne({ _id: id });
  await recordRuleCompletion({ receipts: SyncRuleCompletions.rawCollection(), id,
    activityHash: plan.activityHash, checksum: stored?.checksum });
  return done;
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
  const guard = reuseWithinEvaluation(async () => {
    await context.guard();
    const [rule, action] = await Promise.all([
      Rules.rawCollection().findOne({ _id: invocation.rule._id }),
      Actions.rawCollection().findOne({ _id: invocation.action._id }),
    ]);
    if (!rule || !action || canonical(rule) !== canonical(invocation.rule) ||
        canonical(action) !== canonical(invocation.action)) throw new Error('sync-rule-archive-configuration-changed');
    await context.guard();
  });
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

// History rows are content, linked to the board's chain when each is appended
// (maintainer decision of 2026-09-30), so this runner needs no History
// reservation between planning and writing. The redo candidates - the rows an
// ordinary edit by the same user would supersede - are captured once, when the
// effects are planned; a replay reuses the saved plan and never re-reads them.
export async function runStoredSyncRuleArchive({ completeDelivery = runStoredSyncActivityDelivery, ...options }) {
  if (typeof completeDelivery !== 'function') throw new Error('sync-rule-archive-delivery-required');
  const captured = await archiveContext(options);
  // Compacted (syncRuleArchiveRetention.js): finished more than the retention
  // period ago; the invocation is done and nothing is rebuilt.
  const commandId = sha256(canonical(['sync-rule-archive', captured.plan.actions[captured.index].id]));
  const existing = await SyncRuleArchiveCommands.rawCollection().findOne({ _id: commandId });
  if (existing?.compactReceiptVersion !== undefined) {
    const done = await readCompactedArchive({ row: existing, completions: SyncRuleArchiveCompletions.rawCollection(),
      receipts: SyncRuleArchiveReceipts.rawCollection() });
    await captured.guard();
    return done;
  }
  const command = await captureArchive(captured);
  const guard = async () => { await captured.guard(); };
  await guard();
  const input = { command, plan: captured.plan, activity: captured.context.saved,
    effectId: captured.context.effectId, index: captured.index, assertCurrent: guard };
  const effects = await ensureRuleArchiveEffects({ ...input, effects: SyncRuleArchiveEffects.rawCollection(),
    build: async () => {
      await guard();
      const user = await Meteor.users.findOneAsync(command.actorId);
      const ids = [...new Set(command.cards.map(card => card.listId))];
      const lists = await Lists.find({ _id: { $in: ids }, boardId: command.boardId }, { transform: null }).fetchAsync();
      const redoRows = await ChangeHistory.find({ boardId: command.boardId, userId: command.actorId, undone: true,
        superseded: { $ne: true } }, { transform: null, limit: 10000 }).fetchAsync();
      await guard();
      return prepareRuleArchiveEffects({ ...input, username: user?.username || '', lists,
        policy: options.policy, redoRows });
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
  await guard();
  await recordArchiveCompletion({ completions: SyncRuleArchiveCompletions.rawCollection(), command });
  return result;
}

// Durable rule card-field actions (server/lib/syncRuleCardCommand.js): one
// saved command per invocation, applied conditionally to its one field with
// ordinary History deferred, then its planned History rows and activities -
// each activity delivered durably, rules included. Returns the invocation id
// only when all of it is confirmed; every step is idempotent on replay.
export const SyncRuleCardCommands = new Mongo.Collection('listSyncRuleCardCommands');
SyncRuleCardCommands.deny({ insert: () => true, update: () => true, remove: () => true });

export async function runStoredSyncRuleCard({ index, completeDelivery = runStoredSyncActivityDelivery, ...options }) {
  const context = executionContext(options), plan = await capture(context);
  const invocation = plan.actions[index];
  if (!Object.hasOwn(RULE_CARD_ACTIONS, invocation?.action?.actionType)) throw new Error('sync-rule-card-invalid');
  const commandContext = { plan, activity: context.saved, effectId: context.effectId, index };
  const guard = reuseWithinEvaluation(async () => {
    await context.guard();
    const [rule, action] = await Promise.all([
      Rules.rawCollection().findOne({ _id: invocation.rule._id }),
      Actions.rawCollection().findOne({ _id: invocation.action._id }),
    ]);
    if (!rule || !action || canonical(rule) !== canonical(invocation.rule) ||
        canonical(action) !== canonical(invocation.action)) throw new Error('sync-rule-card-configuration-changed');
    await context.guard();
  });
  const commands = SyncRuleCardCommands.rawCollection(), id = ruleCardCommandId(invocation.id);
  await guard();
  let row = await commands.findOne({ _id: id });
  if (!row) {
    const card = await Cards.findOneAsync({ _id: plan.cardId, boardId: plan.boardId }, { transform: null });
    const redoRows = await ChangeHistory.find({ boardId: plan.boardId, userId: plan.actorId, undone: true,
      superseded: { $ne: true } }, { transform: null, limit: 10000 }).fetchAsync();
    const actor = await Meteor.users.findOneAsync(plan.actorId, { fields: { username: 1 } });
    const targets = MEMBER_ACTIONS.includes(invocation.action.actionType)
      ? await RulesHelper.resolveMemberTargets(context.saved, await Cards.findOneAsync(plan.cardId), invocation.action) : [];
    const candidate = prepareRuleCardCommand({ ...commandContext, card, createdAt: new Date(), redoRows,
      username: actor?.username || '', targets });
    await guard();
    let failure;
    try { await commands.insertOne(candidate); } catch (error) { failure = error; }
    row = await commands.findOne({ _id: id });
    if (!row) throw failure || new Error('sync-rule-card-command-unconfirmed');
  }
  const command = validateRuleCardCommand(row, commandContext);
  // The card: already at the saved after-value, or still at the before-value.
  const matches = fields => Cards.findOneAsync(ruleCardFieldSelector(command, fields), { transform: null });
  await guard();
  if (!await matches(command.after)) {
    if (!await matches(command.before)) throw new Error('sync-rule-card-changed');
    const modifier = Object.hasOwn(command.after, command.field) ? { $set: { [command.field]: command.after[command.field] } }
      : Object.hasOwn(command.before, command.field) ? { $unset: { [command.field]: '' } } : null;
    if (modifier) {
      await guard();
      // The card may have moved since capture; the deferral is for this write.
      const { listId } = await Cards.findOneAsync({ _id: command.cardId }, { fields: { listId: 1 }, transform: null });
      await DDP._CurrentMethodInvocation.withValue({ userId: command.actorId, isSimulation: false }, () =>
        withSyncRecordingDeferred({ cardId: command.cardId, boardId: command.boardId, listId,
          kinds: DATE_FIELDS.includes(command.field) ? ['history', 'timing'] : ['history'] },
          () => Cards.updateAsync(ruleCardFieldSelector(command, command.before), modifier, { removeEmptyStrings: false, trimStrings: false })));
    }
    if (!await matches(command.after)) throw new Error('sync-rule-card-unconfirmed');
  }
  if (command.effects.history.rows.length) {
    await persistSyncFieldHistory({ history: ChangeHistory, plan: command.effects.history, assertCurrent: guard,
      fields: RULE_CARD_FIELDS });
  }
  const activities = {
    findOneAsync: activityId => Activities.findOneAsync(activityId, { transform: null }),
    insertAsync: document => DDP._CurrentMethodInvocation.withValue({ userId: command.actorId, isSimulation: false },
      () => withSyncActivityDeferred(document, () => Activities.insertAsync(document))),
  };
  for (const { receiptId, activity } of command.effects.activities) {
    await persistSyncActivity({ activities, activity, effectId: receiptId, assertCurrent: guard,
      completeDelivery: delivery => completeDelivery({ ...delivery, policy: options.policy, trigger: options.trigger }) });
  }
  await guard();
  return invocation.id;
}
const { RULE_CARD_ACTIONS, DATE_FIELDS, MEMBER_ACTIONS, commandId: ruleCardCommandId, prepareRuleCardCommand, validateRuleCardCommand,
  fieldSelector: ruleCardFieldSelector } = require('/server/lib/syncRuleCardCommand');
const { persistSyncFieldHistory, RULE_CARD_FIELDS } = require('/server/lib/syncHistoryBatch');
const { persistSyncActivity } = require('/server/lib/syncActivityPersistence');
const { withSyncRecordingDeferred } = require('/server/lib/syncRecordingScope');
const { withSyncActivityDeferred } = require('/server/lib/syncActivityScope');

// Durable rule checklist actions (server/lib/syncRuleChecklistCommand.js):
// captured with performAction's own lookups, then item by item - the
// before-write activity, the conditional write with the item's hooks
// deferred, its History and its after-write activities, each delivered
// durably - so a rule triggered by one item runs before the next, as it does
// ordinarily. Every step is idempotent on replay.
export const SyncRuleChecklistCommands = new Mongo.Collection('listSyncRuleChecklistCommands');
SyncRuleChecklistCommands.deny({ insert: () => true, update: () => true, remove: () => true });

export async function runStoredSyncRuleChecklist({ index, completeDelivery = runStoredSyncActivityDelivery, ...options }) {
  const context = executionContext(options), plan = await capture(context);
  const invocation = plan.actions[index], action = invocation?.action;
  if (!Object.hasOwn(RULE_CHECKLIST_ACTIONS, action?.actionType)) throw new Error('sync-rule-checklist-invalid');
  const commandContext = { plan, activity: context.saved, effectId: context.effectId, index };
  const guard = reuseWithinEvaluation(async () => {
    await context.guard();
    const [rule, current] = await Promise.all([
      Rules.rawCollection().findOne({ _id: invocation.rule._id }),
      Actions.rawCollection().findOne({ _id: action._id }),
    ]);
    if (!rule || !current || canonical(rule) !== canonical(invocation.rule) ||
        canonical(current) !== canonical(action)) throw new Error('sync-rule-checklist-configuration-changed');
    await context.guard();
  });
  const commands = SyncRuleChecklistCommands.rawCollection(), id = ruleChecklistCommandId(invocation.id);
  await guard();
  let row = await commands.findOne({ _id: id });
  if (!row) {
    const card = await Cards.findOneAsync({ _id: plan.cardId, boardId: plan.boardId }, { transform: null });
    // The ordinary action's own lookups (server/rulesHelper.js performAction).
    const checklist = card ? await ReactiveCache.getChecklist({ title: action.checklistName, cardId: card._id }) : null;
    const items = checklist ? await ReactiveCache.getChecklistItems({ checklistId: checklist._id }) : [];
    let targetIds = [];
    if (checklist && ['checkAll', 'uncheckAll'].includes(action.actionType)) {
      const ids = selectBulkCheckItemIds(items, checklist._id);
      targetIds = items.filter(item => ids.includes(item._id)).map(item => item._id);
    } else if (checklist) {
      const item = await ReactiveCache.getChecklistItem({ title: action.checkItemName, checkListId: checklist._id });
      if (item) targetIds = [item._id];
    }
    const redoRows = await ChangeHistory.find({ boardId: plan.boardId, userId: plan.actorId, undone: true,
      superseded: { $ne: true } }, { transform: null, limit: 10000 }).fetchAsync();
    const candidate = prepareRuleChecklistCommand({ ...commandContext, card, checklist, items, targetIds,
      createdAt: new Date(), redoRows });
    await guard();
    let failure;
    try { await commands.insertOne(candidate); } catch (error) { failure = error; }
    row = await commands.findOne({ _id: id });
    if (!row) throw failure || new Error('sync-rule-checklist-command-unconfirmed');
  }
  const command = validateRuleChecklistCommand(row, commandContext);
  const activities = {
    findOneAsync: activityId => Activities.findOneAsync(activityId, { transform: null }),
    insertAsync: document => DDP._CurrentMethodInvocation.withValue({ userId: command.actorId, isSimulation: false },
      () => withSyncActivityDeferred(document, () => Activities.insertAsync(document))),
  };
  const deliver = async rows => {
    for (const { receiptId, activity } of rows) {
      await persistSyncActivity({ activities, activity, effectId: receiptId, assertCurrent: guard,
        completeDelivery: delivery => completeDelivery({ ...delivery, policy: options.policy, trigger: options.trigger }) });
    }
  };
  const items = ChecklistItems.rawCollection();
  const selector = (unit, fields) => ({ _id: unit.itemId, cardId: command.cardId, checklistId: command.checklist._id,
    ...(Object.hasOwn(fields, 'isFinished') ? { isFinished: { $eq: fields.isFinished } } : { isFinished: { $exists: false } }) });
  for (const unit of command.units) {
    await deliver(unit.beforeActivities);
    await guard();
    if (!await items.findOne(selector(unit, unit.after))) {
      if (!await items.findOne(selector(unit, unit.before))) throw new Error('sync-rule-checklist-changed');
      const { listId } = await Cards.findOneAsync({ _id: command.cardId }, { fields: { listId: 1 }, transform: null });
      await DDP._CurrentMethodInvocation.withValue({ userId: command.actorId, isSimulation: false }, () =>
        withSyncRecordingDeferred({ cardId: command.cardId, boardId: command.boardId, listId, itemId: unit.itemId,
          kinds: ['itemUncomplete', 'itemCheck', 'itemHistory'] },
        () => ChecklistItems.updateAsync(selector(unit, unit.before), { $set: { isFinished: unit.after.isFinished } })));
      if (!await items.findOne(selector(unit, unit.after))) throw new Error('sync-rule-checklist-unconfirmed');
    }
    if (unit.history.rows.length) {
      await persistSyncFieldHistory({ history: ChangeHistory, plan: unit.history, assertCurrent: guard,
        fields: RULE_CHECKLIST_ITEM_FIELDS });
    }
    await deliver(unit.afterActivities);
  }
  await guard();
  return invocation.id;
}
const { RULE_CHECKLIST_ACTIONS, commandId: ruleChecklistCommandId, prepareRuleChecklistCommand,
  validateRuleChecklistCommand } = require('/server/lib/syncRuleChecklistCommand');
const { RULE_CHECKLIST_ITEM_FIELDS } = require('/server/lib/syncHistoryBatch');
const { selectBulkCheckItemIds } = require('/models/lib/checklistBulkCheck');
