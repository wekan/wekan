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
