# Column sets

## What it is

[#211](https://github.com/wekan/wekan/issues/211). The same cards, organized
in several ways at once. A board's lists are one way to put its cards in
columns; column sets add more - by completion, priority, milestone, size,
whatever the team thinks in - without moving a card out of its list.

## Read more

- [Kanban board](https://en.wikipedia.org/wiki/Kanban_board) on Wikipedia - the
  columns a board's lists already are.
- [Faceted classification](https://en.wikipedia.org/wiki/Faceted_classification)
  on Wikipedia - sorting the same things along several independent
  dimensions, which is what several column sets do.
- [Lists](../../Lists/README.md) and [Labels](../../Board-Sidebar/Labels/Labels-Milestone-Due-Date.md) -
  the other ways a board groups its cards.

## How to use it

Board View → **Column sets** (in the **Board** group):

- A board admin makes a set - **New column set**, say "Priority" - and adds its
  columns, each with a colour: "High" red, "Normal" yellow, "Low" green.
- Pick a set from the list at the top. Every card of the board is in one of
  its columns, or in **Not placed** until somebody puts it in one.
- **Drag a card** to another column. That changes only where it is in this
  set; its list, swimlane, labels and members stay as they are.
- Each card also shows, as small coloured labels, which column it is in for
  the other sets - looking at "Completion", you still see each card's
  priority.
- Click a card's title to open it.

**Make a set and its columns** (board admin):

1. Open **Board View** → **Column sets**. A board with none says *No column sets
   yet. A board admin can make one: name it, then add its columns.*
2. Type a name in **New column set** and click **Add**. The new set is shown.
3. Type a column's name in **New column**, choose its colour in **Column
   colour**, and click **Add**. Repeat for every column.
4. To delete a column, click the **X** in its header (**Delete this column**).
   To delete the whole set, click the bin (**Delete this column set**) and
   confirm.

**Place cards** (anybody who can edit cards):

1. Choose the set in **Column set** at the top.
2. Drag a card from **Not placed**, or from one column, to another column.
   Dropping it on **Not placed** takes it out of the set.

Moving cards needs the same right as editing a card; making and deleting sets
and columns is for board admins. Deleting a column puts its cards back in Not
placed for that set.

## How the numbers are calculated

All in [models/lib/columnSets.js](../../../../models/lib/columnSets.js):

- **The number in a column's header** is how many cards are in that column of
  the shown set, **Not placed** included.
- **Which cards**: every card of the board that is not archived and is an
  ordinary card (`type: 'cardType-card'`), in their `sort` order.
- **Where a card is** (`cardColumnId`): the column stored for that set on the
  card, if that column still exists; otherwise **Not placed**. That is why
  deleting a column puts its cards back in Not placed.
- **Limits**: at most 20 sets per board (`MAX_SETS`) and 40 columns per set
  (`MAX_COLUMNS`); a set's or column's name has its spaces collapsed and is cut
  to 60 characters (`cleanName`), and an empty name adds nothing.
- **Colours**: none, green, yellow, orange, red, purple, blue, sky, lime, pink,
  black or silver (`COLORS`); anything else is stored as none.
- **The first set** is shown when none is chosen.

## How it works in WeKan

- **Data**: the board keeps `columnSets`: `[{ _id, name, columns: [{ _id,
  title, color }] }]` ([models/boards.js](../../../../models/boards.js)); a card
  keeps which column it is in for each set in `columnSetValues`:
  `{ setId: columnId }` ([models/cards.js](../../../../models/cards.js)). Lists,
  swimlanes, labels and members are not touched.
- **Client**:
  [client/components/boards/columnSetsView.jade](../../../../client/components/boards/columnSetsView.jade),
  `.js` and `.css`. Adding and removing sets and columns writes the board's
  `columnSets` with `Boards.update`; dropping a card writes the card with
  `Cards.update` and the modifier from `placeModifier()`, which sets
  `columnSetValues.<setId>` or, for **Not placed**, unsets it. A set id that is
  not a plain id, or a column that is not in the set, gives no modifier.
- **Permissions**: the board update is allowed for a board admin only, by the
  board's allow rules; the card update needs write access to the card. The view
  draws the admin forms only for a board admin and makes cards draggable only
  with write access.
- **Import and export**: the fields travel with a WeKan JSON export and import
  ([models/lib/wekanBoardFields.js](../../../../models/lib/wekanBoardFields.js),
  [models/lib/wekanCardFields.js](../../../../models/lib/wekanCardFields.js)).
- **Turning it off**: a site admin can hide the view in Admin Panel / Settings /
  Features (`views-column-sets`).
- **Tests**: [tests/columnSets.test.cjs](../../../../tests/columnSets.test.cjs).

## Commits

 - [WeKan JSON import keeps every board and card field, column sets included](https://github.com/wekan/wekan/commit/c640c5c376526f6550873b757fa6b68511c63d42)
 - [Column sets: the same cards in several named sets of columns](https://github.com/wekan/wekan/commit/03d0144538a5aed50f9641f01fac2457ec3ccdea)
