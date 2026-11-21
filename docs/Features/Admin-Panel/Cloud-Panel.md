# Cloud Panel

The Cloud Panel is the hosting operator's page for many WeKan customer
domains: `customer1.wekan.team`, `wekan.customer.com`, ... It is on a domain of
its own, the **Cloud Panel Domain** (for example `cloud.wekan.fi`), and it looks
like the Admin Panel: a left menu and a pane beside it.

[Weddy](https://github.com/wekan/weddy) has the same Cloud Panel, in Go
(caddy-wekan-plugin): the same place to turn it on, the same SuperAdmin and the
same Domains columns, so the two read alike.

## Turning it on

**Admin Panel / People / Cloud** (`/admin/people/cloud`), for site
administrators:

- **Cloud Panel Domain** - the panel's own domain;
- **SuperAdmin Username** - the existing WeKan administrator who keeps the
  panel, by username or e-mail address.

Then point the Cloud Panel Domain at this WeKan (the Caddy pane below writes
that route too). At `https://<Cloud Panel Domain>/cloud` - and on its front
page - the SuperAdmin has the panel. Anybody else there, or anybody at another
domain, gets *The Cloud Panel is only for the SuperAdmin, at the Cloud Panel
Domain*. Every method checks the host again on the server, so a customer
domain never shows the panel, whoever is signed in.

## The SuperAdmin's menu

### Domains

A table of the customer domains ([Table](../General/Table.md)): **Domain**,
**Customer name**, **Customer email address**, **Start Date** and **End Date**
- a domain is served from its Start Date to its End Date, both included - and
where its data is. Each domain is one of two kinds:

| Kind | What it is |
| --- | --- |
| **Its own WeKan and database** | The customer's own WeKan container and its own MongoDB database. Caddy routes the domain to the container (`host:port`). |
| **Shares this WeKan** | Served by this WeKan, as an Organization that claims the domain ([Multitenancy](../../Design/Multitenancy/Multitenancy.md), option D): its own branding, its own admins, its boards only for its members. |

Editing a domain also keeps its **MongoDB**: a connection string, or host,
port, database name, username, password, authentication database, replica set
and TLS. A database without a password is fine. The password is written on the
server and never shown again; leaving it empty on an edit keeps it.
**Test connection** counts the database's users, boards and cards.

**Import into this WeKan** turns ten containers and ten databases into one:
it reads the domain's own WeKan database and copies its boards, lists,
swimlanes, cards, comments, checklists, custom fields, activities, rules,
integrations, attachment records and time into this database, under the
domain's Organization, and the domain then shares this WeKan.

- It runs as a **dry run first**: what would be copied, and nothing written;
  **Import now** does it.
- An account with the same e-mail address **is** the account here. Any other is
  created, under its username - with a number added when the username is taken
  - and keeps its password. Nobody imported is an administrator here, and no
  login session comes along.
- A document whose id is already here is left alone and counted.
- The customer's instance settings stay theirs: product name, SMTP and the
  rest are not copied.
- Attachment **files** in GridFS come along; files on the old container's own
  disk or object storage have to be copied there too - the import says how many
  attachments there are.

### Invoices

The hosting invoices of each domain: number, date, due date, amount and
currency, open, paid (and when) or void, a description and a link to the
invoice itself. The SuperAdmin records them - also the ones from before the
panel.

### Chat

A conversation per domain between its customer and the SuperAdmin. **Import
earlier conversations** brings in a Rocket.Chat export (`.zip`, from "Download
my data" or the CSV importer's zip) or a Sandstorm SandChat grain backup
(`.zip`), with each message's room, author and time - the same readers the
board import uses.

### CloudFlare

A **CloudFlare API key** (with DNS edit on the zone; write-only, never shown
again), the **zone ID**, the **address the domains point at** (an IP address
for A/AAAA records, or a host name for CNAMEs) and whether CloudFlare proxies
them. **Check DNS records** shows what would change; **Create and update DNS
records** creates the missing records and points the existing A, AAAA or CNAME
at the target. A record of another kind on the same name is never replaced: it
is reported.

### Caddy

The Caddyfile of the panel and every domain: the Cloud Panel Domain and each
shared domain to this WeKan, each domain with its own database to its
container, only within its dates. **Show Caddyfile** shows it; **Load into
Caddy** sends it to Caddy's admin API (`http://caddy:2019/load`).

## A customer's menu

A WeKan user whose e-mail address is a domain's Customer or Billing email
address - or who is named among its customers - signs in at the Cloud Panel
Domain and sees **Invoices** (their own, and whether and when each was paid)
and **Chat** with the SuperAdmin. Nothing of another domain.

## Code

| | |
| --- | --- |
| `models/lib/cloudPanel.js` | the rules, as pure functions: settings, domains, databases, who is who, the Caddyfile, the DNS plan, invoices, chat, the import's accounts and ids |
| `models/cloudPanel.js` | the collections `cloudSettings`, `cloudDomains`, `cloudInvoices`, `cloudChatMessages` - no client writes, no publications |
| `server/cloudPanel.js` | the methods, with who may call them, on which host |
| `client/components/cloud/cloudPanel.*` | the panel, and the Admin Panel / People / Cloud pane |
| `tests/cloudPanel.test.cjs` | the rules; `tests/cloudPanelAccess.test.cjs` who may do what, the import, CloudFlare, Caddy and the chat import |
