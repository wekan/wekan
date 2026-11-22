# Nextcloud Deck

## What it is

WeKan imports boards from [Nextcloud Deck](https://apps.nextcloud.com/apps/deck)
and exports a board in the same shape. It reads a Deck board as Deck's REST
API returns it: a board with its stacks, each stack carrying its cards. Stacks
become lists and cards become cards. In WeKan's menus the tool is named
**NextCloud Deck**.

## Read more

- [Wikipedia: Nextcloud, whose Deck app is a kanban board](https://en.wikipedia.org/wiki/Nextcloud)
- [Deck REST API](https://deck.readthedocs.io/en/latest/API/): the board,
  stack and card objects, the base URL and the `OCS-APIRequest` header
- [Deck user documentation](https://deck.readthedocs.io/en/latest/User_documentation_en/):
  `occ deck:import` and the sources it reads

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

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
3. In WeKan, go to **All Boards → Add Board → Import → Import board → NextCloud Deck**.
4. Paste the JSON into the text box. Tick the parts to import.
5. Click **Import**. Deck has no member-mapping step in WeKan, so the people
   in the file do not become card members; the card's owner is kept as
   **Requested by**.
6. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

Deck's own `occ deck:export` command writes a different file, based on Deck's
database schema. WeKan does not read that file.

### How to import many boards at once

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

### How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Under **Select what to include:**, tick the parts to export.
3. Under **JSON**, choose **NextCloud Deck**. The board downloads as a `.json`
   file.
4. Deck does not import this file. `occ deck:import` reads Deck's own
   `occ deck:export` file and Trello exports. To create the stacks and cards
   in Deck, send them through its
   [REST API](https://deck.readthedocs.io/en/latest/API/). The file is also
   what WeKan's own Deck import reads.

### How to export all boards at once

1. **All Boards → sidebar → Export all boards**, then choose **NextCloud Deck**.
   This downloads one `.zip` with one Deck file per board you can
   export: boards you are a member of, that are not archived and are not
   templates. A board you may not export is left out and named in
   `skipped.txt` in the `.zip`.
2. To export only some boards, use **Multi-Selection** in the All Boards
   sidebar, select the boards, then **Export**.

From a script: `python3 api.py exportallboards deck boards.zip`.

### REST API

```bash
python3 api.py importboardfrom deck deck.json                 # POST /api/boards/import/deck
python3 api.py importboardsfrom deck a.json b.json dir/       # one board per file
python3 api.py exportboardformat BOARDID deck deck.json       # GET /api/boards/BOARDID/export/deck?authToken=TOKEN
python3 api.py exportallboards deck boards.zip                # GET /api/export-all-boards/deck?authToken=TOKEN
```

`GET /api/export-all-boards/deck?authToken=TOKEN&boardIds=ID1,ID2` exports
only the boards listed.

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

The tests that pin it:
[tests/deckImport.test.cjs](../../../../../../tests/deckImport.test.cjs),
[tests/externalExportRoundTrip.test.cjs](../../../../../../tests/externalExportRoundTrip.test.cjs),
[tests/importLossReport.test.cjs](../../../../../../tests/importLossReport.test.cjs),
[tests/importedTaskPlan.test.cjs](../../../../../../tests/importedTaskPlan.test.cjs),
[tests/playwright/specs/import-export-format-audit.e2e.js](../../../../../../tests/playwright/specs/import-export-format-audit.e2e.js).

The details of the format, what is kept and how it is tested are below.

### Format details

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
  `writeImportedEntity`. Attachment files are downloaded with the sign-in the
  import page asks for (below); sharing rules are reported. Deck sharing rules stay a reported
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
- A label keeps its color (Deck's hex `color`, such as `0082c9`); a label
  without one is created black.

### What is kept

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
| `labels` (`title`, `color`) | Board labels, with their colors |
| `comments` (`message`, `actorId`, `creationDateTime`) | Comments |

The export writes the board `title` and a stack per list, in order. Each card
has `title`, `description`, `duedate`, the labels as `{ title }`, `createdAt`,
the end date as `done` (or `done: true` for a due date ticked done without an
end date), the owner and further people as `assignedUsers`, the
creator as `owner` and the comments.

### What is not kept

The import reports these on the loss report:

- the board's `acl` sharing rules (board access is granted in WeKan, not by an
  import);
- an attachment that could not be downloaded, and why (no sign-in given, a
  refused address, an HTTP error);
- an `attachmentCount` with no `attachments` list: nothing names the files
  (`GET .../cards/{cardId}/attachments` lists them);
- deleted stacks and cards, as a warning.

Deck has no member mapping in WeKan, so assignees do not become card members.

The export leaves out swimlanes (every card is in its list's stack),
archived cards and lists, checklists, attachments, custom fields, start dates
and dependencies.

### Attachment files

Each card's `attachments` list names its files; Deck's REST API documents
`GET /index.php/apps/deck/api/v1.0/boards/{boardId}/stacks/{stackId}/cards/{cardId}/attachments/{attachmentId}`
as the file itself (`v1.1` for the `file` type, the Nextcloud Files ones of
Deck 1.3 and later). Under **Attachment files** on the import page, give the
Nextcloud address, the user name and an app password (Nextcloud → Personal
settings → Security → Devices & sessions); the import downloads each file with
them, sending `OCS-APIRequest: true` as the API requires.

The address and the sign-in go with that one import: they are sent only to the
address typed there (an export file names any URL it likes, and one pointing
an attachment elsewhere gets no sign-in), never stored and never logged, and
the token field is emptied when Import is pressed. Every download goes through
the import's SSRF guard, which checks each redirect and drops the sign-in on a
redirect to another host, and lands in Admin Panel → Attachments → Default
Storage like any upload. A file that cannot be fetched is on the loss report
with the reason, and the import goes on. Leaving the fields empty imports the
board without its files. Unticking **Attachments** under what to include
leaves them out too. A service on a private address is refused by the same
guard. `models/lib/importAttachmentAuth.js` decides what is asked of whom.
Through the REST API (`POST /api/boards/import/<source>`), send the same as
`"attachmentAuth": { "url": ..., "username": ..., "token": ... }` beside
`"board"`.

### How it is built and tested

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

## Commits

 - [Every export is held to what its own import reads back: Asana time tracking, Deck's done tick, Kanboard colors](https://github.com/wekan/wekan/commit/1a02de4b5b398018bbe2076d98cba10b01639e5a)
 - [Nextcloud Deck labels keep their colors](https://github.com/wekan/wekan/commit/22d000b9136b11a4f8030d0e5d42e77518a70f64)
 - [Deck and Kanri exports are written a page at a time, each list around its cards](https://github.com/wekan/wekan/commit/21c64e092d8b067a9416a09a92c0ca1424b9da26)
 - [Import: attachment files of Jira, Nextcloud Deck, OpenProject, Asana and GitLab](https://github.com/wekan/wekan/commit/51238ed8ad80179fa54517ab429b7a14c31510e8)
 - [Import Nextcloud Deck assignees, comments, order and archive state](https://github.com/wekan/wekan/commit/5035b7aa2714bbfb1ca129103921ccfb9d601133)
