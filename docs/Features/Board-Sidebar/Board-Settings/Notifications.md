# Board Settings / Notifications

## What it is

A board administrator sets this board's email and in-app notification
preferences here. **Default** inherits the site setting, while **Yes** or
**No** overrides it. A member's explicit preference can override this board
default. The same popup also sets the board's due date reminders, its email to
card settings and how its notifications are delivered (content, grouping and
schedule) for email, the in-app tray and webhooks.

Watching determines which events you subscribe to. Delivery preferences control
the channels those subscriptions use. See the full
[notification guide](../../Member-Settings/Notifications.md), including muted
watching and explicit list/card subscriptions.

## Read more

- [Wikipedia: Notification system](https://en.wikipedia.org/wiki/Notification_system)
- [Wikipedia: Email](https://en.wikipedia.org/wiki/Email)
- [Wikipedia: Webhook](https://en.wikipedia.org/wiki/Webhook)
- [Member Settings / Notifications](../../Member-Settings/Notifications.md)
- [Outgoing Webhooks](Outgoing-Webhooks/Webhook-data.md)

## How to use it

**Turn email or in-app notifications on or off for the board:**

1. Open the board, its right sidebar, then **Board Settings → Notifications**
   (board admins only).
2. For each row (the in-app tray and email), choose **Default** to follow the
   Admin Panel setting, or **Yes** or **No** to override it for this board.

**Set the board's due date reminders:**

1. Under **Due date reminders**, write the days in **Remind on these days,
   separated by commas**: 0 is the due day, positive numbers are days before it
   and negative numbers days after it, for example `3, 1, 0, -1`. Leave it
   empty to use the server default.
2. Tick **No due date reminders on this board** to turn them off here, or
   **Also send due date reminders to this board's outgoing webhooks**.
3. Click **Save**.

**Set how the board's notifications are delivered:** below, the email to card
settings and one delivery section per channel (email, tray and webhook) set
what a notification carries, whether several are combined, and when they are
sent.

## How the numbers are calculated

- **Which setting wins** (`resolveNotificationSetting` in
  [models/lib/notificationSettings.js](../../../../models/lib/notificationSettings.js)):
  the member's own Yes or No first, then this board's, then the Admin Panel
  default; when none of them is set, notifications are on.
- **Due date reminder days**
  ([models/lib/dueNotificationConfig.js](../../../../models/lib/dueNotificationConfig.js)):
  each day is a whole number from -14 to 14, at most 10 of them
  (`MAX_BOARD_DUE_DAYS`); a repeated day counts once, and they are kept sorted
  from the most days before to the most days after. An empty field means the
  server default, `NOTIFY_DUE_DAYS_BEFORE_AND_AFTER`, whose entries outside
  -14..14 are dropped; an empty list means no reminders on this board. The
  reminders are sent at `NOTIFY_DUE_AT_HOUR_OF_DAY`, an hour from 0 to 23,
  default 8.
- **Delivery** ([models/lib/notificationDelivery.js](../../../../models/lib/notificationDelivery.js)):
  a schedule is immediate, every 5, 10, 15, 30, 60, 120, 240, 480, 720 or 1440
  minutes, or once a day at a time `HH:MM`; for each setting the most specific
  explicit value wins (Member Settings, then the board, then Admin Panel, then
  the built-in default; for webhooks the webhook itself, then the board).

## How it works in WeKan

The popup is `notificationSettingsPopup` in
[client/components/settings/notificationSettingsPopup.jade](../../../../client/components/settings/notificationSettingsPopup.jade),
opened from Board Settings with `scope: 'board'`; the same template is used by
Member Settings and Admin Panel. **Yes**, **No** and **Default** call
`board.setNotifyOverride()` in [models/boards.js](../../../../models/boards.js),
which only a board admin or a site admin may do, and store
`notifyOverrideTray` and `notifyOverrideEmail` on the board (Default removes
the field). The due date reminders are saved by the `setBoardDueReminders`
method in
[server/methods/boardDueReminders.js](../../../../server/methods/boardDueReminders.js),
which checks the caller is a board admin or site admin, and store
`dueReminderDays` and `dueReminderWebhook` on the board. The delivery sections
are shown at the board scope to board admins only, and their server method
checks that too.

## Commits

 - [Browser push notifications, per device](https://github.com/wekan/wekan/commit/0a5ae3e20546fff846cfcb97f960a6e6e65e114a)
 - [Ntfy as a notification channel, per member](https://github.com/wekan/wekan/commit/d873af70e802be2418874124b2cb92ee300109ab)
 - [Email to card: board addresses, IMAP mailboxes, provider webhooks and Sandstorm grain email](https://github.com/wekan/wekan/commit/988b177e59dd1b0e2e8763900fde69056a14d800)
 - [Choose what notifications contain, and group and schedule them, for e-mail, the tray and webhooks](https://github.com/wekan/wekan/commit/ab785acd1ebd309a96e7231509796d8b71a78572)
 - [Let members choose which kinds of card activity notify them](https://github.com/wekan/wekan/commit/2845fc9f9084d227c34d8256906bdd50b1a2e9f0)
 - [Set due-date reminder days and webhook delivery per board](https://github.com/wekan/wekan/commit/58d166029c2074f7f8e36fc45dc32d4102ae2f54)
 - [Honor scoped notification subscriptions and settings](https://github.com/wekan/wekan/commit/03e8a6bf667b8bc1f8e8c85953c2919ad06acc0d)
 - [Fix "Utils is not defined"/"ReactiveCache is not defined" in four client files](https://github.com/wekan/wekan/commit/2f626d099d17d4ec4dc69629e877647bfd259986)
 - [Add a 3-tier Notification Settings popup (Member/Board/Admin)](https://github.com/wekan/wekan/commit/bde66a5c7ddba955c7e6583304a1ca7274aaf8f4)
 - [Convert client-reachable models/lib helpers from CommonJS to ES modules (1/2)](https://github.com/wekan/wekan/commit/8d1fae4f7d8a1ebf9a5aa850c8ef2bc475ab0a8e)
 - [Due-date reminders: honour hour 0 (midnight) and notify card assignees (#3192)](https://github.com/wekan/wekan/commit/c0bbacaf94693fa4407fb055fc8bdd07b250ea42)
