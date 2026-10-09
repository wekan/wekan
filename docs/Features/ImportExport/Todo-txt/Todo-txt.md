# todo.txt

WeKan imports and exports a board as a [todo.txt](https://github.com/todotxt/todo.txt)
file: one task per line, as the todo.txt command line tool and the many apps
that share the format write it. Completion, priority, creation and completion
dates, `+project` and `@context`, `due:` and `t:` are kept. WeKan adds a
`list:` key so list names survive a round trip.

## How to import

1. Find the `todo.txt` file. The format is the file itself, so there is
   nothing to export. The todo.txt command line tool keeps it in the directory
   that `TODO_DIR` in its `todo.cfg` names, and completed tasks it has
   archived in `done.txt` beside it. Where another app keeps its file, see that
   app's documentation.
2. In WeKan, go to **All Boards → New → Import → todo.txt**.
3. Open the file in a text editor, copy all of it and paste it into the text
   box. To include archived tasks, paste the lines of `done.txt` too.
4. Click **Import**.
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

## How to import many boards at once

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

## How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Choose what to include, then under **JSON** choose **todo.txt**. The board
   downloads as `<board>.txt`.
3. Save the file as `todo.txt` where the todo.txt tool or app reads it (for
   the command line tool, the `TODO_FILE` of its `todo.cfg`), or add its lines
   to an existing `todo.txt`.

The todo.txt entry is offered for a whole board only, not for a swimlane or a
list.

## How to export all boards at once

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

## Format details

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

## What is kept

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

## What is not kept

The import reports a `due:` or `t:` value that is not a `YYYY-MM-DD` date on
the loss report; the task is imported without that date.

The todo.txt export writes no descriptions, comments, members, checklists,
custom fields, swimlanes, attachments or card colors: a todo.txt line has no
place for them.

## REST API

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

## How it is built and tested

- `models/lib/todoTxtFormat.js` reads and writes the file.
  `models/import.js` sends the text to the parser, and
  `models/kanboardCreator.js` creates the board.
- `tests/todoTxt.test.cjs` is the unit test of the round trip.
  `tests/importLossReport.test.cjs` covers the loss report.
- The Playwright cases are in
  `tests/playwright/specs/import-export-format-audit.e2e.js`: "todo.txt: tasks
  import with their list, labels, priority and dates", and the export menu
  link for every format.

## Sources

- [todo.txt format](https://github.com/todotxt/todo.txt): the format rules,
  `pri:` on completed tasks and `key:value` metadata such as `due:`
- [todo.txt-cli `todo.cfg`](https://github.com/todotxt/todo.txt-cli/blob/master/todo.cfg):
  where the command line tool keeps `todo.txt` and `done.txt`

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).
