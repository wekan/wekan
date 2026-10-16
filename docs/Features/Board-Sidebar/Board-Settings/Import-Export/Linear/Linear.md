# Linear

WeKan imports boards from [Linear](https://linear.app) and exports boards to
it as Linear's issues CSV file. Statuses become lists, teams become swimlanes,
and issues become cards with their assignee, labels, dates, parent issue,
priority, estimate, project and cycle. The export writes Linear's own columns
in Linear's order.

## How to import

1. In Linear, export the issues as CSV, in one of these ways:
   - the whole workspace: **Settings → Administration → Import / Export**,
     then **Export data** at the bottom. Linear emails a download link that
     expires after 12 hours. Admins can do this (on Enterprise plans, owners
     only);
   - one project or custom view: click its name and choose **Export issues as
     CSV…**, or press `Ctrl`/`Cmd` + `K` and choose the export option. Members
     can export up to 250 issues, admins and owners up to 2,000.
2. Open the CSV file in a text editor and copy all of it.
3. In WeKan, go to **All Boards → New → Import → Linear**.
4. Paste the text into the box and click **Import**. A **Map members** step
   follows with nobody to map: click **Done**. (**Import without mapping
   members (map later)** skips that step.)
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

## How to import many boards at once

1. On the import page, choose **Linear**, then under **Import many boards**
   choose several CSV files, or one `.zip` that holds them. Each file becomes
   its own board, imported without member mapping. Members can be mapped
   later.
2. Linear is imported through the generalized importer, so there is also a
   checkbox **One board per project**: each swimlane the import would create
   becomes its own board, named after that swimlane. For Linear the swimlanes
   are the **Teams**, so a workspace export becomes one board per Linear team.
   Issues without a team are in the swimlane **Default**.

Links (parent cards, dependencies) between cards that end up on different
boards are reported in the loss report rather than kept. For Linear this is a
parent issue in another team.

From a script:

```bash
python3 api.py importboardsfrom linear FILE_OR_DIR ...
```

The arguments are files, directories of files, or `.zip` files.

## How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Under **Select what to include**, choose what to export, then click
   **Linear**. This downloads `<board>.csv`. The Linear export is for a whole
   board; it is not offered for one swimlane or one list.
3. Linear imports through its in-product import assistants and its CLI
   importer; Linear's open-source CLI importer has a Linear CSV importer that
   reads this file's columns. See Linear's
   [import documentation](https://linear.app/docs/import-issues) for the
   steps.

## How to export all boards at once

In **All Boards**, open the sidebar and choose **Export all boards**, then
**Linear**. This downloads one `.zip` with one `.csv` file per board you can
export: boards you are a member of, that are not archived and not templates.

To export only some boards, use **Multi-Selection** in the All Boards sidebar,
select the boards, then click **Export**.

From a script:

```bash
python3 api.py exportallboards linear boards.zip
```

## Format details

What WeKan reads is Linear's
[CSV export](https://linear.app/docs/exporting-data) (workspace or view),
matched by header name: ID, Team, Title, Description, Status, Estimate,
Priority, Project, Creator, Assignee, Labels, Cycle, Created, Started,
Completed, Canceled, Archived, Due Date, Parent issue, and newer columns.
Values are read as Linear's own
[CSV importer](https://github.com/linear/linear/blob/master/packages/import/src/importers/linearCsv/LinearCsvImporter.ts)
reads them: priority names, labels joined by `, `, and a leading `'` before
formula-like text.

What the import covers:

- statuses as lists;
- Teams as swimlanes;
- issues as cards, with the ID as the source reference and Parent issue as
  the parent card;
- Assignee as the owner and Creator as Requested by;
- `, `-separated labels;
- the created, started, completed (or canceled) and due dates;
- Archived as an archived card;
- Priority, Estimate, Project and Cycle (and Canceled) as custom fields.

Reported: Updated, Triaged, the cycle's dates, Initiatives, milestones, SLA
Status, dates that are not ISO 8601, and unknown priorities. The export writes
Linear's columns in its order, with the formula guard.

From the current code (`models/lib/linearCsvFormat.js`):

- The file needs the Title and Status columns. An `Id` column is read as ID.
- Linear writes `'` before text a spreadsheet could read as a formula (text
  starting with `+ - = @` and similar signs). The import removes it, and the
  export adds it.
- Priority is one of **Urgent**, **High**, **Medium** or **Low**. **No
  priority** is left out; any other value is reported.
- Estimate must be a number; anything else is reported.
- Cycle is the Cycle Name, or `Cycle <number>` when there is only a Cycle
  Number.
- A canceled issue gets its Canceled date as the end date and a custom field
  Canceled set to true.
- Archived holds a date; any value makes the card archived. The date itself is
  not kept.
- Linear does not document its date format. It writes ISO 8601, and a day
  alone is read as that day in UTC.
- An issue without a status goes to the list **No status**. The board is named
  **Imported Linear issues**.
- Every column that has no WeKan place is reported once, by name: the columns
  read are ID, Team, Title, Description, Status, Estimate, Priority, Project ID,
  Project, Creator, Assignee, Labels, Cycle Number, Cycle Name, Created,
  Started, Completed, Canceled, Archived, Due Date and Parent issue. Project ID
  is accepted but not kept.

The export writes the 29 columns `ID, Team, Title, Description, Status,
Estimate, Priority, Project ID, Project, Creator, Assignee, Labels, Cycle
Number, Cycle Name, Cycle Start, Cycle End, Created, Updated, Started, Triaged,
Completed, Canceled, Archived, Due Date, Parent issue, Initiatives, Project
Milestone ID, Project Milestone, SLA Status`. The ones WeKan has no value for
are empty. In the others:

- ID is the WeKan card id, and Parent issue the parent card's id;
- Team is the swimlane, empty for **Default**;
- Status is the list;
- Priority, Estimate, Project and Cycle Name come from custom fields of those
  names; Priority is **No priority** without one;
- the end date is Completed, or Canceled when the card's Canceled custom field
  is true;
- Due Date is a day (`2026-10-08`); the other dates are ISO 8601;
- a `,` inside a label becomes a space, and labels are joined by `, `.

## What is kept

| Linear | WeKan |
| --- | --- |
| Status | List |
| Team | Swimlane |
| Title | Card title |
| Description | Description |
| ID | The card's source reference |
| Parent issue | Parent card (when it is in the same import) |
| Assignee | Card member, when mapped (see below) |
| Creator | Requested by |
| Labels | Labels |
| Created | Creation date |
| Started | Start date |
| Completed, else Canceled | End date |
| Due Date | Due date |
| Archived | Archived card |
| Priority, Estimate, Project, Cycle | Custom fields of those names |
| Canceled | Custom field Canceled (true) |

The assignee becomes a card member only when that name is mapped to a WeKan
user, through the REST API's `membersMapping`. The import page maps no one, so
there it is not kept.

## What is not kept

The import reports these on the loss report, rather than dropping them
silently:

- every column without a WeKan place, once by name: for example Updated,
  Triaged, Cycle Start, Cycle End, Initiatives, Project Milestone ID, Project
  Milestone and SLA Status;
- a priority that is not Urgent, High, Medium, Low or No priority;
- an estimate that is not a number;
- a date that is not ISO 8601;
- a row without a title;
- a parent issue that is not in the same import, an ID used twice, and a
  parent link that would form a cycle.

The export leaves out checklists, comments, attachments, archived cards,
assignees other than the owner, and every column WeKan has no value for (see
above).

## REST API

```bash
python3 api.py importboardfrom linear issues.csv
python3 api.py importboardsfrom linear issues1.csv issues2.csv
python3 api.py exportboardformat BOARDID linear issues.csv
python3 api.py exportallboards linear boards.zip
```

The HTTP routes:

- `POST /api/boards/import/linear`: the body is `{"board": "<CSV text>"}`.
- `GET /api/boards/:boardId/export/linear?authToken=…`
- `GET /api/export-all-boards/linear?authToken=…`, with
  `&boardIds=ID1,ID2` for selected boards only.

## How it is built and tested

- `models/lib/linearCsvFormat.js` reads and writes the CSV, with the CSV
  reader of `models/lib/todoistCsvFormat.js`. `models/lib/externalParsers.js`
  lists it in `EXTERNAL_PARSERS`, and `models/kanboardCreator.js` creates the
  board.
- `models/lib/externalExportFormatters.js` and
  `models/lib/externalExporters.js` collect the board and write the export.
- `tests/linearCsv.test.cjs` is the unit test, and
  `tests/externalExportRoundTrip.test.cjs` runs the export back through the
  import.
- The Playwright case is in
  `tests/playwright/specs/import-export-format-audit.e2e.js`: *Linear: a CSV
  export imports with its statuses, team, labels, priority and parent issue*,
  and *every external export menu link returns text and refuses an unrelated
  user*.

## Sources

- [Exporting data](https://linear.app/docs/exporting-data): the export steps,
  limits and columns
- [LinearCsvImporter.ts](https://github.com/linear/linear/blob/master/packages/import/src/importers/linearCsv/LinearCsvImporter.ts):
  how Linear's own importer reads the values
- [Import issues](https://linear.app/docs/import-issues): Linear's import
  assistants and CLI importer

See also the [format coverage](../Format-Coverage.md) and
[all formats](../External-Tools.md).
