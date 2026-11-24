# Notification Settings (3-tier: Admin → Board → Member)

## What it is

Notifications tell you what happened on boards you watch: by e-mail, in the
in-app notification tray, and optionally by browser push or the ntfy phone app.
WeKan's email and in-app notification channels can be turned on or off at three
levels that override each other in order: an **Admin Panel** default applies to everyone, a
**Board** setting can override it for that board, and a **Member** setting
can override that again for just that person. This lets an admin set a
sane sitewide default, a board owner tighten/loosen it for their board, and
an individual still have the final say for themselves. See
`models/lib/notificationSettings.js`.

## Read more

- [Push technology](https://en.wikipedia.org/wiki/Push_technology) and
  [Simple Mail Transfer Protocol](https://en.wikipedia.org/wiki/Simple_Mail_Transfer_Protocol)
  on Wikipedia.
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) on MDN -
  the browser notifications on this device.
- [ntfy documentation](https://docs.ntfy.sh/) - the phone app channel.
- [Notification delivery](../Notifications/Notification-Delivery.md) and
  [ntfy](../Notifications/ntfy.md) in the WeKan docs.
- [Activity on all my boards](Activity-Feed.md).

## How to use it

**Where to find it.** The same popup opens from three different places, each
scoped differently:

- **Member Settings**: avatar/name (top right) → **Notifications**.
- **Board Settings**: right sidebar → Board Settings → **Notifications**.
- **Admin Panel**: Admin Panel → **People** → **Notifications** (site defaults).

The rows select **Email** and **in-app notifications**, not individual activity
kinds. Board and member rows offer **Default / Yes / No**.

At Admin scope the row only offers **Yes/No** (there is no level above it to
fall back to); at Board and Member scope each row offers **Default / Yes /
No**, where Default means "inherit from the level above".

**Steps to use it**

1. Open the popup from whichever level you want to change (see above).
2. For each notification service row, click **Yes** to force it on, **No**
   to force it off, or **Default** (Board/Member scope only) to fall back to
   the setting above this level.
3. Changes apply immediately - there is no separate Save button.

Below the on/off rows, each channel (Email, Notifications tray, Outgoing
Webhooks) has its delivery settings - what a notification shows, whether
several are combined, and when they are sent. See
[Notification delivery](../Notifications/Notification-Delivery.md).

**What else the popup holds, by scope**

- **Member scope - Notify me about:** untick a kind of card activity to stop
  its notifications in the bell and by e-mail. Due-date reminders and
  @mentions always arrive.
- **Member scope - Browser notifications on this device:** **Turn on for this
  device** / **Turn off for this device**, in each browser where you want your
  notifications even while WeKan is closed.
- **Member scope - ntfy phone notifications:** tick **Send my notifications to
  ntfy**, paste the **Topic address** (and an optional **Access token**), and
  click **Save**. See [ntfy](../Notifications/ntfy.md).
- **Board scope - Due date reminders:** the days to remind on, **No due date
  reminders on this board**, and **Also send due date reminders to this
  board's outgoing webhooks**, then **Save**.
- **Every scope:** the e-mail-to-card settings of that level.

## How the numbers are calculated

- **Precedence:** `resolveNotificationSetting()` in
  [models/lib/notificationSettings.js](../../../models/lib/notificationSettings.js)
  takes the member value if it is `true` or `false`, else the board value, else
  the admin value, else `true` (`HARDCODED_FALLBACK`). Anything that is not a
  real boolean counts as Default.
- **E-mail delay: 30 seconds.** Activity e-mail is buffered for
  `EMAIL_NOTIFICATION_TIMEOUT` milliseconds, default 30000 when the variable is
  unset, not a number, or not above 0
  ([server/notifications/emailQueue.js](../../../server/notifications/emailQueue.js));
  notifications for the same recipient are combined within it.
- **Activity kinds:** **Notify me about** has 11 groups - labels, members,
  assignees, comments, moves, dates, checklists, attachments, custom fields,
  archive and created - each a list of activity types
  ([models/lib/notificationActivityGroups.js](../../../models/lib/notificationActivityGroups.js));
  unticked groups are stored in `profile.notifyMutedActivities`.
- **Due date reminder days:** comma-separated whole numbers, 0 = the due day,
  positive = days before, negative = days after; the server-wide
  `NOTIFY_DUE_DAYS_BEFORE_AND_AFTER` accepts -14..14 and drops other values,
  and `NOTIFY_DUE_AT_HOUR_OF_DAY` is an hour 0..23, default 8
  ([models/lib/dueNotificationConfig.js](../../../models/lib/dueNotificationConfig.js)).
  A board's own list overrides the server's.

## How it works in WeKan

### Precedence

```
Admin default  --->  Board override  --->  Member override
   (base)          (per-board, optional)   (per-person, optional)
```

A member's "Default" choice falls through to the board's setting; a board's
"Default" choice falls through to the admin default. Whoever sets the most
specific non-Default choice wins for that person on that board.

### Files

- **Popup:** `notificationSettingsPopup` (one template, `scope` = `member`,
  `board` or `admin`) in
  [client/components/settings/notificationSettingsPopup.jade](../../../client/components/settings/notificationSettingsPopup.jade)
  and [notificationSettingsPopup.js](../../../client/components/settings/notificationSettingsPopup.js),
  opened from
  [client/components/users/userHeader.jade](../../../client/components/users/userHeader.jade),
  [client/components/sidebar/sidebar.jade](../../../client/components/sidebar/sidebar.jade)
  and [client/components/settings/peopleBody.jade](../../../client/components/settings/peopleBody.jade).
- **Rules:** [models/lib/notificationSettings.js](../../../models/lib/notificationSettings.js)
  (services `tray` = the in-app tray `profile`, and `email`),
  [models/lib/notificationActivityGroups.js](../../../models/lib/notificationActivityGroups.js),
  [models/lib/notificationDelivery.js](../../../models/lib/notificationDelivery.js).
- **Delivery:** `server/notifications/*.js`; e-mail through the durable queue of
  [server/notifications/emailQueue.js](../../../server/notifications/emailQueue.js).

### Watching and email delivery

Enabling a channel does not subscribe you to every board. Watching selects the
activities; the channel settings decide how eligible notifications are delivered.

- **Watching** a board receives other users' activity on that board.
- **Tracking** receives activity on cards in which you participate.
- **Muted** suppresses board-wide activity, including assignment and mention
  notifications. An explicit list or card subscription still opts you into that
  narrower scope. Stop watching those lists/cards as well to silence them.
- Activity recipients must be active board members. Your own changes normally
  do not notify you; self-mentions are an exception.

If a test email works but activity email does not, check Admin Panel → Features
has notifications enabled, the recipient is an active board member, their watch
level includes the activity, and Email is enabled by the effective member/board/
admin settings. Reproduce with a second user making a change. Delivery is
buffered for 30 seconds by default (`EMAIL_NOTIFICATION_TIMEOUT`, milliseconds).
A successful test email proves the transport works; it does not exercise these
activity-selection rules.

### Regression verification for \#6658

The original muted-assignment boundary was fixed in `4be77e7189`; explicit
list/card subscriptions and notification-setting scopes were corrected in
`03e8a6bf66`. The SMTP browser regression covers board/list/card watching,
comments, title changes, new cards on watched lists/boards, muted assignments,
member email opt-out and suppression of the actor's own notifications.

For an isolated test app, set `MAIL_URL=smtp://127.0.0.1:2525` and
`EMAIL_NOTIFICATION_TIMEOUT=100`. Follow the sandbox build/test setup, then run
from `tests/playwright` with the matching Node and browser toolchains:

```sh
WEKAN_TEST_SMTP_PORT=2525 node node_modules/@playwright/test/cli.js test \
  specs/notification-email-delivery.e2e.js --workers=1
```

The test binds a local SMTP capture server and never relays mail. The app must
already be ready and connected to the fixture database. Without the explicit
SMTP port the delivery spec skips; that is not a delivery verification. This
covers SMTP acceptance, not delivery by an external provider to a real inbox.

The total-deadline recovery scenario uses the same isolated app and fixture
port, with these additional app environment variables:

```sh
export MAIL_TOTAL_TIMEOUT_MS=1000
export MAIL_GREETING_TIMEOUT_MS=5000
export MAIL_SOCKET_TIMEOUT_MS=5000
```

Run `email-recovery-controls.e2e.js` with `WEKAN_TEST_SMTP_PORT=2525` and
`WEKAN_TEST_MAIL_TOTAL_TIMEOUT=1000`. Its total-timeout case sends continuous
SMTP reply bytes, verifies socket closure and the retained pending payload,
checks the retry count in Admin Panel → Problems → Recovery, then permits a
retry and verifies that acceptance replaces the payload with a receipt. The
longer phase limits ensure this exercises the total deadline. This setup tests
the native MAIL_URL transport. Add `MAIL_TLS_SERVERNAME=localhost` to the app
environment to exercise the TLS-override transport with the same scenario. The
full-app Meteor suite `SMTP total deadline in Meteor` also checks native
MAIL_URL, Admin Panel and TLS-override installation through the real
`Email.sendAsync` path without replacing Nodemailer.

### Tests

[tests/notificationSettingsResolution.test.cjs](../../../tests/notificationSettingsResolution.test.cjs),
[tests/notificationSettingsScope.test.cjs](../../../tests/notificationSettingsScope.test.cjs),
[tests/boardMutedNotifications6658.test.cjs](../../../tests/boardMutedNotifications6658.test.cjs),
[tests/notificationDelivery.test.cjs](../../../tests/notificationDelivery.test.cjs)
and the browser tests
[notification-settings-scope.e2e.js](../../../tests/playwright/specs/notification-settings-scope.e2e.js),
[notification-email-delivery.e2e.js](../../../tests/playwright/specs/notification-email-delivery.e2e.js)
and [notification-activity-mute.e2e.js](../../../tests/playwright/specs/notification-activity-mute.e2e.js).

## Commits

 - [ntfy as a notification channel, per member](https://github.com/wekan/wekan/commit/d873af70e802be2418874124b2cb92ee300109ab)
 - [browser push notifications, per device](https://github.com/wekan/wekan/commit/0a5ae3e20546fff846cfcb97f960a6e6e65e114a)
 - [what notifications contain, and their grouping and schedule, per channel](https://github.com/wekan/wekan/commit/ab785acd1ebd309a96e7231509796d8b71a78572)
 - [members choose which kinds of card activity notify them](https://github.com/wekan/wekan/commit/2845fc9f9084d227c34d8256906bdd50b1a2e9f0)
 - [due-date reminder days and webhook delivery per board](https://github.com/wekan/wekan/commit/58d166029c2074f7f8e36fc45dc32d4102ae2f54)
 - [SMTP deadlines enforced while preserving message plugins](https://github.com/wekan/wekan/commit/7a450190ac4a6e7d22d92bebae966246b4c42ef4)
 - [SMTP deadline cancellation and durable retry verified](https://github.com/wekan/wekan/commit/b70d8e421e875d9ee40333554d221e11e812c42a)
 - [muted-board fixes verified through actual SMTP delivery](https://github.com/wekan/wekan/commit/fd238d34c31a465f41437ff113f076e4ac26c163)
 - [scoped notification subscriptions and settings honored](https://github.com/wekan/wekan/commit/03e8a6bf667b8bc1f8e8c85953c2919ad06acc0d)
 - [the 3-tier Notification Settings popup](https://github.com/wekan/wekan/commit/bde66a5c7ddba955c7e6583304a1ca7274aaf8f4)
 - [muted boards honored for every notification source](https://github.com/wekan/wekan/commit/4be77e7189fcaa83acf15a4cc8ea8e5bd252ae4b)
