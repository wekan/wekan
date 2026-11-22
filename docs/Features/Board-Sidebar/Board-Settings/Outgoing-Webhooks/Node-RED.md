# Outgoing webhooks to Node-RED

## What it is

([#2017](https://github.com/wekan/wekan/issues/2017))

WeKan sends a board's changes to a URL as HTTP POST requests with a JSON body
([Webhook data](Webhook-data.md)). Node-RED receives them with an **http in**
node.

## Read more

- [Wikipedia: Node-RED](https://en.wikipedia.org/wiki/Node-RED)
- [Node-RED: HTTP in node](https://nodered.org/docs/user-guide/nodes#http-in)
- [Webhook data](Webhook-data.md)
- [Proxy](Proxy.md)

## How to use it

### In Node-RED

1. Add an **http in** node: Method `POST`, URL `/wekan`.
2. Connect it to an **http response** node (status 200), so WeKan gets an
   answer, and to a **debug** node to see what arrives. The payload is
   already parsed JSON: `msg.payload.description`, `msg.payload.card`,
   `msg.payload.board` and so on.
3. Click **Deploy**. A change that is not deployed receives nothing.

Test it from the WeKan server, not from your desktop:

```
curl -X POST -H 'Content-Type: application/json' -d '{"text":"test"}' https://nodered.example.com/wekan
```

### In WeKan

Board Settings → Outgoing Webhooks → the Node-RED URL, for example
`https://nodered.example.com/wekan`. Every board has its own webhooks.

1. Open the board, its right sidebar, then **Board Settings → Outgoing
   Webhooks** (board admins; for every board at once, Admin Panel → Settings
   → Global Webhooks).
2. Write the **Webhook Name**, the **URL** the receiver gave you and, when the
   receiver wants one, the **Token (Optional for Authentication)**.
3. Choose the type (**Outgoing Webhooks**) and under **Send this webhook:**
   either **Every activity** or the activities to send.
4. Click **Create**. A saved webhook can be changed and saved again, or turned
   off with **Disable This Webhook**.

### Where Node-RED may be

WeKan refuses to send a webhook to a private, loopback or link-local address
(127.0.0.1, 10.x, 172.16-31.x, 192.168.x, fe80::, the Docker bridge, ...), so
that a webhook URL cannot be used to reach the server's own network
(SSRF). This is checked again when each request is sent, after the name is
resolved. So:

- Node-RED on `localhost`, on the same LAN, or in another container on the
  same Docker network is **not** reachable from WeKan's webhooks unless it
  is listed as below, and
  `host.docker.internal` does not help either: it is a private address.
- A site administrator can make an exception for Node-RED, and only for
  it: **Admin Panel → Settings → Global Webhooks → Internal destinations**
  lists hosts on WeKan's own network that webhooks may reach, one per line,
  a name or an address, with a port to allow only that port
  (`nodered.lan:1880`). It is empty by default and only site administrators
  see and change it, so a board member still cannot point a webhook inward
  and every other address stays behind the guard. A listed host is called
  directly, without following redirects.
- Or give Node-RED a public address and name (for example behind the same
  Caddy or nginx as WeKan, with HTTPS), and use that name in WeKan.
- An HTTP proxy ([Proxy](Proxy.md)) does not change this: the destination is
  checked before the proxy is used.

The refusals are listed in Admin Panel → Problems.

### The other direction

To change WeKan from Node-RED - add a card, move it - use the
[REST API](../../../../API/REST-API.md) with an **http request** node and a login
token.

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

The internal destinations are `webhookInternalHosts` of the Admin Panel's
settings ([models/settings.js](../../../../../models/settings.js)), saved by site
admins only ([server/webhookInternalHosts.js](../../../../../server/webhookInternalHosts.js)) and read by
[models/lib/internalWebhookHosts.js](../../../../../models/lib/internalWebhookHosts.js):
one host per line, a name or an address, optionally with a port.

## Commits

 - [Outgoing webhooks may reach internal hosts a site admin lists](https://github.com/wekan/wekan/commit/b4d2604e6171d337b309210dbfe349c67bfcc843)
 - [Document webhooks to Node-RED and WeKan on Uberspace 7](https://github.com/wekan/wekan/commit/a0de507143b68d9110fa79e6f9ffe5b822978569)
