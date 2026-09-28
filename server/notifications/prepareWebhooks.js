import { prepareActivityNotification, activityWebhookIntegrations } from '/server/models/activities';
import { prepareOutgoingWebhook } from '/server/notifications/outgoing';
const { EJSON } = require('bson');
const { notificationActivityIdentity } = require('/server/lib/syncNotificationPlan');
const { prepareWebhookPlan } = require('/server/lib/syncWebhookPlan');

// Build only. The durable caller persists this first-writer snapshot and must
// enforce fresh actor, card/list, feature-policy and integration access on replay.
export async function prepareActivityWebhookPlan({ activity, assertCurrent }) {
  if (typeof assertCurrent !== 'function') throw new Error('sync-webhook-guard-required');
  const saved = EJSON.parse(EJSON.stringify(activity), { relaxed: true });
  notificationActivityIdentity(saved);
  await assertCurrent();
  const context = await prepareActivityNotification(saved.userId, saved);
  await assertCurrent();
  if (context && (context.board?._id !== saved.boardId || context.card?._id !== saved.cardId ||
      context.card.boardId !== saved.boardId || (saved.listId && context.card.listId !== saved.listId))) {
    throw new Error('sync-webhook-context-unavailable');
  }
  // One extra record makes an oversized selection fail rather than silently
  // dropping targets. Ordinary dispatch keeps its existing selection semantics.
  const integrations = context ? await activityWebhookIntegrations(context.board, context.description,
    { limit: 10001, transform: null, sort: { _id: 1 } }) : [];
  await assertCurrent();
  const plan = await prepareWebhookPlan({ activity: saved, integrations,
    prepare: async integration => {
      await assertCurrent();
      const request = await prepareOutgoingWebhook({ integration, actorId: saved.userId,
        description: context.description, params: { ...context.params, watchers: context.watchers } });
      await assertCurrent();
      return request;
    } });
  await assertCurrent();
  return plan;
}
