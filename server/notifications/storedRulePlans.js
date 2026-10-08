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
import Attachments from '/models/attachments';
import CardComments from '/models/cardComments';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Actions from '/models/actions';
import ChecklistItems from '/models/checklistItems';
import Checklists from '/models/checklists';
import UserPositionHistory from '/models/userPositionHistory';
import { RulesHelper } from '/server/rulesHelper';
import { TriggersDef } from '/server/triggersDef';
import { getFeatureFlags } from '/models/lib/featureFlags';
import { ensureIndex } from '/server/lib/mongoStartup';
const { reuseWithinEvaluation } = require('/server/lib/syncGuardWindow');
const { EJSON } = require('bson');
const { assertRuleEmailSourceBinding } = require('/server/lib/ruleEmailSource');
const { canonical, sha256 } = require('/models/lib/changeHistoryIntegrity');
const { memberCan } = require('/models/lib/boardRoleCapabilities');
const { isAssignedOnlyMember, copyableSubtasks } = require('/models/lib/boardCardScope');
const { validateSyncEffectPolicy, assertSyncEffectPolicy, syncEffectPolicy } = require('/server/lib/syncEffectPolicy');
const { prepareRulePlan, ensureRulePlan } = require('/server/lib/syncRulePlan');
const { dispatchRuleEmail } = require('/server/lib/syncRuleEmailDispatch');
const { syncReceiptPolicy, createSyncRuleEmailRetention } = require('/server/lib/syncRuleEmailRetention');
const { ruleEmailRecipients } = require('/server/lib/syncRuleEmailAcceptance');
const { createEmailSendSlots } = require('/server/lib/emailSendSlots');
const withEmailSlot = createEmailSendSlots(EmailSendSlots.rawCollection());
const { executeRulePlan } = require('/server/lib/syncRuleExecution');
const { ensureRuleEmailCommand } = require('/server/lib/syncRuleEmailCommand');
const { ensureRuleArchiveCommand, boardOf: ruleArchiveBoardOf } = require('/server/lib/syncRuleArchiveCommand');
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
    const [stored, user, board, found, list] = await Promise.all([
      Activities.findOneAsync(saved._id, { transform: null }),
      Meteor.users.findOneAsync(saved.userId), Boards.findOneAsync(saved.boardId),
      Cards.findOneAsync({ _id: saved.cardId }),
      Lists.findOneAsync({ _id: saved.listId, boardId: saved.boardId }),
    ]);
    // The card is where the activity says, or where a move this SAME rule plan
    // saved put it (maintainer decision of 2026-10-02) - nowhere else; on
    // another board only by a saved move there (syncRuleMoveBoardCommand.js).
    const card = found && ((found.boardId === saved.boardId && found.listId === saved.listId) ||
      await movedByThisPlan(rulePlanId(effectId, saved._id), saved.cardId, found)) ? found : null;
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

// A rule effect on ANOTHER board (maintainer decision of 2026-10-02): only
// when that board has opted into Sync effects as well and the actor may write
// there - what eligibility checked (server/lib/listSyncSteps.js), checked
// again before every write, since the card it puts there runs that board's
// rules through the stored stages, whose own guard requires the same.
async function assertDestinationBoard(boardId, plan, trigger) {
  if (boardId === plan.boardId) return;
  const [board, user] = await Promise.all([Boards.findOneAsync(boardId), Meteor.users.findOneAsync(plan.actorId)]);
  if (!board || !user || user.loginDisabled || !memberCan(board.members, user._id, 'write') ||
      isAssignedOnlyMember(board, user._id)) throw new Error('sync-rule-destination-denied');
  assertSyncActivation({ board, trigger, flags: getFeatureFlags() });
}

// Whether a saved move of this rule plan put the card where it is: a single
// move (syncRuleMoveCommand.js) or a unit of a move-all
// (syncRuleMoveAllCommand.js) whose destination is the card's place now.
async function movedByThisPlan(planIdValue, cardId, card) {
  const single = await SyncRuleMoveCommands.rawCollection().findOne({ planId: planIdValue, cardId,
    'after.listId': card.listId, 'after.swimlaneId': card.swimlaneId }, { projection: { _id: 1 } });
  if (single) return true;
  const all = await SyncRuleMoveAllCommands.rawCollection().findOne({ planId: planIdValue,
    units: { $elemMatch: { cardId, 'after.listId': card.listId, 'after.swimlaneId': card.swimlaneId } } },
  { projection: { _id: 1 } });
  if (all) return true;
  const board = await SyncRuleMoveBoardCommands.rawCollection().findOne({ planId: planIdValue, cardId,
    'after.place.boardId': card.boardId, 'after.place.listId': card.listId,
    'after.place.swimlaneId': card.swimlaneId }, { projection: { _id: 1 } });
  if (board) return true;
  const allBoard = await SyncRuleMoveAllBoardCommands.rawCollection().findOne({ planId: planIdValue,
    units: { $elemMatch: { cardId, 'after.place.boardId': card.boardId, 'after.place.listId': card.listId,
      'after.place.swimlaneId': card.swimlaneId } } }, { projection: { _id: 1 } });
  return Boolean(allBoard);
}

// The rule's card where it is now: on the plan's board, or on the board a
// cross-board move of THIS plan put it on (2026-10-03) - executionContext's
// guard accepts the same and nothing else. The plan's later actions act on it
// there, as the ordinary engine's do (it reads the card by id).
async function ruleCardNow(plan, context, { raw = false } = {}) {
  const card = raw ? await Cards.rawCollection().findOne({ _id: plan.cardId })
    : await Cards.findOneAsync({ _id: plan.cardId }, { transform: null });
  if (!card) return null;
  if (card.boardId === plan.boardId) return card;
  return await movedByThisPlan(rulePlanId(context.effectId, context.saved._id), plan.cardId, card) ? card : null;
}

// The activity a stored rule email reads its card through (maintainer
// decision of 2026-10-03): the saved one, or - when a cross-board move of THIS
// plan put the card on another board that opted in (ruleCardNow,
// assertDestinationBoard) - the same activity placed there, with the board it
// left. RulesHelper.emailActivity is the ordinary engine's twin.
async function ruleEmailActivity(plan, context, trigger) {
  const now = await ruleCardNow(plan, context);
  if (!now || now.boardId === plan.boardId) return { activity: context.saved, followedFrom: null };
  await assertDestinationBoard(now.boardId, plan, trigger);
  return { activity: { ...context.saved, boardId: now.boardId }, followedFrom: plan.boardId };
}

// The card an activity names, where it is now: in the activity's list, or
// where a saved move of that activity's OWN rules put it. The notification
// and webhook stages deliver an activity after its rules ran
// (server/lib/syncActivityDelivery.js), so a rule moving the card must not
// make the rest of the activity's delivery refuse it. A moved card is returned
// as placed for the activity - its board and list - so the stages judge who
// may receive it where the activity happened; its people (assignees,
// watchers) are the card's own, as they are now.
export async function activityCardNow(saved) {
  const card = await Cards.findOneAsync({ _id: saved.cardId });
  if (!card) return null;
  // An activity that names no list (moveCardBoard) is about the card on its board.
  if (card.boardId === saved.boardId && (saved.listId === undefined || card.listId === saved.listId)) return card;
  const plans = await SyncRulePlans.rawCollection().find({ 'plan.activityId': saved._id }, { projection: { _id: 1 } })
    .toArray();
  for (const { _id } of plans) {
    if (await movedByThisPlan(_id, saved.cardId, card)) {
      return Object.assign(Object.create(Object.getPrototypeOf(card)), card,
        { boardId: saved.boardId, listId: saved.listId });
    }
  }
  return null;
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
  // A board-level activity names no list (2026-10-03: a rule's createSwimlane,
  // a cross-board moveCardBoard). No rule trigger exists for those types
  // (server/triggersDef.js), so there is nothing to run; one that has a
  // trigger would need its list, and is refused.
  if (options.activity && options.activity.listId === undefined) {
    if (Object.hasOwn(TriggersDef, options.activity.activityType)) throw new Error('sync-rule-stage-invalid');
    validateSyncTrigger(options.trigger);
    await options.assertCurrent();
    return options.effectId;
  }
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
    sortList: ({ invocation }) => runStoredSyncRuleSortList({ ...options, index: indices.get(invocation.id) }),
    createCard: ({ invocation }) => runStoredSyncRuleCreateCard({ ...options, index: indices.get(invocation.id) }),
    // A copy or link to another board only when that board opted in too
    // (listSyncSteps.js durableRuleActionTypes); the runners check it again.
    copyCard: ({ invocation }) => runStoredSyncRuleCopyCard({ ...options, index: indices.get(invocation.id) }),
    linkCard: ({ invocation }) => runStoredSyncRuleLinkCard({ ...options, index: indices.get(invocation.id) }),
    addSwimlane: ({ invocation }) => runStoredSyncRuleAddSwimlane({ ...options, index: indices.get(invocation.id) }),
    // On the card's own board, or - as the plan's last action, onto a board
    // that opted in too - to another board (syncRuleMoveBoardCommand.js).
    moveAllCardsInList: ({ invocation }) => (isOtherBoardMoveAll(invocation.action, plan.boardId)
      ? runStoredSyncRuleMoveAllBoard : runStoredSyncRuleMoveAll)({ ...options, index: indices.get(invocation.id) }),
    ...Object.fromEntries(RULE_CHECKLIST_LIFECYCLE_ACTIONS.map(type => [type, ({ invocation }) =>
      runStoredSyncRuleChecklistLifecycle({ ...options, index: indices.get(invocation.id) })])),
    // A move on the card's own board, or - as the plan's last action, onto a
    // board that opted in too - to another board (syncRuleMoveBoardCommand.js).
    ...Object.fromEntries(RULE_MOVE_ACTIONS.map(type => [type, ({ invocation }) =>
      (isOtherBoardMove(invocation.action, plan.boardId) ? runStoredSyncRuleMoveBoard : runStoredSyncRuleMove)(
        { ...options, index: indices.get(invocation.id) })])),
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
  const placed = await ruleEmailActivity(plan, context, options.trigger);
  return ensureRuleEmailCommand({ commands: SyncRuleEmailCommands.rawCollection(), plan,
    activity: context.saved, effectId: context.effectId, index, assertCurrent: context.guard,
    prepare: ({ invocation }) => RulesHelper.prepareEmailCommand(placed.activity, invocation.action,
      { followedFrom: placed.followedFrom }) });
}

// Explicit internal send entry point; never called by ordinary/manual/cron
// rules yet. Uncertain attempts require future operator resolution.
export async function runStoredSyncRuleEmail({ index, ...options }) {
  const context = executionContext(options), plan = await capture(context);
  const placed = await ruleEmailActivity(plan, context, options.trigger);
  const command = await ensureRuleEmailCommand({ commands: SyncRuleEmailCommands.rawCollection(), plan,
    activity: context.saved, effectId: context.effectId, index, assertCurrent: context.guard,
    prepare: ({ invocation }) => RulesHelper.prepareEmailCommand(placed.activity, invocation.action,
      { followedFrom: placed.followedFrom }) });
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
    // A followed move (binding version 6) holds only while this plan's own
    // move is what put the card where the command was prepared.
    const where = await ruleEmailActivity(plan, context, options.trigger);
    if (command.sourceBinding?.version === 6 && (where.followedFrom !== command.sourceBinding.followedFrom ||
        where.activity.boardId !== command.sourceBinding.cards[0][1])) throw new Error('rule-email-source-not-authorized');
    await assertRuleEmailSourceBinding({ binding: command.sourceBinding, activity: context.saved, cache: ReactiveCache, canReadBoard, requireRelatedSources: invocation.action.includeCardDetails === true });
    const [rule, action] = await Promise.all([
      Rules.rawCollection().findOne({ _id: invocation.rule._id }),
      Actions.rawCollection().findOne({ _id: invocation.action._id }),
    ]);
    if (!rule || !action || canonical(rule) !== canonical(invocation.rule) ||
        canonical(action) !== canonical(invocation.action)) throw new Error('sync-rule-email-configuration-changed');
    const current = await RulesHelper.prepareEmailAction(where.activity, action);
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
  return { context, plan, index, guard, assertCard, options };
}
async function captureArchive({ context, plan, index, guard, assertCard, options }) {
  // On the board the card is on now: the plan's, or where a move of this
  // same plan took it (ruleCardNow, 2026-10-03). A saved command keeps its own.
  const now = await ruleCardNow(plan, context);
  const cardBoardId = now ? now.boardId : plan.boardId;
  if (cardBoardId !== plan.boardId) await assertDestinationBoard(cardBoardId, plan, options?.trigger);
  const command = await ensureRuleArchiveCommand({ commands: SyncRuleArchiveCommands.rawCollection(),
    plan, activity: context.saved, effectId: context.effectId, index, assertCurrent: guard, assertCard, cardBoardId,
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
      const lists = await Lists.find({ _id: { $in: ids }, boardId: ruleArchiveBoardOf(command) }, { transform: null }).fetchAsync();
      const redoRows = await ChangeHistory.find({ boardId: ruleArchiveBoardOf(command), userId: command.actorId, undone: true,
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
    const card = await ruleCardNow(plan, context);
    // A linked card's field is written on the card it links to (getRealId).
    const real = card && realCardId(card) !== card._id
      ? await Cards.findOneAsync({ _id: realCardId(card) }, { transform: null }) : card;
    if (real && real.boardId !== plan.boardId) await assertDestinationBoard(real.boardId, plan, options.trigger);
    const redoRows = await ChangeHistory.find({ boardId: real?.boardId || plan.boardId, userId: plan.actorId, undone: true,
      superseded: { $ne: true } }, { transform: null, limit: 10000 }).fetchAsync();
    const actor = await Meteor.users.findOneAsync(plan.actorId, { fields: { username: 1 } });
    const targets = MEMBER_ACTIONS.includes(invocation.action.actionType)
      ? await RulesHelper.resolveMemberTargets(context.saved, await Cards.findOneAsync(plan.cardId), invocation.action) : [];
    const candidate = prepareRuleCardCommand({ ...commandContext, card, real, createdAt: new Date(), redoRows,
      username: actor?.username || '', targets, cardBoardId: card?.boardId });
    await guard();
    let failure;
    try { await commands.insertOne(candidate); } catch (error) { failure = error; }
    row = await commands.findOne({ _id: id });
    if (!row) throw failure || new Error('sync-rule-card-command-unconfirmed');
  }
  const command = validateRuleCardCommand(row, commandContext);
  // The subject is still what the rule's card writes through: itself, or the
  // card it links to, on a board that may take this Sync's effects.
  const ruleCard = await ruleCardNow(plan, context, { raw: true });
  if (!ruleCard || realCardId(ruleCard) !== command.subject.cardId ||
      (command.subject.cardId === plan.cardId && command.subject.boardId !== ruleCard.boardId)) {
    throw new Error('sync-rule-card-subject-changed');
  }
  await assertDestinationBoard(command.subject.boardId, plan, options.trigger);
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
      const { listId } = await Cards.findOneAsync({ _id: command.subject.cardId }, { fields: { listId: 1 }, transform: null });
      await DDP._CurrentMethodInvocation.withValue({ userId: command.actorId, isSimulation: false }, () =>
        withSyncRecordingDeferred({ cardId: command.subject.cardId, boardId: command.subject.boardId, listId,
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
  fieldSelector: ruleCardFieldSelector, realCardId } = require('/server/lib/syncRuleCardCommand');
const { persistSyncFieldHistory, RULE_CARD_FIELDS } = require('/server/lib/syncHistoryBatch');
const { persistSyncActivity } = require('/server/lib/syncActivityPersistence');
const { withSyncRecordingDeferred } = require('/server/lib/syncRecordingScope');
const { withSyncActivityDeferred } = require('/server/lib/syncActivityScope');

// Durable rule moves that stay in place (server/lib/syncRuleMoveCommand.js):
// one saved command per invocation, captured with the ordinary action's own
// sort computation, then the conditional sort write with the hook's position
// row deferred, the planned position row, and the legacy UserPositionHistory
// row Ctrl+Z reads. Every step is idempotent on replay.
export const SyncRuleMoveCommands = new Mongo.Collection('listSyncRuleMoveCommands');
SyncRuleMoveCommands.deny({ insert: () => true, update: () => true, remove: () => true });

export async function runStoredSyncRuleMove({ index, completeDelivery = runStoredSyncActivityDelivery, ...options }) {
  const context = executionContext(options), plan = await capture(context);
  const invocation = plan.actions[index];
  if (!RULE_MOVE_ACTIONS.includes(invocation?.action?.actionType)) throw new Error('sync-rule-move-invalid');
  const commandContext = { plan, activity: context.saved, effectId: context.effectId, index };
  const guard = reuseWithinEvaluation(async () => {
    await context.guard();
    const [rule, action] = await Promise.all([
      Rules.rawCollection().findOne({ _id: invocation.rule._id }),
      Actions.rawCollection().findOne({ _id: invocation.action._id }),
    ]);
    if (!rule || !action || canonical(rule) !== canonical(invocation.rule) ||
        canonical(action) !== canonical(invocation.action)) throw new Error('sync-rule-move-configuration-changed');
    await context.guard();
  });
  const commands = SyncRuleMoveCommands.rawCollection(), id = ruleMoveCommandId(invocation.id);
  await guard();
  let row = await commands.findOne({ _id: id });
  if (!row) {
    // The card where it is now: on the plan's board, or where a move of this
    // same plan took it (ruleCardNow) - the move resolves there, as the
    // ordinary action does (RulesHelper.ruleBoards, 2026-10-03).
    const now = await ruleCardNow(plan, context);
    const onBoard = now ? now.boardId : plan.boardId;
    if (onBoard !== plan.boardId) await assertDestinationBoard(onBoard, plan, options.trigger);
    const card = now ? await Cards.findOneAsync({ _id: plan.cardId, boardId: onBoard }) : null;
    // The ordinary action's own target (RulesHelper.moveCardTarget). A legacy
    // action without a boardId moves on the card's own board.
    const action = { ...invocation.action, boardId: invocation.action.boardId || plan.boardId };
    const target = card ? await RulesHelper.moveCardTarget(context.saved, card, action) : null;
    // No list to fall back to: the ordinary action does nothing; nor may this.
    if (!target) throw new Error('sync-rule-move-no-target');
    const [list, swimlane] = await Promise.all([
      Lists.findOneAsync({ _id: target.listId, boardId: onBoard }),
      Swimlanes.findOneAsync({ _id: target.swimlaneId, boardId: onBoard }),
    ]);
    const redoRows = await ChangeHistory.find({ boardId: onBoard, userId: plan.actorId, undone: true,
      superseded: { $ne: true } }, { transform: null, limit: 10000 }).fetchAsync();
    const raw = await Cards.rawCollection().findOne({ _id: plan.cardId, boardId: onBoard });
    const candidate = prepareRuleMoveCommand({ ...commandContext, card: raw, target, createdAt: new Date(), redoRows,
      cardBoardId: onBoard,
      titles: { listName: list ? list.title : '', swimlaneName: swimlane ? swimlane.title : '', cardTitle: raw?.title } });
    await guard();
    let failure;
    try { await commands.insertOne(candidate); } catch (error) { failure = error; }
    row = await commands.findOne({ _id: id });
    if (!row) throw failure || new Error('sync-rule-move-command-unconfirmed');
  }
  const command = validateRuleMoveCommand(row, commandContext);
  const at = place => Cards.rawCollection().findOne(ruleMovePlaceSelector(command, place));
  const actor = work => DDP._CurrentMethodInvocation.withValue({ userId: command.actorId, isSimulation: false }, work);
  await guard();
  const modifier = ruleMoveModifier(command);
  if (Object.keys(modifier.$set).length && !await at(command.after)) {
    if (!await at(command.before)) throw new Error('sync-rule-move-changed');
    await guard();
    // The hook's position row and moveCard activity are this command's to write.
    await actor(() => withSyncRecordingDeferred({ cardId: command.cardId, boardId: ruleMoveBoardOf(command),
      listId: command.after.listId, kinds: ['history', 'position', 'move'] },
    () => Cards.updateAsync(ruleMovePlaceSelector(command, command.before), modifier)));
    if (!await at(command.after)) throw new Error('sync-rule-move-unconfirmed');
  }
  if (command.effects.history) {
    await persistSyncFieldHistory({ history: ChangeHistory, plan: command.effects.history, assertCurrent: guard,
      fields: RULE_CARD_POSITION_FIELDS });
  }
  if (command.effects.userPosition) {
    // trackChange's two writes: a NEW change clears the actor's redo stack on
    // the board, then records itself. Done once: the row's id is the receipt.
    const legacy = UserPositionHistory.rawCollection(), entry = command.effects.userPosition;
    await guard();
    if (!await legacy.findOne({ _id: entry._id })) {
      await legacy.deleteMany({ userId: entry.userId, boardId: entry.boardId, isCheckpoint: { $ne: true }, undone: true });
      try { await legacy.insertOne(entry); } catch (error) { if (!await legacy.findOne({ _id: entry._id })) throw error; }
    }
  }
  if (command.effects.move) {
    // Card.move's attachment placement, then the hook's moveCard activity -
    // delivered durably, so the moved card's rules run once.
    await guard();
    await Attachments.collection.rawCollection().updateMany({ 'meta.cardId': command.cardId },
      { $set: { 'meta.listId': command.after.listId, 'meta.swimlaneId': command.after.swimlaneId } });
    const activities = {
      findOneAsync: activityId => Activities.findOneAsync(activityId, { transform: null }),
      insertAsync: document => actor(() => withSyncActivityDeferred(document, () => Activities.insertAsync(document))),
    };
    await persistSyncActivity({ activities, activity: command.effects.move.activity, effectId: command.effects.move.receiptId,
      assertCurrent: guard, completeDelivery: delivery => completeDelivery({ ...delivery, policy: options.policy,
        trigger: options.trigger }) });
  }
  await guard();
  return invocation.id;
}
const { RULE_MOVE_ACTIONS, commandId: ruleMoveCommandId, prepareRuleMoveCommand, validateRuleMoveCommand,
  placeSelector: ruleMovePlaceSelector, moveModifier: ruleMoveModifier, boardOf: ruleMoveBoardOf } = require('/server/lib/syncRuleMoveCommand');

// Durable rule moves to another board (server/lib/syncRuleMoveBoardCommand.js):
// the move Card.move makes, decided once with its own mappings, written
// conditionally with every hook record deferred, then each record written from
// the command. Only the plan's last action; the destination opted in too.
export const SyncRuleMoveBoardCommands = new Mongo.Collection('listSyncRuleMoveBoardCommands');
SyncRuleMoveBoardCommands.deny({ insert: () => true, update: () => true, remove: () => true });

async function captureRuleMoveBoard({ plan, saved, action, commandContext, context, trigger }) {
  // From where the card is now: the plan's board, or the board an earlier
  // move of this same plan took it to (ruleCardNow, 2026-10-03).
  const now = await ruleCardNow(plan, context);
  const fromBoardId = now ? now.boardId : plan.boardId;
  if (fromBoardId !== plan.boardId) await assertDestinationBoard(fromBoardId, plan, trigger);
  // Already on the board it would go to: not a move to another board.
  if (fromBoardId === action.boardId) throw new Error('sync-rule-move-board-already-there');
  const card = now ? await Cards.findOneAsync({ _id: plan.cardId, boardId: fromBoardId }) : null;
  const target = card ? await RulesHelper.moveCardTarget(saved, card, action) : null;
  // No list to go to: the ordinary action does nothing; nor may this.
  if (!target || target.boardId !== action.boardId) throw new Error('sync-rule-move-board-no-target');
  const [fromBoard, toBoard, list, swimlane, raw] = await Promise.all([
    Boards.findOneAsync(fromBoardId), Boards.findOneAsync(action.boardId),
    Lists.findOneAsync({ _id: target.listId, boardId: action.boardId }),
    Swimlanes.findOneAsync({ _id: target.swimlaneId, boardId: action.boardId }),
    Cards.rawCollection().findOne({ _id: plan.cardId, boardId: fromBoardId }),
  ]);
  if (!fromBoard || !toBoard || !list || !swimlane || !raw) throw new Error('sync-rule-move-board-target-missing');
  return prepareRuleMoveBoardCommand({ ...commandContext, fromBoardId,
    ...await boardMoveInputs({ raw, model: card, fromBoard, toBoard, target, swimlaneTitle: swimlane.title }),
    createdAt: new Date(), redoRows: await boardRedoRows(action.boardId, plan.actorId) });
}

// Card.move's choices for one card going to another board, by the same
// lookups: labels by name, custom fields mapped (and shared), the next card
// number, that board's active members; and the card's addedLabel activities.
async function boardMoveInputs({ raw, model, fromBoard, toBoard, target, swimlaneTitle }) {
  const names = (fromBoard.labels || []).filter(label => (raw.labelIds || []).includes(label._id)).map(label => label.name);
  const labelIds = (toBoard.labels || []).filter(label => label.name && names.includes(label.name)).map(label => label._id);
  const customFields = await model.mapCustomFieldsToBoard(toBoard._id);
  const labelActivities = await Activities.rawCollection().find({ activityType: 'addedLabel', cardId: raw._id },
    { projection: { labelId: 1 }, sort: { _id: 1 } }).toArray();
  return { card: raw, target, labelActivities,
    mapped: { labelIds, cardNumber: await toBoard.getNextCardNumber(),
      customFields: Array.isArray(customFields) ? customFields : [],
      // Its sprint and release by name on that board (models/lib/scrumCopy.js).
      scrumPlanning: raw.scrum && (raw.scrum.sprintId || require('/models/lib/scrum').cardReleaseIds(raw.scrum).length)
        ? await scrumPlanningPair(fromBoard._id, toBoard._id) : null },
    allowedMemberIds: (toBoard.members || []).filter(member => member.isActive === true).map(member => member.userId),
    titles: { boardName: toBoard.title, oldBoardName: fromBoard.title, swimlaneName: swimlaneTitle } };
}
const boardRedoRows = (boardId, userId) => ChangeHistory.find({ boardId, userId, undone: true, superseded: { $ne: true } },
  { transform: null, limit: 10000 }).fetchAsync();

// Durable rule moveAllCardsInList onto another board
// (syncRuleMoveBoardCommand.js): the cards taken once, each then moved as a
// single move to another board is, with its own records. The plan's last
// action only; the destination opted in too.
export const SyncRuleMoveAllBoardCommands = new Mongo.Collection('listSyncRuleMoveAllBoardCommands');
SyncRuleMoveAllBoardCommands.deny({ insert: () => true, update: () => true, remove: () => true });

export async function runStoredSyncRuleMoveAllBoard({ index, completeDelivery = runStoredSyncActivityDelivery, ...options }) {
  const context = executionContext(options), plan = await capture(context);
  const invocation = plan.actions[index], action = invocation?.action;
  if (!isOtherBoardMoveAll(action, plan.boardId)) throw new Error('sync-rule-move-all-board-invalid');
  const commandContext = { plan, activity: context.saved, effectId: context.effectId, index };
  const guard = reuseWithinEvaluation(async () => {
    await context.guard();
    const [rule, current] = await Promise.all([
      Rules.rawCollection().findOne({ _id: invocation.rule._id }),
      Actions.rawCollection().findOne({ _id: action._id }),
    ]);
    if (!rule || !current || canonical(rule) !== canonical(invocation.rule) ||
        canonical(current) !== canonical(action)) throw new Error('sync-rule-move-all-board-configuration-changed');
    await assertDestinationBoard(action.boardId, plan, options.trigger);
    await context.guard();
  });
  const commands = SyncRuleMoveAllBoardCommands.rawCollection(), id = ruleMoveAllBoardCommandId(invocation.id);
  await guard();
  let row = await commands.findOne({ _id: id });
  if (!row) {
    // The ordinary action's own lookups (server/rulesHelper.js performAction):
    // the list to move from is on the board the rule's card is on now - the
    // plan's, or where a move of this same plan took it (ruleCardNow).
    const now = plan.cardId ? await ruleCardNow(plan, context) : null;
    const fromBoardId = now ? now.boardId : plan.boardId;
    if (fromBoardId !== plan.boardId) await assertDestinationBoard(fromBoardId, plan, options.trigger);
    if (fromBoardId === action.boardId) throw new Error('sync-rule-move-all-board-already-there');
    const [fromBoard, toBoard] = await Promise.all([Boards.findOneAsync(fromBoardId), Boards.findOneAsync(action.boardId)]);
    const from = await ReactiveCache.getList({ title: action.fromListName, boardId: fromBoardId });
    const to = await ReactiveCache.getList({ title: action.listName, boardId: action.boardId });
    const moves = [];
    if (from && to && fromBoard && toBoard) {
      // Each card's own swimlane is on the board it leaves, so the update's
      // consistency hook puts it in that board's default swimlane.
      const lane = await toBoard.getDefaultSwimlineAsync();
      if (!lane) throw new Error('sync-rule-move-all-board-no-swimlane');
      for (const model of await from.cardsUnfiltered()) {
        const raw = await Cards.rawCollection().findOne({ _id: model._id, boardId: fromBoardId });
        if (!raw) continue;
        moves.push(await boardMoveInputs({ raw, model, fromBoard, toBoard, swimlaneTitle: lane.title,
          target: { boardId: action.boardId, listId: to._id, swimlaneId: lane._id, sort: null } }));
      }
    }
    const candidate = prepareRuleMoveAllBoardCommand({ ...commandContext, moves, createdAt: new Date(), fromBoardId,
      redoRows: await boardRedoRows(action.boardId, plan.actorId) });
    await guard();
    let failure;
    try { await commands.insertOne(candidate); } catch (error) { failure = error; }
    row = await commands.findOne({ _id: id });
    if (!row) throw failure || new Error('sync-rule-move-all-board-command-unconfirmed');
  }
  const command = validateRuleMoveAllBoardCommand(row, commandContext);
  for (const unit of command.units) await applyRuleMoveBoard(unitMove(command, unit), { guard, completeDelivery, options });
  await guard();
  return invocation.id;
}

export async function runStoredSyncRuleMoveBoard({ index, completeDelivery = runStoredSyncActivityDelivery, ...options }) {
  const context = executionContext(options), plan = await capture(context);
  const invocation = plan.actions[index], action = invocation?.action;
  if (!isOtherBoardMove(action, plan.boardId)) throw new Error('sync-rule-move-board-invalid');
  const commandContext = { plan, activity: context.saved, effectId: context.effectId, index };
  const guard = reuseWithinEvaluation(async () => {
    await context.guard();
    const [rule, current] = await Promise.all([
      Rules.rawCollection().findOne({ _id: invocation.rule._id }),
      Actions.rawCollection().findOne({ _id: action._id }),
    ]);
    if (!rule || !current || canonical(rule) !== canonical(invocation.rule) ||
        canonical(current) !== canonical(action)) throw new Error('sync-rule-move-board-configuration-changed');
    await assertDestinationBoard(action.boardId, plan, options.trigger);
    await context.guard();
  });
  const commands = SyncRuleMoveBoardCommands.rawCollection(), id = ruleMoveBoardCommandId(invocation.id);
  await guard();
  let row = await commands.findOne({ _id: id });
  if (!row) {
    // The plan's last action: refused here, before anything is written, if not.
    const candidate = await captureRuleMoveBoard({ plan, saved: context.saved, action, commandContext, context,
      trigger: options.trigger });
    await guard();
    let failure;
    try { await commands.insertOne(candidate); } catch (error) { failure = error; }
    row = await commands.findOne({ _id: id });
    if (!row) throw failure || new Error('sync-rule-move-board-command-unconfirmed');
  }
  const command = validateRuleMoveBoardCommand(row, commandContext);
  await applyRuleMoveBoard(command, { guard, completeDelivery, options });
  await guard();
  return invocation.id;
}
// One card's move to another board, from its saved move (a command, or a
// move-all unit through unitMove): the conditional update with every hook
// record deferred, then each record, idempotently.
async function applyRuleMoveBoard(command, { guard, completeDelivery, options }) {
  const actor = work => DDP._CurrentMethodInvocation.withValue({ userId: command.actorId, isSimulation: false }, work);
  const raw = Cards.rawCollection();
  const { place } = command.after;
  await guard();
  if (!await raw.findOne(ruleMoveBoardAfter(command))) {
    if (!await raw.findOne(ruleMoveBoardBefore(command))) throw new Error('sync-rule-move-board-changed');
    await guard();
    // Every record the update's hooks would write is this command's to write.
    await actor(() => withSyncRecordingDeferred({ cardId: command.cardId, boardId: place.boardId, listId: place.listId,
      kinds: ['history', 'position', 'boardMove', 'move', 'customFields', 'labelActivities'], fromBoardId: command.before.place.boardId },
    () => Cards.updateAsync(ruleMoveBoardBefore(command), ruleMoveBoardModifier(command))));
    if (!await raw.findOne(ruleMoveBoardAfter(command))) throw new Error('sync-rule-move-board-unconfirmed');
  }
  const [position, fields] = command.effects.history;
  await persistSyncFieldHistory({ history: ChangeHistory, plan: position, assertCurrent: guard,
    fields: RULE_CARD_POSITION_FIELDS });
  if (fields.rows.length) {
    await persistSyncFieldHistory({ history: ChangeHistory, plan: fields, assertCurrent: guard,
      fields: RULE_CARD_MOVE_BOARD_FIELDS });
  }
  // Card.move's legacy row: the actor's redo stack on the board left, then the row.
  const legacy = UserPositionHistory.rawCollection(), entry = command.effects.userPosition;
  await guard();
  if (!await legacy.findOne({ _id: entry._id })) {
    await legacy.deleteMany({ userId: entry.userId, boardId: entry.boardId, isCheckpoint: { $ne: true }, undone: true });
    try { await legacy.insertOne(entry); } catch (error) { if (!await legacy.findOne({ _id: entry._id })) throw error; }
  }
  // The update hooks' writes on other documents, each idempotent: checklists
  // and items re-homed, the board left keeps no dependency on the card, the
  // attachments follow it, its label activities re-pointed or removed.
  await guard();
  await Checklists.direct.updateAsync({ cardId: command.cardId }, { $set: { boardId: place.boardId } }, { multi: true });
  await ChecklistItems.direct.updateAsync({ cardId: command.cardId }, { $set: { boardId: place.boardId } }, { multi: true });
  await actor(async () => {
    // The board the card left: the plan's, or an earlier move's (fromBoard).
    await Cards.updateAsync({ boardId: command.before.place.boardId, 'cardDependencies.cardId': command.cardId },
      { $pull: { cardDependencies: { cardId: command.cardId } } }, { multi: true });
    await Cards.updateAsync({ boardId: command.before.place.boardId, cardDependencies: command.cardId },
      { $pull: { cardDependencies: command.cardId } }, { multi: true });
  });
  await Attachments.collection.rawCollection().updateMany({ 'meta.cardId': command.cardId },
    { $set: { 'meta.boardId': place.boardId, 'meta.listId': place.listId, 'meta.swimlaneId': place.swimlaneId } });
  for (const rewrite of command.effects.labelActivities) {
    if (rewrite.remove) await Activities.rawCollection().deleteOne({ _id: rewrite._id });
    else await Activities.rawCollection().updateOne({ _id: rewrite._id },
      { $set: { labelId: rewrite.labelId, boardId: rewrite.boardId } });
  }
  // The moveCardBoard activity, delivered durably: it names no list, which
  // board-level delivery takes (2026-10-03), and no rule trigger exists for it.
  const move = command.effects.move;
  await persistSyncActivity({ activities: durableActivities(actor), activity: move,
    effectId: move._id.slice('sync-rule-move-board-'.length), assertCurrent: guard,
    completeDelivery: delivery => completeDelivery({ ...delivery, policy: options.policy, trigger: options.trigger }) });
  // The custom fields' activities, delivered durably on the new board.
  const activities = {
    findOneAsync: activityId => Activities.findOneAsync(activityId, { transform: null }),
    insertAsync: document => actor(() => withSyncActivityDeferred(document, () => Activities.insertAsync(document))),
  };
  for (const { receiptId, activity } of command.effects.customFields) {
    await persistSyncActivity({ activities, activity, effectId: receiptId, assertCurrent: guard,
      completeDelivery: delivery => completeDelivery({ ...delivery, policy: options.policy, trigger: options.trigger }) });
  }
}
const { isOtherBoardMove, commandId: ruleMoveBoardCommandId, prepareRuleMoveBoardCommand, validateRuleMoveBoardCommand,
  beforeSelector: ruleMoveBoardBefore, afterSelector: ruleMoveBoardAfter, moveModifier: ruleMoveBoardModifier,
  isOtherBoardMoveAll, moveAllCommandId: ruleMoveAllBoardCommandId, prepareRuleMoveAllBoardCommand,
  validateRuleMoveAllBoardCommand, unitMove } = require('/server/lib/syncRuleMoveBoardCommand');
const { RULE_CARD_MOVE_BOARD_FIELDS } = require('/server/lib/syncHistoryBatch');

// Durable rule moveAllCardsInList on the card's own board
// (server/lib/syncRuleMoveAllCommand.js): the cards taken once, then each
// moved as a single rule move is, with its own effects.
export const SyncRuleMoveAllCommands = new Mongo.Collection('listSyncRuleMoveAllCommands');
SyncRuleMoveAllCommands.deny({ insert: () => true, update: () => true, remove: () => true });

export async function runStoredSyncRuleMoveAll({ index, completeDelivery = runStoredSyncActivityDelivery, ...options }) {
  const context = executionContext(options), plan = await capture(context);
  const invocation = plan.actions[index], action = invocation?.action;
  if (action?.actionType !== 'moveAllCardsInList') throw new Error('sync-rule-move-all-invalid');
  const commandContext = { plan, activity: context.saved, effectId: context.effectId, index };
  const guard = reuseWithinEvaluation(async () => {
    await context.guard();
    const [rule, current] = await Promise.all([
      Rules.rawCollection().findOne({ _id: invocation.rule._id }),
      Actions.rawCollection().findOne({ _id: action._id }),
    ]);
    if (!rule || !current || canonical(rule) !== canonical(invocation.rule) ||
        canonical(current) !== canonical(action)) throw new Error('sync-rule-move-all-configuration-changed');
    await context.guard();
  });
  const commands = SyncRuleMoveAllCommands.rawCollection(), id = ruleMoveAllCommandId(invocation.id);
  await guard();
  let row = await commands.findOne({ _id: id });
  if (!row) {
    // The ordinary action's own lookups (server/rulesHelper.js performAction),
    // on the board the rule's card is on now (ruleCardNow, RulesHelper.ruleBoards).
    const now = plan.cardId ? await ruleCardNow(plan, context) : null;
    const onBoard = now ? now.boardId : plan.boardId;
    if (onBoard !== plan.boardId) await assertDestinationBoard(onBoard, plan, options.trigger);
    const from = await ReactiveCache.getList({ title: action.fromListName, boardId: onBoard });
    const to = await ReactiveCache.getList({ title: action.listName, boardId: onBoard });
    const cards = from && to ? (await from.cardsUnfiltered()).map(card => ({ _id: card._id, boardId: card.boardId,
      listId: card.listId, swimlaneId: card.swimlaneId, sort: card.sort, title: card.title,
      lastMoveReason: card.lastMoveReason })) : [];
    const swimlaneIds = [...new Set(cards.map(card => card.swimlaneId))];
    const swimlanes = swimlaneIds.length
      ? await Swimlanes.find({ _id: { $in: swimlaneIds } }, { fields: { title: 1 } }).fetchAsync() : [];
    const redoRows = await ChangeHistory.find({ boardId: onBoard, userId: plan.actorId, undone: true,
      superseded: { $ne: true } }, { transform: null, limit: 10000 }).fetchAsync();
    const candidate = prepareRuleMoveAllCommand({ ...commandContext, from: from && { _id: from._id, title: from.title },
      to: to && { _id: to._id, title: to.title }, cards,
      swimlaneTitles: Object.fromEntries(swimlanes.map(lane => [lane._id, lane.title || ''])), createdAt: new Date(),
      redoRows, cardBoardId: onBoard });
    await guard();
    let failure;
    try { await commands.insertOne(candidate); } catch (error) { failure = error; }
    row = await commands.findOne({ _id: id });
    if (!row) throw failure || new Error('sync-rule-move-all-command-unconfirmed');
  }
  const command = validateRuleMoveAllCommand(row, commandContext);
  const actor = work => DDP._CurrentMethodInvocation.withValue({ userId: command.actorId, isSimulation: false }, work);
  const activities = {
    findOneAsync: activityId => Activities.findOneAsync(activityId, { transform: null }),
    insertAsync: document => actor(() => withSyncActivityDeferred(document, () => Activities.insertAsync(document))),
  };
  const cardsCollection = Cards.rawCollection();
  for (const unit of command.units) {
    await guard();
    if (!await cardsCollection.findOne(ruleMoveAllSelector(command, unit, unit.after))) {
      if (!await cardsCollection.findOne(ruleMoveAllSelector(command, unit, unit.before))) {
        throw new Error('sync-rule-move-all-changed');
      }
      await actor(() => withSyncRecordingDeferred({ cardId: unit.cardId, boardId: ruleMoveAllBoardOf(command),
        listId: unit.after.listId, kinds: ['history', 'position', 'move'] },
      () => Cards.updateAsync(ruleMoveAllSelector(command, unit, unit.before), ruleMoveModifier(unit))));
      if (!await cardsCollection.findOne(ruleMoveAllSelector(command, unit, unit.after))) {
        throw new Error('sync-rule-move-all-unconfirmed');
      }
    }
    await persistSyncFieldHistory({ history: ChangeHistory, plan: unit.effects.history, assertCurrent: guard,
      fields: RULE_CARD_POSITION_FIELDS });
    const legacy = UserPositionHistory.rawCollection(), entry = unit.effects.userPosition;
    await guard();
    if (!await legacy.findOne({ _id: entry._id })) {
      await legacy.deleteMany({ userId: entry.userId, boardId: entry.boardId, isCheckpoint: { $ne: true }, undone: true });
      try { await legacy.insertOne(entry); } catch (error) { if (!await legacy.findOne({ _id: entry._id })) throw error; }
    }
    await Attachments.collection.rawCollection().updateMany({ 'meta.cardId': unit.cardId },
      { $set: { 'meta.listId': unit.after.listId, 'meta.swimlaneId': unit.after.swimlaneId } });
    await persistSyncActivity({ activities, activity: unit.effects.move.activity, effectId: unit.effects.move.receiptId,
      assertCurrent: guard, completeDelivery: delivery => completeDelivery({ ...delivery, policy: options.policy,
        trigger: options.trigger }) });
  }
  await guard();
  return invocation.id;
}
const { commandId: ruleMoveAllCommandId, prepareRuleMoveAllCommand, validateRuleMoveAllCommand,
  unitSelector: ruleMoveAllSelector, boardOf: ruleMoveAllBoardOf } = require('/server/lib/syncRuleMoveAllCommand');
const { RULE_CARD_POSITION_FIELDS } = require('/server/lib/syncHistoryBatch');

// Durable rule copyCard, on the card's own board or another that opted in
// (server/lib/syncRuleCopyCardCommand.js): what the copy contains is decided
// once with the ordinary copy's own lookups and builders, then each document is
// inserted once under its derived id - the copy and its subtasks with their
// creation activities saved and delivered durably, each attachment's file
// copied with its History row written from the plan, checklists, items and
// comments directly, as Card.copy does. Every step is idempotent on replay.
export const SyncRuleCopyCardCommands = new Mongo.Collection('listSyncRuleCopyCardCommands');
SyncRuleCopyCardCommands.deny({ insert: () => true, update: () => true, remove: () => true });

// The copy chain: like server/lib/ruleCopyCard.js, a copy action runs once per
// causal chain - a copy (or its subtask) whose own creation triggers the same
// action is not copied again.
async function copiedByThisAction(commands, cardId, actionId) {
  let current = cardId;
  for (let depth = 0; depth < 100 && current; depth += 1) {
    const parent = await commands.findOne({ noop: false, $or: [{ 'card._id': current }, { 'subtasks.card._id': current }] },
      { projection: { actionId: 1, cardId: 1 } });
    if (!parent) return false;
    if (parent.actionId === actionId) return true;
    current = parent.cardId;
  }
  return false;
}

async function captureRuleCopyCard({ plan, action, commandContext, commands }) {
  const raw = Cards.rawCollection();
  const source = await raw.findOne({ _id: plan.cardId, boardId: plan.boardId });
  const createdAt = new Date();
  const noop = () => prepareRuleCopyCardCommand({ ...commandContext, noop: true, createdAt });
  // A legacy action without a board copies onto the card's own board.
  const targetBoardId = action.boardId || plan.boardId;
  // The ordinary action's own preconditions (server/lib/ruleCopyCard.js).
  if (!source || source.archived || !text(action.listId) || !text(action.swimlaneId)) return noop();
  const [sourceBoard, board, list, swimlane] = await Promise.all([
    Boards.findOneAsync(plan.boardId), Boards.findOneAsync(targetBoardId), Lists.findOneAsync(action.listId),
    Swimlanes.findOneAsync(action.swimlaneId),
  ]);
  if (!sourceBoard || sourceBoard.archived || !board || board.archived || !list || list.archived ||
      list.boardId !== targetBoardId || !swimlane || swimlane.archived || swimlane.boardId !== targetBoardId) return noop();
  if (await copiedByThisAction(commands, plan.cardId, action._id)) return noop();
  const model = await Cards.findOneAsync(plan.cardId);
  // Card.copy's choices, by the same helpers.
  const policy = await require('/server/lib/adminOnlyCustomFields').fieldPolicy(plan.actorId);
  const { mayReadField } = require('/models/lib/adminOnlyCustomFields');
  const readable = (source.customFields || []).filter(field =>
    mayReadField(policy.definitions.get(field._id), plan.boardId, policy.adminBoards));
  const customFieldIds = readable.map(field => field._id);
  // On another board: labels by name, and custom fields mapped (and shared)
  // to that board, as Card.copy does.
  let crossBoard = null;
  if (targetBoardId !== plan.boardId) {
    const names = (sourceBoard.labels || []).filter(label => (source.labelIds || []).includes(label._id))
      .map(label => label.name);
    crossBoard = { labelIds: filterCopiedLabelIds(board.labels || [], names),
      customFields: await model.mapCustomFieldsToBoard.call({ customFields: readable }, targetBoardId) };
  }
  const dependencies = [];
  for (const dep of normalizeDependencies(source.cardDependencies)) {
    const target = await raw.findOne({ _id: dep.cardId }, { projection: { boardId: 1 } });
    if (target && target.boardId === targetBoardId) dependencies.push(dep);
  }
  // As Card.copy: on another board, the sprint and release linked by name.
  const planning = await scrumPlanningPair(plan.boardId, targetBoardId);
  const attachments = await Attachments.collection.find(liveAttachments({ 'meta.cardId': plan.cardId }),
    { sort: { _id: 1 } }).fetchAsync();
  const checklistsOf = cardId => Checklists.rawCollection().find({ cardId }, { sort: { sort: 1, _id: 1 } }).toArray();
  const itemsOf = ids => (ids.length
    ? ChecklistItems.rawCollection().find({ checklistId: { $in: ids } }, { sort: { sort: 1, _id: 1 } }).toArray() : []);
  const checklists = await checklistsOf(plan.cardId);
  // Only the subtasks the rule's actor could read and copy themselves, as an
  // ordinary copy takes (models/lib/boardCardScope.js copyableSubtasks).
  const children = await raw.find(childrenSelector(plan.cardId), { sort: { sort: 1, _id: 1 } }).toArray();
  const subtaskBoards = new Map();
  for (const id of new Set(children.map(child => child.boardId))) subtaskBoards.set(id, await Boards.findOneAsync(id));
  const subtaskSources = copyableSubtasks(children, plan.actorId, id => subtaskBoards.get(id), canReadBoard);
  const subtaskChecklists = [];
  for (const subtask of subtaskSources) subtaskChecklists.push(...await checklistsOf(subtask._id));
  const comments = await CardComments.rawCollection().find({ cardId: plan.cardId }, { sort: { createdAt: 1, _id: 1 } }).toArray();
  return prepareRuleCopyCardCommand({ ...commandContext, card: source,
    destination: { listId: list._id, swimlaneId: swimlane._id, listTitle: list.title || '', swimlaneTitle: swimlane.title || '' },
    cardNumber: await board.getNextCardNumber(), sort: (await model.getSort(list._id, swimlane._id, false)) + 1,
    customFieldIds, dependencies, scrum: copiedCardScrum(source, targetBoardId, { planning }), attachments,
    checklists, items: await itemsOf(checklists.map(list => list._id)),
    subtaskSources, subtaskDocs: subtaskSources.map(subtask => buildCopiedSubtaskFields(subtask,
      { newParentId: 'pending', boardId: targetBoardId, swimlaneId: swimlane._id, listId: list._id,
        planning: subtask.boardId === plan.boardId ? planning : null })),
    subtaskChecklists, subtaskItems: await itemsOf(subtaskChecklists.map(list => list._id)),
    comments, commentDocs: comments.map(comment => buildCopiedComment(comment, 'pending', targetBoardId)), crossBoard,
    createdAt });
}

export async function runStoredSyncRuleCopyCard({ index, completeDelivery = runStoredSyncActivityDelivery, ...options }) {
  const context = executionContext(options), plan = await capture(context);
  const invocation = plan.actions[index], action = invocation?.action;
  if (action?.actionType !== 'copyCard') throw new Error('sync-rule-copy-card-invalid');
  const commandContext = { plan, activity: context.saved, effectId: context.effectId, index };
  const guard = reuseWithinEvaluation(async () => {
    await context.guard();
    const [rule, current] = await Promise.all([
      Rules.rawCollection().findOne({ _id: invocation.rule._id }),
      Actions.rawCollection().findOne({ _id: action._id }),
    ]);
    if (!rule || !current || canonical(rule) !== canonical(invocation.rule) ||
        canonical(current) !== canonical(action)) throw new Error('sync-rule-copy-card-configuration-changed');
    await assertDestinationBoard(action.boardId || plan.boardId, plan, options.trigger);
    await context.guard();
  });
  const commands = SyncRuleCopyCardCommands.rawCollection(), id = ruleCopyCardCommandId(invocation.id);
  await guard();
  let row = await commands.findOne({ _id: id });
  if (!row) {
    const candidate = await captureRuleCopyCard({ plan, action, commandContext, commands });
    await guard();
    let failure;
    try { await commands.insertOne(candidate); } catch (error) { failure = error; }
    row = await commands.findOne({ _id: id });
    if (!row) throw failure || new Error('sync-rule-copy-card-command-unconfirmed');
  }
  let command = validateRuleCopyCardCommand(row, commandContext);
  if (command.noop) { await guard(); return invocation.id; }
  const actor = work => DDP._CurrentMethodInvocation.withValue({ userId: command.actorId, isSimulation: false }, work);
  const activities = {
    findOneAsync: activityId => Activities.findOneAsync(activityId, { transform: null }),
    insertAsync: document => actor(() => withSyncActivityDeferred(document, () => Activities.insertAsync(document))),
  };
  const deliver = ({ receiptId, activity }) => persistSyncActivity({ activities, activity, effectId: receiptId,
    assertCurrent: guard, completeDelivery: delivery => completeDelivery({ ...delivery, policy: options.policy,
      trigger: options.trigger }) });
  const insertCard = async card => {
    await guard();
    if (await Cards.rawCollection().findOne({ _id: card._id })) return;
    await actor(() => withSyncRecordingDeferred({ cardId: card._id, boardId: card.boardId, listId: card.listId,
      kinds: ['create'] }, () => Cards.insertAsync(card)));
    if (!await Cards.rawCollection().findOne({ _id: card._id })) throw new Error('sync-rule-copy-card-unconfirmed');
  };
  const insertDirect = async (collection, doc, options = {}) => {
    await guard();
    if (!await collection.rawCollection().findOne({ _id: doc._id })) await collection.direct.insertAsync(doc, options);
  };

  // The copy, then its creation activity (which runs the copy's own rules).
  await insertCard(command.card);
  await deliver(command.cardActivity);
  // Its attachments, each file once, with the History row from the plan.
  const files = Attachments.collection.rawCollection();
  const { copyFile } = require('/models/lib/fileStoreStrategy.js');
  const { fileStoreStrategyFactory } = require('/models/attachments.server');
  for (const { sourceId, attachmentId } of command.attachments) {
    await guard();
    if (await files.findOne({ _id: attachmentId })) continue;
    const source = await Attachments.collection.findOneAsync(sourceId);
    if (!source) throw new Error('sync-rule-copy-card-attachment-gone');
    await actor(() => withSyncRecordingDeferred({ cardId: command.card._id, boardId: command.card.boardId,
      listId: command.card.listId, attachmentId, kinds: ['attachmentHistory'] },
    () => copyFile(source, command.card._id, fileStoreStrategyFactory, { fileIdFor: version =>
      (version === 'original' ? attachmentId : `${attachmentId}-${version}`) })));
  }
  if (command.recorded === null) {
    const stored = await Promise.all(command.attachments.map(file => files.findOne({ _id: file.attachmentId })));
    if (stored.some(file => !file)) throw new Error('sync-rule-copy-card-attachment-unconfirmed');
    await guard();
    await commands.updateOne({ _id: command._id, recorded: null },
      { $set: { recorded: recordCopiedAttachments(command, stored) } });
    command = validateRuleCopyCardCommand(await commands.findOne({ _id: id }), commandContext);
  }
  for (const history of command.recorded) {
    await persistSyncFieldHistory({ history: ChangeHistory, plan: history, assertCurrent: guard, fields: RULE_CHECKLIST_LIFECYCLE });
  }
  // The cover: the copy of the source's cover attachment, as Card.copy remaps it.
  if (command.coverId) {
    await guard();
    await Cards.rawCollection().updateOne({ _id: command.card._id, coverId: { $ne: command.coverId } },
      { $set: { coverId: command.coverId } });
  }
  // Checklists and items: direct inserts, as Checklist.copy does.
  for (const checklist of command.checklists) await insertDirect(Checklists, checklist);
  for (const item of command.items) await insertDirect(ChecklistItems, item);
  // Subtasks, each with its creation activity, then their checklists.
  for (const subtask of command.subtasks) {
    await insertCard(subtask.card);
    await deliver(subtask);
  }
  for (const checklist of command.subtaskChecklists) await insertDirect(Checklists, checklist);
  for (const item of command.subtaskItems) await insertDirect(ChecklistItems, item);
  // Comments: direct, keeping author and dates, as CardComment.copy does.
  for (const comment of command.comments) await insertDirect(CardComments, comment, { getAutoValues: false });
  await guard();
  return invocation.id;
}
const { commandId: ruleCopyCardCommandId, prepareRuleCopyCardCommand, recordCopiedAttachments,
  validateRuleCopyCardCommand } = require('/server/lib/syncRuleCopyCardCommand');
const { buildCopiedSubtaskFields } = require('/models/lib/subtaskCopy');
const { filterCopiedLabelIds } = require('/server/lib/cardCopyHelpers');
const { scrumPlanningPair } = require('/server/lib/scrumPlanningPair');
const { buildCopiedComment } = require('/models/lib/copiedComment');
const { copiedCardScrum } = require('/models/lib/scrumCopy');
const { childrenSelector } = require('/models/lib/cardParents');
const { liveAttachments } = require('/models/lib/attachmentSoftDelete');
const { normalizeDependencies } = require('/models/metadata/dependencies');
const text = value => typeof value === 'string' && value.length > 0;

// Durable rule linkCard onto the card's own board
// (server/lib/syncRuleLinkCardCommand.js): the linked card built once from the
// card as Card.link builds it, inserted once under its derived id with the
// creation hook's activity deferred, then that activity delivered durably.
export const SyncRuleLinkCardCommands = new Mongo.Collection('listSyncRuleLinkCardCommands');
SyncRuleLinkCardCommands.deny({ insert: () => true, update: () => true, remove: () => true });

export async function runStoredSyncRuleLinkCard({ index, completeDelivery = runStoredSyncActivityDelivery, ...options }) {
  const context = executionContext(options), plan = await capture(context);
  const invocation = plan.actions[index], action = invocation?.action;
  if (action?.actionType !== 'linkCard') throw new Error('sync-rule-link-card-invalid');
  const commandContext = { plan, activity: context.saved, effectId: context.effectId, index };
  const guard = reuseWithinEvaluation(async () => {
    await context.guard();
    const [rule, current] = await Promise.all([
      Rules.rawCollection().findOne({ _id: invocation.rule._id }),
      Actions.rawCollection().findOne({ _id: action._id }),
    ]);
    if (!rule || !current || canonical(rule) !== canonical(invocation.rule) ||
        canonical(current) !== canonical(action)) throw new Error('sync-rule-link-card-configuration-changed');
    await assertDestinationBoard(targetBoardId, plan, options.trigger);
    await context.guard();
  });
  const targetBoardId = action.boardId || plan.boardId;
  const commands = SyncRuleLinkCardCommands.rawCollection(), id = ruleLinkCardCommandId(invocation.id);
  await guard();
  let row = await commands.findOne({ _id: id });
  if (!row) {
    const source = await ruleCardNow(plan, context, { raw: true });
    // A legacy action without a boardId links on the card's own board.
    const target = await RulesHelper.linkCardTarget({ ...action, boardId: targetBoardId });
    const [list, swimlane] = await Promise.all([
      target.listId ? Lists.findOneAsync({ _id: target.listId, boardId: targetBoardId }) : null,
      target.swimlaneId ? Swimlanes.findOneAsync({ _id: target.swimlaneId, boardId: targetBoardId }) : null,
    ]);
    const candidate = prepareRuleLinkCardCommand({ ...commandContext, source, target, list, swimlane, createdAt: new Date(),
      cardBoardId: source?.boardId });
    await guard();
    let failure;
    try { await commands.insertOne(candidate); } catch (error) { failure = error; }
    row = await commands.findOne({ _id: id });
    if (!row) throw failure || new Error('sync-rule-link-card-command-unconfirmed');
  }
  const command = validateRuleLinkCardCommand(row, commandContext);
  await guard();
  if (!await Cards.rawCollection().findOne({ _id: command.card._id })) {
    await DDP._CurrentMethodInvocation.withValue({ userId: command.actorId, isSimulation: false }, () =>
      withSyncRecordingDeferred({ cardId: command.card._id, boardId: command.card.boardId, listId: command.card.listId,
        kinds: ['create'] },
      () => Cards.insertAsync(command.card)));
    if (!await Cards.rawCollection().findOne({ _id: command.card._id })) throw new Error('sync-rule-link-card-unconfirmed');
  }
  const activities = {
    findOneAsync: activityId => Activities.findOneAsync(activityId, { transform: null }),
    insertAsync: document => DDP._CurrentMethodInvocation.withValue({ userId: command.actorId, isSimulation: false },
      () => withSyncActivityDeferred(document, () => Activities.insertAsync(document))),
  };
  await persistSyncActivity({ activities, activity: command.activity, effectId: command.receiptId, assertCurrent: guard,
    completeDelivery: delivery => completeDelivery({ ...delivery, policy: options.policy, trigger: options.trigger }) });
  await guard();
  return invocation.id;
}
const { commandId: ruleLinkCardCommandId, prepareRuleLinkCardCommand, validateRuleLinkCardCommand } =
  require('/server/lib/syncRuleLinkCardCommand');

// Durable rule addSwimlane (server/lib/syncRuleAddSwimlaneCommand.js): the
// title resolved once with the ordinary action's own substitution, the
// swimlane inserted once under its derived id with the hook's activity
// deferred, then that activity inserted once by its derived id - delivered as
// every board-level activity is, since it has no card.
export const SyncRuleAddSwimlaneCommands = new Mongo.Collection('listSyncRuleAddSwimlaneCommands');
SyncRuleAddSwimlaneCommands.deny({ insert: () => true, update: () => true, remove: () => true });

export async function runStoredSyncRuleAddSwimlane({ index, completeDelivery = runStoredSyncActivityDelivery, ...options }) {
  const context = executionContext(options), plan = await capture(context);
  const invocation = plan.actions[index], action = invocation?.action;
  if (action?.actionType !== 'addSwimlane') throw new Error('sync-rule-add-swimlane-invalid');
  const commandContext = { plan, activity: context.saved, effectId: context.effectId, index };
  const guard = reuseWithinEvaluation(async () => {
    await context.guard();
    const [rule, current] = await Promise.all([
      Rules.rawCollection().findOne({ _id: invocation.rule._id }),
      Actions.rawCollection().findOne({ _id: action._id }),
    ]);
    if (!rule || !current || canonical(rule) !== canonical(invocation.rule) ||
        canonical(current) !== canonical(action)) throw new Error('sync-rule-add-swimlane-configuration-changed');
    await context.guard();
  });
  const commands = SyncRuleAddSwimlaneCommands.rawCollection(), id = ruleAddSwimlaneCommandId(invocation.id);
  await guard();
  let row = await commands.findOne({ _id: id });
  if (!row) {
    // The card for the title's variables, wherever this plan left it.
    const card = await ruleCardNow(plan, context) ? await Cards.findOneAsync(plan.cardId) : null;
    const title = await RulesHelper.ruleSwimlaneTitle(context.saved, card, action);
    const candidate = prepareRuleAddSwimlaneCommand({ ...commandContext, title, createdAt: new Date() });
    await guard();
    let failure;
    try { await commands.insertOne(candidate); } catch (error) { failure = error; }
    row = await commands.findOne({ _id: id });
    if (!row) throw failure || new Error('sync-rule-add-swimlane-command-unconfirmed');
  }
  const command = validateRuleAddSwimlaneCommand(row, commandContext);
  const actor = work => DDP._CurrentMethodInvocation.withValue({ userId: command.actorId, isSimulation: false }, work);
  await guard();
  if (!await Swimlanes.rawCollection().findOne({ _id: command.swimlane._id })) {
    await actor(() => withSyncSwimlaneActivityDeferred(command.swimlane._id, () => Swimlanes.insertAsync(command.swimlane)));
    if (!await Swimlanes.rawCollection().findOne({ _id: command.swimlane._id })) {
      throw new Error('sync-rule-add-swimlane-unconfirmed');
    }
  }
  // The createSwimlane activity, delivered durably: a board-level activity
  // (2026-10-03) - no card, no list, no rule trigger - whose notifications and
  // webhooks are replayed after a crash like any other's.
  await persistSyncActivity({ activities: durableActivities(actor), activity: command.activity,
    effectId: command.activity._id.slice('sync-rule-add-swimlane-'.length), assertCurrent: guard,
    completeDelivery: delivery => completeDelivery({ ...delivery, policy: options.policy, trigger: options.trigger }) });
  await guard();
  return invocation.id;
}
// Activity insertion for persistSyncActivity: the ordinary insert hooks'
// delivery deferred, since the durable delivery is the one that runs.
function durableActivities(actor) {
  return {
    findOneAsync: activityId => Activities.findOneAsync(activityId, { transform: null }),
    insertAsync: document => actor(() => withSyncActivityDeferred(document, () => Activities.insertAsync(document))),
  };
}
const { commandId: ruleAddSwimlaneCommandId, prepareRuleAddSwimlaneCommand, validateRuleAddSwimlaneCommand } =
  require('/server/lib/syncRuleAddSwimlaneCommand');
const { withSyncSwimlaneActivityDeferred } = require('/server/lib/syncRecordingScope');

// Durable rule createCard (server/lib/syncRuleCreateCardCommand.js): the
// target and title resolved once with the ordinary action's own lookup, the
// card inserted once under its derived id with the creation hook's activity
// deferred, then that activity delivered durably - which runs the new card's
// own rules. Every step is idempotent on replay.
export const SyncRuleCreateCardCommands = new Mongo.Collection('listSyncRuleCreateCardCommands');
SyncRuleCreateCardCommands.deny({ insert: () => true, update: () => true, remove: () => true });

export async function runStoredSyncRuleCreateCard({ index, completeDelivery = runStoredSyncActivityDelivery, ...options }) {
  const context = executionContext(options), plan = await capture(context);
  const invocation = plan.actions[index], action = invocation?.action;
  if (action?.actionType !== 'createCard') throw new Error('sync-rule-create-card-invalid');
  const commandContext = { plan, activity: context.saved, effectId: context.effectId, index };
  const guard = reuseWithinEvaluation(async () => {
    await context.guard();
    const [rule, current] = await Promise.all([
      Rules.rawCollection().findOne({ _id: invocation.rule._id }),
      Actions.rawCollection().findOne({ _id: action._id }),
    ]);
    if (!rule || !current || canonical(rule) !== canonical(invocation.rule) ||
        canonical(current) !== canonical(action)) throw new Error('sync-rule-create-card-configuration-changed');
    await context.guard();
  });
  const commands = SyncRuleCreateCardCommands.rawCollection(), id = ruleCreateCardCommandId(invocation.id);
  await guard();
  let row = await commands.findOne({ _id: id });
  if (!row) {
    // The card for the title's variables, wherever this plan left it.
    const card = await ruleCardNow(plan, context) ? await Cards.findOneAsync(plan.cardId) : null;
    const target = await RulesHelper.createCardTarget(context.saved, card, action);
    const [list, swimlane] = await Promise.all([
      target.listId ? Lists.findOneAsync({ _id: target.listId, boardId: plan.boardId }) : null,
      target.swimlaneId ? Swimlanes.findOneAsync({ _id: target.swimlaneId, boardId: plan.boardId }) : null,
    ]);
    const candidate = prepareRuleCreateCardCommand({ ...commandContext, target, list, swimlane, createdAt: new Date() });
    await guard();
    let failure;
    try { await commands.insertOne(candidate); } catch (error) { failure = error; }
    row = await commands.findOne({ _id: id });
    if (!row) throw failure || new Error('sync-rule-create-card-command-unconfirmed');
  }
  const command = validateRuleCreateCardCommand(row, commandContext);
  const cardsCollection = Cards.rawCollection();
  await guard();
  if (!await cardsCollection.findOne({ _id: command.card._id })) {
    // The ordinary insert, with its derived id; the creation hook's activity is
    // the saved one, written below.
    await DDP._CurrentMethodInvocation.withValue({ userId: command.actorId, isSimulation: false }, () =>
      withSyncRecordingDeferred({ cardId: command.card._id, boardId: command.boardId, listId: command.card.listId,
        kinds: ['create'] },
      () => Cards.insertAsync({ ...command.card, sort: 0 })));
    if (!await cardsCollection.findOne({ _id: command.card._id })) throw new Error('sync-rule-create-card-unconfirmed');
  }
  const activities = {
    findOneAsync: activityId => Activities.findOneAsync(activityId, { transform: null }),
    insertAsync: document => DDP._CurrentMethodInvocation.withValue({ userId: command.actorId, isSimulation: false },
      () => withSyncActivityDeferred(document, () => Activities.insertAsync(document))),
  };
  await persistSyncActivity({ activities, activity: command.activity, effectId: command.receiptId, assertCurrent: guard,
    completeDelivery: delivery => completeDelivery({ ...delivery, policy: options.policy, trigger: options.trigger }) });
  await guard();
  return invocation.id;
}
const { commandId: ruleCreateCardCommandId, prepareRuleCreateCardCommand, validateRuleCreateCardCommand } =
  require('/server/lib/syncRuleCreateCardCommand');

// Durable rule sortList (server/lib/syncRuleSortListCommand.js): the order
// decided once with the ordinary action's own lookups, then each card's sort
// written conditionally with the hook's position row deferred, and that row
// written from the plan. Every step is idempotent on replay.
export const SyncRuleSortListCommands = new Mongo.Collection('listSyncRuleSortListCommands');
SyncRuleSortListCommands.deny({ insert: () => true, update: () => true, remove: () => true });

export async function runStoredSyncRuleSortList({ index, ...options }) {
  const context = executionContext(options), plan = await capture(context);
  const invocation = plan.actions[index], action = invocation?.action;
  if (action?.actionType !== 'sortList') throw new Error('sync-rule-sort-list-invalid');
  const commandContext = { plan, activity: context.saved, effectId: context.effectId, index };
  const guard = reuseWithinEvaluation(async () => {
    await context.guard();
    const [rule, current] = await Promise.all([
      Rules.rawCollection().findOne({ _id: invocation.rule._id }),
      Actions.rawCollection().findOne({ _id: action._id }),
    ]);
    if (!rule || !current || canonical(rule) !== canonical(invocation.rule) ||
        canonical(current) !== canonical(action)) throw new Error('sync-rule-sort-list-configuration-changed');
    await context.guard();
  });
  const commands = SyncRuleSortListCommands.rawCollection(), id = ruleSortListCommandId(invocation.id);
  await guard();
  let row = await commands.findOne({ _id: id });
  if (!row) {
    // The ordinary action's own lookups (server/rulesHelper.js performAction),
    // on the board the card is on now (ruleCardNow, RulesHelper.ruleBoards).
    const now = await ruleCardNow(plan, context);
    const onBoard = now ? now.boardId : plan.boardId;
    if (onBoard !== plan.boardId) await assertDestinationBoard(onBoard, plan, options.trigger);
    const card = now ? await Cards.findOneAsync({ _id: plan.cardId, boardId: onBoard }) : null;
    let list = card ? await card.list() : null;
    if (card && action.listName && action.listName !== '*') {
      list = await ReactiveCache.getList({ title: action.listName, boardId: onBoard });
    }
    const cards = list ? (await list.cardsUnfiltered(card.swimlaneId)).map(c => ({ _id: c._id, boardId: c.boardId,
      listId: c.listId, swimlaneId: c.swimlaneId, sort: c.sort, title: c.title, createdAt: c.createdAt,
      modifiedAt: c.modifiedAt, dueAt: c.dueAt, lastMoveReason: c.lastMoveReason })) : [];
    const redoRows = await ChangeHistory.find({ boardId: onBoard, userId: plan.actorId, undone: true,
      superseded: { $ne: true } }, { transform: null, limit: 10000 }).fetchAsync();
    // No list: the ordinary action does nothing, and so does this command.
    const candidate = prepareRuleSortListCommand({ ...commandContext, listId: list ? list._id : (card?.listId || plan.cardId),
      swimlaneId: card?.swimlaneId, cards: list ? cards : [], sortField: action.sortField, createdAt: new Date(), redoRows,
      cardBoardId: onBoard });
    await guard();
    let failure;
    try { await commands.insertOne(candidate); } catch (error) { failure = error; }
    row = await commands.findOne({ _id: id });
    if (!row) throw failure || new Error('sync-rule-sort-list-command-unconfirmed');
  }
  const command = validateRuleSortListCommand(row, commandContext);
  const cardsCollection = Cards.rawCollection();
  for (const unit of command.units) {
    await guard();
    if (!await cardsCollection.findOne(ruleSortListSelector(command, unit, unit.after))) {
      if (!await cardsCollection.findOne(ruleSortListSelector(command, unit, unit.before))) {
        throw new Error('sync-rule-sort-list-changed');
      }
      await DDP._CurrentMethodInvocation.withValue({ userId: command.actorId, isSimulation: false }, () =>
        withSyncRecordingDeferred({ cardId: unit.cardId, boardId: ruleSortListBoardOf(command), listId: unit.listId,
          kinds: ['history', 'position'] },
        () => Cards.updateAsync(ruleSortListSelector(command, unit, unit.before), { $set: { sort: unit.after } })));
      if (!await cardsCollection.findOne(ruleSortListSelector(command, unit, unit.after))) {
        throw new Error('sync-rule-sort-list-unconfirmed');
      }
    }
    if (unit.history.rows.length) {
      await persistSyncFieldHistory({ history: ChangeHistory, plan: unit.history, assertCurrent: guard,
        fields: RULE_CARD_POSITION_FIELDS });
    }
  }
  await guard();
  return invocation.id;
}
const { commandId: ruleSortListCommandId, prepareRuleSortListCommand, validateRuleSortListCommand,
  unitSelector: ruleSortListSelector, boardOf: ruleSortListBoardOf } = require('/server/lib/syncRuleSortListCommand');

// Durable rule checklist creation and removal
// (server/lib/syncRuleChecklistLifecycleCommand.js): captured with the
// ordinary action's own title and selector, then the insert or each removal
// with the checklist's two hooks deferred, and the activity and History those
// hooks would have written - each activity delivered durably, rules included.
// Every step is idempotent on replay.
export const SyncRuleChecklistLifecycleCommands = new Mongo.Collection('listSyncRuleChecklistLifecycleCommands');
SyncRuleChecklistLifecycleCommands.deny({ insert: () => true, update: () => true, remove: () => true });

export async function runStoredSyncRuleChecklistLifecycle({ index, completeDelivery = runStoredSyncActivityDelivery,
  ...options }) {
  const context = executionContext(options), plan = await capture(context);
  const invocation = plan.actions[index], action = invocation?.action;
  if (!RULE_CHECKLIST_LIFECYCLE_ACTIONS.includes(action?.actionType)) throw new Error('sync-rule-checklist-lifecycle-invalid');
  const commandContext = { plan, activity: context.saved, effectId: context.effectId, index };
  const guard = reuseWithinEvaluation(async () => {
    await context.guard();
    const [rule, current] = await Promise.all([
      Rules.rawCollection().findOne({ _id: invocation.rule._id }),
      Actions.rawCollection().findOne({ _id: action._id }),
    ]);
    if (!rule || !current || canonical(rule) !== canonical(invocation.rule) ||
        canonical(current) !== canonical(action)) throw new Error('sync-rule-checklist-lifecycle-configuration-changed');
    await context.guard();
  });
  const commands = SyncRuleChecklistLifecycleCommands.rawCollection(), id = ruleChecklistLifecycleCommandId(invocation.id);
  await guard();
  let row = await commands.findOne({ _id: id });
  if (!row) {
    // The card where this plan left it - on another board after a cross-board
    // move of the same plan (2026-10-03) - and its History there.
    const card = await ruleCardNow(plan, context);
    const redoRows = await ChangeHistory.find({ boardId: card?.boardId || plan.boardId, userId: plan.actorId, undone: true,
      superseded: { $ne: true } }, { transform: null, limit: 10000 }).fetchAsync();
    // The ordinary action's own title and selector (server/rulesHelper.js performAction).
    const adds = ['addChecklist', 'addChecklistWithItems'].includes(action.actionType);
    const modelCard = adds && card ? await Cards.findOneAsync(plan.cardId) : null;
    const title = modelCard ? await RulesHelper.ruleChecklistTitle(context.saved, modelCard, action) : undefined;
    const itemTitles = modelCard && action.actionType === 'addChecklistWithItems'
      ? await RulesHelper.ruleChecklistItemTitles(context.saved, modelCard, action) : [];
    const checklists = action.actionType === 'removeChecklist' && card
      ? await Checklists.rawCollection().find({ title: action.checklistName, cardId: card._id, sort: 0 },
        { sort: { _id: 1 }, limit: 1001 }).toArray() : [];
    const candidate = prepareRuleChecklistLifecycleCommand({ ...commandContext, card, title, itemTitles, checklists,
      createdAt: new Date(), redoRows, cardBoardId: card?.boardId });
    await guard();
    let failure;
    try { await commands.insertOne(candidate); } catch (error) { failure = error; }
    row = await commands.findOne({ _id: id });
    if (!row) throw failure || new Error('sync-rule-checklist-lifecycle-command-unconfirmed');
  }
  let command = validateRuleChecklistLifecycleCommand(row, commandContext);
  const activities = {
    findOneAsync: activityId => Activities.findOneAsync(activityId, { transform: null }),
    insertAsync: document => DDP._CurrentMethodInvocation.withValue({ userId: command.actorId, isSimulation: false },
      () => withSyncActivityDeferred(document, () => Activities.insertAsync(document))),
  };
  const deliver = async ({ receiptId, activity }) => persistSyncActivity({ activities, activity, effectId: receiptId,
    assertCurrent: guard, completeDelivery: delivery => completeDelivery({ ...delivery, policy: options.policy,
      trigger: options.trigger }) });
  const record = history => persistSyncFieldHistory({ history: ChangeHistory, plan: history, assertCurrent: guard,
    fields: RULE_CHECKLIST_LIFECYCLE });
  const deferred = (checklistId, work, kinds = ['checklistActivity', 'checklistHistory']) =>
    DDP._CurrentMethodInvocation.withValue({ userId: command.actorId, isSimulation: false },
      () => withSyncRecordingDeferred({ cardId: command.cardId, boardId: command.cardBoardId,
        listId: command.listId, checklistId, kinds }, work));
  const lists = Checklists.rawCollection();
  if (command.actionType !== 'removeChecklist') {
    await guard();
    if (!await lists.findOne({ _id: command.checklistId })) {
      // The ordinary insert, with its derived id: schema defaults, timestamps
      // and the board id hook as for any checklist.
      await deferred(command.checklistId, () => Checklists.insertAsync({ _id: command.checklistId, title: command.title,
        cardId: command.cardId, sort: 0 }));
    }
    // addChecklistWithItems: each item as the ordinary loop inserts it.
    const itemsCollection = ChecklistItems.rawCollection();
    for (const item of command.items || []) {
      await guard();
      if (!await itemsCollection.findOne({ _id: item.itemId })) {
        await deferred(command.checklistId, () => ChecklistItems.insertAsync({ _id: item.itemId, title: item.title,
          checklistId: command.checklistId, cardId: command.cardId, sort: item.sort }),
        ['checklistItemActivity', 'checklistItemHistory']);
      }
    }
    if (command.recorded === null) {
      const stored = await lists.findOne({ _id: command.checklistId });
      const storedItems = await Promise.all((command.items || []).map(item => itemsCollection.findOne({ _id: item.itemId })));
      if (!stored || storedItems.some(item => !item)) throw new Error('sync-rule-checklist-lifecycle-unconfirmed');
      await guard();
      // First writer wins: a replay racing this one records the same thing.
      await commands.updateOne({ _id: command._id, recorded: null },
        { $set: { recorded: recordAddedChecklist(command, stored, storedItems) } });
      command = validateRuleChecklistLifecycleCommand(await commands.findOne({ _id: id }), commandContext);
    }
    // The checklist's activity and row, then each item's, as the hooks write them.
    for (const unit of command.recorded.units) {
      if (unit.history.rows.length) await record(unit.history);
      await deliver(unit);
    }
  } else {
    for (const unit of command.units) {
      // The before-remove activity, the removal, then the after-remove History.
      await deliver(unit);
      await guard();
      const current = await lists.findOne({ _id: unit.checklistId });
      if (current) {
        const keys = [...new Set([...Object.keys(unit.stored), ...Object.keys(current)])];
        if (canonical(EJSON.parse(EJSON.stringify(current), { relaxed: true })) !== canonical(unit.stored)) {
          throw new Error('sync-rule-checklist-lifecycle-changed');
        }
        await deferred(unit.checklistId, () => Checklists.removeAsync(exactFieldSelector(current, keys)));
        if (await lists.findOne({ _id: unit.checklistId })) throw new Error('sync-rule-checklist-lifecycle-unconfirmed');
      }
      if (unit.history.rows.length) await record(unit.history);
    }
  }
  await guard();
  return invocation.id;
}
const { RULE_CHECKLIST_LIFECYCLE_ACTIONS, commandId: ruleChecklistLifecycleCommandId,
  prepareRuleChecklistLifecycleCommand, recordAddedChecklist, validateRuleChecklistLifecycleCommand } =
  require('/server/lib/syncRuleChecklistLifecycleCommand');
const { RULE_CHECKLIST_LIFECYCLE } = require('/server/lib/syncHistoryBatch');

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
    // The card where this plan left it (2026-10-03: possibly another board).
    const card = await ruleCardNow(plan, context);
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
    const redoRows = await ChangeHistory.find({ boardId: card?.boardId || plan.boardId, userId: plan.actorId, undone: true,
      superseded: { $ne: true } }, { transform: null, limit: 10000 }).fetchAsync();
    const candidate = prepareRuleChecklistCommand({ ...commandContext, card, checklist, items, targetIds,
      createdAt: new Date(), redoRows, cardBoardId: card?.boardId });
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
        withSyncRecordingDeferred({ cardId: command.cardId, boardId: command.cardBoardId, listId, itemId: unit.itemId,
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
