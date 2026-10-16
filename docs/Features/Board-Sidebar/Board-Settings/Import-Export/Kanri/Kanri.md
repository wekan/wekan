# Kanri

WeKan imports and exports a board as the JSON of [Kanri](https://github.com/kanriapp/kanri),
the offline desktop kanban app. Kanri writes two files: a single board, and
all data with the app settings and every board. WeKan reads both and writes a
single board. Columns become lists and cards keep their description, due
date, tags, colors and tasks.

## How to import

1. In Kanri, choose **Import/Export** in the sidebar. Under **Export Data**:
   - **Partial Export (individual board)**: click **Export individual board**,
     select the board and save the `.json` file;
   - **Full Export**: click **Export all data** to save all boards, themes and
     preferences in one `.json` file.
2. In WeKan, go to **All Boards → New → Import → Kanri**.
3. Open the `.json` file in a text editor, copy all of it and paste it into
   the text box.
4. Click **Import**.
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

An all-data export brings in every board. Each Kanri board becomes a swimlane
named after it, on one WeKan board. Tick **One board per project** (below) to
make each Kanri board its own WeKan board instead.

## How to import many boards at once

1. On the import page, choose **Kanri**, then under **Import many boards**
   choose several `.json` files, or one `.zip` that holds them.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Kanri is imported through the generalized importer
(`models/kanboardCreator.js` via `EXTERNAL_PARSERS` in
`models/lib/externalParsers.js`), so the page also has a checkbox **One board
per project**: each swimlane the import would create becomes its own board,
named after that swimlane.

A Kanri board has no swimlanes, so a board export puts every card in the
swimlane **Default**, and the option makes no difference for it. An all-data
export reads each Kanri board into a swimlane named after it
(`models/lib/kanriFormat.js`), so **One board per project** makes each Kanri
board its own WeKan board, with only the columns that board had. This imports
a whole Kanri app at once.

Links between cards that end up on different boards are reported in the loss
report rather than kept. Kanri has no links between cards.

From a script:

```bash
python3 api.py importboardsfrom kanri FILE_OR_DIR ...
```

Each argument is a file, a directory of files, or a `.zip` file.

## How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Choose what to include, then under **JSON** choose **Kanri**. The board
   downloads as `<board>.json`.
3. In Kanri, choose **Import/Export** in the sidebar. Under **Import Data**,
   **Partial import (individual board)**, click **Import from Kanri** and
   choose the file. Several files can be chosen at once, one board each.

Do not use Kanri's **Full import** for this file: it replaces all of Kanri's
data with what it imports, and expects an all-data file.

The Kanri entry is offered for a whole board only, not for a swimlane or a
list.

## How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Kanri**.
2. One `.zip` downloads, with one file per board you can export: boards you
   are a member of that are not archived and not templates.

Each file in the `.zip` is a single-board export; unpack the `.zip` and
choose the files in Kanri's **Import from Kanri** (partial import).

To export only some boards, use **Multi-Selection** in the All Boards
sidebar, select the boards, then **Export**.

From a script:

```bash
python3 api.py exportallboards kanri boards.zip
```

## Format details

The format is the JSON that [Kanri](https://github.com/kanriapp/kanri)'s
Import & Export page writes and its **Import from Kanri** reads, as its
[types](https://github.com/kanriapp/kanri/blob/main/types/kanban-types.d.ts)
and [import schemas](https://github.com/kanriapp/kanri/blob/main/types/json-schemas.ts)
define it:

- a single board (Partial Export, or the board's own menu): `id`, `title`,
  `columns[].cards[]`, `background`, `globalTags`;
- all data (Full Export): the app settings and `boards[]`.

What the import must cover:

- columns as lists (a repeated title gets ` (2)`);
- cards as cards, with the card id as the source reference;
- `description`, `dueDate` as the due date, and `isDueDateCompleted` as the
  due date being done;
- `tasks` as a "Tasks" checklist (`finished` = done);
- `tags` as labels with their color, from `color` or from the
  `background-color` of `style`; a hex color that WeKan draws is stored as
  that WeKan color;
- the card color: Kanri's `bg-pink-600` … `bg-purple-600` as WeKan's pink …
  purple, teal and custom colors as hex, and `bg-elevation-2` as no color;
- the board title.

An all-data export brings every board: each into a swimlane named after it
(two boards with one title are told apart as "Title (2)"), with the columns of
all of them, or each into its own WeKan board with **One board per project**.
Reported: the background image (a file path
on the exporting computer), a countdown due date display, tags no card uses,
the app settings, and colors that are not colors.

The export writes a single-board file that Kanri's Partial import accepts,
with a tag `style` the way Kanri writes it. Several checklists flatten into
Kanri's one task list, and Kanri's own import drops `isDueDateCompleted` (it is
not in its import schema). Kanri has no comments, members, attachments or
other dates.

What the current code does (`models/lib/kanriFormat.js`):

- The card id is read, but WeKan does not store it on the card. It would only
  be used to resolve links between cards, which Kanri does not have; a
  repeated card id is reported.
- A board whose columns are called `lists` (KanbanElectron, which Kanri also
  imports) is read too.
- Kanri's card palette maps to WeKan's pink, red, orange, yellow, green, blue
  and purple; teal is kept as `#0d9488`.
- A tag color that is exactly one of WeKan's named colors (as WeKan draws
  them) is stored as that name; any other hex color is stored as the hex.
  A tag without a color gets a black label.
- Without a board title, the board is called "Imported Kanri board".
- Limit: 20,000 cards.
- Every card goes to the swimlane Default.

What the export writes (`formatKanri` in the same module):

- `id` (the board's id), `title`, `background: null`, `lastEdited` and
  `createdAt`;
- each list as a column with its id and title, including lists without cards.
  A card whose list is not exported gets a column of its own list's name;
- each card with `id`, `name`, `description`, `color` (Kanri's palette class
  where Kanri has one, otherwise a hex color, otherwise `bg-elevation-2`),
  `dueDate`, `isDueDateCompleted` and `isDueDateCounterRelative: false`;
- every checklist's items, in order, as the card's one `tasks` list;
- the card's labels as `tags`, with `color` and the `style` Kanri writes (a
  dark or light text color for contrast), and the used tags as `globalTags`.

Archived cards and archived lists are not exported.

## What is kept

| Kanri | WeKan |
| --- | --- |
| Board `title` | Board title |
| `columns` (or `lists`) | Lists, in order |
| Card `name` | Card title |
| `description` | Card description |
| `dueDate` | Due date |
| `isDueDateCompleted` | Due date marked done |
| `tasks` (`name`, `finished`) | Checklist "Tasks" |
| `tags` (`text`, `color` or `style`) | Labels with their color |
| Card `color` | Card color |
| `boards[0]` of an all-data export | The imported board |

## What is not kept

The import reports these on the loss report:

- every board after the first in an all-data export;
- the app settings of an all-data export (`activeTheme`, `colors`,
  `savedCustomTheme`, `pins`, `boardSortingOption`, `columnZoomLevel`);
- the background image: a file path on the computer that exported it;
- a countdown due date display (`isDueDateCounterRelative`);
- tags that no card uses;
- card and tag colors that are not colors WeKan can show;
- a due date that is not a date;
- a second column with the same title (it is imported as `<title> (2)`);
- columns and cards that are not objects.

The Kanri export writes no comments, members, attachments, start or end
dates, custom fields or swimlanes: Kanri has no place for them. Several
checklists become one task list. Kanri's own import does not read
`isDueDateCompleted`.

## REST API

```bash
python3 api.py importboardfrom kanri board.json          # POST /api/boards/import/kanri
python3 api.py importboardsfrom kanri FILE_OR_DIR ...    # several boards
python3 api.py exportboardformat BOARDID kanri board.json
python3 api.py exportallboards kanri boards.zip
```

The HTTP routes:

- `POST /api/boards/import/kanri` with the file's JSON as `board`;
- `GET /api/boards/:boardId/export/kanri?authToken=…` returns the board as
  JSON;
- `GET /api/export-all-boards/kanri?authToken=…` returns the `.zip`; add
  `&boardIds=ID1,ID2` for only those boards.

## How it is built and tested

- `models/lib/kanriFormat.js` reads and writes the JSON. `models/import.js`
  sends the document to the parser, and `models/kanboardCreator.js` creates
  the board, with label and card colors from
  `models/lib/importedTaskPlan.js`.
- `tests/kanriFormat.test.cjs` is the unit test of the round trip.
  `tests/importLossReport.test.cjs` covers the loss report and
  `tests/boardExportScope.test.cjs` the export menu entry.
- The Playwright cases are in
  `tests/playwright/specs/import-export-format-audit.e2e.js`: "Kanri: a board
  export imports with its columns, description, due date, tasks, tags and
  colors", "Kanri: an all-data export imports every board, one board per
  project; other documents are refused", and the export menu link for every
  format.

## Sources

- [Kanri](https://github.com/kanriapp/kanri): the app
- [kanban-types.d.ts](https://github.com/kanriapp/kanri/blob/main/types/kanban-types.d.ts):
  the board, column, card and tag types
- [json-schemas.ts](https://github.com/kanriapp/kanri/blob/main/types/json-schemas.ts):
  what Kanri's import accepts
- [pages/import.vue](https://github.com/kanriapp/kanri/blob/main/pages/import.vue)
  and [the English strings](https://github.com/kanriapp/kanri/blob/main/i18n/locales/en.json):
  the Import/Export page, its Partial and Full export and import

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).
