# KanbanFlow

WeKan imports a board from [KanbanFlow](https://kanbanflow.com) through
KanbanFlow's [API](https://kanbanflow.com/api). KanbanFlow has no board export
file, so WeKan fetches the board with the board's API token. Columns become
lists, swimlanes stay swimlanes, and tasks keep their description, color,
labels, due date, subtasks, time spent, estimate, people and comments.

## How to import

1. In KanbanFlow, open the board, then the board menu → **Settings → API &
   Webhooks**, and create (or copy) an **API token**. A token belongs to that
   one board.
2. In WeKan, go to **All Boards → New → Import → KanbanFlow**.
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

## How to import many boards at once

A KanbanFlow API token belongs to one board, so each board is fetched with its
own token: repeat **How to import** once per board.

The fetched board can also be posted through the REST API (below) from a
script, one board per request.

KanbanFlow is imported through the generalized importer
(`models/kanboardCreator.js`), so the page also has a checkbox **One board per
project**: each KanbanFlow swimlane then becomes its own WeKan board, named
after that swimlane.

## How to export

WeKan has no KanbanFlow export. KanbanFlow has no board file to import, and
its API token belongs to a board that already exists, so there is nothing for
WeKan to write. To take a WeKan board elsewhere, use one of the other export
formats (**Board Settings → Export**), such as CSV or Trello JSON, if the
target reads it.

## How to export all boards at once

There is no KanbanFlow export, so there is none for all boards either. **All
Boards → Export all boards → CSV** writes a CSV file per board.

## Format details

What is read is the KanbanFlow API's own JSON
([API documentation](https://kanbanflow.com/api)), which
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
- `subTasks` become a checklist **Subtasks**, `finished` = done.
- Comments keep their author and date.
- The task id is the source reference.
- Limits: 20,000 tasks; comments are fetched for the first 5,000 tasks
  (reported when there are more).

## What is kept

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
| `subTasks` (`name`, `finished`) | Checklist "Subtasks" |
| Comments | Comments, with author and date |

## What is not kept

The import reports these on the loss report:

- the column a due date is tied to (`targetColumnId`): WeKan keeps the date;
- every due date after the first;
- a subtask's own person and due date;
- a color that is not one of KanbanFlow's ten;
- a due date that is not a date;
- a task in a column the board does not have, and tasks that are not objects;
- a second column or swimlane with the same name (imported as `<name> (2)`);
- comments of tasks beyond the first 5,000.

Not read at all: attachments, time entries (only their total is kept),
recurring task settings, the task number, WIP limits and the board's
webhooks.

## REST API

```bash
python3 api.py importboardfrom kanbanflow board.json   # POST /api/boards/import/kanbanflow
```

The HTTP route:

- `POST /api/boards/import/kanbanflow` with the fetched JSON (the
  `{ kanbanflow: true, board, tasks, users, comments }` document) as `board`.

The REST API does not take a KanbanFlow token: fetch the board first (the
import page, or the KanbanFlow API itself) and post what was fetched.

## How it is built and tested

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

## Sources

- [KanbanFlow API](https://kanbanflow.com/api): the board, tasks, users and
  comments endpoints, Basic auth with `apiToken`, and paging with
  `tasksLimited`/`nextTaskId`
- [KanbanFlow](https://kanbanflow.com): the app; the API token is under the
  board's **Settings → API & Webhooks**

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).
