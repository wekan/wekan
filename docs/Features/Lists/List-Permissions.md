# List permissions

## What it is

A board admin can make exceptions to the board's roles for one list: let a
role edit or comment in that list although the board does not allow it, or
stop a role from doing so although the board does.
([#4527](https://github.com/wekan/wekan/issues/4527))

The example from the issue: a board where everybody is **Read Only**, with one
list, *Ideas*, where everybody may add cards and comment.

## Read more

- [Role-based access control](https://en.wikipedia.org/wiki/Role-based_access_control)
  on Wikipedia - permissions given to roles rather than to people.
- [Access-control list](https://en.wikipedia.org/wiki/Access-control_list)
  on Wikipedia - a permission attached to one object, here one list.
- WeKan: [Roles](../Board-Sidebar/Members/Roles.md),
  [Archive and Delete](../Board-Sidebar/Archive/Archive-and-Delete.md).

## How to use it

1. Click ☰ (**List Actions**) in the list header → **List permissions**
   (under **Settings**). Only board admins see it.
2. The popup says *What each role may do in this list, over what the board
   allows. Board admins can always edit.* Each role row has two choices,
   **Edit** and **Comment**:

   | Choice | Meaning |
   | --- | --- |
   | As on the board | the role's own rule ([Roles](../Board-Sidebar/Members/Roles.md)) decides |
   | Allowed | the role may do it in this list |
   | Not allowed | the role may not do it in this list |

3. Click **Save**. Setting every choice back to *As on the board* removes the
   list's exceptions.

The rows are the built-in roles, the [custom roles](../Board-Sidebar/Members/Roles.md#custom-roles),
and, on a public board or one open to every signed-in user, **Everyone signed
in** — people who are not members of the board.

### What it covers

- **Edit** is adding, changing, moving and deleting cards in the list, with
  their checklists, attachments and notes. Moving a card into the list, or out
  of it, needs Edit in that list.
- **Comment** is commenting on the list's cards.
- A **board admin** is never restricted by an exception.
- A member a board admin **removed** stays removed: an exception never gives
  them a role back.
- Board settings and other lists are not affected; a swimlane is, as below.

### What a refusing list also refuses

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

### REST API

A list's **Not allowed** applies to the REST API too: the per-list card
routes answer 403. A list's **Allowed** does not open the REST API to a role
that may not write the board; that stays a board-level permission.

## How the numbers are calculated

This feature has no numbers of its own. Its rules are a decision order
([models/lib/listPermissions.js](../../../models/lib/listPermissions.js),
`listCan`):

1. A user with no board role, or a removed member, has no exception.
2. A board admin has no exception.
3. Otherwise the list's exception for the user's role and capability
   (`write` or `comment`; moving a card counts as `write`) decides when it is
   set, and the board's own role rule decides when it is not.

Saved role keys are checked by `cleanExceptions`: at most 100 characters, a
built-in role name, `custom:<id>` or `signed-in`; `board-admin` is never
saved, and only true/false values for `write` and `comment` are kept.

## How it works in WeKan

- `models/lib/listPermissions.js` decides (`listCan`); pure, tested by
  [tests/listPermissions.test.cjs](../../../tests/listPermissions.test.cjs).
- [server/listPermissions.js](../../../server/listPermissions.js) applies it to
  card and comment writes and has the `lists.setRoleExceptions` method (board
  admins and site admins only); a direct client write of `list.roleExceptions`
  is refused and recorded in Admin Panel → Problems.
- [server/lib/listPermissionGate.js](../../../server/lib/listPermissionGate.js)
  is shared by the methods, the Scrum view and the REST API.
- The popup is [client/components/lists/listPermissions.jade](../../../client/components/lists/listPermissions.jade)
  and [listPermissions.js](../../../client/components/lists/listPermissions.js);
  the exceptions are stored in `list.roleExceptions`.
- More tests: [server/lib/tests/listPermissions.tests.js](../../../server/lib/tests/listPermissions.tests.js),
  [tests/playwright/specs/list-lock-bulk.e2e.js](../../../tests/playwright/specs/list-lock-bulk.e2e.js),
  [list-lock-checklists.e2e.js](../../../tests/playwright/specs/list-lock-checklists.e2e.js),
  [list-lock-attachments.e2e.js](../../../tests/playwright/specs/list-lock-attachments.e2e.js),
  [list-lock-move.e2e.js](../../../tests/playwright/specs/list-lock-move.e2e.js) (the REST swimlane move, GHSA-394w-8q99-q4qx).

## Commits

 - [List Sync's rule replay skips an action into a refusing list](https://github.com/wekan/wekan/commit/a0f36819610e6d0aa9c170340f8421c1b7fc2bbe)
 - [a rule action into a refusing list is skipped](https://github.com/wekan/wekan/commit/ee24453dcb5d9ed8af5c07b848cbd5bd8979ae28)
 - [the exception also refuses deleting, archiving or moving the list and its swimlane](https://github.com/wekan/wekan/commit/3202a1d7ac1027b41af5a5dfbe03893ccbc89c36)
 - [dependency lines follow the card's list role exception](https://github.com/wekan/wekan/commit/da6d9d39b8bd209006fc02fe735f1c277a2be693)
 - [bulk and server-side card writes ask the list's role exception](https://github.com/wekan/wekan/commit/ba3d94390ba724344a2d5cfe50e9dee3cc6f8d89)
 - [the refusal holds for the checklist REST routes too](https://github.com/wekan/wekan/commit/214b20e7adfc61d7a5f202f923cfc4fe29856207)
 - [per-list permissions added](https://github.com/wekan/wekan/commit/7595727917d436ea71969d6d74d166b42b38ed4e)
