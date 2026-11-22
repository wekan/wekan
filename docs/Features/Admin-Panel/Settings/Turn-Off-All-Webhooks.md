# Admin Panel / Settings / Features / Turn off all webhooks

## What it is

One switch that turns off every webhook of this WeKan at once. While it is on:

- every webhook screen is hidden - not greyed out: the board menu's
  **Outgoing Webhooks**, **Admin Panel / Settings / Global Webhooks** and its
  menu entry, **Board Settings / Bots** and the Rules action *Dispatch to bot*,
  the *Send due reminders to this board's webhooks* tick and the webhook row of
  the notification delivery settings;
- the server **sends no webhook**: board and global webhooks, two-way
  webhooks, Mattermost direct messages, the grouped and scheduled webhook
  queue, the webhooks of durable Sync, the
  [Login and registration webhook](Login-and-Registration-Webhook.md) and the
  dispatches to bots;
- the server **refuses to add or change a webhook**, by any route, and records
  each refusal in Admin Panel / Problems;
- **nothing is deleted**: every webhook, its token, its activities and its
  delivery settings are kept, so turning the switch off again brings them all
  back as they were.

It is for an instance that must not send anything to another server - during
an incident, an audit or a migration, or a WeKan that is never meant to have
webhooks - without deleting the webhooks people have set up.

## Read more

- [Webhook](https://en.wikipedia.org/wiki/Webhook) on Wikipedia.
- [Kill switch](https://en.wikipedia.org/wiki/Kill_switch) on Wikipedia - one
  control that stops a whole mechanism.
- [CWE-284: Improper Access Control](https://cwe.mitre.org/data/definitions/284.html) -
  why a hidden button is not enough, and the server refuses too.
- WeKan: [Global Webhooks](Global-Webhooks.md),
  [Admin Panel / Problems / All webhooks](../Problems/Webhooks.md) (the list of every
  webhook), [Features](Features.md),
  [Settings enforced on the server](../Settings-Enforced-On-Server.md).

## How to use it

**Turn every webhook off**

1. Sign in as a site administrator and open **Admin Panel / Settings /
   Features** (`/admin/settings/features`).
2. Tick **Turn off all webhooks**, below *Sign in with SQRL* and *ActivityPub*.
   It is saved at once.
3. The **Global Webhooks** entry leaves the Settings menu, and on every board
   the board menu no longer shows **Outgoing Webhooks**.

**Turn them on again**

1. Open **Admin Panel / Settings / Features** again.
2. Untick **Turn off all webhooks**. Every saved webhook works again, with its
   own *Disable This Webhook* state as it was.

**See which webhooks there are** - before or after turning them off - in
[Admin Panel / Problems / All webhooks](../Problems/Webhooks.md). The report keeps
listing them while the switch is on, and says that they are turned off.

An old link to `/admin/settings/global-webhooks` shows *All webhooks are turned
off in Admin Panel / Settings / Features.* instead of the forms.

## How the numbers are calculated

- **Off by default**: a WeKan that never had the switch sends webhooks as
  before. Only `webhooksDisabled: true` on the Settings document turns them off;
  any other value keeps them on (`webhooksDisabled` in
  [models/lib/webhooksSwitch.js](../../../../models/lib/webhooksSwitch.js)).
- **2 seconds**: the server reads the switch at most once every two seconds
  per server process (`CACHE_MS` in
  [server/webhooksSwitch.js](../../../../server/webhooksSwitch.js)). Saving
  clears the cache of the process that saved it at once; another process of the
  same WeKan follows within the two seconds.
- **Queued webhooks** (a webhook whose delivery groups or schedules its
  notifications): nothing new is queued while the switch is on; a notification
  that was already waiting is kept, not cancelled, and is sent once the switch
  is off again. A webhook of durable Sync (List sync, recovery) is not sent
  and not sent later either.
- **Problems**: one row per kind, *Webhooks turned off*, with how many
  refusals, since when, and by whom - never one row per refusal. A refusal
  never disables the account: a page open from before the switch still sends
  the same call.

## How it works in WeKan

**Stored** on the Settings document as `webhooksDisabled`, published to every
client (it holds no secret), and saved by the site-admin method
`saveWebhooksDisabled`, which the Admin Panel audit log records.

**Hidden in the interface** by the `{{webhooksOff}}` helper
([client/lib/webhooksSwitch.js](../../../../client/lib/webhooksSwitch.js)).

**Not sent.** Every sender asks `webhooksOff()` before it builds a request:

| Sender | File |
| --- | --- |
| Board and global webhooks, two-way webhooks, Mattermost direct messages, the card-opened notification | `server/notifications/outgoing.js` (`deliverWebhook`, `deliverActivityWebhook`, the `outgoingWebhooks` method) |
| The grouped and scheduled queue | `server/lib/webhookOutbox.js`, built with the switch in `server/notifications/webhookQueue.js` |
| Durable Sync webhooks | `server/notifications/storedWebhooks.js` |
| Login and registration webhook | `server/accountWebhook.js` |
| Bot dispatches | `server/bots.js` |

The board activity hook (`server/models/activities.js`) does not even look up
the webhooks while the switch is on. A webhook that is not sent is not a
security event and is not recorded.

**Not webhooks, and so not turned off**: a member's own **ntfy** push
notifications and **CalDAV** calendar sync also send through the webhook
transport, for its protection against server-side request forgery, but they
are not webhooks an administrator or a board admin added. Email to card's
inbound address is mail arriving at WeKan, not a webhook WeKan sends.
`NOT_WEBHOOKS` in models/lib/webhooksSwitch.js lists them with the reason.

**Refused.** While the switch is on:

| Write | Answer |
| --- | --- |
| A client `Integrations` insert or update (the forms above) | Denied by `Integrations.deny` in `server/permissions/integrations.js` |
| `POST /api/boards/:boardId/integrations`, `PUT /api/boards/:boardId/integrations/:intId`, `POST` and `DELETE /api/boards/:boardId/integrations/:intId/activities` | 403 `{ "error": "webhooks-disabled" }`, after the board-admin check |
| A webhook's own delivery settings (`setNotificationDelivery`, scope `integration`) | `webhooks-disabled` |
| The login and registration webhook (`saveAccountWebhook`) | `webhooks-disabled` |
| Dispatching a card to a bot from Board Settings / Bots (`botDispatch`) | `webhooks-disabled`; a Rule's *Dispatch to bot* is skipped and the Rule's other actions still run |

Removing a webhook (`DELETE /api/boards/:boardId/integrations/:intId`, the
empty URL of a webhook form) is never refused: it is the cleanup. A refused
write is recorded with the key `authz.webhooks-disabled`
(`models/lib/securityCategories.js`, shown as *Webhooks turned off*).

**Related files.**

| File | What it is |
| --- | --- |
| `models/lib/webhooksSwitch.js` | The decision, the list of senders, and the report rows. |
| `server/webhooksSwitch.js` | The cached switch, the refusal and its record, `saveWebhooksDisabled`, `webhooksReportPage`. |
| `client/lib/webhooksSwitch.js` | `{{webhooksOff}}` for the templates. |
| `client/components/settings/settingBody.*` | The tick in Features, the Global Webhooks menu entry and pane. |
| `tests/webhooksSwitch.test.cjs` | Node tests: the queue sends nothing, every sender asks, every write is refused and recorded. |
| `server/lib/tests/webhooksSwitch.tests.js` | Mocha tests against the running server. |
| `tests/playwright/specs/webhooks-switch.e2e.js` | Browser test. |

## Commits

- [Turn off all webhooks: the server sends none and refuses to add or change one](https://github.com/wekan/wekan/commit/d2b40f64df9eb4a7e3e4655e2b2fc646f72a2e3f)
- [Turn off all webhooks: the tick in Admin Panel / Settings / Features hides every webhook screen](https://github.com/wekan/wekan/commit/c90bbbcd30feaf0861ef25e241050ade0728381c)
- [Translations: Turn off all webhooks and the All webhooks report in every language](https://github.com/wekan/wekan/commit/cdf4da3d8d383d41835b371a8e9251fef1b6b99f)
