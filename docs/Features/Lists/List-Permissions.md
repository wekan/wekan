# List permissions

A board admin can make exceptions to the board's roles for one list: let a
role edit or comment in that list although the board does not allow it, or
stop a role from doing so although the board does.
([#4527](https://github.com/wekan/wekan/issues/4527))

The example from the issue: a board where everybody is **Read Only**, with one
list, *Ideas*, where everybody may add cards and comment.

## Setting them

List menu (☰ in the list header) → **List permissions**. Only board admins see
it. Each role has two choices, **Edit** and **Comment**:

| Choice | Meaning |
| --- | --- |
| As on the board | the role's own rule ([Roles](../Board-Sidebar/Members/Roles.md)) decides |
| Allowed | the role may do it in this list |
| Not allowed | the role may not do it in this list |

The rows are the built-in roles, the [custom roles](../Board-Sidebar/Members/Roles.md#custom-roles),
and, on a public board or one open to every signed-in user, **Everyone signed
in** — people who are not members of the board.

## What it covers

- **Edit** is adding, changing, moving and deleting cards in the list, with
  their checklists, attachments and notes. Moving a card into the list, or out
  of it, needs Edit in that list.
- **Comment** is commenting on the list's cards.
- A **board admin** is never restricted by an exception.
- A member a board admin **removed** stays removed: an exception never gives
  them a role back.
- Board settings, other lists and swimlanes are not affected.

## REST API

A list's **Not allowed** applies to the REST API too: the per-list card
routes answer 403. A list's **Allowed** does not open the REST API to a role
that may not write the board; that stays a board-level permission.

## Implementation

- `models/lib/listPermissions.js` decides (`listCan`); pure, tested by
  `tests/listPermissions.test.cjs`.
- `server/listPermissions.js` applies it to card and comment writes and has the
  `lists.setRoleExceptions` method; a direct client write of
  `list.roleExceptions` is refused and recorded in Admin Panel → Problems.
- `server/lib/listPermissionGate.js` is shared by the methods, the Scrum view
  and the REST API.
