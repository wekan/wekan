# OPML

## What it is

WeKan imports and exports a board as an [OPML 2.0](http://opml.org/spec2.opml)
outline, the format that Workflowy, Dynalist, OmniOutliner, Logseq and most
other outliners export and import. Top-level items are lists, their children
are cards, and deeper items are checklists. An item's note is the card's
description, and a completed item is a done card.

## Read more

- [Wikipedia: OPML, the outline file format](https://en.wikipedia.org/wiki/OPML)
- [OPML 2.0 specification](http://opml.org/spec2.opml): the outline format
- [Workflowy: Exporting](https://workflowy.com/help/exporting): export steps
- [WorkFlowy now supports OPML import and export](https://blog.workflowy.com/workflowy-now-supports-opml-import-and-export/):
  importing OPML by pasting
- [Dynalist: Import data](https://help.dynalist.io/article/78-import-data):
  importing an OPML file
- [Logseq: Export](https://raw.githubusercontent.com/logseq/docs/master/pages/Export.md):
  exporting a page as OPML

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. Export the outline as OPML from the outliner:
   - **Workflowy**: open the bullet menu of the item to export, click
     **Export** and choose OPML; for the whole account, **Settings → Export
     all**. See [Workflowy: Exporting](https://workflowy.com/help/exporting).
   - **Logseq**: right-click the page title, choose **Export** and then OPML.
     See [Logseq: Export](https://raw.githubusercontent.com/logseq/docs/master/pages/Export.md).
   - **Dynalist** and **OmniOutliner**: see their own documentation.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → OPML**.
3. Paste the OPML text into the text box. For a `.opml` file, open it in a
   text editor and copy all of it.
4. Click **Import**.
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

Text that is not an OPML outline (no `<opml>` with a `<body>`) is refused, and
no board is created.

### How to import many boards at once

1. On the import page, choose **OPML**, then under **Import many boards**
   choose several `.opml` files, or one `.zip` that holds them.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

OPML outlines are imported through the generalized importer
(`models/kanboardCreator.js`, created from the parsed outline the way the
sources in `EXTERNAL_PARSERS` in `models/lib/externalParsers.js` are), so the
page also has a checkbox **One board per project**: each swimlane the import
would create becomes its own board, named after that swimlane. An OPML import
puts every card in the swimlane **Default**, so for OPML the option makes no
difference.

Links between cards that end up on different boards are reported in the loss
report rather than kept. OPML outlines carry no links between cards.

From a script:

```bash
python3 api.py importboardsfrom opml FILE_OR_DIR ...
```

Each argument is a file, a directory of files, or a `.zip` file.

### How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Choose what to include, then under **JSON** choose **OPML**. The board
   downloads as `<board>.opml`.
3. Bring the file into the outliner:
   - **Workflowy**: paste the OPML text into any item; Workflowy turns it into
     a nested list. See
     [WorkFlowy now supports OPML import and export](https://blog.workflowy.com/workflowy-now-supports-opml-import-and-export/).
   - **Dynalist**: import the `.opml` file, or paste its content into a
     document. See [Dynalist: Import data](https://help.dynalist.io/article/78-import-data).
   - **Logseq**, **OmniOutliner** and others: see their own documentation.

The OPML entry is offered for a whole board only, not for a swimlane or a
list.

### How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **OPML**.
2. One `.zip` downloads, with one file per board you can export: boards you
   are a member of that are not archived and not templates.

To export only some boards, use **Multi-Selection** in the All Boards
sidebar, select the boards, then **Export**.

From a script:

```bash
python3 api.py exportallboards opml boards.zip
```

### REST API

```bash
python3 api.py importboardfrom opml outline.opml          # POST /api/boards/import/opml
python3 api.py importboardsfrom opml FILE_OR_DIR ...      # several boards
python3 api.py exportboardformat BOARDID opml outline.opml
python3 api.py exportallboards opml boards.zip
```

The HTTP routes:

- `POST /api/boards/import/opml` with the file's text as `board`;
- `GET /api/boards/:boardId/export/opml?authToken=…` returns the file as
  `text/x-opml`;
- `GET /api/export-all-boards/opml?authToken=…` returns the `.zip`; add
  `&boardIds=ID1,ID2` for only those boards.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- The OPML file: at most 16,777,216 characters (16 MB of text). More stops the
  import with an error. (`MAX_OPML_LENGTH` in
  [models/lib/opmlOutline.js](../../../../../../models/lib/opmlOutline.js#L34))
- Nesting deeper than 64 levels is not followed. (`MAX_OPML_DEPTH` in
  [models/lib/opmlOutline.js](../../../../../../models/lib/opmlOutline.js#L37))
- At most 100,000 outline nodes. More stops the import with an error.
  (`MAX_OPML_NODES` in
  [models/lib/opmlOutline.js](../../../../../../models/lib/opmlOutline.js#L38))

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
[models/lib/opmlOutline.js](../../../../../../models/lib/opmlOutline.js),
[models/lib/opmlOutlineFormat.js](../../../../../../models/lib/opmlOutlineFormat.js),
[server/lib/opmlImport.js](../../../../../../server/lib/opmlImport.js).

The tests that pin it:
[tests/importLossReport.test.cjs](../../../../../../tests/importLossReport.test.cjs),
[tests/opmlOutline.test.cjs](../../../../../../tests/opmlOutline.test.cjs),
[tests/playwright/specs/import-export-format-audit.e2e.js](../../../../../../tests/playwright/specs/import-export-format-audit.e2e.js).

The details of the format, what is kept and how it is tested are below.

### Format details

The format is an [OPML 2.0](http://opml.org/spec2.opml) outline as Workflowy,
Dynalist, OmniOutliner, Logseq and most outliners export it, with their
`_note` and `_complete` (or Dynalist's `complete`) attributes.

What the import must cover:

- top-level outlines become lists;
- their children become cards, with `_note` as the description and a
  completed item as the `done` label;
- deeper outlines become checklists, with their descendants as items
  (completed = finished);
- the head title becomes the board title;
- on a card, OPML 2.0's `created` becomes the creation date and `category`
  the labels, a `url` / `htmlUrl` / `xmlUrl` link goes at the end of the
  description, and any other attribute (OmniOutliner writes its columns this
  way) becomes a custom field;
- a list's note, and an attribute of a list or a checklist item, are
  reported.

The export writes the same, with Workflowy's attribute names. Line breaks in
notes survive as `&#10;`. The file is parsed on the server only, and DTDs and
external entities are never resolved.

What the current code does (`models/lib/opmlOutline.js`):

- An item's text is its `text` attribute, or `title` when there is no `text`.
- An item is complete when `_complete="true"` (Workflowy) or
  `complete="true"` (Dynalist).
- A level 3 outline with children is a checklist named after it; all its
  descendants are the items. Level 3 outlines without children are the items
  of one checklist named after the card.
- The board title is `<head><title>`. Without one, the board is called
  "Imported OPML outline".
- Limits: 16 MB of text, 100,000 outlines and 64 levels. Deeper outlines are
  not read, and that is reported.
- Every card goes to the swimlane Default.

What the export writes (`models/lib/opmlOutlineFormat.js`):

- `<opml version="2.0">` with the board title in `<head><title>`;
- each list as a top-level `<outline text="…">`, including lists without
  cards;
- each card as a child outline, with its description as `_note`,
  `_complete="true"` when its list's name looks finished (contains "done",
  "closed", "complete", "archiv" or "finished"), its creation date as
  `created` (RFC 822) and its labels as `category`;
- each checklist as a child of the card, with its items as children,
  `_complete="true"` when finished.

Line breaks and tabs in text are written as `&#10;` and `&#9;`, so an XML
reader gives them back. Archived cards and archived lists are not exported.

### What is kept

| OPML | WeKan |
| --- | --- |
| `<head><title>` | Board title |
| Top-level `<outline>` | List |
| Level 2 outline: `text` (or `title`) | Card title |
| Level 2 outline: `_note` | Card description |
| Level 2 outline: `_complete` / `complete` = true | Card with the label `done` |
| Level 2 outline: `created` | Creation date |
| Level 2 outline: `category` (comma-separated, leading `/` taken off) | Labels |
| Level 2 outline: `url`, `htmlUrl`, `xmlUrl` | A link at the end of the description |
| Level 2 outline: any other attribute | Custom field of that name (a leading `_` taken off) |
| Level 3 outline with children | Checklist, its descendants the items |
| Level 3 outline without children | Item of a checklist named after the card |
| Completed item | Finished checklist item |

### What is not kept

The import reports these on the loss report:

- a `_note` on a top-level (list) outline;
- an attribute of a list or a checklist item other than its text and
  complete state;
- a `created` that is not a date;
- outlines deeper than 64 levels.

`type`, `isComment` and `isBreakpoint` only say how an outliner draws a row,
and are not read.

The OPML export writes lists, cards, notes, the complete state, the creation
date, labels and checklists. It does not write swimlanes, other dates,
members, comments, custom fields or attachments.

### How it is built and tested

- `models/lib/opmlOutline.js` reads the outline; `server/lib/opmlImport.js`
  loads it on the server only, so the XML parser is not sent to browsers.
  `models/lib/opmlOutlineFormat.js` writes it.
- `models/import.js` parses the outline before the import's sanitizing, then
  sanitizes the parsed cards, and `models/kanboardCreator.js` creates the
  board.
- `tests/opmlOutline.test.cjs` is the unit test of the round trip.
  `tests/importLossReport.test.cjs` covers the loss report.
- The Playwright cases are in
  `tests/playwright/specs/import-export-format-audit.e2e.js`: "OPML: an
  outline imports with its lists, notes, checklist and done state", and the
  export menu link for every format.

## Commits

 - [OPML keeps created, category, links and an outliner's own attributes](https://github.com/wekan/wekan/commit/95b88095c45bf582a2fdc3056cf5030f0b61e57a)
 - [The Markdown, Obsidian, OPML and Org mode outlines and the Notion CSV are written a page of cards at a time](https://github.com/wekan/wekan/commit/ce40b56abdf5b166f523dab98a14414907809b1f)
 - [Text exports such as OPML are made from checked values, not stripped as HTML](https://github.com/wekan/wekan/commit/62eb9c5c297b71265c849726022194f9b68dfa69)
 - [Read every import source through one path and one file chooser, from one description of the sources](https://github.com/wekan/wekan/commit/c80a656901103bfd29b41843c7e255b4ed3bfa17)
 - [Import and export many boards at once for every format, and document each format in its own directory](https://github.com/wekan/wekan/commit/7858d84e127c2c6cd92134166352b9a4245d4ec2)
 - [Import and export boards as OPML outlines](https://github.com/wekan/wekan/commit/e6c8f85518a752b2b3f310907afc2485b11a948a)
