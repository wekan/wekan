# Kanri

## What it is

WeKan imports and exports a board as the JSON of [Kanri](https://github.com/kanriapp/kanri),
the offline desktop kanban app. Kanri writes two files: a single board, and
all data with the app settings and every board. WeKan reads both and writes a
single board. Columns become lists and cards keep their description, due
date, tags, colors and tasks.

## Read more

- [Wikipedia: kanban boards](https://en.wikipedia.org/wiki/Kanban_board)
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

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. In Kanri, choose **Import/Export** in the sidebar. Under **Export Data**:
   - **Partial Export (individual board)**: click **Export individual board**,
     select the board and save the `.json` file;
   - **Full Export**: click **Export all data** to save all boards, themes and
     preferences in one `.json` file.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → Kanri**.
3. Open the `.json` file in a text editor, copy all of it and paste it into
   the text box.
4. Click **Import**.
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

An all-data export brings in every board. Each Kanri board becomes a swimlane
named after it, on one WeKan board. Tick **One board per project** (below) to
make each Kanri board its own WeKan board instead.

### How to import many boards at once

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

### How to export

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

### How to export all boards at once

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

### REST API

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

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- At most 20,000 cards. More stops the import with an error. (`MAX_KANRI_CARDS`
  in
  [models/lib/kanriFormat.js](../../../../../../models/lib/kanriFormat.js#L35))

The numbers every import has, this one included:

- **How long an import may take**: `WEKAN_IMPORT_TIMEOUT_MS` (default 120,000
  ms, two minutes; 0 turns the deadline off) plus 500 ms for each record of the
  file. A record is an item of a top-level array, a line of a text file, or the
  items of all top-level arrays of an object added together
  ([models/lib/importDeadline.js](../../../../../../models/lib/importDeadline.js),
  [models/import.js](../../../../../../models/import.js)).
- **Many boards at once**: at most 500 files and 200 MB together
  (`MAX_MANY_FILES`, `MAX_MANY_BYTES` in
  [models/lib/importManyFiles.js](../../../../../../models/lib/importManyFiles.js)).
- **One board per project**: at most 200 boards from one file
  (`MAX_SPLIT_BOARDS` in
  [models/lib/importSplit.js](../../../../../../models/lib/importSplit.js)).
- **The loss report** counts what was not imported and the warnings, and lists
  the first 20 of them, each cut to 200 characters, then "and N more"
  ([models/lib/importLossReport.js](../../../../../../models/lib/importLossReport.js)).
- **Every document** passes the one import and export boundary: at most 40
  levels deep, 4,000,000 values, 100,000 items in one array and 4 MB in one
  string
  ([models/lib/importExportBoundary.js](../../../../../../models/lib/importExportBoundary.js)).

## How it works in WeKan

An import is sent to the `importBoard` Meteor method in
[models/import.js](../../../../../../models/import.js). It checks the types of
every argument first, refuses a caller who is not logged in (and records that
attempt in Admin Panel → Problems), stops when Admin Panel has turned import off
([models/lib/importExportSecurity.js](../../../../../../models/lib/importExportSecurity.js)),
and asks
[server/lib/boardCreationGuard.js](../../../../../../server/lib/boardCreationGuard.js)
whether this user may create a board; an import into the current board replaces
it only for a board admin. The import sources and their file types are described
once, in
[models/lib/importSources.js](../../../../../../models/lib/importSources.js).

The file is read by this format's parser into one Kanboard-shaped board
(`EXTERNAL_PARSERS` in
[models/lib/externalParsers.js](../../../../../../models/lib/externalParsers.js)),
which [models/kanboardCreator.js](../../../../../../models/kanboardCreator.js)
writes as a WeKan board: the Boards, Swimlanes, Lists, Cards, Checklists,
ChecklistItems, CardComments and Attachments collections.

An export is a GET route of the REST API, the ones listed under REST API above:
a board's export is served by
[models/export.js](../../../../../../models/export.js)
(`/api/boards/:boardId/export/<format>` for the formats of other tools) or by
this format's own code below, and all boards at once by
`/api/export-all-boards/<format>`
([server/routes/exportAllBoards.js](../../../../../../server/routes/exportAllBoards.js)).
They stop first when Admin Panel has turned export off, need a logged-in user,
and export only a board that user may see; a member who sees only the cards
assigned to them gets no board-wide export
([models/lib/exportAccess.js](../../../../../../models/lib/exportAccess.js)).

This format's own code:
[models/lib/kanriFormat.js](../../../../../../models/lib/kanriFormat.js).

The tests that pin it:
[tests/boardExportScope.test.cjs](../../../../../../tests/boardExportScope.test.cjs),
[tests/importLossReport.test.cjs](../../../../../../tests/importLossReport.test.cjs),
[tests/kanriFormat.test.cjs](../../../../../../tests/kanriFormat.test.cjs),
[tests/playwright/specs/import-export-format-audit.e2e.js](../../../../../../tests/playwright/specs/import-export-format-audit.e2e.js).

The details of the format, what is kept and how it is tested are below.

### Format details

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

### What is kept

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

### What is not kept

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

### How it is built and tested

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

## Commits

 - [Deck and Kanri exports are written a page at a time, each list around its cards](https://github.com/wekan/wekan/commit/21c64e092d8b067a9416a09a92c0ca1424b9da26)
 - [Themes: every board theme and every color a member chooses is readable](https://github.com/wekan/wekan/commit/8b2114cd0f9501867c01521c7a6f78a02e44d549)
 - [Read every import source through one path and one file chooser, from one description of the sources](https://github.com/wekan/wekan/commit/c80a656901103bfd29b41843c7e255b4ed3bfa17)
 - [Import and export many boards at once for every format, and document each format in its own directory](https://github.com/wekan/wekan/commit/7858d84e127c2c6cd92134166352b9a4245d4ec2)
 - [Import and export boards as Kanri JSON](https://github.com/wekan/wekan/commit/eec53eb322f6cee14b61f1fd1f9d1ca0ee26d74e)
