# Markdown

WeKan imports and exports a board as a Markdown task list: the convention that
markdown-kanban tools such as Obsidian Kanban use. A `## List` heading starts a
list, and `- [ ]` / `- [x]` items under it are its cards. An ordinary bulleted
to-do list with no checkboxes also imports, as open cards. The file is plain
text, so any text editor can read and write it.

For the Obsidian Kanban plugin's own board file, with its lane limits, dates
and settings, use [Obsidian Kanban](../Obsidian-Kanban/Obsidian-Kanban.md)
instead.

## How to import

1. Get the Markdown file. Any `.md` file written in this shape works, for
   example one written by hand, a WeKan Markdown export, or a markdown-kanban
   tool's board file opened in a text editor.
2. In WeKan, go to **All Boards → New → Import → Markdown**.
3. Open the file in a text editor, copy all of it and paste it into the text
   box.
4. Click **Import**.
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

## How to import many boards at once

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

## How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Choose what to include, then under **JSON** choose **Markdown**. The board
   downloads as `<board>.md`.
3. Open the file in any text editor or Markdown tool. To import it into
   another markdown-kanban tool, see that tool's documentation.

The Markdown entry is offered for a whole board only, not for a swimlane or a
list.

## How to export all boards at once

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

## Format details

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
- A line that starts with white space, under a card, is added to that card's
  description. Indented bullets therefore also become description lines.
- Other headings (`#`, `###` and deeper, or a second `#` line) are skipped.
  Any other non-blank line is reported.
- Every card goes to the swimlane Default.

What the export writes (`formatMarkdownKanban` in
`models/lib/markdownKanbanFormat.js`):

- `# <board title>`, then for each list that has cards, `## <list title>`;
  lists without cards are left out.
- Each card as `- [ ] <title>`, or `- [x] <title>` when its list's name looks
  finished: it contains "done", "closed", "complete", "archiv" or
  "finished" (case does not matter).
- Each non-blank line of the description, indented two spaces.
- Archived cards and archived lists are not exported.

## What is kept

| Markdown | WeKan |
| --- | --- |
| First `# Title` | Board title |
| `## Heading` | List |
| `- [ ] Item`, `- Item`, `* Item` | Card |
| `- [x] Item` | Card with the label `done` |
| Indented lines under an item | Card description |

## What is not kept

The import reports, on the loss report, every non-blank line that is not a
heading, a card or an indented line under a card (for example a numbered list
item, or text before the first card). Headings other than the first `#` line
and the `##` lines are skipped.

The Markdown export writes only lists, card titles and descriptions. It does
not write swimlanes, labels (including `done`; the checkbox comes from the
list name), dates, members, comments, checklists, custom fields,
attachments, blank lines inside a description, or lists without cards.

## REST API

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

## How it is built and tested

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

## Sources

- [Obsidian Kanban plugin](https://github.com/mgmeyers/obsidian-kanban): the
  markdown-kanban convention of `##` lists and `- [ ]` cards
- [GitHub Flavored Markdown: task list items](https://github.github.com/gfm/#task-list-items-extension-):
  the `- [ ]` / `- [x]` syntax

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).
