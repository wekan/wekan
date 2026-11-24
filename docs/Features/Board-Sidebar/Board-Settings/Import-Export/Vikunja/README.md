# Vikunja

## What it is

WeKan imports boards from [Vikunja](https://vikunja.io) and exports boards to
it. Both directions use Vikunja's own user data export: a `.zip` with
`data.json`, `filters.json` and `VERSION`, the file Vikunja's **Vikunja
export** import reads back. The import also takes the `data.json` from inside
that `.zip`, chosen as a file or pasted as text.

## Read more

- [Wikipedia: kanban boards](https://en.wikipedia.org/wiki/Kanban_board)
- [Vikunja: Import & Export](https://vikunja.io/help/import-and-export/):
  the Data Export and Import steps, the **Vikunja export** source, and
  importing WeKan's JSON export
- [pkg/models/export.go](https://github.com/go-vikunja/vikunja/blob/main/pkg/models/export.go):
  how Vikunja writes the export `.zip`
- [Vikunja Export migrator](https://github.com/go-vikunja/vikunja/blob/main/pkg/modules/migration/vikunja-file/vikunja.go):
  how Vikunja reads it back, and the minimum version 0.20.1

See also the [format coverage table](../Format-Coverage.md) and
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. In Vikunja, open **Settings** and go to the **Data Export** section.
2. Confirm your password. With third-party login, such as Vikunja Cloud,
   Vikunja asks for a confirmation instead.
3. Vikunja makes a `.zip` file of all your data. Download it.
4. In WeKan, go to **All Boards → Add Board → Import → Import board → Vikunja**.
5. Choose the `.zip` file. You can instead choose the `data.json` file from
   inside it, or paste the text of `data.json` into the text box.
6. Click **Import**. Vikunja's people are not mapped to WeKan members here;
   members can be mapped later.
7. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

A `.zip` must have a `VERSION` file of Vikunja 0.20.1 or newer, which is also
the oldest export Vikunja's own import accepts. A pasted or chosen `data.json`
has no `VERSION`, so its version is not checked.

### How to import many boards at once

1. On the import page, under **Import many boards**, choose several export
   files, or one `.zip` that holds them.
2. Each file becomes its own board, imported without member mapping. Members
   can be mapped later.

A Vikunja data export `.zip` is itself one export, so it is one board. To
import several, choose several of those `.zip` files.

Vikunja is imported through the generalized importer, so there is also a
checkbox **One board per project**. Each swimlane the import would create
becomes its own board, named after that swimlane. For Vikunja the swimlanes
are projects:

- When the projects that have tasks are all children of one parent project,
  each child of that parent is a swimlane, also one without tasks.
- When they have no common parent, each project that has tasks is a swimlane.
- An export with one such project has one swimlane, **Default**. The option
  makes no difference for it.

A swimlane has the project's title, or `Title (id)` when two projects have the
same title. Links (parent cards, dependencies) between cards that end up on
different boards are reported in the loss report rather than kept.

From a script:

```bash
python3 api.py importboardsfrom vikunja FILE_OR_DIR ...
```

It takes files, directories of files, or `.zip` files.

### How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Choose what to include, then **Vikunja**. It downloads `<board>.zip`.
3. In Vikunja, open **Settings** and go to the **Import** tab.
4. Choose **Vikunja export** and upload the `.zip` file. Follow the steps on
   the screen.

Vikunja 2.3.0 and newer also imports WeKan's own JSON export directly (the
**WeKan** source on the same **Import** tab). See
[Vikunja's documentation](https://vikunja.io/help/import-and-export/).

### How to export all boards at once

1. Go to **All Boards → sidebar → Export all boards** and choose **Vikunja**.
2. It downloads one `.zip` with one file per board you can export: boards you
   are a member of, that are not archived and are not templates. For Vikunja
   each board's file is itself a Vikunja export `.zip`.

To export only some boards, use **Multi-Selection** in the All Boards sidebar,
select the boards, then **Export**.

From a script:

```bash
python3 api.py exportallboards vikunja boards.zip
```

### REST API

```bash
python3 api.py importboardfrom vikunja export.zip      # POST /api/boards/import/vikunja
python3 api.py importboardsfrom vikunja FILES...
python3 api.py exportboardformat BOARDID vikunja board.zip
python3 api.py exportallboards vikunja boards.zip
```

- `POST /api/boards/import/vikunja` imports one board. The `.zip` is sent as
  `{ "zipBase64": "…" }`, a `data.json` as its text.
- `GET /api/boards/:boardId/export/vikunja?authToken=…` exports one board.
- `GET /api/export-all-boards/vikunja?authToken=…` exports all boards, with an
  optional `&boardIds=ID1,ID2` for selected boards.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- The Vikunja data: at most 67,108,864 characters (64 MB of text). More stops
  the import with an error. (`MAX_VIKUNJA_DATA_CHARS` in
  [models/lib/vikunjaFormat.js](../../../../../../models/lib/vikunjaFormat.js#L58))
- At most 20,000 tasks. More stops the import with an error.
  (`MAX_VIKUNJA_TASKS` in
  [models/lib/vikunjaFormat.js](../../../../../../models/lib/vikunjaFormat.js#L59))
- A repeat of 86,400 seconds is daily and 7 x 86,400 seconds is weekly; other
  repeat intervals are reported. (`DAY` in
  [models/lib/vikunjaFormat.js](../../../../../../models/lib/vikunjaFormat.js#L66))
- The export places buckets and projects 65,536 positions apart, as Vikunja
  does. (`POSITION_STEP` in
  [models/lib/vikunjaFormat.js](../../../../../../models/lib/vikunjaFormat.js#L69))
- At most 4,096 characters of a task's attribute text are read.
  (`MAX_ATTRIBUTES_CHARS` in
  [models/lib/vikunjaFormat.js](../../../../../../models/lib/vikunjaFormat.js#L148))
- The Vikunja .zip file: at most 64 MB. More stops the import with an error.
  (`MAX_VIKUNJA_ZIP_BYTES` in
  [server/lib/vikunjaArchive.js](../../../../../../server/lib/vikunjaArchive.js#L16))
- The Vikunja data: at most 64 MB. More stops the import with an error.
  (`MAX_VIKUNJA_DATA_BYTES` in
  [server/lib/vikunjaArchive.js](../../../../../../server/lib/vikunjaArchive.js#L18))
- One small file in the Vikunja .zip: at most 1 MB.
  (`MAX_VIKUNJA_SMALL_ENTRY_BYTES` in
  [server/lib/vikunjaArchive.js](../../../../../../server/lib/vikunjaArchive.js#L19))
- At most 20,000 files in the archive. More stops the import with an error.
  (`MAX_VIKUNJA_ZIP_ENTRIES` in
  [server/lib/vikunjaArchive.js](../../../../../../server/lib/vikunjaArchive.js#L22))

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
[models/lib/vikunjaFormat.js](../../../../../../models/lib/vikunjaFormat.js),
[server/lib/vikunjaArchive.js](../../../../../../server/lib/vikunjaArchive.js).

The tests that pin it:
[tests/playwright/specs/import-export-format-audit.e2e.js](../../../../../../tests/playwright/specs/import-export-format-audit.e2e.js),
[tests/vikunjaFormat.test.cjs](../../../../../../tests/vikunjaFormat.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

#### The file

The file is Vikunja's user data export (**Settings > Data Export**): a `.zip`
with `data.json`, `filters.json`, `VERSION` and `files/<id>`, as
[pkg/models/export.go](https://github.com/go-vikunja/vikunja/blob/main/pkg/models/export.go)
writes it and the
[Vikunja Export migrator](https://github.com/go-vikunja/vikunja/blob/main/pkg/modules/migration/vikunja-file/vikunja.go)
reads it back (`VERSION` 0.20.1 or newer).

- `data.json` is a JSON array of projects. Each project has its tasks, views,
  buckets, `task_buckets` and `positions`.
- `filters.json` holds saved filters.
- `VERSION` is the Vikunja version that wrote the export, for example
  `v1.0.0`. A `VERSION` of `dev` (a development build) is read as the current
  layout, and the loss report says so.
- `files/<id>` holds the bytes of attachments and backgrounds, named by file
  id.

Both layouts are read:

- **0.24 and newer**: projects have views. A kanban view owns its buckets
  (`project_view_id`), and `task_buckets` and `positions` say which bucket a
  task is in and where.
- **0.21-0.23**: no views. Each bucket has `project_id`, each task its
  `bucket_id` and `kanban_position`, and the done bucket `is_done_bucket`.

Dates are RFC 3339. Go's zero time, `0001-01-01T00:00:00Z`, means no date.
Descriptions and comments are TipTap HTML. Older Vikunja versions stored
Markdown, which is read as it is.

#### Reading the .zip

The `.zip` is uploaded, or its `data.json` chosen or pasted. The server opens
the `.zip` under size, entry-count and inflate limits
(`server/lib/vikunjaArchive.js`):

- the upload is at most 64 MB, checked before anything is decoded or inflated;
- the `.zip` has at most 20,000 files;
- `data.json` is at most 64 MB, checked against the size the archive declares
  and again against the bytes that actually inflate;
- `VERSION` and `filters.json` are at most 1 MB each;
- all inflated entries together are at most 66 MB;
- only `data.json`, `VERSION` and `filters.json` are inflated. `files/<id>`
  entries are only counted. Nothing is written to disk and no entry name is
  used as a path.

A file that does not start like a `.zip`, or has no `data.json` or no
`VERSION`, is refused. `data.json` must be a JSON array of projects, with at
most 20,000 tasks in all.

#### Which projects become the board

- Vikunja's Favorites pseudo project (id -1) is skipped, as Vikunja's own
  import skips it.
- The projects that have tasks are imported. If none has tasks, the projects
  with buckets; if none, the first project.
- When those projects are all under one parent project, every child of that
  parent is a swimlane and the board is named after the parent.
- Otherwise, with several projects, each is a swimlane and the board is called
  **Imported Vikunja**. With one project, the board has its title and one
  **Default** swimlane.
- Projects that are not imported are listed in the loss report.

#### Lists and card order

- The first kanban view's buckets become lists, in bucket position order.
- Tasks become cards in that view's order (`positions`, else
  `kanban_position`, else `position`).
- A task with no bucket goes to the done bucket when it is done, else to the
  view's default bucket, else to the first bucket. A project with no buckets
  gets Vikunja's default lists, **To-Do** and **Done**.

#### Export

The export writes the same `.zip` layout, with `data.json`, `filters.json`
(an empty list) and `VERSION` `v1.0.0`. It has no `files/<id>`.

- It uses the current layout: each project has a list, gantt, table and kanban
  view. The kanban view's buckets are the board's lists, in order, and its
  default bucket is the first list.
- A list called **Done** is the done bucket. A card in it, or with the Done
  custom field set, is written as done.
- With one swimlane, the board is one project. Several swimlanes become child
  projects of a project named after the board.
- Parent links are written by id, so Vikunja drops a link across projects
  rather than duplicating the task.

### What is kept

| Vikunja | WeKan |
| --- | --- |
| Project (several, or the children of one parent) | Swimlane |
| Parent project, or the single project's title | Board title |
| First kanban view's buckets | Lists, in bucket order |
| Task | Card, in the kanban view's order |
| title | Card title |
| description (HTML) | Description as Markdown text |
| TipTap task list in the description | Checklist (a heading right above it is its title) |
| labels (by title) | Labels |
| assignees | Owner, then further assignees |
| created_by | Requested by |
| start_date, due_date, end_date, created | Start, due, end and created dates |
| done_at (when end_date is not set) | End date |
| done | Custom field **Done** (checkbox) |
| priority 1-5 | Custom field **Priority**: Low, Medium, High, Urgent, DO NOW (as Microsoft Planner's priority is) |
| percent_done | Custom field **Percent Done** (0-100) |
| hex_color | Card color |
| comments (HTML) | Comments as text, with the author's username in front |
| related_tasks subtask, parenttask | Parent card |
| related_tasks blocking, blocked | Blocks, is-blocked-by dependency |
| related_tasks related | Related-to dependency |
| related_tasks duplicateof, duplicates | Duplicates, is-duplicated-by dependency |
| Task of an archived project | Archived card |

A relation Vikunja writes on both tasks is kept once.

The export writes back:

| WeKan | Vikunja |
| --- | --- |
| Board title | Project (the parent project with several swimlanes) |
| Swimlane | Child project |
| List | Kanban bucket; a list called Done is the done bucket |
| List WIP limit | Bucket limit |
| Card title, description | Task title, description as HTML |
| Checklists | TipTap task lists in the description, each under a heading with its title (not for a single list called Checklist) |
| Owner, assignees | assignees |
| Creator, else Requested by | created_by |
| Labels | Labels (no color) |
| Start, due, end, created dates | start_date, due_date, end_date, created |
| Done custom field, or the Done list | done, done_at (the end date, else the export time) |
| Priority custom field | priority (Low to DO NOW, 0-5, or Planner's Important and Do now) |
| Percent Done custom field | percent_done |
| Comments, with author and date | Comments as HTML |
| Parent card | subtask and parenttask relations |

### What is not kept

The import reports these on the loss report, rather than dropping them
silently:

- attachments (their bytes stay in `files/<id>` in the export);
- reminders;
- repeats: a repeating task is imported once;
- precedes, follows, copied and other relations with no WeKan dependency type;
- a second or further parent task (a card has one parent);
- label colors (labels get WeKan's default color) and project colors;
- bucket limits (WIP limits);
- project descriptions and background images;
- reactions;
- saved filters in `filters.json`;
- kanban views after the first one;
- projects that are not under the same parent, or have no tasks;
- an archived project (its tasks are imported as archived cards);
- a priority that is not 0-5;
- tasks without a title;
- a development build's `VERSION`.

The Vikunja export does not write card colors, label colors, dependencies
other than parent cards, attachments, custom fields other than Priority,
Percent Done and Done, or reminders and repeats.

### How it is built and tested

- `models/lib/vikunjaFormat.js` reads and writes `data.json`: projects,
  buckets, tasks, the TipTap HTML, and the export.
- `server/lib/vikunjaArchive.js` opens the uploaded `.zip` under its limits and
  writes the exported `.zip`.
- `models/lib/externalParsers.js` (`vikunja`) and
  `models/lib/externalExportFormatters.js` (`vikunja`) wire it into the import
  and export, and `models/kanboardCreator.js` creates the board.
- `tests/vikunjaFormat.test.cjs` is the unit test: both layouts, swimlanes
  under a parent project, HTML and checklists, pasted text, refused input and
  oversized or inflating `.zip` files, and the export importing back.
- The Playwright cases are in
  `tests/playwright/specs/import-export-format-audit.e2e.js`:
  - the export menu link returns a Vikunja `.zip` and refuses an unrelated
    user;
  - an export `.zip` imports through the page with its buckets, checklist,
    comment, custom fields and parent card;
  - a pasted `data.json` imports, and a broken one or an unrelated `.zip` is
    refused.

## Commits

 - [Tasks.org, Vikunja and Super Productivity repeats become the card's recurrence too](https://github.com/wekan/wekan/commit/878e53f418c2416796b5af00876ada7cc87a4161)
 - [Vikunja export is streamed a page of cards at a time, and carries what each task waits for](https://github.com/wekan/wekan/commit/bd34f44460838cfacd10c678d6349f9cc5fd90a0)
 - [Import page uploads stream to the server's disk, checked against the free space and an Admin Panel limit](https://github.com/wekan/wekan/commit/32c24ed84e9d6c8080e89bdd4097f87a3b0b4b04)
 - [Fix the code scanning and Dependabot alerts of 2026-10-10](https://github.com/wekan/wekan/commit/5ec6d9af18d99ab5514cd189fed6bf642e0bb3b2)
 - [Read every import source through one path and one file chooser, from one description of the sources](https://github.com/wekan/wekan/commit/c80a656901103bfd29b41843c7e255b4ed3bfa17)
 - [Import and export many boards at once for every format, and document each format in its own directory](https://github.com/wekan/wekan/commit/7858d84e127c2c6cd92134166352b9a4245d4ec2)
 - [Import boards from Plane issue exports](https://github.com/wekan/wekan/commit/d21a26339363181807908e26c2a5155e732b745e)
 - [Import and export boards as Notion Markdown & CSV exports](https://github.com/wekan/wekan/commit/b7d3274780989c8169549507e416c60316d70ccf)
 - [Strip tags to a fixed point in the Vikunja export test](https://github.com/wekan/wekan/commit/ff8f82b40dc37da876aa2d835f50a6d39260c8b2)
 - [Import and export boards as Vikunja data exports](https://github.com/wekan/wekan/commit/a8e73adf4837fc349f2105818a580c048a85cd28)
