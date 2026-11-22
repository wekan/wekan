# Outgoing requests through a proxy

## What it is

Outgoing webhooks, and WeKan's other outgoing requests (imports, avatar
downloads, list sync), can go through an HTTP proxy such as Squid (#1455). WeKan still decides where
each request may go: the proxy cannot be used to reach an internal address.

## Read more

- [Wikipedia: Proxy server](https://en.wikipedia.org/wiki/Proxy_server)
- [Wikipedia: HTTP tunnel](https://en.wikipedia.org/wiki/HTTP_tunnel), the
  `CONNECT` method
- [Wikipedia: Server-side request forgery](https://en.wikipedia.org/wiki/Server-side_request_forgery)
- [Squid](https://www.squid-cache.org/)
- [Node-RED](Node-RED.md): reaching a host on WeKan's own network

## How to use it

Set the variables most programs use:

| Variable | What it does |
| --- | --- |
| `HTTP_PROXY` | the proxy for `http://` destinations, e.g. `http://squid.example.com:3128` |
| `HTTPS_PROXY` | the proxy for `https://` destinations; WeKan opens a `CONNECT` tunnel through it |
| `NO_PROXY` | destinations that go direct: comma-separated host names (a name also covers its subdomains), `host:port`, addresses, or `*` for all |

The lower-case spellings work too. A proxy that needs a password takes it in
the URL, `http://user:password@squid.example.com:3128`, and WeKan sends it as
`Proxy-Authorization`.

Snap: `snap set wekan http-proxy=…`, `https-proxy=…`, `no-proxy=…`.
Docker: set the variables in the WeKan service's `environment:`.

### What the proxy cannot change

WeKan still decides where a request may go. The destination's name is resolved
once and every address is checked against the blocked ranges (the network
WeKan runs in, loopback, link-local and so on), exactly as without a proxy.
Then the proxy is asked for **that checked address**, never the name:

- an `http://` destination is sent to the proxy as `http://<address>:<port>/…`,
  with the real name in the `Host` header;
- an `https://` destination is a `CONNECT <address>:<port>` tunnel, and TLS
  inside it still checks the certificate against the real name (and trusts
  `WEBHOOK_TLS_CA_CERT`, as without a proxy).

So the proxy cannot be used to reach an internal address. A name that resolves
there is refused before the proxy is asked anything. The proxy also cannot
resolve the name to a different address than the one WeKan checked. The proxy
itself usually sits on an internal address, and that is allowed: it is your
setting, not the webhook's.

## How the numbers are calculated

The proxy has no numbers of its own: it is chosen per request from
`HTTP_PROXY`, `HTTPS_PROXY` and `NO_PROXY`, by the destination's scheme and
host. The limits of the requests themselves (a webhook's 30-second timeout and
its retries) are those of the request that uses the proxy:

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

Code: `server/lib/outboundProxy.js` (which proxy), `server/lib/ssrfGuard.js`
(the connection). Tests: `tests/outboundProxy.test.cjs`, with a real proxy on
the loopback interface.

[server/lib/outboundProxy.js](../../../../../server/lib/outboundProxy.js) decides
which proxy a request uses, and
[server/lib/ssrfGuard.js](../../../../../server/lib/ssrfGuard.js) makes the
connection: it resolves the name, checks every address, and only then asks the
proxy for that checked address.

## Commits

 - [Send outgoing webhooks through an HTTP proxy, with the SSRF checks kept](https://github.com/wekan/wekan/commit/78957e14cb44233622a5bfe8c3e55d2c0a826fba)
