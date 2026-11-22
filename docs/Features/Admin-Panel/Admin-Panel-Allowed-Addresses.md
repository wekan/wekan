# Admin Panel allowed addresses

## What it is

A list of the IPv4 and IPv6 addresses, and address ranges such as
`192.168.1.0/24` or `2001:db8::/32`, from which the Admin Panel and the admin
REST API can be used. It is in **Admin Panel / Settings / Privacy and security
/ Allowed addresses**. An empty list - the default - is any address.

When the list is set, a site administrator at any other address is a member
like any other:

- every admin-only method, publication and REST endpoint refuses them, as it
  refuses a member;
- the Admin Panel's panes are empty, and its tabs say why: *The Admin Panel
  cannot be used from your address 203.0.113.7.*;
- their own boards, cards and everything else a member does keep working.

Members are not affected at all, from any address.

## Read more

- [Cloud Panel](Cloud-Panel.md) - its *Allowed addresses* are the same rules
  for Cloud Admins signing in at the Cloud Panel's address, and this list
  shares their code (`models/lib/cloudAddresses.js`).
- [Security report](Problems/Security-Report.md) - where refused attempts are counted.
- [Settings enforced on the server](Settings-Enforced-On-Server.md).
- [Metrics](../General/Metrics.md) - `METRICS_ALLOWED_IP_ADDRESSES` is a separate list
  for `/metrics` only.

## How to use it

1. Open **Admin Panel / Settings / Privacy and security**.
2. Under **Allowed addresses**, write the addresses and ranges, one per line
   (commas and spaces work too):

   ```
   192.168.1.0/24
   10.8.0.5
   2001:db8::/32
   ```

3. **Save**. The page shows *Your address now* - the address the server sees
   you at - and warns before saving when that address is not in the list. The
   server refuses such a list too, so you cannot lock yourself out by saving.

A range is saved with its host bits cleared: `192.168.1.7/24` is saved as
`192.168.1.0/24`. At most 200 entries.

### Behind a reverse proxy

The address is the one every other WeKan guard uses: the connection's own
address, or the `X-Forwarded-For` address that `HTTP_FORWARDED_COUNT` says
your proxies add. Set `HTTP_FORWARDED_COUNT` (for example `1` behind one
Caddy or nginx), or every user is seen at the proxy's address. Without it a
forged `X-Forwarded-For` is ignored.

### The server's own setting, and the way back in

The environment variable `ADMIN_PANEL_ALLOWED_IP_ADDRESSES` wins over the
Admin Panel list:

| Value | Effect |
| --- | --- |
| unset or empty | the Admin Panel list decides |
| `192.168.0.0/16,2001:db8::/32` | this list decides, whatever the Admin Panel says |
| `any` | no restriction, whatever the Admin Panel says |

`any` is the way back in when the list no longer has your address (a new
office network, a changed VPN): set it, restart WeKan, fix the list in the
Admin Panel, and unset it again. An entry that is not an address or a range
matches nothing, so a mistyped variable refuses rather than allows; the
server log names the entries it could not read.

It is listed on every platform: Docker and docker-compose (`environment:`),
the snap (`sudo snap set wekan admin-panel-allowed-ip-addresses='any'`),
`start-wekan.sh` / `start-wekan.bat`, and the Helm chart's `env`.

## How the numbers are calculated

An administrator's refused attempt from another address is one row in
**Admin Panel / Problems** under *Admin Panel allowed addresses*
(`authz.admin-panel-address`), counted once per method call, publication or
REST request however many checks it made, with the account and the address
in the actor tally. It is recorded when an admin check asked for the caller
as an administrator and the list said no, or when one of the audited admin
methods (the ones in Admin Panel / People / Audit log) was called. A member's
ordinary use is never recorded. The account is never disabled for it: it is
the administrator's own account, and their boards still work from there.

## How it works in WeKan

- **One place.** Every admin check of WeKan - the methods, the publications,
  the allow rules of the Admin Panel's collections and the REST API's
  `Authentication.checkUserId` - decides from the caller's user document, read
  through `Meteor.users.findOneAsync` (`Meteor.userAsync`,
  `ReactiveCache.getUser` and the allow rules all end there).
  `server/adminPanelAddresses.js` applies the list at that read: for a site
  administrator at an address the list does not have, their own document
  reads `isAdmin: false`, and a query that asks about `isAdmin` answers as it
  would for a member. Other administrators read as they are. No admin method
  has to remember to ask, and a new one cannot forget.
- **Who is asking** is the DDP method or publication running (with the
  connection's address), else the HTTP request running
  (`server/lib/requestReportContext.js`), with its bearer token, cookie or
  `?authToken=` login. A request whose login is not known yet reads nobody as
  an administrator. Server work with no caller - startup, timers, background
  jobs - is not restricted. Signing in is not an admin action and reads the
  stored flag, because OIDC and LDAP logins write it back.
- **The list** is stored in the settings document and never published. It is
  read and saved through the site-admin methods
  `getAdminPanelAllowedAddresses` and `saveAdminPanelAllowedAddresses`; a
  browser write of the field is denied, so the lockout check cannot be
  skipped. Saving is in the audit log. Another server of the same database
  sees a change within five seconds.
- **The rules** - IPv4, IPv6, CIDR ranges, an IPv4-mapped IPv6 address
  (`::ffff:192.168.1.5`) read as the IPv4 address it carries - are the Cloud
  Panel's, in `models/lib/cloudAddresses.js`; `models/lib/adminPanelAddresses.js`
  adds the environment override, the lockout check and the query rewrite, and
  is pure, so the browser's warning and the server's refusal are the same
  code.
- **Tests:** `tests/adminPanelAddresses.test.cjs` - the address and range
  rules, `HTTP_FORWARDED_COUNT`, the environment override, the lockout, the
  rewritten queries evaluated against users, and the negative tests: no admin
  check of the caller reads users through a cursor or the raw collection, no
  server code reads a user synchronously, the list is never published, and
  every locale has the strings with `__address__` untouched.

## Commits

- [Admin Panel allowed addresses: from any other address the Admin Panel and the admin REST API refuse](https://github.com/wekan/wekan/commit/7f1226454209424d534326e499918a7e26206d74)
