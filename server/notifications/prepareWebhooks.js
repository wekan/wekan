import { prepareActivityNotification, activityWebhookIntegrations } from '/server/models/activities';
import { prepareOutgoingWebhook } from '/server/notifications/outgoing';
const { EJSON } = require('bson');
const { notificationActivityIdentity } = require('/server/lib/syncNotificationPlan');
const { prepareWebhookPlan } = require('/server/lib/syncWebhookPlan');
const { webhookDescriptionFor, webhookParamsFor } = require('/models/lib/editCardWebhook');

// Build only. The durable caller persists this first-writer snapshot and must
// enforce fresh actor, card/list, feature-policy and integration access on replay.
export async function prepareActivityWebhookPlan({ activity, assertCurrent }) {
  if (typeof assertCurrent !== 'function') throw new Error('sync-webhook-guard-required');
  const saved = EJSON.parse(EJSON.stringify(activity), { relaxed: true });
  notificationActivityIdentity(saved);
  await assertCurrent();
  const context = await prepareActivityNotification(saved.userId, saved);
  await assertCurrent();
  // The card is in the activity's list, or where the activity's own rules
  // moved it - they ran before this stage (storedRulePlans.js activityCardNow).
  const moved = async () => (context.card.boardId !== saved.boardId || context.card.listId !== saved.listId) &&
    !(await require('/server/notifications/storedRulePlans').activityCardNow(saved));
  if (context && (context.board?._id !== saved.boardId || context.card?._id !== saved.cardId ||
      (saved.listId ? await moved() : !!context.card && context.card.boardId !== saved.boardId))) {
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
      // #4912: the same per-webhook event choice as ordinary dispatch.
      const description = webhookDescriptionFor(integration, context.description);
      const params = webhookParamsFor({ ...context.params, watchers: context.watchers },
        context.description, description);
      const request = await prepareOutgoingWebhook({ integration, actorId: saved.userId, description, params });
      await assertCurrent();
      return request;
    } });
  await assertCurrent();
  return plan;
}
