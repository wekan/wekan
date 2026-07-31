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

| Role | Member flag | Which cards they see | Comment | Create / edit cards | Move cards | Create / edit lists, swimlanes, checklists | Board settings, members, roles |
|---|---|---|---|---|---|---|---|
| **Board admin** | `isAdmin` | all | yes | yes | yes | yes | **yes** |
| **Normal** | *(none set)* | all | yes | yes | yes | yes | no |
| **Normal, assigned only** | `isNormalAssignedOnly` | **only assigned to them** | yes | yes | yes | yes | no |
| **No comments** | `isNoComments` | all | **no** | **no** ⚠ | **no** ⚠ | **no** ⚠ | no |
| **Comment only** | `isCommentOnly` | all | yes | no | no | no | no |
| **Comment only, assigned** | `isCommentAssignedOnly` | **only assigned to them** | yes | **yes** ⚠ | **yes** ⚠ | **yes** ⚠ | no |
| **Worker** | `isWorker` | all | yes | no | **yes** | no | no |
| **Read only** | `isReadOnly` | all | no | no | no | no | no |
| **Read only, assigned** | `isReadAssignedOnly` | **only assigned to them** | no | no | no | no | no |

⚠ = the code does not do what the role's name says. Explained under
[Known gaps](#known-gaps); nothing has been changed to make the table say
something nicer than the code does.

## Where each column comes from

Two helpers in `server/lib/utils.js` decide almost everything, and they are what
the `allow` rules in `server/permissions/` call:

- **Create / edit** — `allowIsBoardMemberWithWriteAccess()`: an active member with
  none of `isNoComments`, `isCommentOnly`, `isWorker`, `isReadOnly`,
  `isReadAssignedOnly`. It gates cards (`server/permissions/cards.js`), lists,
  swimlanes, checklists and checklist items, and the cross-board move guards.
- **Comment** — `allowIsBoardMemberCommentOnly()`: a member who is not
  `hasNoComments`, `hasReadOnly` or `hasReadAssignedOnly`. It gates card comments
  and comment reactions (`server/permissions/cardComments.js`,
  `cardCommentReactions.js`).

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

## Known gaps

These are findings, not decisions. Each is a place where the code and the role's
name disagree, and each needs a maintainer's call on which side is wrong.

1. **"Comment only, assigned" has full write access.** Nothing outside the card
   publications ever reads `isCommentAssignedOnly`. It is not in
   `allowIsBoardMemberWithWriteAccess()`, so the member may create and edit cards,
   lists and checklists — the role is in practice "Normal, but only sees the cards
   assigned to me", which is what `isNormalAssignedOnly` already means. Compare
   `isCommentOnly`, which *is* in that list.

2. **"No comments" cannot write anything.** `allowIsBoardMemberWithWriteAccess()`
   excludes `isNoComments`, so the role blocks editing as well as commenting —
   while the schema describes it as "is the member not allowed to make comments"
   and the UI (`Utils.canModifyCard()`) does not exclude it. So the member is
   offered the edit affordances and the server refuses the write. Either the
   helper should stop excluding `isNoComments` or the UI should stop offering it;
   the name and the schema comment both point at the helper.

3. **The write helper does not exempt board admins.** Every `has*()` helper on the
   board requires `isAdmin: false`, so a flag on an admin is ignored — but
   `allowIsBoardMemberWithWriteAccess()` reads the raw flags, so an admin who also
   carried `isNoComments` would lose write access. Not reachable from the UI,
   because `setMemberPermission` writes all eight flags at once and never leaves
   two set, but it is reachable over the REST API, which takes the flags
   individually.

## Where the UI is more generous than the server

The UI helpers in `client/lib/utils.js` do not check the same flags as the server,
so these members see buttons whose action the server then refuses:

| UI check | Does not exclude | Effect |
|---|---|---|
| `canModifyCard()` | `isNoComments` | No-comments members are offered card editing (gap 2 above). |
| `canModifyBoard()` | `isNoComments`, `isWorker` | No-comments and Worker members are offered list/swimlane editing. |
| `canModifyCard()`, `canModifyBoard()` | `isCommentAssignedOnly` | Consistent with the server, which also allows it (gap 1 above). |

None of these is a security hole — the server rules are the authority and they
hold — but each is a button that does nothing, which reads as a bug to the person
clicking it.

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
