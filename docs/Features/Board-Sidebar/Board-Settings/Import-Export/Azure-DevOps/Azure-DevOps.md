# Azure DevOps Boards

WeKan imports the work items of an [Azure DevOps Boards](https://learn.microsoft.com/azure/devops/boards/)
query, and exports a board as the CSV file Azure DevOps' own **Import from CSV**
reads.

## How to import

1. In Azure DevOps, open **Boards → Queries**, run a query that shows the
   columns you want (for example ID, Work Item Type, Title, Assigned To, State,
   Tags, Board Column, Description), and choose **⋯ → Export to CSV**. A tree
   query writes Title 1, Title 2, ... and keeps the parent and child items.
2. In WeKan, go to **All Boards → New → Import → Azure DevOps Boards**.
3. Choose the `.csv` file, or paste its text.
4. Map the people to WeKan members, or leave them as they are.
5. Click **Import**.

## How to import many boards at once

1. On the import page, choose **Azure DevOps Boards**, then under **Import many boards**
   choose several files.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Azure DevOps Boards is imported through the generalized importer
(`models/kanboardCreator.js`), so the page also has the checkbox **One board
per project**.

From a script:

```bash
python3 api.py importboardsfrom azuredevops FILE_OR_DIR ...
```

## How to export

1. Open the board, then **Board Settings → Export**, and choose **Azure DevOps
   Boards**. The board downloads as `<board>.csv`.
2. In Azure DevOps, open **Boards → Work items → Import from CSV** and choose
   the file.

Every row is a new work item (its ID is empty). Its type is the card's first
label named after a work item type of the built-in processes (Epic, Feature,
User Story, Product Backlog Item, Requirement, Bug, Task, Issue, ...), else
**Task**. Its State is the card's list when the list is named after a state of
those processes (New, Active, Resolved, Closed, To Do, Doing, Done, ...); a list
of another name is written as a tag and the work item starts in its type's
first state. Priority, Story Points, Effort, Area Path and the other fields are
written only when a card of the board has them, so a board that never came from
Azure DevOps gets no column its process may not have. The description is
written as the HTML the field holds; **Assigned To** is the card's owner, which
Azure DevOps has to find among its users.

## How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Azure DevOps Boards**.
2. One `.zip` downloads, with one `.csv` per board you can export.

From a script:

```bash
python3 api.py exportallboards azuredevops boards.zip
```

## Format details

Export to CSV writes the query's columns by their display names; a person is
`Display Name <address>`, tags are joined with `; `, and a date is in the
exporting user's regional format (`11/20/2026 3:14:00 PM`, `20.11.2026 15.14`,
`20/11/2026 15:14`) - a file whose slash dates have a first part above 12 is
read day first (`models/lib/microsoftCsvDates.js`). **Board Column** (when the
query has it, else **State**) is the list and **Board Lane** the swimlane
(`models/lib/azureDevOpsCsvFormat.js`).

## What is kept

Work items as cards in their Board Column or State, Board Lane as swimlanes,
the work item type and tags as labels, the ID as the card's reference, the
parent (the Parent column, or the tree query's levels) as the parent card, the
title, the description with Acceptance Criteria and Repro Steps (HTML read as
text), Assigned To as the owner, Created By as "requested by", the created,
start, target and closed dates, Completed Work as spent time, and every other
column - Priority, Story Points, Area Path, Iteration Path, ... - as a custom
field.

## What is not kept

Changed Date, Changed By, Rev, History, Activated and Resolved dates and the
Board Column Done flag (reported); links other than the parent, attachments and
the discussion, which Export to CSV does not write. On export: the dates,
comments, checklists as items, and the parent of a card. What was left out is listed in the import's loss report, also in
**Admin Panel → Problems → Recovery**.

## REST API

- Import: `POST /api/boards/import/azuredevops` with the CSV text.
- Export: `GET /api/boards/:boardId/export/azuredevops`.

## How it is built and tested

`tests/azureDevOpsCsv.test.cjs` reads a query export with HTML descriptions,
regional dates, a parent and custom fields, a tree query's Title 1/2/3 levels,
day-first dates, writes a board and reads it back, writes the header once over
pages, and refuses a file without a Title.

## Sources

- [Import or update work items in bulk by using CSV files](https://learn.microsoft.com/azure/devops/boards/queries/import-work-items-from-csv)
- [Export a list of work items](https://learn.microsoft.com/azure/devops/boards/queries/view-run-query#export-a-query)
- [Default processes and work item types](https://learn.microsoft.com/azure/devops/boards/work-items/guidance/choose-process)
