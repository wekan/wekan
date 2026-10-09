# monday.com

WeKan imports boards from [monday.com](https://monday.com) and exports boards
to it as an Excel `.xlsx` file.

- **Import** reads the workbook of monday's **Export board to Excel**: the
  board's groups, its own columns, the items, their subitems and, when it was
  exported with them, the updates.
- **Export** writes one flat table on the first sheet, with a header row and
  ISO dates. That is the shape monday's own Excel import reads.

## How to import

1. In monday.com, open the board, click the **three-dot menu** at the top right
   of the board, choose **More actions** and then **Export board to Excel**.
   In the export window, choose whether to include the updates and the
   subitems. See monday.com's article
   [Export from monday to Excel](https://support.monday.com/hc/en-us/articles/26989749858578-Export-from-monday-to-Excel).
2. In WeKan, go to **All Boards → New → Import → monday.com**.
3. Choose the `.xlsx` file. This source is read from a file only; there is no
   text box to paste into.
4. Click **Import**. The board is imported without member mapping.
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

The import page says: in monday.com, open the board menu, choose More actions
and Export board to Excel (with updates and subitems if you like), then choose
that `.xlsx` file. The Status column becomes lists and groups become swimlanes;
people, dates, timeline and tags keep their places, other columns become
custom fields and updates become comments.

A flat table, such as the one WeKan's own monday.com export writes, imports
the same way.

## How to import many boards at once

1. On the import page, under **Import many boards**, choose several monday.com
   `.xlsx` export files, or one `.zip` that holds them.
2. Each file becomes its own board, imported without member mapping. Members
   can be mapped later.

monday.com is imported through WeKan's generalized importer, so there is also
a checkbox **One board per project**. With it, each swimlane the import would
create becomes its own board, named after that swimlane. For monday.com the
swimlanes are:

- the board's **groups**, when the sheet has a **Status** column;
- the values of a **Group** column, in a flat table.

When the sheet has no Status column, the groups become lists and everything
is in the one **Default** swimlane, so the option makes no difference. Links
between cards that end up on different boards (a subitem whose parent item is
in another group) are reported in the loss report rather than kept.

From a script, with files, directories of files, or `.zip` files:

```bash
python3 api.py importboardsfrom monday FILE_OR_DIR ...
```

## How to export

1. In WeKan, open the board and go to **Board Settings → Export**.
2. Choose what to include, then choose **monday.com**. WeKan downloads the
   board as `<board>.xlsx`.
3. In monday.com, import the file with its Excel import. monday's import
   reads the first sheet only and lets you choose which row holds the column
   headers: choose row 1. Then choose **Name** as the item name and map the
   other columns. For the current steps, see monday.com's article
   [Import files from Excel](https://support.monday.com/hc/en-us/articles/360000219209-Import-files-from-Excel).

## How to export all boards at once

1. Go to **All Boards → sidebar → Export all boards** and choose
   **monday.com**.
2. WeKan downloads one `.zip` with one `.xlsx` file per board you can export:
   boards you are a member of, that are not archived and are not templates.

To export only some boards, use **Multi-Selection** in the All Boards sidebar,
select the boards, then click **Export**.

From a script:

```bash
python3 api.py exportallboards monday boards.zip
```

## Format details

### What monday.com writes

The import reads the workbook of monday's
[Export board to Excel](https://support.monday.com/hc/en-us/articles/26989749858578-Export-from-monday-to-Excel).
monday documents it only through the screenshots of that article, and says
the layout cannot be changed. The board sheet has:

- the board's name in row 1;
- then, per group: the group's name, a header row starting `Name` with the
  board's own column titles, the items, and a summary row;
- a blank row before the next group.

With **+ updates**, the workbook has a second sheet `<board>-updates`, with
the columns Item ID, Item Name, Content Type, User, Created At (for example
`27/May/2025 03:26:42 PM`) and Update Content.

Subitems are not documented (low confidence). Community reports show a
`Subitems` header row after the parent item, with its rows indented one
column. WeKan reads them that way.

WeKan also reads the flat table that monday's
[Excel import](https://support.monday.com/hc/en-us/articles/360000219209-Import-files-from-Excel)
reads: one header row starting `Name`, then one row per item.

### How the import reads it

The column titles are the board owner's own, so WeKan matches them by meaning,
ignoring case:

- **Name** is the card's title.
- **Status** is the card's list, and the groups become swimlanes. Without a
  Status column, the groups are the lists. An item with an empty Status, on a
  board that has one, goes to the list **No status**. In a flat table with no
  Status and no Group, the list is **Items**.
- **Group** is the swimlane, in a flat table.
- **Person**, **People**, **Owner**, **Owners**, **Assignee** or
  **Assignees**: comma-separated names. The first is the owner, the rest are
  further assignees.
- **Date**, **Due date**, **Due** or **Deadline** is the due date, written
  `YYYY-MM-DD`.
- **Timeline** (`YYYY-MM-DD - YYYY-MM-DD`) is the start and due date. A Date
  column, when there is one, wins for the due date.
- **Tags** or **Tag**: comma-separated labels.
- **Item ID** is the item's reference. It is used to attach subitems and
  updates; it is not shown on the card.
- **Long text**, **Description** or **Notes** is the description.
- Every other column is a custom field with the column's title. A value that
  is a plain number becomes a number; anything else stays text, so a date in
  another column (such as `In Stores`) is a text custom field.

Further rules from the current code:

- The board's title is the first cell of row 1 when the first header row is
  row 3 or later. Otherwise it is the sheet's name, or `Imported monday.com
  board`.
- A row with only its first cell filled is a group name when it is followed by
  a header row, or when no header has been seen yet.
- A row whose first cell is empty is a summary row and is skipped.
- A subitem has the columns of its own `Subitems` header row. It becomes a
  subtask (a child card) of the item above it, in the same group.
- Without an Item ID column, the row number stands in as the reference, so a
  subitem still finds its parent.
- The updates sheet is any later sheet whose name ends in `-updates`. Its
  header row is found by its **Item Name** and **Update Content** columns.
  Each update becomes a comment on the item with the same Item ID, or else
  the item with the same name. Empty updates are skipped.
- A workbook without a row starting `Name` is refused.

### How the export writes it

The export writes one sheet, named after the board (lowercase, at most 31
characters), with a bold header row and one row per card. The columns are:

`Name, Group, Status, Person, Date, Timeline, Tags, Priority, Description,
Item ID`, then the board's other custom fields.

- **Name** is the card's title, or `Untitled`.
- **Group** is the card's swimlane, empty for **Default**.
- **Status** is the card's list.
- **Person** is the card's assignees and members, as usernames, separated by
  commas.
- **Date** is the due date as `YYYY-MM-DD`.
- **Timeline** is `start - due` when the card has both.
- **Tags** is the card's labels, comma separated; a comma inside a label name
  becomes a space.
- **Priority** is the value of a custom field named Priority.
- **Item ID** is the WeKan card id.
- A custom field whose name would be read back as one of the columns above is
  not written again.

The export reads back into WeKan with the same importer: the Group column
becomes the swimlanes and the Status column the lists.

## What is kept

| monday.com | WeKan |
| --- | --- |
| Board name (row 1) | Board title |
| Group | Swimlane (or list, when there is no Status column) |
| Name | Card title |
| Status | List |
| Person / People / Owner / Assignee | Card members, when the names are mapped to WeKan users |
| Date / Due date / Deadline | Due date |
| Timeline | Start date and due date |
| Tags | Labels |
| Item ID | The item's reference, for subitems and updates |
| Long text / Description / Notes | Description |
| Any other column | Custom field |
| Subitem | Subtask (a child card) |
| Update (User, Created At, Update Content) | Comment, with its date |

## What is not kept

The import reports these on the loss report, rather than dropping them
silently:

- a row before the first header row;
- an item or subitem without a name;
- a date that is not `YYYY-MM-DD`;
- a Timeline that is not `YYYY-MM-DD - YYYY-MM-DD` (a valid half is still
  kept);
- an update for an item that is not in the board sheet;
- an Item ID that appears twice (links go to the first item);
- more than 50 custom fields (the rest are not imported).

Other things the import does not keep:

- Summary rows are skipped.
- The import page imports without member mapping. A person is then not added
  to the card, and an update's author is kept as a `Name: ` prefix on the
  comment's text.
- Updates on subitems: monday's export does not write them.

The export does not write comments, checklists, attachments, dependencies,
subtask links or the card's end and creation dates.

## REST API

```bash
python3 api.py importboardfrom monday board.xlsx          # POST /api/boards/import/monday
python3 api.py importboardsfrom monday a.xlsx b.xlsx boards.zip
python3 api.py exportboardformat BOARDID monday board.xlsx
python3 api.py exportallboards monday boards.zip
```

The HTTP routes are:

- `POST /api/boards/import/monday`
- `GET /api/boards/:boardId/export/monday?authToken=…`
- `GET /api/export-all-boards/monday?authToken=…`, with an optional
  `&boardIds=ID1,ID2` to export only those boards.

## How it is built and tested

- `models/lib/mondayFormat.js` reads the export's rows
  (`parseMondaySheets`) and writes the flat import table
  (`formatMondaySheets`).
- `server/lib/mondayWorkbook.js` opens and writes the `.xlsx` workbook.
- `models/lib/externalParsers.js` and `models/lib/externalExportFormatters.js`
  register the format under the key `monday`; `models/import.js` hands the
  parsed board to the generalized importer, `models/kanboardCreator.js`.
- `tests/mondayFormat.test.cjs` is the unit test: an export with groups,
  Status, people, tags, dates, other columns, subitems and updates; columns
  matched by meaning and a board without Status; bad dates, nameless items and
  a workbook that is not an export; the export table imported back; and the
  wiring into import, export, the import page and the export menu.
- The Playwright case is in
  `tests/playwright/specs/import-export-format-audit.e2e.js`: *monday.com: a
  board export imports with its group, status, person, date and update*. It
  uploads a workbook with a group, a Status, a person, a date, a tag and an
  updates sheet, and checks the board title, the card, its due date, list,
  swimlane and comment.

## Sources

- [Export from monday to Excel](https://support.monday.com/hc/en-us/articles/26989749858578-Export-from-monday-to-Excel):
  the export steps, the updates and subitems options, and the workbook layout
  shown in its screenshots
- [Import files from Excel](https://support.monday.com/hc/en-us/articles/360000219209-Import-files-from-Excel):
  monday's Excel import, which reads the first sheet and lets you choose the
  header row

See also the [format coverage table](../Format-Coverage.md) and
[all formats](../External-Tools.md).
