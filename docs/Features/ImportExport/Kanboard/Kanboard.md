# Kanboard

WeKan imports boards from [Kanboard](https://kanboard.org/) and exports a board
in the same Kanboard JSON shape, so a board round-trips through it.

Kanboard has no single-file export of a project. The import reads an object that
is assembled from Kanboard's JSON-RPC API, or written by hand:
`{ board, columns, swimlanes, categories, tasks }`. Columns become lists,
swimlanes stay swimlanes and tasks become cards.

## How to import

1. In Kanboard, find the API token on the settings page. The API is at
   `https://YOUR_SERVER/jsonrpc.php`, with the user name `jsonrpc` and that
   token ([authentication](https://docs.kanboard.org/v1/api/authentication/)).
2. Save the project as one JSON object. Use the results of the
   [JSON-RPC procedures](https://docs.kanboard.org/v1/api/) for the project's
   columns, swimlanes, categories and tasks (for example `getAllTasks`), and
   put each task's subtasks, comments, tags and links (`getAllSubtasks`,
   `getAllComments`, `getTaskTags`, `getAllTaskLinks`) on the task as
   `subtasks`, `comments`, `tags` and `links`. Keep each task's `id`: links
   name the other task by it. See the shape below.
3. In WeKan, go to **All Boards → New → Import → Kanboard**.
4. Paste the JSON into the text box. Tick the parts to import.
5. Click **Import**. WeKan then asks you to map the task owners to WeKan users.
   Map them and click **Done**, or click **Import without mapping members (map
   later)**.
6. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

The accepted shape, with only `tasks` required:

```json
{
  "board":     { "name": "My Project" },
  "columns":   [ { "title": "Backlog" }, { "title": "Work", "task_limit": 3 }, { "title": "Done" } ],
  "swimlanes": [ { "name": "Default" } ],
  "tasks": [
    {
      "id": 1,
      "title": "Write report",
      "description": "...",
      "column_name": "Work",
      "swimlane_name": "Default",
      "date_due": "1718323200",
      "owner_username": "alice",
      "tags": ["urgent"],
      "links": [ { "id": 1, "task_id": 2, "label": "blocks" } ]
    },
    {
      "id": 2,
      "title": "Send report",
      "column_name": "Backlog",
      "links": [ { "id": 2, "task_id": 1, "label": "is blocked by" } ]
    }
  ]
}
```

If `columns` is left out, the column order comes from the tasks' `column_name`.
A task may name its column, swimlane and category by `column_id`,
`swimlane_id` and `category_id` instead; the ids are looked up in the
`columns`, `swimlanes` and `categories` arrays.

## How to import many boards at once

- On the import page, under **Import many boards**, choose several Kanboard JSON
  files, or one `.zip` that holds them. Each file becomes its own board,
  imported without member mapping. Members can be mapped later. Click **Import**
  to import them.
- Tick **One board per project** to make each swimlane the import would create
  its own board, named after that swimlane. For Kanboard these are the
  project's swimlanes: the `swimlanes` array, or the `swimlane_name` of the
  tasks. A parent card or a dependency between tasks that end up on different
  boards is not kept, and is listed in the loss report.
- From a script:
  `python3 api.py importboardsfrom kanboard FILE_OR_DIR ...` takes files,
  directories of files, or `.zip` files.

## How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Under **Select what to include:**, tick the parts to export.
3. Under **JSON**, choose **Kanboard**. The board downloads as a `.json` file.
4. Kanboard has no import for this JSON. Its CSV import is for tasks in its
   own CSV layout. To create the tasks in Kanboard, send them through its API,
   for example with [`createTask`](https://docs.kanboard.org/v1/api/task_procedures/),
   then the links with
   [`createTaskLink`](https://docs.kanboard.org/v1/api/internal_task_link_procedures/)
   (`task_id`, `opposite_task_id`, `link_id`), using the ids `createTask`
   returned in place of the file's task ids. Kanboard creates the opposite
   row itself, so create only one of the two rows of each link. The file is
   also what WeKan's own Kanboard import reads.

## How to export all boards at once

1. **All Boards → sidebar → Export all boards**, then choose **Kanboard**.
   This downloads one `.zip` with one Kanboard file per board you can
   export: boards you are a member of, that are not archived and are not
   templates. A board you may not export is left out and named in
   `skipped.txt` in the `.zip`.
2. To export only some boards, use **Multi-Selection** in the All Boards
   sidebar, select the boards, then **Export**.

From a script: `python3 api.py exportallboards kanboard boards.zip`.

## Format details

From the [format coverage](../Format-Coverage.md) audit:

- **Current authoritative shape:** Kanboard's
  [JSON-RPC API](https://docs.kanboard.org/v1/api/) and current project
  export.
- **Required import coverage:** project, columns, swimlanes, tasks,
  order/color/category, assignee/creator, dates/time estimates, subtasks,
  links, comments, tags, metadata and files.
- Kanboard is one of the external adapters that map the listed fields that have
  a WeKan equivalent: comments are posted by the mapped user, otherwise by the
  importer with the source author's name leading the text; subtasks become a
  checklist; task links become parent cards and dependencies; start, end and
  creation dates, archive state, colors and source order are kept. Creation
  dates survive the schema's `createdAt` autoValue through
  `writeImportedEntity`. What has no equivalent is listed in the loss report:
  file contents (the JSON carries attachment metadata only), time estimates,
  external links, and task links WeKan cannot keep (see below).

What the current code does (`parseKanboard` in
`models/lib/externalParsers.js`, `models/kanboardCreator.js`):

- Each task's subtasks become one checklist named **Subtasks**. A subtask with
  status `2` is a finished item.
- A task's category and its priority (as `priority:N`, when above 0) are added
  to its tags.
- A column's `task_limit` above 0 becomes the list's WIP limit.
- Dates may be Unix seconds (as Kanboard sends them) or ISO 8601. `"0"` means
  no date.
- `is_active` `0` makes the card archived.
- `color_id` is mapped to a WeKan card color (for example `grey` to gray,
  `dark_grey` to black, `teal` to paleturquoise).
- A task `url` is added at the end of the description as `Source: <url>`.
- Task links become parent cards and dependencies between the imported cards.
  A link row is read as `getAllTaskLinks` returns it (`task_id` is the OTHER
  task, `label` the link type), as `getTaskLinkById` returns it (`task_id`
  this task, `opposite_task_id` the other, `link_id` the type), or grouped
  by label as `{ "blocks": [ { "task_id": 2 } ] }`. The other task is found by
  the tasks' `id`. Kanboard keeps every link twice, once from each task with
  the opposite label; the two rows become one parent link or one dependency.

  | Kanboard link (`link_id`) | WeKan |
  | --- | --- |
  | is a child of (6) | This card's parent is the other card |
  | is a parent of (7) | The other card's parent is this card |
  | blocks (2) / is blocked by (3) | Dependency **blocks** / **is blocked by** |
  | duplicates (4) / is duplicated by (5) | Dependency **duplicates** / **is duplicated by** |
  | fixes (10) / is fixed by (11) | Dependency **fixes** / **is fixed by** |
  | relates to (1) | Dependency **related to** |
  | targets milestone (8) / is a milestone of (9) | Dependency **related to**, and reported |

- Kanboard has no custom fields of its own, and the parser does not read task
  metadata (`getTaskMetadata`), so a Kanboard import creates no custom fields.
  The shared creator's typed custom fields (number, checkbox, text) apply only
  to sources that send custom field values.

## What is kept

| Kanboard | WeKan |
| --- | --- |
| `board.name` (or `name`) | Board title |
| Column (`title`, `task_limit`) | List, with its WIP limit |
| Swimlane | Swimlane |
| Task `title`, `description` | Card title, description |
| `column_name` / `column_id` | The card's list |
| `swimlane_name` / `swimlane_id` | The card's swimlane |
| `date_due`, `date_started`, `date_completed`, `date_creation` | Due, start, end and creation dates |
| `owner_username` (or `assignee_username`, `owner_id`, `owner_name`) | Card member, when mapped |
| `creator_username` (or `creator_name`) | Requested by |
| `tags`, category, `priority` | Board labels |
| `color_id` | Card color |
| `time_spent` | Spent time (hours) |
| `is_active` `0` | Archived card |
| `subtasks` (`title`, `status`) | Checklist **Subtasks** |
| `links` "is a child of" / "is a parent of" | The card's parent card |
| `links` blocks, duplicates, fixes, relates to, milestone | Card dependencies |
| `comments` (`comment`, `username`, `date_creation`) | Comments |
| Task order in the file | Card order |

The export writes `board.name`, the lists as `columns`, the swimlanes, and for
each card: an `id` (1, 2, 3 ... in card order), `title`, `description`,
`column_name`, `swimlane_name`, `date_due`, `date_started`, `date_completed`,
`date_creation`, `owner_username`, `creator_username`, the labels as `tags`,
every checklist item as a `subtasks` entry (status `2` when finished, `0`
otherwise), the comments, and the card's parent and dependencies as `links`
in the `getAllTaskLinks` shape (`{ "id", "task_id", "label" }`, `task_id`
being the other task). Like Kanboard, each link is written from both tasks,
the second time with the opposite label, and the import folds the two back
into one. The parent is written when **Subtasks** is selected, dependencies
when **Dependencies** is.

## What is not kept

The import reports these on the loss report:

- `time_estimated` (WeKan cards have no estimate field; map it to a custom
  field by hand);
- `files` (the API export carries metadata, not file contents);
- `external_links` (links to web pages and other systems are not imported);
- task links to a task that is not in the file;
- task links whose label is not one of Kanboard's built-in link types
  (a link type added in Kanboard's settings);
- a second "is a child of" link of one task (a WeKan card has one parent);
- a second link between the same two tasks, seen from the same task (a card
  keeps one dependency per other card);
- milestone links ("targets milestone", "is a milestone of"), which are kept
  as **related to**;
- duplicate task `id`s and parent links that would form a cycle, as for every
  source that goes through the shared importer.

Owners who are not mapped do not become card members. Tag colors are not
read: labels are created black.

The export leaves out archived cards, lists and swimlanes, the column WIP
limits, card colors, further assignees after the first, attachments and custom
fields. A parent or dependency pointing at a card that is not exported
(archived, or on another board) is left out. Several checklists are flattened
into one subtask list.

## REST API

```bash
python3 api.py importboardfrom kanboard board.json            # POST /api/boards/import/kanboard
python3 api.py importboardsfrom kanboard a.json b.json dir/   # one board per file
python3 api.py exportboardformat BOARDID kanboard board.json  # GET /api/boards/BOARDID/export/kanboard?authToken=TOKEN
python3 api.py exportallboards kanboard boards.zip            # GET /api/export-all-boards/kanboard?authToken=TOKEN
```

`GET /api/export-all-boards/kanboard?authToken=TOKEN&boardIds=ID1,ID2` exports
only the boards listed.

## How it is built and tested

- `models/lib/externalParsers.js` (`parseKanboard`) reads the file.
  `models/kanboardCreator.js` creates the board; it is the shared creator of
  every source that goes through `EXTERNAL_PARSERS`.
  `models/lib/importedTaskPlan.js` decides what each task becomes.
- `models/lib/externalExportFormatters.js` (`kanboard`) writes the export, from
  what `models/lib/externalExporters.js` collects.
- `client/components/import/kanboardMembersMapper.js` lists the owners to map.
- Unit tests: `tests/kanboardImport.test.cjs`,
  `tests/kanboardLinksGithubComments.test.cjs` (task links: every link type,
  the two rows of one link, missing and unknown links, export round trip),
  `tests/kanboardJiraCreator.import.test.cjs`,
  `tests/importedTaskPlan.test.cjs` and
  `tests/externalExportRoundTrip.test.cjs`. The fixture is
  `tests/fixtures/import-formats/kanboard.json`.
- Playwright: `tests/playwright/specs/import-export-format-audit.e2e.js`
  (importing the fixture through the page, refusing malformed JSON, and task
  links becoming a parent card and a dependency) and
  `tests/playwright/specs/external-export-extras.e2e.js` (the export carries
  comments and checklists, and the selection removes them).

## Sources

- [Kanboard API](https://docs.kanboard.org/v1/api/): the JSON-RPC procedures
  the import shape is built from
- [API authentication](https://docs.kanboard.org/v1/api/authentication/): the
  endpoint, user name and token
- [Task procedures](https://docs.kanboard.org/v1/api/task_procedures/):
  `getAllTasks` and `createTask`
- [Internal task link procedures](https://docs.kanboard.org/v1/api/internal_task_link_procedures/):
  `createTaskLink`, `getTaskLinkById` and `getAllTaskLinks`
- Kanboard's source: the built-in link types in `app/Schema/Sql/mysql.sql`
  (the `links` table), and
  [`app/Model/TaskLinkModel.php`](https://github.com/kanboard/kanboard/blob/main/app/Model/TaskLinkModel.php),
  which stores each link from both tasks and lists the other task as
  `task_id`

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md),
[CSV/TSV import](../CSV/CSV.md), [Excel import](../Excel/Excel-and-VBA.md),
[Trello](../Trello/Trello.md), [Jira](../Jira/Jira.md).
