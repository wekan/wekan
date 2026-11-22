# Zenkit

## What it is

WeKan imports boards from [Zenkit](https://zenkit.com/) and exports a board in
the same shape. It reads two shapes of JSON: a list as Zenkit's API returns it
(the list, its elements and its entries), and a simpler adapter shape
`{ title, stages, items }`. Stages become lists and items become cards. In
WeKan's menus the tool is named **Zenkit**.

Zenkit does not publish a schema for its single-file JSON export, so WeKan
does not claim to read that file; see Format details.

## Read more

- [Wikipedia: kanban boards](https://en.wikipedia.org/wiki/Kanban_board)
- [Zenkit API documentation](https://public.zenkit.com/documentation): lists,
  elements and entries
- [Zenkit list actions](https://help.zenkit.com/en/support/solutions/articles/43000585496-list-actions):
  Generate JSON
- WeKan discussion #4487,
  [kjgcoop/very-rough-wekan-from-zk](https://github.com/kjgcoop/very-rough-wekan-from-zk)
  and its fork [wekan/very-rough-wekan-from-zk](https://github.com/wekan/very-rough-wekan-from-zk):
  an earlier Zenkit to WeKan converter

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. Get the list as JSON. Two ways work:
   - From Zenkit's [API](https://public.zenkit.com/documentation): the list,
     its elements (the fields) and its entries in one object, as
     `{ "list": {...}, "elements": [...], "entries": [...] }`.
   - In the adapter shape, written by hand or by a script of your own:
     `{ "title", "stages": [...], "items": [...] }`. An earlier converter,
     [very-rough-wekan-from-zk](https://github.com/wekan/very-rough-wekan-from-zk),
     is described in discussion #4487.
   Zenkit also offers **Generate JSON** in a list's settings
   ([list actions](https://help.zenkit.com/en/support/solutions/articles/43000585496-list-actions)).
   Its layout is not documented, so check the loss report after importing it.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → Zenkit**.
3. Paste the JSON into the text box. Tick the parts to import.
4. Click **Import**. Zenkit has no member-mapping step in WeKan, so the people
   in the file do not become card members.
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

### How to import many boards at once

- On the import page, under **Import many boards**, choose several Zenkit JSON
  files, or one `.zip` that holds them. Each file becomes its own board,
  imported without member mapping. Members can be mapped later. Click **Import**
  to import them.
- The checkbox **One board per project** makes no difference for Zenkit: a
  list is imported into one swimlane, **Default**, so each file is always one
  board.
- From a script:
  `python3 api.py importboardsfrom zenkit FILE_OR_DIR ...` takes files,
  directories of files, or `.zip` files.

### How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Under **Select what to include:**, tick the parts to export.
3. Under **JSON**, choose **Zenkit**. The board downloads as a `.json` file in
   the adapter shape.
4. Zenkit does not document a JSON import, so it cannot be said to read this
   file; see [Zenkit's help](https://help.zenkit.com/). The file is what
   WeKan's own Zenkit import reads.

### How to export all boards at once

1. **All Boards → sidebar → Export all boards**, then choose **Zenkit**.
   This downloads one `.zip` with one Zenkit file per board you can
   export: boards you are a member of, that are not archived and are not
   templates. A board you may not export is left out and named in
   `skipped.txt` in the `.zip`.
2. To export only some boards, use **Multi-Selection** in the All Boards
   sidebar, select the boards, then **Export**.

From a script: `python3 api.py exportallboards zenkit boards.zip`.

### REST API

```bash
python3 api.py importboardfrom zenkit list.json               # POST /api/boards/import/zenkit
python3 api.py importboardsfrom zenkit a.json b.json dir/     # one board per file
python3 api.py exportboardformat BOARDID zenkit list.json     # GET /api/boards/BOARDID/export/zenkit?authToken=TOKEN
python3 api.py exportallboards zenkit boards.zip              # GET /api/export-all-boards/zenkit?authToken=TOKEN
```

`GET /api/export-all-boards/zenkit?authToken=TOKEN&boardIds=ID1,ID2` exports
only the boards listed.

## How the numbers are calculated

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

The tests that pin it:
[tests/externalExportRoundTrip.test.cjs](../../../../../../tests/externalExportRoundTrip.test.cjs),
[tests/importedTaskPlan.test.cjs](../../../../../../tests/importedTaskPlan.test.cjs),
[tests/playwright/specs/import-export-format-audit.e2e.js](../../../../../../tests/playwright/specs/import-export-format-audit.e2e.js),
[tests/zenkitImport.test.cjs](../../../../../../tests/zenkitImport.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

From the [format coverage](../Format-Coverage.md) audit:

- **Current authoritative shape:** the current documented export accepted by
  the selected Zenkit product.
- **Required import coverage:** collections/lists, stages, items, hierarchy,
  members, dates, labels and exported custom fields; unknown fields are kept
  in the loss report because Zenkit products differ.
- Zenkit is one of the external adapters that map the listed fields that have
  a WeKan equivalent: parent hierarchy and dependencies between items of the
  same import, custom-field values as typed board custom fields, start and
  creation dates, several assignees and source order. Creation dates survive
  the schema's `createdAt` autoValue through `writeImportedEntity`. Files,
  cross-list references and formula results are reported. Zenkit's API
  entries are read with the value keys its API client documents; its
  single-file export remains unverified because no schema is published.

What the current code does (`parseZenkit` in `models/lib/externalParsers.js`):

**API shape.** An entry's field values are keys named after the element:
`<uuid>_text`, `_number`, `_date`, `_categories_sort`, `_persons_sort` and
`_references_sort`.

- The stage is the first categories field whose name says stage, status,
  state or column, else the first categories field. Its predefined categories
  give the list order; an entry without a stage goes to **Inbox**.
- The description is a text field named description, notes or details. The
  due and start dates are date fields named due, deadline or end, and start or
  begin.
- Other text, URL, number and date fields become custom fields. Other
  categories fields become labels.
- Person fields give the owner and assignees, a hierarchy field the parent,
  and dependency fields related-to links.
- Entries with `deprecated_at` (deleted) are skipped, with a warning. Entries
  are sorted by `sortOrder`.

**Adapter shape.** Each item may have `title` (or `name`), `description` (or
`notes`), `stage_name` (or `stageName`, `list`), `due` (or `dueDate`,
`due_date`), `start`, `created_at`, `tags`, `assignee` or `assignees`, `id`
(or `uuid`), `parent_id` (or `parentId`), `fields`, `comments` and
`checklists`. Any other key is reported.

### What is kept

| Zenkit | WeKan |
| --- | --- |
| `list.name` (API), `title` (adapter) | Board title |
| Stage | List |
| `displayString` (API), `title` (adapter) | Card title |
| Description field, `description` | Card description |
| Due date and start date fields, `due`, `start` | Due date, start date |
| `created_at` | Creation date |
| Person fields, `assignees` | Card members, when mapped |
| `created_by_displayname` (API) | Requested by |
| Categories fields, `tags` | Labels |
| Text, URL, number and date fields, `fields` | Custom fields |
| `uuid`, `id` | Source reference, for parent and dependency links |
| Hierarchy field, `parent_id` | Parent card |
| Dependency fields (API) | Related-to dependencies |
| `checklists` (`name`, `items` with `text` and `checked`) | Checklists |
| `comments` (adapter) | Comments |

The export writes the adapter shape: `title`, a stage per list, and per card
`id`, `title`, `description`, `stage_name`, `due`, `tags`, `start`,
`created_at`, `parent_id`, the owner and further people as `assignees`, the
custom fields as `fields`, the checklists and the comments.

### What is not kept

The import reports these on the loss report:

- file fields (files are not part of the export, and Zenkit publishes no API
  for downloading one, so WeKan does not fetch them);
- reference fields to other lists;
- formula fields (results are computed by Zenkit);
- field types with no documented value format;
- comments of API entries (`comment_count`: they are fetched separately from
  Zenkit);
- unrecognized keys of adapter items;
- deleted entries, as a warning;
- more than 50 custom fields, duplicate ids, and parents or dependencies that
  point outside the file.

Zenkit has no member mapping in WeKan, so assignees do not become card
members.

The export leaves out swimlanes, archived cards and lists, end dates,
dependencies and attachments.

### How it is built and tested

- `models/lib/externalParsers.js` (`parseZenkit`) reads both shapes.
  `models/kanboardCreator.js` creates the board, and
  `models/lib/importedTaskPlan.js` decides what each item becomes.
- `models/lib/externalExportFormatters.js` (`zenkit`) writes the export, from
  what `models/lib/externalExporters.js` collects.
- Unit tests: `tests/zenkitImport.test.cjs`, `tests/importedTaskPlan.test.cjs`
  and `tests/externalExportRoundTrip.test.cjs`. The fixtures are
  `tests/fixtures/import-formats/zenkit-adapter.json` and `zenkit-api.json`.
- Playwright: `tests/playwright/specs/import-export-format-audit.e2e.js`
  (importing the adapter fixture through the page, refusing malformed JSON,
  and API entries importing stages, checklists, fields and hierarchy).

## Commits

 - [JSON exports whose cards are one array are written a page at a time: Trello, Jira, Asana, Zenkit, OpenProject, GitHub ](https://github.com/wekan/wekan/commit/f293ae4076092a387505b1909053cd66a62441c8)
 - [Import Zenkit API entries and the adapter shape's hierarchy, members and fields](https://github.com/wekan/wekan/commit/13ea3e9c6d57533ef6ab5dfd4b4cb1080d2ba79f)
