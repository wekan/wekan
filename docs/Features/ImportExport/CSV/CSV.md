# CSV / TSV

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

## How to import

1. Make the file in a spreadsheet program or a text editor, and save it as CSV
   or as tab separated text in UTF-8 (see your program's documentation). The
   first row must be the header row; the columns are listed under **Format
   details**.
2. In WeKan, go to **All Boards → New → Import → CSV / TSV**.
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

### History

The import used to be reached at *your username / All Boards / Add Board /
Import / From CSV/TSV*. It was asked for in
[issue 395](https://github.com/wekan/wekan/issues/395) and added in
[PR 3081](https://github.com/wekan/wekan/pull/3081); see the
[related pull requests](https://github.com/wekan/wekan/pulls?q=is%3Apr+is%3Aclosed+csv).

## How to import many boards at once

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

## How to export

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

## How to export all boards at once

- **All Boards → sidebar → Export all boards**, choose **CSV (,)**, **CSV
  (;)** or **TSV**: this downloads one `.zip` with one file per board you can
  export (boards you are a member of, not archived, not templates).
- To export only some boards: **Multi-Selection** in the All Boards sidebar,
  select the boards, then **Export**.
- From a script: `python3 api.py exportallboards csv boards.zip` (or `scsv`
  for semicolons, `tsv` for tabs).

## Format details

From the [format coverage](../Format-Coverage.md) audit:

- **Authoritative shape:** RFC 4180 CSV and tab-delimited UTF-8 with a header
  row.
- **Required import coverage:** quoted separators, newlines and quotes, BOM,
  CRLF and LF, locale-independent ISO dates and every documented WeKan column
  and custom field.

The import reads the quoting, line ends, ISO dates, custom field columns and
every column the export writes, under its export name in any language.

### Import columns

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

### Export columns

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

### Importing a WeKan CSV export again

Import the file as it is: every column of the export, under its name in the
language it was exported in, is chosen for its field in the mapping step.
Last activity and Voting are not imported.

## What is kept

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
| Other columns ticked in the mapping step | Text custom fields |

The export writes every column listed under **Export columns**.

## What is not kept

On import:

- columns no field uses and that were not ticked as custom fields,
  including WeKan's Last activity and Voting columns;
- members who were not mapped (Requested By and Assigned By keep them as
  text);
- label names with spaces or commas in them: those separate two labels;
- a dropdown custom field value that is not one of the field's items.

The CSV import writes no loss report, so none of this is listed in Admin Panel
→ Problems.

The export leaves out comments, checklists, subtasks, attachments,
dependencies, received dates and Scrum data. These are in the
[WeKan JSON](../WeKan/From-Previous-Export.md) and
[Excel](../Excel/Excel.md) exports.

## REST API

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

## How it is built and tested

- Front end: [the import page](../../../../client/components/import)
  (`client/components/import/import.js` hands the text to `csvMapping.js`,
  which parses it and shows the mapping step, `csvMapping.jade`;
  `csvMembersMapper.js` lists the members to map).
- Mapping: `models/lib/csvImportMapping.js` matches the header names, checks
  a mapping and plans the board; `server/lib/importHeaderNames.js` loads
  every language's export column names; `server/methods/csvImportMapping.js`
  answers the page's `csvImportGuessMapping` call.
- Back end: [the CSV import](../../../../models/csvCreator.js) writes the
  plan and [the general import](../../../../models/import.js) checks the
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

## Sources

- [RFC 4180](https://www.rfc-editor.org/rfc/rfc4180): the CSV format
- [Papa Parse](https://www.papaparse.com/docs): the parser the import page
  uses, and its separator detection

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).
