# Tasks.org

WeKan imports boards from a [Tasks.org](https://tasks.org) backup and exports
boards as one. Tasks.org is a task app for Android, and its backup is one JSON
file. On import, Tasks.org lists become WeKan lists and tasks become cards,
with their notes, tags, dates, comments and subtasks. On export, WeKan writes a
backup that Tasks.org's **Import backup** reads.

## How to import

1. In Tasks.org, open the backup settings and make a manual backup. Tasks.org's
   documentation calls this **Export tasks**; in the current app the button is
   labelled **Backup now**. The file is named `user.<date>.json`. Where the
   file is saved, and how to copy it off the device, is in
   [Tasks.org's backup documentation](https://tasks.org/docs/backups).
2. In WeKan, go to **All Boards → New → Import → Tasks.org**.
3. Choose the `.json` file under **Choose the export file, or paste its text below:**, or paste its
   whole contents into the text box.
4. Click **Import**. You can map Tasks.org's members to WeKan users, or import
   without mapping.
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

The import page says: "In Tasks.org, open Settings, Backups and choose Export
tasks, then paste the contents of that .json file."

## How to import many boards at once

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

## How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Choose what to include, then choose **Tasks.org** in the JSON group of the
   export menu. It downloads `<board>.json`.
3. Copy the file to the Android device. In Tasks.org, open the backup settings
   and choose **Import backup**, then choose the file. See
   [Tasks.org's backup documentation](https://tasks.org/docs/backups).

Tasks.org creates one local account named after the board, with one list per
WeKan list. The ids in the file are stable, so importing the same export a
second time lets Tasks.org find the tasks it already has.

## How to export all boards at once

**All Boards → sidebar → Export all boards**, then choose **Tasks.org**. This
downloads one `.zip` with one file per board you can export: boards you are a
member of, that are not archived and are not templates.

To export only some boards, use **Multi-Selection** in the All Boards sidebar,
select the boards, then click **Export**.

From a script:

```bash
python3 api.py exportallboards tasksorg boards.zip
```

## Format details

### The file

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

### Import

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

### Export

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

## What is kept

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

## What is not kept

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

## REST API

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

## How it is built and tested

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

## Sources

- [Tasks.org: Backups](https://tasks.org/docs/backups): manual backups with
  **Export tasks**, automatic backups and where backup files are stored.
- [TasksJsonExporter](https://github.com/tasks/tasks/blob/main/app/src/main/java/org/tasks/backup/TasksJsonExporter.kt):
  the code that writes the backup JSON, and leaves out default values.
- [Tasks.org backup settings screen](https://github.com/tasks/tasks/blob/main/app/src/main/res/xml/preferences_backups.xml)
  and [its strings](https://github.com/tasks/tasks/blob/main/app/src/main/res/values/strings.xml):
  the **Backup now** and **Import backup** buttons.

See also the [format coverage table](../Format-Coverage.md) and
[all formats](../External-Tools.md).
