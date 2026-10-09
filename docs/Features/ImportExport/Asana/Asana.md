# Asana

WeKan imports boards from [Asana](https://asana.com/) and exports a board in the
same shape. It reads Asana tasks as JSON (`{ "data": [...] }`): sections
become lists and tasks become cards, and completed tasks without a section go to
**Done**. Milestone tasks become Scrum releases.

This directory also holds two Perl scripts, added in 2022 by GeekRuthie:
[export_boards.pl](./export_boards.pl) reads projects from Asana's API, and
[load_tasks.pl](./load_tasks.pl) loads the tasks into boards that were made in
WeKan beforehand, through WeKan's API. Their [CHANGELOG](./CHANGELOG.md) and
[LICENSE](./LICENSE) are beside them.

## How to import

1. In Asana, click the drop-down arrow next to the project's title, hover over
   **Export/Print** and choose **JSON**
   ([Asana's guide](https://asana.com/inside-asana/export-to-csv)). Or save the
   tasks from Asana's [Tasks API](https://developers.asana.com/reference/tasks)
   (`GET /tasks` with the `opt_fields` you want, such as `memberships`,
   `custom_fields`, `dependencies`, `followers`, `stories`).
2. In WeKan, go to **All Boards → New → Import → Asana**.
3. Paste the JSON into the text box. Tick the parts to import. **Scrum
   settings** decides whether milestones are imported as releases.
4. Click **Import**. Asana has no member-mapping step in WeKan, so the people
   in the file do not become card members.
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

## How to import many boards at once

- On the import page, under **Import many boards**, choose several Asana JSON
  files, or one `.zip` that holds them. Each file becomes its own board,
  imported without member mapping. Members can be mapped later. Click **Import**
  to import them.
- The checkbox **One board per project** makes no difference for Asana: every
  task is imported into one swimlane, **Default**. To get one board per Asana
  project, export each project to its own file and import the files together.
- From a script:
  `python3 api.py importboardsfrom asana FILE_OR_DIR ...` takes files,
  directories of files, or `.zip` files.

## How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Under **Select what to include:**, tick the parts to export.
3. Under **JSON**, choose **Asana**. The board downloads as a `.json` file.
4. Asana imports CSV, not JSON, so it does not read this file. To create the
   tasks in Asana, send them through its
   [Tasks API](https://developers.asana.com/reference/tasks). The file is also
   what WeKan's own Asana import reads.

## How to export all boards at once

1. **All Boards → sidebar → Export all boards**, then choose **Asana**.
   This downloads one `.zip` with one Asana file per board you can
   export: boards you are a member of, that are not archived and are not
   templates. A board you may not export is left out and named in
   `skipped.txt` in the `.zip`.
2. To export only some boards, use **Multi-Selection** in the All Boards
   sidebar, select the boards, then **Export**.

From a script: `python3 api.py exportallboards asana boards.zip`.

## Format details

From the [format coverage](../Format-Coverage.md) audit:

- **Current authoritative shape:** the current
  [Tasks API](https://developers.asana.com/reference/tasks) with opt-in
  fields.
- **Required import coverage:** sections/memberships, completion,
  assignee/followers, start/due dates, dependencies, subtasks, tags, stories,
  attachments, all supported custom-field value kinds, and milestone tasks as
  Scrum releases.
- Asana is one of the external adapters that map the listed fields that have a
  WeKan equivalent: comments (posted by the mapped user, otherwise by the
  importer with the source author's name leading the text), subtasks as child
  cards when they are imported too and as a checklist otherwise, parent
  hierarchy and dependencies between tasks of the same import, custom-field
  values as typed board custom fields, start, end and creation dates and
  source order. Creation dates survive the schema's `createdAt` autoValue
  through `writeImportedEntity`. File contents (the JSON carries attachment
  metadata only) are reported. Asana followers become card watchers when they
  are mapped to a member of the new board; watching grants no access, but a
  non-member watching a private board would receive its notifications, so any
  other follower is counted in the loss report instead.

Scrum planning (`models/lib/externalScrumPlanning.js`), written through the
same journaled Scrum import stage as Jira and WeKan JSON, so an interrupted
import is recovered like theirs
([Scrum import recovery](../Scrum-Import-Recovery.md)):

- **Sprints:** none. Asana has no sprint record, and sections stay lists.
- **Releases:** a milestone task (`resource_subtype: "milestone"`): `name`,
  `notes`, `start_on`, `due_on`; a completed milestone is released at
  `completed_at`. The milestone's own card and the tasks it waits for (its
  `dependencies`, or tasks listing it in `dependents`) carry it.
- **Reported, not imported:** a second milestone of one task (a card has one
  release), a dependency outside the import, a completed milestone without a
  valid completion date.
- Two records with the same name stay two records and are reported.

What the current code does (`parseAsana` in `models/lib/externalParsers.js`):

- A task's list is the section of its first membership. Without one, a
  completed task goes to **Done** and the others to **In Progress**.
- Subtasks that are in the file as tasks of their own link to their parent
  card. Subtasks only embedded on a task become a checklist named
  **Subtasks**.
- Each dependency is kept once, from the waiting task: it is blocked by what
  it depends on.
- Custom fields are read from `number_value`, `text_value`, `enum_value`,
  `multi_enum_values`, `date_value`, `people_value`, else `display_value`.
- Comments are the `comment_added` stories, when the file has stories.
- A task's `permalink_url` is added to the description as `Source: <url>`.
- The board takes the project's name, from `project` or the first task's
  membership.

## What is kept

| Asana | WeKan |
| --- | --- |
| Project name | Board title |
| `memberships[0].section.name` | List |
| `gid` | Source reference, for parent and dependency links |
| `name`, `notes` | Card title, description |
| `start_at` / `start_on`, `due_at` / `due_on` | Start date, due date |
| `completed_at` (when completed) | End date |
| `created_at` | Creation date |
| `assignee` | Card member, when mapped |
| `followers` | Card watchers, when mapped to a board member |
| `tags` | Labels |
| `parent` | Parent card |
| `dependencies` | Is-blocked-by dependencies |
| `custom_fields` | Custom fields |
| Embedded `subtasks` not in the file | Checklist **Subtasks** |
| `comment_added` stories | Comments |
| Milestone tasks | Scrum releases |

The export writes `data`, one task per card: `gid` (the card id), `name`,
`notes`, `completed` (true when the list's name contains done, closed,
complete, archiv or finished) with `completed_at`, `due_on`, `start_on`,
`created_at`, the owner as `assignee`, `parent`, the list as the section of
`memberships`, the labels as `tags`, the custom fields (numbers as
`number_value`, everything else as `text_value`), every checklist item as a
`subtasks` entry and the comments as `comment_added` stories.

## What is not kept

The import reports these on the loss report:

- attachments (the API export carries metadata, not file contents);
- followers who are not members of the new board;
- the milestone losses listed above;
- more than 50 custom fields, duplicate task ids, and parents or dependencies
  that point outside the file.

Asana has no member mapping in WeKan, so assignees do not become card members.

The export leaves out swimlanes, archived cards and lists, further assignees,
dependencies, Scrum releases and attachments. Several checklists are flattened
into one subtask list.

## REST API

```bash
python3 api.py importboardfrom asana tasks.json               # POST /api/boards/import/asana
python3 api.py importboardsfrom asana a.json b.json dir/      # one board per file
python3 api.py exportboardformat BOARDID asana tasks.json     # GET /api/boards/BOARDID/export/asana?authToken=TOKEN
python3 api.py exportallboards asana boards.zip               # GET /api/export-all-boards/asana?authToken=TOKEN
```

`GET /api/export-all-boards/asana?authToken=TOKEN&boardIds=ID1,ID2` exports
only the boards listed.

## How it is built and tested

- `models/lib/externalParsers.js` (`parseAsana`) reads the file.
  `models/lib/externalScrumPlanning.js` reads the milestones.
  `models/kanboardCreator.js` creates the board, and
  `models/lib/importedTaskPlan.js` decides what each task becomes.
- `models/lib/externalExportFormatters.js` (`asana`) writes the export, from
  what `models/lib/externalExporters.js` collects.
- Unit tests: `tests/asanaImport.test.cjs`,
  `tests/externalScrumPlanning.test.cjs`, `tests/importedTaskPlan.test.cjs`
  and `tests/externalExportRoundTrip.test.cjs`. The fixture is
  `tests/fixtures/import-formats/asana.json`.
- Playwright: `tests/playwright/specs/import-export-format-audit.e2e.js`
  (importing the fixture through the page and refusing malformed JSON) and
  `tests/playwright/specs/external-export-extras.e2e.js` (the export carries
  comments and checklists, and the selection removes them).

## Sources

- [Asana Tasks API](https://developers.asana.com/reference/tasks): the task
  fields and `opt_fields`
- [Export Asana projects](https://asana.com/inside-asana/export-to-csv): the
  project's Export/Print menu

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).
