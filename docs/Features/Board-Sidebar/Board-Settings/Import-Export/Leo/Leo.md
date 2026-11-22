# Leo

## What it is

WeKan imports and exports a board as an outline of the
[Leo](https://leo-editor.github.io/leo-editor/) literate editor: a `.leo`
file, which is XML. Top-level nodes are lists, their children are cards, and
deeper nodes are checklists. A node's body is the card's description, and a
marked node is a done card.

## Read more

- [Wikipedia: Leo, the outlining editor](https://en.wikipedia.org/wiki/Leo_(text_editor))
- [Wikipedia: outliners](https://en.wikipedia.org/wiki/Outliner)
- [Leo](https://leo-editor.github.io/leo-editor/): the editor and its `.leo`
  outline
- [Leo commands reference](https://leo-editor.github.io/leo-editor/commands.html):
  open-outline, save-file, and that `.leo` files are XML

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. In Leo, open or create the outline and save it as a `.leo` file
   (**save-file**, Ctrl-S, or **save-file-as**). Leo's outlines are stored as
   XML `.leo` files.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → Leo**.
3. Open the `.leo` file in a text editor, copy all of it and paste it into the
   text box.
4. Click **Import**.
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

Text that is not a Leo outline (no `<leo_file>` with `<vnodes>`) is refused,
and no board is created.

### How to import many boards at once

1. On the import page, choose **Leo**, then under **Import many boards**
   choose several `.leo` files, or one `.zip` that holds them.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Leo outlines are imported through the generalized importer
(`models/kanboardCreator.js`, created from the parsed outline the way the
sources in `EXTERNAL_PARSERS` in `models/lib/externalParsers.js` are), so the
page also has a checkbox **One board per project**: each swimlane the import
would create becomes its own board, named after that swimlane. A Leo import
puts every card in the swimlane **Default**, so for Leo the option makes no
difference.

Links between cards that end up on different boards are reported in the loss
report rather than kept. Leo outlines carry no links between cards.

From a script:

```bash
python3 api.py importboardsfrom leo FILE_OR_DIR ...
```

Each argument is a file, a directory of files, or a `.zip` file.

### How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Choose what to include, then under **JSON** choose **Leo**. The board
   downloads as `<board>.leo`.
3. In Leo, open the file with **open-outline** (Ctrl-O).

The Leo entry is offered for a whole board only, not for a swimlane or a list.

### How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Leo**.
2. One `.zip` downloads, with one file per board you can export: boards you
   are a member of that are not archived and not templates.

To export only some boards, use **Multi-Selection** in the All Boards
sidebar, select the boards, then **Export**.

From a script:

```bash
python3 api.py exportallboards leo boards.zip
```

### REST API

```bash
python3 api.py importboardfrom leo board.leo          # POST /api/boards/import/leo
python3 api.py importboardsfrom leo FILE_OR_DIR ...   # several boards
python3 api.py exportboardformat BOARDID leo board.leo
python3 api.py exportallboards leo boards.zip
```

The HTTP routes:

- `POST /api/boards/import/leo` with the file's text as `board`;
- `GET /api/boards/:boardId/export/leo?authToken=…` returns the file as
  `application/xml`;
- `GET /api/export-all-boards/leo?authToken=…` returns the `.zip`; add
  `&boardIds=ID1,ID2` for only those boards.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- The Leo file: at most 16,777,216 characters (16 MB of text). More stops the
  import with an error. (`MAX_LEO_LENGTH` in
  [models/lib/leoOutline.js](../../../../../../models/lib/leoOutline.js#L33))
- Nesting deeper than 64 levels is not followed. (`MAX_LEO_DEPTH` in
  [models/lib/leoOutline.js](../../../../../../models/lib/leoOutline.js#L36))
- At most 100,000 outline nodes. More stops the import with an error.
  (`MAX_LEO_NODES` in
  [models/lib/leoOutline.js](../../../../../../models/lib/leoOutline.js#L39))

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
[models/lib/leoOutline.js](../../../../../../models/lib/leoOutline.js),
[models/lib/leoOutlineFormat.js](../../../../../../models/lib/leoOutlineFormat.js),
[server/lib/leoImport.js](../../../../../../server/lib/leoImport.js).

The tests that pin it:
[tests/importLossReport.test.cjs](../../../../../../tests/importLossReport.test.cjs),
[tests/leoOutline.test.cjs](../../../../../../tests/leoOutline.test.cjs),
[tests/playwright/specs/import-export-format-audit.e2e.js](../../../../../../tests/playwright/specs/import-export-format-audit.e2e.js),
[tests/playwright/specs/leo-outline-import.e2e.js](../../../../../../tests/playwright/specs/leo-outline-import.e2e.js).

The details of the format, what is kept and how it is tested are below.

### Format details

The format is the [Leo](https://leo-editor.github.io/leo-editor/) literate
editor's XML outline: nested `<v>` nodes with `<vh>` headlines, and bodies in
`<t>` elements joined to their node by the node id.

What the import must cover:

- top-level nodes become lists;
- their children become cards, with the body as the description and a marked
  node as `done`;
- deeper nodes become checklists, with their descendants as items;
- clones keep their headline and children;
- list bodies are reported as a loss;
- the board title travels in a `wekan_board` attribute that Leo ignores.

What the current code does (`models/lib/leoOutline.js`):

- The outline is the `<v t="gnx">` nodes under `<vnodes>`. A node's body is
  the `<t tx="gnx">` under `<tnodes>` with the same id. A node marked in Leo
  carries `a="M"`.
- Leo stamps a node's id with the time it was made (`ekr.20260902080910.2`);
  that time is the card's creation date. Leo writes it in local time with no
  zone, so it is read as UTC.
- Any other attribute of a `<v>` or `<t>` is a Leo plugin's own data (its
  "unknown attributes", pickled Python), and is reported.
- A level 3 node with children is a checklist named after it; all its
  descendants, at any depth, are the items. Level 3 nodes without children
  are the items of one checklist named after the card.
- A clone is the same id appearing again. Leo writes a clone's children only
  the first time, so WeKan gives a later occurrence the first one's
  headline, mark and children. A clone of its own ancestor is not followed.
- The board title comes from the `wekan_board` attribute of `<leo_header>`.
  Without it the board is called "Imported Leo outline".
- The file is parsed on the server only, as XML. DTDs and external entities
  are never resolved.
- Limits: 16 MB of text, 100,000 nodes counting expanded clones, and 64
  levels. Deeper nodes are not read, and that is reported.
- Every card goes to the swimlane Default.

What the export writes (`models/lib/leoOutlineFormat.js`):

- `<leo_header file_format="2" wekan_board="<board title>"/>`;
- each list as a top-level node, including lists without cards;
- each card as a child node, with its description as the body, marked when
  its list's name looks finished (contains "done", "closed", "complete",
  "archiv" or "finished"), and its creation time in its id
  (`wekan.YYYYMMDDHHMMSS.n`);
- each checklist as a child of the card, with its items as children, marked
  when finished.

Archived cards and archived lists are not exported.

### What is kept

| Leo | WeKan |
| --- | --- |
| `wekan_board` attribute of `<leo_header>` | Board title |
| Top-level node | List |
| Level 2 node: headline | Card title |
| Level 2 node: body | Card description |
| Level 2 node marked (`a="M"`) | Card with the label `done` |
| Level 2 node: the time in its id | Creation date |
| Level 3 node with children | Checklist, its descendants the items |
| Level 3 node without children | Item of a checklist named after the card |
| Marked item node | Finished checklist item |

### What is not kept

The import reports these on the loss report:

- body text of a top-level (list) node: a WeKan list has no text field;
- a Leo plugin's data on a node (an attribute Leo itself does not write);
- nodes deeper than 64 levels.

The Leo export writes only lists, cards, descriptions, the done mark, the
creation date and checklists. It does not write swimlanes, labels, other
dates, members, comments,
custom fields or attachments.

### How it is built and tested

- `models/lib/leoOutline.js` reads the outline; `server/lib/leoImport.js`
  loads it on the server only, so the XML parser is not sent to browsers.
  `models/lib/leoOutlineFormat.js` writes it.
- `models/import.js` parses the outline before the import's sanitizing, then
  sanitizes the parsed cards, and `models/kanboardCreator.js` creates the
  board.
- `tests/leoOutline.test.cjs` is the unit test of the round trip.
  `tests/importLossReport.test.cjs` covers the loss report.
- The Playwright cases are in `tests/playwright/specs/leo-outline-import.e2e.js`
  (an outline imports with lists, cards, bodies and checklists; text that is
  not a Leo outline is refused) and the export menu link in
  `tests/playwright/specs/import-export-format-audit.e2e.js`.

## Commits

 - [Import and export Rocket.Chat and Fizzy](https://github.com/wekan/wekan/commit/dffbafd30fd16978dbae49a4e0d576bb1ff017ec)
 - [Leo: a node's id stamp is the card's creation date, both ways; plugin data is reported](https://github.com/wekan/wekan/commit/3be07b147b46bcbe42f64da1170eda5fafcfe2ad)
 - [Leo outlines are written a page of cards at a time too](https://github.com/wekan/wekan/commit/e1261ef5fb9f233e60352ee28a8e4e16eb44a4c7)
 - [Read every import source through one path and one file chooser, from one description of the sources](https://github.com/wekan/wekan/commit/c80a656901103bfd29b41843c7e255b4ed3bfa17)
 - [Import and export many boards at once for every format, and document each format in its own directory](https://github.com/wekan/wekan/commit/7858d84e127c2c6cd92134166352b9a4245d4ec2)
 - [Import boards from Plane issue exports](https://github.com/wekan/wekan/commit/d21a26339363181807908e26c2a5155e732b745e)
 - [Import and export boards as Notion Markdown & CSV exports](https://github.com/wekan/wekan/commit/b7d3274780989c8169549507e416c60316d70ccf)
 - [Import and export boards as Vikunja data exports](https://github.com/wekan/wekan/commit/a8e73adf4837fc349f2105818a580c048a85cd28)
 - [Import and export boards as OPML outlines](https://github.com/wekan/wekan/commit/e6c8f85518a752b2b3f310907afc2485b11a948a)
 - [Fill the Cherokee Leo instruction and cover all locales](https://github.com/wekan/wekan/commit/9afc5bf221138091c8ec718d8a898dd05725787b)
 - [Add Tigre and Wolaytta Leo import instructions](https://github.com/wekan/wekan/commit/598893c70b7402fd96597ece006ce6be1d31f1a1)
 - [Add Nahuatl and Tamazight Leo import instructions](https://github.com/wekan/wekan/commit/09429dcfed399dde73c2226b94c8bdaa97473fc5)
 - [Add Greenlandic and Inuktitut Leo import instructions](https://github.com/wekan/wekan/commit/48d3e716484edffde1fa4abbefda10b68f986a8b)
 - [Import and export Leo .leo outlines](https://github.com/wekan/wekan/commit/286ed906a93a40d750ff66d0344d189fd446f055)
