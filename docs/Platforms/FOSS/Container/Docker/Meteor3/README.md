# Meteor 3 WeKan: Hosting many WeKan kanban, websites, etc

## The menu: build.sh

Every script here is in one menu, [build.sh](build.sh):

```
./build.sh                      # the menu
./build.sh backup.sh customer1  # one script, from cron or by hand
./build.sh --list               # the scripts it knows
```

Its settings are in `settings.ini` beside it, and are set from the menu's
**Settings**:

| Setting | What it is |
| --- | --- |
| Server | a host name from `~/.ssh/config`, for example `c2` when `ssh c2` signs in with an SSH key. Empty: this machine |
| Directory | where the scripts run on that server, for example `/root/wekan`: the directory with `admin.txt`, the customers' `<name>.txt` and `restore/<name>/` |
| Copy the scripts | yes: before each run, this directory's scripts and templates are copied to the server's directory, so it always runs the version here |

With a server set, **nothing runs on this machine**: every script runs on the
server, over SSH, in its directory. The customers' database passwords stay in
the files the scripts write on the server, and this machine keeps only the
server's name and its SSH key - so the machine you run the menu from holds no
passwords. `settings.ini`, `admin.txt` and the customers' files are never
copied to the server. The menu can also open a shell on the server, in that
directory.

### Limit localhost access to current node.js port and database port only

The containers run with `network_mode: host`, so they share the server's
network: without a limit, one customer's WeKan could open every other
customer's `127.0.0.1:<port>`, and every other local service.
[localhost-limit.sh](localhost-limit.sh), in the menu under **Server setup**,
lets each WeKan container reach on this machine only:

- its own Node.js `PORT`,
- the database port(s) of its `MONGO_URL` and `MONGO_OPLOG_URL`,
- the local DNS resolver, and
- the answers to the connections Caddy makes to it.

Everything else it sends to a local port is rejected. Caddy -> WeKan and WeKan
-> MongoDB work as before, and outgoing internet traffic (mail, webhooks) is
not touched. Which database a container may read is still MongoDB's decision:
each customer's user has rights to its own database only (`1createdb.sh`).

It finds the containers with `docker ps` (names ending in `-app` or `-tenant`)
and reads their `PORT` and `MONGO_URL` with `docker inspect`, falling back to
`restore/<customer>/docker-compose.yml`. It compares them with the ports in
`/etc/caddy/Caddyfile` and `1createdb.sh`, and reports a Caddy port with no
container, or a container that Caddy does not proxy.

```
./localhost-limit.sh plan     # what was found and the rules; changes nothing
./localhost-limit.sh apply    # put the rules in place (root)
./localhost-limit.sh status   # the rules now in place
./localhost-limit.sh remove   # take them away
./localhost-limit.sh --host c2 plan   # the same for the server c2, over SSH
```

**With a server set in the menu's Settings**, this item runs on the machine
the menu runs on, not on the server: the settings - `1createdb.sh`, the
customers' `<name>.txt` and `restore/<name>/docker-compose.yml` - are read
here, in this directory, because they and their passwords need not be copied
to the server. Only what is on the server is reached over SSH: its running
containers and their cgroups, its `/etc/caddy/Caddyfile`, and its firewall -
one SSH call to read them, one to put the rules in place and one to show them.
Without a server, it runs on this machine like every other script.

How: the containers cannot be told apart by address, but each is a cgroup of
its own. The rules are an iptables / ip6tables chain `WEKAN-LOCALHOST`, jumped
to from `OUTPUT -o lo`, that matches each container by its cgroup v2 path
(`-m cgroup --path`). It needs cgroup v2 and iptables 1.6.1 or newer; Ubuntu
26.04 has both (its `iptables` is the nftables one, beside ufw).

**ufw.** ufw guards what comes in from outside - here only http, https and
ssh, ssh with keys only - and it accepts all loopback traffic, between the
processes of the server itself (`ufw-before-output`: `-o lo -j ACCEPT`). That
local traffic is what this limits, so the two do not overlap: ufw keeps the
outside out of the local ports, this keeps each container out of the others'.
The jump to `WEKAN-LOCALHOST` must come before ufw's in `OUTPUT`, so `apply`
inserts it first; `status` says whether it still is. Run `apply` again after
a container is recreated (`update-docker-settings.sh`,
`update-wekan-version.sh`), because it then has a new cgroup, after a reboot,
and after `ufw reload` or `ufw enable`.

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
