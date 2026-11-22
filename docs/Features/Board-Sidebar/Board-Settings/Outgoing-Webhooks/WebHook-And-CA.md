# Webhooks and certificate authorities

## What it is

A webhook to an `https://` receiver is sent only when the receiver's
certificate is valid. When it is signed by a certificate authority (CA) that
Node.js does not know - a company CA, a self-signed certificate - WeKan has to
be told to trust that CA.

Because NodeJS uses an [hardcoded list of certificates](https://github.com/nodejs/node/issues/4175) if you deploy a site (receiving the webhook from wekan) behind a reverse proxy on https with a Let's Encrypt certificate you may have a problem: Let's Encrypt's CA is not recognized. The correct answer is [here](https://stackoverflow.com/questions/29283040/how-to-add-custom-certificate-authority-ca-to-nodejs/47160447#47160447).

## Read more

- [Wikipedia: Certificate authority](https://en.wikipedia.org/wiki/Certificate_authority)
- [Wikipedia: Let's Encrypt](https://en.wikipedia.org/wiki/Let%27s_Encrypt)
- [Node.js: NODE_EXTRA_CA_CERTS](https://nodejs.org/api/cli.html)
- [Let's Encrypt certificates](https://letsencrypt.org/certificates/)
- [Proxy](Proxy.md)

## How to use it

**Trust a CA for WeKan's webhooks (current WeKan):** set `WEBHOOK_TLS_CA_CERT`
to the certificate of the CA - or the receiver's own self-signed certificate -
either as the PEM text itself or as the path of a file holding it, and restart
WeKan. Certificate checking stays on; only who counts as an issuer changes.

**For the whole Node.js process (the older way, described above):**

* Download the Let’s Encrypt Authority X3 (IdenTrust cross-signed) from [here](https://letsencrypt.org/certificates/)
```sh
cd /etc/ssl/certs
wget https://letsencrypt.org/certs/lets-encrypt-x3-cross-signed.pem.txt -O lets-encrypt-x3-cross-signed.pem
```

* Now start the application with 
```sh
NODE_EXTRA_CA_CERTS=/etc/ssl/certs/lets-encrypt-x3-cross-signed.pem node main.js
```

To send webhooks through a proxy such as Squid, see [Proxy.md](Proxy.md).

## How the numbers are calculated

There are no numbers of its own: `WEBHOOK_TLS_CA_CERT` is read once, when the
first webhook is sent, and a path that cannot be read leaves the default trust
store in place rather than stopping webhooks.

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

`webhookCaCert()` in
[server/lib/ssrfGuard.js](../../../../../server/lib/ssrfGuard.js) reads
`WEBHOOK_TLS_CA_CERT` and gives it to every `https://` webhook request as its
`ca`. Turning verification off (`rejectUnauthorized: false`) was tried once and
removed, because it accepts any certificate, a man in the middle's included.

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

 - [Send outgoing webhooks through an HTTP proxy, with the SSRF checks kept](https://github.com/wekan/wekan/commit/78957e14cb44233622a5bfe8c3e55d2c0a826fba)
 - [Security: trust a certificate instead of disabling verification, and escape every metacharacter](https://github.com/wekan/wekan/commit/032722fcc4c87ec7946e1446865ab4739e49e4f1)
 - [Add the docs from the wekan.wiki, this page among them](https://github.com/wekan/wekan/commit/73ae73d4c38640e9daedbe8ef9e5b25b877ee804)
