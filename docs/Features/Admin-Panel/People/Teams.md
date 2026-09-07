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

## Legacy HTML4

The same `/admin/people/teams` URL has a semantic, accessible HTML4 baseline when
JavaScript drag and drop is unavailable. It retains all ten columns, literal
search, ten-row Previous/Next paging, creation and editing, each individual and
bulk feature switch, the same-Team restriction and confirmed deletion. Every
action is a labelled, CSRF-protected HTTP POST and works without JavaScript or
cookies.

HTML4 and the modern view call the same Global Admin-only operations. The common
service fixes the readable fields, bounds input, treats search as literal text,
propagates display-name changes to memberships and refuses duplicate short names.
A Team with members cannot be deleted; this expected safety refusal is reported
at medium severity without disabling the administrator. Forged access or feature
names are blocked and reported as high-severity TeamBleed events with available
identity, address and location context.
