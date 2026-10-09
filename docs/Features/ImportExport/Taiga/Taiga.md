# Taiga

WeKan imports boards from [Taiga](https://taiga.io) and exports boards to it.
Both directions use Taiga's project dump: the one JSON object that Taiga's
project export writes and its project import reads back. On import, user story
statuses become lists, user stories become cards with their tasks as subtask
cards, epics and issues get swimlanes of their own, and Taiga's sprints
(milestones) become WeKan Scrum sprints. On export, WeKan writes a dump with
every key Taiga's own exporter writes, so Taiga can create a project from it.

## How to import

1. In Taiga, open the project, click the **Settings** menu icon, then
   **Project Profile → Export**, and click the green **Export** button.
   On a synchronous Taiga server the JSON file downloads at once (or from the
   **here** link). On an asynchronous one, such as Taiga's own hosting, the
   server makes the file in the background and sends you an email with a link
   when it is ready.
2. If the file is a `.json.gz`, unpack it first. Taiga writes a gzip dump when
   the export is asked for in that format.
3. In WeKan, go to **All Boards → New → Import → Taiga**.
4. Under **Select what to include:** tick the parts to import. Tick **Scrum
   settings** to bring Taiga's sprints in as Scrum sprints. Without it the
   cards are imported, but no sprints, backlog ranks or Scrum estimate.
5. Choose the dump under **Choose the export file, or paste its text below:**, or paste the whole
   JSON into the text box.
6. Click **Import** (or **Import without mapping members (map later)**). Taiga
   names people by email, and the page imports Taiga without member mapping.
7. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

Before the dump is sent to the server, the page leaves out the attachment files
that Taiga embeds in it as base64, and the project logo. Attachments are not
imported, and without them the dump is much smaller. They are still counted in
the loss report.

## How to import many boards at once

1. On the import page, under **Import many boards**, choose several Taiga dump
   files, or one `.zip` that holds them. Each file becomes its own board,
   imported without member mapping (members can be mapped later).
2. Taiga is imported through the generalized importer, so there is also a
   checkbox **One board per project**. With it, each swimlane the import would
   create becomes its own board, named after that swimlane. For Taiga those
   swimlanes are:
   - the project's own Taiga swimlanes, or **Default** when it has none;
   - **Unclassified**, for user stories without a Taiga swimlane, when the
     project has swimlanes;
   - **Epics**, for the epics;
   - **Issues**, for the issues.

   A task stays on the board of its user story. Links between cards that end up
   on different boards are reported in the loss report rather than kept. For
   Taiga these are mostly a user story's link to its epic (parent card or
   related link) and a story's link to the issue or task it was made from.

From a script:

```bash
python3 api.py importboardsfrom taiga FILE_OR_DIR ...
```

It takes files, directories of files, or `.zip` files.

## How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Choose what to include. Tick **Scrum settings** to write the board's Scrum
   sprints as Taiga milestones.
3. Choose **Taiga** in the JSON group of the export menu. It downloads the
   dump as a `.json` file.
4. In Taiga, click **New Project** in the top bar, choose **Import project**,
   then the **Taiga** importer. Choose the JSON file and click **Accept**.
   On an asynchronous Taiga server you get an email when the import is done.

Taiga's import does not create users. It links people by their email address,
case-sensitive, so create the users in Taiga first. WeKan writes people as
WeKan usernames, so they are kept only where the username is the email of a
Taiga user. The user who imports becomes the project's owner and admin.

## How to export all boards at once

1. Go to **All Boards → sidebar → Export all boards** and choose **Taiga**.
   This downloads one `.zip` with one dump file per board you can export:
   boards you are a member of, that are not archived and are not templates.
2. To export only some boards, use **Multi-Selection** in the All Boards
   sidebar, select the boards, then click **Export**.

From a script:

```bash
python3 api.py exportallboards taiga boards.zip
```

## Format details

### The dump

- The file is a Taiga project dump: the one JSON object that Taiga's
  **Admin > Project > Export** (or `manage.py dump_project`) writes, and its
  importer
  ([`load_dump`](https://github.com/taigaio/taiga-back/blob/main/taiga/export_import/services/store.py))
  reads back.
- Keys and value shapes follow taiga-back's
  [export serializers](https://github.com/taigaio/taiga-back/blob/main/taiga/export_import/serializers/serializers.py)
  and
  [import validators](https://github.com/taigaio/taiga-back/blob/main/taiga/export_import/validators/validators.py).
- In a dump, people are emails. Statuses, swimlanes, sprints and roles are
  referred to by name. A task names its user story by the story's `ref`.
- A `.json.gz` dump must be unpacked first.
- WeKan reads a dump only when it is one JSON object with a `user_stories`
  array. A dump with more than 50,000 user stories, tasks, issues and epics
  together is refused.
- Dates may be in Taiga's own format (`2024-03-01T10:15:00+0000`), ISO with
  `Z`, or a plain date (`2024-03-15`). A date that does not exist on the
  calendar, such as 2024-02-31, is reported and left out.

### Import

- **Lists**: the user story statuses (`us_statuses`), in their order. A status
  used by an epic or issue that is not a user story status adds a list.
- **Swimlanes**: Taiga's swimlanes, in their order. **Default** when the
  project has none, **Unclassified** for stories without one.
- **User stories** become cards, in kanban order (`kanban_order`): subject,
  description, tags, `assigned_to` and `assigned_users` as owner and
  assignees, `owner` as Requested by, watchers, created, finish and due dates,
  and comments. A story in an archived status is an archived card.
- **Tasks** become subtask cards of their story, in the story's list and
  swimlane. A task keeps its own status as the **Task status** custom field,
  and its people, dates and comments. A checklist item could keep only a title
  and a done state.
- **Epics** become cards in an **Epics** swimlane, with a list per epic
  status. An epic's color is the card color. A story's first epic is its parent
  card; further epics are related links.
- **Issues** become cards in an **Issues** swimlane, with a list per issue
  status. An issue's type, priority and severity become `type:`, `priority:`
  and `severity:` labels.
- A story made from an issue or a task (`generated_from_issue`,
  `generated_from_task`) gets a related link to it.
- **Comments**: history entries with a comment. Deleted comments are left out.
- **Custom attributes** become custom fields, by attribute name.
- **Role points** become the **Story points** custom field: the sum over the
  roles that compute points. When any story has points, Story points is also
  the board's Scrum estimate, in points.
- **Tags**: `tags_colors` give each label the nearest WeKan label color.
  Older Taiga versions stored a tag as `[name, color]`; that color is used too.
- **Blocked** (with the blocked note), **Client requirement**, **Team
  requirement**, **Due date reason** and **Iocaine** become custom fields of
  those names.

People become card members, assignees and watchers only when they are mapped
to WeKan users. The import page imports Taiga without member mapping, so
members can be added later. A watcher becomes a card watcher only when mapped
to a member of the new board. Requested by keeps the Taiga email as text.

### Scrum sprints from milestones

Taiga's milestones are its sprints. They are imported only when **Scrum
settings** is ticked under **Select what to include:**
(`models/lib/externalScrumPlanning.js`):

- Each open milestone becomes a **planned** Scrum sprint with its
  `estimated_start` and `estimated_finish` dates. An empty milestone is
  imported too: in Taiga a sprint exists before stories are planned into it.
- A closed milestone is reported and not imported: the dump has no commitment
  or close snapshot. Its items stay in the backlog.
- A milestone without a name, or a second one with the same name, is reported.
  A start or end date that is not a date, or an end before the start, is
  reported and that date left out.
- A user story, task or issue names its sprint by `milestone`. A name that is
  not among the dump's milestones is reported, and the item stays in the
  backlog.
- A user story's `backlog_order` is its backlog rank.
- Taiga has no releases.

The sprints are written through the same journaled Scrum import as Jira and
WeKan JSON, so an interrupted import is recovered like theirs.

### Export

The export writes a dump with every key Taiga's exporter writes, in its order:

- Lists become user story statuses, with the list color as hex and the list's
  WIP limit. A list named like Done, Closed, Complete, Archived or Finished is
  a closed status.
- Swimlanes become Taiga swimlanes. A board with only Default writes none. The
  Epics and Issues swimlanes are not written as swimlanes.
- Cards become user stories. Subtask cards become tasks of their story.
- Cards in the **Epics** swimlane become epics; their child cards are the
  epic's related user stories. Cards in the **Issues** swimlane become issues,
  with type, priority and severity from the `type:`, `priority:` and
  `severity:` labels (Bug, Normal and Normal when there are none).
- A story's checklist items become further tasks, closed when the item is done.
  Taiga has no checklists. On a task, epic or issue they are appended to the
  description as a Markdown task list.
- Labels become tags, with their colors in `tags_colors`.
- Comments become history entries.
- Custom fields become custom attributes, typed number, checkbox or text.
- **Story points** become role points of one role, **Team**. The fields
  Task status, Blocked, Client requirement, Team requirement, Due date reason
  and Iocaine go back to Taiga's own fields.
- Scrum sprints with both a planned start and end become milestones. A closed
  sprint is a closed milestone. A cancelled sprint is left out. A card's sprint
  is its story's, task's or issue's milestone, and its backlog rank is the
  story's `backlog_order`.
- People are written as WeKan usernames. Taiga keeps only those that are a
  user's email. `owner` and `memberships` are empty: Taiga's importer makes
  the importing user the owner and an admin member.
- Taiga's default statuses, issue types, priorities, severities and due date
  settings are written, plus any further status or value the cards use.

## What is kept

| Taiga | WeKan |
| --- | --- |
| Project name | Board title |
| User story status | List (an archived status archives its cards) |
| Swimlane | Swimlane (Default when none; Unclassified for stories without one) |
| User story subject, description | Card title, description |
| `assigned_to`, `assigned_users` | Owner, then assignees (when mapped) |
| User story `owner` | Requested by |
| Watchers | Card watchers (when mapped to board members) |
| `created_date`, `finish_date` / `finished_date`, `due_date` | Created, end and due dates |
| Tags, `tags_colors` | Labels with the nearest WeKan label color |
| History entries with a comment | Comments |
| Custom attribute values | Custom fields |
| Role points | Story points custom field, the Scrum estimate |
| Task | Subtask card of its story, in the story's list and swimlane |
| Task status | Task status custom field |
| Epic | Card in the Epics swimlane, list per epic status, epic color as card color |
| Epic's related user stories | Parent card (first epic), related links (further epics) |
| Issue | Card in the Issues swimlane, list per issue status |
| Issue type, priority, severity | `type:`, `priority:`, `severity:` labels |
| `generated_from_issue`, `generated_from_task` | Related link |
| `is_blocked`, `blocked_note` | Blocked custom field |
| `client_requirement`, `team_requirement` | Client requirement, Team requirement custom fields |
| `due_date_reason` | Due date reason custom field |
| `is_iocaine` | Iocaine custom field |
| Open milestone | Planned Scrum sprint with its dates |
| Item `milestone` | The card's sprint |
| `backlog_order` | Backlog rank |

## What is not kept

The import reports these in the loss report:

- attachments (the page leaves the embedded files out before sending; download
  them from Taiga and attach them to the cards);
- the project logo;
- wiki pages and wiki links;
- the activity timeline;
- issue votes;
- WIP limits of the user story statuses (set them on the lists);
- project memberships (an item keeps a person only where a WeKan user is
  mapped);
- an epic's links to stories of another project;
- dates that are not dates;
- closed milestones, unnamed or repeated milestones, and items whose milestone
  is not in the dump (with Scrum settings ticked);
- watchers who are not members of the new board.

The export leaves out attachments, activities, wiki pages, votes, the timeline
and the project logo; their keys are written empty. A card that has no Taiga
place for a field, such as a start date or a card color on a story, loses it.

## REST API

```bash
python3 api.py importboardfrom taiga project-dump.json   # POST /api/boards/import/taiga
python3 api.py importboardsfrom taiga FILES...
python3 api.py exportboardformat BOARDID taiga board.json # GET /api/boards/:boardId/export/taiga?authToken=…
python3 api.py exportallboards taiga boards.zip          # GET /api/export-all-boards/taiga?authToken=…
```

The mass export route takes an optional `&boardIds=ID1,ID2` to export only
those boards.

## How it is built and tested

- `models/lib/taigaFormat.js` reads a dump (`parseTaiga`), writes one
  (`formatTaiga`) and leaves the attachment files out on the import page
  (`slimTaigaDump`).
- `models/lib/externalScrumPlanning.js` (`taigaScrumPlanning`) turns
  milestones into Scrum sprints and backlog ranks.
- `models/lib/externalParsers.js` registers the parser as `taiga`, and
  `models/kanboardCreator.js` creates the board.
- `models/lib/externalExporters.js` collects the board, its sprints included,
  and `models/lib/externalExportFormatters.js` registers the formatter.
- `tests/taigaFormat.test.cjs` is the unit test, with the fixture
  `tests/fixtures/taiga/project-dump.json` written from taiga-back's export
  serializers. It covers import, sprints, the loss report, dates, negative
  cases, every key the export writes, and round trips.
  `tests/importLossReport.test.cjs` and `tests/boardExportScope.test.cjs`
  check that Taiga is wired to the loss report and the export route.
- The Playwright cases are in
  `tests/playwright/specs/import-export-format-audit.e2e.js`:
  - *Taiga: a project dump imports with its stories, tasks, epics, issues,
    comments, fields and sprint* pastes the fixture on the import page and
    checks lists, swimlanes, cards, subtasks, the epic parent, issue labels,
    custom fields, the label color, the open sprint, and that no attachment
    was imported;
  - *Taiga: malformed JSON and a document that is not a dump are rejected*;
  - *every external export menu link returns text and refuses an unrelated
    user* includes the Taiga export link.

## Sources

- [Import/Export Taiga Projects](https://community.taiga.io/t/import-export-taiga-projects/168):
  Taiga's steps to export a project and to import a dump, and how users are
  matched by email
- [taiga-back `export_import/services/store.py`](https://github.com/taigaio/taiga-back/blob/main/taiga/export_import/services/store.py):
  `load_dump`, the importer
- [taiga-back export serializers](https://github.com/taigaio/taiga-back/blob/main/taiga/export_import/serializers/serializers.py):
  the keys and value shapes of a dump
- [taiga-back import validators](https://github.com/taigaio/taiga-back/blob/main/taiga/export_import/validators/validators.py):
  what the importer accepts
- [taiga-back `export_import/tasks.py`](https://github.com/taigaio/taiga-back/blob/main/taiga/export_import/tasks.py):
  a dump is written as `.json`, or as `.json.gz` in the gzip format

See also the [format coverage table](../Format-Coverage.md) and
[all formats](../External-Tools.md).
