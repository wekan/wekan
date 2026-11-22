# Admin Panel / People / Organizations

## What it is

The organizations on this instance, and one restriction that belongs with them.
An Organization groups users - by company, department or customer - so that
boards can be shared with all of them at once, template boards can be shared
with them, their members can be kept in step with a directory such as LDAP, and,
with multitenancy on, one Organization can be a tenant of its own with its own
domains, branding and administrators.

## Read more

- [Organization](https://en.wikipedia.org/wiki/Organization),
  [Multitenancy](https://en.wikipedia.org/wiki/Multitenancy) and
  [Directory service](https://en.wikipedia.org/wiki/Directory_service) on
  Wikipedia.
- [Design / Multitenancy](../../../Design/Multitenancy/Multitenancy.md) - the
  whole tenant design.
- [Teams](Teams.md) - the same table, for Teams.
- [Group members](../../All-Boards/Group-Members.md) - the Organization's tab
  in All Boards.
- [Feature profiles](../Settings/Feature-Profiles.md)
- [LDAP](../../Login-Page/LDAP.md) - syncing Organizations from directory
  groups.

## How to use it

**Restrict who can be added to a board**

1. Open **Admin Panel**, **People**, **Organizations**
   (`/admin/people/organizations`).
2. Tick **Add board members only from the same Organization** above the table.

**Create and edit an Organization**

1. Click **New** in the first column's header — it is there even when the
   table is empty, which is how the first organization gets created.
2. Fill in the name, description, short name and website, and save.
3. Click **Edit** on a row to change **Display Name**, **Description**, **Short
   Name**, **Automatically add users with the domain name**, **Website** and
   **Active Organization**, and the tenant fields described below.
4. To delete one, open the row's ⋯ menu and use **Delete**.

**Switch a feature for one or for all**

1. Tick or untick **Shared Templates**, **Propagate Members To Boards** or
   **Sync Members From Auth Provider** on a row; it saves at once.
2. Or use the select-all / unselect-all pair in that column's header to set it
   for every Organization.

**Appoint Organization admins**

1. Open the ⋯ menu of a row and choose **Organization admins**.
2. Tick the members who administer that Organization.

## How the numbers are calculated

- **Rows per page**: 10, the shared table page's `TABLE_PAGE_ROWS_PER_PAGE`
  ([models/lib/tablePage.js](../../../../models/lib/tablePage.js)); the total
  is the number of Organizations matching the search, counted on the server.
- **Automatically add users with the domain name**: a new user is added to
  every Organization whose domain is EXACTLY the domain of their e-mail
  address, compared case-insensitively; a leading `@` in the field is ignored
  and a subdomain does not match
  ([models/lib/orgAutoAddByDomain.js](../../../../models/lib/orgAutoAddByDomain.js)).
- **Propagate Members To Boards** reports how many boards were updated and
  how many members added; existing members are never removed or changed.
- The board-member restriction is a yes/no test, not a count: see below.

## How it works in WeKan

### Add board members only from the same Organization

The checkbox above the table (`boardMembersFromSameOrgOnly`, default off). When it is
on, a user may only be added to a board if they share an Organization with whoever is
adding them — or with an active member of that board. Site admins bypass it, and it
is enforced server-side: both the invite action and the user-search typeahead respect
it, so the UI never offers a candidate the server would reject.

There is a matching checkbox in [Teams](Teams.md). With **both** on, sharing either
an Organization or a Team is enough — which is exactly what the single "same
Organization or Team" setting it replaces did, and what an existing install is
migrated to on first start. Ticking only one is the narrower choice that was not
expressible before. The decision is `canAddUserToBoard` in
[server/lib/orgTeamRestriction.js](../../../../server/lib/orgTeamRestriction.js).

### The table

Display name, description, short name, website, created date, active state,
the feature profiles assigned to the Organization, and three per-organization
switches:

- **Shared Templates** — whether template boards shared with this organization are
  available to its members.
- **Propagate Members To Boards** — whether members of this organization are
  automatically added to the boards that list it (add-only; template boards are
  skipped). Ticking it runs the propagation at once, for that row or, from the
  header, for every Organization; it runs again during the LDAP background sync,
  and can be triggered by an admin (`propagateOrgTeamMembersToBoards`).
- **Sync Members From Auth Provider** — marks an Organization whose membership
  comes from the authentication provider, e.g. LDAP groups
  (`LDAP_SYNC_ORGANIZATIONS`). The LDAP sync sets it on the Organizations it
  creates or manages, and such an Organization's members are shown read-only in
  its All Boards tab, because WeKan reads directory groups and never writes
  them back ([models/lib/groupMembers.js](../../../../models/lib/groupMembers.js)).

Each header of those three carries a select-all / unselect-all pair, and each row has
**Edit** and a ⋯ menu. The **New** link is the first column's header — it is there
even when the table is empty, which is how the first organization gets created.
An inactive Organization's texts are shown struck through.

### An Organization as a tenant

**Edit** on a row also carries the fields that make an Organization a tenant of this
server — one WeKan process serving several domains, each with its own address, its own
branding and its own administrators. It is off unless the server is started with
`MULTITENANCY=true`, and an Organization with no domains is not a tenant.

- **Domains of this Organization** — the hostnames this Organization is served on,
  separated by commas (`a.example.com, kanban.example.org`). A request to one of them
  is this Organization's request. A domain that already belongs to another
  Organization is refused, naming the domain. The instance's own `ROOT_URL` host is
  refused for everyone. Only a site admin assigns a new hostname: one entered by
  the Organization's own admin is stored as a request ("Requested by this
  Organization's admin, waiting for a site administrator to assign"), and the
  attempt is recorded under TenantBleed; removing hostnames applies at once.
- **Branding** — product name, the login logo and the text below it, the top-left
  corner logo, the custom help link and the legal notice URL. Each one that is set
  replaces the instance value on this Organization's domains; each one left empty
  keeps the instance value. The **theme colour** is set in
  [Settings / Appearance / Change color](../Settings/Appearance.md#change-color) instead, by that
  Organization's own admin.

Deactivating an Organization takes its domains off the air without losing any of this.

The whole design, and what it deliberately does NOT isolate, is
[Design / Multitenancy](../../../Design/Multitenancy/Multitenancy.md).

### Organization admins

The ⋯ menu of a row opens **Organization admins**: the members of that Organization,
with a checkbox each. A ticked member administers that Organization — and nothing
else:

| | Site admin | Organization admin |
| --- | --- | --- |
| Admin Panel tabs | Settings, People, Attachments, Problems | People, Attachments, Settings (one pane) |
| People they see | everyone | the members of the Organizations they administer |
| Organizations they see | all | the ones they administer |
| Settings | everything | Appearance / Change color only |
| Backup | the whole instance, or any Organization | their own Organization only |
| Grant the site-wide **Admin** flag | yes | never |
| Manage a site admin | yes | never |
| Appoint an Organization admin | in any Organization | in their own |

A site admin may appoint them anywhere; an Organization's own admin may appoint others
inside their Organization, which is what lets a tenant run itself. Someone who is not a
member of the Organization cannot be appointed. The flag is `isAdmin` on the user's own
entry in `user.orgs`; the rules are
[models/lib/tenantAdmin.js](../../../../models/lib/tenantAdmin.js), asked again by every
method and publication on the server. (The Settings pane was called Visibility; it is
Appearance now.)

### Files and tests

- Collection `org` ([models/org.js](../../../../models/org.js)), methods in
  [server/models/org.js](../../../../server/models/org.js) (each checks that the
  caller is an admin), propagation in
  [server/propagateOrgTeamMembers.js](../../../../server/propagateOrgTeamMembers.js),
  LDAP group sync in [server/ldapGroupSync.js](../../../../server/ldapGroupSync.js),
  tenant methods in [server/methods/tenant.js](../../../../server/methods/tenant.js).
- The pane is `orgGeneral`, `orgRow`, `editOrgPopup`, `orgAdminsPopup` and
  `settingsOrgPopup` in
  [peopleBody.jade](../../../../client/components/settings/peopleBody.jade).
- Pinned by [server/lib/tests/orgTeamRestriction.tests.js](../../../../server/lib/tests/orgTeamRestriction.tests.js),
  [tests/propagateMembers.test.cjs](../../../../tests/propagateMembers.test.cjs),
  [tests/orgAutoAddByDomain.test.cjs](../../../../tests/orgAutoAddByDomain.test.cjs),
  [tests/groupMembers.test.cjs](../../../../tests/groupMembers.test.cjs),
  [tests/tenantAdmin.test.cjs](../../../../tests/tenantAdmin.test.cjs),
  [tests/tenants.test.cjs](../../../../tests/tenants.test.cjs),
  [tests/tenantHostApproval.test.cjs](../../../../tests/tenantHostApproval.test.cjs)
  and the browser tests
  [32-org-team-feature-toggles.e2e.js](../../../../tests/playwright/specs/32-org-team-feature-toggles.e2e.js)
  and [30-ldap-orgs-teams.e2e.js](../../../../tests/playwright/specs/30-ldap-orgs-teams.e2e.js).

## Commits

 - [The feature profiles column](https://github.com/wekan/wekan/commit/fc21b0b177dc8f8902efa39d0f89c8b041c7cf2d)
 - [Board admins cannot attach foreign groups by direct board writes](https://github.com/wekan/wekan/commit/e3458004eca187ae55fc416ddb9ce369298b1a5c)
 - [Memberships given by a group leave with the group](https://github.com/wekan/wekan/commit/50bb989eb8d90ed9bfafbceb3f9f8e68e208116e)
 - [Only a site admin assigns a tenant hostname](https://github.com/wekan/wekan/commit/94a8c41b3c172ffde3eaf05e67be49fcb378e1b0)
 - [Propagate Members To Boards passes the id, not the selector](https://github.com/wekan/wekan/commit/8e89262d0083f1b84989feb5a42241640d4c96a5)
 - [One page of ten rows](https://github.com/wekan/wekan/commit/c1add5bc5e5537e3cc8f96076164ebdf4328b0e8)
 - [The tenant modules are ES modules](https://github.com/wekan/wekan/commit/f15d0c0cba579a942d942671d4f8dd6f4b24fd58)
 - [Multitenancy: Organizations as tenants, with their own admins](https://github.com/wekan/wekan/commit/36b899b9d643fd428613fa8e7197bafc192a42db)
 - [The board-member restriction becomes one checkbox here and one in Teams](https://github.com/wekan/wekan/commit/f0ea1601b3f6e2530501873efc5824d48ee79991)
 - [Search and actions in the shared controls row](https://github.com/wekan/wekan/commit/ccc95bffba484f7a1f8848e2801e8a4195cb7290)
 - [Organizations render through the shared table page](https://github.com/wekan/wekan/commit/13f40bf3ab95aff85f6004cd721a01a49a19f020)
 - [Propagate Members To Boards actually propagates](https://github.com/wekan/wekan/commit/5234d09d150f2cf219b4ca341f03764eea84e2e7)
 - [Auto-add users to Organizations matching their e-mail domain](https://github.com/wekan/wekan/commit/d41e17d6a088edf6abbb1f9517d2ecb58d618f03)
 - [Restrict adding board members to the same Organization or Team](https://github.com/wekan/wekan/commit/371258a6d0839e45763be383bc3dee1d08108dd6)
 - [Implement Propagate Members To Boards](https://github.com/wekan/wekan/commit/f5cca8cea12fac0cdffae5293463c090def22538)
 - [REST API for the Organization feature switches](https://github.com/wekan/wekan/commit/dbaa27dd67d88e87db9cdac286029bd208bbc008)
 - [Confirm text above the delete button](https://github.com/wekan/wekan/commit/16379201704ea1a43ce14859633ffb1b9fae6710)
 - [Organizations in the Admin Panel](https://github.com/wekan/wekan/commit/9e2093d6aed38e66fc4d63823315c9382e013a32)
 - [The org collection](https://github.com/wekan/wekan/commit/2cedbcb9b334cd497874736bbb740a1d5c5acb6c)
