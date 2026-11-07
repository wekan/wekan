# Cloud Panel: many WeKan domains from one Weddy

[Weddy](https://github.com/wekan/weddy) is one executable: Caddy with the WeKan,
FerretDB, Gitea and rclone plugins - WeKan written in Go inside it, no Node.js. With the Cloud Panel it replaces the
[Docker multitenancy setup](../Container/Docker/Meteor3/multitenancy.md) - many WeKan
containers behind a Caddy, a CloudFlare origin certificate per site, a port per
customer - with that one binary.

## What runs

```caddyfile
{
	on_demand_tls {
		permission wekan_domains
	}
	wekan {
		data    /var/lib/weddy/files
		primary wekan.team
	}
}
https:// {
	tls {
		on_demand
		get_certificate wekan_cloudflare
	}
	wekan
}
```

Every domain is a WeKan of its own inside the Weddy process, with **its own
directory** and so its own embedded FerretDB database and files:

```
/var/lib/weddy/files/domains/customer.wekan.team/files/db/          its SQLite database (FerretDB)
/var/lib/weddy/files/domains/customer.wekan.team/files/attachments/
/var/lib/weddy/files/domains/wekan.customer.com/files/...
```

A request reaches only the WeKan of its own domain. A customer's WeKan sees its own
boards and users and nothing of any other domain, and has no Cloud menu and no
SuperAdmin options: it is a tenant.

## Setting up

1. Start Weddy with the first domain as `primary`. Its WeKan is the only one with
   **Admin Panel / People / Cloud**
   ([Cloud.md](../../../Features/Admin-Panel/People/Cloud.md)).
2. There, a site admin sets:
   - **Cloud Panel Domain**, e.g. `cloud.wekan.team` - point its DNS at the server;
   - **SuperAdmin Username**, e.g. `lauri.ojansivu@wekan.fi` - a username or an e-mail
     address of a user of that WeKan.
3. The SuperAdmin opens `https://cloud.wekan.team`, signs in, and gets the **Cloud
   Panel**: Settings, with the left menus **Domains** and **CloudFlare**. Anybody else,
   or the SuperAdmin at any other domain, gets "The Cloud Panel is only for the
   SuperAdmin, at the Cloud Panel Domain" - and the server refuses its methods to them.

## Domains

A [table page](../../../Features/General/Table.md) with a form to add and edit a row:

| Column | Example |
|--------|---------|
| Domain | `customer.wekan.team`, `wekan.customer.com` |
| Customer name | |
| Customer email address | |
| Billing email address | |
| Start Date | the first day of the paid hosting year |
| End Date | its last day |
| TLS | what Weddy did: `cloudflare-origin` or `letsencrypt` (a `!` when it failed - hover for why) |

A domain is served from its Start Date to its End Date, both included; a domain
without dates is served. Weddy follows the table within seconds: it opens the
domain's WeKan, and closes it when the row is removed or the End Date has passed - its
directory and data stay.

## CloudFlare

**CloudFlare API key** is a write-only field: the key is saved on the server
(`<data>/cloud/cloudflare.json`, mode 0600) and never sent back to a browser; the
pane only says whether one is saved. The token needs the permissions Zone:Read,
DNS:Edit and SSL and Certificates:Edit.

| The domain's zone | TLS |
|-------------------|-----|
| in the CloudFlare account | Weddy adds a proxied (orange cloud) CNAME to the Cloud Panel Domain, and gets a **CloudFlare Origin certificate** for the domain (renewed 30 days before it ends). Set the zone's SSL/TLS mode to "Full (strict)". |
| anywhere else | the customer points the domain's DNS at the server, and Caddy gets a **Let's Encrypt** certificate the first time it is opened. |

Caddy gets a certificate only for a domain that is in the table and in its hosting
period - nobody can make it ask Let's Encrypt for arbitrary names.

## Between WeKan and Weddy

The Cloud Panel's pages are being written in Go for Weddy's WeKan. Until they are,
the files below are written by hand, or by a Meteor WeKan whose `WEDDY_CLOUD_DIR` is
`<data>/cloud` - the code listed under Code.

| File in `<data>/cloud` | Written by | Read by |
|---------------------------|-----------|---------|
| `domains.json` | WeKan, on every change and at startup | Weddy: which WeKans run, which certificates may be obtained |
| `cloudflare.json` | WeKan (0600) | Weddy, for the CloudFlare API |
| `certs/<domain>.crt`, `.key` | Weddy (0600) | Weddy's TLS |
| `status.json` | Weddy | WeKan's Domains table (the TLS column) |

## Code

| | |
|---|---|
| [models/lib/cloudPanel.js](../../../../models/lib/cloudPanel.js) | the rules: where Cloud exists, who the SuperAdmin is, a valid domain and row, domains.json |
| [server/methods/cloudPanel.js](../../../../server/methods/cloudPanel.js) | the methods, each checking the SuperAdmin at the Cloud Panel Domain again |
| [client/components/settings/cloudPanel.jade](../../../../client/components/settings/cloudPanel.jade) | Admin Panel / People / Cloud, and the Cloud Panel |
| [tests/cloudPanel.test.cjs](../../../../tests/cloudPanel.test.cjs) | the rules, and the security properties the source keeps |
| [wekan/caddy-wekan-plugin](https://github.com/wekan/caddy-wekan-plugin) | Weddy's side: the Go WeKan, a WeKan per domain, the routing, the certificates, CloudFlare |
