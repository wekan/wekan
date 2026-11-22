# Notification delivery: content, grouping and schedule

## What it is

Notification delivery decides what a WeKan notification looks like and when it
arrives, the same way for **e-mail**, the **notification tray** (the bell) and
**outgoing webhooks**: what one notification shows, whether several are
combined into one message, and on which schedule they are sent, with optional
quiet hours. An admin sets defaults, a board admin sets a board's, and a member
sets their own.

## Read more

- [Email](https://en.wikipedia.org/wiki/Email),
  [Webhook](https://en.wikipedia.org/wiki/Webhook),
  [Notification system](https://en.wikipedia.org/wiki/Notification_system) and
  [Do not disturb](https://en.wikipedia.org/wiki/Do_not_disturb) (quiet hours)
  on Wikipedia.
- Issues [#3695](https://github.com/wekan/wekan/issues/3695),
  [#5171](https://github.com/wekan/wekan/issues/5171) and
  [#4434](https://github.com/wekan/wekan/issues/4434).
- WeKan pages: [Notification Settings](../../Member-Settings/Notifications.md),
  [Webhook data](../../Board-Sidebar/Board-Settings/Outgoing-Webhooks/Webhook-data.md),
  [Global Webhooks](../../Admin-Panel/Settings/Global-Webhooks.md),
  [ntfy and browser notifications](ntfy.md).

## How to use it

1. Open the **Notifications** popup from the level you want to set:
   - **Admin Panel** → People → **Notifications** (instance defaults, instance
     admins);
   - **Board Settings** → **Notifications** (this board, board admins);
   - **Member Settings** → **Notifications** (your own e-mail and tray);
   - a webhook's own form (Board Settings → Outgoing Webhooks, or Admin Panel →
     Settings → Global Webhooks).
2. In the channel's section (Email, Notifications tray, Outgoing Webhooks)
   choose the **Layout** (*One sentence (classic)* or *Clearly arranged: board,
   who, card in bold*) and, under **Show**, the parts.
3. Choose the grouping and the schedule, and optionally quiet hours.
4. Choose "Default" to clear a level's value so it inherits.
5. Save.

## How the numbers are calculated

From [models/lib/notificationDelivery.js](../../../../models/lib/notificationDelivery.js)
and [server/notifications/emailQueue.js](../../../../server/notifications/emailQueue.js):

- **The immediate e-mail delay** is `EMAIL_NOTIFICATION_TIMEOUT` milliseconds
  when it is a positive number, otherwise 30 000 ms (30 s).
- **The grouping window for webhooks** is 30 000 ms when the schedule is
  *Immediately* and grouping is on (`WEBHOOK_GROUP_WINDOW_MS`).
- **Intervals** are only 5, 10, 15, 30, 60, 120, 240, 480, 720 or 1440 minutes
  (`INTERVAL_MINUTES`). The next delivery is the next boundary of the local
  clock: `minuteOfDay = hour * 60 + minute`, next boundary =
  `(floor(minuteOfDay / interval) + 1) * interval`, carried over to the next day
  past 1440 (`nextIntervalBoundary()`).
- **Once a day** is the next time the local clock shows the chosen `HH:MM`
  (default `08:00`), today or within the next two days.
- **Quiet hours**: a delivery time inside them moves to the next quiet-hours
  end (`inQuietHours()`, `nextDailyTime()`); a window with the same start and
  end is no window.
- **Time zone**: the one saved with the setting, else `UTC`.

## How it works in WeKan

Issues: [#3695](https://github.com/wekan/wekan/issues/3695) (what webhooks
send), [#5171](https://github.com/wekan/wekan/issues/5171) (clearly arranged,
combined e-mails).

Every notification channel - **e-mail**, the **notification tray** (the bell)
and **outgoing webhooks** - has the same three kinds of settings:

1. **Content** - what one notification shows.
2. **Grouping** - one message per notification, or several combined.
3. **Schedule** - when it is delivered: immediately, every N minutes/hours, or
   once a day, with optional **quiet hours**.

One shared, pure module resolves and applies them for every channel:
`models/lib/notificationDelivery.js`. Each channel only adapts its output.

### The built-in behaviour

With nothing set anywhere, every channel behaves as below. E-mail is in the
*clearly arranged* layout since [#4434](https://github.com/wekan/wekan/issues/4434);
everything else is what WeKan always did:

| Channel | Built-in behaviour |
| --- | --- |
| E-mail | the clearly arranged layout, with a plain-text alternative; everything due for a recipient combined into one e-mail, sent `EMAIL_NOTIFICATION_TIMEOUT` (30 s) after the notification |
| Tray | the classic activity line; every notification its own entry, shown at once |
| Webhook | `text` plus the standard attributes (`WEBHOOKS_ATTRIBUTES`); one POST per notification, at once |

### Where to set it, and which setting wins

The **Notifications** popup has a section per channel (Email, Notifications
tray, Outgoing Webhooks), opened from:

- **Admin Panel** → People → **Notifications**: the instance defaults
  (instance admins);
- **Board Settings** → **Notifications**: this board's settings (board admins);
- **Member Settings** → **Notifications**: the member's own e-mail and tray;
- each **webhook's own form** (Board Settings → Outgoing Webhooks, Admin Panel
  → Settings → Global Webhooks): that webhook.

Each key (layout, parts, grouping, schedule, interval, time, quiet hours) is
resolved on its own; the most specific level that sets it wins:

```
E-mail, tray:  Member Settings  ->  Board  ->  Admin Panel  ->  built-in
Webhooks:      the webhook      ->  Board  ->  Admin Panel  ->  built-in
```

- The board level applies to that board's notifications, and for webhooks
  only to the board's **own** webhooks: a global webhook belongs to the
  instance administrator, so a board admin cannot reshape it.
- A member cannot change a board's webhook delivery. What a member owns there
  is their identity: **Leave my name out of outgoing webhooks** (see
  [Webhook data](../../Board-Sidebar/Board-Settings/Outgoing-Webhooks/Webhook-data.md)).
- "Default" (board, member, webhook) clears that level's value so it inherits.

All settings are saved through one server method,
`setNotificationDelivery(scope, targetId, channel, settings)`
(`server/methods/notificationDelivery.js`). It accepts only the known keys and
values, and only from the right role: instance admins for the Admin Panel and
global webhooks, the board's admins (or an instance admin) for a board and its
webhooks, and a member only for their own profile. The database schemas carry
the same allowed values, so a direct document write cannot store anything else.

### Content

#### E-mail and tray: layout and parts

**Layout**: *One sentence (classic)* is the sentence WeKan always sent:

> NAME created card "TEst" to list "To Do" at swimlane Social Network at board "Projekt Teilbereich C" LINK

*Clearly arranged* puts the board first and the board, the actor and the card
in bold, with links (#5171), showing only the chosen parts:

> **[Projekt Teilbereich C](board link)**: **NAME** created card **["TEst"](card link)** to list **"To Do"**

| Part | Shows |
| --- | --- |
| `board` | the board name, linked, at the start of the item |
| `actor` | who did it |
| `card` | the card title as a link to the card |
| `list` | the list (and the previous list of a move) |
| `swimlane` | the swimlane |
| `details` | the comment text or the changed value |
| `dates` | the dates of a date change |
| `link` | the link on a line of its own, as in the classic layout |

A part that is switched off removes its clause from the sentence ("at swimlane
...") in any language, as long as the clause is joined by a short connector;
where removing it would break the sentence the value stays. E-mail in the clear
layout also carries a **plain-text alternative** of every item.

An admin's own activity e-mail template (Admin Panel → Email Templates) still
wins over the layout: it is the more specific instruction.

E-mail uses *Clearly arranged* unless a level chooses *One sentence (classic)*
([#4434](https://github.com/wekan/wekan/issues/4434)); the tray keeps the
classic line. Account e-mails - reset password, verify e-mail, a new account
and board invitations - are sent in the same clear HTML style, built from the
same translated text, which is also sent as their plain-text part.

#### Webhooks

*Send the message text* and *Send these fields* - see
[Webhook data](../../Board-Sidebar/Board-Settings/Outgoing-Webhooks/Webhook-data.md) for every property.

#### What is never shown

- A notification only reaches a member of the board who may see it (the
  existing recipient rules, re-checked when a queued e-mail is sent).
- The value of an admin-only custom field (#3141) reaches only the board's
  admins - in e-mail and the tray, in both layouts - and never a webhook.
- Every user-written value (titles, names, comments) is HTML-escaped, and a
  link is made only from an `http(s)` URL.

### Grouping

| Channel | Options |
| --- | --- |
| E-mail | Everything due in one e-mail (built-in), one per board, one per card, each on its own |
| Tray | Each on its own (built-in), one row per card, one row per board ("3 notifications on card X", expandable) |
| Webhook | Each on its own (built-in), everything in one POST, one per board, one per card |

A grouped webhook POST is
`{ "text": "...", "description": "act-batch", "count": 3, "items": [ ... ] }`,
each item the body a single notification would have sent; a group of one is
sent as that single body. Grouping waits a short window (30 s) when the
schedule is *Immediately*, so notifications that arrive together go together.

### Schedule

- **Immediately** - the built-in timing above.
- **Every N minutes/hours** (5, 10, 15, 30 minutes; 1, 2, 4, 8, 12, 24 hours) -
  delivered at the next boundary of the local clock (for one hour: on the
  hour), so everything inside one window is delivered, and grouped, together.
- **Once a day** at a chosen time.
- **Quiet hours** (from - to, may span midnight) - anything that would be
  delivered inside them waits until they end.

Times are in the time zone saved with the setting: the browser's time zone of
whoever set it (shown under the setting), UTC if none.

#### Durable, exactly-once delivery

- **E-mail** uses the existing durable outbox (`server/lib/emailOutbox.js`):
  each notification is a stored job with its delivery time *before* anything
  is sent; one e-mail carries the jobs of one group; a job is marked sent only
  after the mail server accepted it. A restart in a window loses nothing, and a
  stored job keeps its time when a setting changes later.
- **Tray**: the entry is stored at once with a `showAt` time; the drawer and
  the bell show it when the time comes. Nothing is waiting in memory.
- **Webhooks**: a grouped or scheduled webhook notification is stored in the
  webhook queue (`server/lib/webhookOutbox.js`,
  `server/notifications/webhookQueue.js`) and POSTed to the webhook as it is
  at delivery (a deleted or disabled webhook cancels it; the current URL and
  token are used). It is marked sent after a 2xx answer and retried with
  backoff otherwise. Like e-mail, a crash between the HTTP answer and the
  acknowledgement can repeat that one request (at-least-once).
- Two-way webhooks are always immediate: their reply edits the comment the
  event was about. Webhooks planned by board Sync (`server/notifications/
  prepareWebhooks.js`, stored plans with their own delivery receipts) are
  delivered immediately too, with the content settings applied.

### Related

- [Notification Settings (on/off per channel)](../../Member-Settings/Notifications.md)
- [Webhook data](../../Board-Sidebar/Board-Settings/Outgoing-Webhooks/Webhook-data.md)
- [Global Webhooks](../../Admin-Panel/Settings/Global-Webhooks.md)

## Commits

 - [On Sandstorm, webhooks go through the Powerbox](https://github.com/wekan/wekan/commit/2cc0b59a51d2de1b67ef62b6c66d0674cfb8383c)
 - [E-mails in the clear HTML layout by default](https://github.com/wekan/wekan/commit/058677e078ce83f04edd550bc1be83ee958d3e2e)
 - [Choose what notifications contain, and group and schedule them](https://github.com/wekan/wekan/commit/ab785acd1ebd309a96e7231509796d8b71a78572)
 - [Share notification delivery slots across workers](https://github.com/wekan/wekan/commit/7efa8ca37fbf28f8468a4b6de9f438ebc6421add)
 - [Bounded concurrency for independent e-mail recipients](https://github.com/wekan/wekan/commit/15368a157088420a3eb0830557be16022689597b)
 - [Bound e-mail retries and expose stopped delivery](https://github.com/wekan/wekan/commit/0457e0dfd46ad1baa218f7314b1521d347d48969)
 - [Administrator recovery controls for queued e-mail](https://github.com/wekan/wekan/commit/20b47995b27f666ed640759632580dd9a97d5f41)
 - [Persist notification e-mail jobs and resume after restart](https://github.com/wekan/wekan/commit/d828411bf6e110e4edb0c3028a8a864a9594d327)
