# All Boards / Organization and team tabs / Group members

## What it is

Below the Workspaces in the All Boards left menu is one tab per organization
(`fa-sitemap`) and team (`fa-users`) you belong to (#802). Clicking a tab shows
the boards shared with that group and, above them, who is in it. The group's
own admins, and site admins, can add and remove members there, without going to
the Admin Panel.

## Read more

- [Role-based access control](https://en.wikipedia.org/wiki/Role-based_access_control)
  on Wikipedia - access given through a group rather than to a person
- [Directory service](https://en.wikipedia.org/wiki/Directory_service) - where
  LDAP-synced groups come from
- [Admin Panel / People / Organizations](../Admin-Panel/People/Organizations.md)
  and [Teams](../Admin-Panel/People/Teams.md) in these docs

## How to use it

**See a group's boards and members**

1. Open **All Boards**.
2. In the left menu, below **Workspaces**, click the organization or team.
3. The group's boards are shown with the members panel above them. The panel is
   drawn in the icon view, not in the Table view.
4. Click the selected tab again to go back to all boards.

With no organizations or teams, there are no tabs.

**Add a member** (group admins and site admins)

1. Type the username in the **Username** field of the members panel.
2. Click **Add member**.

**Remove a member** (group admins and site admins)

1. Click the **X** (*Remove from this group*) beside the member.

## How the numbers are calculated

- The panel lists **at most 1000** members, sorted by username (`groupMembers`
  method, [server/groupMembers.js](../../../server/groupMembers.js)).
- Each of `groupMembers`, `addGroupMember` and `removeGroupMember` is
  rate-limited to **20 calls per 10 seconds** per connection.
- The tabs themselves have no count; the number of boards shared with a group
  is shown in the facet bar ([Board labels](Board-Labels.md)).

## How it works in WeKan

The tabs are listed from your own user document (`myGroups()` in
[models/lib/groupMembers.js](../../../models/lib/groupMembers.js)): each entry of
`orgs` and `teams` with an id becomes a tab.

### The members panel

The group's name, then each member's username and full name, with **(Admin)**
after the group's admins (`groupMembers` method, `server/groupMembers.js`, at
most 1000 members, sorted by username). A group admin is a user whose own
`orgs.$.isAdmin` / `teams.$.isAdmin` is true for that group.

What you can do depends on `groupAccess()`:

| You are | You can |
| --- | --- |
| An admin of this organization or team, or a site admin | Add a member by username (**Add member**) and remove one (the **X**, *Remove from this group*). |
| A member of it | See who is in it. |
| Anybody else | Nothing: the server refuses. |

A group whose members come from the sign-in provider - LDAP or another
directory sync (`orgSyncMembersFromAuth` / `teamSyncMembersFromAuth`) - is
read-only for everybody, admins included, and says so: *Only this group's
admins can change who is in it. A group that comes from LDAP or another
directory is changed there, not in WeKan.* The same text is shown to a member
who is not an admin. A site admin who is not a member can still see who is in
such a group.

Adding an unknown username shows an error (`user-not-found`). Adding someone
already in the group, or removing someone not in it, changes nothing: the
update is `$push` / `$pull` on the target user's `orgs` or `teams`
(`addModifier()` / `removeModifier()`), built only when it would change
something.

| File | What it does |
| --- | --- |
| [models/lib/groupMembers.js](../../../models/lib/groupMembers.js) | Pure: `KINDS`, `groupAccess`, `addModifier`, `removeModifier`, `myGroups`. |
| [server/groupMembers.js](../../../server/groupMembers.js) | The methods `groupMembers`, `addGroupMember`, `removeGroupMember`. |
| [client/components/boards/boardsList.jade](../../../client/components/boards/boardsList.jade) | The tabs and the members panel. |
| [tests/groupMembers.test.cjs](../../../tests/groupMembers.test.cjs) | Who may manage, view or nothing, and the modifiers. |

### Related

- [Admin Panel / People / Organizations](../Admin-Panel/People/Organizations.md)
- [Admin Panel / People / Teams](../Admin-Panel/People/Teams.md)
- [Board labels](Board-Labels.md) - the facet bar also groups boards by
  organization and team

## Commits

 - [A tab per organization and team in All Boards, where their admins manage members](https://github.com/wekan/wekan/commit/d04b8444a62f2ac191747cea840f8a94b8739684)
