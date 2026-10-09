# CSV / TSV

WeKan imports a board from a CSV (comma separated values) or TSV (tab
separated values) text, one card per row, and exports a board as CSV with a
comma or a semicolon, or as TSV. The first row is the header: it names the
columns, and WeKan reads the columns it knows by their names. The import and
the export use different column names, so a WeKan CSV export needs its
headers renamed before it imports again (see **Format details**).

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
4. Paste the text of the file into the text box and click **Import**. The
   import page says: *Paste in your Comma Separated Values(CSV)/ Tab Separated
   Values (TSV).*
5. **Map members**: each username in the **Members** column is listed. A
   username that matches a WeKan user is mapped to that user already; you can
   map the others, or click **Import without mapping members (map later)**.
6. The board opens when the import is done.

A CSV import does not write a loss report: a column whose header WeKan does
not know is skipped without a note.

### History

The import used to be reached at *your username / All Boards / Add Board /
Import / From CSV/TSV*. It was asked for in
[issue 395](https://github.com/wekan/wekan/issues/395) and added in
[PR 3081](https://github.com/wekan/wekan/pull/3081); see the
[related pull requests](https://github.com/wekan/wekan/pulls?q=is%3Apr+is%3Aclosed+csv).

## How to import many boards at once

- On the import page, under **Import many boards**, choose several CSV or TSV
  files, or one `.zip` that holds them. Each file becomes its own board,
  imported without member mapping (members can be mapped later).
- CSV is not imported through the generalized importer, so **One board per
  project** is not offered for it. A CSV import always makes one swimlane.
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

The current code covers the quoting, line ends, ISO dates and custom field
columns, but the import does not read every column the export writes: List,
Swimlane, Start, Due, End and the people columns other than Members are not
recognized under their export names.

### Import columns

The import page parses the text with [Papa Parse](https://www.papaparse.com),
which detects the separator. A text with tabs has its tabs turned into commas
first, so a TSV value that itself contains a comma is split there. Empty rows
are skipped. `models/csvCreator.js` then reads these headers, in any case and
in any order:

| Header | What it becomes |
| --- | --- |
| `Title` | Card title |
| `Description` | Card description |
| `Stage`, `Status` or `State` | The list. One list per value, in the order the values first appear |
| `Members` or `Member` | Card members: usernames separated by spaces, each one that was mapped |
| `Labels` or `Label` | Labels separated by spaces, each `name` or `name-color` (black when no color is given) |
| `Due date`, `Deadline` or `Due at` | Due date |
| `Start date` or `Start at` | Start date |
| `Finish date` or `End at` | End date |
| `Creation date` or `Created at` | Creation date |
| `Update date`, `Updated at`, `Modified at` or `Modified on` | Modification date |
| `CustomField-NAME-TYPE` | A custom field NAME of TYPE |
| `CustomField-NAME-dropdown-A/B/C` | A dropdown (or `dropdownMultiSelect`) field with the items A, B and C |
| `CustomField-NAME-currency-EUR` | A currency field with that currency code |

- Dates are read with JavaScript's date parser: ISO 8601 (`2026-09-01` or
  `2026-09-01T12:00:00.000Z`) works everywhere; the example file uses
  `MM/DD/YYYY`.
- An `Owner` column is recognized but not applied to the cards.
- Every row should have a Stage, Status or State value. A row without one
  creates a list named **Imported List** with the import date.
- The board is named **Imported Board** with the import date, is private, and
  has one swimlane, **Default**. The importing user is its admin.
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

Rename these headers first: `List` to `Status`, `Start` to `Start date`,
`Due` to `Due date`, `End` to `Finish date` and `Last modified at` to
`Updated at`. Title, Description, Members, Labels, Created at and the
`CustomField-...` columns are read as they are.

## What is kept

| CSV / TSV column | WeKan |
| --- | --- |
| Title, Description | Card title, description |
| Stage / Status / State | List |
| Members | Card members (mapped usernames) |
| Labels (`name-color`) | Board labels and the card's labels |
| Due, start, finish, created and updated dates | Card dates |
| `CustomField-...` | Board custom fields and the card's values |

The export writes every column listed under **Export columns**.

## What is not kept

On import:

- columns WeKan does not know, including Swimlane, Owner, Requested By,
  Assigned By, Assignee, Overtime, Spent time, Last activity, Voting and
  Archived; every card goes to one swimlane and is not archived;
- members who were not mapped;
- label names with spaces in them: a space separates two labels;
- in TSV, a comma inside a value (see **Import columns**).

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

- `importboardfrom csv` reads the file as the import page does (tabs turned
  into commas, comma or semicolon detected) and sends the rows to
  `POST /api/boards/import/csv`, with an optional `membersMapping`.
- `GET /api/boards/BOARDID/export/csv?authToken=TOKEN&delimiter=,` exports
  one board. `delimiter` is `,` (the default), `;` or a tab (`%09`);
  `fields` takes the same part names as the export popup.
- The mass export route takes an optional `&boardIds=ID1,ID2` to export only
  those boards.

## How it is built and tested

- Front end: [the import page](../../../../client/components/import)
  (`client/components/import/import.js` parses the text,
  `csvMembersMapper.js` lists the members to map).
- Back end: [the CSV import](../../../../models/csvCreator.js) and
  [the general import](../../../../models/import.js);
  `models/lib/importedTableRows.js` drops empty rows. The export is
  `models/export.js` (route), `models/exporter.js` (`buildCsvStream`),
  `models/lib/exporterCsvRow.js` (one row) and `models/lib/exportFields.js`
  (which part keeps which column).
- Unit tests: `tests/csvCreator.headerMapping.test.cjs` (header names),
  `tests/exporterCsvRow.test.cjs` (export rows with missing references),
  `tests/importFormatAudit.test.cjs` (empty rows),
  `tests/exportBoardPopupOrder.test.cjs` (the export menu).
- Playwright: `tests/playwright/specs/import-export-format-audit.e2e.js`
  (multiline Unicode text survives a CSV import; an empty import fails without
  creating a board) and `tests/playwright/specs/export-access.e2e.js` (an
  assigned-only member cannot read the unfiltered CSV export).

## Sources

- [RFC 4180](https://www.rfc-editor.org/rfc/rfc4180): the CSV format
- [Papa Parse](https://www.papaparse.com/docs): the parser the import page
  uses, and its separator detection

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).
