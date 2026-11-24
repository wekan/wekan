# Focalboard

## What it is

WeKan imports boards from [Focalboard](https://github.com/mattermost/focalboard)
(Mattermost Boards) and exports boards to it. WeKan reads and writes one
board's `board.jsonl`: the text inside a `.boardarchive` file, one JSON object
per line. The board view's group-by property becomes the lists, and cards keep
their labels, dates, description, checklist and comments.

## Read more

- [Wikipedia: Mattermost, whose Boards plugin grew out of Focalboard](https://en.wikipedia.org/wiki/Mattermost)
- [mattermost/focalboard](https://github.com/mattermost/focalboard): the
  project and the board model
- [server/app/import.go](https://github.com/mattermost/focalboard/blob/main/server/app/import.go):
  how Focalboard reads an archive, including a file that starts with
  `{"version":1`
- [Import, export, and migrate](https://docs.mattermost.com/end-user-guide/project-management/migrate-to-boards.html):
  the **Export board archive** and **Import archive** steps

See also the [format coverage](../Format-Coverage.md) and
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. In Focalboard, click the menu icon next to the **New** button at the top of
   the board and choose **Export board archive**. This downloads a
   `.boardarchive` file.
2. A `.boardarchive` file is a zip file. Unzip it (rename it to `.zip` first if
   your unzip tool needs that). It holds a `version.json` file and one
   directory per board, each with a `board.jsonl`.
3. Open the board's `board.jsonl` in a text editor and copy all of it. A file
   that starts with the old `{"version":1,...}` header line works too.
4. In WeKan, go to **All Boards → Add Board → Import → Import board → Focalboard**.
5. Paste the text into the box and click **Import**. A **Map members** step
   follows with nobody to map: click **Done**. (**Import without mapping
   members (map later)** skips that step.)
6. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

### How to import many boards at once

1. On the import page, choose **Focalboard**, then under **Import many
   boards** choose several `board.jsonl` files, or one `.zip` that holds them.
   Each file becomes its own board, imported without member mapping. Members
   can be mapped later.
2. Focalboard is imported through the generalized importer, so there is also a
   checkbox **One board per project**: each swimlane the import would create
   becomes its own board, named after that swimlane. A Focalboard import puts
   every card in the swimlane **Default**, so for Focalboard this option makes
   no difference.

Links (parent cards, dependencies) between cards that end up on different
boards are reported in the loss report rather than kept.

From a script:

```bash
python3 api.py importboardsfrom focalboard FILE_OR_DIR ...
```

The arguments are files, directories of files, or `.zip` files.

### How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Under **Select what to include**, choose what to export, then click
   **Focalboard**. This downloads `<board>.jsonl`. The Focalboard export is
   for a whole board; it is not offered for one swimlane or one list.
3. In Focalboard, click the **gear icon** next to your profile picture and
   choose **Import archive**, then choose the `.jsonl` file (use **Select all
   files** in the file dialog if it only offers `.boardarchive` files). The
   file starts with the `{"version":1,...}` line, which Focalboard's importer
   reads as an archive of the older single-file kind.

### How to export all boards at once

In **All Boards**, open the sidebar and choose **Export all boards**, then
**Focalboard**. This downloads one `.zip` with one `.jsonl` file per board you
can export: boards you are a member of, that are not archived and not
templates.

To export only some boards, use **Multi-Selection** in the All Boards sidebar,
select the boards, then click **Export**.

From a script:

```bash
python3 api.py exportallboards focalboard boards.zip
```

### REST API

```bash
python3 api.py importboardfrom focalboard board.jsonl
python3 api.py importboardsfrom focalboard board1.jsonl board2.jsonl
python3 api.py exportboardformat BOARDID focalboard board.jsonl
python3 api.py exportallboards focalboard boards.zip
```

The HTTP routes:

- `POST /api/boards/import/focalboard`: the body is `{"board": "<text>"}`.
- `GET /api/boards/:boardId/export/focalboard?authToken=…`
- `GET /api/export-all-boards/focalboard?authToken=…`, with
  `&boardIds=ID1,ID2` for selected boards only.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- At most 50,000 blocks. More stops the import with an error.
  (`MAX_FOCALBOARD_BLOCKS` in
  [models/lib/focalboardFormat.js](../../../../../../models/lib/focalboardFormat.js#L35))

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
[models/lib/focalboardFormat.js](../../../../../../models/lib/focalboardFormat.js).

The tests that pin it:
[tests/externalExportRoundTrip.test.cjs](../../../../../../tests/externalExportRoundTrip.test.cjs),
[tests/focalboard.test.cjs](../../../../../../tests/focalboard.test.cjs),
[tests/playwright/specs/import-export-format-audit.e2e.js](../../../../../../tests/playwright/specs/import-export-format-audit.e2e.js).

The details of the format, what is kept and how it is tested are below.

### Format details

What WeKan reads is a [Focalboard](https://github.com/mattermost/focalboard)
(Mattermost Boards) board archive as text: a board's `board.jsonl` from the
`.boardarchive` zip, optionally after its `{"version":1}` header line. That is
the same text Focalboard's importer reads.

What the import covers:

- the board view's group-by select property as lists;
- other select and multi-select properties as `<property>:<option>` labels;
- the first date property as the due date (or start and due date);
- text, number, email, url, phone, checkbox and further date properties as
  custom fields;
- text and heading blocks as the description;
- checkbox blocks as a checklist;
- comment blocks as comments.

Members, person properties, images and attachments, and card templates are
reported. The export writes the same text, with a Status property for the
lists, Labels and Due.

From the current code (`models/lib/focalboardFormat.js`):

- Each line is `{"type": "...", "data": {...}}`. A `board` line is the board,
  with its title, description and `cardProperties` (the property templates).
  A `block` line is a card, a view or a content block. Older archives write
  the board itself as the first block, with its `cardProperties` in `fields`.
  A `boardMember` line is a Focalboard membership.
- The group-by property is the one of the first board view that groups by a
  select property; without one, the first select property. A card without a
  value goes to the list `No <property>`. Without any select property,
  every card goes to the list **Cards**.
- Lists follow the order of the group-by property's options, then any other
  list a card names.
- A select or multi-select property called **Labels** gives labels by the
  option's own name, without the `<property>:` prefix. That is the shape
  WeKan's export writes, so labels come back unchanged.
- Heading blocks keep their level as Markdown `#`, `##` or `###`, and a divider
  block becomes `---` in the description. Content follows the card's own
  content order, then any block that order does not list, oldest first.
- Computed properties (created time, updated time, created by, updated by) are
  skipped: the card's `createAt` is kept as its creation date.
- A deleted block (one with a `deleteAt`) is skipped.
- A file may hold at most 50,000 lines.

The export writes:

- an archive header line `{"version":1,"date":...}`;
- a board line with three card properties: **Status** (a select, one option
  per list), **Labels** (a multi-select, one option per label) and **Due** (a
  date), plus one text property per custom field;
- a board view grouped by Status;
- one card block per card, then a text block for its description, one checkbox
  block per checklist item and one comment block per comment.

Block ids are made from the WeKan ids, so exporting the same board again
gives the same ids. A card with a start date before its due date gets the
range as its Due value; otherwise only the due date.

### What is kept

| Focalboard | WeKan |
| --- | --- |
| Board title, description | Board title, description |
| Group-by select property's option | List |
| Other select or multi-select option | Label `<property>:<option>` |
| An option of a property called Labels | Label with the option's name |
| First date property | Due date, or start and due date for a range |
| Text, number, email, url, phone, checkbox property | Custom field of the property's name |
| Further date properties | Custom field (the start of the range) |
| Card title | Card title |
| Text, heading and divider blocks | Description |
| Checkbox blocks | Checklist **Checklist**, with done items |
| Comment blocks | Comments, with their date |
| Card `createAt` | Creation date |
| Card id | The card's source reference |

| WeKan | Focalboard export |
| --- | --- |
| List | Status option |
| Labels | Labels options |
| Start and due date | Due (a date or a range) |
| Custom fields | Text properties |
| Description | Text block |
| Checklist items | Checkbox blocks, checked when done |
| Comments | Comment blocks, as `author: text` |

### What is not kept

The import reports these on the loss report, rather than dropping them
silently:

- a second board in one file;
- Focalboard board members: Focalboard accounts are not WeKan's;
- a card template;
- a value of a property the board does not define;
- a date property value that is not a Focalboard date;
- a property of any other type, such as a person property;
- image and attachment blocks: the files are in the archive, not in
  `board.jsonl`;
- any other block type, and any other archive line type.

When a card has more custom fields than WeKan imports, the rest are reported.

The export leaves out archived cards, lists and swimlanes, swimlanes
themselves, attachments, people, and the type of a custom field (every custom
field becomes a text property).

### How it is built and tested

- `models/lib/focalboardFormat.js` reads and writes the text.
  `models/lib/externalParsers.js` lists it in `EXTERNAL_PARSERS`, and
  `models/kanboardCreator.js` creates the board.
- `models/lib/externalExportFormatters.js` and
  `models/lib/externalExporters.js` collect the board and write the export.
- `tests/focalboard.test.cjs` is the unit test, and
  `tests/externalExportRoundTrip.test.cjs` runs the export back through the
  import.
- The Playwright case is in
  `tests/playwright/specs/import-export-format-audit.e2e.js`: *Focalboard: a
  board.jsonl imports with its lists, labels, description, checklist and
  comments*, and *every external export menu link returns text and refuses an
  unrelated user*.

## Commits

 - [Focalboard and Mattermost exports are written a page of cards at a time](https://github.com/wekan/wekan/commit/bad71f9a1e80f54472c87eb8605d5a4206185ea4)
 - [Import and export boards as Focalboard (Mattermost Boards) archive text](https://github.com/wekan/wekan/commit/5d26e9fff8b1a873f032019bfd7cc5c4e68b66d1)
