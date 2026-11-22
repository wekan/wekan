# All Boards / Board labels

## What it is

Above the board icons of All Boards is a **facet bar** (#4791): the boards you
see grouped by the first character of their names, by the organizations and
teams they are shared with, and by your own **board labels**, each group with
its count. Clicking a group shows only its boards. A board label is a private
name you file boards under; **Apply label** files every board whose name
contains a text under one label at once.

## Read more

- [Faceted search](https://en.wikipedia.org/wiki/Faceted_search) on Wikipedia -
  narrowing a list by groups that each show their count
- [Tag (metadata)](https://en.wikipedia.org/wiki/Tag_(metadata)) and
  [Folksonomy](https://en.wikipedia.org/wiki/Folksonomy) - personal labels
- [All Boards](All-Boards.md), [Workspaces](Workspaces.md) and
  [Group members](Group-Members.md) in these docs

## How to use it

The bar is drawn in the icon (**Lists**) view, not in the **Table** view
(`.board-facets` in `client/components/boards/boardsList.jade`).

**Show only one group's boards**

1. Open **All Boards**.
2. In the facet bar, click a first character, an organization (`fa-sitemap`
   row), a team (`fa-users` row) or one of your board labels (`fa-tag` row).
3. To show all boards again, click the same group again, or **Show all
   boards**.

**File boards under a label (Apply label)**

1. At the end of the label row, type the label's name in **Board label** (up to
   40 characters).
2. Type the text to look for in **for boards whose name includes**.
3. Click **Apply label**.

**Remove a label**

1. Click the **X** beside the label (**Remove this board label**).

The label is deleted from your profile. The boards are not changed.

## How the numbers are calculated

From `boardFacets()` in
[models/lib/allBoardsFacets.js](../../../models/lib/allBoardsFacets.js):

- **First character** - one group per first character of the trimmed board
  title, taken as one whole letter or emoji and upper-cased, so "apple" and
  "Apple" are one group. The count is the number of boards in it. Groups are
  sorted by the character.
- **Organization / team** - one group per organization or team id in the
  board's `orgs` / `teams` entries that are not `isActive: false`; the count is
  the number of boards shared with it. Sorted by name.
- **Board label** - the count is how many of the label's board ids are among the
  boards you see now. A label with count 0 is not shown.

The boards counted are the same ones All Boards lists (`visibleAllBoards()` in
[server/allBoardsFacets.js](../../../server/allBoardsFacets.js)): not archived,
of type `board`, not an internal helper board, not hidden by you, and visible
to you through membership, an organization, a team or an email domain. Public
boards you are not a member of are not counted.

Limits:

- A label name is at most **40** characters (`MAX_LABEL`); control characters,
  `.` and `$` are removed, and the name is trimmed (`cleanLabel()`).
- One label holds at most **5000** boards.
- The title match of **Apply label** ignores case and leading/trailing spaces
  of the text.
- Each of `allBoardsFacets`, `applyBoardLabel` and `removeBoardLabel` is
  rate-limited to **20 calls per 10 seconds** per connection.

## How it works in WeKan

### Board labels are your own

A board label is a name you file boards under. It is stored on your own user
document, `profile.boardLabels` as `{ label: [boardId, ...] }`, and is not
shown to anybody else; it does not change the board.

The label row (`fa-tag`) lists each of your labels that has at least one board
you can see, with its count:

- **Click the label** to show only its boards.
- **X** beside it (**Remove this board label**) calls `removeBoardLabel`,
  which deletes that label from your profile. The boards are not changed.

### Apply label

At the end of the label row is a small form:

- **Board label** - the label's name, up to 40 characters; control
  characters, `.` and `$` are removed.
- **for boards whose name includes** - the text to look for.
- **Apply label** - calls `applyBoardLabel` (`server/allBoardsFacets.js`).

Every board you see in All Boards whose name includes the text, ignoring case,
is added to that label; boards already under it stay. An empty name or text is
refused (`board-label-invalid`) and shown with an alert. The boards counted are
the same ones All Boards lists: not archived, not hidden by you, and visible to
you through membership, an organization, a team or an email domain. The
grouping and matching are in `models/lib/allBoardsFacets.js`.

### Filtering

A click on a group turns it into a selector with `facetSelector()`: a
case-insensitive title regex anchored at the first character, an `$elemMatch`
on the active `orgs.orgId` / `teams.teamId`, or `_id: { $in: ids }` for a
label. The page adds that selector to its board query
([client/components/boards/boardsList.js](../../../client/components/boards/boardsList.js)).

| File | What it does |
| --- | --- |
| [models/lib/allBoardsFacets.js](../../../models/lib/allBoardsFacets.js) | Pure: `firstCharacter`, `boardFacets`, `facetSelector`, `cleanLabel`, `applyBoardLabel`. |
| [server/allBoardsFacets.js](../../../server/allBoardsFacets.js) | The methods `allBoardsFacets`, `applyBoardLabel`, `removeBoardLabel`, and `visibleAllBoards()`. |
| [client/components/boards/boardsList.jade](../../../client/components/boards/boardsList.jade) | The facet bar and the Apply label form. |
| [tests/allBoardsFacets.test.cjs](../../../tests/allBoardsFacets.test.cjs) | The grouping, the counts, the selectors and the label rules. |

### Related

- [All Boards](All-Boards.md)
- [Workspaces](Workspaces.md) - another way to file boards
- [Group members](Group-Members.md) - the organization and team tabs

## Commits

 - [Group All Boards by first character, organization, team and board label](https://github.com/wekan/wekan/commit/000bc1c490eb69e49e4680aafdf84a6c76154f5c)
