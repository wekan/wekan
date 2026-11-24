# CSV / TSV

## What it is

WeKan imports a board from a CSV (comma separated values) or TSV (tab
separated values) text, one card per row, and exports a board as CSV with a
comma or a semicolon, or as TSV. The first row is the header: it names the
columns. Before importing, the import page shows which column it will read
as which card field, matched from the column names, and you can change any
of them. A WeKan CSV export imports again as it is, in whatever language it
was exported in.

Example files to try the import with:

- [board-import.csv](./board-import.csv)
- [board-import.tsv](./board-import.tsv)

## Read more

- [Wikipedia: comma-separated values, the file format](https://en.wikipedia.org/wiki/Comma-separated_values)
- [RFC 4180](https://www.rfc-editor.org/rfc/rfc4180): the CSV format
- [Papa Parse](https://www.papaparse.com/docs): the parser the import page
  uses, and its separator detection

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. Make the file in a spreadsheet program or a text editor, and save it as CSV
   or as tab separated text in UTF-8 (see your program's documentation). The
   first row must be the header row; the columns are listed under **Format
   details**.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → CSV / TSV**.
3. Tick the parts to import (**Select what to include**).
4. Paste the text of the file into the text box and click **Import** (or
   **Import without mapping members (map later)** to skip step 6). The import
   page says: *Paste in your Comma Separated Values(CSV)/ Tab Separated Values
   (TSV).*
5. **Which column is which?** Each card field - title, description, list,
   swimlane, owner, members, assignee, labels, the received, start, due and
   end dates, created and last modified dates, requested by, assigned by,
   parent card, spent time, overtime and archived - has a choice of the file's
   columns, each shown with its first value. The choices are made from the
   column names (see **Import columns**); change any that are wrong, and
   choose *(not in the file)* for a field the file does not have.
   - When the file has no column for the list, the page asks for **List for
     every card**: choose the column above, or type the name of the one list
     every card goes into. It starts as *To do* in your language.
   - Columns that no field uses can be ticked to import as text custom
     fields named after the column.
   - Click **Next** (or **Import** when member mapping was skipped).
6. **Map members**: each username in the columns chosen for owner, members,
   assignee, requested by and assigned by is listed. A username that matches a
   WeKan user is mapped to that user already; you can map the others, or click
   **Import without mapping members (map later)**.
7. The board opens when the import is done.

A CSV import does not write a loss report: a column that no field uses is
skipped without a note.

#### History

The import used to be reached at *your username / All Boards / Add Board /
Import / From CSV/TSV*. It was asked for in
[issue 395](https://github.com/wekan/wekan/issues/395) and added in
[PR 3081](https://github.com/wekan/wekan/pull/3081); see the
[related pull requests](https://github.com/wekan/wekan/pulls?q=is%3Apr+is%3Aclosed+csv).

### How to import many boards at once

- On the import page, under **Import many boards**, choose several CSV or TSV
  files, or one `.zip` that holds them. Each file becomes its own board,
  imported without member mapping (members can be mapped later) and without
  the mapping step: each file's columns are read by their names, and a file
  with no list column puts its cards in one list, *To do* in your language.
- CSV is not imported through the generalized importer, so **One board per
  project** is not offered for it. A Swimlane column gives one swimlane per
  value instead.
- From a script: `python3 api.py importboardsfrom csv FILE_OR_DIR ...`
  (files, directories of files, or `.zip` files).

### How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Under **Select what to include**, tick the parts you want. In a CSV the
   parts are columns: **Board Info** keeps List and Swimlane, **People** the
   five people columns, **Dates** the seven date and time columns, **Labels**,
   **Description**, **Voting** and **Custom Fields** their columns. Title and
   Archived are always written.
3. Under **CSV**, choose **(,)** for commas, **(;)** for semicolons, or
   **TSV** for tabs.
4. Open the file in a spreadsheet program, or import it into another tool that
   reads CSV. The comma and semicolon files start with a UTF-8 byte order mark,
   so Excel shows non-English text correctly.

### How to export all boards at once

- **All Boards → sidebar → Export all boards**, choose **CSV (,)**, **CSV
  (;)** or **TSV**: this downloads one `.zip` with one file per board you can
  export (boards you are a member of, not archived, not templates).
- To export only some boards: **Multi-Selection** in the All Boards sidebar,
  select the boards, then **Export**.
- From a script: `python3 api.py exportallboards csv boards.zip` (or `scsv`
  for semicolons, `tsv` for tabs).

### REST API

```bash
python3 api.py importboardfrom csv board.csv          # POST /api/boards/import/csv
python3 api.py importboardsfrom csv a.csv b.tsv
python3 api.py exportboardformat BOARDID csv board.csv  # GET /api/boards/BOARDID/export/csv?delimiter=,
python3 api.py exportboardformat BOARDID scsv board.csv # ?delimiter=;
python3 api.py exportboardformat BOARDID tsv board.tsv  # a tab
python3 api.py exportallboards csv boards.zip         # GET /api/export-all-boards/csv?authToken=...
python3 api.py exportallboards scsv boards.zip        # semicolons
python3 api.py exportallboards tsv boards.zip         # tabs
```

- `importboardfrom csv` reads the file as the import page does (a tab, a
  semicolon or a comma as the separator) and sends the rows to
  `POST /api/boards/import/csv`, with an optional `membersMapping`.
- The mapping step's choices go in `csvMapping`, beside `board`:
  `{"board": [[...header...], [...row...]], "csvMapping": {"columns":
  {"title": 0, "list": 2, "owner": 3}, "listName": "To do",
  "customFieldColumns": [5]}}`. Column numbers start from 0; the field names
  are `title`, `description`, `list`, `swimlane`, `owner`, `members`,
  `assignees`, `labels`, `receivedAt`, `startAt`, `dueAt`, `endAt`,
  `createdAt`, `modifiedAt`, `requestedBy`, `assignedBy`, `parentCard`,
  `spentTime`, `isOvertime` and `archived`. `listName` is used when there is
  no `list` column. A field name WeKan does not have, a column the file does
  not have, or anything else in `csvMapping` is refused with `400` and no
  board is made. Without `csvMapping` the columns are read by their names.
  From `api.py`: `python3 api.py importboardfrom csv board.csv --csv-mapping
  mapping.json`.
- `GET /api/boards/BOARDID/export/csv?authToken=TOKEN&delimiter=,` exports
  one board. `delimiter` is `,` (the default), `;` or a tab (`%09`);
  `fields` takes the same part names as the export popup.
- The mass export route takes an optional `&boardIds=ID1,ID2` to export only
  those boards.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- A list name given in the column mapping may be at most 255 characters; a
  longer one makes the mapping invalid. (`MAX_LIST_NAME` in
  [models/lib/csvImportMapping.js](../../../../../../models/lib/csvImportMapping.js#L73))
- The column mapping accepts at most 10,000 columns. (`MAX_COLUMNS` in
  [models/lib/csvImportMapping.js](../../../../../../models/lib/csvImportMapping.js#L74))
- The header row read for the column mapping has at most 10,000 cells.
  (`MAX_HEADER_CELLS` in
  [server/methods/csvImportMapping.js](../../../../../../server/methods/csvImportMapping.js#L15))
- The column mapping step shows the first 3 data rows of the file as samples.
  (`SAMPLE_ROWS` in
  [server/methods/csvImportMapping.js](../../../../../../server/methods/csvImportMapping.js#L16))

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
[models/lib/csvImportMapping.js](../../../../../../models/lib/csvImportMapping.js),
[models/lib/exporterCsvRow.js](../../../../../../models/lib/exporterCsvRow.js),
[models/lib/importedTableRows.js](../../../../../../models/lib/importedTableRows.js),
[server/lib/importHeaderNames.js](../../../../../../server/lib/importHeaderNames.js),
[server/methods/csvImportMapping.js](../../../../../../server/methods/csvImportMapping.js).

The tests that pin it:
[tests/csvCreator.headerMapping.test.cjs](../../../../../../tests/csvCreator.headerMapping.test.cjs),
[tests/csvImportMapping.test.cjs](../../../../../../tests/csvImportMapping.test.cjs),
[tests/exportBoardPopupOrder.test.cjs](../../../../../../tests/exportBoardPopupOrder.test.cjs),
[tests/exporterCsvRow.test.cjs](../../../../../../tests/exporterCsvRow.test.cjs),
[tests/importFormatAudit.test.cjs](../../../../../../tests/importFormatAudit.test.cjs),
[tests/playwright/specs/export-access.e2e.js](../../../../../../tests/playwright/specs/export-access.e2e.js),
[tests/playwright/specs/import-export-format-audit.e2e.js](../../../../../../tests/playwright/specs/import-export-format-audit.e2e.js).

The details of the format, what is kept and how it is tested are below.

### Format details

From the [format coverage](../Format-Coverage.md) audit:

- **Authoritative shape:** RFC 4180 CSV and tab-delimited UTF-8 with a header
  row.
- **Required import coverage:** quoted separators, newlines and quotes, BOM,
  CRLF and LF, locale-independent ISO dates and every documented WeKan column
  and custom field.

The import reads the quoting, line ends, ISO dates, custom field columns and
every column the export writes, under its export name in any language.

#### Import columns

The import page parses the text with [Papa Parse](https://www.papaparse.com).
A text whose first line has a tab is read with tab as the separator, so a TSV
value that contains a comma stays one value; otherwise the separator is a
comma, or a semicolon when the first line has more semicolons than commas.
Empty rows are skipped.

The mapping step's first choices come from the header names, in any case and
in any order (`models/lib/csvImportMapping.js`). A header is recognised by
the English names below, and by the name WeKan's CSV and Excel exports give
the column in **every language WeKan has**: a board exported by a Finnish
user has the header `Otsikko`, not `Title`, and imports the same. When two
columns of a WeKan export have the same name in some language, their place
in the export decides which is which.

| Field | English header names |
| --- | --- |
| Title | `Title`, `Name`, `Card`, `Task`, `Task name`, `Summary`, `Subject` |
| Description | `Description`, `Details`, `Notes` |
| List | `List`, `Stage`, `Status`, `State`, `Column`: one list per value, in the order the values first appear |
| Swimlane | `Swimlane`, `Lane`: one swimlane per value; without it one swimlane, **Default** |
| Owner | `Owner`, `Creator`, `Created by`, `Author`: the card's creator |
| Members | `Members`, `Member` |
| Assignee | `Assignee`, `Assignees`, `Assigned to` |
| Labels | `Labels`, `Label`, `Tags`: separated by spaces or commas, each `name` or `name-color` (black when no color is given) |
| Received, Start, Due, End | `Received`, `Start` / `Start date`, `Due` / `Due date` / `Deadline`, `End` / `End date` / `Finish date` (and `... at`) |
| Created at, Last modified at | `Created at` / `Creation date`, `Last modified at` / `Updated at` / `Modified on` |
| Requested By, Assigned By | `Requested by`, `Assigned by` |
| Parent card | `Parent card`: the title of another card of the file |
| Spent time, Overtime | `Spent time (hours)`, `Overtime (hours)` |
| Archived | `Archived`: `true` archives the card |
| Custom fields | `CustomField-NAME-TYPE`, `CustomField-NAME-dropdown-A/B/C` (or `dropdownMultiSelect`), `CustomField-NAME-currency-EUR` |

- When no column is recognised as the title, the first column that is not
  another field's is the title, so a plain list of tasks under any heading
  imports.
- People columns hold usernames separated by spaces or commas. A username is
  applied when it was mapped in the members step, or when it is the importing
  user's own; Owner falls back to the importing user. Requested By and
  Assigned By keep the names that were not mapped as the card's free text.
- Dates are read with JavaScript's date parser: ISO 8601 (`2026-09-01` or
  `2026-09-01T12:00:00.000Z`) works everywhere; the example file uses
  `MM/DD/YYYY`.
- Cards go to the list their list cell names. With no list column, or an
  empty list cell, they go to one list: the name typed in the mapping step,
  or *To do* in the importing user's language. One list per row is never
  made.
- The board is named **Imported Board** with the import date, is private,
  and the importing user is its admin.
- On Sandstorm, the import replaces the board it was started from.

#### Export columns

The export (`/api/boards/:boardId/export/csv`, written by
`Exporter.buildCsvStream` in `models/exporter.js` and
`models/lib/exporterCsvRow.js`) writes one row per card, archived cards
included and linked cards left out. The headers are in the exporting user's
language (English for a public board exported without signing in); in
English they are:

`Title, Description, List, Swimlane, Owner, Requested By, Assigned By,
Members, Assignee, Labels, Start, Due, End, Overtime (hours), Spent time
(hours), Created at, Last modified at, Last activity, Voting, Archived`, then
one `CustomField-NAME-TYPE` column per custom field of the board, named as
the import reads them.

- Owner is the card's creator. Members and Assignee are usernames separated by
  spaces; Requested By and Assigned By are usernames and the free text,
  separated by commas.
- Labels are `name-color`, separated by spaces.
- Dates are ISO 8601 in UTC. Overtime and Archived are `true` or `false`.
- Voting is `question-yes-N-no-N`, with the voters' usernames after each count
  when the vote is public.
- A card that refers to a list, swimlane, user, label or custom field that no
  longer exists gets an empty cell instead of failing the export.
- Every value is quoted, rows end with CRLF, and a value that starts like a
  formula is escaped so a spreadsheet does not run it.

#### Importing a WeKan CSV export again

Import the file as it is: every column of the export, under its name in the
language it was exported in, is chosen for its field in the mapping step.
Last activity and Voting are not imported.

### What is kept

| CSV / TSV column | WeKan |
| --- | --- |
| Title, Description | Card title, description |
| List (Stage / Status / State) | List; without it, one list named in the mapping step |
| Swimlane | Swimlane |
| Owner | The card's creator (a mapped username, or the importing user) |
| Members, Assignee | Card members and assignees (mapped usernames) |
| Requested By, Assigned By | Requesters and assigners (mapped usernames), the rest as text |
| Labels (`name-color`) | Board labels and the card's labels |
| Received, start, due, end, created and last modified dates | Card dates |
| Parent card | The card's parent, by title |
| Spent time, Overtime, Archived | Spent time, overtime, archived |
| `CustomField-...` | Board custom fields and the card's values |
| Every other named column | A text custom field of its name: ticked in the mapping step by default, and always when no mapping is sent (a REST import) |

The export writes every column listed under **Export columns**.

### What is not kept

On import:

- columns unticked in the mapping step, and WeKan's own Number, Last
  activity and Voting columns, which no card field takes;
- members who were not mapped (Requested By and Assigned By keep them as
  text);
- label names with spaces or commas in them: those separate two labels;
- a dropdown custom field value that is not one of the field's items.

The CSV import writes no loss report, so none of this is listed in Admin Panel
→ Problems.

The export leaves out comments, checklists, subtasks, attachments,
dependencies, received dates and Scrum data. These are in the
[WeKan JSON](../WeKan/From-Previous-Export.md) and
[Excel](../Excel/README.md) exports.

### How it is built and tested

- Front end: [the import page](../../../../../../client/components/import)
  (`client/components/import/import.js` hands the text to `csvMapping.js`,
  which parses it and shows the mapping step, `csvMapping.jade`;
  `csvMembersMapper.js` lists the members to map).
- Mapping: `models/lib/csvImportMapping.js` matches the header names, checks
  a mapping and plans the board; `server/lib/importHeaderNames.js` loads
  every language's export column names; `server/methods/csvImportMapping.js`
  answers the page's `csvImportGuessMapping` call.
- Back end: [the CSV import](../../../../../../models/csvCreator.js) writes the
  plan and [the general import](../../../../../../models/import.js) checks the
  mapping's shape; `models/lib/importedTableRows.js` drops empty rows. The export is
  `models/export.js` (route), `models/exporter.js` (`buildCsvStream`),
  `models/lib/exporterCsvRow.js` (one row) and `models/lib/exportFields.js`
  (which part keeps which column).
- Unit tests: `tests/csvImportMapping.test.cjs` (a confirmed mapping is
  used, one list when there is no list column, Owner, WeKan export headers
  in every language, a wrong mapping refused, a TSV value with a comma),
  `tests/csvCreator.headerMapping.test.cjs` (header names),
  `tests/exporterCsvRow.test.cjs` (export rows with missing references),
  `tests/importFormatAudit.test.cjs` (empty rows),
  `tests/exportBoardPopupOrder.test.cjs` (the export menu).
- Playwright: `tests/playwright/specs/import-export-format-audit.e2e.js`
  (multiline Unicode text survives a CSV import; an empty import fails without
  creating a board; the mapping step asks for a list for a file without one
  and every card goes into it; a mapping with a column the file does not have
  is refused) and `tests/playwright/specs/export-access.e2e.js` (an
  assigned-only member cannot read the unfiltered CSV export).

## Commits

 - [CSV, TSV and Excel imports keep every column: one with no card field becomes a text custom field](https://github.com/wekan/wekan/commit/5b9fa791a82da0bcaa01e5b04f8e711c011580db)
 - [The Markdown, Obsidian, OPML and Org mode outlines and the Notion CSV are written a page of cards at a time](https://github.com/wekan/wekan/commit/ce40b56abdf5b166f523dab98a14414907809b1f)
 - [Jira and CSV / TSV files are uploaded too; their people and columns are read from the file on the server](https://github.com/wekan/wekan/commit/60bbf69164766746718c1792f228b6f2809cd715)
 - [Honor field selections in public CSV and TSV exports](https://github.com/wekan/wekan/commit/4762bed8c14fa68787a2d10711f0acbfb46c9342)
 - [Ask for the columns of a CSV or Excel import, apply Owner, and import WeKan's own Excel export](https://github.com/wekan/wekan/commit/86652c8718abf6a91964d2676b711ef9093829cc)
 - [Import and export boards as Notion Markdown & CSV exports](https://github.com/wekan/wekan/commit/b7d3274780989c8169549507e416c60316d70ccf)
 - [Import and export boards as Redmine issue CSV](https://github.com/wekan/wekan/commit/6c9ffd63d44cb49519fa52e731cbcc7d8d6e5be3)
 - [Import and export boards as Quire CSV](https://github.com/wekan/wekan/commit/979edf4c3b202ba770db7b9db2647ef9dcccaa88)
 - [Import and export boards as Pivotal Tracker stories CSV](https://github.com/wekan/wekan/commit/2e5fd9530e20087b8c9e80f4301b1c72fcc1c649)
 - [Import and export boards as ClickUp task CSV](https://github.com/wekan/wekan/commit/1e7911a2d01e629c76c4d2422142c330857a74b0)
 - [Import and export boards as TickTick backup CSV](https://github.com/wekan/wekan/commit/46f026ddb6ca7ca230c29556cd5ca254056fc5dd)
 - [Import and export boards as Linear CSV](https://github.com/wekan/wekan/commit/fb7cbc66e6c942760de73873fb5fb2f6f66b2a8f)
 - [Import and export boards as MeisterTask project CSV](https://github.com/wekan/wekan/commit/804c7183a2d5919e176af8c0436978346c962989)
 - [Import and export boards as Todoist project templates (CSV)](https://github.com/wekan/wekan/commit/1eabb367e7703234a97e48876165fd15e89fff1f)
 - [Add regression tests for CSV, Kanboard and Jira import parsing](https://github.com/wekan/wekan/commit/baec475febba98a6fff15e342d8830d2bc0d0009)
 - [Stream board exports (JSON, CSV/TSV, Excel) with bounded memory](https://github.com/wekan/wekan/commit/41cd166358ea40a4517eddd02fe1913c22b7777b)
 - [Fix #5604: CSV export no longer crashes on boards with dangling references](https://github.com/wekan/wekan/commit/d01526bbff892a946a58aae1b516bd0b82d23113)
 - [Fix : export CSV, TSV and XLS translation Feature : add export CSV with semicolon separator](https://github.com/wekan/wekan/commit/11bf4c7c07865205481c8a4a338736fdc8d29f04)
 - [Fix: Impersonate user can now export Excel/CSV/TSV/JSON. Impersonate user and export Excel/CSV/TSV/JSON is now logged ](https://github.com/wekan/wekan/commit/3908cd5413b775d1ee549f0a95304cf9998d3855)
 - [Add back checks about can user export CSV/TSV](https://github.com/wekan/wekan/commit/afe00d02cddf016a3ccc1ed9a98a7f10d3339f26)
 - [Try to prevent errors on CSV/TSV export](https://github.com/wekan/wekan/commit/b00db983c8506e0cdc9968e452c3c8025fc10776)
 - [Fix vote export to CSV/TSV & export currency custom field](https://github.com/wekan/wekan/commit/8c149da9e920de3c1c15119030d24b0752769cfc)
 - [Move In Progress ostrio-files changes to separate branch, and revert ostrio-files changes, so that: - Export to CSV/TSV ](https://github.com/wekan/wekan/commit/d52affe65893f17bab59bb43aa9f5afbb54993d3)
 - [Add: export board/cards/lists to CSV/TSV](https://github.com/wekan/wekan/commit/a570c4a86157ce4b60e056a4f0583ebc0fe009cf)
 - [Add: import board/cards/lists using CSV/TSV](https://github.com/wekan/wekan/commit/1742bcd9b15737c5853e9bcd0a6301139498307d)
