# Admin Panel / People / Notifications

## What it is

The site-wide default for every notification WeKan can send: which notification
services - the in-app **Notification tray** and **Email** - are on or off by
default for everyone, and how each channel (e-mail, tray, webhooks) delivers by
default: what a notification shows, how several are grouped, and when they are
sent.

This is the top of a 3-tier precedence chain: **Admin Panel default** → **Board
override** → **Member override**. A board's Board Settings and a member's own
Member Settings can each override this default for their own scope, but a service
turned off here is off everywhere nothing more specific overrides it.

## Read more

- [Push technology](https://en.wikipedia.org/wiki/Push_technology) and
  [Notification area](https://en.wikipedia.org/wiki/Notification_area) on
  Wikipedia.
- [Member Settings notifications](../../Member-Settings/Notifications.md), the same
  popup at the member scope, with the board and admin overrides it can fall back to.
- [E-mail](E-mail.md) - how the notification e-mails are sent.

## How to use it

1. Open **Admin Panel**, **People**, **Notifications**
   (`/admin/people/notifications`), right below **E-mail** in the menu.
2. For **Notification tray** and for **Email**, choose **Yes** (on by default
   for everyone) or **No** (off by default). The choice saves at once.
3. Below them, open **Email**, **Notification tray** or **Outgoing Webhooks**
   to set the instance defaults of that channel: **Layout**, which parts to **Show**,
   **Grouping** and **When to send**. Each change saves at once.
4. The email-to-card settings of the instance are in the same pane.

A board admin then overrides a service for one board in Board Settings, and a
member for themselves in Member Settings, each with a third choice,
**Default**, that falls back to the level above.

## How the numbers are calculated

From [models/lib/notificationSettings.js](../../../../models/lib/notificationSettings.js)
and [models/lib/notificationDelivery.js](../../../../models/lib/notificationDelivery.js):

- **Which level wins**: the member's own setting, if it is Yes or No; else the
  board's, if it is Yes or No; else this Admin Panel default; and when nothing
  has ever been set anywhere, **on** (`HARDCODED_FALLBACK = true`).
- **Delivery defaults built in**, used until something is chosen:
  - e-mail: the clear layout, every part shown, all of a recipient's
    notifications combined into one e-mail, sent at once - "at once" meaning
    after `EMAIL_NOTIFICATION_TIMEOUT` milliseconds, 30000 (30 seconds) when
    unset or not a positive number
    ([server/notifications/emailQueue.js](../../../../server/notifications/emailQueue.js));
  - tray: the classic layout, every entry on its own, at once;
  - webhooks: the text and the standard fields, every notification its own
    POST, at once.
- **Interval schedule**: one of 5, 10, 15, 30, 60, 120, 240, 480, 720 or 1440
  minutes; 60 by default. **Daily schedule**: a time of day, 08:00 by default.

## How it works in WeKan

- The same popup renders at all three levels (`notificationSettingsPopup`,
  [client/components/settings/notificationSettingsPopup.jade](../../../../client/components/settings/notificationSettingsPopup.jade));
  this is the `scope="admin"` case, which is why it offers only Yes/No rather
  than a third "use the default" choice - there is no level above it to fall
  back to.
- The Yes/No is saved by `setAdminNotifyDefault` in
  [server/models/settings.js](../../../../server/models/settings.js), which is
  site-admin only and accepts only the services `tray` and `email`. It writes
  `notifyDefaultTray` or `notifyDefaultEmail` of the `settings` document. The
  board override is `board.notifyOverride`, the member's
  `profile.notifyOverride`.
- The delivery forms are `notificationDeliverySettings`
  ([notificationDeliverySettings.jade](../../../../client/components/settings/notificationDeliverySettings.jade)),
  saved through `setNotificationDelivery`, which checks the caller's role and
  the value.
- The change of the admin default is recorded in the [Audit log](Audit-Log.md).
- Pinned by [tests/notificationSettingsResolution.test.cjs](../../../../tests/notificationSettingsResolution.test.cjs),
  [tests/notificationSettingsScope.test.cjs](../../../../tests/notificationSettingsScope.test.cjs),
  [tests/notificationDelivery.test.cjs](../../../../tests/notificationDelivery.test.cjs)
  and [server/lib/tests/notificationDelivery.tests.js](../../../../server/lib/tests/notificationDelivery.tests.js).

## Commits

 - [Browser push notifications, per device](https://github.com/wekan/wekan/commit/0a5ae3e20546fff846cfcb97f960a6e6e65e114a)
 - [E-mails in the clear layout by default](https://github.com/wekan/wekan/commit/058677e078ce83f04edd550bc1be83ee958d3e2e)
 - [Email to card settings](https://github.com/wekan/wekan/commit/988b177e59dd1b0e2e8763900fde69056a14d800)
 - [Choose what notifications contain, and group and schedule them](https://github.com/wekan/wekan/commit/ab785acd1ebd309a96e7231509796d8b71a78572)
 - [Honor scoped notification subscriptions and settings](https://github.com/wekan/wekan/commit/03e8a6bf667b8bc1f8e8c85953c2919ad06acc0d)
 - [Document the Notifications pane](https://github.com/wekan/wekan/commit/93814d5c312b33abcf71055a44c3578f41f370e3)
 - [Give the Notifications pane a URL of its own](https://github.com/wekan/wekan/commit/e15f53135240cebb6e9aec8268c326aeab922afa)
 - [Add the 3-tier Notification Settings popup](https://github.com/wekan/wekan/commit/bde66a5c7ddba955c7e6583304a1ca7274aaf8f4)
