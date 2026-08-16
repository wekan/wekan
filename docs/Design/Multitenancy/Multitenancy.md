# Design: Multitenancy — one WeKan server for many domains

Today, hosting *n* customers means running *n* WeKan servers: *n* Node.js
processes, *n* `ROOT_URL`s, *n* databases, *n* upgrades. That is what
[`docs/Platforms/FOSS/Container/Docker/Meteor3/`](../../Platforms/FOSS/Container/Docker/Meteor3)
sets up and it works.

This page designs the **alternatives**: what it would take for **one** WeKan
Node.js process to serve many domains, each with its own `ROOT_URL` and its own
data — and what each alternative costs.

**Option D is implemented.** *Organizations as tenants* ships: an Organization may
claim hostnames, carries its own branding, has its own per-tenant Global Admins,
and can be backed up and restored on its own from the Admin Panel. It is **off
until `MULTITENANCY=true`**, and an instance that never sets it answers exactly as
it did before. (A), (B), (C) and (E) remain designs — (A) is still the supported
topology when customers must not share a process. What each option would cost is
kept below, because choosing (D) is only honest next to what it is *not*.

## Related files

Everything the question touches. Paths are from the repository root.

| File Path | File Type | Description |
| --- | --- | --- |
| `docs/Platforms/FOSS/Container/Docker/Meteor3` | `.md` guide | The shipped topology: Caddy in front, one WeKan container per customer, one MongoDB, one database per customer. |
| `docs/Platforms/FOSS/Container/Docker/Meteor3/multitenancy.md` | `.md` guide | The two supported transports for that topology, and why each instance in one network namespace needs its own internal `uws.port`. |
| `docker-compose-multitenancy.yml` | `.yml` compose file | The working example: per-tenant `PORT`, `ROOT_URL`, `MONGO_URL` database and `uws.port`. |
| `models/lib/universalUrlGenerator.js` | `.js` module | Builds attachment/avatar URLs that do **not** depend on `ROOT_URL`. Already tenant-safe, and the model the rest of the code should follow. |
| `server/routes/universalFileServer.js` | `.js` route | Serves `/cdn/storage/…` for any host. Two `Meteor.absoluteUrl()` calls are the only `ROOT_URL` dependency left in it. |
| `models/boards.js` | `.js` model | `absoluteUrl()` for a board — one of the places a per-tenant root URL has to reach. |
| `server/models/settings.js` | `.js` model + startup | The instance settings document, and the startup that seeds it from `ROOT_URL` and the environment. One document per *instance* today. |
| `imports/reactiveCache.js` | `.js` cache | `getCurrentSetting()` — the single-document read that every pane and mail template goes through. |
| `models/org.js`, `models/team.js` | `.js` models | Organizations and Teams: the tenant-shaped grouping WeKan already has *inside* one instance. |
| `server/lib/orgTeamRestriction.js` | `.js` helper | The one existing rule that keeps two customer groups apart in a shared instance. |
| `models/lib/tenants.js` | `.js` module | **(D)** Pure host → Organization resolution, the `X-Forwarded-Host` trust decision, per-org branding merge, per-tenant root URL. |
| `models/lib/tenantAdmin.js` | `.js` module | **(D)** Pure per-tenant Global Admin rules: who may open which pane, which people and orgs are in scope, what a tenant admin may never write. |
| `models/lib/tenantBackup.js` | `.js` module | **(D)** Pure per-tenant backup scope: which collections, the selector for each, the restore-side ownership guard, where a tenant's archives live. |
| `server/lib/tenantResolver.js` | `.js` server | **(D)** The Meteor glue: the host → org cache, the resolver for HTTP requests and DDP connections, the per-host runtime config hook. |
| `server/methods/tenant.js` | `.js` methods | **(D)** `currentTenant`, the org tenant/branding fields, the site theme (`getAdminThemeColor` / `setAdminThemeColor`), appointing per-tenant Global Admins, listing an org's members. |
| `docs/Features/Page/Theme.md` | `.md` design | **(D)** The shared "Change color" picker and the order of themes: default → site/Organization → user. |
| `server/methods/backup.js` | `.js` methods | **(D)** Per-tenant backup and restore, scoped by `models/lib/tenantBackup.js`. |
| `tests/tenants.test.cjs`, `tests/tenantAdmin.test.cjs`, `tests/tenantBackup.test.cjs`, `tests/tenantWiring.test.cjs` | `.cjs` tests | **(D)** The separation suite: host spoofing, scope, escalation, cross-tenant restore, and that the wiring really calls the rules. |

## What one process would have to solve

Six problems, in the order they bite. Each is answerable in Meteor 3; the cost is
in the fourth and fifth.

### 1. Which tenant is this request?

The `Host` header, and nothing else, distinguishes `a.example.com` from
`b.example.com` when both point at the same process.

- **HTTP**: `WebApp.connectHandlers.use((req, res, next) => …)` — `req.headers.host`
  is a plain Node `IncomingMessage` field.
- **DDP**: `Meteor.onConnection(connection => …)` and `this.connection` inside a
  publication or method. The connection carries `id`, `clientAddress` and
  `httpHeaders` — *whitelisted* headers, [with cookies deliberately excluded][conn].
  `host` is what the tenant lookup needs, and it is there.
- Behind Caddy the honest header is `X-Forwarded-Host`; the proxy must be trusted
  to set it, and WeKan must be told to believe it. A tenant chosen from a header a
  client can forge is a cross-tenant data leak, so this decision belongs in one
  place, once.

### 2. The client bundle carries `ROOT_URL`

Meteor bakes `__meteor_runtime_config__` (with `ROOT_URL` and
`DDP_DEFAULT_CONNECTION_URL`) into the HTML it serves. One process serving two
domains would hand both clients the same one.

Meteor has a hook for exactly this case — it exists *because* one server may need
to serve clients built for different root URLs:

```js
WebApp.addRuntimeConfigHook(({ arch, request, encodedCurrentConfig, updated }) => {
  // return a String to substitute the encoded config, or a falsy value to leave it
});
```

`arch` is `web.browser`, `web.browser.legacy` or `web.cordova`; `request` is the
Node request, so `request.headers.host` picks the tenant. Returning a string
replaces the encoded config — and [the docs are explicit][webapp] that the hook does
not check what you return, so the encoding helpers must be used.

Caveat worth knowing before building on it: this hook was **broken in Meteor
3.0-alpha/beta/rc** — `bindEnvironment` returned a promise that stringified into
the config as `[object Promise]`, blanking the page — and was fixed by
[meteor#13156][hookfix]. Any WeKan that uses it must state a minimum Meteor
version and test the served HTML per host.

### 3. Server-side absolute URLs

`Meteor.absoluteUrl()` [reads `ROOT_URL` from the environment][absurl] and takes a
per-call `{ rootUrl }` override — so every call site must learn which tenant it is
answering for. In WeKan those are few and findable: board and card URLs
(`models/boards.js`), the invitation mail (`server/models/settings.js`), the OIDC
logout redirect, and two redirects in `server/routes/universalFileServer.js`.

The rest of WeKan is already ahead here: `models/lib/universalUrlGenerator.js`
deliberately builds **relative** attachment and avatar URLs so they work whatever
`ROOT_URL` and `PORT` are. That work, done for sub-path deployments, is most of
what a multi-domain server needs.

### 4. Keeping the data apart

This is the expensive one. WeKan has **46 collections**, **66 publications** and
**62 method blocks**. Every one of them would have to be tenant-scoped, and *one*
missed selector is one customer reading another customer's board.

### 5. Accounts

`Meteor.users` is one collection. Two customers with the same e-mail address are
one account; a password reset crosses tenants; `Accounts.emailTemplates` and the
OAuth callback URL are per-instance today. Either accounts become tenant-scoped
(and a user who belongs to two tenants has two accounts), or accounts stay global
and tenancy is only about *content* — which is a different product decision, not a
deployment one.

### 6. The singletons

`Settings`, `AccountSettings`, `AccessibilitySettings`, `Announcements`,
`AttachmentStorageSettings`, `InviteToBoardRolesSettings`, `LockoutSettings`,
`TableVisibilityModeSettings` and the rest are **one document per instance**, read
through `ReactiveCache.getCurrentSetting()`. Product name, logo, SMTP, lockout
policy, announcement — everything an admin sets in the Admin Panel is instance-wide.
Per-tenant branding means every one of those becomes a per-tenant document and
every read goes through the tenant. The file storage root, the `MAIL_URL` and the
~102 `process.env` reads have the same shape: they are per-process today.

## The alternatives

### A. One process per tenant — the baseline

What WeKan ships and documents. Caddy routes each customer domain to a container;
each container has its own `ROOT_URL`, `MONGO_URL` database and internal
`uws.port`; one MongoDB serves them all.

- **Buys**: total isolation with no application code at all. A bug in tenant
  scoping cannot exist, because there is no tenant scoping. One customer's crash,
  migration, restore or CPU spike is theirs alone. Upgrades are per customer, so a
  bad release can be rolled back for one.
- **Costs**: memory × *n* (a Meteor server is not small), a port and a `uws.port`
  to allocate per tenant, *n* upgrades, *n* backups, *n* sets of settings to keep
  in step. This is the cost that motivates the whole page.

### B. One process, one database, a tenant field on every document

The classic Meteor answer, and the one the community package implements:
[`mizzao:partitioner`][partitioner] (in Meteor-Community-Packages) rewrites the
selector of every `find`/`insert`/`update`/`remove` on a partitioned collection
from the current user's group, so application code is written as if it were
alone. It supports Meteor 3's async collection API.

- **Buys**: one process, one database, one upgrade, one backup. Cross-tenant
  admin reporting becomes a query rather than *n* queries.
- **Costs**: every collection has to be partitioned deliberately, and the ones that
  must NOT be (the settings singletons, `Meteor.users` if accounts stay global) have
  to be decided one by one. Publications keyed by name need the tenant in the name
  — the forum's long-standing advice is `Meteor.publish("posts-" + tenantId)`
  rather than a parameter, [because a parameterised publication collides in a
  browser that has two tenants open][forum]. Indexes grow a leading tenant key.
  And the failure mode of a missed selector is the worst one in the product:
  silent cross-tenant disclosure.

### C. One process, one database per tenant

**The database side is exactly what is shipped today**: one MongoDB server (or
replica set) holding one database per tenant —

```
mongodb://127.0.0.1:27017/wekan_tenant1?replicaSet=rs0
mongodb://127.0.0.1:27017/wekan_tenant2?replicaSet=rs0
```

— which is `docker-compose-multitenancy.yml` unchanged. What differs from (A) is
only the Node side: **one** process opens **all** of those databases instead of
*n* processes opening one each.

Meteor can hold more than one Mongo connection: `new
MongoInternals.RemoteCollectionDriver(url, { oplogUrl })` gives a driver, and
`new Mongo.Collection(name, { _driver: driver })` binds a collection to it — with
oplog tailing on that connection too. Each driver takes a **full** connection URL,
so one server with many databases is the common case rather than a requirement:
a large tenant can be moved to its own `mongod`, or its own host, without the
others noticing.

- **Buys**: the data separation of the baseline (a query cannot cross a database)
  with one process, and per-tenant backup/restore stays exactly what it is today.
- **Costs**: WeKan's collections are module-level singletons (`models/*.js` export
  one `Mongo.Collection` each). Making them per-tenant means either building the
  whole collection set per tenant at connection time and routing every publication
  and method through the right set, or a driver-swapping layer under
  `ReactiveCache`. Each tenant also costs its own connection pool and its own
  oplog/changeStreams watcher — the resource saving over (A) is real but smaller
  than it looks, and it is memory in one process, where the baseline's memory is in
  *n* processes that the kernel can schedule and kill independently.

### D. One process, one database, **Organizations as tenants** — IMPLEMENTED

WeKan already had the shape: `models/org.js`, `models/team.js`, users belonging to
orgs and teams, per-org and per-team switches (shared templates, propagate members,
sync from the auth provider), and *"Add board members only from the same
Organization"* / *"…same Team"*, enforced server-side in the invite path and in the
user-search typeahead (`server/lib/orgTeamRestriction.js`).

The implementation takes that seriously as the tenancy model: an Organization
claims **domains**, carries its own **branding**, has its own **per-tenant Global
Admins**, and can be **backed up and restored on its own** — and the existing
membership rules do the separating.

- **Buys**: by far the least new machinery — the grouping, the membership, the
  admin UI and the restriction already exist and are already tested. Nothing had to
  be partitioned, because boards are already only visible to their members.
- **Costs**: it is *soft* tenancy. One database, one user namespace, one set of
  instance settings; a site admin sees everything; a bug in board permissions is a
  cross-tenant bug. Suitable for departments of one organisation, or customers who
  accept a shared operator — **not** for customers who must not share a process.
  Those are what (A) is for, and (A) remains supported.

#### D.1 Turning it on

Off unless the deployment says otherwise, so nothing changes for an instance that
has never heard of tenants — whatever is in its org documents.

| Environment variable | Default | Meaning |
| --- | --- | --- |
| `MULTITENANCY` | unset (off) | `true` enables host → Organization resolution, per-tenant branding and per-tenant backup scopes. |
| `MULTITENANCY_TRUST_PROXY_HOST` | unset (off) | `true` believes `X-Forwarded-Host`. Set it **only** when a trusted proxy (Caddy, nginx) sets that header on every request. |

`ROOT_URL` stays what it is: the instance's own address, and the fallback for any
host that no Organization claims.

#### D.2 Which tenant is this request? (problem 1)

`models/lib/tenants.js` is the one place that decides, and it is pure:

- `normalizeHost()` — lower-cases, drops scheme, userinfo, path, port and the root
  dot, so `HTTPS://A.Example.com:443/` and `a.example.com` are one host.
- `parseHostList()` — an org's `orgDomains` is free text (comma, semicolon or
  whitespace separated), like every other org field.
- `requestHost(headers, { trustProxy })` — reads `X-Forwarded-Host` **only** when
  the deployment set `MULTITENANCY_TRUST_PROXY_HOST`, otherwise `Host`, and takes
  the first entry of a proxy chain. A tenant chosen from a header a client can forge
  is a cross-tenant lie, so this decision is made once, here.
- `findTenantOrg(orgs, host)` — the first **active** org claiming that host.
  Deactivating an org takes the tenant off the air without losing its configuration.
- `conflictingHosts()` / `duplicateTenantHosts()` — two orgs claiming one host is a
  configuration mistake that would silently give one of them the other's brand, so
  the save path refuses it and names the host.

`server/lib/tenantResolver.js` holds the Meteor side: a host → org cache rebuilt
from the `org` collection, `tenantForHeaders()` for HTTP requests and for DDP
connections (`this.connection.httpHeaders`).

#### D.3 The client bundle carries `ROOT_URL` (problem 2)

`WebApp.addRuntimeConfigHook` rewrites `ROOT_URL` and `DDP_DEFAULT_CONNECTION_URL`
per request when the request's host is a tenant host, so a client loading
`b.example.com` connects back to `b.example.com` instead of to the one `ROOT_URL`
the process was started with. `tenantRootUrl()` keeps the scheme and any sub-path
of the instance's own `ROOT_URL`. The hook is only installed when tenancy is on,
and it returns a falsy value for every host it does not recognise, which leaves the
config exactly as Meteor encoded it.

Meteor 3.0-alpha/beta/rc had this hook broken (meteor#13156, see the references);
WeKan runs a Meteor 3 release that contains the fix.

#### D.4 Server-side absolute URLs (problem 3)

`tenantRootUrl(host, ROOT_URL)` gives the per-tenant value to pass as
`Meteor.absoluteUrl(path, { rootUrl })`. Most of WeKan needed nothing: attachment
and avatar URLs are already relative (`models/lib/universalUrlGenerator.js`).

#### D.5 Keeping the data apart (problem 4)

Nothing is partitioned — that is the point of (D). Boards are visible to their
members, and the per-Organization board-member restriction that already exists
(`server/lib/orgTeamRestriction.js`) is what keeps a tenant's boards inside the
tenant. **This is the option's limit, not an oversight**: a permissions bug is a
cross-tenant bug here, which is why (A) stays the recommendation for customers who
must not share a process.

What (D) *does* scope, because these are admin surfaces rather than board content:
Admin Panel / People / People and / Organizations, through
`peopleScopeSelector()` and `orgScopeSelector()` in `models/lib/tenantAdmin.js`,
applied in the `people` and `org` publications and in the count methods that page
them.

#### D.6 Accounts (problem 5)

Accounts stay **global**: one e-mail address is one user, who may belong to several
Organizations. That is the product decision (D) makes, and everything else follows
from it — in particular a tenant backup carries no accounts (D.8), and a per-tenant
Global Admin may never grant the site-wide `isAdmin` flag (D.7).

#### D.7 Per-tenant Global Admins

A second, smaller kind of admin: someone who administers ONE Organization. It is a
flag on the membership the user already has —

```js
user.orgs = [ { orgId, orgDisplayName, isAdmin: true } ]
```

— so there is no new collection and no second membership list, and everything that
already reads `user.orgs` keeps working. `models/lib/tenantAdmin.js` holds the
rules, and the same functions run on the client (which menu entries to draw) and on
the server (which is the one that counts):

| Question | Site admin | Per-tenant admin |
| --- | --- | --- |
| Open the Admin Panel | yes | yes |
| Tabs | Settings, People, Attachments, Problems | People, Attachments, Settings (one pane) |
| People menu | every pane | People, Organizations |
| Attachments menu | every pane | Backup |
| Settings menu | every pane | Visibility, and in it only **Change color** |
| People they see | everyone | members of the orgs they administer |
| Organizations they see | all | the ones they administer |
| Grant site-wide `isAdmin` | yes | **never** |
| Manage a site admin | yes | **never** |
| Appoint a per-tenant admin | any org | their own org |
| Backup scope | whole instance, or any org | their own org only |

Appointing one reuses the existing menu: Admin Panel / People / Organizations → the
row's **⋯** → **Organization admins**, a member list with a checkbox each.

#### D.8 Per-tenant backup and restore

Admin Panel / Attachments / Backup gained one control — **Scope** — listing the
whole instance (site admin only) and each Organization the viewer may administer.
`models/lib/tenantBackup.js` decides everything else.

A tenant archive contains the tenant's boards and everything hanging off them
(lists, swimlanes, cards, comments and reactions, checklists and their items,
custom fields, activities, rules with their triggers and actions, integrations,
attachment records) plus the attachment and avatar files those boards use. It does
**not** contain:

- **accounts** — one namespace (D.6), so an archive must not carry password hashes
  or e-mail addresses out of the instance, and a restore must never rewrite an
  account;
- **the settings singletons** — product name, SMTP, lockout policy are per-instance
  and belong to the instance backup;
- **the org and team documents** — restoring them could resurrect a deleted tenant
  or rewrite another tenant's membership.

Archives live under a per-org directory, so "which archives may this admin see" is
a path question:

```
<files>/backup/2026/07/26/12_00_00/backup.zip              instance
<files>/backup/org/<orgId>/2026/07/26/12_00_00/backup.zip  tenant
```

Restore is the dangerous direction, so it is guarded twice: the board ids a restore
may write are the **intersection** of what the archive claims with what the tenant
really owns (`allowedRestoreBoardIds`), and then every single document is checked
against that set (`docBelongsToTenant`) — a custom field shared with a board outside
the tenant is refused as well, because writing it would rewrite a document another
tenant's boards read. A per-tenant admin may never restore an instance-wide archive
(it contains every tenant), and asking for a scope you may not have is **refused**,
never quietly narrowed.

#### D.9 The singletons (problem 6)

Per-tenant branding reuses the fields Admin Panel / Settings / Visibility already
has: the org document carries an `org`-prefixed copy of each, and a non-empty one
replaces the instance value for that tenant's requests
(`tenantBranding()`), so no rendering code changed — the client reads the same
`currentSetting` fields it always did, and only the published document differs per
host.

| Organization field | Overrides |
| --- | --- |
| `orgProductName` | `productName` |
| `orgThemeColor` / `orgThemeCustomColors` | the site theme, `themeColor` / `themeCustomColors` |
| `orgCustomLoginLogoImageUrl` / `orgCustomLoginLogoLinkUrl` | the login logo and its link |
| `orgTextBelowCustomLoginLogo` | the text below the login logo |
| `orgCustomTopLeftCornerLogoImageUrl` / `orgCustomTopLeftCornerLogoLinkUrl` | the top-left corner logo and its link |
| `orgCustomHelpLinkUrl` | the custom help link |
| `orgLegalNotice` | the legal notice URL |

**The site theme** is the one branding field an Organization's own admin sets from
the Admin Panel rather than from the org row: Admin Panel / Settings / Visibility /
**Change color**, the same shared picker as Board Settings and Member Settings
([Change color](../../Features/Page/Theme.md)). The site admin's pane says under the title that
their colour is the one every Organization without one of its own inherits; an
Organization's admin sees only that section of the pane, and their colour reaches
only their own hosts. Where the write lands is decided server-side by
`themeTarget()` in `models/lib/tenantAdmin.js`, never by the client. The order of
themes is 1) WeKan's default, 2) this site theme, 3) the user's own override.

Everything else — SMTP, lockout policy, announcements, the storages — stays
per-instance. Making those per-tenant is the next step if it is ever wanted, and it
is the same shape: one more `org`-prefixed field and one more line in
`BRANDING_FIELDS`.

#### D.10 The test suite

The separation is the feature, so the suite tests the separation rather than the
plumbing: `tests/tenants.test.cjs` (host normalisation, forged `X-Forwarded-Host`,
inactive orgs, duplicate hosts, branding fallback, root URL),
`tests/tenantAdmin.test.cjs` (scope selectors, escalation attempts, menu
filtering), `tests/tenantBackup.test.cjs` (export selectors, cross-tenant restore
attempts, forbidden collections, archive ownership) and `tests/tenantWiring.test.cjs`
(that the publications, methods and panes really call those rules instead of
re-deciding). Each is plain Node: `node tests/tenants.test.cjs`.

### E. Split the difference: shared web tier, per-tenant data process

Route by host in a thin front tier, keep a WeKan process per tenant behind it.
This is (A) with a nicer front door: it removes the per-tenant public port and the
`uws.port` juggling, and nothing else. Worth mentioning only to note that the
**expensive** part of (A) is the *n* Node processes, and this does not remove them.

## What this comparison says

| | A. Process per tenant | B. Tenant field | C. DB per tenant, one process | D. Orgs as tenants |
| --- | --- | --- | --- | --- |
| Status | supported | design | design | **implemented** |
| New WeKan code | none | 46 collections, 66 publications | collection construction + routing | three pure modules + resolver, branding, per-tenant admins and backup |
| Isolation | process | selector | database | permissions |
| Worst failure | a tenant is down | cross-tenant disclosure | cross-tenant disclosure | cross-tenant disclosure |
| Memory | × *n* | × 1 | × 1 process, × *n* pools | × 1 |
| Upgrade | × *n* | × 1 | × 1 | × 1 |
| Per-tenant restore | trivial | hard | trivial | scoped to the tenant's boards (D.8) |

**(A) remains the supported topology for customers who must not share a process,
and (D) is what ships for customers who are groups within one organisation.** (B)
and (C) are buildable and Meteor supports them, but they trade an operational cost
that is merely tedious — *n* processes, *n* upgrades — for a security failure mode
that is silent. That trade is only worth making with a per-tenant test suite that
proves the separation, and that suite is the actual work, not the plumbing — which
is why (D) shipped with its own (D.10) even though it partitions nothing.

If (B) or (C) is ever attempted, the order that keeps it honest is:

1. Resolve the tenant in **one** place, from a header the proxy is trusted to set,
   and make everything else read it from there.
2. Make the settings singletons per-tenant first — they are the smallest set, and
   they prove the pattern end to end (branding, mail, lockout).
3. Only then the content collections, with a test per publication that a
   subscription for tenant A returns nothing belonging to tenant B.
4. Accounts last, or not at all: decide first whether one person with one e-mail
   address is one user or *n*.

## References

- Meteor `WebApp.addRuntimeConfigHook` — the per-request runtime config hook:
  <https://docs.meteor.com/packages/webapp.html>
- Meteor connections (`Meteor.onConnection`, `this.connection.httpHeaders`):
  <https://docs.meteor.com/api/meteor>
- `Meteor.absoluteUrl(path, { rootUrl })`: <https://docs.meteor.com/api/meteor>
- Meteor 3 fix for the runtime-config hook, meteor#13156 (issue meteor#12939):
  <https://github.com/meteor/meteor/issues/12939>
- `mizzao:partitioner`, Meteor-Community-Packages — selector rewriting per group,
  Meteor 3 async API: <https://packosphere.com/mizzao/partitioner> ·
  <https://github.com/Meteor-Community-Packages/meteor-partitioner>
- Other community attempts, for what they teach rather than to depend on:
  `flipace/meteor-tenantify`, `cinn-labs/meteor-multitenancy` (explicitly not for
  production), `harry97:partitioner` — <https://atmospherejs.com> ·
  <https://packosphere.com> · <https://www.npmjs.com>
- Meteor forums, "Multitenancy and Meteor" — publication-name overloading and the
  subscription-collision pitfall: <https://forums.meteor.com/t/multitenancy-and-meteor/5653>
- Meteor DDP transport, multitenancy section (the `uws.port` rule the shipped
  topology depends on):
  <https://docs.meteor.com/performance/ddp-transport#multitenancy>

[conn]: https://docs.meteor.com/api/meteor
[webapp]: https://docs.meteor.com/packages/webapp.html
[hookfix]: https://github.com/meteor/meteor/issues/12939
[absurl]: https://docs.meteor.com/api/meteor
[partitioner]: https://github.com/Meteor-Community-Packages/meteor-partitioner
[forum]: https://forums.meteor.com/t/multitenancy-and-meteor/5653
