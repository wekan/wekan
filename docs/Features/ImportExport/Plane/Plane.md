# Plane

WeKan imports boards from [Plane](https://plane.so), the open source project
tracker. It reads Plane's issue export (work items, in Plane's current
documentation): the `.zip` that Plane writes, an Excel file from inside it, or
one JSON or CSV file from it. States become lists, projects become swimlanes,
and issues become cards. WeKan does not export to Plane.

## How to import

1. In Plane, a workspace admin goes to **Workspace settings** and selects
   **Exports**.
2. Choose all projects or one project, choose the format (**CSV**, **Excel**
   or **JSON**), and click **Export**. Plane packages the export into a `.zip`.
3. Download the file from **Previous exports**. Plane keeps an export
   downloadable for 7 days; after that it shows as *Expired*.
4. In WeKan, go to **All Boards → New → Import → Plane**.
5. Choose the `.zip` file, or one `.xlsx`, `.json` or `.csv` file from inside
   it, or paste the JSON or CSV text into the text box. Click **Import**.
   Members are not mapped on the way in; they can be mapped later.
6. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

Prefer the **JSON** or **CSV** export: Plane's Excel export writes links,
relations and comments as Python text, which WeKan does not read.

## How to import many boards at once

1. On the import page, under **Import many boards**, choose several files.
   Each file becomes its own board, imported without member mapping (members
   can be mapped later). A Plane export `.zip` is itself one export, so it is
   one board: to import several, choose several of those `.zip` files.
2. Plane exports are imported through the generalized importer, so there is
   also a checkbox **One board per project**. It makes each swimlane the
   import would create its own board, named after that swimlane. For Plane
   the swimlanes are the **projects**, so an export of all projects becomes
   one board per project. An export of one project has a single swimlane, so
   the option makes no difference for it.
3. Parent issues and relations (blocked by, relates to, duplicate) between
   issues that end up on different boards are reported in the loss report
   rather than kept.

From a script:

```bash
python3 api.py importboardsfrom plane FILE_OR_DIR ...
```

It takes files, directories of files, or `.zip` files.

## How to export

WeKan offers no Plane export. Plane's Community Edition has no import for its
own export format, so there is no file WeKan could write that Plane would read
back.

## How to export all boards at once

There is no Plane export, so Plane is not offered under **Export all boards**
either.

## Format details

WeKan reads the issue export of [Plane](https://github.com/makeplane/plane)
(Workspace Settings → Exports, CSV, JSON or XLSX), as Plane's own source code
writes it:

- **The archive.** A `.zip` holding one `<slug>-<projectId>.<ext>` per
  project, or one `<slug>-<workspaceId>.<ext>`, as
  [`bgtasks/export_task.py`](https://github.com/makeplane/plane/blob/preview/apps/api/plane/bgtasks/export_task.py)
  writes it.
- **The fields** are those of the `IssueExportSerializer` of
  [`utils/porters/serializers/issue.py`](https://github.com/makeplane/plane/blob/preview/apps/api/plane/utils/porters/serializers/issue.py):
  project_name, project_identifier, parent, identifier, sequence_id, name,
  state_name, priority, assignees, subscribers, created_by_name, start_date,
  target_date, completed_at, created_at, updated_at, archived_at, estimate,
  labels, cycles, modules, links, relations, comments, sub_issues_count,
  link_count, attachment_count and is_draft.
- **The three formats**, from the formatters of
  [`utils/porters/formatters.py`](https://github.com/makeplane/plane/blob/preview/apps/api/plane/utils/porters/formatters.py):
  - JSON is a list of issue objects.
  - CSV has the keys as prettified headers (`State Name`), lists as JSON
    text, and a `'` before text that starts with `=`, `+`, `-` or `@` (or a
    tab or line break). WeKan removes that `'`.
  - XLSX has the same headers, with lists joined by `, `. Names come back
    from that, but links, relations and comments are written as Python text,
    not JSON, so WeKan reports them instead of guessing.
- **What can be chosen.** The `.zip`, or an `.xlsx` from it, is uploaded; a
  JSON or CSV file is chosen or pasted. A CSV or XLSX file needs the Name and
  State Name columns.
- **Limits.** The server opens the zip and the workbook under size,
  entry-count and inflate limits: at most 64 MB uploaded, 1,000 files in the
  zip, 64 MB per file and 128 MB inflated in all. An export may hold at most
  20,000 issues. Nothing is written to disk.
- **Dates.** start_date and target_date are calendar days in UTC; the `*_at`
  fields are ISO 8601.
- **Board title.** The project's name when the export has one project, else
  *Imported Plane issues*. With one project, its cards go into the
  **Default** swimlane. Two projects with the same name are told apart by the
  identifier, as `Name (WEB)`.

Plane's [export documentation](https://docs.plane.so/core-concepts/export)
also describes a *Custom Export* (a Pro feature) from a work item view. WeKan
is tested with the workspace export described above.

## What is kept

| Plane | WeKan |
| --- | --- |
| state_name | List, in the order states first appear (**No state** when empty) |
| project_name | Swimlane, when the export has several projects; with one, the board title |
| name | Card title |
| identifier (`WEB-42`) | The card's reference |
| parent | Parent card |
| assignees | Owner, then assignees |
| created_by_name | Requested by |
| subscribers | Watchers (when mapped to members) |
| labels | Labels |
| start_date, target_date | Start date, due date |
| completed_at, created_at | End date, created date |
| archived_at (any date) | Archived card |
| priority (urgent, high, medium, low) | Custom field Priority |
| estimate | Custom field Estimate |
| cycles, modules | Custom fields Cycle and Module |
| links | A **Links:** list in the card description |
| comments | Comments, with author and date |
| relations blocked_by, relates_to, duplicate | Dependencies: is blocked by / blocks, related to, duplicates / is duplicated by |

A relation that Plane lists on both issues is kept once.

## What is not kept

The import reports these on the loss report, rather than dropping them
silently:

- the description, which Plane's export does not contain (reported once);
- attachments: the export has only their count;
- updated_at;
- draft issues (they are imported as ordinary cards);
- the start_before, finish_before and implemented_by relations, which have no
  WeKan dependency type;
- unknown fields;
- in XLSX, the links, relations and comments, which Plane writes as Python
  text rather than JSON;
- in CSV, a list cell that is not a JSON list;
- links that are not `http(s)` or `mailto` links;
- priorities other than urgent, high, medium, low or none;
- dates that are not ISO 8601 dates;
- issues without a name.

Plane's export has no state order or colors, so lists are ordered by first
appearance and get no color.

## REST API

```bash
python3 api.py importboardfrom plane export.zip          # POST /api/boards/import/plane
python3 api.py importboardsfrom plane a.zip b.zip
```

- `POST /api/boards/import/plane` imports one export. `api.py` sends a `.zip`
  as `{zipBase64}`, an `.xlsx` as `{xlsxBase64}`, and a JSON or CSV file as
  its text.

There is no Plane export, so there are no export commands or routes.

## How it is built and tested

- `models/lib/planeFormat.js` reads the issues in all three formats.
  `server/lib/planeArchive.js` opens the `.zip` and the workbook with bounded
  inflation.
- The parser is registered as `plane` in `models/lib/externalParsers.js`.
- `tests/planeFormat.test.cjs` is the unit test.
- The Playwright cases are in
  `tests/playwright/specs/import-export-format-audit.e2e.js`: *Plane: an
  export .zip imports through the page with its states, projects, parent,
  comment and fields*, and *Plane: a pasted JSON export imports, and broken
  text or a zip without export files is refused*.

## Sources

- [Plane: Export work items](https://docs.plane.so/core-concepts/export):
  where the export is, its formats, and the 7-day download window
- [`apps/api/plane/bgtasks/export_task.py`](https://github.com/makeplane/plane/blob/preview/apps/api/plane/bgtasks/export_task.py):
  how the `.zip` and its file names are written
- [`apps/api/plane/utils/porters/serializers/issue.py`](https://github.com/makeplane/plane/blob/preview/apps/api/plane/utils/porters/serializers/issue.py):
  the exported fields
- [`apps/api/plane/utils/porters/formatters.py`](https://github.com/makeplane/plane/blob/preview/apps/api/plane/utils/porters/formatters.py):
  how JSON, CSV and XLSX write those fields

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).
