# All Boards / Board labels

Above the board icons of All Boards is a **facet bar** (#4791): the boards you
see grouped by the first character of their names, by the organizations and
teams they are shared with, and by your own **board labels**, each group with
its count. Clicking a group shows only its boards; clicking it again, or
**Show all boards**, shows all of them again. The bar is drawn in the icon
view, not in the Table view (`.board-facets` in
`client/components/boards/boardsList.jade`).

## Board labels are your own

A board label is a name you file boards under. It is stored on your own user
document, `profile.boardLabels` as `{ label: [boardId, ...] }`, and is not
shown to anybody else; it does not change the board.

The label row (`fa-tag`) lists each of your labels that has at least one board
you can see, with its count:

- **Click the label** to show only its boards.
- **X** beside it (**Remove this board label**) calls `removeBoardLabel`,
  which deletes that label from your profile. The boards are not changed.

## Apply label

At the end of the label row is a small form:

- **Board label** - the label's name, up to 40 characters; control
  characters, `.` and `$` are removed.
- **for boards whose name includes** - the text to look for.
- **Apply label** - calls `applyBoardLabel` (`server/allBoardsFacets.js`).

Every board you see in All Boards whose name includes the text, ignoring case,
is added to that label; boards already under it stay. An empty name or text is
refused with an alert. The boards counted are the same ones All Boards lists:
not archived, not hidden by you, and visible to you through membership, an
organization, a team or an email domain. The grouping and matching are in
`models/lib/allBoardsFacets.js`.

## Related

- [All Boards](All-Boards.md)
- [Workspaces](Workspaces.md) - another way to file boards
- [Group members](Group-Members.md) - the organization and team tabs
