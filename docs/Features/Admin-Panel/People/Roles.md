# Admin Panel / People / Roles

## What it is

Which board roles are allowed to perform each action — a checkbox list, not a table.
Admin Panel users (global admins) always have every right, whatever is ticked here.

Today there is one action, **Allow Invite to Board**: which of the nine per-board
roles may invite someone to a board they are on. Below it, **Custom roles** lets
an administrator build named roles out of what a board member may do, and a
read-only **Roles Status** table shows what every role may do.

Everything a role may do *inside* a board is described in
[Members and Permissions](../../Board-Sidebar/Members/README.md).

## Read more

- [Role-based access control](https://en.wikipedia.org/wiki/Role-based_access_control)
  and [Access control](https://en.wikipedia.org/wiki/Access_control) on
  Wikipedia.
- [Members and Permissions](../../Board-Sidebar/Members/README.md)
- [Invite People](../../Member-Settings/Invite-People.md)

## How to use it

**Who may invite to a board**

1. Open **Admin Panel**, **People**, **Roles** (`/admin/people/roles`).
2. Under **Allow Invite to Board**, tick the roles that may invite: **Board
   Admin**, **Normal**, **Worker**, **Comment only**, **No comments**, **Only
   Assigned Normal**, **Only Assigned Comment**, **Read Only** and **Only
   Assigned Read**. **All Board Members** ticks or unticks all of them.
3. Click **Save**.

**Build a custom role**

1. Under **Custom roles**, type a **Role name** in the empty row.
2. Tick what the role may do: **Sees all cards**, **Comment**, **Create and
   edit**, **Move cards** and **Invite to board**.
3. Click **Add role**. An existing role's row has **Save** and **Delete**, and
   each row saves on its own.
4. Give the role to a board member in the board's member settings, like a
   built-in role.

**Check what each role may do**

1. Read the **Roles Status** table below: **Role**, **Invite to board**,
   **Sees cards** (All or Assigned only), **Comment**, **Create and edit**,
   **Move cards** and **Board settings**.
2. It follows the checkboxes above, so it shows what you have selected before
   you save.

## How the numbers are calculated

- **Default**, when nothing has been saved: only **Board Admin** and
  **Normal** may invite (`INVITE_TO_BOARD_ROLES_DEFAULT` in
  [models/inviteToBoardRolesSettings.js](../../../../models/inviteToBoardRolesSettings.js)).
- **Roles**: nine built-in roles, plus any custom roles.
- **Role name**: at most 60 characters.
- **Create and edit** brings **Move cards** with it in a custom role, as in
  every built-in role: moving a card is writing it.
- The Roles Status values come from one capability table,
  `ROLE_CAPABILITIES` in
  [models/lib/boardRoleCapabilities.js](../../../../models/lib/boardRoleCapabilities.js),
  the same table the server's permission checks read, so the pane cannot show
  a permission that is not enforced. **Invite to board** is Yes when the role
  is ticked above.

## How it works in WeKan

- The invite choice is one document, `inviteToBoardRoles`, of the
  `inviteToBoardRolesSettings` collection, with the list `allowedRoles`.
- Every invite path asks `canInviteToBoard` in
  [models/lib/invitationBoardPermission.js](../../../../models/lib/invitationBoardPermission.js):
  a site admin (`isAdmin`) may always invite; otherwise the member's role on
  that board must be in `allowedRoles`, and a custom role uses its own
  **Invite to board** setting. A refused e-mail invitation (`sendInvitation`)
  is recorded in Admin Panel / Problems.
- A custom role cannot be a board admin: **Board settings** (`manageBoard`)
  stays with the built-in Board Admin role, because a board must always keep
  one. Custom roles are the `customBoardRoles` collection
  ([models/customBoardRoles.js](../../../../models/customBoardRoles.js)),
  saved with `customBoardRoles.save` and removed with `customBoardRoles.remove`;
  a member who has one carries `customRoleId`.
- The pane is `rolesGeneral` in
  [peopleBody.jade](../../../../client/components/settings/peopleBody.jade);
  the Roles Status table is the shared table page.
- Pinned by [tests/boardRoles.test.cjs](../../../../tests/boardRoles.test.cjs),
  [tests/customBoardRoles.test.cjs](../../../../tests/customBoardRoles.test.cjs),
  [server/lib/tests/customBoardRoles.tests.js](../../../../server/lib/tests/customBoardRoles.tests.js)
  and [tests/invitationBoardPermission.test.cjs](../../../../tests/invitationBoardPermission.test.cjs).

## Commits

 - [Custom board roles](https://github.com/wekan/wekan/commit/50bb989eb8d90ed9bfafbceb3f9f8e68e208116e)
 - [Authorize every board before sending registration invitations](https://github.com/wekan/wekan/commit/af93621261e6bdc112f4b46b62e8507b7c7764ce)
 - [Fix the Roles Status table's missing translation import](https://github.com/wekan/wekan/commit/48106ee17e67f400cb47e37c2a97711a37c1e463)
 - [A Worker can move a card and assign themselves to it](https://github.com/wekan/wekan/commit/7b35cb5f03883f31c198171bc18e6d53ecc380fb)
 - [One capability table, and the Roles Status table that shows it](https://github.com/wekan/wekan/commit/efa534fddf5a9fbec0d3b663d8cbbd77ca9b161d)
 - [Add the Roles pane: which board roles may invite](https://github.com/wekan/wekan/commit/c956ab5a4e2d675641f8c74df2dcde675474ab06)
