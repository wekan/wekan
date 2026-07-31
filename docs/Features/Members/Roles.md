# Board roles — what each one may and may not do

A board member has exactly one role. It is set from the board sidebar (click a
member's avatar) or over the [REST API](../../API/Role.md), and both write the
same eight booleans on the member — `setMemberPermission` sets all of them in one
update, so exactly one is `true` and the rest are `false`.

This page is the comparison table. It was written by reading the code, and a test
(`tests/boardRoles.test.cjs`) fails if the table and the code stop agreeing —
see [Keeping this page honest](#keeping-this-page-honest) at the end.

> **Board admin is not site admin.** `user.isAdmin` is the instance-wide Admin
> Panel administrator and is a different thing from a board's `board-admin` role.
> A site admin has no special power *inside* a board they are not a member of.

## The table

Everything below is what the **server** allows. The server is the authority: the
UI can only hide buttons, and where the two disagree it is listed under
[Where the UI is more generous than the server](#where-the-ui-is-more-generous-than-the-server).

| Role | Member flag | Which cards they see | Comment | Create / edit cards, lists, swimlanes, checklists — and move a card | Board settings, members, roles |
|---|---|---|---|---|---|
| **Board admin** | `isAdmin` | all | yes | yes | **yes** |
| **Normal** | *(none set)* | all | yes | yes | no |
| **Normal, assigned only** | `isNormalAssignedOnly` | **only assigned to them** | yes | yes | no |
| **No comments** | `isNoComments` | all | **no** | yes | no |
| **Comment only** | `isCommentOnly` | all | yes | no | no |
| **Comment only, assigned** | `isCommentAssignedOnly` | **only assigned to them** | yes | no | no |
| **Worker** | `isWorker` | all | yes | no ⚠ | no |
| **Read only** | `isReadOnly` | all | no | no | no |
| **Read only, assigned** | `isReadAssignedOnly` | **only assigned to them** | no | no | no |

⚠ = the code does not do what the role's name says — see
[Known gaps](#known-gaps). Nothing here is written to make the table say
something nicer than the code does.

**Why moving a card is not its own column.** A move is a card *update*, so it goes
through the same rule as editing one. There is no way for a role to move a card
but not edit it, which is exactly the Worker problem below.

The same table is in the product: **Admin Panel → People → Roles**, under the Save
button, as the read-only *Roles Status* pane. It is rendered from
`models/lib/boardRoleCapabilities.js`, which is also what the allow rules decide
with — so the page cannot show a permission that is not enforced.

## Where each column comes from

`models/lib/boardRoleCapabilities.js` is the table, in code. Everything reads it:

- **Create / edit** — `allowIsBoardMemberWithWriteAccess()` in
  `server/lib/utils.js` asks it for the `write` capability. It gates cards
  (`server/permissions/cards.js`), lists, swimlanes, checklists and checklist
  items, and the cross-board move guards.
- **Comment** — `allowIsBoardMemberCommentOnly()` asks it for `comment`. It gates
  card comments and comment reactions (`server/permissions/cardComments.js`,
  `cardCommentReactions.js`).
- **What the UI offers** — `Utils.canModifyCard()`, `canMoveCard()` and
  `canModifyBoard()` in `client/lib/utils.js` ask it for the same `write`
  capability, so a button is offered exactly when the server would accept it.
- **Admin Panel → People → Roles** renders the Roles Status table from it.

Each of those used to carry its own list of flags, and the lists had drifted —
which is what the first three gaps below were.

**Which cards they see** is the card publications, not an allow rule: for a member
with `isNormalAssignedOnly`, `isCommentAssignedOnly` or `isReadAssignedOnly`, the
card cursors are narrowed with `assignees: { $in: [userId] }` — in
`server/publications/boards.js` (eager card loading) and
`server/publications/cardsWindow.js` (lazy card loading), through
`assignedOnlyCardScope()` in `models/lib/boardCardScope.js`. The window's
comments, attachments, checklists and checklist items follow the same scope.

**Board settings, members, roles** is `isBoardAdmin()`.

**Move cards** is `Utils.canMoveCard()` in the UI; on the server a move is a card
update, so it goes through the write-access rule above — which is why Worker,
whose whole purpose is moving cards, is marked "yes" here but "no" for editing.

## Fixed

Three roles used to do something other than what their name says. All three came
from the same cause — the rule was written out as a list of flags in three
different places, and the three lists had drifted. They now read one table, and
`tests/boardRoles.test.cjs` fails if a fourth opinion appears.

1. **"Comment only, assigned" had full write access.** Nothing outside the card
   publications read `isCommentAssignedOnly`, and it was not in the write rule, so
   the role could create and edit cards, lists and checklists — it was "Normal,
   assigned only" under another name. It is comment-only now, like the role it is
   named after.

2. **"No comments" could not write anything.** The write rule excluded
   `isNoComments`, so the role blocked editing as well as commenting — a second
   read-only role under a name that says otherwise, and one the UI still offered
   the edit buttons for. It blocks commenting only now, which is what the name and
   the board schema both say it is for.

3. **The write rule did not exempt board admins.** Every `has*()` helper on the
   board ignores a flag on an admin; the write rule read the raw flags, so an
   admin who also carried `isNoComments` silently lost write access. Not reachable
   from the Web UI, which writes all eight flags at once, but reachable over the
   REST API, which takes them individually. `memberRoleOf()` resolves `isAdmin`
   first, so an admin is an admin whatever else is set.

The UI helpers were part of the same drift — `canModifyCard()` did not exclude
`isNoComments` while the server did, and `canModifyBoard()` excluded neither
`isNoComments` nor `isWorker` — so each disagreement was a button offered to
somebody whose write the server then refused. All three now ask the same table.

## Known gaps

4. **A Worker cannot move a card**, which is the one thing the role is for. The
   board schema calls it "only allowed to move card, assign himself to card and
   comment", and moving a card is a card *update*, so it goes through the write
   rule — which excludes Worker. The UI used to offer the drag anyway and the
   server refused it; now the UI does not offer it either, so the role is at least
   honest, but it is still a role that does nothing except comment.

   Not fixed here because the fix is not a table edit: it means letting a role
   write SOME fields of a card (`listId`, `swimlaneId`, `sort`, and `boardId`
   under the existing cross-board guard) and not others, and "assign himself"
   means validating that a member/assignee change only ever adds the caller. That
   is a field-level policy on the path every card update takes, and it wants
   deciding on purpose rather than as a side effect of documenting the table.

## Setting a role

- **Web UI** — board sidebar, click a member's avatar, pick the role.
- **REST API** — see [Role.md](../../API/Role.md). Note that the API takes the
  flags individually, so it is the one way to produce a combination the UI cannot
  (see gap 3).
- **LDAP / OIDC** — group sync can set board membership; see
  [LDAP](../../Login/LDAP.md).

## Keeping this page honest

`tests/boardRoles.test.cjs` reads this table and the code together, and fails when
they drift: every role `Board.memberRole()` can return must have a row here, every
row's flag must be a real member flag in the board schema, and the "create / edit"
and "comment" columns must match the flag lists in the two `server/lib/utils.js`
helpers. If you change a permission, this page is part of the change.

## Related

- [Members and Permissions](Members.md)
- [Change Role at Web UI and API](../../API/Role.md)
- [Admin Panel](../Admin-Panel/Admin-Panel.md)
