# Org mode

WeKan imports and exports a board as an [Org mode](https://orgmode.org/manual/)
outline: the `.org` text file that Emacs, Orgzly, Beorg and organice write.
Top-level headings are lists and second-level headings are cards. TODO
keywords, priorities, tags, SCHEDULED, DEADLINE and CLOSED dates, the
`:CREATED:` property, body text and checkboxes are kept.

## How to import

1. Find the `.org` file. Org mode keeps its outlines as plain text files, so
   there is nothing to export: use the file Emacs, Orgzly, Beorg or organice
   saved. Where a mobile app keeps its files, see that app's documentation.
2. In WeKan, go to **All Boards → New → Import → Org mode**.
3. Open the file in a text editor, copy all of it and paste it into the text
   box.
4. Click **Import**.
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

Text without any heading line is refused, and no board is created.

## How to import many boards at once

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

## How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Choose what to include, then under **JSON** choose **Org mode**. The board
   downloads as `<board>.org`.
3. Open the file in Emacs (or another Org mode app) like any other `.org`
   file.

The Org mode entry is offered for a whole board only, not for a swimlane or a
list.

## How to export all boards at once

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

## Format details

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
- `:CREATED:` becomes the creation date;
- body text becomes the description;
- checkboxes and level-3 headings without children become the card's
  checklist, and level-3 headings with children become checklists of their
  own;
- `#+TITLE` becomes the board title.

Timestamps have no zone in Org, and are read and written as UTC. Repeaters
and warning delays, text under a list heading and text before the first
heading are reported. Comments have no place in Org and are not exported.

What the current code does (`models/lib/orgModeFormat.js`):

- Keywords come from `#+TODO`, `#+SEQ_TODO` or `#+TYP_TODO` lines. Words
  after `|` are done keywords; without `|`, the last word is the done
  keyword. Without such a line, the keywords are TODO and DONE.
- A heading's keyword, `[#X]` priority and trailing `:tag:` list are taken off
  its title.
- A planning line (SCHEDULED, DEADLINE, CLOSED) is read when it comes before
  the body text. A timestamp may be active `<…>` or inactive `[…]`, with or
  without a time.
- Of the property drawer, only `:CREATED:` is read. Other drawers (such as
  `:LOGBOOK:`) are skipped.
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
- the creation date as `:CREATED:` in a property drawer;
- the description, indented three spaces;
- each checklist as `*** <checklist>` with `**** TODO` / `**** DONE` items.

Archived cards and archived lists are not exported.

## What is kept

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
| Body text | Card description |
| `- [ ]` / `- [X]` checkboxes, level-3 headings without children | Checklist named after the card |
| Level-3 heading with children | Checklist, its descendants the items |

## What is not kept

The import reports these on the loss report:

- text before the first heading (other than `#+` lines);
- text under a level-1 (list) heading;
- a repeater (`+1w`) or warning delay (`-2d`) on a planning timestamp: the
  date is kept, the repeat is not;
- a SCHEDULED, DEADLINE or CLOSED value that is not a date.

Properties other than `:CREATED:` and other drawers are skipped without a
report.

The Org mode export does not write swimlanes, members, comments, custom fields
or attachments.

## REST API

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

## How it is built and tested

- `models/lib/orgModeFormat.js` reads and writes the outline.
  `models/import.js` sends the text to the parser, and
  `models/kanboardCreator.js` creates the board.
- `tests/orgMode.test.cjs` is the unit test of the round trip.
  `tests/importLossReport.test.cjs` covers the loss report.
- The Playwright cases are in
  `tests/playwright/specs/import-export-format-audit.e2e.js`: "Org mode:
  headings import with their keyword, priority, tags, deadline, body and
  checkboxes", and the export menu link for every format.

## Sources

- [The Org Manual](https://orgmode.org/manual/): headlines, TODO keywords,
  priorities, tags, timestamps, planning lines, drawers and checkboxes

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).
