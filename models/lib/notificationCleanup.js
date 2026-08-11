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

// #6533: THE ARRAY ALSO HAS TO BE BOUNDED, and the rule above cannot do it.
// Only notifications that have been READ are ever removed, so a user who does
// not clear their tray accumulates entries with no upper limit - and they live
// in an array INSIDE the user document, `profile.notifications`.
//
// That is what shows up as a database problem rather than a tray problem. Every
// new notification is an `$addToSet` on that array, which means reading the whole
// user document, scanning the array for a duplicate, and writing the whole
// document back. FerretDB on SQLite has ONE writer, so those rewrites queue
// behind each other and start failing:
//
//   [db-retry] the database was busy: ... 3 given up on
//   ValidationError: ... [collection.go:191 sqlite.(*collection).UpdateAll]
//     database is locked (5) (SQLITE_BUSY)
//     at _helpersConstructor.addNotification (models/users.js)
//
// with FerretDB at 737% CPU. The work is proportional to the array, so it gets
// worse exactly as the array gets longer, and login - which writes to the user
// document - queues behind it.
//
// So the newest KEEP entries are kept and the rest dropped. Newest, not oldest:
// the tray shows recent activity, and an unread notification from last year is
// not something anyone is going to act on. Order is positional - `$addToSet`
// appends - so the tail is the newest.
//
// Returns the entries to KEEP, or null when nothing needs dropping (so the
// caller can skip the write entirely rather than rewrite the array with itself).
function cappedNotifications(notifications, maxPerUser) {
  if (!Array.isArray(notifications)) return null;
  const cap = Number.isInteger(maxPerUser) && maxPerUser > 0 ? maxPerUser : 0;
  if (cap === 0 || notifications.length <= cap) return null;
  return notifications.slice(notifications.length - cap);
}

// How many the tray keeps per user. Generous - this is a backstop against
// unbounded growth, not a retention policy - and overridable for an instance
// whose users really do want a longer history.
function notificationCapFromEnv(env) {
  const raw = (env || {}).NOTIFICATION_TRAY_MAX_PER_USER;
  const parsed = parseInt(raw, 10);
  if (Number.isInteger(parsed) && parsed > 0) return parsed;
  return 1000;
}

module.exports = {
  expiredNotificationActivityIds,
  cappedNotifications,
  notificationCapFromEnv,
};
