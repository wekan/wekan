# Notification Settings (3-tier: Admin → Board → Member)

WeKan's email and in-app notification channels can be turned on or off at three
levels that override each other in order: an **Admin Panel** default applies to everyone, a
**Board** setting can override it for that board, and a **Member** setting
can override that again for just that person. This lets an admin set a
sane sitewide default, a board owner tighten/loosen it for their board, and
an individual still have the final say for themselves. See
`models/lib/notificationSettings.js`.

## Where to find it

The same popup opens from three different places, each scoped differently:

- **Member Settings**: avatar/name (top right) → **Notifications**.
- **Board Settings**: right sidebar → Board Settings → **Notifications**.
- **Admin Panel**: Admin Panel → **People** → **Notifications** (site defaults).

The rows select **Email** and **in-app notifications**, not individual activity
kinds. Board and member rows offer **Default / Yes / No**.

At Admin scope the row only offers **Yes/No** (there is no level above it to
fall back to); at Board and Member scope each row offers **Default / Yes /
No**, where Default means "inherit from the level above".

## Steps to use it

1. Open the popup from whichever level you want to change (see above).
2. For each notification service row, click **Yes** to force it on, **No**
   to force it off, or **Default** (Board/Member scope only) to fall back to
   the setting above this level.
3. Changes apply immediately - there is no separate Save button.

## Precedence

```
Admin default  --->  Board override  --->  Member override
   (base)          (per-board, optional)   (per-person, optional)
```

A member's "Default" choice falls through to the board's setting; a board's
"Default" choice falls through to the admin default. Whoever sets the most
specific non-Default choice wins for that person on that board.

## Watching and email delivery

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

## Regression verification for #6658

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
