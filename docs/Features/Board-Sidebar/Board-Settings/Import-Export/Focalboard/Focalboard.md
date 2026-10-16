# Focalboard

WeKan imports boards from [Focalboard](https://github.com/mattermost/focalboard)
(Mattermost Boards) and exports boards to it. WeKan reads and writes one
board's `board.jsonl`: the text inside a `.boardarchive` file, one JSON object
per line. The board view's group-by property becomes the lists, and cards keep
their labels, dates, description, checklist and comments.

## How to import

1. In Focalboard, click the menu icon next to the **New** button at the top of
   the board and choose **Export board archive**. This downloads a
   `.boardarchive` file.
2. A `.boardarchive` file is a zip file. Unzip it (rename it to `.zip` first if
   your unzip tool needs that). It holds a `version.json` file and one
   directory per board, each with a `board.jsonl`.
3. Open the board's `board.jsonl` in a text editor and copy all of it. A file
   that starts with the old `{"version":1,...}` header line works too.
4. In WeKan, go to **All Boards → New → Import → Focalboard**.
5. Paste the text into the box and click **Import**. A **Map members** step
   follows with nobody to map: click **Done**. (**Import without mapping
   members (map later)** skips that step.)
6. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

## How to import many boards at once

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

## How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Under **Select what to include**, choose what to export, then click
   **Focalboard**. This downloads `<board>.jsonl`. The Focalboard export is
   for a whole board; it is not offered for one swimlane or one list.
3. In Focalboard, click the **gear icon** next to your profile picture and
   choose **Import archive**, then choose the `.jsonl` file (use **Select all
   files** in the file dialog if it only offers `.boardarchive` files). The
   file starts with the `{"version":1,...}` line, which Focalboard's importer
   reads as an archive of the older single-file kind.

## How to export all boards at once

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

## Format details

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

## What is kept

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

## What is not kept

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

## REST API

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

## How it is built and tested

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

## Sources

- [mattermost/focalboard](https://github.com/mattermost/focalboard): the
  project and the board model
- [server/app/import.go](https://github.com/mattermost/focalboard/blob/main/server/app/import.go):
  how Focalboard reads an archive, including a file that starts with
  `{"version":1`
- [Import, export, and migrate](https://docs.mattermost.com/end-user-guide/project-management/migrate-to-boards.html):
  the **Export board archive** and **Import archive** steps

See also the [format coverage](../Format-Coverage.md) and
[all formats](../External-Tools.md).
