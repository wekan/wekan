# Pivotal Tracker

WeKan imports boards from Pivotal Tracker's stories CSV file and exports
boards in the CSV layout Tracker's import read. Pivotal Tracker shut down on
2025-04-30; its CSV exports remain, and this is their way into WeKan. Each
story state becomes a list and stories become cards, with their type and
labels, owners, requester, dates, comments, tasks and blockers. Estimates
become Story points, and iterations become Scrum sprints.

## How to import

1. Find the stories CSV you exported from Tracker while it was running. In
   Tracker, it was made from the project's **MORE** tab with **Export CSV**,
   or by selecting stories and choosing **Bulk Actions → CSV**. Tracker can no
   longer make new exports.
2. Open the CSV file in a text editor and copy all of it.
3. In WeKan, go to **All Boards → New → Import → Pivotal Tracker**.
4. Under **Select what to include**, keep **Scrum settings** ticked to import
   the iterations as sprints and the estimates as the board's Scrum estimate.
   Untick it to leave them out.
5. Paste the text into the box and click **Import**. A **Map members** step
   follows with nobody to map: click **Done**. (**Import without mapping
   members (map later)** skips that step.)
6. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

## How to import many boards at once

1. On the import page, choose **Pivotal Tracker**, then under **Import many
   boards** choose several CSV files, or one `.zip` that holds them. Each file
   becomes its own board, imported without member mapping. Members can be
   mapped later.
2. Pivotal Tracker is imported through the generalized importer, so there is
   also a checkbox **One board per project**: each swimlane the import would
   create becomes its own board, named after that swimlane. A Pivotal Tracker
   import puts every card in the swimlane **Default** (one file is one
   project), so for Pivotal Tracker this option makes no difference.

Links (parent cards, dependencies) between cards that end up on different
boards are reported in the loss report rather than kept.

From a script:

```bash
python3 api.py importboardsfrom pivotal FILE_OR_DIR ...
```

The arguments are files, directories of files, or `.zip` files.

## How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Under **Select what to include**, choose what to export, then click
   **Pivotal Tracker**. This downloads `<board>.csv`. The Pivotal Tracker
   export is for a whole board; it is not offered for one swimlane or one
   list.
3. Pivotal Tracker no longer runs, so there is nothing to import the file
   into. The file has the columns Tracker's CSV import read, and WeKan imports
   it back. See the archived
   [CSV import and export](https://web.archive.org/web/2024/https://www.pivotaltracker.com/help/articles/csv_import_export/)
   help page for how Tracker read it.

## How to export all boards at once

In **All Boards**, open the sidebar and choose **Export all boards**, then
**Pivotal Tracker**. This downloads one `.zip` with one `.csv` file per board
you can export: boards you are a member of, that are not archived and not
templates.

To export only some boards, use **Multi-Selection** in the All Boards sidebar,
select the boards, then click **Export**.

From a script:

```bash
python3 api.py exportallboards pivotal boards.zip
```

## Format details

What WeKan reads is the stories CSV of
[Pivotal Tracker](https://web.archive.org/web/2024/https://www.pivotaltracker.com/help/articles/csv_import_export/)
(shut down on 2025-04-30):
`Id,Title,Labels,Iteration,Iteration Start,Iteration End,Type,Estimate,Priority,Current State,Created at,Accepted at,Deadline,Requested By,Description,URL,Owned By...`,
then the repeated Blocker/Blocker Status, Comment, Task/Task Status, Pull
Request and Git Branch columns. Columns are matched by name, and repeated ones
are collected in order. Exports from before about 2018 have no Priority.

What the import covers:

- Current State as lists, in Tracker's workflow order (unscheduled, unstarted,
  planned, started, finished, delivered, accepted, rejected);
- Type and Labels as labels;
- Id as the source reference;
- Owned By as owner and assignees;
- Requested By as Requested by;
- Created at / Accepted at / Deadline as the created / end / due dates;
- Estimate as the number field **Story points** and the board's Scrum
  estimate;
- Priority as a custom field;
- Iteration, with its dates, as a Scrum sprint;
- comments, with the author and date of their `(Author - Mon D, YYYY)` tail;
- Task pairs as a **Tasks** checklist with done items;
- an unresolved `#id` blocker on a story of the same import as an
  is-blocked-by dependency.

Reported: Pull Request, Git Branch, other blockers, finished iterations (only
accepted stories) and the missing state of the others, and unknown states,
types, priorities and dates. The story URL is not kept.

The export writes the columns Tracker's import reads, without Id, Iteration
and URL:

- a list named after a state is that state (else accepted with an end date,
  unstarted without);
- the first type label is the Type;
- the due date is the Deadline of a release only;
- up to five owners.

From the current code (`models/lib/pivotalCsvFormat.js`):

- The file needs the Title and Current State columns. Header names are matched
  in any case.
- An empty state is **unscheduled**, Tracker's icebox. An unknown state is
  reported and the story goes to **Unstarted**. Lists are named after the
  states (Unscheduled, Unstarted, …) and only states that occur get a list.
- An empty Type is **feature**. An unknown type is reported and imported as
  feature. The type is the card's first label.
- Estimate `-1` means unestimated and is left out.
- Priority must look like `p0 - Critical` to `p3 - …`; `none` is left out.
- Dates are read as `Nov 22, 2014` (the export) or `11/22/2014` (Tracker's
  help page), as that day in UTC.
- A comment is `text (Author - Mon D, YYYY)`. Without that tail, the whole
  text is kept, without an author or date, and this is reported.
- The nth Task goes with the nth Task Status; `completed` is done. The same
  holds for Blocker and Blocker Status: a blocker that is not `resolved` and
  names exactly one `#id` becomes a dependency.
- Tracker writes `'` before a field starting with `=`, so a spreadsheet does
  not run it. The import removes it, and the export adds it.
- The board is named **Imported Pivotal Tracker**.

### Scrum: iterations and estimates

These come from `models/lib/externalScrumPlanning.js` and are imported only
when **Scrum settings** is ticked on the import page. They are written through
the same journaled Scrum import stage as Jira and WeKan JSON, so an
interrupted import is recovered like theirs
([Scrum import recovery](../Scrum-Import-Recovery.md)).

- Each Iteration number becomes one sprint, **Iteration N**, with Iteration
  Start and Iteration End as its dates. Each story in it is put in that
  sprint.
- The export has no iteration state. Tracker moves a story that is not
  accepted on to the next iteration, so an iteration whose stories are all
  accepted is a finished one. It is reported and not imported, because the
  export has no commitment or close snapshot; its stories stay in the
  backlog.
- Any other iteration is imported as **planned**, and that its state is
  missing is reported.
- When at least one story has an estimate, the board's Scrum estimate is the
  number field **Story points**, in points.

The export does not write sprints: Tracker's import ignored the Iteration
columns.

The export writes these columns: `Title, Labels, Type, Estimate, Priority,
Current State, Created at, Accepted at, Deadline, Requested By, Description`,
then **Owned By** as often as the busiest card needs (at most five), then
**Comment** columns, then **Task** / **Task Status** pairs:

- Estimate is the custom field Story points, or Estimate;
- Priority is the custom field Priority when it looks like `p0 - …`;
- Accepted at is the end date of an accepted story;
- Requested By is Requested by, or the card's creator;
- a comment is written as `text (Author - Mon D, YYYY)` when it has both;
- dates are written as `Mon D, YYYY`.

## What is kept

| Pivotal Tracker | WeKan |
| --- | --- |
| Current State | List |
| Title | Card title |
| Description | Description |
| Id | The card's source reference |
| Type | Label (feature, bug, chore, epic or release) |
| Labels (`a, b`) | Labels |
| Owned By (repeated) | Card members, when mapped (see below) |
| Requested By | Requested by |
| Created at | Creation date |
| Accepted at | End date |
| Deadline | Due date |
| Estimate | Number custom field Story points, and the board's Scrum estimate |
| Priority | Custom field Priority |
| Iteration, Iteration Start, Iteration End | Scrum sprint **Iteration N**, planned |
| Comment (repeated) | Comments, with author and date |
| Task + Task Status | Checklist **Tasks**, completed items done |
| Blocker `#id`, not resolved | Is-blocked-by dependency |

Owners become card members only when those names are mapped to WeKan users,
through the REST API's `membersMapping`. The import page maps no one, so
there they are not kept. A comment whose author is not mapped is posted by
the importing user, with the author's name in front of the text.

## What is not kept

The import reports these on the loss report, rather than dropping them
silently:

- Pull Request and Git Branch values;
- a resolved blocker, and a blocker that names no single story (`#id`);
- a blocker on a story that is not in the same import;
- an iteration whose stories are all accepted (finished), and the missing
  state of every other iteration;
- an unknown state, type or priority, and an estimate that is not a number;
- a date that is not `Mon D, YYYY` or `MM/DD/YYYY`;
- a comment without the `(Author - date)` tail (imported without author and
  date);
- a column Tracker does not write;
- a story without a title.

The URL column is read but not kept: it is the Id on a site that no longer
exists.

The export leaves out Id, Iteration, Iteration Start, Iteration End and URL,
more than five owners, a due date on any type but release, the end date of a
story that is not accepted, attachments, blockers, swimlanes, archived cards,
and custom fields other than Story points (or Estimate) and Priority.

## REST API

```bash
python3 api.py importboardfrom pivotal stories.csv
python3 api.py importboardsfrom pivotal stories1.csv stories2.csv
python3 api.py exportboardformat BOARDID pivotal stories.csv
python3 api.py exportallboards pivotal boards.zip
```

The HTTP routes:

- `POST /api/boards/import/pivotal`: the body is `{"board": "<CSV text>"}`.
- `GET /api/boards/:boardId/export/pivotal?authToken=…`
- `GET /api/export-all-boards/pivotal?authToken=…`, with
  `&boardIds=ID1,ID2` for selected boards only.

## How it is built and tested

- `models/lib/pivotalCsvFormat.js` reads and writes the CSV, with the CSV
  reader of `models/lib/todoistCsvFormat.js`.
  `models/lib/externalScrumPlanning.js` turns the iterations and estimates
  into Scrum planning, and `server/lib/scrumTransferImport.js` writes it.
  `models/lib/externalParsers.js` lists the parser in `EXTERNAL_PARSERS`, and
  `models/kanboardCreator.js` creates the board.
- `models/lib/externalExportFormatters.js` and
  `models/lib/externalExporters.js` collect the board and write the export.
- `tests/pivotalCsv.test.cjs` and `tests/externalScrumPlanning.test.cjs` are
  the unit tests, and `tests/externalExportRoundTrip.test.cjs` runs the export
  back through the import.
- The Playwright case is in
  `tests/playwright/specs/import-export-format-audit.e2e.js`: *Pivotal
  Tracker: a stories CSV imports with its states, labels, comments and
  tasks*, and *every external export menu link returns text and refuses an
  unrelated user*.

## Sources

- [CSV import and export](https://web.archive.org/web/2024/https://www.pivotaltracker.com/help/articles/csv_import_export/)
  (archived): the columns of the stories CSV, how Tracker exported and
  imported it, and its date form

See also the [format coverage](../Format-Coverage.md),
[Scrum import recovery](../Scrum-Import-Recovery.md) and
[all formats](../External-Tools.md).
