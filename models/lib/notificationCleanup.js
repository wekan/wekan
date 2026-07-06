'use strict';

// Pure helper for the scheduled notification-tray cleanup. Extracted from
// server/models/users.js so the "which notifications are stale" decision is
// unit-testable without Meteor.
//
// #5685 ("Exception in removed observeChanges callback: Error: Removed
// nonexistent document" during notification_cleanup): the cleanup used to fire
// one un-awaited `removeNotification()` per expired notification. Each was a
// separate `Users.update` `$pull`, so a user with K stale notifications produced
// K writes to the Users collection — and every publication that republishes user
// documents (board members, notification relations, …) re-ran its observers K
// times in quick succession. Under the old cottz:publish-relations that churn is
// what surfaced the "Removed nonexistent document" crash. Collapsing a user's
// stale notifications into a SINGLE awaited `$pull … $in` removes that churn (and
// fixes the un-awaited async / swallowed-rejection defect).
//
// It also removes an activity's notifications only when EVERY entry for that
// activity is read AND past its removal age, so a freshly re-created unread
// notification that happens to share an activity id is not pulled by mistake.
// Entries with a missing/invalid `read` timestamp are treated as not-yet-removable.
//
// Returns a de-duplicated array of activity ids safe to `$pull` for this user.
function expiredNotificationActivityIds(notifications, removeAgeDays, now) {
  if (!Array.isArray(notifications)) return [];

  const nowMs = (now instanceof Date ? now : new Date(now)).getTime();
  if (Number.isNaN(nowMs)) return [];

  // activity id -> { total, removable }
  const perActivity = new Map();

  for (const notification of notifications) {
    if (!notification || !notification.activity) continue;
    const activity = notification.activity;
    const rec = perActivity.get(activity) || { total: 0, removable: 0 };
    rec.total += 1;

    if (notification.read) {
      const removeDate = new Date(notification.read);
      if (!Number.isNaN(removeDate.getTime())) {
        removeDate.setDate(removeDate.getDate() + removeAgeDays);
        if (removeDate.getTime() <= nowMs) {
          rec.removable += 1;
        }
      }
    }

    perActivity.set(activity, rec);
  }

  const ids = [];
  for (const [activity, rec] of perActivity) {
    if (rec.total > 0 && rec.removable === rec.total) {
      ids.push(activity);
    }
  }
  return ids;
}

module.exports = { expiredNotificationActivityIds };
