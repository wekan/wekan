# Admin Panel / People / Teams

## What it is

The teams on this instance, and one restriction that belongs with them. A Team
groups users who work together, so that a board can be shared with the whole
team, template boards can be shared with it, its members can be kept in step
with a directory such as LDAP, and the People list can be narrowed to one team.
Teams work like [Organizations](Organizations.md), without the tenant part.

## Read more

- [Team](https://en.wikipedia.org/wiki/Team) and
  [Directory service](https://en.wikipedia.org/wiki/Directory_service) on
  Wikipedia.
- [Organizations](Organizations.md) - the same table, for Organizations, and
  what having both restrictions on means.
- [Group members](../../All-Boards/Group-Members.md) - the Team's tab in All
  Boards.
- [People](People.md) - the **Team:** filter and the **Teams** action.
- [LDAP](../../Login-Page/LDAP.md) - syncing Teams from directory groups.

## How to use it

**Restrict who can be added to a board**

1. Open **Admin Panel**, **People**, **Teams** (`/admin/people/teams`).
2. Tick **Add board members only from the same Team** above the table.

**Create and edit a Team**

1. Click **New** in the first column's header.
2. Fill in the name, description, short name and website, and save.
3. Click **Edit** on a row to change it, or use the row's ⋯ menu to delete it.

**Switch a feature for one or for all**

1. Tick or untick **Shared Templates**, **Propagate Members To Boards** or
   **Sync Members From Auth Provider** on a row; it saves at once.
2. Or use the select-all / unselect-all pair in that column's header.

**Put people into a team**

1. Open **People**, tick the people in the last column.
2. Click **Teams** in the controls row and add or remove teams for them.

## How the numbers are calculated

- **Rows per page**: 10, the shared table page's `TABLE_PAGE_ROWS_PER_PAGE`
  ([models/lib/tablePage.js](../../../../models/lib/tablePage.js)); the total
  is the number of Teams matching the search, counted on the server.
- **Propagate Members To Boards** reports how many boards were updated and how
  many members were added; it never removes or changes an existing member.
- The board-member restriction is a yes/no test, not a count.

## How it works in WeKan

### Add board members only from the same Team

The checkbox above the table (`boardMembersFromSameTeamOnly`, default off). When it
is on, a user may only be added to a board if they share a Team with whoever is
adding them — or with an active member of that board. Site admins bypass it, and it
is enforced server-side, in the invite action and in the user-search typeahead alike.

See [Organizations](Organizations.md) for the matching Organization checkbox and what
having both on means. The decision is `canAddUserToBoard` in
[server/lib/orgTeamRestriction.js](../../../../server/lib/orgTeamRestriction.js).

### The table

Display name, description, short name, website, created date, active state
(**Active Team**), the feature profiles assigned to the team, and three
per-team switches — **Shared Templates**, **Propagate Members To Boards** and **Sync
Members From Auth Provider** — which work exactly as the organization ones do
(`LDAP_SYNC_TEAMS` for the last). The **New** link is the first column's header.

A board membership that a team gave is marked with the team
(`grantedBy: ['team:<id>']`), so leaving the team removes what it gave and
nothing else; a direct membership is never touched, and a board admin is kept
([models/lib/groupBoardMembership.js](../../../../models/lib/groupBoardMembership.js)).

### Files and tests

- Collection `team` ([models/team.js](../../../../models/team.js)), methods in
  [server/models/team.js](../../../../server/models/team.js) (admin only),
  propagation in
  [server/propagateOrgTeamMembers.js](../../../../server/propagateOrgTeamMembers.js).
- The pane is `teamGeneral`, `teamRow`, `editTeamPopup` and `settingsTeamPopup`
  in [peopleBody.jade](../../../../client/components/settings/peopleBody.jade).
- Teams are site-admin only: a per-tenant Organization admin does not get this
  pane.
- Pinned by [server/lib/tests/orgTeamRestriction.tests.js](../../../../server/lib/tests/orgTeamRestriction.tests.js),
  [tests/propagateMembers.test.cjs](../../../../tests/propagateMembers.test.cjs),
  [tests/groupBoardMembership.test.cjs](../../../../tests/groupBoardMembership.test.cjs),
  [tests/teamBoardMemberSync.test.cjs](../../../../tests/teamBoardMemberSync.test.cjs),
  [tests/peopleTeamFilter.test.cjs](../../../../tests/peopleTeamFilter.test.cjs)
  and the browser test
  [32-org-team-feature-toggles.e2e.js](../../../../tests/playwright/specs/32-org-team-feature-toggles.e2e.js).

## Commits

 - [The feature profiles column](https://github.com/wekan/wekan/commit/fc21b0b177dc8f8902efa39d0f89c8b041c7cf2d)
 - [Missing team feature updates answer 404](https://github.com/wekan/wekan/commit/5134e3d2a8c99c7c7892278cf39e97603ddb3399)
 - [Memberships given by a team leave with the team](https://github.com/wekan/wekan/commit/50bb989eb8d90ed9bfafbceb3f9f8e68e208116e)
 - [Filter People by Team](https://github.com/wekan/wekan/commit/0297f52c4ba4beb47a60fb2c4d5798696c8c9af1)
 - [Admin Panel handlers no longer run the caller's selector unchecked](https://github.com/wekan/wekan/commit/b4ebe48d7b62055bc5c9eca74600afd2658034b3)
 - [Propagate Members To Boards passes the id, not the selector](https://github.com/wekan/wekan/commit/8e89262d0083f1b84989feb5a42241640d4c96a5)
 - [The board-member restriction becomes one checkbox here and one in Organizations](https://github.com/wekan/wekan/commit/f0ea1601b3f6e2530501873efc5824d48ee79991)
 - [Teams render through the shared table page](https://github.com/wekan/wekan/commit/6908821d179178f2285b3cca6613f4427fc8d0c8)
 - [Propagate Members To Boards actually propagates](https://github.com/wekan/wekan/commit/5234d09d150f2cf219b4ca341f03764eea84e2e7)
 - [Restrict adding board members to the same Organization or Team](https://github.com/wekan/wekan/commit/371258a6d0839e45763be383bc3dee1d08108dd6)
 - [Organization, team and domain sharing work end to end](https://github.com/wekan/wekan/commit/422e70329f6575575a817750f2424e3896138245)
 - [Implement Propagate Members To Boards](https://github.com/wekan/wekan/commit/f5cca8cea12fac0cdffae5293463c090def22538)
 - [REST API for the Team feature switches](https://github.com/wekan/wekan/commit/dbaa27dd67d88e87db9cdac286029bd208bbc008)
 - [Confirm text above the delete button](https://github.com/wekan/wekan/commit/16379201704ea1a43ce14859633ffb1b9fae6710)
 - [Teams in the Admin Panel](https://github.com/wekan/wekan/commit/9e2093d6aed38e66fc4d63823315c9382e013a32)
