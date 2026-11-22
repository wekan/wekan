# Swimlanes

## What it is

Swimlanes divide a board into horizontal bands. Each card belongs to a list and
a swimlane, so a swimlane can stand for a team, a person, a customer or a class
of work while the lists keep showing the stages of the work. Lanes can contain
their own lists as well as legacy shared lists. Choose **Swimlanes** in the
board-view menu to work with them.

## Read more

- [Swim lane](https://en.wikipedia.org/wiki/Swim_lane) - the idea of dividing a
  process diagram into lanes, on Wikipedia.
- [Kanban board](https://en.wikipedia.org/wiki/Kanban_board) and
  [Kanban (development)](https://en.wikipedia.org/wiki/Kanban_(development)) -
  where swimlanes are used to split a board's columns into rows.
- In WeKan: [Board Views](../Board-Header/README.md),
  [Lists](../Lists/Lists.md),
  [multiline creation](../General/Editor/Multiline.md),
  [Board Settings / Swimlane](../Board-Sidebar/Board-Settings/Swimlane.md).

## How to use it

**Create and rename**

1. Open the board and choose **Swimlanes** in the board-view menu.
2. Click **+** (**Add Swimlane**) in a swimlane header, or open ☰
   (**Swimlane Actions**) and choose **Add Swimlane**.
3. Type the name. To add several at once, paste several lines and choose under
   **Add many lines as:** either **1 Swimlane** (one name containing the line
   breaks, the default) or **Many Swimlanes** (one swimlane per nonempty line).
   See [multiline creation](../General/Editor/Multiline.md).
4. Choose **Below selected swimlane** (the default) or **Above selected
   swimlane**, then click **Add**. The swimlanes are created in the pasted
   order.
5. To rename, click the swimlane's name, edit it and click **Save**. The editor
   and the displayed title preserve line breaks.

**Arrange and manage**

1. Drag the header's drag handle (shown on touch screens, or when drag handles
   are turned on) to reorder swimlanes.
2. Click the caret beside the ☰ in the header to collapse or expand a lane.
3. Use ☰ **Swimlane Actions** for links and history, export and import, and
   the permitted copy, move and archive actions.
4. Drag the lane's resize handle at its bottom edge to change its height,
   unless the board administrator has locked resizing.

Related pages:

- [Board Settings / Swimlane](../Board-Sidebar/Board-Settings/Swimlane.md):
  resize locking, WIP Limit Groups, and **One shared list header row** for the
  same lists in every swimlane
- [Lists](../Lists/Lists.md): create a first list with the empty lane's **+**
- [Archive and Delete](../Board-Sidebar/Archive/Archive-and-Delete.md)

### Insert above or below

Use the swimlane header **+**, or **Swimlane Actions → Add Swimlane**.
The popup offers **Below selected swimlane** and **Above selected
swimlane**, with Below selected by default. Multiple titles retain their order
between the selected lane and its neighbor. Board write permissions still apply.

## How the numbers are calculated

- **Sort position of new swimlanes.** `titleSortIndexes(previous, next, count)`
  in [models/lib/multilineTitles.js](../../../models/lib/multilineTitles.js)
  reserves `count` positions between the neighbouring lanes: between two lanes
  it spaces them evenly, `previous + (next - previous) * (i + 1) / (count + 1)`;
  after the last lane it uses `previous + i + 1`; before the first,
  `next - count + i`; on an empty board `0, 1, 2, ...`. The neighbours are the
  selected lane and the one after it (Below) or before it (Above)
  (`swimlaneAddPopup` submit in
  [client/components/swimlanes/swimlaneHeader.js](../../../client/components/swimlanes/swimlaneHeader.js)).
- **Many Swimlanes** creates one swimlane per nonempty line; blank lines are
  skipped (`splitTitleLines`).
- **Height.** Dragging the resize handle clamps the height to 100-2000 pixels
  (`minHeight`, `maxHeight` in
  [client/components/swimlanes/swimlanes.js](../../../client/components/swimlanes/swimlanes.js)),
  starting from the lane's current CSS height (300 when it cannot be read).
  The schema's `height` field accepts `-1` (automatic height, the default) or
  50-2000 pixels ([models/swimlanes.js](../../../models/swimlanes.js)).

## How it works in WeKan

- **Collection**: `Swimlanes` in [models/swimlanes.js](../../../models/swimlanes.js),
  with `title`, `boardId`, `sort`, `color`, `type` (`swimlane` or
  `template-swimlane`) and `height`. Cards carry a `swimlaneId`.
- **Header and menu**:
  [client/components/swimlanes/swimlaneHeader.jade](../../../client/components/swimlanes/swimlaneHeader.jade)
  and `.js`. The collapse caret, ☰ menu, **+** and drag handle are drawn only
  for a board member who is not Comment only, Read only, Read assigned only or
  Worker. Select Color, Copy, Move and Archive are shown only to a board admin,
  and Copy, Move and Archive not on a template container.
- **Lanes, drag and resize**:
  [client/components/swimlanes/swimlanes.js](../../../client/components/swimlanes/swimlanes.js).
  The final height is saved per user with the `applySwimlaneHeightToStorage`
  method ([server/models/users.js](../../../server/models/users.js)), or in the
  browser's `localStorage` for a visitor who is not logged in. The handle is
  hidden while the board's swimlane-height lock is on
  (`getSwimlaneHeightResizeLocked`).
- **Collapsed state** is per user, in `profile.collapsedSwimlanes`
  ([models/users.js](../../../models/users.js)).
- **Tests**: [tests/swimlanePlacement.test.cjs](../../../tests/swimlanePlacement.test.cjs),
  [tests/multilineTitles.test.cjs](../../../tests/multilineTitles.test.cjs),
  [tests/swimlaneSort.test.cjs](../../../tests/swimlaneSort.test.cjs),
  [tests/listSwimlaneResizeLock.test.cjs](../../../tests/listSwimlaneResizeLock.test.cjs),
  [tests/defaultSwimlane.test.cjs](../../../tests/defaultSwimlane.test.cjs)
  and the browser test
  [tests/playwright/specs/13-swimlanes.e2e.js](../../../tests/playwright/specs/13-swimlanes.e2e.js).

## Commits

 - [Show a swimlane titled Default with one shared function](https://github.com/wekan/wekan/commit/c1a89b98fdaf115204f245b89fd665f498969357)
 - [Group the swimlane menu under headings](https://github.com/wekan/wekan/commit/0d8f8b8d96b868a6d75b803ef105e50aad450977)
 - [One shared list header row hides the other swimlanes' list headers](https://github.com/wekan/wekan/commit/39ee1d9512ef0c5c5aec94fe9842c00c7b00da1d)
 - [One shared list header row shows the same lists in every swimlane](https://github.com/wekan/wekan/commit/67321dcb6c071e1d9572fb79eb344349178d274b)
 - [The swimlane resize line reaches the right edge of a scrolled swimlane](https://github.com/wekan/wekan/commit/8d5109b4b9d7f77205e6ba8fd2c581a9c4720ff9)
 - [One list drag-and-drop setup for a swimlane and the Lists view](https://github.com/wekan/wekan/commit/d444a76af24f851bf12df4ea311bb188955fa8f4)
 - [Place the swimlane position choices below the title input](https://github.com/wekan/wekan/commit/be6cc9d6366c450ece3114b98a9e7b1dbe292db2)
 - [Add the Above and Below placement choices for a new swimlane](https://github.com/wekan/wekan/commit/5ed4268a61b19898c671b64b1ead786494f171b9)
 - [Create several swimlanes from multiline titles](https://github.com/wekan/wekan/commit/552ac0855aa64d8b9a6a9292b6da286bb08c83bb)
 - [Hide the swimlane resize handle while its board-wide lock is on](https://github.com/wekan/wekan/commit/bf93de325d05769a9d263107aa9e40c140a2776f)
 - [Add the board-wide swimlane-height resize lock](https://github.com/wekan/wekan/commit/5c48be8e672e6cbd004396b1bb66b94181f5c6eb)
 - [Hide the Set Swimlane height menu entry; the resize handle remains](https://github.com/wekan/wekan/commit/4374502a4900e4922e5e451dae44e652fc42810f)
 - [Move and Copy swimlane in one dialog each](https://github.com/wekan/wekan/commit/82db0800ef6cda8adae06ac3e4f34d3517309a37)
 - [Import into a swimlane beside the one whose menu was used](https://github.com/wekan/wekan/commit/d11f5ffdb768f5ebcb6bc447c385d77147e0c59a)
 - [Export a swimlane in the card export's own layout](https://github.com/wekan/wekan/commit/bd009cf601b81072308f7e1f56e73c88a89aa7cd)
 - [Link to a swimlane the way you can link to a card](https://github.com/wekan/wekan/commit/e755b60b37009783effe5515d208b142003128e7)
 - [Undo and redo for swimlane moves](https://github.com/wekan/wekan/commit/4ca33d29f78bd81cecc931faa5164f862823ad52)
 - [The swimlane header bar no longer clips at non-100% zoom](https://github.com/wekan/wekan/commit/7b7fada1b89fa21e35ebaeca26d3f85299afb33d)
 - [Copying a swimlane to another board keeps its labels](https://github.com/wekan/wekan/commit/9643dcded9a8c825cf77d8cc12fc99127a21b1aa)
 - [Remaining features of Copy and Move of swimlanes](https://github.com/wekan/wekan/commit/610849ab0bcfb72c92cf9cf512c51b8cede55dad)
 - [Confirm before moving a swimlane to the archive](https://github.com/wekan/wekan/commit/872dd578c84d629e804566802524100983095b4a)
 - [Collapse a swimlane, per user](https://github.com/wekan/wekan/commit/58f4884ad603e4f8c68a8819dfb1440234da70b6)
 - [Save collapse and height per user, the swimlanes themselves per board](https://github.com/wekan/wekan/commit/414b8dbf41ecf368d54aeceb6a78ccd0aa58f6a6)
 - [Default to per-swimlane lists and dragging a list to another swimlane](https://github.com/wekan/wekan/commit/034dc08269520ca31c780cce64e0150969e9228e)
 - [Drag-resize the swimlane height, also on a public board](https://github.com/wekan/wekan/commit/351433524708e9a7ccb4795d9ca31a78904943ea)
 - [Add colors to swimlanes](https://github.com/wekan/wekan/commit/03efeaeb1abae0c8c39ad5644d44bad36f415d99)
 - [First swimlane draft](https://github.com/wekan/wekan/commit/690a5b970319ceabc0be965152187d7098022621)
