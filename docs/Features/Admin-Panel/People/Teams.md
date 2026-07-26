# Admin Panel / People / Teams

The teams on this instance, and one restriction that belongs with them.

## Add board members only from the same Team

The checkbox above the table (`boardMembersFromSameTeamOnly`, default off). When it
is on, a user may only be added to a board if they share a Team with whoever is
adding them — or with an active member of that board. Site admins bypass it, and it
is enforced server-side, in the invite action and in the user-search typeahead alike.

See [Organizations](Organizations.md) for the matching Organization checkbox and what
having both on means.

## The table

Display name, description, short name, website, created date, active state, and three
per-team switches — **Shared Templates**, **Propagate Members To Boards** and **Sync
Members From Auth Provider** — which work exactly as the organization ones do
(`LDAP_SYNC_TEAMS` for the last). The **New** link is the first column's header.
