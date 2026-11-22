# Taskwarrior

## What it is

WeKan imports and exports a board as [Taskwarrior](https://taskwarrior.org)'s
JSON: what `task export` writes and `task import` reads. A task's status
decides its list, `project` and `priority` become labels, annotations become
comments, and `depends` becomes blocked-by dependencies. WeKan adds two
attributes of its own so list names and descriptions survive a round trip.

## Read more

- [Wikipedia: Taskwarrior, the command line task manager](https://en.wikipedia.org/wiki/Taskwarrior)
- [Taskwarrior task format](https://github.com/GothenburgBitFactory/taskwarrior/blob/develop/doc/devel/rfcs/task.md): the
  attributes and their values
- [Taskwarrior: export](https://taskwarrior.org/docs/commands/export/): `task
  export`, its filter and `json.array`
- [Taskwarrior man page](https://github.com/GothenburgBitFactory/taskwarrior/blob/develop/doc/man/task.1.in):
  `task import [<file> ...]`, which adds or updates tasks by UUID

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. Export the tasks from Taskwarrior into a file:

   ```bash
   task export > tasks.json
   ```

   `task export` takes a filter, for example `task project:Home export`. It
   writes a JSON array, or one task per line when `rc.json.array=off` is set
   (and in older versions); WeKan reads both.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → Taskwarrior**.
3. Open `tasks.json` in a text editor, copy all of it and paste it into the
   text box.
4. Click **Import**.
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

### How to import many boards at once

1. On the import page, choose **Taskwarrior**, then under **Import many
   boards** choose several `.json` files, or one `.zip` that holds them.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Taskwarrior is imported through the generalized importer
(`models/kanboardCreator.js` via `EXTERNAL_PARSERS` in
`models/lib/externalParsers.js`), so the page also has a checkbox **One board
per project**: each swimlane the import would create becomes its own board,
named after that swimlane. A Taskwarrior import puts every card in the
swimlane **Default** (a task's `project` becomes a label, not a swimlane), so
for Taskwarrior the option makes no difference.

Links between cards that end up on different boards are reported in the loss
report rather than kept. This applies to `depends`: a task that depends on a
task in another file is reported, because the other task is not part of the
same import.

From a script:

```bash
python3 api.py importboardsfrom taskwarrior FILE_OR_DIR ...
```

Each argument is a file, a directory of files, or a `.zip` file.

### How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Choose what to include, then under **JSON** choose **Taskwarrior**. The
   board downloads as `<board>.json`.
3. In Taskwarrior, import the file:

   ```bash
   task import board.json
   ```

   Taskwarrior identifies tasks by their UUID, so importing the same export
   again updates those tasks instead of adding new ones.

The Taskwarrior entry is offered for a whole board only, not for a swimlane or
a list.

### How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Taskwarrior**.
2. One `.zip` downloads, with one file per board you can export: boards you
   are a member of that are not archived and not templates.

To export only some boards, use **Multi-Selection** in the All Boards
sidebar, select the boards, then **Export**.

From a script:

```bash
python3 api.py exportallboards taskwarrior boards.zip
```

### REST API

```bash
python3 api.py importboardfrom taskwarrior tasks.json          # POST /api/boards/import/taskwarrior
python3 api.py importboardsfrom taskwarrior FILE_OR_DIR ...    # several boards
python3 api.py exportboardformat BOARDID taskwarrior tasks.json
python3 api.py exportallboards taskwarrior boards.zip
```

The HTTP routes:

- `POST /api/boards/import/taskwarrior` with the file's text as `board`;
- `GET /api/boards/:boardId/export/taskwarrior?authToken=…` returns the file
  as `application/json`;
- `GET /api/export-all-boards/taskwarrior?authToken=…` returns the `.zip`; add
  `&boardIds=ID1,ID2` for only those boards.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- At most 10,000 tasks. More stops the import with an error.
  (`MAX_TASKWARRIOR_TASKS` in
  [models/lib/taskwarriorFormat.js](../../../../../../models/lib/taskwarriorFormat.js#L39))

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
[models/lib/taskwarriorFormat.js](../../../../../../models/lib/taskwarriorFormat.js).

The tests that pin it:
[tests/importLossReport.test.cjs](../../../../../../tests/importLossReport.test.cjs),
[tests/playwright/specs/import-export-format-audit.e2e.js](../../../../../../tests/playwright/specs/import-export-format-audit.e2e.js),
[tests/taskwarrior.test.cjs](../../../../../../tests/taskwarrior.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

The format is the [Taskwarrior task format](https://github.com/GothenburgBitFactory/taskwarrior/blob/develop/doc/devel/rfcs/task.md)
that `task export` writes and `task import` reads: a JSON array, or one object
per line from older versions.

What the import must cover:

- the description, and the status: completed to **Done**, waiting to
  **Waiting**, started to **In Progress**;
- `project` and `priority` as labels, and tags;
- the entry, due, scheduled and end dates;
- annotations as comments, and `depends` as blocked-by dependencies by uuid;
- WeKan's `wekanlist` and `wekandescription` attributes keep lists and
  descriptions across a round trip;
- deleted tasks, recurring templates and unmapped attributes are reported;
- Taskwarrior has no members.

What the current code does (`models/lib/taskwarriorFormat.js`):

- The list is `wekanlist` when set. Otherwise: completed → **Done**, waiting
  → **Waiting**, pending with a `start` time → **In Progress**, other →
  **To Do**.
- `project` becomes the label `project:<name>`, and priority H, M or L the
  label `priority:H` (and so on). Tags become labels.
- Dates are read in Taskwarrior's own form (`20260901T120000Z`) or as ISO
  dates. The end date is kept only for a completed task.
- An annotation becomes a comment with the annotation's date.
- `uuid` is the id that `depends` refers to. A dependency becomes an
  "is blocked by" link to that card.
- `id`, `urgency`, `modified`, `mask`, `imask` and `start` are computed or
  bookkeeping attributes, and are not imported or reported.
- The board is called "Imported Taskwarrior".
- Limit: 10,000 tasks.
- Every card goes to the swimlane Default.

What the export writes (`formatTaskwarrior` in the same module), one task per
card, as a JSON array:

- `uuid`: a UUID made from the card's id, so the same card always gets the
  same uuid;
- `status`: `completed` when the list's name looks finished (contains
  "done", "closed", "complete", "archiv" or "finished"), otherwise `pending`;
- `description`: the card title;
- `entry` (creation date), `due`, `scheduled` (start date), and `end` (end
  date, for a completed task);
- `project` from a label `project:<name>`, `priority` from a label
  `priority:H`, `M` or `L`, and the other labels as `tags` (spaces become
  `_`);
- comments as `annotations`, written as `author: text`;
- `wekanlist` (the list) and `wekandescription` (the description).

Taskwarrior keeps attributes it does not know, such as `wekanlist`, as
orphaned UDAs, so they come back when the tasks are exported again. Archived
cards and archived lists are not exported.

### What is kept

| Taskwarrior | WeKan |
| --- | --- |
| `description` | Card title |
| `status` (with `start`) | List: Done, Waiting, In Progress or To Do |
| `wekanlist` | List |
| `wekandescription` | Card description |
| `project` | Label `project:<name>` |
| `priority` H / M / L | Label `priority:H` / `M` / `L` |
| `tags` | Labels |
| `entry` | Creation date |
| `due` | Due date |
| `scheduled` | Start date |
| `end` (completed task) | End date |
| `annotations` | Comments |
| `depends` (by `uuid`) | "Is blocked by" dependencies |

### What is not kept

The import reports these on the loss report:

- a deleted task (it is not imported);
- a recurring task's template (its instances are ordinary tasks, and are
  imported);
- every other attribute WeKan has no place for, such as `until`, `wait`,
  `recur` or user defined attributes;
- an `entry`, `due`, `scheduled` or `end` value that is not a date;
- an entry that is not a task object;
- a `depends` uuid that is not one of the imported tasks.

The Taskwarrior export does not write dependencies (`depends`), checklists,
members, custom fields, swimlanes or attachments, and every task that is not
completed is written as `pending`.

### How it is built and tested

- `models/lib/taskwarriorFormat.js` reads and writes the JSON.
  `models/import.js` sends the text to the parser, and
  `models/kanboardCreator.js` creates the board and its dependencies.
- `tests/taskwarrior.test.cjs` is the unit test of the round trip.
  `tests/importLossReport.test.cjs` covers the loss report.
- The Playwright cases are in
  `tests/playwright/specs/import-export-format-audit.e2e.js`: "Taskwarrior:
  tasks import with their list, labels, dates, annotations and dependencies",
  and the export menu link for every format.

## Commits

 - [Repeating tasks of other tools repeat in WeKan: daily, weekly and monthly as the card's recurrence](https://github.com/wekan/wekan/commit/24ac6b2bd2e55323fa1c6e52eb53ff3291fc80fb)
 - [Asana, OpenProject, Obsidian and Wrike exports carry what each card waits for](https://github.com/wekan/wekan/commit/c9da13b63e6f1fea86cb30b604093a8a120bcf53)
 - [Jira and Taskwarrior exports carry the card dependencies; the round trip of every export checks them](https://github.com/wekan/wekan/commit/d613a00030a7827d4d6318c50d6feb5d80d008ce)
 - [Ten more exports are written a page of cards at a time, their references read in a light first pass](https://github.com/wekan/wekan/commit/e2cbbe510457940b6db26c90b45307a6c539a0e7)
 - [Read every import source through one path and one file chooser, from one description of the sources](https://github.com/wekan/wekan/commit/c80a656901103bfd29b41843c7e255b4ed3bfa17)
 - [Import and export many boards at once for every format, and document each format in its own directory](https://github.com/wekan/wekan/commit/7858d84e127c2c6cd92134166352b9a4245d4ec2)
 - [Import and export boards as Taskwarrior JSON](https://github.com/wekan/wekan/commit/f0323140f6f5325c7b2abf4ffb938f456c5d54d7)
