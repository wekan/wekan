# Multitenancy

## What it is

Multitenancy means that one WeKan server serves many customers ("tenants"),
each on its own domain name, instead of running one WeKan server per customer.

Q: Is Multi-tenancy like ability to configure multiple ROOT_URL for same
Meteor app? Or having relative URLs?

A: Yes. In current WeKan it is option D of the
[multitenancy design](../../Design/Multitenancy/Multitenancy.md),
*Organizations as tenants*: an Organization may claim hostnames, and a request
to one of them gets that Organization's branding and its own `ROOT_URL`. It is
soft tenancy: one database and one user namespace, kept apart by board
membership. It is off until `MULTITENANCY=true`.

## Read more

- [Multitenancy at Wikipedia](https://en.wikipedia.org/wiki/Multitenancy)
- [Video about multitenancy in Meteor](https://www.youtube.com/watch?v=917v1a01-Ko)
- [meteor-partitioner](https://github.com/Meteor-Community-Packages/meteor-partitioner),
  a Meteor package that partitions collections per group
- [WeKan multitenancy design](../../Design/Multitenancy/Multitenancy.md): the
  alternatives A-E and what each costs, and the implemented option D
- [Cloud Panel](../Admin-Panel/Cloud-Panel.md): customer domains either in
  their own container (A) or as Organizations of this WeKan (D)

Related:

- https://www.enterpriseready.io
- https://github.com/clinical-meteor/hipaa-audit-log

## How to use it

**Turn it on**

1. Start WeKan with the environment variable `MULTITENANCY=true`.
2. Only when a trusted proxy (Caddy, nginx) sets `X-Forwarded-Host` on every
   request, also set `MULTITENANCY_TRUST_PROXY_HOST=true`.
3. Point the tenant's DNS name at the same WeKan server and proxy.

**Give an Organization its domains**

1. As a site administrator open **Admin Panel / People / Organizations**.
2. Edit the Organization, and in **Domains of this Organization** write its
   hostnames separated by commas, for example `a.example.com, kanban.example.org`.
3. Save. A request to one of those hostnames is now that Organization's
   request, and the Organization's branding replaces the instance branding.

An Organization's own admin can only *request* domains; they are saved as a
request ("Requested by this Organization's admin, waiting for a site
administrator to assign") and a site administrator assigns them. The
instance's own hostname can never be assigned to an Organization.

**Per-tenant admins and backup**

1. Admin Panel / People / Organizations, the row's **⋯** → **Organization
   admins**: tick the members who administer this Organization.
2. Admin Panel / Attachments / Backup has a **Scope** control: the whole
   instance (site admin only) or one Organization.

## How the numbers are calculated

Multitenancy has no numbers of its own. Its defaults: `MULTITENANCY` and
`MULTITENANCY_TRUST_PROXY_HOST` are off; a host is compared after
`normalizeHost()` lower-cases it and drops the scheme, user info, path, port
and trailing dot; the first **active** Organization claiming a host wins, and
two Organizations claiming the same host is refused on save
(`models/lib/tenants.js`).

## How it works in WeKan

- [models/lib/tenants.js](../../../models/lib/tenants.js) - pure decisions:
  `normalizeHost`, `parseHostList` (the `orgDomains` field), `requestHost`
  (believes `X-Forwarded-Host` only with `MULTITENANCY_TRUST_PROXY_HOST`),
  `findTenantOrg`, `conflictingHosts`, `tenantRootUrl`.
- [server/lib/tenantResolver.js](../../../server/lib/tenantResolver.js) - the
  Meteor side: a host to Organization cache built from the `org` collection,
  used for HTTP requests and DDP connections, and the
  `WebApp.addRuntimeConfigHook` that rewrites `ROOT_URL` for a tenant host.
- [models/lib/tenantAdmin.js](../../../models/lib/tenantAdmin.js) - what a
  per-tenant Global Admin may see and do (`peopleScopeSelector`,
  `orgScopeSelector`, the shorter Admin Panel menu).
- [models/lib/tenantBackup.js](../../../models/lib/tenantBackup.js) - what a
  tenant backup contains (boards and what hangs off them, no accounts).
- The Organization edit form is in
  [client/components/settings/peopleBody.jade](../../../client/components/settings/peopleBody.jade)
  (`js-orgDomains`).
- Tests: [tests/tenants.test.cjs](../../../tests/tenants.test.cjs),
  [tests/tenantAdmin.test.cjs](../../../tests/tenantAdmin.test.cjs),
  [tests/tenantBackup.test.cjs](../../../tests/tenantBackup.test.cjs),
  [tests/tenantHostApproval.test.cjs](../../../tests/tenantHostApproval.test.cjs),
  [tests/tenantWiring.test.cjs](../../../tests/tenantWiring.test.cjs),
  [tests/tenantbleed.test.cjs](../../../tests/tenantbleed.test.cjs).

## Commits

 - [Cloud Panel: customer domains and merging many WeKans into one as Organizations](https://github.com/wekan/wekan/commit/240f0dad935cba56618346fa0781ac1e72159af6)
 - [Only a site admin assigns a tenant hostname, and never the instance's own](https://github.com/wekan/wekan/commit/94a8c41b3c172ffde3eaf05e67be49fcb378e1b0)
 - [Custom translations are site-admin only, closing a TenantBleed sibling](https://github.com/wekan/wekan/commit/c5eb9fc060cbc9d5893f732fdb32b090fd8a86ab)
 - [The three tenant modules are ES modules](https://github.com/wekan/wekan/commit/f15d0c0cba579a942d942671d4f8dd6f4b24fd58)
 - [One WeKan server for many domains, with Organizations as tenants](https://github.com/wekan/wekan/commit/36b899b9d643fd428613fa8e7197bafc192a42db)
 - [Design: say plainly what option C's database side is](https://github.com/wekan/wekan/commit/150b0919b87b9d858397ac25bcdeab26e6666458)
 - [Design: one WeKan server for many domains, and what each alternative costs](https://github.com/wekan/wekan/commit/fd12199e9dfafe88399c9e828f1bc912c9b7b7a7)
