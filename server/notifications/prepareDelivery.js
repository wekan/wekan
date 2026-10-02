import { prepareActivityNotification } from '/server/models/activities';
import { prepareActivityEmail } from '/server/notifications/email';
import { prepareTrayNotification } from '/server/notifications/profile';
const { EJSON } = require('bson');
const { prepareNotificationPlan, notificationActivityIdentity } = require('/server/lib/syncNotificationPlan');

// Internal Sync preparation: share ordinary watcher/mention/mute selection and
// service preference/rendering logic after the card mutation is confirmed.
// Ordinary helpers read the resulting card. No activity, tray or outbox write occurs.
// The caller persists this plan and supplies fresh permission checks on replay.
export async function prepareActivityDeliveryPlan({ activity, assertCurrent }) {
  if (typeof assertCurrent !== 'function') throw new Error('sync-notification-guard-required');
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
    throw new Error('sync-notification-context-unavailable');
  }
  const users = new Map((context?.users || []).map(user => [user._id, user]));
  const plan = await prepareNotificationPlan({ activity: saved, recipientIds: [...users.keys()],
    getUser: async id => users.get(id),
    prepareEmail: user => prepareActivityEmail(user, context.title, context.description, context.params),
    prepareTray: user => prepareTrayNotification(user, context.params),
  });
  await assertCurrent();
  return plan;
}
