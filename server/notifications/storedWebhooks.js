import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import Activities from '/models/activities';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Integrations from '/models/integrations';
import CardComments, { canEditComment } from '/models/cardComments';
import { sendStoredWebhook } from '/server/notifications/storedWebhookHttp';
import { getFeatureFlags } from '/models/lib/featureFlags';
const { validateSyncTrigger, assertSyncActivation } = require('/server/lib/syncActivation');
import { ensureIndex } from '/server/lib/mongoStartup';
import { prepareActivityWebhookPlan } from '/server/notifications/prepareWebhooks';
const { EJSON } = require('bson');
const { canonical } = require('/models/lib/changeHistoryIntegrity');
const { notificationActivityIdentity } = require('/server/lib/syncNotificationPlan');
const { ensureWebhookPlan, deliverWebhookPlan } = require('/server/lib/syncWebhookPlan');
const { validateSyncEffectPolicy, assertSyncEffectPolicy, syncEffectPolicy } = require('/server/lib/syncEffectPolicy');

// Private evidence, including endpoint credentials and reply bodies. Never
// publish, TTL or expose it through a client method. _id indexes cover replay.
export const SyncWebhookPlans = new Mongo.Collection('listSyncWebhookPlans');
export const SyncWebhookReceipts = new Mongo.Collection('listSyncWebhookReceipts');
export const SyncWebhookResponses = new Mongo.Collection('listSyncWebhookResponses');
export const SyncWebhookCommentPlans = new Mongo.Collection('listSyncWebhookCommentPlans');
export const SyncWebhookCommentReceipts = new Mongo.Collection('listSyncWebhookCommentReceipts');
// Plan completion receipts: every target delivered. Kept for good; they let a
// plan be compacted and a late replay skip it (syncWebhookRetention.js).
export const SyncWebhookCompletions = new Mongo.Collection('listSyncWebhookCompletions');
for (const collection of [SyncWebhookPlans, SyncWebhookReceipts, SyncWebhookResponses,
  SyncWebhookCommentPlans, SyncWebhookCommentReceipts, SyncWebhookCompletions]) {
  collection.deny({ insert: () => true, update: () => true, remove: () => true });
}
Meteor.startup(async () => {
  await ensureIndex(SyncWebhookPlans, { 'plan.boardId': 1, 'plan.cardId': 1 });
  await ensureIndex(SyncWebhookReceipts, { planId: 1 });
  await ensureIndex(SyncWebhookCommentPlans, { 'plan.change.before._id': 1 });
  await ensureIndex(SyncWebhookCompletions, { completedAt: 1, _id: 1 });
  // Retention (maintainer decision of 2026-09-30): compact delivered plans,
  // with their URLs and tokens, after SYNC_RECEIPT_METADATA_DAYS (90).
  const { days, intervalMs } = syncReceiptPolicy();
  const retention = createSyncWebhookRetention({ plans: SyncWebhookPlans.rawCollection(),
    receipts: SyncWebhookCompletions.rawCollection(), responses: SyncWebhookResponses.rawCollection(),
    commentPlans: SyncWebhookCommentPlans.rawCollection(), days });
  Meteor.setInterval(() => {
    retention.sweep().catch(() => console.error('Sync webhook retention pass failed; it is retried on the next pass'));
  }, intervalMs);
});
const { recordWebhookCompletion, createSyncWebhookRetention } = require('/server/lib/syncWebhookRetention');
const { syncReceiptPolicy } = require('/server/lib/syncRuleEmailRetention');

const { canWriteWebhookCard, canWriteWebhookBoard, isCurrentWebhookTarget } = require('/server/lib/syncWebhookAccess');
const { memberCan } = require('/models/lib/boardRoleCapabilities');
const { prepareWebhookCommentPlan, ensureWebhookCommentPlan, applyWebhookCommentPlan } = require('/server/lib/syncWebhookComment');

// The journal supplies its lease, intent and source-configuration guard.
function storedWebhookContext({ activity, policy, assertCurrent, trigger }) {
  const saved = EJSON.parse(EJSON.stringify(activity), { relaxed: true });
  notificationActivityIdentity(saved);
  policy = validateSyncEffectPolicy(policy);
  if (!policy.activities || !policy.notifications || typeof assertCurrent !== 'function' ||
      (saved.listId !== undefined && (typeof saved.listId !== 'string' || !saved.listId))) {
    throw new Error('sync-webhook-stage-invalid');
  }
  validateSyncTrigger(trigger);
  async function guard() {
    await assertCurrent();
    await assertSyncEffectPolicy(policy, async () => syncEffectPolicy(getFeatureFlags()));
    const [stored, board, card, list, user] = await Promise.all([
      Activities.findOneAsync(saved._id, { transform: null }),
      Boards.findOneAsync(saved.boardId),
      // The card in the activity's list, or where its own rules moved it; a
      // board-level activity names no card or list.
      saved.cardId ? require('./storedRulePlans').activityCardNow(saved) : null,
      saved.listId ? Lists.findOneAsync({ _id: saved.listId, boardId: saved.boardId }, { fields: { _id: 1 } }) : null,
      Meteor.users.findOneAsync(saved.userId),
    ]);
    if (!stored || canonical(stored) !== canonical(saved)) throw new Error('sync-webhook-activity-changed');
    if (!board || (saved.cardId && !card) || (saved.listId && !list)) throw new Error('sync-webhook-context-unavailable');
    assertSyncActivation({ board, trigger, flags: getFeatureFlags() });
    if (!(card ? canWriteWebhookCard({ user, board, card }) : canWriteWebhookBoard({ user, board }))) {
      throw new Error('sync-webhook-actor-denied');
    }
    await assertCurrent();
    return { user, board, card };
  }
  return { saved, guard };
}

export async function captureStoredSyncWebhookPlan(input) {
  const { saved, guard } = storedWebhookContext(input);
  return ensureWebhookPlan({ plans: SyncWebhookPlans.rawCollection(), activity: saved, assertCurrent: guard,
    build: activity => prepareActivityWebhookPlan({ activity, assertCurrent: guard }) });
}

// Delivery stage of durable Sync (server/lib/listSyncApplication.js). Every network
// attempt uses fetchSafe; receipts distinguish HTTP acceptance from reply effects.
export async function runStoredSyncWebhooks(input) {
  const { saved, guard } = storedWebhookContext(input);
  const plan = await ensureWebhookPlan({ plans: SyncWebhookPlans.rawCollection(), activity: saved, assertCurrent: guard,
    receipts: SyncWebhookCompletions.rawCollection(),
    build: activity => prepareActivityWebhookPlan({ activity, assertCurrent: guard }) });
  // Compacted: delivered more than the retention period ago; nothing to resend.
  if (plan.compacted) { await input.assertCurrent(); return plan.id; }
  async function assertTarget(target) {
    await guard();
    const integration = await Integrations.findOneAsync(target.integrationId, { transform: null });
    const allowed = isCurrentWebhookTarget({ target, integration, activity: saved });
    await guard();
    return allowed;
  }
  async function completeResponse({ activity, target, data, deliveryId, assertCurrent }) {
    const context = { activity, target, data };
    async function replyGuard(commentPlan) {
      await assertCurrent();
      const { user, board } = await guard();
      if (commentPlan?.change) {
        const before = commentPlan.change.before;
        const [card, comment] = await Promise.all([
          Cards.findOneAsync({ _id: before.cardId, boardId: before.boardId }),
          CardComments.rawCollection().findOne({ _id: before._id }),
        ]);
        if (!canWriteWebhookCard({ user, board, card }) || !memberCan(board.members, user._id, 'comment') ||
            (comment && (comment.boardId !== before.boardId || comment.cardId !== before.cardId)) ||
            !canEditComment({ isAuthor: (comment || before).userId === user._id,
              isBoardAdmin: board.hasAdmin(user._id), restrictCommentEditing: board.restrictCommentEditing })) {
          throw new Error('sync-webhook-comment-access-denied');
        }
      }
      await assertCurrent();
    }
    const commentPlan = await ensureWebhookCommentPlan({ plans: SyncWebhookCommentPlans.rawCollection(), context,
      assertCurrent: replyGuard, build: async context => {
        const reply = context.data;
        // Never pass response-supplied objects as Mongo selectors.
        const validIds = reply && ['boardId', 'cardId', 'commentId'].every(key => typeof reply[key] === 'string' && reply[key]);
        const comment = validIds && reply.boardId === saved.boardId && reply.boardId === target.integrationBoardId
          ? await CardComments.rawCollection().findOne({ _id: reply.commentId, boardId: reply.boardId, cardId: reply.cardId }) : null;
        const candidate = prepareWebhookCommentPlan({ context, comment, modifiedAt: new Date() });
        await replyGuard(candidate);
        return candidate;
      } });
    const receipt = await applyWebhookCommentPlan({ comments: CardComments.rawCollection(),
      receipts: SyncWebhookCommentReceipts.rawCollection(), plan: commentPlan, context, assertCurrent: replyGuard });
    if (receipt !== deliveryId) throw new Error('sync-webhook-comment-unconfirmed');
    return receipt;
  }
  const id = await deliverWebhookPlan({ plan, activity: saved, receipts: SyncWebhookReceipts.rawCollection(),
    assertCurrent: guard, assertTarget, deliver: item => sendStoredWebhook({ item,
      responses: SyncWebhookResponses.rawCollection(), assertCurrent: guard, assertTarget, completeResponse }) });
  const stored = await SyncWebhookPlans.rawCollection().findOne({ _id: id });
  await recordWebhookCompletion({ receipts: SyncWebhookCompletions.rawCollection(), id,
    activityHash: plan.activityHash, checksum: stored?.checksum });
  return id;
}
