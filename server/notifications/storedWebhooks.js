import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import Activities from '/models/activities';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import { getFeatureFlags } from '/models/lib/featureFlags';
import { ensureIndex } from '/server/lib/mongoStartup';
import { prepareActivityWebhookPlan } from '/server/notifications/prepareWebhooks';
const { EJSON } = require('bson');
const { canonical } = require('/models/lib/changeHistoryIntegrity');
const { notificationActivityIdentity } = require('/server/lib/syncNotificationPlan');
const { ensureWebhookPlan } = require('/server/lib/syncWebhookPlan');
const { validateSyncEffectPolicy, assertSyncEffectPolicy, syncEffectPolicy } = require('/server/lib/syncEffectPolicy');

// Private evidence, including endpoint credentials and reply bodies. Never
// publish, TTL or expose it through a client method. _id indexes cover replay.
export const SyncWebhookPlans = new Mongo.Collection('listSyncWebhookPlans');
export const SyncWebhookReceipts = new Mongo.Collection('listSyncWebhookReceipts');
export const SyncWebhookResponses = new Mongo.Collection('listSyncWebhookResponses');
export const SyncWebhookCommentPlans = new Mongo.Collection('listSyncWebhookCommentPlans');
export const SyncWebhookCommentReceipts = new Mongo.Collection('listSyncWebhookCommentReceipts');
for (const collection of [SyncWebhookPlans, SyncWebhookReceipts, SyncWebhookResponses,
  SyncWebhookCommentPlans, SyncWebhookCommentReceipts]) {
  collection.deny({ insert: () => true, update: () => true, remove: () => true });
}
Meteor.startup(async () => {
  await ensureIndex(SyncWebhookPlans, { 'plan.boardId': 1, 'plan.cardId': 1 });
  await ensureIndex(SyncWebhookReceipts, { planId: 1 });
  await ensureIndex(SyncWebhookCommentPlans, { 'plan.change.before._id': 1 });
});

// Capture only. The journal supplies its lease/intent/actor access guard.
// A later delivery stage must also recheck each integration and reply target;
// stored preparation by itself authorizes no HTTP request or comment update.
export async function captureStoredSyncWebhookPlan({ activity, policy, assertCurrent }) {
  const saved = EJSON.parse(EJSON.stringify(activity), { relaxed: true });
  notificationActivityIdentity(saved);
  policy = validateSyncEffectPolicy(policy);
  if (!policy.activities || !policy.notifications || typeof assertCurrent !== 'function' ||
      typeof saved.listId !== 'string' || !saved.listId) throw new Error('sync-webhook-stage-invalid');
  async function guard() {
    await assertCurrent();
    await assertSyncEffectPolicy(policy, async () => syncEffectPolicy(getFeatureFlags()));
    const [stored, board, card, list] = await Promise.all([
      Activities.findOneAsync(saved._id, { transform: null }),
      Boards.findOneAsync(saved.boardId, { fields: { _id: 1 } }),
      Cards.findOneAsync({ _id: saved.cardId, boardId: saved.boardId, listId: saved.listId }, { fields: { _id: 1 } }),
      Lists.findOneAsync({ _id: saved.listId, boardId: saved.boardId }, { fields: { _id: 1 } }),
    ]);
    if (!stored || canonical(stored) !== canonical(saved)) throw new Error('sync-webhook-activity-changed');
    if (!board || !card || !list) throw new Error('sync-webhook-context-unavailable');
    await assertCurrent();
  }
  return ensureWebhookPlan({ plans: SyncWebhookPlans.rawCollection(), activity: saved, assertCurrent: guard,
    build: activity => prepareActivityWebhookPlan({ activity, assertCurrent: guard }) });
}
