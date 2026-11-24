# todo.txt

## What it is

WeKan imports and exports a board as a [todo.txt](https://github.com/todotxt/todo.txt)
file: one task per line, as the todo.txt command line tool and the many apps
that share the format write it. Completion, priority, creation and completion
dates, `+project` and `@context`, `due:` and `t:` are kept. WeKan adds a
`list:` key so list names survive a round trip.

## Read more

- [Wikipedia: to-do lists](https://en.wikipedia.org/wiki/Todo_list)
- [todo.txt format](https://github.com/todotxt/todo.txt): the format rules,
  `pri:` on completed tasks and `key:value` metadata such as `due:`
- [todo.txt-cli `todo.cfg`](https://github.com/todotxt/todo.txt-cli/blob/master/todo.cfg):
  where the command line tool keeps `todo.txt` and `done.txt`

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. Find the `todo.txt` file. The format is the file itself, so there is
   nothing to export. The todo.txt command line tool keeps it in the directory
   that `TODO_DIR` in its `todo.cfg` names, and completed tasks it has
   archived in `done.txt` beside it. Where another app keeps its file, see that
   app's documentation.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → todo.txt**.
3. Open the file in a text editor, copy all of it and paste it into the text
   box. To include archived tasks, paste the lines of `done.txt` too.
4. Click **Import**.
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

### How to import many boards at once

1. On the import page, choose **todo.txt**, then under **Import many boards**
   choose several `.txt` files, or one `.zip` that holds them.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

todo.txt is imported through the generalized importer
(`models/kanboardCreator.js` via `EXTERNAL_PARSERS` in
`models/lib/externalParsers.js`), so the page also has a checkbox **One board
per project**: each swimlane the import would create becomes its own board,
named after that swimlane. A todo.txt import puts every card in the swimlane
**Default** (a `+project` is a label, not a swimlane), so for todo.txt the
option makes no difference.

Links between cards that end up on different boards are reported in the loss
report rather than kept. todo.txt has no links between tasks.

From a script:

```bash
python3 api.py importboardsfrom todotxt FILE_OR_DIR ...
```

Each argument is a file, a directory of files, or a `.zip` file.

### How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Choose what to include, then under **JSON** choose **todo.txt**. The board
   downloads as `<board>.txt`.
3. Save the file as `todo.txt` where the todo.txt tool or app reads it (for
   the command line tool, the `TODO_FILE` of its `todo.cfg`), or add its lines
   to an existing `todo.txt`.

The todo.txt entry is offered for a whole board only, not for a swimlane or a
list.

### How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **todo.txt**.
2. One `.zip` downloads, with one file per board you can export: boards you
   are a member of that are not archived and not templates.

To export only some boards, use **Multi-Selection** in the All Boards
sidebar, select the boards, then **Export**.

From a script:

```bash
python3 api.py exportallboards todotxt boards.zip
```

### REST API

```bash
python3 api.py importboardfrom todotxt todo.txt          # POST /api/boards/import/todotxt
python3 api.py importboardsfrom todotxt FILE_OR_DIR ...  # several boards
python3 api.py exportboardformat BOARDID todotxt todo.txt
python3 api.py exportallboards todotxt boards.zip
```

The HTTP routes:

- `POST /api/boards/import/todotxt` with the file's text as `board`;
- `GET /api/boards/:boardId/export/todotxt?authToken=…` returns the file as
  `text/plain`;
- `GET /api/export-all-boards/todotxt?authToken=…` returns the `.zip`; add
  `&boardIds=ID1,ID2` for only those boards.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- At most 10,000 lines. More stops the import with an error.
  (`MAX_TODO_TXT_LINES` in
  [models/lib/todoTxtFormat.js](../../../../../../models/lib/todoTxtFormat.js#L23))

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
[models/lib/todoTxtFormat.js](../../../../../../models/lib/todoTxtFormat.js).

The tests that pin it:
[tests/importLossReport.test.cjs](../../../../../../tests/importLossReport.test.cjs),
[tests/playwright/specs/import-export-format-audit.e2e.js](../../../../../../tests/playwright/specs/import-export-format-audit.e2e.js),
[tests/todoTxt.test.cjs](../../../../../../tests/todoTxt.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

The format is the [todo.txt format](https://github.com/todotxt/todo.txt): one
task per line.

What the import must cover:

- completion (`x`), priority, and the creation and completion dates;
- `+project` and `@context` as labels;
- `due:` and `t:` as the due and start dates;
- WeKan's `list:` extension keeps list names across a round trip;
- other `key:value` pairs stay in the title, and a malformed date is
  reported;
- descriptions, comments and members have no place in the format.

What the current code does (`models/lib/todoTxtFormat.js`):

- A line starting with `x` is complete; a line starting with `(A)` … `(Z)` has
  that priority. A complete task's priority is read from `pri:A`, which is
  how todo.txt keeps a priority on completion.
- After `x`, a date is the completion date and a second date the creation
  date. Without `x`, a leading date is the creation date.
- `+project` becomes the label `project`, and `@context` the label
  `@context`. In both, `_` stands for a space.
- `due:`, `t:` (threshold), `list:` and `pri:` are read; each must be a
  `YYYY-MM-DD` date where it is a date. Any other `key:value` stays in the
  title.
- The card goes to the list that `list:` names (`_` for a space). Without
  `list:`, a complete task goes to **Done** and the others to **To Do**.
- The board is called "Imported todo.txt".
- Limit: 10,000 lines.
- Every card goes to the swimlane Default.

What the export writes (`formatTodoTxt` in the same module), one line per
card:

- `x` when the list's name looks finished (contains "done", "closed",
  "complete", "archiv" or "finished"), followed by the end date when the card
  also has a creation date (todo.txt allows a completion date only together
  with a creation date); otherwise `(A)` for a label `priority:A`;
- the creation date, then the title;
- other labels as `+label`, or `@context` for a label starting with `@`
  (spaces become `_`);
- `pri:A` on a completed task with a priority label;
- `due:` (due date), `t:` (start date) and `list:` (the list name).

Archived cards and archived lists are not exported.

### What is kept

| todo.txt | WeKan |
| --- | --- |
| `x` | List Done (unless `list:` names another) |
| `(A)`, or `pri:A` on a completed task | Label `priority:A` |
| Completion date | End date |
| Creation date | Creation date |
| `+project` | Label `project` |
| `@context` | Label `@context` |
| `due:YYYY-MM-DD` | Due date |
| `t:YYYY-MM-DD` | Start date |
| `list:Name` | List |
| The rest of the line, other `key:value` included | Card title |

### What is not kept

The import reports a `due:` or `t:` value that is not a `YYYY-MM-DD` date on
the loss report; the task is imported without that date.

The todo.txt export writes no descriptions, comments, members, checklists,
custom fields, swimlanes, attachments or card colors: a todo.txt line has no
place for them.

### How it is built and tested

- `models/lib/todoTxtFormat.js` reads and writes the file.
  `models/import.js` sends the text to the parser, and
  `models/kanboardCreator.js` creates the board.
- `tests/todoTxt.test.cjs` is the unit test of the round trip.
  `tests/importLossReport.test.cjs` covers the loss report.
- The Playwright cases are in
  `tests/playwright/specs/import-export-format-audit.e2e.js`: "todo.txt: tasks
  import with their list, labels, priority and dates", and the export menu
  link for every format.

## Commits

 - [Read every import source through one path and one file chooser, from one description of the sources](https://github.com/wekan/wekan/commit/c80a656901103bfd29b41843c7e255b4ed3bfa17)
 - [Import and export many boards at once for every format, and document each format in its own directory](https://github.com/wekan/wekan/commit/7858d84e127c2c6cd92134166352b9a4245d4ec2)
 - [Keep the todo.txt module free of a URL the release audit flags](https://github.com/wekan/wekan/commit/c8d16d1c4b412d4616ffcdf1bb2d70c93040f7f4)
 - [Import and export boards as todo.txt](https://github.com/wekan/wekan/commit/dd7baeec54d8bf8285cadb443815a6861127e214)
