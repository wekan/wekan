# Admin Panel / People / Organizations

The organizations on this instance, and one restriction that belongs with them.

## Add board members only from the same Organization

The checkbox above the table (`boardMembersFromSameOrgOnly`, default off). When it is
on, a user may only be added to a board if they share an Organization with whoever is
adding them — or with an active member of that board. Site admins bypass it, and it
is enforced server-side: both the invite action and the user-search typeahead respect
it, so the UI never offers a candidate the server would reject.

There is a matching checkbox in [Teams](Teams.md). With **both** on, sharing either
an Organization or a Team is enough — which is exactly what the single "same
Organization or Team" setting it replaces did, and what an existing install is
migrated to on first start. Ticking only one is the narrower choice that was not
expressible before.

## The table

Display name, description, short name, website, created date, active state, and three
per-organization switches:

- **Shared Templates** — whether template boards shared with this organization are
  available to its members.
- **Propagate Members To Boards** — whether members of this organization are
  automatically added to the boards that list it (add-only; template boards are
  skipped). Runs during the LDAP background sync, and can be triggered by an admin.
- **Sync Members From Auth Provider** — whether membership is kept in sync from the
  authentication provider, e.g. LDAP groups (`LDAP_SYNC_ORGANIZATIONS`).

Each header of those three carries a select-all / unselect-all pair, and each row has
**Edit** and a ⋯ menu. The **New** link is the first column's header — it is there
even when the table is empty, which is how the first organization gets created.

## An Organization as a tenant

**Edit** on a row also carries the fields that make an Organization a tenant of this
server — one WeKan process serving several domains, each with its own address, its own
branding and its own administrators. It is off unless the server is started with
`MULTITENANCY=true`, and an Organization with no domains is not a tenant.

- **Domains of this Organization** — the hostnames this Organization is served on,
  separated by commas (`a.example.com, kanban.example.org`). A request to one of them
  is this Organization's request. A domain that already belongs to another
  Organization is refused, naming the domain.
- **Branding** — product name, the login logo and the text below it, the top-left
  corner logo, the custom help link and the legal notice URL. Each one that is set
  replaces the instance value on this Organization's domains; each one left empty
  keeps the instance value. The **theme colour** is set in
  [Settings / Visibility / Change color](../Settings/Visibility.md) instead, by that
  Organization's own admin.

Deactivating an Organization takes its domains off the air without losing any of this.

The whole design, and what it deliberately does NOT isolate, is
[Design / Multitenancy](../../../Design/Multitenancy/Multitenancy.md).

## Organization admins

The ⋯ menu of a row opens **Organization admins**: the members of that Organization,
with a checkbox each. A ticked member administers that Organization — and nothing
else:

| | Site admin | Organization admin |
| --- | --- | --- |
| Admin Panel tabs | Settings, People, Attachments, Problems | People, Attachments, Settings (one pane) |
| People they see | everyone | the members of the Organizations they administer |
| Organizations they see | all | the ones they administer |
| Settings | everything | Visibility / Change color only |
| Backup | the whole instance, or any Organization | their own Organization only |
| Grant the site-wide **Admin** flag | yes | never |
| Manage a site admin | yes | never |
| Appoint an Organization admin | in any Organization | in their own |

A site admin may appoint them anywhere; an Organization's own admin may appoint others
inside their Organization, which is what lets a tenant run itself. Someone who is not a
member of the Organization cannot be appointed.

## Legacy HTML4

The same `/admin/people/organizations` URL has a semantic, accessible HTML4
baseline when JavaScript drag and drop is unavailable. It retains the ten table
columns, literal search, ten-row Previous/Next paging, creation and editing, tenant
domains and branding, both GIF logo uploads, all three individual and bulk feature
switches, the same-Organization restriction, Organization administrator controls
and confirmed deletion. Every action is a labelled, CSRF-protected HTTP POST and
works without JavaScript or cookies.

The HTML4 and modern views call the same server operations. Those operations use
fixed fields and bounds, normalize tenant hostnames, permit only HTTP(S) or local
branding links, and repeat site- or Organization-administrator authorization.
Tenant administrators see only Organizations they administer. An Organization
with members cannot be deleted; this expected safety refusal appears in Problems
at medium severity without disabling the administrator. Forged scope or privilege
attempts are blocked and reported as high-severity TenantBleed events with the
available identity, address and location context.
