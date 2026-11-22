# Outgoing webhook to Matrix

## What it is

[#1100](https://github.com/wekan/wekan/issues/1100). WeKan's notifications can
go to a Matrix room through an ordinary outgoing webhook. WeKan needs no Matrix
bot, account or access token of its own.

## Read more

- [Wikipedia: Matrix (protocol)](https://en.wikipedia.org/wiki/Matrix_(protocol))
- [matrix-hookshot](https://github.com/matrix-org/matrix-hookshot), its
  generic webhooks
- [Webhook data](../Webhook-data.md)
- WeKan issue [#1100](https://github.com/wekan/wekan/issues/1100)

## How to use it

1. **In Matrix** (Element or any client), in the room the notifications should
   go to, with hookshot on your homeserver: invite the hookshot bot and run
   `!hookshot webhook wekan`. It answers with an address such as
   `https://hookshot.example.org/webhook/abcdef…`. matrix.org and other public
   servers may not run hookshot; it is part of your own homeserver's setup.
2. **In WeKan**: Board Settings → **Outgoing Webhooks** → add one with that
   address (or Admin Panel → Settings → Global Webhooks for every board).
   Choose the activities to send. Only the `text` is needed, so the webhook's
   **delivery** setting can turn off the extra properties.
3. Make a change on the board: the sentence appears in the room, for example
   *"Alice moved Fix login to Done at board Dev https://wekan.example.com/b/…"*.

### Notes

- The address is reached through WeKan's SSRF guard like every webhook, so it
  must be a public address: a hookshot reachable only on WeKan's internal
  network is refused. Publish hookshot's webhook listener through your
  reverse proxy, as its documentation describes.
- Hookshot can also format messages with a JavaScript transformation on its
  side, for example to make the card title a link. WeKan's body is the
  documented webhook payload ([Webhook data](../Webhook-data.md)).
- Two-way webhooks are not for Matrix: a reply in the room does not come back
  to WeKan.

## How the numbers are calculated

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

[matrix-hookshot](https://github.com/matrix-org/matrix-hookshot), the Matrix
project's own integration service, has **generic webhooks**: an address that
posts what it receives into a room. A JSON body with a top-level `text` field
becomes the message. That is exactly what WeKan's outgoing webhook sends: the
activity as a sentence in `text` (`models/lib/webhookPayload.js`), plus
whichever properties the webhook is set to carry.

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

## Commits

 - [How-to: Matrix notifications through an outgoing webhook, no bot](https://github.com/wekan/wekan/commit/dff085658555dfaa1016b03e019233e9cc11a173)
