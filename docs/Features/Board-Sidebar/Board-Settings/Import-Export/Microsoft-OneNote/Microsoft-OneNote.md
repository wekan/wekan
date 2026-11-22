# Microsoft OneNote

## What it is

WeKan imports a notebook of [Microsoft OneNote](https://www.microsoft.com/microsoft-365/onenote),
fetched from Microsoft Graph, and exports a board as OneNote pages.

## Read more

- [Wikipedia: Microsoft OneNote](https://en.wikipedia.org/wiki/Microsoft_OneNote)
- [OneNote API overview](https://learn.microsoft.com/graph/integrate-with-onenote)
- [Get OneNote content and structure](https://learn.microsoft.com/graph/onenote-get-content)
- [Create OneNote pages](https://learn.microsoft.com/graph/onenote-create-page)
- [Use note tags in OneNote pages](https://learn.microsoft.com/graph/onenote-note-tags)

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. In Microsoft Graph Explorer (developer.microsoft.com/graph/graph-explorer),
   sign in, consent to the **Notes.Read** permission and copy the token from the
   **Access token** tab.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → Microsoft OneNote**, paste the
   token and click **List**. The token is used for this fetch only and is not
   stored.
3. Choose a notebook and click **Fetch**, then **Import**.

The `.zip` WeKan exports for OneNote, or the JSON a fetch returns, can be
chosen as a file instead.

### How to import many boards at once

1. On the import page, choose **Microsoft OneNote**, then under **Import many boards**
   choose several files.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Microsoft OneNote is imported through the generalized importer
(`models/kanboardCreator.js`), so the page also has the checkbox **One board
per project**.

From a script:

```bash
python3 api.py importboardsfrom onenote FILE_OR_DIR ...
```

### How to export

1. Open the board, then **Board Settings → Export**, and choose **Microsoft
   OneNote**. The board downloads as `<board>.zip`.
2. The `.zip` has a page per card under `<notebook>/<section>/`, each in the
   XHTML Graph's **create page** takes (`POST /me/onenote/sections/{id}/pages`),
   so a script can send them to a section; `onenote.json` beside them is the
   same notebook in the shape WeKan reads back.

A list is a section, a card a page: its title, created time, description as
paragraphs and checklist items as to-do boxes, ticked when done; a subtask is a
subpage of its parent.

### How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Microsoft OneNote**.
2. One `.zip` downloads, with one `.zip` per board you can export.

From a script:

```bash
python3 api.py exportallboards onenote boards.zip
```

### REST API

- Import: `POST /api/boards/import/onenote` with the JSON, or `{ "zipBase64": "..." }` for the `.zip`.
- Export: `GET /api/boards/:boardId/export/onenote`.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- At most 5,000 API requests. More stops the import with an error.
  (`MAX_ONENOTE_REQUESTS` in
  [models/lib/apiImport/onenote.js](../../../../../../models/lib/apiImport/onenote.js#L11))
- At most 20,000 pages. More stops the import with an error.
  (`MAX_ONENOTE_PAGES` in
  [models/lib/apiImport/onenote.js](../../../../../../models/lib/apiImport/onenote.js#L12))

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
- **Reading from the service's API**: each request may take 30 seconds and
  answer at most 32 MB, with no redirects followed
  ([server/lib/apiImportRequest.js](../../../../../../server/lib/apiImportRequest.js));
  each text field read is cut to 4,096 characters
  ([models/lib/apiImportServices.js](../../../../../../models/lib/apiImportServices.js)).

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
[models/lib/apiImport/onenote.js](../../../../../../models/lib/apiImport/onenote.js),
[models/lib/onenoteApiFormat.js](../../../../../../models/lib/onenoteApiFormat.js).

The tests that pin it:
[tests/onenoteApiImport.test.cjs](../../../../../../tests/onenoteApiImport.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

Graph lists the notebooks (`/me/onenote/notebooks`), their sections and each
section's pages (title, level, order, createdDateTime); a page's content is its
HTML (`/me/onenote/pages/{id}/content`): a `<title>`, `<meta name="created">`,
then outlines of paragraphs, lists and tables, `<img>` and `<object>` for
files, and a note tag as `data-tag` on an element - `to-do` an open to-do box,
`to-do:completed` a ticked one (`models/lib/onenoteApiFormat.js`,
`models/lib/apiImport/onenote.js`).

### What is kept

Sections as lists, pages as cards in their order, the page's text as the
description, its to-do boxes as the checklist **To-do**, a subpage (level 1 or
2) as a subtask of the page above it, and the page's created time. A board with
several notebooks would have one swimlane per notebook.

### What is not kept

Images and files on a page (counted), note tags other than to-do, ink,
formatting and the page's layout. On export: comments, labels, dates other than
the created time and attachments. What was left out is listed in the import's loss report, also in
**Admin Panel → Problems → Recovery**.

### How it is built and tested

`tests/onenoteApiImport.test.cjs` reads a page as Graph answers it - with
to-do boxes, another note tag, an image and a file - with a subpage and an
empty page; writes a board as pages and reads `onenote.json` back; reads the
exported `.zip`; fetches through the API client from a fake Graph; and refuses
data that is not a fetch, a next link to another host and a path the export
does not write.

## Commits

 - [Fix CodeQL alerts #609 and #610: a OneNote page's removals are one replace](https://github.com/wekan/wekan/commit/cc4a494185bcb947a4195830887c2bf72a0a98e0)
 - [Fix CodeQL alerts #605-#608 in the OneNote and Sandstorm grain formats](https://github.com/wekan/wekan/commit/3f5e4f3f14adb42af5eb486fb393ec143833e392)
 - [Import and export Sandstorm grain backups](https://github.com/wekan/wekan/commit/6f3f6cc5a83df1b91a40d6afae261a74cf5b6507)
 - [Outlook and OneNote exports: the files are written after the export boundary](https://github.com/wekan/wekan/commit/20c67216fe627eedc72a02c3536aef8024aabb8c)
 - [Import and export Azure DevOps Boards, Microsoft Lists, Project, Outlook, Teams and OneNote](https://github.com/wekan/wekan/commit/01e88410cd7440b26c5f845d98ae058f93c16a85)
