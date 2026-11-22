# KanbanFlow

## What it is

WeKan imports a board from [KanbanFlow](https://kanbanflow.com) through
KanbanFlow's API. KanbanFlow has no board export
file, so WeKan fetches the board with the board's API token. Columns become
lists, swimlanes stay swimlanes, and tasks keep their description, color,
labels, due date, subtasks, time spent, estimate, people and comments.

## Read more

- [Wikipedia: kanban boards](https://en.wikipedia.org/wiki/Kanban_board)
- KanbanFlow API: the board, tasks, users and
  comments endpoints, Basic auth with `apiToken`, and paging with
  `tasksLimited`/`nextTaskId`
- [KanbanFlow](https://kanbanflow.com): the app; the API token is under the
  board's **Settings → API & Webhooks**

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. In KanbanFlow, open the board, then the board menu → **Settings → API &
   Webhooks**, and create (or copy) an **API token**. A token belongs to that
   one board.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → KanbanFlow**.
3. Paste the token, then click **List**. The board the token belongs to is
   listed.
4. Choose it and click **Fetch**. WeKan reads the board, its tasks, its users
   and every task's comments.
5. Continue as with any import: map the KanbanFlow people to WeKan members,
   then **Import**.
6. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

The token is used for that fetch only. It is not stored: the field is cleared
once sent, and WeKan does not keep it on the board, the user or the server.
Requests go to `https://kanbanflow.com` only, with the token in the HTTP Basic
`Authorization` header, never in a URL.

### How to import many boards at once

A KanbanFlow API token belongs to one board, so each board is fetched with its
own token: repeat **How to import** once per board.

The fetched board can also be posted through the REST API (below) from a
script, one board per request.

KanbanFlow is imported through the generalized importer
(`models/kanboardCreator.js`), so the page also has a checkbox **One board per
project**: each KanbanFlow swimlane then becomes its own WeKan board, named
after that swimlane.

### How to export

WeKan has no KanbanFlow export. KanbanFlow has no board file to import, and
its API token belongs to a board that already exists, so there is nothing for
WeKan to write. To take a WeKan board elsewhere, use one of the other export
formats (**Board Settings → Export**), such as CSV or Trello JSON, if the
target reads it.

### How to export all boards at once

There is no KanbanFlow export, so there is none for all boards either. **All
Boards → Export all boards → CSV** writes a CSV file per board.

### REST API

```bash
python3 api.py importboardfrom kanbanflow board.json   # POST /api/boards/import/kanbanflow
```

The HTTP route:

- `POST /api/boards/import/kanbanflow` with the fetched JSON (the
  `{ kanbanflow: true, board, tasks, users, comments }` document) as `board`.

The REST API does not take a KanbanFlow token: fetch the board first (the
import page, or the KanbanFlow API itself) and post what was fetched.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- At most 20,000 tasks. More stops the import with an error.
  (`MAX_KANBANFLOW_FETCH_TASKS` in
  [models/lib/apiImport/kanbanflow.js](../../../../../../models/lib/apiImport/kanbanflow.js#L16))
- Comments are one request per task, for the first 5,000 tasks only.
  (`MAX_KANBANFLOW_COMMENT_TASKS` in
  [models/lib/apiImport/kanbanflow.js](../../../../../../models/lib/apiImport/kanbanflow.js#L17))
- Tasks are fetched 100 per request. (`PAGE_SIZE` in
  [models/lib/apiImport/kanbanflow.js](../../../../../../models/lib/apiImport/kanbanflow.js#L18))
- Comments are fetched with 4 requests at a time. (`COMMENT_CONCURRENCY` in
  [models/lib/apiImport/kanbanflow.js](../../../../../../models/lib/apiImport/kanbanflow.js#L20))
- At most 20,000 tasks. More stops the import with an error.
  (`MAX_KANBANFLOW_TASKS` in
  [models/lib/kanbanflowApiFormat.js](../../../../../../models/lib/kanbanflowApiFormat.js#L34))

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
- **Reading from the service's API**: each request may take 30 seconds and
  answer at most 32 MB, with no redirects followed
  ([server/lib/apiImportRequest.js](../../../../../../server/lib/apiImportRequest.js));
  each text field read is cut to 4,096 characters
  ([models/lib/apiImportServices.js](../../../../../../models/lib/apiImportServices.js)).

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

This format's own code:
[models/lib/apiImport/kanbanflow.js](../../../../../../models/lib/apiImport/kanbanflow.js),
[models/lib/kanbanflowApiFormat.js](../../../../../../models/lib/kanbanflowApiFormat.js),
[releases/live-tests/kanbanflow-import.mjs](../../../../../../releases/live-tests/kanbanflow-import.mjs).

The tests that pin it:
[tests/kanbanflowApiImport.test.cjs](../../../../../../tests/kanbanflowApiImport.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

What is read is the KanbanFlow API's own JSON
(API documentation), which
`models/lib/apiImport/kanbanflow.js` fetches and puts together:

- `GET /api/v1/board`: `_id`, `name`, `columns: [{ uniqueId, name }]`,
  `swimlanes: [{ uniqueId, name }]` (when the board has them) and
  `colors: [{ name, value, description }]`;
- `GET /api/v1/tasks`: the tasks, per column (and swimlane). A column with
  more tasks than one answer holds has `tasksLimited: true` and a
  `nextTaskId`, and is read on with `columnId`, `swimlaneId` and
  `startTaskId`;
- `GET /api/v1/users`: `_id`, `fullName`, `email`;
- `GET /api/v1/tasks/{taskId}/comments`: `text`, `authorUserId`,
  `createdTimestamp`.

The fetched document is
`{ kanbanflow: true, board, tasks, users, comments: { taskId: [...] } }`, and
`models/lib/kanbanflowApiFormat.js` reads it. A task carries `_id`, `name`,
`description`, `color`, `columnId`, `swimlaneId`, `totalSecondsSpent`,
`totalSecondsEstimate`, `responsibleUserId`, `dates`, `subTasks`, `labels` and
`collaborators`.

What the current code does:

- Columns and swimlanes keep their order; a repeated name gets ` (2)`. A board
  without swimlanes puts every task in the swimlane **Default**.
- KanbanFlow's ten task colors become WeKan's yellow, white, red, green, blue,
  purple, orange, sky (cyan), saddlebrown (brown) and magenta.
- A color the board describes (the board's color legend, e.g. red = "Bug")
  also becomes a label with that name and color, because that is what the
  color means on that board.
- `labels` become labels without a color (KanbanFlow labels have none).
- The first `dueDate` is the due date; its `status: 'done'` marks it done.
- `totalSecondsSpent` becomes the card's spent time in hours.
- `totalSecondsEstimate` becomes the number custom field **Estimate
  (hours)**: WeKan has no estimate on a card, and a label per estimate value
  would fill the board's label list.
- `responsibleUserId` is the owner and `collaborators` are further
  assignees, both by the user's full name (or e-mail without one), mapped to
  WeKan members on the members step.
- `subTasks` become a checklist **Subtasks**, `finished` = done, a subtask's
  `dueDate` the item's due date and its `userId` the item's assignee (when
  mapped).
- Comments keep their author and date.
- The task id is the source reference.
- Limits: 20,000 tasks; comments are fetched for the first 5,000 tasks
  (reported when there are more).

### What is kept

| KanbanFlow | WeKan |
| --- | --- |
| Board `name` | Board title |
| `columns` | Lists, in order |
| `swimlanes` | Swimlanes, in order |
| Task `name` | Card title |
| `description` | Card description |
| `color` | Card color |
| Board color legend (`colors[].description`) | A label of that color |
| `labels` | Labels |
| `dates` (`dueDate`, `status`) | Due date, marked done |
| `totalSecondsSpent` | Spent time (hours) |
| `totalSecondsEstimate` | Custom field "Estimate (hours)" |
| `responsibleUserId` | Card member (owner) |
| `collaborators` | Card members |
| `subTasks` (`name`, `finished`, `dueDate`, `userId`) | Checklist "Subtasks", with each item's due date and assignee |
| Comments | Comments, with author and date |

### What is not kept

The import reports these on the loss report:

- the column a due date is tied to (`targetColumnId`): WeKan keeps the date;
- every due date after the first;
- a subtask due date that is not a date;
- a color that is not one of KanbanFlow's ten;
- a due date that is not a date;
- a task in a column the board does not have, and tasks that are not objects;
- a second column or swimlane with the same name (imported as `<name> (2)`);
- comments of tasks beyond the first 5,000.

Not read at all: attachments, time entries (only their total is kept),
recurring task settings, the task number, WIP limits and the board's
webhooks.

### How it is built and tested

- `models/lib/apiImportServices.js` declares the service (`kanbanflow`, one
  secret field `token`). `models/lib/apiImport/kanbanflow.js` is the client:
  `list` and `fetch`, plain Node, with the request the server passes through
  its SSRF guard. `models/lib/kanbanflowApiFormat.js` reads the fetched JSON
  into the normalized board, and `models/kanboardCreator.js` creates it, with
  label and card colors from `models/lib/importedTaskPlan.js`.
- `tests/kanbanflowApiImport.test.cjs` is the unit test: the client against a
  fake KanbanFlow (the exact Basic auth header, paging a `tasksLimited`
  column, comments, an error status passed on, the token never in a URL) and
  the parser for every field, with wrong shapes refused.
- `releases/live-tests/kanbanflow-import.mjs` is the live test against
  kanbanflow.com, run from **build.sh → Tests → Live tests** or directly with
  `WEKAN_LIVE_KANBANFLOW_TOKEN=... node releases/live-tests/kanbanflow-import.mjs`.
  It only reads: it lists and fetches the token's board, parses it and checks
  the columns, and checks that a wrong token is refused. Without the variable
  it is skipped.

## Commits

 - [Imported subtasks keep their due date and person: a checklist item has both](https://github.com/wekan/wekan/commit/cf6f67e789ac404866d4b51591820570850baaa3)
 - [Import: Planka, Microsoft To Do, KanbanFlow, Basecamp, Google Tasks and Google Keep from their APIs](https://github.com/wekan/wekan/commit/46e30f01e48f2676a47c0052007f5c4ea951a923)
