import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import Boards from '/models/boards';
import { allowIsBoardAdminOrSiteAdmin } from '/server/lib/utils';
import { normalizeBoardDueDays } from '/models/lib/dueNotificationConfig';

// #5323: Board Settings -> Notifications -> due-date reminders. `days` is the
// board's own offset list (null clears it and falls back to the server default
// NOTIFY_DUE_DAYS_BEFORE_AND_AFTER; [] turns reminders off for this board);
// `webhook` sends the reminders to this board's outgoing webhooks too.
Meteor.methods({
  async setBoardDueReminders(boardId, days, webhook) {
    check(boardId, String);
    check(days, Match.OneOf(null, [Match.Integer]));
    check(webhook, Boolean);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const board = await Boards.findOneAsync(boardId);
    if (!board || !(await allowIsBoardAdminOrSiteAdmin(this.userId, board))) {
      throw new Meteor.Error('not-authorized');
    }
    const normalized = days === null ? null : normalizeBoardDueDays(days);
    if (days !== null && !normalized) {
      throw new Meteor.Error('invalid-due-reminder-days', 'Use up to ten whole days from -14 to 14.');
    }
    const modifier = normalized
      ? { $set: { dueReminderDays: normalized, dueReminderWebhook: webhook } }
      : { $set: { dueReminderWebhook: webhook }, $unset: { dueReminderDays: '' } };
    await Boards.updateAsync(boardId, modifier);
    return { days: normalized, webhook };
  },
});
