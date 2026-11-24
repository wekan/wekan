# Super Productivity

## What it is

WeKan imports boards from a
[Super Productivity](https://github.com/super-productivity/super-productivity)
backup file and exports boards as one. The backup is the JSON file that
Super Productivity's **Export Data** writes (`sp-backup_*.json`). Each project
becomes a swimlane and each task a card. The export writes a backup that
Super Productivity's **Import from File** reads.

## Read more

- [Wikipedia: time tracking](https://en.wikipedia.org/wiki/Time_tracking)
- [Super Productivity](https://github.com/super-productivity/super-productivity):
  the app and its source
- [Managing Your Data](https://github.com/super-productivity/super-productivity/wiki/4.23-Managing-Your-Data):
  what export and import do, and that import replaces the current data
- [Restore Data From Backup](https://github.com/super-productivity/super-productivity/wiki/2.02-Restore-Data-From-Backup):
  the Settings → Sync & Backup → Import/Export steps and Import from File
- Super Productivity's own e2e fixture
  `e2e/fixtures/test-backup-with-archives.json`: the backup shape the unit test
  follows

See also the [format coverage table](../Format-Coverage.md) and
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. In Super Productivity, open **Settings**, open the **Sync & Backup** tab, and
   in the **Import/Export** section export your data. This downloads the
   backup as a plain JSON file.
2. Open the file in a text editor and copy all of its text.
3. In WeKan, go to **All Boards → Add Board → Import → Import board → Super Productivity**.
4. Choose the backup under **Choose the export file, or paste its text below:**, or paste the text
   into the text box. Either way it is read as text.
5. Click **Import**, or **Import without mapping members (map later)**.
   Super Productivity has no users, so there are no members to map.
6. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

A backup from before Super Productivity version 14 is refused. Import it into
a current Super Productivity and export it again first.

### How to import many boards at once

- On the import page, under **Import many boards**, choose several backup
  files, or one `.zip` that holds them. Each file becomes its own board,
  imported without member mapping (members can be mapped later).
- Super Productivity backups are imported through the generalized importer, so
  there is also a checkbox **One board per project**. Each swimlane the import
  would create becomes its own board, named after that swimlane. For this
  source the swimlanes are the backup's projects: every project that has tasks
  is a swimlane named after the project's title, and tasks without a project
  go to a swimlane named **No project**. So with this option each Super
  Productivity project becomes its own board. Links (parent cards) between
  cards that end up on different boards are reported in the loss report rather
  than kept. A sub-task always belongs to its parent's project, so this does
  not normally happen.
- From a script: `python3 api.py importboardsfrom superproductivity FILE_OR_DIR ...`
  (files, directories of files, or `.zip` files).

### How to export

1. In WeKan, open the board, then **Board Settings → Export**. Choose what to
   include, then choose **Super Productivity** in the JSON group. This
   downloads the board as a `.json` backup.
2. In Super Productivity, open **Settings**, open the **Sync & Backup** tab, and
   in the **Import/Export** section click **Import from File** and choose the
   file.
3. Confirm the warning. The import **replaces all current data** in Super
   Productivity and cannot be undone, so export your own data first if you
   want to keep it.

### How to export all boards at once

**All Boards → sidebar → Export all boards**, choose **Super Productivity**:
this downloads one `.zip` with one file per board you can export (boards you
are a member of, not archived, not templates).

To export only some boards: **Multi-Selection** in the All Boards sidebar,
select the boards, then **Export**.

From a script: `python3 api.py exportallboards superproductivity boards.zip`.

Each file in the `.zip` is a complete backup. Importing one into Super
Productivity replaces everything there, so only one of them can be imported
at a time.

### REST API

```bash
python3 api.py importboardfrom superproductivity sp-backup.json     # POST /api/boards/import/superproductivity
python3 api.py importboardsfrom superproductivity FILES...
python3 api.py exportboardformat BOARDID superproductivity board.json
python3 api.py exportallboards superproductivity boards.zip
```

The HTTP routes:

- `POST /api/boards/import/superproductivity`
- `GET /api/boards/:boardId/export/superproductivity?authToken=…`
- `GET /api/export-all-boards/superproductivity?authToken=…`, with an optional
  `&boardIds=ID1,ID2` for selected boards

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- The export writes `crossModelVersion: 4.5`, the backup version Super
  Productivity reads. (`SP_CROSS_MODEL_VERSION` in
  [models/lib/superProductivityFormat.js](../../../../../../models/lib/superProductivityFormat.js#L56))
- Time spent is milliseconds in Super Productivity; it is divided by one hour
  (3,600,000 ms) and rounded to two decimals to give hours, and hours are
  multiplied back on export. (`HOUR` in
  [models/lib/superProductivityFormat.js](../../../../../../models/lib/superProductivityFormat.js#L65))

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
[models/lib/superProductivityFormat.js](../../../../../../models/lib/superProductivityFormat.js).

The tests that pin it:
[tests/playwright/specs/import-export-format-audit.e2e.js](../../../../../../tests/playwright/specs/import-export-format-audit.e2e.js),
[tests/superProductivityFormat.test.cjs](../../../../../../tests/superProductivityFormat.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

#### The backup file

- The file is a Super Productivity backup as **Settings > Sync & Backup >
  Export Data** writes it (`sp-backup_*.json`):
  `{timestamp, lastUpdate, crossModelVersion, data}`.
- `data` holds one slice per model. WeKan reads the project, task, tag, note,
  boards and archiveYoung/archiveOld models. Each is an `{ids, entities}`
  entity state.
- It is pasted as text. The bare `data` object is read too: WeKan takes the
  wrapper when it has all three of `timestamp`, `crossModelVersion` and `data`,
  as Super Productivity's own importer does, and otherwise the object itself.
- The task and project models are required. A backup that still has the
  `taskArchive`, `improvement` or `obstruction` models is from before version
  14 and is refused.

#### Lists

Super Productivity has no columns. Its Kanban boards are saved filters, not
containers. So the lists follow its default Kanban board:

- a done task goes to **Done** (an archived task is always done);
- an undone task with the `KANBAN_IN_PROGRESS` tag goes to **In Progress**;
- an undone task in its project's backlog (or whose parent is) goes to
  **Backlog**;
- every other task goes to **To Do**.

The board always has To Do and Done; Backlog and In Progress are added when a
task uses them.

#### Projects, tasks and the rest

- Every project that has tasks becomes a swimlane, in the backup's project
  order. Two projects with the same title get `Title (2)` and so on. A project
  without a title is `Untitled project`. Tasks without a project go to
  **No project**.
- The board takes the project's title when there is only one project.
  Otherwise it is named `Super Productivity`.
- Tasks become cards and sub-tasks sub-task cards. A sub-task without a
  project of its own takes its parent's project.
- Tags become labels, except Today and the in-progress tag. A tag id that is
  not in the backup's tag model is reported.
- The notes, followed by the http(s) link attachments as a markdown list,
  become the description.
- `dueWithTime`/`dueDay` becomes the due date. When `deadlineWithTime` or
  `deadlineDay` is set, the deadline is the due date and `dueWithTime`/`dueDay`
  becomes the start date.
- `doneOn` becomes the end date of a done task.
- `created` becomes the card's created date.
- `timeSpent` becomes spent hours.
- `timeEstimate` and `priority` become the custom fields
  **Time estimate (hours)** and **Priority** (Low, Medium or High, from 1/2/3 or
  low/medium/high).
- Archived tasks (archiveYoung and archiveOld) become archived cards.
- The task id becomes the card's source reference.

#### The export

The export writes a backup Super Productivity's **Import from File** reads:

- `crossModelVersion` is 4.5. It writes the slices the import requires
  (project and task) plus tag, note, boards, archiveYoung and archiveOld.
  Slices it does not carry, such as globalConfig, take the app's defaults.
  That import **replaces** all Super Productivity data.
- Swimlanes become projects. When the board uses only one swimlane, there is
  one project, named after the board.
- Lists become one Super Productivity board, named after the WeKan board, with
  one panel per list.
- To Do, In Progress, Backlog and Done are written by state: a card in Done,
  or with an end date, is done; a card in In Progress gets the in-progress
  tag; a card in Backlog goes to its project's backlog. Any other list becomes
  a tag of the same name, and its panel filters on that tag.
- Labels become tags.
- Checklists are added to the notes as markdown task lists (`- [x] item`).
- Spent hours are booked on the card's end day, or its creation day when it
  has no end date, because Super Productivity adds the total up from its
  per-day time map.
- A due date at midnight UTC is written as a day (`dueDay`), any other as a
  time (`dueWithTime`).
- The custom fields **Time estimate (hours)** and **Priority** are written back
  as the estimate and priority.
- Super Productivity has one level of sub-tasks, so a sub-task of a sub-task
  is put under its top-level card.
- Comments and attachments are not exported.

### What is kept

| Super Productivity | WeKan |
| --- | --- |
| Project | Swimlane (board title when there is one project) |
| Task, sub-task (`parentId`) | Card, sub-task card |
| `isDone`, `KANBAN_IN_PROGRESS` tag, project backlog | List: Done, In Progress, Backlog, To Do |
| Tags (not Today, not in-progress) | Labels |
| `notes`, http(s) link attachments | Description |
| `dueWithTime` / `dueDay` | Due date (start date when a deadline is set) |
| `deadlineWithTime` / `deadlineDay` | Due date |
| `doneOn` | End date |
| `created` | Created date |
| `timeSpent` | Spent hours |
| `timeEstimate` | Custom field Time estimate (hours) |
| `priority` | Custom field Priority |
| Tasks in archiveYoung / archiveOld | Archived cards |
| `id` | The card's source reference |

### What is not kept

The import reports these on the loss report, rather than dropping them
silently:

- a repeat configuration other than every 1 day, week or month, or a paused
  one (the task imports once);
- reminders;
- a task's link to an issue of an issue provider;
- project notes;
- file, command and note attachments, which are paths on the user's device;
- the per-day breakdown of tracked time (the card keeps the total as spent
  hours);
- the saved Kanban boards, because they are filters, not containers;
- tags that are not in the backup's tag model.

The export does not write comments, attachments, members or assignees, start
dates, card dependencies, card colors, or custom fields other than Time
estimate (hours) and Priority. Archived cards, lists and swimlanes are not
exported. Spent hours are exported only when dates are included in the export,
and sub-tasks only when sub-tasks are included.

### Repeating tasks

A task's repeat configuration (`taskRepeatCfg`) that repeats every 1 day,
week or month makes the card repeat daily, weekly or monthly. The export
writes an open repeating card's repeat back as a `taskRepeatCfg` with the
fields and defaults of Super Productivity's own model
(`src/app/features/task-repeat-cfg/task-repeat-cfg.model.ts`): the cycle, its
quick setting, the start date (the due date, or the creation date), the
weekday of a weekly repeat, and today as the last creation day, since the card
is this period's task.

### How it is built and tested

- `models/lib/superProductivityFormat.js` reads the backup
  (`parseSuperProductivity`) and writes it (`formatSuperProductivity`). It is
  registered in `models/lib/externalParsers.js` and
  `models/lib/externalExportFormatters.js`, and the board is created by
  `models/kanboardCreator.js`.
- `tests/superProductivityFormat.test.cjs` is the unit test. It covers the
  lists, swimlanes, notes, links, dates, time, priority, sub-tasks, the
  archive, the loss report, refused inputs (not JSON, wrong shapes, pre-v14
  backups, prototype keys), and an export that imports back.
- The Playwright cases are in
  `tests/playwright/specs/import-export-format-audit.e2e.js`: one pastes a
  backup on `/import/superproductivity` and checks the board title, lists,
  label, description, due date, spent hours and sub-task; another downloads
  the board through the Export menu's Super Productivity entry and checks that
  another user is refused.

## Commits

 - [Super Productivity export writes a repeating card's taskRepeatCfg, so it repeats there too](https://github.com/wekan/wekan/commit/35f3f6c9dbec5de87e1181956ed7bf71c30a2f12)
 - [Tasks.org, Vikunja and Super Productivity repeats become the card's recurrence too](https://github.com/wekan/wekan/commit/878e53f418c2416796b5af00876ada7cc87a4161)
 - [Super Productivity export is written a page of cards at a time](https://github.com/wekan/wekan/commit/6187806cf1006bb0f00d27d5e72af9147027f0a9)
 - [Super Productivity export no longer fails on a card whose list is archived](https://github.com/wekan/wekan/commit/8b4fe0e7376194c498219a0b496340a94020098a)
 - [Fix the code scanning and Dependabot alerts of 2026-10-10](https://github.com/wekan/wekan/commit/5ec6d9af18d99ab5514cd189fed6bf642e0bb3b2)
 - [Read every import source through one path and one file chooser, from one description of the sources](https://github.com/wekan/wekan/commit/c80a656901103bfd29b41843c7e255b4ed3bfa17)
 - [Import and export many boards at once for every format, and document each format in its own directory](https://github.com/wekan/wekan/commit/7858d84e127c2c6cd92134166352b9a4245d4ec2)
 - [Import and export boards as Super Productivity backups](https://github.com/wekan/wekan/commit/b7e515dba65adf755b553a3e28fec49317ed33fd)
