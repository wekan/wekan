# Using WeKan from Java

## What it is

This page is about using Wekan from Java code.

Wekan is made with Javascript and uses MongoDB database.

Java code can call WeKan's REST API, and can receive WeKan's webhooks - a
board's Outgoing Webhooks or the Admin Panel's Global Webhooks - and act on
them.

## Read more

- [Wikipedia: Jython](https://en.wikipedia.org/wiki/Jython)
- [Wikipedia: Webhook](https://en.wikipedia.org/wiki/Webhook)
- [Esri webhook samples, Java](https://github.com/Esri/webhooks-samples/tree/master/Developer/java)
- [Webhook data](./Webhook-data.md)
- [REST API](../../../../API/REST-API.md)

## How to use it

### Using Wekan REST API

With Jython, you can use Wekan REST API [like with Python](../../../../API/New-card-with-Python3-and-REST-API.md)

### Global Webhooks

For Global Webhooks in Admin Panel, Wekan sends all events in all boards to webhook URL, like add card. Although, sending some messages for some events is not yet implemented, more could be added later.

Data is sent in [this kind of JSON format](./Webhook-data.md).

[You can receive webhook data in Java like this](https://github.com/Esri/webhooks-samples/tree/master/Developer/java).

Then for each received data, your code can read content and based on incoming data call Wekan REST API, some Java interface, etc.

Outgoing Webhooks can also go to Slack, RocketChat, NodeRED, PowerShell etc. See right menu webhook links when scrolling down wiki page [Wekan documentation](../../../../README.md)

If you call some Java interface that returns some data, you can then write that data to Wekan card with Wekan REST API.

**Point a webhook at your Java receiver:**

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

 - [Fix bare wiki-style links to relative paths of existing docs pages](https://github.com/wekan/wekan/commit/7b66884ba3e1206aea6e0cf57507cceffa5c91bf)
 - [Add the docs from the wekan.wiki, this page among them](https://github.com/wekan/wekan/commit/73ae73d4c38640e9daedbe8ef9e5b25b877ee804)
