# MeisterTask

WeKan imports boards from [MeisterTask](https://www.meistertask.com) and
exports boards to it as a MeisterTask project CSV file. WeKan reads both CSV
shapes MeisterTask uses: the one its project export writes, and the one its
CSV import reads. WeKan exports the import shape, so MeisterTask can read the
file back. Sections become lists and tasks become cards.

## How to import

1. In MeisterTask, click the project name at the top of the project board and
   choose **Export project**.
2. Click **Export** next to the CSV file format, choose which information to
   include and click **Export**.
3. When the notification on the Dashboard says the file is ready, click
   **Download Now**.
4. Open the CSV file in a text editor and copy all of it.
5. In WeKan, go to **All Boards → New → Import → MeisterTask**.
6. Paste the text into the box and click **Import**. A **Map members** step
   follows with nobody to map: click **Done**. (**Import without mapping
   members (map later)** skips that step.)
7. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

A CSV file written for MeisterTask's own import, such as its sample file,
imports the same way.

## How to import many boards at once

1. On the import page, choose **MeisterTask**, then under **Import many
   boards** choose several CSV files, or one `.zip` that holds them. Each file
   becomes its own board, imported without member mapping. Members can be
   mapped later.
2. MeisterTask is imported through the generalized importer, so there is also
   a checkbox **One board per project**: each swimlane the import would create
   becomes its own board, named after that swimlane. A MeisterTask import puts
   every card in the swimlane **Default** (its sections are lists), so for
   MeisterTask this option makes no difference.

Links (parent cards, dependencies) between cards that end up on different
boards are reported in the loss report rather than kept.

From a script:

```bash
python3 api.py importboardsfrom meistertask FILE_OR_DIR ...
```

The arguments are files, directories of files, or `.zip` files.

## How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Under **Select what to include**, choose what to export, then click
   **MeisterTask**. This downloads `<board>.csv`. The MeisterTask export is for
   a whole board; it is not offered for one swimlane or one list.
3. In MeisterTask, on the Home page, click the **(+)** next to **Projects** on
   the left and choose **Import**, then choose the CSV file. MeisterTask's CSV
   import creates a new project; it does not add tasks to an existing one. For
   the exact steps, see
   [Import Projects Into MeisterTask](https://support.meistertask.com/hc/en-us/articles/4403323243538-Import-Projects-Into-MeisterTask).

## How to export all boards at once

In **All Boards**, open the sidebar and choose **Export all boards**, then
**MeisterTask**. This downloads one `.zip` with one `.csv` file per board you
can export: boards you are a member of, that are not archived and not
templates.

To export only some boards, use **Multi-Selection** in the All Boards sidebar,
select the boards, then click **Export**.

From a script:

```bash
python3 api.py exportallboards meistertask boards.zip
```

## Format details

What WeKan reads is a MeisterTask project CSV in either shape it uses, matched
by header name:

- the
  [import shape](https://support.meistertask.com/hc/en-us/articles/4403323243538-Import-Projects-Into-MeisterTask)
  of its sample file: `project,section,name,notes,due_date,status,tags`;
- the
  [export](https://support.meistertask.com/hc/en-us/articles/4403317110290-Export-Project-Data)
  header:
  `id,token,name,notes,created_at,updated_at,status,due_date,status_updated_at,assignee,section,tags`.

What the import covers:

- sections as lists;
- tasks as cards, with notes as the description;
- `; `-separated tags as labels;
- the assignee as the owner;
- due and created dates (ISO 8601 or a date);
- status 2 (completed), with its `status_updated_at` or `completed_at` as the
  end date;
- status 8 or 16 (binned or archived) as archived cards;
- the id as the source reference;
- the first row's project as the board title.

Reported: any other column (MeisterTask documents no shape for checklists,
comments, custom fields or tracked time in its CSV), unknown status codes, and
dates that are not ISO 8601. The export writes the import shape, which
MeisterTask reads back.

From the current code (`models/lib/meistertaskCsvFormat.js`):

- The file needs the `name` and `section` columns. Header names are matched in
  any case.
- A completed task's end date is `completed_at` when the file has it, else
  `status_updated_at`.
- An empty status is open (1). A status other than 1, 2, 8 or 16 is reported
  and the task is imported as open.
- Dates are read as `2021-04-26T07:35:13+00:00`, `2021-04-26 07:35:13` or
  `2021-04-26`.
- A task without a section goes to the list **No section**. Without a project
  column, the board is named **Imported MeisterTask**.
- The columns `token`, `updated_at` and `status_updated_at` (for a task that is
  not completed) are known, so they are not reported, but they are not kept.

The export writes `project,section,name,notes,due_date,status,tags`:

- `project` is the board title and `section` the card's list;
- `due_date` in ISO 8601 with `+00:00`;
- `status` 2 for a card with an end date, 1 otherwise;
- the labels joined with `; ` (a `;` inside a label becomes `,`).

## What is kept

| MeisterTask | WeKan |
| --- | --- |
| project (first row) | Board title |
| section | List |
| name | Card title |
| notes | Description |
| id | The card's source reference |
| tags (`a; b`) | Labels |
| assignee | Card member, when mapped (see below) |
| due_date | Due date |
| created_at | Creation date |
| status 2, with completed_at or status_updated_at | End date |
| status 8 or 16 | Archived card |

The assignee becomes a card member only when that name is mapped to a WeKan
user, through the REST API's `membersMapping`. The import page maps no one, so
there it is not kept.

## What is not kept

The import reports these on the loss report, rather than dropping them
silently:

- any column MeisterTask does not document for its CSV, by name (for example
  checklists, comments, custom fields or tracked time);
- a status code other than 1, 2, 8 or 16;
- a date that is not ISO 8601;
- a row without a name.

The export leaves out assignees, start, end and creation dates, checklists,
comments, custom fields, attachments, swimlanes and archived cards. A
completed card is written as status 2 without its completion date, because
the import shape has no column for it.

## REST API

```bash
python3 api.py importboardfrom meistertask project.csv
python3 api.py importboardsfrom meistertask project1.csv project2.csv
python3 api.py exportboardformat BOARDID meistertask project.csv
python3 api.py exportallboards meistertask boards.zip
```

The HTTP routes:

- `POST /api/boards/import/meistertask`: the body is
  `{"board": "<CSV text>"}`.
- `GET /api/boards/:boardId/export/meistertask?authToken=…`
- `GET /api/export-all-boards/meistertask?authToken=…`, with
  `&boardIds=ID1,ID2` for selected boards only.

## How it is built and tested

- `models/lib/meistertaskCsvFormat.js` reads and writes the CSV, with the CSV
  reader of `models/lib/todoistCsvFormat.js`. `models/lib/externalParsers.js`
  lists it in `EXTERNAL_PARSERS`, and `models/kanboardCreator.js` creates the
  board.
- `models/lib/externalExportFormatters.js` and
  `models/lib/externalExporters.js` collect the board and write the export.
- `tests/meistertaskCsv.test.cjs` is the unit test, and
  `tests/externalExportRoundTrip.test.cjs` runs the export back through the
  import.
- The Playwright case is in
  `tests/playwright/specs/import-export-format-audit.e2e.js`: *MeisterTask: a
  project CSV imports with its sections, notes, due date and tags*, and *every
  external export menu link returns text and refuses an unrelated user*.

## Sources

- [Export Project Data](https://support.meistertask.com/hc/en-us/articles/4403317110290-Export-Project-Data):
  the export steps and the export's columns
- [Import Projects Into MeisterTask](https://support.meistertask.com/hc/en-us/articles/4403323243538-Import-Projects-Into-MeisterTask):
  the import steps and the sample file's columns

See also the [format coverage](../Format-Coverage.md) and
[all formats](../External-Tools.md).
