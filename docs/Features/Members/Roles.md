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

| Role | Member flag | Which cards they see | Comment | Create / edit cards, lists, swimlanes, checklists | Board settings, members, roles | Move a card, assign yourself |
|---|---|---|---|---|---|
| **Board admin** | `isAdmin` | all | yes | yes | **yes** | yes |
| **Normal** | *(none set)* | all | yes | yes | no | yes |
| **Normal, assigned only** | `isNormalAssignedOnly` | **only assigned to them** | yes | yes | no | yes |
| **No comments** | `isNoComments` | all | **no** | yes | no | yes |
| **Comment only** | `isCommentOnly` | all | yes | no | no | no |
| **Comment only, assigned** | `isCommentAssignedOnly` | **only assigned to them** | yes | no | no | no |
| **Worker** | `isWorker` | all | yes | no | no | **yes** |
| **Read only** | `isReadOnly` | all | no | no | no | no |
| **Read only, assigned** | `isReadAssignedOnly` | **only assigned to them** | no | no | no | no |

⚠ = the code does not do what the role's name says — see
[Known gaps](#known-gaps). Nothing here is written to make the table say
something nicer than the code does.

**Why moving a card IS its own column** (#3189). A move is a card *update*, so for
a long time it went through the same rule as editing one — and the Worker role,
whose whole purpose is moving cards and assigning itself, could do neither.
Moving and self-assigning are their own capability now, `moveCard`, enforced on
the server field by field (`models/lib/workerCardWrite.js`). Every role that can
create and edit can also move, so the column adds one answer rather than changing
eight.

The same table is in the product: **Admin Panel → People → Roles**, under the Save
button, as the read-only *Roles Status* pane. It is rendered from
`models/lib/boardRoleCapabilities.js`, which is also what the allow rules decide
with — so the page cannot show a permission that is not enforced.

## Per-list exceptions

A board admin can change what a role may do in ONE list - allow editing or
commenting there, or refuse it - see [List permissions](../Board/List-Permissions.md)
(#4527).

## Custom roles

An administrator can add named roles in **Admin Panel → People → Roles →
Custom roles** (#3022). A custom role is built from these columns:

- which cards the member sees: all, or only those assigned to them;
- whether they may comment;
- whether they may create and edit cards, lists, swimlanes and checklists;
- whether they may move cards and assign themselves (always on when they may
  edit);
- whether they may invite people to the board.

**Board admin** stays a built-in role. A custom role never gets the board
settings, members and roles column, because a board must always keep an admin.

A board admin gives a custom role to a member in the same popup as the built-in
roles: click the member, then **Change permissions**. The custom roles are
listed below the built-in ones, and each shows what it may do. The Roles Status
table in the Admin Panel lists the custom roles after the built-in ones.

How it is enforced:

- **The capability table decides.** Each permission check asks
  `models/lib/boardRoleCapabilities.js`. For a member with a custom role, the
  table answers from that role (`customRoleId` on the board member, read
  through `memberRoleOf`/`roleCan`).
- **The flags are a safe mirror.** The member's built-in flags are also set,
  to the most capable built-in role that grants nothing the custom role does
  not (`fallbackRoleFor`). Code that still reads a flag can therefore never
  grant more. That role also sees the same cards: all, or only assigned ones.
- **Changes reach every board.** Changing a role rewrites those flags on every
  board where it is used.
- **Deleting a role is safe.** Members keep the mirror, which is a subset of
  what the role allowed.
- **Name-based checks get the closest built-in role.** Where the interface or
  the server asks for a role by name (`hasWorker`, `isCommentOnly`, ...), a
  custom role answers as the built-in role that does what it does
  (`uiRoleFor`). A role that moves but does not edit is a Worker there.
- **Commenting is always asked as a capability.** The comment form, reactions,
  chat and the server all ask `comment`, never a role name.
- **Choosing a built-in role removes the custom one.**
- **REST whole-board reads** admit a custom role when it sees all cards.
- **Invitations** use the custom role's own invite setting; the built-in roles
  keep theirs from the Admin Panel list (`roleMayInvite`).
- **Imports drop a custom role from another instance.** Its id means nothing
  here, so an imported member keeps the flags.

`tests/customBoardRoles.test.cjs` checks every combination of capabilities.

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

**Which cards they see** is decided on the server for every board view, every
API and every write - see [Roles in every board view](#roles-in-every-board-view)
below.

**Board settings, members, roles** is `isBoardAdmin()`.

**Move a card, assign yourself** is the `moveCard` capability:
`Utils.canMoveCard()` in the UI, and on the server `canUpdateCard()` in
`server/permissions/cards.js`, which falls through to
`models/lib/workerCardWrite.js` for a member who has `moveCard` but not `write`.
That policy reads the update itself and allows only a move (`listId`,
`swimlaneId`, `sort`, and the `dateLastActivity` / `modifiedAt` written with them)
or an `$addToSet` / `$pull` of the caller's OWN id on `assignees`. Anything else —
a title, a label, somebody else's name, a whole-document replacement, an operator
it does not recognise — is refused.

## Roles in every board view

A role is a property of the member on **the board**, not of the view they look
at it through. Every board view, the API and every write ask the same question
of the same code, so switching from Swimlanes to Table, Calendar, Email or Chat
never shows a member a card their role hides, and never lets them change one.
This matters for the three assigned-only roles (and custom roles that see only
assigned cards, which carry the same flags): such a member sees and changes
**only the cards assigned to them** - `card.assignees` contains their user id.
Being one of a card's *members*, its requester or its assigner is not the same
thing and does not show them the card.

The rule is one function, `assignedOnlyCardScope()` / `assignedOnlyAllowsCard()`
in `models/lib/boardCardScope.js`, and the server applies it - the UI only
decides what to draw. A view that has no server source of its own draws from the
board's published cards, which are already narrowed.

### Custom roles in every board view

A [custom role](#custom-roles) from **Admin Panel → People → Roles → Custom
roles** is applied in every board view exactly as a built-in role is, because
every view asks the same two things of the member:

- **What may they do?** - comment, create and edit, move cards, invite. This
  is asked of the capability table (`memberCan()` / `roleCan()` in
  `models/lib/boardRoleCapabilities.js`), which answers from the custom role
  itself for a member who carries one.
- **Which cards may they see?** - this is asked of the member's flags
  (`isAssignedOnlyMember()`), and a custom role writes those flags. A role
  whose **Sees all cards** is off gives its members one of the three
  assigned-only flags (`fallbackRoleFor()` picks only among built-in roles
  that see no more cards than the role does), so in every view below they see
  and change only the cards assigned to them. A role with **Sees all cards**
  on never carries an assigned-only flag.

So the table below is the same for a custom role: read "an assigned-only
member" as "a member whose role does not see all cards", built-in or custom.
A custom role that may write but sees only assigned cards writes only its own
cards, in every view and method, and is refused by REST writes, like Normal,
assigned only.

The two never drift apart:

- **Giving the role** to a member writes its flags with it
  (`boards.setMemberCustomRole`).
- **Changing the role** in the Admin Panel rewrites the flags of every member
  who has it, on every board, at once (`refreshMembersOf`) - turning **Sees
  all cards** off narrows every view for all of them immediately, and turning
  it on widens them again.
- **Choosing a built-in role** removes the custom one, so its flags and its
  capabilities are the built-in role's alone (`setMemberPermission`).
- **Deleting the role** leaves its members on the flags it wrote, which see
  no more cards than the role did.

`tests/boardRoleViews.test.cjs` builds a member for every combination of
custom role capabilities, as the server writes it, and checks that each view's
rule narrows them exactly when their role does not see all cards - and that
nothing sets the flags without the custom role following.
`server/lib/tests/customBoardRoles.tests.js` checks on a running server that
turning **Sees all cards** off and on again reaches the member.

### Which source each view reads

| Board view | Where its cards come from | For an assigned-only member |
|---|---|---|
| Swimlanes, Lists, Calendar, Calendar Mode, Multi Board Calendar, Bigboard, Gantt, Frappe Gantt, DHTMLX Gantt, Roadmap, Map, Column sets | the `board` publication and `boardCardsWindow` (lazy loading) | only their cards, with those cards' comments, checklists, attachments and reactions; parent, linked and dependency cards by the role on **their own** board |
| Version Control | the board's published cards; closing or reopening an issue moves a card | only their cards, and only those can be closed or reopened |
| Table | `boardTablePage` through `publishBoardMatches` | only their cards, in the rows and in the page counts |
| Product Backlog, Sprints, Sprint Report, Velocity | `scrum.getBoardData` | only their cards; sprint snapshots, totals and rollover progress are narrowed to them |
| Statistics | `boardStatus` | counts of their cards only |
| Timeline | the `activities` publication | the board's activities that name no card, and those of their cards - on linked boards too, by their role there |
| Email | `emailViewPage` and `emailViewCount` | every folder, label and search holds only their cards; replying by email works only on their own cards |
| Chat | `chatViewChannels`, `chatViewBoardChannels`, `chatViewCardComments` | channels and conversations of their cards only |
| Dashboard, Burndown, Burnup, Cumulative Flow, Control, Cycle Time, Flow Efficiency, Lead Time, Throughput Histogram, WIP Run, Pulse, Aging WIP, Blocker Analysis, Monte Carlo Forecasts, Process Behavior (XmR), Work Item Size vs. Cycle Time, Time, Group by Assignee | `boardChartData` | **not available**: these charts are computed from every card of the board, so they are refused (`canExportBoardData` in `models/lib/exportAccess.js`). The Scrum charts above narrow to the member's own cards instead. |

The same rule reaches what is around the views:

- **Card search and filters** (`boardTextMatches`, `boardMovementMatches`),
  Global Search, Due Cards, My Cards and My Attachments - only their cards.
- **All Boards** - the tiles' card counts count their cards; the activity feed
  shows their cards' activities.
- **Notifications** - an old notification shows its card only while the member
  may still read it, so a card that is no longer theirs, or a board they left,
  stops appearing there.
- **Position history** - of their cards, and of the board's lists and
  swimlanes.
- **Change history** (undo, redo, restore) - of their cards only; a list or
  swimlane snapshot can hold other cards, so it is not shown to them.
- **Exports** (JSON, CSV, Excel, PDF, ZIP, iCalendar) - refused, as the charts
  are, because an export is the whole board.
- **REST API** - board reads and board writes are refused for an assigned-only
  member (`Authentication.checkBoardAccess` and `checkBoardWriteAccess` in
  `server/authentication.js`): those routes return or act on any card of the
  board by id. `GET /api/user/cards` lists only their cards.
- **Writes** - a Normal, assigned only member may create cards and edit, comment
  on, move, watch, copy and attach files to their own cards. Every write to a
  card asks the card (`canEditCardOrLinkedCard` in
  `server/lib/linkedCardPermission.js`), so changing, commenting on, running a
  card's button rule on, moving a checklist of, watching or copying another
  member's card is refused, whatever view or method it comes from. Moving or
  copying a whole list or swimlane is refused, because it carries cards they
  cannot see.

A request that no view would send for such a member - asking for another card
by id - is recorded under **AssignedBleed** in **Admin Panel → Problems**, with
the path that refused it. Opening a view, searching and API calls are narrowed or
refused without a record, because a member reaches them in ordinary use.

`tests/boardRoleViews.test.cjs` fails when a server file that serves card data
has no role rule and no stated reason, and `tests/assignedOnlyReads.test.cjs`
does the same for attachments and document text. A new board view needs no
code of its own for this as long as it draws from those sources; one that adds
a publication or method of its own must apply `assignedOnlyCardScope()` there,
and the test will say so if it does not.

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

3. **A Worker could not move a card or assign itself** (#3189) — the two things
   the role exists for. The board schema calls it "only allowed to move card,
   assign himself to card and comment"; both are card *updates*, so both went
   through the write rule, which excludes Worker. The reporter saw it as a card
   that showed their own name for a moment and then showed the previous assignee
   again: an optimistic write the server threw away.

   The fix is the field-level policy the old "Known gaps" entry said this needed,
   and not a widening of `write`: `moveCard` is its own capability, and
   `models/lib/workerCardWrite.js` decides each update by what it writes. A
   Worker may move a card and add or remove their own id in `assignees`;
   everything else, including assigning somebody else, is refused by default.

4. **The write rule did not exempt board admins.** Every `has*()` helper on the
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

None recorded. A new one belongs here, with the reason it is not fixed — not in
the table as a softer word.

## Setting a role

- **Web UI** — board sidebar, click a member's avatar, pick the role.
- **REST API** — see [Role.md](../../API/Role.md). Note that the API takes the
  flags individually, so it is the one way to produce a combination the UI cannot
  (see gap 3).
- **LDAP / OIDC** — group sync can set board membership; see
  [LDAP](../Login/LDAP.md).

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
