# All Boards / Organization and team tabs / Group members

Below the Workspaces in the All Boards left menu is one tab per organization
(`fa-sitemap`) and team (`fa-users`) you belong to (#802), listed from your
own user document (`myGroups()` in `models/lib/groupMembers.js`). With no
organizations or teams, there are no tabs.

Clicking a tab shows the boards shared with that group and, above them, its
members. Clicking the selected tab again goes back to all boards. The panel is
drawn in the icon view, not in the Table view.

## The members panel

The group's name, then each member's username and full name, with **(Admin)**
after the group's admins (`groupMembers` method, `server/groupMembers.js`, at
most 1000 members, sorted by username).

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
who is not an admin.

Adding an unknown username shows an error. Adding someone already in the group,
or removing someone not in it, changes nothing.

## Related

- [Admin Panel / People / Organizations](../Admin-Panel/People/Organizations.md)
- [Admin Panel / People / Teams](../Admin-Panel/People/Teams.md)
- [Board labels](Board-Labels.md) - the facet bar also groups boards by
  organization and team
