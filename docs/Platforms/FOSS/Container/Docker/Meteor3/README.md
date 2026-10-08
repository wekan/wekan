# Meteor 3 WeKan: Hosting many WeKan kanban, websites, etc

## 1) Install WeKan exactly like this

Use all settings and config files at this page and subdirectories.

### Caddy, CloudFlare and the proxy headers

[caddy/Caddyfile](caddy/Caddyfile) is the Caddy config for this setup: many WeKan
Docker containers, Sandstorm and websites behind one Caddy. Each WeKan container
is a few lines:

```
wekan.customer.com {
	import cloudflare_tls               # only when CloudFlare proxy is on
	import wekan_headers_google wekan.customer.com
	import wekan_well_known
	import wekan_proxy 3001             # the container's PORT
}
```

- **CloudFlare proxy on (orange cloud):** `import cloudflare_tls` loads the
  CloudFlare Origin Certificate from `/etc/caddy/certs`, with CloudFlare SSL/TLS
  set to "Full (strict)". Also disable "HTTP/2 to Origin" and caching, see the
  [cloudflare](cloudflare) screenshots.
- **CloudFlare proxy off (grey cloud):** leave `cloudflare_tls` out, and Caddy gets
  a Let's Encrypt certificate itself.
- **Who the visitor is:** the global options trust CloudFlare's published address
  ranges, and only those, to say who the visitor is (`CF-Connecting-IP`). A
  request from anywhere else, including grey cloud sites, uses its own connecting
  address, so a forged header is ignored. Refresh the ranges from
  <https://www.cloudflare.com/ips-v4> and <https://www.cloudflare.com/ips-v6>
  when CloudFlare changes them.
- **What WeKan receives:** `wekan_proxy` sends `X-Forwarded-Proto: https` and the
  visitor's address as the only `X-Forwarded-For` and `X-Real-IP` value. Caddy
  passes `Host` and `X-Forwarded-Host` unchanged.
- **`HTTP_FORWARDED_COUNT=1` in every container** (already in
  [restore/docker-end.yml](restore/docker-end.yml)). Without it WeKan sees every
  visitor as the proxy's `127.0.0.1`. All users then share the login cookie
  refresh limit of 30 per 10 seconds per address, so at busy times users are
  signed out, and a Google login returns to the sign-in page.
- **Google login (OAuth2/OIDC):** keep `OAUTH2_LOGIN_STYLE=redirect`, the
  default (set it explicitly on WeKan versions that defaulted to `popup`), and
  open WeKan only at its `ROOT_URL`. Google's sign-in pages can break the popup
  login style, and a login started at any other address cannot finish.

Sandstorm behind the same Caddy: [Sandstorm](../../Sandstorm/README.md#sandstorm-cloudflare-dns-settings).

## 2) Backup your previous WeKan server

See backup scripts etc, mongodump and files directory

## 3)  Restore to your new WeKan install

Use restore scripts to mongorestore and restore files (attachments and avatars) 

## 4) Move all files from MongoDB to filesystem

This will speed up loading attachments a lot.

1. Admin Panel / Attachments
2. Default Storage: Filesystem
3. Move Files: From MongoDB CollectionFS to Filesystem
4. Move Files: From MongoDB Meteor-Files to Filesystem
5. MongoDB GridFS Storage: Compact Database (this will make MongoDB disk usage smaller)

----

# Migrating from Snap to Docker

Note: Only `Oplog sockjs` works with multitenancy, see [multitenancy.md](multitenancy.md).
For the alternatives to running one Node.js server per tenant — one server for
many `ROOT_URL`s, and what each option costs — see
[Multitenancy design](../../../../../Design/Multitenancy/Multitenancy.md).

Migrating from Parallel Snap setup, because `snap set wekan root-url=...`
etc commands are slow to run, and did not get Parallel Snap working properly yet.

```
caddy proxy: Let's Encrypt and CloudFlare TLS to localhost http ports
  |
  |==> Many Parallel WeKan Snap Containers at different ports,
  |    each Container with it's own Node.js/MongoDB
  |==> Sandstorm, many websites with WordPress and Hackers CMS
  |==> PHP/MySQL WordPress     (example)
  |==> PHP/MySQL Hesk Helpdesk (example)
  |==> PHP/MySQL Kanboard      (example)
  |==> Static websites         (example)
```
To this Docker setup:
```
caddy proxy: Let's Encrypt and CloudFlare TLS to localhost http ports
  |
  |==> Many Docker Meteor 3 WeKan Node.js Containers,
  |    Uses changeStreams and DDP_TRANSPORT=sockjs
  |     |
  |     |=> One MongoDB without container,
  |         always requires password to login,
  |         for admin and each other users,
  |         each user has it's own database, username and password
  |
  |==> Sandstorm, many websites with WordPress and Hackers CMS
  |==> PHP/MySQL WordPress     (example)
  |==> PHP/MySQL Hesk Helpdesk (example)
  |==> PHP/MySQL Kanboard      (example)
  |==> Static websites         (example)
```
Save all Parallel Snap container settings with:
```
snap-save-settings.sh
```
For setting up MongoDB etc, use examples at `apt` directory.

MongoDB config `/etc/mongod.conf` is at `mongo` directory.

Create MongoDB key:
```
./keys.sh
```
After installing `mongo/mongod.conf` and starting MongoDB, initialize its
single-node replica set. The command is idempotent and waits for a writable
primary:
```
./mongo/init-replica-set.sh
```
1) Adding new user, it saves MongoDB connection string to username.txt:
```
./1createdb.sh username
```
Same username.txt is used when login to database, backup, restore, files transfer, etc.

You can connect to database:
```
./sh.sh username
```
Or sometime make Backup to `backup/username/YYYY-MM-DD_HH-MM-SS/`
```
./backup.sh username
```
2) Create docker-compose.yml to `restore/username/`
```
./2docker.sh username
```
Edit docker-compose.yml and start Docker container:
```
cd restore/username/

nano docker-compose.yml

docker compose up -d
```
3) Restore database
```
./3restoredb.sh username
```
4) Transfer attachments and avatars from Snap server to Docker server:
```
./4files.sh username
```
5) Restart Docker container:
```
cd restore/username/

docker compose stop

docker compose start
```
6) Upgrade WeKan from old version to new version, for example:
```
./update-wekan-version.sh 9.10 9.11
```
