# Obsidian Kanban

WeKan imports and exports a board as the board file of the
[Obsidian Kanban plugin](https://github.com/mgmeyers/obsidian-kanban): a
Markdown note with `kanban-plugin: board` frontmatter. Lanes become lists with
their card limits, and cards keep their tags, dates, priority, Dataview
fields and checklist. The plugin's Archive becomes archived cards.

For a plain Markdown task list without the plugin's frontmatter, use
[Markdown](../Markdown/Markdown.md) instead.

## How to import

1. In Obsidian, open the Kanban board and use the plugin's **Open as
   markdown** command to see the board's Markdown. The board is also an
   ordinary `.md` file in the vault, which any text editor opens.
2. In WeKan, go to **All Boards → New → Import → Obsidian Kanban**.
3. Copy all of the Markdown, from the first `---` line to the end, and paste
   it into the text box.
4. Click **Import**.
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

A file without the `---` frontmatter saying `kanban-plugin: board` is refused,
and no board is created.

## How to import many boards at once

1. On the import page, choose **Obsidian Kanban**, then under **Import many
   boards** choose several `.md` board files, or one `.zip` that holds them.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Obsidian Kanban is imported through the generalized importer
(`models/kanboardCreator.js` via `EXTERNAL_PARSERS` in
`models/lib/externalParsers.js`), so the page also has a checkbox **One board
per project**: each swimlane the import would create becomes its own board,
named after that swimlane. An Obsidian Kanban import puts every card in the
swimlane **Default**, so for Obsidian Kanban the option makes no difference.

Links between cards that end up on different boards are reported in the loss
report rather than kept. This applies to `⛔` (blocked by) links: a card that
names a `🆔` id of a card in another file is reported, because that card is
not part of the same import.

From a script:

```bash
python3 api.py importboardsfrom obsidian FILE_OR_DIR ...
```

Each argument is a file, a directory of files, or a `.zip` file.

## How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Choose what to include, then under **JSON** choose **Obsidian Kanban**. The
   board downloads as `<board>.md`.
3. Put the file in a folder of the Obsidian vault. The plugin recognizes a
   board by its `kanban-plugin: board` frontmatter; if the note opens as
   Markdown, use the plugin's **Open as kanban board** command.

The Obsidian Kanban entry is offered for a whole board only, not for a
swimlane or a list.

## How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Obsidian Kanban**.
2. One `.zip` downloads, with one file per board you can export: boards you
   are a member of that are not archived and not templates.

To export only some boards, use **Multi-Selection** in the All Boards
sidebar, select the boards, then **Export**.

From a script:

```bash
python3 api.py exportallboards obsidian boards.zip
```

## Format details

The format is the [Obsidian Kanban plugin](https://github.com/mgmeyers/obsidian-kanban)'s
board file, following its parser and writer
([list.ts](https://github.com/mgmeyers/obsidian-kanban/blob/main/src/parsers/formats/list.ts),
[parseMarkdown.ts](https://github.com/mgmeyers/obsidian-kanban/blob/main/src/parsers/parseMarkdown.ts)):

- `kanban-plugin: board` frontmatter;
- `## Lane (limit)` headings, and `**Complete**` lanes;
- `- [ ]` cards with continuation lines indented four spaces or a tab;
- `***` followed by `## Archive`;
- the `%% kanban:settings %%` JSON footer.

What the import must cover:

- lanes as lists, with their card limit as the WIP limit;
- cards, with the body as the description;
- `[x]` or a Complete lane as the `done` label (as the Markdown import does);
- `#tags` as labels;
- `@{date}` / `@@{time}`, in the board's `date-format`, as the due date;
- Tasks plugin dates: 📅 due, 🛫 start, ➕ created, ✅ done, and ⏳ scheduled
  as the start date;
- 🔺⏫🔼🔽⏬ as a Priority custom field;
- `🆔` / `⛔` as reference and blocked-by links;
- Dataview `key:: value` as custom fields;
- task lines in the body as the checklist;
- the Archive as archived cards, in the last lane.

Reported: 🔁 recurrence, ❌ cancelled, other frontmatter keys, and dates
outside the date format. The export writes the plugin's own layout, with the
WIP limit, labels, dates, priority, fields and checklist.

What the current code does (`models/lib/obsidianKanbanFormat.js`):

- The date format and the date and time triggers (`@` and `@@` by default)
  come from the settings footer, else from the frontmatter, else
  `YYYY-MM-DD`. The format may use the tokens `YYYY`, `MM`, `M`, `DD` and
  `D`. `@[[date]]` (a link to a daily note) is read too.
- A `<br>` in the card's first line starts the description.
- A trailing block id `^id` is the card's reference when there is no `🆔`.
- `- [ ]` lines in the body become one checklist named "Checklist"; `key::
  value` lines become custom fields. Both are taken out of the description.
- Lanes with the same title are merged into one list.
- Cards after `***` are archived. They go to the last lane before the
  Archive (or the first lane, or a list called Archive when there is none).
- A card before any lane goes to a list called "Untitled".
- The plugin's own settings keys (`date-format`, `lane-width`, `tag-colors`
  and the rest) are layout preferences, and are skipped without a report.
- The board is called "Imported Obsidian Kanban board": the file has no board
  title of its own.
- Every card goes to the swimlane Default.

What the export writes (`formatObsidianKanban` in the same module):

- the `kanban-plugin: board` frontmatter;
- each list as `## <list>`, with ` (N)` when the list has a WIP limit set;
- each card as `- [ ]`, or `- [x]` when it has the label `done` or an end
  date, then the title, the other labels as `#tags` (spaces become `-`), the
  due date as `@{YYYY-MM-DD}` and `@@{HH:MM}` when it has a time, the start
  date as `🛫`, the end date as `✅` and a Priority custom field as its emoji;
- the description, other custom fields as `name:: value`, and the checklist
  items as `- [ ]` / `- [x]` lines, all indented four spaces;
- the settings footer.

WeKan exports no archived cards, so there is no Archive section. Archived
lists are not exported either.

## What is kept

| Obsidian Kanban | WeKan |
| --- | --- |
| `## Lane` | List |
| `(N)` after the lane title | List WIP limit |
| Card first line | Card title |
| Indented lines | Card description |
| `[x]`, or a card in a `**Complete**` lane | Label `done` |
| `#tag` | Label |
| `@{date}` `@@{time}` | Due date |
| `📅` | Due date |
| `🛫` (or `⏳` when there is no `🛫`) | Start date |
| `➕` | Creation date |
| `✅` | End date |
| `🔺` `⏫` `🔼` `🔽` `⏬` | Custom field Priority: Highest, High, Medium, Low, Lowest |
| `🆔 id` (or `^id`) | The id other cards' `⛔` refer to |
| `⛔ id, id` | "Is blocked by" dependencies |
| `key:: value` | Custom field |
| `- [ ]` / `- [x]` lines in the body | Checklist "Checklist" |
| Cards after `***` / `## Archive` | Archived cards |

## What is not kept

The import reports these on the loss report:

- frontmatter keys other than `kanban-plugin` and the plugin's settings;
- a date that does not match the board's date format;
- a ❌ cancelled date;
- 🔁 recurrence: the card is imported once;
- a line that is not a lane, a card or a card's body;
- a `⛔` id that is not one of the imported cards, and a repeated `🆔` id.

Wikilinks stay text.

The Obsidian Kanban export does not write the board title, the Archive,
the creation date (`➕`), `🆔` / `⛔` links, members, comments, swimlanes or
attachments.

## REST API

```bash
python3 api.py importboardfrom obsidian board.md          # POST /api/boards/import/obsidian
python3 api.py importboardsfrom obsidian FILE_OR_DIR ...  # several boards
python3 api.py exportboardformat BOARDID obsidian board.md
python3 api.py exportallboards obsidian boards.zip
```

The HTTP routes:

- `POST /api/boards/import/obsidian` with the file's text as `board`;
- `GET /api/boards/:boardId/export/obsidian?authToken=…` returns the file as
  `text/markdown`;
- `GET /api/export-all-boards/obsidian?authToken=…` returns the `.zip`; add
  `&boardIds=ID1,ID2` for only those boards.

## How it is built and tested

- `models/lib/obsidianKanbanFormat.js` reads and writes the board file.
  `models/import.js` sends the text to the parser, and
  `models/kanboardCreator.js` creates the board, its custom fields and
  dependencies.
- `tests/obsidianKanban.test.cjs` is the unit test of the round trip.
  `tests/importLossReport.test.cjs` covers the loss report and
  `tests/boardExportScope.test.cjs` the export menu entry.
- The Playwright cases are in
  `tests/playwright/specs/import-export-format-audit.e2e.js`: "Obsidian
  Kanban: a plugin board imports with its lanes, limit, tags, due date and
  done cards", and the export menu link for every format.

## Sources

- [Obsidian Kanban plugin](https://github.com/mgmeyers/obsidian-kanban): the
  plugin
- [list.ts](https://github.com/mgmeyers/obsidian-kanban/blob/main/src/parsers/formats/list.ts)
  and [parseMarkdown.ts](https://github.com/mgmeyers/obsidian-kanban/blob/main/src/parsers/parseMarkdown.ts):
  the plugin's parser and writer, which the grammar follows
- [The plugin's English strings](https://github.com/mgmeyers/obsidian-kanban/blob/main/src/lang/locale/en.ts):
  the **Open as markdown** and **Open as kanban board** commands

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).
