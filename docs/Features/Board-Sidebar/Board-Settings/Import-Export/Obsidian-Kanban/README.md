# Obsidian Kanban

## What it is

WeKan imports and exports a board as the board file of the
[Obsidian Kanban plugin](https://github.com/mgmeyers/obsidian-kanban): a
Markdown note with `kanban-plugin: board` frontmatter. Lanes become lists with
their card limits, and cards keep their tags, dates, priority, Dataview
fields and checklist. The plugin's Archive becomes archived cards.

For a plain Markdown task list without the plugin's frontmatter, use
[Markdown](../Markdown/README.md) instead.

## Read more

- [Wikipedia: Obsidian, the note-taking app the Kanban plugin runs in](https://en.wikipedia.org/wiki/Obsidian_(software))
- [Obsidian Kanban plugin](https://github.com/mgmeyers/obsidian-kanban): the
  plugin
- [list.ts](https://github.com/mgmeyers/obsidian-kanban/blob/main/src/parsers/formats/list.ts)
  and [parseMarkdown.ts](https://github.com/mgmeyers/obsidian-kanban/blob/main/src/parsers/parseMarkdown.ts):
  the plugin's parser and writer, which the grammar follows
- [The plugin's English strings](https://github.com/mgmeyers/obsidian-kanban/blob/main/src/lang/locale/en.ts):
  the **Open as markdown** and **Open as kanban board** commands

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. In Obsidian, open the Kanban board and use the plugin's **Open as
   markdown** command to see the board's Markdown. The board is also an
   ordinary `.md` file in the vault, which any text editor opens.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → Obsidian Kanban**.
3. Copy all of the Markdown, from the first `---` line to the end, and paste
   it into the text box.
4. Click **Import**.
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

A file without the `---` frontmatter saying `kanban-plugin: board` is refused,
and no board is created.

### How to import many boards at once

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

### How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Choose what to include, then under **JSON** choose **Obsidian Kanban**. The
   board downloads as `<board>.md`.
3. Put the file in a folder of the Obsidian vault. The plugin recognizes a
   board by its `kanban-plugin: board` frontmatter; if the note opens as
   Markdown, use the plugin's **Open as kanban board** command.

The Obsidian Kanban entry is offered for a whole board only, not for a
swimlane or a list.

### How to export all boards at once

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

### REST API

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
[models/lib/obsidianKanbanFormat.js](../../../../../../models/lib/obsidianKanbanFormat.js).

The tests that pin it:
[tests/boardExportScope.test.cjs](../../../../../../tests/boardExportScope.test.cjs),
[tests/importLossReport.test.cjs](../../../../../../tests/importLossReport.test.cjs),
[tests/obsidianKanban.test.cjs](../../../../../../tests/obsidianKanban.test.cjs),
[tests/playwright/specs/import-export-format-audit.e2e.js](../../../../../../tests/playwright/specs/import-export-format-audit.e2e.js).

The details of the format, what is kept and how it is tested are below.

### Format details

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

### What is kept

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

### What is not kept

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

### How it is built and tested

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

## Commits

 - [Repeating tasks of other tools repeat in WeKan: daily, weekly and monthly as the card's recurrence](https://github.com/wekan/wekan/commit/24ac6b2bd2e55323fa1c6e52eb53ff3291fc80fb)
 - [Asana, OpenProject, Obsidian and Wrike exports carry what each card waits for](https://github.com/wekan/wekan/commit/c9da13b63e6f1fea86cb30b604093a8a120bcf53)
 - [The Markdown, Obsidian, OPML and Org mode outlines and the Notion CSV are written a page of cards at a time](https://github.com/wekan/wekan/commit/ce40b56abdf5b166f523dab98a14414907809b1f)
 - [Read every import source through one path and one file chooser, from one description of the sources](https://github.com/wekan/wekan/commit/c80a656901103bfd29b41843c7e255b4ed3bfa17)
 - [Import and export many boards at once for every format, and document each format in its own directory](https://github.com/wekan/wekan/commit/7858d84e127c2c6cd92134166352b9a4245d4ec2)
 - [Import and export boards as Obsidian Kanban plugin files](https://github.com/wekan/wekan/commit/435461f939a0864726f0fa788f1a0c4d288a4547)
