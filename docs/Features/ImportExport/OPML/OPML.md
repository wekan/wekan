# OPML

WeKan imports and exports a board as an [OPML 2.0](http://opml.org/spec2.opml)
outline, the format that Workflowy, Dynalist, OmniOutliner, Logseq and most
other outliners export and import. Top-level items are lists, their children
are cards, and deeper items are checklists. An item's note is the card's
description, and a completed item is a done card.

## How to import

1. Export the outline as OPML from the outliner:
   - **Workflowy**: open the bullet menu of the item to export, click
     **Export** and choose OPML; for the whole account, **Settings → Export
     all**. See [Workflowy: Exporting](https://workflowy.com/help/exporting).
   - **Logseq**: right-click the page title, choose **Export** and then OPML.
     See [Logseq: Export](https://raw.githubusercontent.com/logseq/docs/master/pages/Export.md).
   - **Dynalist** and **OmniOutliner**: see their own documentation.
2. In WeKan, go to **All Boards → New → Import → OPML**.
3. Paste the OPML text into the text box. For a `.opml` file, open it in a
   text editor and copy all of it.
4. Click **Import**.
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

Text that is not an OPML outline (no `<opml>` with a `<body>`) is refused, and
no board is created.

## How to import many boards at once

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

## How to export

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

## How to export all boards at once

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

## Format details

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
- a list's note and `url` / `htmlUrl` / `xmlUrl` links are reported.

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
- each card as a child outline, with its description as `_note` and
  `_complete="true"` when its list's name looks finished (contains "done",
  "closed", "complete", "archiv" or "finished");
- each checklist as a child of the card, with its items as children,
  `_complete="true"` when finished.

Line breaks and tabs in text are written as `&#10;` and `&#9;`, so an XML
reader gives them back. Archived cards and archived lists are not exported.

## What is kept

| OPML | WeKan |
| --- | --- |
| `<head><title>` | Board title |
| Top-level `<outline>` | List |
| Level 2 outline: `text` (or `title`) | Card title |
| Level 2 outline: `_note` | Card description |
| Level 2 outline: `_complete` / `complete` = true | Card with the label `done` |
| Level 3 outline with children | Checklist, its descendants the items |
| Level 3 outline without children | Item of a checklist named after the card |
| Completed item | Finished checklist item |

## What is not kept

The import reports these on the loss report:

- a `_note` on a top-level (list) outline;
- `url`, `htmlUrl` and `xmlUrl` attributes, on any outline;
- outlines deeper than 64 levels.

Other attributes, such as `created`, are not read.

The OPML export writes only lists, cards, notes, the complete state and
checklists. It does not write swimlanes, labels, dates, members, comments,
custom fields or attachments.

## REST API

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

## How it is built and tested

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

## Sources

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
