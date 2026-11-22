# Org mode

## What it is

WeKan imports and exports a board as an [Org mode](https://orgmode.org/manual/)
outline: the `.org` text file that Emacs, Orgzly, Beorg and organice write.
Top-level headings are lists and second-level headings are cards. TODO
keywords, priorities, tags, SCHEDULED, DEADLINE and CLOSED dates and their
daily, weekly or monthly repeaters, properties, clocked time, body text and
checkboxes are kept.

## Read more

- [Wikipedia: Org mode, the Emacs outline and planning mode](https://en.wikipedia.org/wiki/Org-mode)
- [The Org Manual](https://orgmode.org/manual/): headlines, TODO keywords,
  priorities, tags, timestamps, planning lines, drawers and checkboxes

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. Find the `.org` file. Org mode keeps its outlines as plain text files, so
   there is nothing to export: use the file Emacs, Orgzly, Beorg or organice
   saved. Where a mobile app keeps its files, see that app's documentation.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → Org mode**.
3. Open the file in a text editor, copy all of it and paste it into the text
   box.
4. Click **Import**.
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

Text without any heading line is refused, and no board is created.

### How to import many boards at once

1. On the import page, choose **Org mode**, then under **Import many boards**
   choose several `.org` files, or one `.zip` that holds them.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Org mode is imported through the generalized importer
(`models/kanboardCreator.js` via `EXTERNAL_PARSERS` in
`models/lib/externalParsers.js`), so the page also has a checkbox **One board
per project**: each swimlane the import would create becomes its own board,
named after that swimlane. An Org mode import puts every card in the swimlane
**Default**, so for Org mode the option makes no difference.

Links between cards that end up on different boards are reported in the loss
report rather than kept. The Org mode import makes no links between cards.

From a script:

```bash
python3 api.py importboardsfrom orgmode FILE_OR_DIR ...
```

Each argument is a file, a directory of files, or a `.zip` file.

### How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Choose what to include, then under **JSON** choose **Org mode**. The board
   downloads as `<board>.org`.
3. Open the file in Emacs (or another Org mode app) like any other `.org`
   file.

The Org mode entry is offered for a whole board only, not for a swimlane or a
list.

### How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Org mode**.
2. One `.zip` downloads, with one file per board you can export: boards you
   are a member of that are not archived and not templates.

To export only some boards, use **Multi-Selection** in the All Boards
sidebar, select the boards, then **Export**.

From a script:

```bash
python3 api.py exportallboards orgmode boards.zip
```

### REST API

```bash
python3 api.py importboardfrom orgmode board.org          # POST /api/boards/import/orgmode
python3 api.py importboardsfrom orgmode FILE_OR_DIR ...   # several boards
python3 api.py exportboardformat BOARDID orgmode board.org
python3 api.py exportallboards orgmode boards.zip
```

The HTTP routes:

- `POST /api/boards/import/orgmode` with the file's text as `board`;
- `GET /api/boards/:boardId/export/orgmode?authToken=…` returns the file as
  `text/x-org`;
- `GET /api/export-all-boards/orgmode?authToken=…` returns the `.zip`; add
  `&boardIds=ID1,ID2` for only those boards.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- The Org file: at most 16,777,216 characters (16 MB of text). More stops the
  import with an error. (`MAX_ORG_LENGTH` in
  [models/lib/orgModeFormat.js](../../../../../../models/lib/orgModeFormat.js#L47))
- At most 100,000 headings. More stops the import with an error.
  (`MAX_ORG_HEADINGS` in
  [models/lib/orgModeFormat.js](../../../../../../models/lib/orgModeFormat.js#L48))

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
[models/lib/orgModeFormat.js](../../../../../../models/lib/orgModeFormat.js).

The tests that pin it:
[tests/importLossReport.test.cjs](../../../../../../tests/importLossReport.test.cjs),
[tests/orgMode.test.cjs](../../../../../../tests/orgMode.test.cjs),
[tests/playwright/specs/import-export-format-audit.e2e.js](../../../../../../tests/playwright/specs/import-export-format-audit.e2e.js).

The details of the format, what is kept and how it is tested are below.

### Format details

The format is an [Org mode](https://orgmode.org/manual/) outline as Emacs,
Orgzly, Beorg and organice write it: headlines with TODO keywords (including
those a `#+TODO` line declares), `[#A]` priorities, `:tags:`,
SCHEDULED / DEADLINE / CLOSED planning lines, property drawers and `- [ ]`
checkboxes.

What the import must cover:

- level-1 headings become lists, level-2 headings become cards (a done
  keyword as the `done` label);
- priorities become `priority:A` labels, and tags become labels;
- SCHEDULED / DEADLINE / CLOSED become the start, due and end dates;
- `:CREATED:` becomes the creation date, `:ID:` (or `:CUSTOM_ID:`) the card's
  source reference, and every other property a custom field of that name;
- the closed `CLOCK:` lines of the `:LOGBOOK:` drawer add up to the spent
  time;
- a `+1d`, `+1w` or `+1m` repeater (also `++` and `.+`) makes the card repeat
  daily, weekly or monthly;
- body text becomes the description;
- checkboxes and level-3 headings without children become the card's
  checklist, and level-3 headings with children become checklists of their
  own;
- `#+TITLE` becomes the board title.

Timestamps have no zone in Org, and are read and written as UTC. Other
repeaters and warning delays, other drawers, open clocks, text under a list
heading and text before the first heading are reported. Comments have no place in Org and are not exported.

What the current code does (`models/lib/orgModeFormat.js`):

- Keywords come from `#+TODO`, `#+SEQ_TODO` or `#+TYP_TODO` lines. Words
  after `|` are done keywords; without `|`, the last word is the done
  keyword. Without such a line, the keywords are TODO and DONE.
- A heading's keyword, `[#X]` priority and trailing `:tag:` list are taken off
  its title.
- A planning line (SCHEDULED, DEADLINE, CLOSED) is read when it comes before
  the body text. A timestamp may be active `<…>` or inactive `[…]`, with or
  without a time.
- The property drawer is read whole: `:CREATED:`, `:ID:` / `:CUSTOM_ID:`, and
  every other property as a custom field (a `:NAME+:` line appends to it). The
  `:LOGBOOK:` drawer gives the spent time; its state-change notes are history
  and are not kept. Any other drawer is reported.
- `- [ ]`, `+ [ ]` and numbered checkbox lines in the body become the first
  checklist, named after the card, together with level-3 headings that have
  no children. A level-3 heading with children is a checklist named after it,
  with all its descendants as items; a done keyword makes an item finished.
- The board title is `#+TITLE`. Without it, the board is called "Imported Org
  outline".
- Limits: 16 MB of text and 100,000 headings.
- Every card goes to the swimlane Default.

What the export writes (`formatOrgMode` in the same module):

- `#+TITLE: <board title>` and `#+TODO: TODO | DONE`;
- `* <list>` for each list, including lists without cards;
- `** TODO <title>` or `** DONE <title>` for each card: DONE when the card has
  the label `done` or its list's name looks finished (contains "done",
  "closed", "complete", "archiv" or "finished");
- a label `priority:X` as `[#X]`, and other labels as `:tags:` (characters
  Org does not allow in a tag become `_`);
- `SCHEDULED:` (start date), `DEADLINE:` (due date) and, for a done card,
  `CLOSED:` (end date);
- the creation date as `:CREATED:` and the custom fields as properties in a
  property drawer (a space in a field name is written as `_`);
- a repeating card's repeater on its DEADLINE (`+1d`, `+1w`, `+1m`);
- the description, indented three spaces;
- each checklist as `*** <checklist>` with `**** TODO` / `**** DONE` items.

Archived cards and archived lists are not exported.

### What is kept

| Org mode | WeKan |
| --- | --- |
| `#+TITLE` | Board title |
| `* Heading` | List |
| `** Heading` | Card title |
| Done keyword (DONE, or after `\|` in `#+TODO`) | Label `done` |
| `[#A]` | Label `priority:A` |
| `:tag1:tag2:` | Labels |
| SCHEDULED | Start date |
| DEADLINE | Due date |
| CLOSED | End date |
| `:CREATED:` property | Creation date |
| `:ID:` / `:CUSTOM_ID:` property | Source reference |
| Any other property | Custom field |
| `CLOCK:` lines in `:LOGBOOK:` | Spent time |
| `+1d` / `+1w` / `+1m` repeater | Daily / weekly / monthly recurrence |
| Body text | Card description |
| `- [ ]` / `- [X]` checkboxes, level-3 headings without children | Checklist named after the card |
| Level-3 heading with children | Checklist, its descendants the items |

### What is not kept

The import reports these on the loss report:

- text before the first heading (other than `#+` lines);
- text under a level-1 (list) heading;
- a repeater other than every 1 day, week or month (`+2w`), or a warning
  delay (`-2d`): the date is kept, the repeat is not;
- a SCHEDULED, DEADLINE or CLOSED value that is not a date, and a `:CREATED:`
  that is not one;
- a property line that is not `:NAME: value`, an open clock (no end), and any
  drawer other than PROPERTIES and LOGBOOK.

The Org mode export does not write swimlanes, members, comments, spent time
or attachments.

### How it is built and tested

- `models/lib/orgModeFormat.js` reads and writes the outline.
  `models/import.js` sends the text to the parser, and
  `models/kanboardCreator.js` creates the board.
- `tests/orgMode.test.cjs` is the unit test of the round trip.
  `tests/importLossReport.test.cjs` covers the loss report.
- The Playwright cases are in
  `tests/playwright/specs/import-export-format-audit.e2e.js`: "Org mode:
  headings import with their keyword, priority, tags, deadline, body and
  checkboxes", and the export menu link for every format.

## Commits

 - [Org mode: every property is kept, :ID: is the card's reference, LOGBOOK clocks are its spent time](https://github.com/wekan/wekan/commit/55c3f574f4d0ba3fce3e507679b8c9d467feea46)
 - [Repeating tasks of other tools repeat in WeKan: daily, weekly and monthly as the card's recurrence](https://github.com/wekan/wekan/commit/24ac6b2bd2e55323fa1c6e52eb53ff3291fc80fb)
 - [The Markdown, Obsidian, OPML and Org mode outlines and the Notion CSV are written a page of cards at a time](https://github.com/wekan/wekan/commit/ce40b56abdf5b166f523dab98a14414907809b1f)
 - [Read every import source through one path and one file chooser, from one description of the sources](https://github.com/wekan/wekan/commit/c80a656901103bfd29b41843c7e255b4ed3bfa17)
 - [Import and export many boards at once for every format, and document each format in its own directory](https://github.com/wekan/wekan/commit/7858d84e127c2c6cd92134166352b9a4245d4ec2)
 - [Import and export boards as Org mode outlines](https://github.com/wekan/wekan/commit/711303af323cea93827e9032e2f62df779a7a185)
