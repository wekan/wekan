# Tasks.org

## What it is

WeKan imports boards from a [Tasks.org](https://tasks.org) backup and exports
boards as one. Tasks.org is a task app for Android, and its backup is one JSON
file. On import, Tasks.org lists become WeKan lists and tasks become cards,
with their notes, tags, dates, comments and subtasks. On export, WeKan writes a
backup that Tasks.org's **Import backup** reads.

## Read more

- [Wikipedia: to-do lists](https://en.wikipedia.org/wiki/Todo_list)
- [Tasks.org: Backups](https://tasks.org/docs/backups): manual backups with
  **Export tasks**, automatic backups and where backup files are stored.
- [TasksJsonExporter](https://github.com/tasks/tasks/blob/main/app/src/main/java/org/tasks/backup/TasksJsonExporter.kt):
  the code that writes the backup JSON, and leaves out default values.
- [Tasks.org backup settings screen](https://github.com/tasks/tasks/blob/main/app/src/main/res/xml/preferences_backups.xml)
  and [its strings](https://github.com/tasks/tasks/blob/main/app/src/main/res/values/strings.xml):
  the **Backup now** and **Import backup** buttons.

See also the [format coverage table](../Format-Coverage.md) and
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. In Tasks.org, open the backup settings and make a manual backup. Tasks.org's
   documentation calls this **Export tasks**; in the current app the button is
   labelled **Backup now**. The file is named `user.<date>.json`. Where the
   file is saved, and how to copy it off the device, is in
   [Tasks.org's backup documentation](https://tasks.org/docs/backups).
2. In WeKan, go to **All Boards → Add Board → Import → Import board → Tasks.org**.
3. Choose the `.json` file under **Choose the export file, or paste its text below:**, or paste its
   whole contents into the text box.
4. Click **Import**. You can map Tasks.org's members to WeKan users, or import
   without mapping.
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

The import page says: "In Tasks.org, open Settings, Backups and choose Export
tasks, then paste the contents of that .json file."

### How to import many boards at once

On the import page, under **Import many boards**, choose several Tasks.org
backup files, or one `.zip` that holds them. Each file becomes its own board,
imported without member mapping. Members can be mapped later.

Tasks.org backups are imported through the generalized importer, so there is
also a checkbox **One board per project**: each swimlane the import would
create becomes its own board, named after that swimlane. A Tasks.org import
always puts every card in one swimlane, **Default**, so for this source the
option makes no difference. (If it did split cards, links such as a subtask's
parent card that end up on different boards would be reported in the loss
report rather than kept.)

From a script:

```bash
python3 api.py importboardsfrom tasksorg FILE_OR_DIR ...
```

Each argument can be a file, a directory of files, or a `.zip` file.

### How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Choose what to include, then choose **Tasks.org** in the JSON group of the
   export menu. It downloads `<board>.json`.
3. Copy the file to the Android device. In Tasks.org, open the backup settings
   and choose **Import backup**, then choose the file. See
   [Tasks.org's backup documentation](https://tasks.org/docs/backups).

Tasks.org creates one local account named after the board, with one list per
WeKan list. The ids in the file are stable, so importing the same export a
second time lets Tasks.org find the tasks it already has.

### How to export all boards at once

**All Boards → sidebar → Export all boards**, then choose **Tasks.org**. This
downloads one `.zip` with one file per board you can export: boards you are a
member of, that are not archived and are not templates.

To export only some boards, use **Multi-Selection** in the All Boards sidebar,
select the boards, then click **Export**.

From a script:

```bash
python3 api.py exportallboards tasksorg boards.zip
```

### REST API

```bash
python3 api.py importboardfrom tasksorg FILE
python3 api.py importboardsfrom tasksorg FILES...
python3 api.py exportboardformat BOARDID tasksorg OUTPUT
python3 api.py exportallboards tasksorg boards.zip
```

The HTTP routes:

- `POST /api/boards/import/tasksorg`
- `GET /api/boards/:boardId/export/tasksorg?authToken=…`
- `GET /api/export-all-boards/tasksorg?authToken=…`, with an optional
  `&boardIds=ID1,ID2` to export only those boards

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- The export writes backup version 151300. (`TASKSORG_BACKUP_VERSION` in
  [models/lib/tasksorgFormat.js](../../../../../../models/lib/tasksorgFormat.js#L53))
- Tasks.org priority 3 means no priority; any other priority (0 high to 2 low)
  is kept. (`PRIORITY_NONE` in
  [models/lib/tasksorgFormat.js](../../../../../../models/lib/tasksorgFormat.js#L57))
- The export writes one local list account (account type 2), named after the
  board. (`LOCAL_ACCOUNT` in
  [models/lib/tasksorgFormat.js](../../../../../../models/lib/tasksorgFormat.js#L58))
- Tasks.org keeps a due time only when the time is not a whole minute: a
  date-only due date is written on a whole minute, and a due date with a time
  gets one extra second (60,000 ms is one minute). (`MINUTE` in
  [models/lib/tasksorgFormat.js](../../../../../../models/lib/tasksorgFormat.js#L61))

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
[models/lib/tasksorgFormat.js](../../../../../../models/lib/tasksorgFormat.js).

The tests that pin it:
[tests/playwright/specs/import-export-format-audit.e2e.js](../../../../../../tests/playwright/specs/import-export-format-audit.e2e.js),
[tests/tasksorgFormat.test.cjs](../../../../../../tests/tasksorgFormat.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

#### The file

- A Tasks.org [backup](https://tasks.org/docs/backups), `user.<date>.json`,
  made in Settings > Backups > Export tasks.
- Its shape is
  `{version, timestamp, data:{tasks, tags, caldavAccounts, caldavCalendars, ...}}`,
  as Tasks.org's
  [TasksJsonExporter](https://github.com/tasks/tasks/blob/main/app/src/main/java/org/tasks/backup/TasksJsonExporter.kt)
  writes it.
- That writer leaves out every property equal to its default, so a missing
  key means the default value.
- `data` also holds `places`, `filters`, `taskListMetadata`,
  `taskAttachments` and the app's preferences (`intPrefs`, `longPrefs`,
  `stringPrefs`, `boolPrefs`, `setPrefs`). Each entry of `data.tasks` holds
  `task`, `tags`, `comments`, `alarms`, `geofences`, `attachments`,
  `caldavTasks` and more.
- A file without `data.tasks` is refused with the message "Tasks.org backup
  needs data.tasks (Settings > Backups > Export tasks)".

#### Import

- **Lists**: the `caldavCalendars` entries become lists. A task's list is the
  calendar named by its `caldavTasks[].calendar`. Lists keep Tasks.org's own
  `order`; lists without one keep the file's order. A list without a name is
  called "Untitled list". A task with no list goes to a list called **No
  list**.
- **Tasks** become cards, with the notes as the description.
- **Tags** become labels.
- **Priority** 0, 1 and 2 become the custom field **Priority** = High, Medium
  and Low. Priority 3, Tasks.org's default, means no priority. It is a custom
  field, not a label, so it does not mix with the task's own tags.
- **Due date and start date** (`dueDate`, `hideUntil`) are epoch
  milliseconds. A date has a time only when `ms % 60000 > 0` (Tasks.org sets
  the second to 1). Otherwise it is an all-day date, and WeKan keeps it as that
  day at 12:00 UTC.
- **Completion** becomes the card's end date. The card stays in its list.
- The **creation date** is kept.
- **Elapsed time** (`elapsedSeconds`) becomes the card's time spent, in hours.
- The **estimate** (`estimatedSeconds`) becomes the custom field **Estimate
  (hours)**.
- **Comments** are kept with their dates. Tasks.org comments have no author.
- **Subtasks**: `caldavTasks[].remoteParent` makes a subtask card linked to its
  parent. Tasks.org subtasks are full tasks with their own dates and
  completion, so they become cards rather than checklist items.
- `caldavTasks[].remoteId`, else `task.remoteId`, is the card's source
  reference.
- **Board title**: the account name, when every list is in one account.
  Otherwise the board is called "Imported Tasks.org".
- Every card goes to one swimlane, **Default**.

#### Export

The export writes a backup Tasks.org's **Import backup** reads:

- `version` 151300 and the export time as `timestamp`;
- one local account (`accountType` 2) named after the board;
- one list (`caldavCalendars` entry) per WeKan list, in the board's order;
- tag definitions for the board's labels;
- per task, its `caldavTasks` row that puts it in its list;
- checklist items as subtasks of their card, the only place Tasks.org has for
  them. A checked item is written as completed;
- a subtask card stays a subtask only when its parent is in the same list,
  because Tasks.org links parents within one list.

Swimlanes, members and attachments have no place in Tasks.org.

### What is kept

| Tasks.org | WeKan |
| --- | --- |
| List (`caldavCalendars[]`, from `caldavTasks[].calendar`) | List |
| Account name (all lists in one account) | Board title |
| `title`, `notes` | Card title, description |
| Tags | Labels |
| `priority` 0 / 1 / 2 | Custom field Priority = High / Medium / Low |
| `dueDate` | Due date (all-day dates as 12:00 UTC) |
| `hideUntil` | Start date (all-day dates as 12:00 UTC) |
| `completionDate` | End date |
| `creationDate` | Created date |
| `elapsedSeconds` | Time spent |
| `estimatedSeconds` | Custom field Estimate (hours) |
| Comments (message, date) | Comments |
| `caldavTasks[].remoteParent` | Parent card (subtask) |
| `caldavTasks[].remoteId` | The card's source reference |

The export writes back: list, board title (as the account), title,
description, labels, Priority and Estimate (hours) custom fields, due and start
dates, end date (as completion), creation date, comments, subtask cards in the
same list, and checklist items as subtasks.

### What is not kept

The import reports these on the loss report, rather than dropping them
silently:

- deleted tasks (`deletionDate`), which are skipped;
- a backup entry without a task;
- a task's repeat rule;
- reminders (`alarms`) and location reminders (`geofences`);
- a running timer (`timerStart`);
- attachments: the backup has no file contents;
- comment pictures, which are not in the backup;
- a list the backup does not define in `caldavCalendars` (the task goes to
  **No list**);
- a priority that is not 0, 1, 2 or 3.

The export leaves out swimlanes, members, attachments, and custom fields other
than Priority and Estimate (hours). Time spent is written back as
`elapsedSeconds`. A subtask card whose parent is
in another list is written as a task of its own, without its parent.

### How it is built and tested

- `models/lib/tasksorgFormat.js` reads the backup (`parseTasksOrgBackup`) and
  writes it (`formatTasksOrgBackup`). The reader is registered as `tasksorg`
  in `models/lib/externalParsers.js`, and the board is created by
  `models/kanboardCreator.js`. The writer is registered in
  `models/lib/externalExportFormatters.js`.
- `tests/tasksorgFormat.test.cjs` is the unit test. It follows Tasks.org's
  writer: defaults left out, epoch-ms dates, timed and all-day due dates, lists
  from `caldavTasks[].calendar`, and subtasks from `remoteParent`, with the
  round trip through the export.
- The Playwright cases are in
  `tests/playwright/specs/import-export-format-audit.e2e.js`:
  - "Tasks.org: a backup imports with its lists, notes, tags, priority, due
    date and subtask" pastes a backup on `/import/tasksorg`, imports it without
    mapping, and checks the board title, list, description, label, due date,
    Priority custom field, and the completed subtask linked to its parent.
  - "every external export menu link returns text and refuses an unrelated
    user" downloads the `tasksorg` export from the export menu and checks that
    another user is refused.

## Commits

 - [Tasks.org, Vikunja and Super Productivity repeats become the card's recurrence too](https://github.com/wekan/wekan/commit/878e53f418c2416796b5af00876ada7cc87a4161)
 - [Read every import source through one path and one file chooser, from one description of the sources](https://github.com/wekan/wekan/commit/c80a656901103bfd29b41843c7e255b4ed3bfa17)
 - [Import and export many boards at once for every format, and document each format in its own directory](https://github.com/wekan/wekan/commit/7858d84e127c2c6cd92134166352b9a4245d4ec2)
 - [Import and export boards as Tasks.org backups](https://github.com/wekan/wekan/commit/68b2cceb19f724ca8247043a3c3c5ee806e93e21)
