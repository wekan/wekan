# Microsoft Project

WeKan imports a plan saved by [Microsoft Project](https://www.microsoft.com/microsoft-365/project/project-management-software)
as XML, and exports a board as a plan Project opens. ProjectLibre and
GanttProject read and write the same XML. The `.mpp` file itself is a closed
binary format and is not read.

## How to import

1. In Microsoft Project, choose **File → Save As**, and as the type **XML
   Format (\*.xml)**.
2. In WeKan, go to **All Boards → New → Import → Microsoft Project (XML)**.
3. Choose the `.xml` file, or paste its text.
4. Map the people to WeKan members, or leave them as they are.
5. Click **Import**.

## How to import many boards at once

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

## How to export

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

## How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Microsoft Project (XML)**.
2. One `.zip` downloads, with one `.xml` per board you can export.

From a script:

```bash
python3 api.py exportallboards msproject boards.zip
```

## Format details

The XML is MSPDI, the schema at `http://schemas.microsoft.com/project`:
`<Project>` with its Name and Title, `<Tasks>` with a `<Task>` per row of the
Gantt chart (UID, OutlineLevel, Summary, Milestone, Start, Finish,
ActualFinish, Duration as `PT8H0M0S`, PercentComplete, Priority 0-1000, Notes,
`<PredecessorLink>`), `<Resources>` and `<Assignments>`. Task UID 0 at outline
level 0 is the project's own summary row. WeKan reads it with a small XML
reader of its own that never resolves a DTD or an entity, so nothing in the file
can make it read another file (`models/lib/msProjectXmlFormat.js`).

## What is kept

Summary tasks at outline level 1 as swimlanes, every other task as a card
(a summary task further down is the parent card of the tasks under it), the
lists **Not started**, **In progress** and **Completed** by PercentComplete,
the start, finish (due), actual finish (end) and created dates, Notes as the
description, Milestone as a label, the assigned resources as the owner and
assignees, predecessors as "blocked by" dependencies, the UID as the card's
reference, and Priority (when not 500), the duration in hours, the percent
complete and WBS as custom fields.

## What is not kept

Calendars, baselines, extended attributes and the work and cost of
assignments; a link type other than finish-to-start is imported as blocked-by,
and a link's lag is not kept (both reported). On export: comments, checklists,
labels other than Milestone and attachments. What was left out is listed in the import's loss report, also in
**Admin Panel → Problems → Recovery**.

## REST API

- Import: `POST /api/boards/import/msproject` with the XML text.
- Export: `GET /api/boards/:boardId/export/msproject`.

## How it is built and tested

`tests/msProjectXml.test.cjs` reads a plan with phases, a milestone, a
completed task, a nested summary task, resources, assignments and links of two
types; reads Project's durations; writes a board with lanes, subtasks, people
and a dependency and reads it back; and refuses broken XML, and never expands
a DOCTYPE's entity.

## Sources

- [Microsoft Project XML schema (MSPDI)](https://learn.microsoft.com/office-project/xml-data-interchange/introduction-to-project-xml-data)
- [Project XML elements: Task](https://learn.microsoft.com/office-project/xml-data-interchange/task-element)
