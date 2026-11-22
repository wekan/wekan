# Mattermost

## What it is

WeKan's outgoing webhooks post to a Mattermost **incoming webhook**: Board
Settings → Outgoing Webhooks, paste the incoming webhook's address, and each
board activity appears in that channel. Optionally, every message about a card
is also sent to its members and assignees as a Mattermost direct message.

## Read more

- [Wikipedia: Mattermost](https://en.wikipedia.org/wiki/Mattermost)
- [Wikipedia: Webhook](https://en.wikipedia.org/wiki/Webhook)
- [Mattermost incoming webhooks](https://developers.mattermost.com/integrate/webhooks/incoming/)
- [Webhook data](../Webhook-data.md)
- WeKan issue [#1297](https://github.com/wekan/wekan/issues/1297), the direct
  messages

## How to use it

**Post a board's activities to a Mattermost channel:**

1. In Mattermost, create an incoming webhook for the channel and copy its
   address.

2. In WeKan, open the board, its right sidebar, then **Board Settings → Outgoing
   Webhooks** (board admins; for every board at once, Admin Panel → Settings
   → Global Webhooks).
3. Write the **Webhook Name**, the **URL** the receiver gave you and, when the
   receiver wants one, the **Token (Optional for Authentication)**.
4. Choose the type (**Outgoing Webhooks**) and under **Send this webhook:**
   either **Every activity** or the activities to send.
5. Click **Create**. A saved webhook can be changed and saved again, or turned
   off with **Disable This Webhook**.

### Direct messages to the card's people

[#1297](https://github.com/wekan/wekan/issues/1297). Tick **Also send a
Mattermost direct message to the card's members and assignees** on a saved
webhook, and every message about a card is also sent to each of its members
and assignees as a direct message, so they see what happened to their cards
even when they do not follow the channel.

- In Mattermost, the incoming webhook must **not** be locked to its channel
  ("Lock to this channel" off), because a direct message is the same webhook
  posting to `@username`.
- A WeKan member is messaged under their WeKan user name, so it should be the
  same as their Mattermost user name; one that is not a valid Mattermost user
  name is skipped.
- The person who made the change is not messaged about it, nobody is messaged
  twice, and a card with very many people stops at 50 messages.
- The channel message still follows the webhook's grouping and schedule; the
  direct messages go at once. Both go through WeKan's SSRF guard, as every
  outgoing webhook does.

## How the numbers are calculated

- **Direct messages**: at most 50 for one message about a card
  (`MAX_MESSAGES` in
  [models/lib/mattermostDirectMessages.js](../../../../../../models/lib/mattermostDirectMessages.js)):
  the card's members and assignees, each once, without the person who made
  the change.

The numbers every outgoing webhook has:

- **Timeout**: one request may take 30 seconds (`totalTimeoutMs: 30000` in
  [server/notifications/outgoing.js](../../../../../../server/notifications/outgoing.js)).
  A 2xx answer is success.
- **At once or queued**: a webhook with the built-in delivery settings is
  POSTed at once. One whose delivery groups or schedules its notifications
  goes through the durable queue
  ([server/lib/webhookOutbox.js](../../../../../../server/lib/webhookOutbox.js)),
  scanned every 5 seconds: at most 100 jobs a pass, a body of at most 1 MB,
  and a failed job is tried again after `min(60 minutes, 30 seconds x
  2^(attempts - 1))` - 30 s, 1 min, 2 min, 4 min ... - up to 10 attempts.
- **Internal destinations**: Admin Panel can list at most 50 hosts on WeKan's
  own network that webhooks may reach
  ([models/lib/internalWebhookHosts.js](../../../../../../models/lib/internalWebhookHosts.js)).

## How it works in WeKan

A webhook is a document of the `Integrations` collection
([models/integrations.js](../../../../../../models/integrations.js)): the board it
belongs to (`_global` for Admin Panel → Settings → Global Webhooks), its type
(Outgoing Webhooks, or Two-Way Webhooks whose answer can change the board), its
name, URL, optional token and the activities it sends. Only a board admin or a
site admin may add, change or remove one, and it cannot be moved to another
board ([server/permissions/integrations.js](../../../../../../server/permissions/integrations.js)).
When a board activity happens,
[server/notifications/outgoing.js](../../../../../../server/notifications/outgoing.js)
builds the JSON body ([models/lib/webhookPayload.js](../../../../../../models/lib/webhookPayload.js),
described in [Webhook data](../Webhook-data.md))
and POSTs it through the outgoing request guard
([server/lib/ssrfGuard.js](../../../../../../server/lib/ssrfGuard.js)), which
refuses private, loopback and link-local addresses unless Admin Panel lists
them, and trusts `WEBHOOK_TLS_CA_CERT` for TLS. The webhooks are set in
`outgoingWebhooksPopup` in
[client/components/sidebar/sidebar.jade](../../../../../../client/components/sidebar/sidebar.jade).

The direct messages are the webhook's own body with `channel` set to
`@username`, one per person, made by
[models/lib/mattermostDirectMessages.js](../../../../../../models/lib/mattermostDirectMessages.js)
and pinned by [tests/mattermostDirectMessages.test.cjs](../../../../../../tests/mattermostDirectMessages.test.cjs).

## Commits

 - [Webhooks: also send a Mattermost direct message to the card's people](https://github.com/wekan/wekan/commit/349d6dc5e665f1ec62fe8831b91e2501a81ad3b2)
