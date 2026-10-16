# Outgoing requests through a proxy

Outgoing webhooks, and WeKan's other outgoing requests (imports, avatar
downloads, list sync), can go through an HTTP proxy such as Squid (#1455). Set
the variables most programs use:

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

## What the proxy cannot change

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

Code: `server/lib/outboundProxy.js` (which proxy), `server/lib/ssrfGuard.js`
(the connection). Tests: `tests/outboundProxy.test.cjs`, with a real proxy on
the loopback interface.
