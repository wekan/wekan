# Nextcloud Deck

WeKan imports boards from [Nextcloud Deck](https://apps.nextcloud.com/apps/deck)
and exports a board in the same shape. It reads a Deck board as Deck's REST
API returns it: a board with its stacks, each stack carrying its cards. Stacks
become lists and cards become cards. In WeKan's menus the tool is named
**NextCloud Deck**.

## How to import

1. Save the board from Deck's REST API
   ([API reference](https://deck.readthedocs.io/en/latest/API/)). The base URL
   is `https://YOUR_NEXTCLOUD/index.php/apps/deck/api/v1.0`, every request
   needs the header `OCS-APIRequest: true`, and it uses basic authentication:

   ```bash
   curl -u USER:PASSWORD -H "OCS-APIRequest: true" \
     https://YOUR_NEXTCLOUD/index.php/apps/deck/api/v1.0/boards/BOARDID > board.json
   curl -u USER:PASSWORD -H "OCS-APIRequest: true" \
     https://YOUR_NEXTCLOUD/index.php/apps/deck/api/v1.0/boards/BOARDID/stacks > stacks.json
   ```

2. Put the stacks into the board object as `stacks`, for example
   `jq --slurpfile s stacks.json '.stacks = $s[0]' board.json > deck.json`.
   `{ "board": {...}, "stacks": [...] }` is read too.
3. In WeKan, go to **All Boards → New → Import → NextCloud Deck**.
4. Paste the JSON into the text box. Tick the parts to import.
5. Click **Import**. Deck has no member-mapping step in WeKan, so the people
   in the file do not become card members; the card's owner is kept as
   **Requested by**.
6. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

Deck's own `occ deck:export` command writes a different file, based on Deck's
database schema. WeKan does not read that file.

## How to import many boards at once

- On the import page, under **Import many boards**, choose several Deck JSON
  files, or one `.zip` that holds them. Each file becomes its own board,
  imported without member mapping. Members can be mapped later. Click **Import**
  to import them.
- The checkbox **One board per project** makes no difference for Deck: a Deck
  board is imported into one swimlane, **Default**, so each file is always one
  board.
- From a script:
  `python3 api.py importboardsfrom deck FILE_OR_DIR ...` takes files,
  directories of files, or `.zip` files.

## How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Under **Select what to include:**, tick the parts to export.
3. Under **JSON**, choose **NextCloud Deck**. The board downloads as a `.json`
   file.
4. Deck does not import this file. `occ deck:import` reads Deck's own
   `occ deck:export` file and Trello exports. To create the stacks and cards
   in Deck, send them through its
   [REST API](https://deck.readthedocs.io/en/latest/API/). The file is also
   what WeKan's own Deck import reads.

## How to export all boards at once

1. **All Boards → sidebar → Export all boards**, then choose **NextCloud Deck**.
   This downloads one `.zip` with one Deck file per board you can
   export: boards you are a member of, that are not archived and are not
   templates. A board you may not export is left out and named in
   `skipped.txt` in the `.zip`.
2. To export only some boards, use **Multi-Selection** in the All Boards
   sidebar, select the boards, then **Export**.

From a script: `python3 api.py exportallboards deck boards.zip`.

## Format details

From the [format coverage](../Format-Coverage.md) audit:

- **Current authoritative shape:** the current Deck server API and code
  objects.
- **Required import coverage:** board, ACL, labels, stacks, cards,
  order/type, assignees, dates, comments and attachments.
- Deck is one of the external adapters that map the listed fields that have a
  WeKan equivalent: comments are posted by the mapped user, otherwise by the
  importer with the source author's name leading the text; start, end and
  creation dates, archive state, several assignees and source order are kept.
  Creation dates survive the schema's `createdAt` autoValue through
  `writeImportedEntity`. File contents (the JSON carries attachment metadata
  only) and sharing rules are reported. Deck sharing rules stay a reported
  loss by design: an import never grants board access.

What the current code does (`parseNextcloudDeck` in
`models/lib/externalParsers.js`):

- Stacks and cards are sorted by their `order`. A card's `type` is not read.
- Stacks and cards with a non-zero `deletedAt` (in Deck's trash) are skipped,
  with a warning.
- Comments come from Deck's separate OCS comments API. They are read when the
  file has them embedded on a card as `comments`.
- `done` is read as the card's end date when it is a date (Deck 1.13 and later
  mark a card done with a timestamp). Either form, a date or Deck's REST API's
  plain `true`, marks the card's due date done. A card without a due date has
  no due date to mark, so `true` alone is not kept for it.
- Label colors are not read: labels are created black.

## What is kept

| Deck | WeKan |
| --- | --- |
| Board `title` | Board title |
| Stack `title`, in `order` | List |
| Card `title`, `description` | Card title, description |
| Card `order` | Card order |
| `duedate` (or `dueDate`) | Due date |
| `createdAt` | Creation date |
| `done` (a date) | End date |
| `archived: true` | Archived card |
| `assignedUsers` | Card members, when mapped |
| `owner` | Requested by |
| `labels` (title) | Board labels |
| `comments` (`message`, `actorId`, `creationDateTime`) | Comments |

The export writes the board `title` and a stack per list, in order. Each card
has `title`, `description`, `duedate`, the labels as `{ title }`, `createdAt`,
the end date as `done`, the owner and further people as `assignedUsers`, the
creator as `owner` and the comments.

## What is not kept

The import reports these on the loss report:

- the board's `acl` sharing rules (board access is granted in WeKan, not by an
  import);
- card attachments (they are Nextcloud files, not part of the export);
- deleted stacks and cards, as a warning.

Deck has no member mapping in WeKan, so assignees do not become card members.

The export leaves out swimlanes (every card is in its list's stack),
archived cards and lists, checklists, attachments, custom fields, start dates
and dependencies.

## REST API

```bash
python3 api.py importboardfrom deck deck.json                 # POST /api/boards/import/deck
python3 api.py importboardsfrom deck a.json b.json dir/       # one board per file
python3 api.py exportboardformat BOARDID deck deck.json       # GET /api/boards/BOARDID/export/deck?authToken=TOKEN
python3 api.py exportallboards deck boards.zip                # GET /api/export-all-boards/deck?authToken=TOKEN
```

`GET /api/export-all-boards/deck?authToken=TOKEN&boardIds=ID1,ID2` exports
only the boards listed.

## How it is built and tested

- `models/lib/externalParsers.js` (`parseNextcloudDeck`) reads the file.
  `models/kanboardCreator.js` creates the board, and
  `models/lib/importedTaskPlan.js` decides what each card becomes.
- `models/lib/externalExportFormatters.js` (`deck`) writes the export, from
  what `models/lib/externalExporters.js` collects.
- Unit tests: `tests/deckImport.test.cjs`, `tests/importedTaskPlan.test.cjs`,
  `tests/importLossReport.test.cjs` and
  `tests/externalExportRoundTrip.test.cjs`. The fixture is
  `tests/fixtures/import-formats/deck.json`.
- Playwright: `tests/playwright/specs/import-export-format-audit.e2e.js`
  (importing the fixture through the page, refusing malformed JSON, the
  Recovery row of an import with losses, and the localized loss report).

## Sources

- [Deck REST API](https://deck.readthedocs.io/en/latest/API/): the board,
  stack and card objects, the base URL and the `OCS-APIRequest` header
- [Deck user documentation](https://deck.readthedocs.io/en/latest/User_documentation_en/):
  `occ deck:import` and the sources it reads

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).
