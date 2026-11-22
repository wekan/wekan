# Admin Panel / Settings / Activities and notifications

## What it is

Three server-wide switches for deployments that must limit activity tracking
([#5820](https://github.com/wekan/wekan/issues/5820)): stop recording who did
what, stop sending notifications about it, or turn off watching. Address:
`/admin/settings/activities`. Site administrators only. Each switch is saved as
soon as it is ticked and is off by default.

Until 2026-11-19 this pane was Admin Panel / Problems / Notifications;
`/admin/problems/notifications` redirects here. It is not Admin Panel / People /
Notifications, which is about email notifications.

## Read more

- [Activity stream](https://en.wikipedia.org/wiki/Activity_stream) on
  Wikipedia - the "who did what" feed that **Disable all activities** stops.
- [General Data Protection Regulation](https://en.wikipedia.org/wiki/General_Data_Protection_Regulation)
  on Wikipedia - one reason a deployment limits tracking.
- [Notification delivery](../../General/Notifications/Notification-Delivery.md)
  and [Admin Panel / People / Notifications](../People/Notifications.md) - how
  notifications are sent when they are on.

## How to use it

1. Open **Admin Panel / Settings / Activities and notifications**.
2. Tick the switch you need; it is saved at once:
   - **Disable all activities** - activity-feed entries are never recorded and
     never shown anywhere (the board sidebar and a card's activity tab). No
     history of who did what is kept.
   - **Disable all notifications** - WeKan never sends watch notifications
     (in-app, email or other services) for any activity. Activities can still
     be recorded, unless also disabled above; only the notifications are
     suppressed.
   - **Disable watch** - nobody can watch boards, lists or cards to receive
     notifications, and any attempt to change a watch level is refused.
3. Untick it to turn the feature back on. Activities that were not recorded
   while it was on do not come back.

## How the numbers are calculated

This pane has no numbers of its own. Its only defaults are that all three
switches are off (`false` in [models/settings.js](../../../../models/settings.js)
and [models/lib/featureFlags.js](../../../../models/lib/featureFlags.js)).

## How it works in WeKan

- **Fields** `disableActivities`, `disableNotifications` and `disableWatch` on
  the settings document. The pane is template `featuresNotifications` in
  [client/components/settings/adminProblems.jade](../../../../client/components/settings/adminProblems.jade);
  its ticks call `toggleSettingField()` in
  [adminProblems.js](../../../../client/components/settings/adminProblems.js),
  a client update that only a site administrator may make.
- **Cache**: [models/lib/featureFlags.js](../../../../models/lib/featureFlags.js)
  keeps the three values in memory on the server through a settings observer,
  because the activity insert hook runs synchronously and cannot wait for a
  database read. On the client they stay `false`; the server enforces them.
- **Disable all activities**: the `before.insert` hook in
  [models/activities.js](../../../../models/activities.js) cancels the insert;
  the `activities` publication in
  [server/publications/activities.js](../../../../server/publications/activities.js)
  and [server/activityFeed.js](../../../../server/activityFeed.js) return
  nothing, so existing entries are hidden too.
- **Disable all notifications**: `prepareActivityNotification()` in
  [server/models/activities.js](../../../../server/models/activities.js)
  returns nothing and no notification intent is captured;
  [server/notifications/activityPlans.js](../../../../server/notifications/activityPlans.js)
  refuses to plan one.
- **Disable watch**: the `watch` method in
  [server/notifications/watch.js](../../../../server/notifications/watch.js)
  throws `error-watch-disabled`.
- **Tests**: [tests/activityFeed.test.cjs](../../../../tests/activityFeed.test.cjs),
  [tests/syncEffects.test.cjs](../../../../tests/syncEffects.test.cjs) and
  [server/lib/tests/activityNotificationIntent.tests.js](../../../../server/lib/tests/activityNotificationIntent.tests.js).

## Related

- [Admin Panel / People / Notifications](../People/Notifications.md) - email
  notifications.
- [Security](Security.md)

## Commits

 - [The pane moves from Problems to Settings](https://github.com/wekan/wekan/commit/e1a053d059191640a63a22ab553c0b0c6b833d8d)
 - [The wording no longer names GDPR only](https://github.com/wekan/wekan/commit/592d8039249ae8fe9a3b4d636aaadc9ce48c2dc8)
 - [Switches to disable activities, notifications and watch (#5820)](https://github.com/wekan/wekan/commit/f1cc8daebf1d2c926f81f3a7e22beb7ffbbbe8ca)
