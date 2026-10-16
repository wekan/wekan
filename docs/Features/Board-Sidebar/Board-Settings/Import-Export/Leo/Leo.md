# Leo

WeKan imports and exports a board as an outline of the
[Leo](https://leo-editor.github.io/leo-editor/) literate editor: a `.leo`
file, which is XML. Top-level nodes are lists, their children are cards, and
deeper nodes are checklists. A node's body is the card's description, and a
marked node is a done card.

## How to import

1. In Leo, open or create the outline and save it as a `.leo` file
   (**save-file**, Ctrl-S, or **save-file-as**). Leo's outlines are stored as
   XML `.leo` files.
2. In WeKan, go to **All Boards → New → Import → Leo**.
3. Open the `.leo` file in a text editor, copy all of it and paste it into the
   text box.
4. Click **Import**.
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

Text that is not a Leo outline (no `<leo_file>` with `<vnodes>`) is refused,
and no board is created.

## How to import many boards at once

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

## How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Choose what to include, then under **JSON** choose **Leo**. The board
   downloads as `<board>.leo`.
3. In Leo, open the file with **open-outline** (Ctrl-O).

The Leo entry is offered for a whole board only, not for a swimlane or a list.

## How to export all boards at once

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

## Format details

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
  "archiv" or "finished");
- each checklist as a child of the card, with its items as children, marked
  when finished.

Archived cards and archived lists are not exported.

## What is kept

| Leo | WeKan |
| --- | --- |
| `wekan_board` attribute of `<leo_header>` | Board title |
| Top-level node | List |
| Level 2 node: headline | Card title |
| Level 2 node: body | Card description |
| Level 2 node marked (`a="M"`) | Card with the label `done` |
| Level 3 node with children | Checklist, its descendants the items |
| Level 3 node without children | Item of a checklist named after the card |
| Marked item node | Finished checklist item |

## What is not kept

The import reports these on the loss report:

- body text of a top-level (list) node: a WeKan list has no text field;
- nodes deeper than 64 levels.

The Leo export writes only lists, cards, descriptions, the done mark and
checklists. It does not write swimlanes, labels, dates, members, comments,
custom fields or attachments.

## REST API

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

## How it is built and tested

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

## Sources

- [Leo](https://leo-editor.github.io/leo-editor/): the editor and its `.leo`
  outline
- [Leo commands reference](https://leo-editor.github.io/leo-editor/commands.html):
  open-outline, save-file, and that `.leo` files are XML

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).
