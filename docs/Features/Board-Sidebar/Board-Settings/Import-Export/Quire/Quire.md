# Quire

WeKan imports boards from [Quire](https://quire.io) and exports boards to it as
a Quire project CSV. The import reads both the columns Quire's Import CSV takes
and the longer file Quire's own Export CSV writes. Statuses become lists, tasks
become cards, and subtasks become child cards. The export writes the columns
Quire's Import CSV reads, so the file can be imported back into Quire.

## How to import

1. In Quire, open the project, click the dropdown menu icon next to the project
   name and choose **Export CSV**, then download the file.
2. In WeKan, go to **All Boards → New → Import → Quire**.
3. Choose the CSV file under **Choose the export file, or paste its text below:**, or paste its text
   into the text box.
4. Click **Import**, or **Import without mapping members (map later)**.
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

The import page says: *In Quire, open the project menu and choose Export CSV,
then paste the CSV.* A CSV filled in by hand in the layout of Quire's
[sample file](https://gist.github.com/jimmyshiau/40cb35dce4a7bf663abc4c53d2fb9941)
imports the same way.

## How to import many boards at once

1. On the import page, under **Import many boards**, choose several Quire CSV
   files, or one `.zip` that holds them. Each file becomes its own board,
   imported without member mapping (members can be mapped later).
2. Quire is imported through the generalized importer, so there is also a
   checkbox **One board per project**: each swimlane the import would create
   becomes its own board, named after that swimlane. A Quire import always puts
   every card in one swimlane, **Default**, so for Quire this option makes no
   difference. Links between cards that end up on different boards (parent
   cards) are reported in the loss report rather than kept.

From a script, with files, directories of files, or `.zip` files:

```bash
python3 api.py importboardsfrom quire FILE_OR_DIR ...
```

## How to export

1. In WeKan, open the board and go to **Board Settings → Export**.
2. Choose what to include (dates, people, subtasks, and so on), then choose
   **Quire**. WeKan downloads the board as a `.csv` file.
3. In Quire, open the project to import into (or create one), choose **Import
   CSV**, upload the file, check the preview and click **Paste**. Quire's guide
   does not say in which menu **Import CSV** is; see
   [Quire's Import CSV guide](https://quire.io/guide/import-quire-csv/).

Quire appends imported tasks to the end of the project. It cannot invite new
assignees or create new tags during a CSV import: only existing users (by ID or
email address) and the project's existing tags are recognized. Create the tags
in the Quire project first.

## How to export all boards at once

1. Go to **All Boards → sidebar → Export all boards** and choose **Quire**.
   WeKan downloads one `.zip` with one CSV file per board you can export: boards
   you are a member of, that are not archived and are not templates.
2. To export only some boards, use **Multi-Selection** in the All Boards
   sidebar, select the boards, then click **Export**.

From a script:

```bash
python3 api.py exportallboards quire boards.zip
```

## Format details

### The file

A Quire project CSV. Columns are matched by header name, in any order.

- Quire's [Import CSV](https://quire.io/guide/import-quire-csv/) reads these
  columns: `Name, Assignee, Tag, Start, Due, Priority, Status, Description,
  Parent, ID`. Quire wants the first letter capitalized; WeKan matches the
  names in any case.
- Quire's [Export CSV](https://quire.io/guide/export-to-csv-json/) writes more,
  as the [sample file](https://gist.github.com/jimmyshiau/40cb35dce4a7bf663abc4c53d2fb9941)
  the guide links and the export-csv example of the
  [Quire API](https://quire.io/dev/api/) show them: `ID, Name, Status, Started,
  Completed, Priority, Start, Due, Duration, Estimate, Time log, Variation,
  Assignee, Tag, Successors, Created, Created by, Description`.
- A header with several values (Assignee, Tag) is repeated, one column per
  value. An export made with merge joins the values into one cell with `, `.
  Both are read.
- Dates are written `Jun 2, 2026`. WeKan also reads ISO 8601 days and times
  (`2026-06-02`) and `2 Jun 2026`. A day alone is read as that day at UTC
  midnight. Any other date is reported, not guessed.
- Priority is Low, Medium, High or Urgent (the API's -1, 0, 1 and 2). Medium is
  Quire's default.
- Status is the name of one of the project's statuses. A row without a Status
  goes to a list named **To-Do**.
- A text a spreadsheet could take for a formula (starting with `+`, `-`, `=` or
  `@`) is written after a `'`. The import removes that `'`.
- The file must have a **Name** column; a file without one, or an empty file,
  is refused.

### The hierarchy

The parent of a task is written in three ways, and all three are read:

- a **Parent** column naming the parent task's ID (the import layout). It wins
  over the other two;
- repeated **ID** columns, with the task's ID in the column of its depth (the
  sample file Quire's guide links). The parent is the nearest task above it
  one column to the left;
- one **ID** cell with the path from the root, such as `#6, #8` (the API's
  example). The last ID is the task, the one before it the parent.

IDs `6` and `#6` are the same task.

### What the export writes

The export writes Quire's import columns plus Completed, Created and Created by:

`ID, Parent, Name, Status, Completed, Priority, Start, Due, Assignee, Tag,
Created, Created by, Description`

- Cards are numbered `#1`, `#2`, ... in export order, and Parent names the
  parent card's number.
- Assignee and Tag are repeated as often as the card with the most people or
  labels needs, as Quire's own export does. A comma inside a name or label is
  written as a space.
- Status is the card's list. A card with no Priority custom field, or a value
  that is not one of Quire's four, is written as Medium.
- A card without a title is written as `Untitled`.
- The formula guard `'` is added, and fields are quoted as in RFC 4180.
- Quire ignores columns it does not import, so the extra columns do no harm.

## What is kept

| Quire | WeKan |
| --- | --- |
| Status | List, in the order statuses first appear |
| Name | Card title |
| Description | Card description |
| ID | The card's source reference |
| Parent, or the ID columns' depth, or the ID path | Parent card |
| Assignee (repeated or merged) | Owner, then further assignees, when mapped to WeKan users |
| Tag (repeated or merged) | Labels |
| Start, or Started when there is no Start | Start date |
| Due | Due date |
| Completed | End date |
| Created | Created date |
| Created by | Requested by |
| Priority Low, High or Urgent | The **Priority** custom field (Medium is left out) |

Assignee names become card members only when they are mapped to WeKan users.
The Quire import page does not ask for that mapping, so cards imported from the
page have no members.

## What is not kept

The loss report lists:

- the **Duration**, **Estimate**, **Time log**, **Variation** and
  **Successors** columns, and any other column WeKan does not read;
- a **Started** date beside a **Start** date (the Start date is kept);
- a priority that is not Low, Medium, High, Urgent or -1 to 2;
- a date that cannot be read;
- a row without a Name;
- a duplicate ID (links go to the first task with it), a Parent that is not in
  the file, and a parent link that would form a cycle.

Comments and attachments are not in Quire's CSV.

The export leaves out swimlanes, comments, checklists, attachments,
dependencies, card colors and custom fields other than Priority.

## REST API

```bash
python3 api.py importboardfrom quire project.csv
python3 api.py importboardsfrom quire FILES...
python3 api.py exportboardformat BOARDID quire board.csv
python3 api.py exportallboards quire boards.zip
```

The HTTP routes:

- `POST /api/boards/import/quire`
- `GET /api/boards/:boardId/export/quire?authToken=…`
- `GET /api/export-all-boards/quire?authToken=…`, with an optional
  `&boardIds=ID1,ID2` to export only those boards.

## How it is built and tested

- `models/lib/quireCsvFormat.js` reads the CSV (`parseQuireCsv`) and writes it
  (`formatQuireCsv`). It is registered as `quire` in
  `models/lib/externalParsers.js` and `models/lib/externalExportFormatters.js`.
  `models/kanboardCreator.js` creates the board from the parsed result.
- `tests/quireCsv.test.cjs` is the unit test: Quire's sample file, the API's
  ID path, the import layout with repeated or merged Assignee and Tag and
  numeric priorities, the reported losses, the export round trip, and the
  wiring into the import page and export menu.
- The Playwright cases are in
  `tests/playwright/specs/import-export-format-audit.e2e.js`:
  - *Quire: a project CSV imports with its statuses, subtask, tags, dates and
    priority* pastes a CSV with repeated ID columns into the import page and
    checks the lists, the child card, labels, dates and the Priority custom
    field;
  - *every external export menu link returns text and refuses an unrelated
    user* downloads the Quire export from the export menu and checks that
    another user is refused.

## Sources

- [Import CSV](https://quire.io/guide/import-quire-csv/): the columns Quire
  reads, the import steps, and what Quire cannot create during an import
- [Export to CSV or JSON](https://quire.io/guide/export-to-csv-json/): the
  export steps
- [Sample CSV file](https://gist.github.com/jimmyshiau/40cb35dce4a7bf663abc4c53d2fb9941):
  the repeated ID columns and the date format
- [Quire API](https://quire.io/dev/api/): the export-csv example, the ID path,
  merge, and the numeric priorities

See also the [format coverage table](../Format-Coverage.md) and
[all formats](../External-Tools.md).
