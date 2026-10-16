# Outgoing webhooks to Node-RED

([#2017](https://github.com/wekan/wekan/issues/2017))

WeKan sends a board's changes to a URL as HTTP POST requests with a JSON body
([Webhook data](Webhook-data.md)). Node-RED receives them with an **http in**
node.

## In Node-RED

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

## In WeKan

Board menu → Integrations (Outgoing Webhooks) → the Node-RED URL, for example
`https://nodered.example.com/wekan`. Every board has its own webhooks.

## Where Node-RED may be

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

## The other direction

To change WeKan from Node-RED - add a card, move it - use the
[REST API](../../../../API/REST-API.md) with an **http request** node and a login
token.
