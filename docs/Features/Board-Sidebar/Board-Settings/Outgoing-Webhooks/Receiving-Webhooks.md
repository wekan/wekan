# Receiving webhooks

## What it is

How to receive what WeKan's outgoing webhooks send: any web service that
accepts an HTTP POST with a JSON body. It must answer quickly.

REQUIRED: Your webhook should reply 200 OK immediately after receiving webhook, so that WeKan continues working:

https://github.com/wekan/wekan/issues/5077#event-10054506387

https://github.com/wekan/webhook/blob/main/public/index.php#L48C1-L48C1

## Read more

- [Wikipedia: Webhook](https://en.wikipedia.org/wiki/Webhook)
- [Webhook data](Webhook-data.md), what WeKan sends
- [wekan/webhook](https://github.com/wekan/webhook), an example receiver in PHP

## How to use it

For receiving webhooks on local network, you could use:

1) Some web form with PHP/Python/other backend, Google search for example code
how to receive webhook.

2) [NodeRED](https://github.com/wekan/wekan/issues/2017)

3) [Huginn or Flogo etc](https://github.com/wekan/wekan/issues/1160)

4) [Java](https://github.com/wekan/wekan/issues/2961#issuecomment-601599745)

At Internet you could use for example Zapier.

**Point a webhook at your receiver:**

1. Open the board, its right sidebar, then **Board Settings → Outgoing
   Webhooks** (board admins; for every board at once, Admin Panel → Settings
   → Global Webhooks).
2. Write the **Webhook Name**, the **URL** the receiver gave you and, when the
   receiver wants one, the **Token (Optional for Authentication)**.
3. Choose the type (**Outgoing Webhooks**) and under **Send this webhook:**
   either **Every activity** or the activities to send.
4. Click **Create**. A saved webhook can be changed and saved again, or turned
   off with **Disable This Webhook**.

## How the numbers are calculated

The numbers every outgoing webhook has:

- **Timeout**: one request may take 30 seconds (`totalTimeoutMs: 30000` in
  [server/notifications/outgoing.js](../../../../../server/notifications/outgoing.js)).
  A 2xx answer is success.
- **At once or queued**: a webhook with the built-in delivery settings is
  POSTed at once. One whose delivery groups or schedules its notifications
  goes through the durable queue
  ([server/lib/webhookOutbox.js](../../../../../server/lib/webhookOutbox.js)),
  scanned every 5 seconds: at most 100 jobs a pass, a body of at most 1 MB,
  and a failed job is tried again after `min(60 minutes, 30 seconds x
  2^(attempts - 1))` - 30 s, 1 min, 2 min, 4 min ... - up to 10 attempts.
- **Internal destinations**: Admin Panel can list at most 50 hosts on WeKan's
  own network that webhooks may reach
  ([models/lib/internalWebhookHosts.js](../../../../../models/lib/internalWebhookHosts.js)).

## How it works in WeKan

A webhook is a document of the `Integrations` collection
([models/integrations.js](../../../../../models/integrations.js)): the board it
belongs to (`_global` for Admin Panel → Settings → Global Webhooks), its type
(Outgoing Webhooks, or Two-Way Webhooks whose answer can change the board), its
name, URL, optional token and the activities it sends. Only a board admin or a
site admin may add, change or remove one, and it cannot be moved to another
board ([server/permissions/integrations.js](../../../../../server/permissions/integrations.js)).
When a board activity happens,
[server/notifications/outgoing.js](../../../../../server/notifications/outgoing.js)
builds the JSON body ([models/lib/webhookPayload.js](../../../../../models/lib/webhookPayload.js),
described in [Webhook data](Webhook-data.md))
and POSTs it through the outgoing request guard
([server/lib/ssrfGuard.js](../../../../../server/lib/ssrfGuard.js)), which
refuses private, loopback and link-local addresses unless Admin Panel lists
them, and trusts `WEBHOOK_TLS_CA_CERT` for TLS. The webhooks are set in
`outgoingWebhooksPopup` in
[client/components/sidebar/sidebar.jade](../../../../../client/components/sidebar/sidebar.jade).

## Commits

 - [Add the docs from the wekan.wiki, this page among them](https://github.com/wekan/wekan/commit/73ae73d4c38640e9daedbe8ef9e5b25b877ee804)
