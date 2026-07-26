# Design: Multitenancy — one WeKan server for many domains

Today, hosting *n* customers means running *n* WeKan servers: *n* Node.js
processes, *n* `ROOT_URL`s, *n* databases, *n* upgrades. That is what
[`docs/Platforms/FOSS/Docker/Meteor3/`](../../Platforms/FOSS/Docker/Meteor3/README.md)
sets up and it works.

This page designs the **alternatives**: what it would take for **one** WeKan
Node.js process to serve many domains, each with its own `ROOT_URL` and its own
data — and what each alternative costs. It is a design, not a description of
shipped code: nothing here is implemented in WeKan yet.

## Related files

Everything the question touches. Paths are from the repository root.

| File Path | File Type | Description |
| --- | --- | --- |
| `docs/Platforms/FOSS/Docker/Meteor3/README.md` | `.md` guide | The shipped topology: Caddy in front, one WeKan container per customer, one MongoDB, one database per customer. |
| `docs/Platforms/FOSS/Docker/Meteor3/multitenancy.md` | `.md` guide | The two supported transports for that topology, and why each instance in one network namespace needs its own internal `uws.port`. |
| `docker-compose-multitenancy.yml` | `.yml` compose file | The working example: per-tenant `PORT`, `ROOT_URL`, `MONGO_URL` database and `uws.port`. |
| `models/lib/universalUrlGenerator.js` | `.js` module | Builds attachment/avatar URLs that do **not** depend on `ROOT_URL`. Already tenant-safe, and the model the rest of the code should follow. |
| `server/routes/universalFileServer.js` | `.js` route | Serves `/cdn/storage/…` for any host. Two `Meteor.absoluteUrl()` calls are the only `ROOT_URL` dependency left in it. |
| `models/boards.js` | `.js` model | `absoluteUrl()` for a board — one of the places a per-tenant root URL has to reach. |
| `server/models/settings.js` | `.js` model + startup | The instance settings document, and the startup that seeds it from `ROOT_URL` and the environment. One document per *instance* today. |
| `imports/reactiveCache.js` | `.js` cache | `getCurrentSetting()` — the single-document read that every pane and mail template goes through. |
| `models/org.js`, `models/team.js` | `.js` models | Organizations and Teams: the tenant-shaped grouping WeKan already has *inside* one instance. |
| `server/lib/orgTeamRestriction.js` | `.js` helper | The one existing rule that keeps two customer groups apart in a shared instance. |

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

Meteor can hold more than one Mongo connection: `new
MongoInternals.RemoteCollectionDriver(url, { oplogUrl })` gives a driver, and
`new Mongo.Collection(name, { _driver: driver })` binds a collection to it — with
oplog tailing on that connection too.

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

### D. One process, one database, **Organizations as tenants**

WeKan already has the shape: `models/org.js`, `models/team.js`, users belonging to
orgs and teams, per-org and per-team switches (shared templates, propagate members,
sync from the auth provider), and — since this release — *"Add board members only
from the same Organization"* / *"…same Team"*, enforced server-side in the invite
path and in the user-search typeahead (`server/lib/orgTeamRestriction.js`).

The alternative is to take that seriously as the tenancy model: give an
Organization a **domain** and a **branding set**, resolve the org from the `Host`
header, and let the existing membership rules do the separating.

- **Buys**: by far the least new machinery — the grouping, the membership, the
  admin UI and the restriction already exist and are already tested. Nothing has to
  be partitioned, because boards are already only visible to their members.
- **Costs**: it is *soft* tenancy. One database, one user namespace, one set of
  admin settings; a site admin sees everything; a bug in board permissions is a
  cross-tenant bug. Per-org branding, per-org SMTP and per-org announcements would
  each be new per-org documents. Suitable for departments of one organisation, or
  customers who accept a shared operator — not for customers who must not share a
  process.

### E. Split the difference: shared web tier, per-tenant data process

Route by host in a thin front tier, keep a WeKan process per tenant behind it.
This is (A) with a nicer front door: it removes the per-tenant public port and the
`uws.port` juggling, and nothing else. Worth mentioning only to note that the
**expensive** part of (A) is the *n* Node processes, and this does not remove them.

## What this comparison says

| | A. Process per tenant | B. Tenant field | C. DB per tenant, one process | D. Orgs as tenants |
| --- | --- | --- | --- | --- |
| New WeKan code | none | 46 collections, 66 publications | collection construction + routing | per-org branding only |
| Isolation | process | selector | database | permissions |
| Worst failure | a tenant is down | cross-tenant disclosure | cross-tenant disclosure | cross-tenant disclosure |
| Memory | × *n* | × 1 | × 1 process, × *n* pools | × 1 |
| Upgrade | × *n* | × 1 | × 1 | × 1 |
| Per-tenant restore | trivial | hard | trivial | hard |

**The recommendation is to keep (A) as the supported topology, and to reach for
(D) when the customers are groups within one organisation.** (B) and (C) are
buildable and Meteor supports them, but they trade an operational cost that is
merely tedious — *n* processes, *n* upgrades — for a security failure mode that is
silent. That trade is only worth making with a per-tenant test suite that proves
the separation, and that suite is the actual work, not the plumbing.

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
