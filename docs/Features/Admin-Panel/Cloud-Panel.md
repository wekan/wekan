# Cloud Panel

The Cloud Panel is the hosting operator's page for many WeKan customer
domains: `customer1.wekan.team`, `wekan.customer.com`, ... It is on a domain of
its own (for example `cloud.wekan.fi`), and it looks like the Admin Panel: a
left menu and a pane beside it.

[Weddy](https://github.com/wekan/weddy) has a Cloud Panel too, in Go
(caddy-wekan-plugin), with the same Domains columns, so the two read alike.

## Turning it on: the CLOUD environment variable

The Cloud Panel exists **only** where the server has the environment variable
`CLOUD` set to the panel's domain:

```
CLOUD=cloud.wekan.fi
```

There is no other way to turn it on. Its domain is not a setting in the
browser, in the database or in the REST API, and it cannot be added or changed
from any of them. Without `CLOUD` - the case of every ordinary WeKan - there is
no Cloud tab, no Cloud page, and every `cloudPanel*` method is refused and the
attempt is recorded in **Admin Panel / Problems** (CloudPanelBleed, below).

The panel keeps the database passwords of the customers' WeKan containers and
connects to those databases, so it is typically a **WeKan container of its
own**, whose purpose is exactly that: to manage the customers' WeKan
containers. Point the `CLOUD` domain at that container (the Caddy pane below
writes that route too).

Until 2026-11-22 the panel's domain and its SuperAdmin were set in **Admin
Panel / People / Cloud** by any site administrator. A customer is the
administrator of their own WeKan, so a customer could turn the panel on in
their own container and make its server connect to MongoDB servers on the
internal network, with credentials they chose. That pane is gone; a domain
stored there then is read by nothing.

## The Cloud Admins

In the Cloud Panel's container, the **site administrators are the Cloud
Admins** - and the first account registered there is a site administrator, as
in every WeKan. So: start the container with `CLOUD`, register, and you are its
Cloud Admin. A disabled account is no Cloud Admin, and neither is a customer's
account (below), whatever it says about itself.

At the `CLOUD` address a Cloud Admin has **Admin Panel / Cloud**
(`/admin/cloud/domains`): a tab beside Settings, People, Attachments and
Problems, shown only when `CLOUD` is set and only to a Cloud Admin at that
address. The front page `/` opens it. Every method checks the host again on the
server, so a customer domain never shows the panel, whoever is signed in.

### Domains

A table of the customer domains ([Table](../Table.md)): **Domain**,
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

**Customers who sign in here** lists the usernames (and the customer e-mail
address) of the customer's own WeKan that may sign in to the panel - see
*The customer login* below.

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
invoice itself. A Cloud Admin records them - also the ones from before the
panel. They are kept in the `cloudInvoices` collection.

### Tickets and Chat: the support board

Each customer domain has a **support board**, an ordinary WeKan board called
`Support: <domain>`, made when a Cloud Admin saves the domain or when its
customer first signs in:

| List | What it holds |
| --- | --- |
| **Open**, **In progress**, **Done** | the support **tickets**, one card each |
| **Chat** | one card, whose comments are the **support chat** |

**Tickets** shows the three lists side by side, as Board View / Lists shows a
board; a customer adds a ticket (it goes into Open), and a Cloud Admin moves it
on. **Chat** shows the chat card's comments - the same messages Board View /
Chat shows on the board itself, where a card is a channel and its comments are
the messages. Both panes have **Open the support board**, which opens the
board in WeKan, with all its views.

Who is on the board, and as what:

| Who | Role | Why |
| --- | --- | --- |
| the Cloud Admins | **Board admin** | everything |
| the domain's customers | **Comment only** | they read every ticket and comment and write in the chat; they cannot create, edit, move, archive or delete a card, nor manage the board |

*Comment only* is the strongest of the nine roles
([Roles](../Board-Sidebar/Members/Roles.md)) that cannot delete, archive or
move a card: *Normal* could archive and move the tickets, a *Worker* could move
them. Adding a ticket is the one write a customer makes, and the panel's own
method makes it for them - one card, into Open. A customer the domain no
longer lists is no longer a member.

The chat of the earlier panel (`cloudChatMessages`) is moved once into the
chat card, with each message's time, and marked as moved. **Import earlier
conversations** brings in a Rocket.Chat export (`.zip`, from "Download my data"
or the CSV importer's zip) or a Sandstorm SandChat grain backup (`.zip`) into
the chat card, with each message's room, author and time - the same readers the
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

The Caddyfile of the panel and every domain: the `CLOUD` domain and each
shared domain to this WeKan, each domain with its own database to its
container, only within its dates. **Show Caddyfile** shows it; **Load into
Caddy** sends it to Caddy's admin API (`http://caddy:2019/load`).

### Allowed addresses

The IPv4 and IPv6 addresses, and address ranges such as `203.0.113.0/24` or
`2001:db8::/32`, from which a Cloud Admin may sign in at the `CLOUD` address,
one per line. **Empty: any address.**

When the list is set, a Cloud Admin's login from any other address is refused -
every kind of login, so an earlier session is refused too when it reconnects -
and every Cloud Admin method called from elsewhere is refused. Each refused
login is recorded in Admin Panel / Problems. Customers are not limited by it.

The address is the client's, as every other login guard of WeKan reads it: the
connection's own address, and `X-Forwarded-For` only as far as
`HTTP_FORWARDED_COUNT` says how many proxies to trust. Behind Caddy, set
`HTTP_FORWARDED_COUNT=1`. An IPv4 client of a dual-stack socket
(`::ffff:203.0.113.7`) is its IPv4 address.

The pane shows **your address now**, warns while you type a list that does not
have it, and the server **refuses to save** such a list: saving it would lock
you out at once.

**Locked out anyway** (your address changed): restart the container with
`CLOUD_ADMIN_ANY_ADDRESS=true`, which sets the list aside, sign in, fix the
list, and restart without it. Or clear the list in the database:

```
mongosh wekan --eval 'db.cloudSettings.updateOne({ _id: "cloud" }, { $unset: { allowedAddresses: "" } })'
```

## The customer login

A customer whose domain has **its own WeKan and database** signs in at the
`CLOUD` address with the **password they have in their own WeKan**, and as the
name **`username_customerdomain`** - their username there, an underscore, and
their domain, for example `anna_customer1.example.com`. So the same username at
two domains is two customers: the part after the last underscore picks the
domain, and only that domain's database is asked about the username before it.
The panel's account for them has the same name. A bare username (or the
customer e-mail address) also works while exactly one domain lists it. The panel checks the password directly against that
customer's database - the password hash in `users.services.password`, with the
same bcrypt or Argon2 that Meteor's accounts-password uses there, and the
customer's two-factor code when their account has one.

It does that only:

- when `CLOUD` is set, at the `CLOUD` address;
- for a name the domain lists - **Customers who sign in here**, or its
  customer e-mail address. A name no domain lists is not looked up anywhere: no
  customer's database is ever searched for a stranger, and a bare name two
  domains list is refused rather than guessed - `username_customerdomain`
  says which one;
- when no account of the panel's own has that name. A Cloud Admin always signs
  in with the panel's own password, and no customer database can stand in for
  it;
- for an account that is not disabled in the customer's own WeKan and has a
  password there (an LDAP or OAuth account has none, and is refused).

On success the customer has an account at the panel, made the first time: not
an administrator, with **no password of its own** (every login asks the
customer's database again), marked `services.cloudCustomer` with the domain and
their account there. With it they see exactly their own domain - never another
domain that lists a name like theirs:

- **Info** - the domain, its customer name, Start and End Date, and its kind;
- **Invoices** - their own, and whether and when each was paid;
- **Tickets** and **Chat** - their domain's support board.

A customer of a domain that **shares this WeKan** has an account here already,
and signs in with it; a domain lists them by username or by its Customer or
Billing e-mail address.

## No REST API at the CLOUD address

At the `CLOUD` address there is no REST API for anybody who is not signed in:

- `POST /users/login` and `/users/register` are not there at all - signed in or
  not, since both are ways of getting a login;
- every other `/api/...` and `/users/...` request without a login is answered
  *404 There is no REST API at this address*, and recorded in Admin Panel /
  Problems.

So the panel has no sign-in but its own page, with its brute-force brakes and
its allowed addresses. A signed-in Cloud Admin's own exports, which carry their
login, still work. Every other host name of the container - and every WeKan
without `CLOUD` - is unchanged.

The inbound email and bounce webhooks are `/api/` addresses too, and they are
not at the `CLOUD` address either: the panel turns no email into cards and
sends nothing that bounces. A mail provider that must post to this container
posts to another host name of it.

## CloudPanelBleed: what Admin Panel / Problems shows

| Key | When |
| --- | --- |
| `authz.cloud-panel-off` | a Cloud Panel method called on a WeKan without `CLOUD` |
| `authz.cloud-panel-access` | a Cloud Admin method called at the `CLOUD` address by somebody who is not a Cloud Admin there, or the old domain setting asked for |
| `authn.cloud-admin-address` | a Cloud Admin login from an address not in the allowed addresses |
| `authn.cloud-rest-off` | the REST API at the `CLOUD` address without a login |

None of them disables the account: the call is refused, and the record is
there for the administrator to see. Asking whether there is a panel at all
(`cloudPanelWhoAmI`, which every page load asks) is not an attempt and is not
recorded.

## Code

| | |
| --- | --- |
| `models/lib/cloudPanel.js` | the rules, as pure functions: the CLOUD gate, domains, databases, who is who, the customer login's decisions, the support board's members, the REST gate, the Caddyfile, the DNS plan, invoices, chat, the import's accounts and ids |
| `models/lib/cloudAddresses.js` | the allowed addresses: IPv4, IPv6, CIDR |
| `models/cloudPanel.js` | the collections `cloudSettings`, `cloudDomains`, `cloudInvoices`, `cloudChatMessages` - no client writes, no publications |
| `server/cloudPanel.js` | the methods, with who may call them, on which host; the customer login handler; the allowed-addresses login check |
| `server/apiMiddleware.js` | `cloudHostRestGate`: no REST API at the CLOUD address without a login |
| `client/components/cloud/cloudPanel.*` | Admin Panel / Cloud and the customers' /cloud |
| `tests/cloudPanel.test.cjs` | the rules; `tests/cloudAddresses.test.cjs` the addresses; `tests/cloudPanelAccess.test.cjs` who may do what, the customer login, the support boards, the import, CloudFlare, Caddy and the chat import; `tests/cloudPanelGate.test.cjs` that the only MongoClient built from data that is not the environment is behind the gate; `server/lib/tests/cloudPanel.security.tests.js` the real server without CLOUD; `tests/playwright/specs/cloud-panel.e2e.js` the browser |
