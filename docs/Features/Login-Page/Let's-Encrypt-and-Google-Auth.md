# Let's Encrypt and Google Auth

## What it is

This is a way to put WeKan behind the Caddy web server, which gets a free
HTTPS certificate from Let's Encrypt automatically, and optionally behind
proxybouncer, an HTTP proxy that lets through only people who signed in with
a Google account whose email matches an allowed pattern. It is a reverse proxy
setup, not WeKan code: WeKan still asks for its own login after it.

Tested on Ubuntu 16.04 based distro. Wekan installed with
[Export Docker Mongo Data](../../Platforms/FOSS/Container/Docker/Export-Docker-Mongo-Data.md).

## Read more

- [Let's Encrypt at Wikipedia](https://en.wikipedia.org/wiki/Let%27s_Encrypt)
  and [letsencrypt.org](https://letsencrypt.org/)
- [Reverse proxy at Wikipedia](https://en.wikipedia.org/wiki/Reverse_proxy)
- [Caddy](https://caddyserver.com), its
  [automatic HTTPS](https://caddyserver.com/docs/automatic-https) and the
  [reverse_proxy directive](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy)
- [proxybouncer](https://www.npmjs.com/package/proxybouncer)
- WeKan's own logins that can replace proxybouncer:
  [Google and other OAuth providers](OAuth-Providers.md),
  [OAuth2 / OIDC](OAuth2.md) and [Header Login](Header-Login.md)

## How to use it

**A) Let's Encrypt support, without Google Auth**

1. https://caddyserver.com config Caddyfile:
   ```bash
   my.domain.com {
     reverse_proxy localhost:8080
   }
   ```
2. Depending with what user you use to run Caddy, adding privileges to that
   user:
   ```bash
   sudo setcap cap_net_bind_service=+ep ./caddy
   ```

**B) Caddy Let's Encrypt => Google Auth only allowed email addresses => Wekan**

1. https://caddyserver.com config Caddyfile:
   ```bash
   my.domain.com {
     reverse_proxy localhost:7000
   }
   ```
2. Depending with what user you use to run Caddy, adding privileges to that
   user:
   ```bash
   sudo setcap cap_net_bind_service=+ep ./caddy
   ```
3. Adding Google Auth, so only those email addresses can login:
   https://www.npmjs.com/package/proxybouncer
4. Create nologin user for proxybouncer:
   ```bash
   useradd -M proxybouncer
   usermod -L proxybouncer
   ```
5. /etc/systemd/system/proxybouncer.service:
   ```bash
   [Unit]
   Description=Proxybouncer

   [Service]
   ExecStart=/usr/local/bin/proxybouncer
   Restart=always
   RestartSec=5                       # Restart service after 10 seconds if node service crashes
   StandardOutput=syslog               # Output to syslog
   StandardError=syslog                # Output to syslog
   SyslogIdentifier=proxybouncer
   User=proxybouncer
   Group=proxybouncer
   Environment=PORT=7000 MY_URL=https://my.domain.com PROXY_TARGET=http://localhost:8080 GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... ALLOWED_EMAILS=.*@domain.com$ COOKIE_SECRET=...

   [Install]
   WantedBy=multi-user.target
   ```
6. Enable proxybouncer service:
   ```bash
   sudo systemctl enable proxybouncer
   sudo systemctl start proxybouncer
   ```

Question: Does this setup imply that everyone will be logged in to Wekan as
'proxybouncer'? Is there a way to pass username from Google via headers, etc.?

Answer: First login to Proxybouncer can limit login domain of G Suite. Second
login is using Wekan username and password. When this was written there was
no integrated login for standalone Wekan like there is for
https://sandstorm.org. Current WeKan has one: **Sign in with Google**
([OAuth providers](OAuth-Providers.md), with
`OAUTH_PROVIDERS_ALLOWED_EMAIL_DOMAINS` to allow only your domain) signs in
directly with the Google account, and [Header Login](Header-Login.md) signs in
as the user a trusted proxy names in a header.

## How the numbers are calculated

This setup has no numbers in WeKan. The ports are the example's: Caddy on 443
(hence `cap_net_bind_service`), proxybouncer on 7000, WeKan on 8080; `RestartSec=5`
restarts proxybouncer 5 seconds after it stops.

## How it works in WeKan

Nothing in WeKan is specific to it: Caddy terminates HTTPS and forwards to
proxybouncer or WeKan. WeKan's `ROOT_URL` must be the public
`https://my.domain.com` address. The Caddyfile examples are Caddy 2
(`reverse_proxy`); see [Caddy](../../Platforms/Webserver/Caddy.md).

## Commits

 - [Caddyfile examples are Caddy 2](https://github.com/wekan/wekan/commit/37d23976034ba10886956e92ca57ebc599c5fb89)
 - [Add Google and other OAuth provider logins, which replace proxybouncer's Google check](https://github.com/wekan/wekan/commit/83d2a7fc753d1790a2f166b04e470801fe114ced)
 - [Restrict OAuth login providers to email domains](https://github.com/wekan/wekan/commit/fe609114087165dd3c4fa1b29075e9c19f4bcc9c)
