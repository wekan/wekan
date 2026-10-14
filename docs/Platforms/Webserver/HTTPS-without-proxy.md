# HTTPS in WeKan itself, without a proxy

WeKan can serve HTTPS itself (#916). A proxy in front of it (Caddy, nginx,
Apache, Traefik) remains the recommendation for production: it renews
certificates, compresses, and can serve several sites. For a small install, a
test setup or a closed network, the certificate can go to WeKan directly.

| Variable | What it does |
| --- | --- |
| `HTTPS_PORT` | the port to serve HTTPS on, e.g. `8443` or `443`; HTTPS is off without it |
| `HTTPS_CERT_FILE` | the certificate, with its chain: a file path, or the PEM text itself |
| `HTTPS_KEY_FILE` | its private key: a file path, or the PEM text itself |
| `HTTPS_BIND_IP` | the address to listen on; default `BIND_IP`, else all |
| `HTTPS_REDIRECT` | `true`: plain-HTTP requests get a redirect to HTTPS instead of the page |

Set `ROOT_URL` to the `https://` address too, so links in emails use it.

WeKan keeps serving plain HTTP on `PORT`. With `HTTPS_REDIRECT=true`, every
request there is redirected to `ROOT_URL` when that is an `https://` address,
otherwise to the same host on `HTTPS_PORT`. To serve HTTPS only, bind `PORT` to
`127.0.0.1` with `BIND_IP`.

A port below 1024, such as 443, needs the right to bind it, for example
`setcap 'cap_net_bind_service=+ep'` on the `node` binary, or a container that
publishes it.

**Renewing the certificate.** When the files at `HTTPS_CERT_FILE` or
`HTTPS_KEY_FILE` change, WeKan loads them within a minute, without a restart.
So `certbot renew` or `acme.sh` can renew them in place. If the new files
cannot be read, WeKan keeps serving the old certificate and logs why.

Example, Let's Encrypt with certbot:

```
HTTPS_PORT=443
HTTPS_CERT_FILE=/etc/letsencrypt/live/wekan.example.com/fullchain.pem
HTTPS_KEY_FILE=/etc/letsencrypt/live/wekan.example.com/privkey.pem
HTTPS_REDIRECT=true
ROOT_URL=https://wekan.example.com
```

Snap: `snap set wekan https-port=443 https-cert-file=… https-key-file=…`. The
snap's own Caddy (`caddy-enabled`) is the alternative, and only one of them
can use port 443.

**How it works.** Meteor's HTTP server is what pages, DDP and its websockets
attach to. WeKan does not replace it: a TLS listener accepts encrypted
connections and gives each decrypted connection to that same server. Everything
works the same over HTTPS as over HTTP, including the live updates.

Code: `models/lib/httpsConfig.js`, `server/lib/httpsBridge.js`,
`server/httpsServer.js`. Test: `tests/httpsServer.test.cjs`. It runs with a
real certificate, checks a page and a websocket upgrade, swaps the certificate
without a restart, and covers the refusals.
