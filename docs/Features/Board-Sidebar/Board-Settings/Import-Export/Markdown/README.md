# Markdown

## What it is

WeKan imports and exports a board as a Markdown task list: the convention that
markdown-kanban tools such as Obsidian Kanban use. A `## List` heading starts a
list, and `- [ ]` / `- [x]` items under it are its cards. An ordinary bulleted
to-do list with no checkboxes also imports, as open cards. The file is plain
text, so any text editor can read and write it.

For the Obsidian Kanban plugin's own board file, with its lane limits, dates
and settings, use [Obsidian Kanban](../Obsidian-Kanban/README.md)
instead.

## Read more

- [Wikipedia: Markdown, the markup language](https://en.wikipedia.org/wiki/Markdown)
- [Obsidian Kanban plugin](https://github.com/mgmeyers/obsidian-kanban): the
  markdown-kanban convention of `##` lists and `- [ ]` cards
- [GitHub Flavored Markdown: task list items](https://github.github.com/gfm/#task-list-items-extension-):
  the `- [ ]` / `- [x]` syntax

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. Get the Markdown file. Any `.md` file written in this shape works, for
   example one written by hand, a WeKan Markdown export, or a markdown-kanban
   tool's board file opened in a text editor.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → Markdown**.
3. Open the file in a text editor, copy all of it and paste it into the text
   box.
4. Click **Import**.
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

### How to import many boards at once

1. On the import page, choose **Markdown**, then under **Import many boards**
   choose several `.md` files, or one `.zip` that holds them.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Markdown is imported through the generalized importer
(`models/kanboardCreator.js`, through `EXTERNAL_PARSERS` in
`models/lib/externalParsers.js`), so the page also has a checkbox **One board
per project**: each swimlane the import would create becomes its own board,
named after that swimlane. A Markdown import puts every card in the swimlane
**Default**, so for Markdown the option makes no difference.

Links between cards that end up on different boards are reported in the loss
report rather than kept. The Markdown format has no links between cards.

From a script:

```bash
python3 api.py importboardsfrom markdown FILE_OR_DIR ...
```

Each argument is a file, a directory of files, or a `.zip` file.

### How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Choose what to include, then under **JSON** choose **Markdown**. The board
   downloads as `<board>.md`.
3. Open the file in any text editor or Markdown tool. To import it into
   another markdown-kanban tool, see that tool's documentation.

The Markdown entry is offered for a whole board only, not for a swimlane or a
list.

### How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Markdown**.
2. One `.zip` downloads, with one file per board you can export: boards you
   are a member of that are not archived and not templates.

To export only some boards, use **Multi-Selection** in the All Boards
sidebar, select the boards, then **Export**.

From a script:

```bash
python3 api.py exportallboards markdown boards.zip
```

### REST API

```bash
python3 api.py importboardfrom markdown board.md          # POST /api/boards/import/markdown
python3 api.py importboardsfrom markdown FILE_OR_DIR ...  # several boards
python3 api.py exportboardformat BOARDID markdown board.md
python3 api.py exportallboards markdown boards.zip
```

The HTTP routes:

- `POST /api/boards/import/markdown` with the file's text as `board`;
- `GET /api/boards/:boardId/export/markdown?authToken=…` returns the file as
  `text/markdown`;
- `GET /api/export-all-boards/markdown?authToken=…` returns the `.zip`; add
  `&boardIds=ID1,ID2` for only those boards.

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

This format's own code:
[models/lib/markdownKanbanFormat.js](../../../../../../models/lib/markdownKanbanFormat.js).

The tests that pin it:
[tests/boardExportScope.test.cjs](../../../../../../tests/boardExportScope.test.cjs),
[tests/importLossReport.test.cjs](../../../../../../tests/importLossReport.test.cjs),
[tests/markdownImportExport.test.cjs](../../../../../../tests/markdownImportExport.test.cjs),
[tests/playwright/specs/import-export-format-audit.e2e.js](../../../../../../tests/playwright/specs/import-export-format-audit.e2e.js).

The details of the format, what is kept and how it is tested are below.

### Format details

The format is the convention markdown-kanban tools (for example Obsidian
Kanban) use: `## List` headings with `- [ ]` / `- [x]` items.

What the import must cover:

- headings become lists;
- the checkbox state becomes a `done` label;
- indented lines become the card's description;
- a plain bulleted list with no checkboxes still imports, as open cards.

What the current code does (`parseMarkdownKanban` in
`models/lib/externalParsers.js`):

- The first `# Title` line is the board title. Without one, the board is
  called "Imported Markdown board".
- A `## Name` line starts a list. Cards before the first `##` heading go to a
  list called "Imported".
- A line starting with `- ` or `* `, with or without `[ ]`, `[x]` or `[X]`,
  is a card. `[x]` adds the label `done`.
- On a card line, `#tag` words are labels (a word that starts with a letter,
  so `#1234` and `C#` stay in the title), and `@{2026-12-24}` with an optional
  `@@{14:30}` (Obsidian Kanban), `📅 2026-12-24` (Obsidian Tasks) or
  `due:2026-12-24` (todo.txt) is the due date. A due day that is no date is
  reported.
- An indented `- [ ]` / `- [x]` line under a card is an item of its checklist.
  Any other line that starts with white space is added to the card's
  description; `\- [ ]` there is a description line, not an item.
- Other headings (`#`, `###` and deeper, or a second `#` line) are skipped.
  Any other non-blank line is reported.
- Every card goes to the swimlane Default.

What the export writes (`formatMarkdownKanban` in
`models/lib/markdownKanbanFormat.js`):

- `# <board title>`, then for each list that has cards, `## <list title>`;
  lists without cards are left out.
- Each card as `- [ ] <title>`, or `- [x] <title>` when its list's name looks
  finished: it contains "done", "closed", "complete", "archiv" or
  "finished" (case does not matter); then its labels as `#tags` (a space
  written as `-`) and its due date as `@{day}`, with `@@{time}` when it has
  one.
- Each non-blank line of the description, indented two spaces, a line that
  looks like a checklist item escaped as `\- [ ]`.
- Each checklist item as an indented `- [ ]` / `- [x]` line.
- Archived cards and archived lists are not exported.

### What is kept

| Markdown | WeKan |
| --- | --- |
| First `# Title` | Board title |
| `## Heading` | List |
| `- [ ] Item`, `- Item`, `* Item` | Card |
| `- [x] Item` | Card with the label `done` |
| Indented lines under an item | Card description |
| `#tag` on an item | Label |
| `@{day}` `@@{time}`, `📅 day`, `due:day` | Due date |
| Indented `- [ ]` / `- [x]` under an item | Checklist item |

### What is not kept

The import reports, on the loss report, every non-blank line that is not a
heading, a card or an indented line under a card (for example a numbered list
item, or text before the first card). Headings other than the first `#` line
and the `##` lines are skipped.

The Markdown export writes lists, card titles, descriptions, labels, the due
date and checklist items. It does not write swimlanes, the `done` label (the
checkbox comes from the list name), a label that does not start with a
letter, other dates, members, comments, custom fields, attachments, blank
lines inside a description, or lists without cards. A card's checklists come
back as one checklist.

### How it is built and tested

- `parseMarkdownKanban` in `models/lib/externalParsers.js` reads the file.
  `models/lib/markdownKanbanFormat.js` writes it.
- `models/import.js` sends the text to the parser, and
  `models/kanboardCreator.js` creates the board.
- `tests/markdownImportExport.test.cjs` is the unit test of the round trip.
  `tests/importLossReport.test.cjs` covers the loss report and
  `tests/boardExportScope.test.cjs` the export menu entry.
- The Playwright cases are in
  `tests/playwright/specs/import-export-format-audit.e2e.js`: the export menu
  link for every format, and "markdown: multiline Unicode text survives real
  file or text import".

## Commits

 - [Markdown: #tags, due dates and indented checkboxes are labels, due dates and checklists, both ways](https://github.com/wekan/wekan/commit/10caa20b094beae76ce941e609c7f130e6dd7d5f)
 - [The Markdown, Obsidian, OPML and Org mode outlines and the Notion CSV are written a page of cards at a time](https://github.com/wekan/wekan/commit/ce40b56abdf5b166f523dab98a14414907809b1f)
 - [Import and export boards as Notion Markdown & CSV exports](https://github.com/wekan/wekan/commit/b7d3274780989c8169549507e416c60316d70ccf)
 - [Add Markdown import/export and give GitHub-style import loss reporting](https://github.com/wekan/wekan/commit/237b4f3f883b9e0bcf3a05a82eb7325cb9c00439)
