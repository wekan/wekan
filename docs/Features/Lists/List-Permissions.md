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
- Board settings and other lists are not affected; a swimlane is, as below.

## What a refusing list also refuses

Archiving, restoring, deleting or moving a list does the same to its cards,
so a list whose **Edit** exception refuses a role also refuses that role
(`server/listPermissions.js`, `server/lib/listPermissionGate.js`):

- deleting, archiving, restoring or moving the list itself. Renaming it,
  changing its colour or reordering it is still allowed;
- deleting, archiving or moving a swimlane that holds cards of the list, or
  that the list is bound to (`swimlaneRefusingListIds`);
- REST bulk writes (bulk delete, bulk labels) naming a card of the list, and
  the REST list delete, archive, unarchive and move routes: 403;
- Meteor methods that write a card in or into the list, such as Copy Card,
  Multi-Selection and **Archive all cards in this list**
  (`assertListsWritable`);
- a rule action that would write into the list: that action is skipped, the
  rest of the rule runs, and the skip is shown in Admin Panel → Problems;
- adding a dependency line from a card of the list.

The list menu follows it: in such a list, **Move List to Archive** and
[Archive all cards in this list](Archive-All-Cards.md) are not offered
(helper `mayWriteList` in `client/components/lists/listHeader.js`).

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
