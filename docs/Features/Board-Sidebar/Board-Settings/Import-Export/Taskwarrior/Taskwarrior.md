# Taskwarrior

WeKan imports and exports a board as [Taskwarrior](https://taskwarrior.org)'s
JSON: what `task export` writes and `task import` reads. A task's status
decides its list, `project` and `priority` become labels, annotations become
comments, and `depends` becomes blocked-by dependencies. WeKan adds two
attributes of its own so list names and descriptions survive a round trip.

## How to import

1. Export the tasks from Taskwarrior into a file:

   ```bash
   task export > tasks.json
   ```

   `task export` takes a filter, for example `task project:Home export`. It
   writes a JSON array, or one task per line when `rc.json.array=off` is set
   (and in older versions); WeKan reads both.
2. In WeKan, go to **All Boards → New → Import → Taskwarrior**.
3. Open `tasks.json` in a text editor, copy all of it and paste it into the
   text box.
4. Click **Import**.
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

## How to import many boards at once

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

## How to export

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

## How to export all boards at once

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

## Format details

The format is the [Taskwarrior task format](https://taskwarrior.org/docs/design/task/)
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

## What is kept

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

## What is not kept

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

## REST API

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

## How it is built and tested

- `models/lib/taskwarriorFormat.js` reads and writes the JSON.
  `models/import.js` sends the text to the parser, and
  `models/kanboardCreator.js` creates the board and its dependencies.
- `tests/taskwarrior.test.cjs` is the unit test of the round trip.
  `tests/importLossReport.test.cjs` covers the loss report.
- The Playwright cases are in
  `tests/playwright/specs/import-export-format-audit.e2e.js`: "Taskwarrior:
  tasks import with their list, labels, dates, annotations and dependencies",
  and the export menu link for every format.

## Sources

- [Taskwarrior task format](https://taskwarrior.org/docs/design/task/): the
  attributes and their values
- [Taskwarrior: export](https://taskwarrior.org/docs/commands/export/): `task
  export`, its filter and `json.array`
- [Taskwarrior man page](https://github.com/GothenburgBitFactory/taskwarrior/blob/develop/doc/man/task.1.in):
  `task import [<file> ...]`, which adds or updates tasks by UUID

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).
