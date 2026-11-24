# Microsoft Project

## What it is

WeKan imports a plan saved by [Microsoft Project](https://www.microsoft.com/microsoft-365/project/project-management-software)
as XML, and exports a board as a plan Project opens. ProjectLibre and
GanttProject read and write the same XML. The `.mpp` file itself is a closed
binary format and is not read.

## Read more

- [Wikipedia: Microsoft Project](https://en.wikipedia.org/wiki/Microsoft_Project)
- [Microsoft Project XML schema (MSPDI)](https://learn.microsoft.com/office-project/xml-data-interchange/introduction-to-project-xml-data)
- [Project XML elements: Task](https://learn.microsoft.com/office-project/xml-data-interchange/task-element)

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. In Microsoft Project, choose **File → Save As**, and as the type **XML
   Format (\*.xml)**.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → Microsoft Project (XML)**.
3. Choose the `.xml` file, or paste its text.
4. Map the people to WeKan members, or leave them as they are.
5. Click **Import**.

### How to import many boards at once

1. On the import page, choose **Microsoft Project (XML)**, then under **Import many boards**
   choose several files.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Microsoft Project is imported through the generalized importer
(`models/kanboardCreator.js`), so the page also has the checkbox **One board
per project**.

From a script:

```bash
python3 api.py importboardsfrom msproject FILE_OR_DIR ...
```

### How to export

1. Open the board, then **Board Settings → Export**, and choose **Microsoft
   Project (XML)**. The board downloads as `<board>.xml`.
2. In Microsoft Project, choose **File → Open**, and open the file as **XML
   Format**.

Each swimlane is a summary task, its cards the tasks under it and their
subtasks one level further down. A task runs from the card's start to its due
date (one day when it has only one of them, from its creation when it has
neither); a card in a list named done or complete is 100 % complete, a card
with the label Milestone a milestone, the people its resources, and what blocks
a card its finish-to-start predecessors.

### How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Microsoft Project (XML)**.
2. One `.zip` downloads, with one `.xml` per board you can export.

From a script:

```bash
python3 api.py exportallboards msproject boards.zip
```

### REST API

- Import: `POST /api/boards/import/msproject` with the XML text.
- Export: `GET /api/boards/:boardId/export/msproject`.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- The Project XML file: at most 67,108,864 characters (64 MB of text). More
  stops the import with an error. (`MAX_MS_PROJECT_LENGTH` in
  [models/lib/msProjectXmlFormat.js](../../../../../../models/lib/msProjectXmlFormat.js#L38))
- At most 100,000 tasks. More stops the import with an error.
  (`MAX_MS_PROJECT_TASKS` in
  [models/lib/msProjectXmlFormat.js](../../../../../../models/lib/msProjectXmlFormat.js#L39))
- Nesting deeper than 64 levels is not followed. More stops the import with an
  error. (`MAX_DEPTH` in
  [models/lib/msProjectXmlFormat.js](../../../../../../models/lib/msProjectXmlFormat.js#L41))
- A task with only a finish or only a start date gets a start or finish one day
  (86,400,000 ms) from it. (`DAY` in
  [models/lib/msProjectXmlFormat.js](../../../../../../models/lib/msProjectXmlFormat.js#L251))

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
[models/lib/msProjectXmlFormat.js](../../../../../../models/lib/msProjectXmlFormat.js).

The tests that pin it:
[tests/msProjectXml.test.cjs](../../../../../../tests/msProjectXml.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

The XML is MSPDI, the schema at `http://schemas.microsoft.com/project`:
`<Project>` with its Name and Title, `<Tasks>` with a `<Task>` per row of the
Gantt chart (UID, OutlineLevel, Summary, Milestone, Start, Finish,
ActualFinish, Duration as `PT8H0M0S`, PercentComplete, Priority 0-1000, Notes,
`<PredecessorLink>`), `<Resources>` and `<Assignments>`. Task UID 0 at outline
level 0 is the project's own summary row. WeKan reads it with a small XML
reader of its own that never resolves a DTD or an entity, so nothing in the file
can make it read another file (`models/lib/msProjectXmlFormat.js`).

### What is kept

Summary tasks at outline level 1 as swimlanes, every other task as a card
(a summary task further down is the parent card of the tasks under it), the
lists **Not started**, **In progress** and **Completed** by PercentComplete,
the start, finish (due), actual finish (end) and created dates, Notes as the
description, Milestone as a label, the assigned resources as the owner and
assignees, predecessors as "blocked by" dependencies, the UID as the card's
reference, and Priority (when not 500), the duration in hours, the percent
complete and WBS as custom fields.

### What is not kept

Calendars, baselines, extended attributes and the work and cost of
assignments; a link type other than finish-to-start is imported as blocked-by,
and a link's lag is not kept (both reported). On export: comments, checklists,
labels other than Milestone and attachments. What was left out is listed in the import's loss report, also in
**Admin Panel → Problems → Recovery**.

### How it is built and tested

`tests/msProjectXml.test.cjs` reads a plan with phases, a milestone, a
completed task, a nested summary task, resources, assignments and links of two
types; reads Project's durations; writes a board with lanes, subtasks, people
and a dependency and reads it back; and refuses broken XML, and never expands
a DOCTYPE's entity.

## Commits

 - [Import and export Azure DevOps Boards, Microsoft Lists, Project, Outlook, Teams and OneNote](https://github.com/wekan/wekan/commit/01e88410cd7440b26c5f845d98ae058f93c16a85)
