# Trello

## What it is

WeKan imports boards from [Trello](https://trello.com/) in three ways: one
board's JSON export, a `.zip` with many boards and their attachments, and
directly from Trello's API with an API key and token. Trello lists become
lists, cards become cards, and labels, checklists, comments, custom fields,
votes, stickers, locations and attachments come along.

WeKan also exports a board as Trello board JSON. Trello itself cannot import
JSON, so that file is for WeKan and for other tools that read Trello exports.

## Read more

- [Wikipedia: Trello](https://en.wikipedia.org/wiki/Trello)
- [Exporting data from Trello](https://support.atlassian.com/trello/docs/exporting-data-from-trello/):
  the JSON export, and that Trello imports no JSON or CSV
- [Trello Boards API](https://developer.atlassian.com/cloud/trello/rest/api-group-boards/)
  and [Cards API](https://developer.atlassian.com/cloud/trello/rest/api-group-cards/):
  the board and card objects
- [Automating exports](https://developer.atlassian.com/cloud/trello/guides/rest-api/automating-exports/):
  exporting boards through the API
- [Trello Attachments Downloader](https://github.com/wekan/trello-attachments-downloader):
  the `.zip` with boards and attachment files

- [Migrating from Trello](./trello/Migrating-from-Trello.md): the older
  migration guide, and attachments.
- [trello/api.py](./trello/api.py): a Python CLI for Trello's API, showing
  boards, cards and actions as JSON and downloading attachments
  ([CHANGELOG](./trello/CHANGELOG.md), [LICENSE](./trello/LICENSE),
  example [trello-project100.json](./trello/trello-project100.json)).
- [trello2wekan](./trello2wekan/index-html.txt): a single HTML page that
  converts pasted Trello JSON for WeKan's Trello import
  ([custom element](./trello2wekan/pretty-json-custom-element-js.txt)).
- [trellinator](./trellinator/readme.txt): Trellinator libraries updated for
  WeKan, and a [list of priorities](./trellinator/WekanPriorities.png) for WeKan
  to reach Trello's API.

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

#### One board, from its JSON export

1. In Trello, open the board menu (the three dots), choose **Print, export,
   and share**, then the JSON export
   ([Trello's guide](https://support.atlassian.com/trello/docs/exporting-data-from-trello/)).
   Save the JSON.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → Trello**.
3. Choose the `.json` file under **Choose the export file, or paste its text below:**, or paste the
   JSON into the
   text box. Optionally write a **Personal workspace name**: the board is
   placed under that workspace, which is created if it does not exist. Tick
   the parts to import.
4. Click **Import**. WeKan then asks you to map the Trello members to WeKan
   users; members with the same username are matched for you. Map them and
   click **Done**, or click **Import without mapping members (map later)**.
   Members left unmapped are brought in as placeholder users, so cards,
   comments and activities keep the original person.
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

A `.json` export carries no attachment files. If you have saved a Trello API
key and token (below), WeKan downloads the board's attachments, background
image, member avatars and stickers from Trello during the import.

#### Directly from Trello's API

1. Get a Trello API key, and generate a token under it. WeKan's page points to
   `https://trello.com/app-key` for this.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → Trello**, and scroll to
   **Import directly from Trello with API key and token**.
3. Enter the key and token and click **Save**. They are kept on the server and
   never sent to the browser again.
4. Click **List Trello workspaces**, choose where to place the imported
   workspaces under **Place imported workspaces under**, and select the boards.
5. Click **Import selected boards**. The import runs as a job on the server.
   **Import progress** shows it, and it can be cancelled, resumed, or
   cancelled with the boards it already made deleted.

Labels whose name starts with `Swimlane: ` are imported as **swimlanes**, not
labels: one swimlane per such label, and each card goes to the swimlane of its
first one (cards without one go to **Default**). This is how a board exported
to Trello by WeKan (below) comes back with its swimlanes, and a Trello board
can be arranged the same way by hand.

#### On Sandstorm

A Sandstorm grain has no Internet access of its own. The Trello import page
shows **Allow access to Trello**: it opens the Sandstorm Powerbox, where you
let the grain reach `https://api.trello.com/1`, the same way the Sandstorm
WordPress app is allowed to reach wordpress.org for plugin updates. WeKan keeps
the access for your user; the connection is listed, and can be revoked, in the
grain's Sandstorm settings. **Forget** removes it from WeKan.

Through the Powerbox, WeKan reaches only Trello's API. Files uploaded to Trello
cannot be downloaded that way (Trello needs an `Authorization` header that the
Sandstorm proxy keeps for its own token), so they are left out and counted in
the import result; add them with the attachments `.zip` above. Board
backgrounds, member avatars and stickers are on other hosts and are skipped
too. See
[Sandstorm Powerbox: external APIs](../../../../../Platforms/FOSS/Container/Sandstorm/Powerbox-External-APIs.md).

### How to import many boards at once

- On the import page, under **Import many boards**, choose several Trello JSON
  files, or one `.zip` that holds them. Each file becomes its own board,
  imported without member mapping. Members can be mapped later. Click **Import**
  to import them.
- Trello also keeps its own **Trello .zip file** import, for many boards with
  their attachments. The `.zip` holds one or more board `.json` files and their
  attachments in board-name subfolders, as the
  [Trello Attachments Downloader](https://github.com/wekan/trello-attachments-downloader)
  writes them. Choose it under **Trello .zip file** on the Trello import page
  and click **Import**: every board in it is imported, with its attachment
  files, and WeKan goes to All Boards. Limits: the upload is at most 200 MB,
  at most 5000 files, at most 1 GB uncompressed, and at most 100 MB per file.
  A zip with unsafe file paths is refused.
- The API import above also imports many boards at once.
- The checkbox **One board per project** is not offered for Trello: a Trello
  file is always one board.
- From a script:
  `python3 api.py importboardsfrom trello FILE_OR_DIR ...` takes files,
  directories of files, or `.zip` files.

### How to export

#### Directly into Trello, through Trello's API

1. Open the board, then **Board Settings → Export**, and choose **Trello**
   under the formats written for other tools.
2. In **Export to Trello**, enter your Trello API key and token, unless they
   are already saved by the import above. On Sandstorm, click **Allow access to
   Trello** first.
3. Tick or untick **Include attachments**, and click **Export to Trello**.
4. The board is created in Trello as a private board, with its labels, lists,
   cards (description, start and due dates, labels), checklists, comments
   (each starting with its author and time, since in Trello every comment is
   by you) and attachment files. Archived lists and cards are archived in
   Trello too. Progress is shown; when it is done, **Open the board in
   Trello**. Anything Trello refused is listed and the rest is still exported.

Trello has no swimlanes. A board with more than one swimlane gets one label per
swimlane, named `Swimlane: <title>`, on each card of that swimlane. The free
**Swimlanes by Blue Cat** Power-Up groups a Trello board into rows by label, so
Trello shows the swimlanes again, and dragging a card between rows moves the
label. WeKan's Trello import turns those labels back into swimlanes.

#### As a Trello JSON file

1. In WeKan, open the board, then **Board Settings → Export**.
2. Under **Select what to include:**, tick the parts to export.
3. Under **JSON**, choose **Trello**. The board downloads as a `.json` file.
4. Trello cannot import it: Trello's own documentation says it is not possible
   to import JSON or CSV to re-create a Trello board
   ([Trello's guide](https://support.atlassian.com/trello/docs/exporting-data-from-trello/)).
   The file is read by WeKan's Trello import and by other tools that import
   Trello exports.

The file has the cards with their checklists, comments (as `commentCard`
actions), members, custom fields and dates, and the archived cards and lists
as closed ones. WeKan's Trello import reads all of it back.

#### As a Trello .zip, with the attachments

1. In WeKan, open the board, then **Board Settings → Export**.
2. Choose **Trello .zip Attachments**. The download is `trello.zip`: the
   Trello JSON as `board.json`, and each card's attachments as files under
   `attachments/`, named `<id>_<file name>`.
3. Import it into another WeKan with **Import → Trello**, choosing the `.zip`:
   the attachments come back with the cards.

The `.zip` is written a page of cards at a time, and the files are streamed
from storage, so a large board does not have to fit in memory.

### How to export all boards at once

1. **All Boards → sidebar → Export all boards**, then choose **Trello**.
   This downloads one `.zip` with one Trello file per board you can
   export: boards you are a member of, that are not archived and are not
   templates. A board you may not export is left out and named in
   `skipped.txt` in the `.zip`.
2. To export only some boards, use **Multi-Selection** in the All Boards
   sidebar, select the boards, then **Export**.

From a script: `python3 api.py exportallboards trello boards.zip`.

### REST API

```bash
python3 api.py importboardfrom trello board.json              # POST /api/boards/import/trello
python3 api.py importboardsfrom trello a.json b.json dir/     # one board per file
python3 api.py exportboardformat BOARDID trello board.json    # GET /api/boards/BOARDID/export/trello?authToken=TOKEN
python3 api.py exportallboards trello boards.zip              # GET /api/export-all-boards/trello?authToken=TOKEN
```

`GET /api/export-all-boards/trello?authToken=TOKEN&boardIds=ID1,ID2` exports
only the boards listed.

The import page sends Trello imports, `.json` and `.zip`, to `POST
/import-trello` over HTTP rather than over the realtime connection. It honors
the Admin Panel switch that turns imports off.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- When the free disk space cannot be measured, a Trello .zip may unpack to at
  most 1 GB. (`DEFAULT_TOTAL_UNCOMPRESSED` in
  [server/routes/importTrelloZip.js](../../../../../../server/routes/importTrelloZip.js#L30))
- A Trello .zip may hold at most 5,000 files. (`MAX_ENTRIES` in
  [server/routes/importTrelloZip.js](../../../../../../server/routes/importTrelloZip.js#L31))
- One file inside a Trello .zip may unpack to at most 100 MB. (`MAX_FILE_BYTES`
  in
  [server/routes/importTrelloZip.js](../../../../../../server/routes/importTrelloZip.js#L32))
- At most 50 warnings are kept for one Trello API export. (`MAX_WARNINGS` in
  [server/trelloApiExport.js](../../../../../../server/trelloApiExport.js#L26))
- Requests to the Trello API are at least 120 ms apart. (`MIN_REQUEST_GAP_MS` in
  [server/trelloApiImport.js](../../../../../../server/trelloApiImport.js#L72))
- A failed Trello API request is retried up to 5 times. (`MAX_RETRIES` in
  [server/trelloApiImport.js](../../../../../../server/trelloApiImport.js#L73))
- The wait before a retry starts at 1,000 ms. (`BASE_BACKOFF_MS` in
  [server/trelloApiImport.js](../../../../../../server/trelloApiImport.js#L74))
- The wait before a retry is at most 30,000 ms. (`MAX_BACKOFF_MS` in
  [server/trelloApiImport.js](../../../../../../server/trelloApiImport.js#L75))
- One Trello API request may take 30,000 ms. (`REQUEST_TIMEOUT_MS` in
  [server/trelloApiImport.js](../../../../../../server/trelloApiImport.js#L76))
- An attachment download follows at most 5 redirects. (`MAX_DOWNLOAD_REDIRECTS`
  in
  [server/trelloApiImport.js](../../../../../../server/trelloApiImport.js#L133))
- A server that runs a durable Trello import job holds it for 2 minutes at a
  time and renews it while it works, so another server can take over a job whose
  server stopped. (`JOB_LEASE_MS` in
  [server/trelloApiImport.js](../../../../../../server/trelloApiImport.js#L675))

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
[client/components/import/trelloMembersMapper.js](../../../../../../client/components/import/trelloMembersMapper.js),
[imports/sandstorm/egress.mjs](../../../../../../imports/sandstorm/egress.mjs),
[models/lib/trelloExportPlan.js](../../../../../../models/lib/trelloExportPlan.js),
[models/trelloCreator.js](../../../../../../models/trelloCreator.js),
[models/trelloImportJobs.js](../../../../../../models/trelloImportJobs.js),
[server/routes/importTrelloZip.js](../../../../../../server/routes/importTrelloZip.js),
[server/sandstormEgress.js](../../../../../../server/sandstormEgress.js),
[server/trelloApiExport.js](../../../../../../server/trelloApiExport.js),
[server/trelloApiImport.js](../../../../../../server/trelloApiImport.js).

The tests that pin it:
[tests/durableTrelloImport.test.cjs](../../../../../../tests/durableTrelloImport.test.cjs),
[tests/externalExportRoundTrip.test.cjs](../../../../../../tests/externalExportRoundTrip.test.cjs),
[tests/externalScrumPlanning.test.cjs](../../../../../../tests/externalScrumPlanning.test.cjs),
[tests/playwright/specs/import-export-format-audit.e2e.js](../../../../../../tests/playwright/specs/import-export-format-audit.e2e.js),
[tests/relayBleed.test.cjs](../../../../../../tests/relayBleed.test.cjs),
[tests/sandstormApiEgress.test.mjs](../../../../../../tests/sandstormApiEgress.test.mjs),
[tests/trelloApiExport.test.cjs](../../../../../../tests/trelloApiExport.test.cjs),
[tests/trelloCreator.import.test.js](../../../../../../tests/trelloCreator.import.test.js),
[tests/trelloExportPlan.test.cjs](../../../../../../tests/trelloExportPlan.test.cjs),
[tests/trelloImport.maplink.test.js](../../../../../../tests/trelloImport.maplink.test.js),
[tests/trelloImport.zip.test.js](../../../../../../tests/trelloImport.zip.test.js).

The details of the format, what is kept and how it is tested are below.

### Format details

From the [format coverage](../Format-Coverage.md) audit:

- **Current authoritative shape:** the
  [Boards API](https://developer.atlassian.com/cloud/trello/rest/api-group-boards/),
  the [Cards API](https://developer.atlassian.com/cloud/trello/rest/api-group-cards/),
  and [automated exports](https://developer.atlassian.com/cloud/trello/guides/rest-api/automating-exports/).
- **Required import coverage:** board preferences, lists, cards,
  archive/order, members, labels, dates, checklists/items, comments/actions,
  custom fields, stickers, coordinates, covers/backgrounds and attachment
  metadata and bytes.
- **Scrum:** Trello has no sprints or releases. Power-Up data (`pluginData`),
  where Scrum Power-Ups keep their state, has no published schema and is
  counted in the loss report.

What the current code does (`models/trelloCreator.js`,
`server/routes/importTrelloZip.js`, `server/trelloApiImport.js`):

- Trello has no swimlanes, so the board gets one swimlane, **Default**, before
  its lists.
- Creation dates and creators of the board, lists and cards come from the
  export's `actions` (`createBoard`, `createList`, `createCard`). Very old
  boards without those actions get the import time.
- Comments come from `commentCard` actions and keep their author and date.
- Attachments are gathered from the `addAttachmentToCard` actions and from
  `card.attachments`, once each. Their bytes come from the `.zip`, from the
  API import, or are downloaded from a publicly reachable URL; a blocked URL
  skips that attachment only. Trello-hosted uploads need OAuth, so they need
  the `.zip` or saved API credentials. A link attachment (its name is the URL)
  is added to the description under a Links heading instead.
- A board URL that is not `http(s)` is dropped and recorded in **Admin Panel →
  Problems**.
- The board permission follows the instance's board visibility policy.

### What is kept

| Trello | WeKan |
| --- | --- |
| Board `name` | Board title (made unique) |
| `prefs.background`, background image | Board color, background image |
| `prefs.permissionLevel` | Board visibility (public or private) |
| Board `closed` | Archived board |
| Labels (name, color) | Board labels |
| Members | Board members, mapped or placeholder users |
| Board `customFields` (a `list` field as a dropdown) | Custom fields |
| Lists (`name`, `pos`, `closed`) | Lists, in order, archived when closed |
| Card `name`, `desc` | Card title, description |
| `idShort` | Card number |
| `pos`, `closed` | Card order, archived card |
| `due`, `dueComplete` | Due date, due date done |
| `idLabels` | Card labels |
| `idMembers` | Card members, when mapped |
| `idMembersVoted` | A public vote with those members' positive votes |
| `customFieldItems` | Custom field values |
| `cover.color`, cover attachment | Card color, card cover |
| `locationName`, `address`, `coordinates` | Location |
| `stickers` | Stickers |
| Checklists and items | Checklists and items |
| `commentCard` actions | Comments |
| Attachments | Attachments, or links in the description |

The export writes `name`, `prefs` (background blue, private), every board
label, the lists (`id`, `name`) and, per card, `id`, `name`, `desc`, `idList`,
`due` and `idLabels`. Members, checklists and actions are written empty.

### What is not kept

The import reports on the loss report the Power-Up data (`pluginData`) of the
board and of its cards: Trello has no native sprints or releases, and
Power-Up data has no published schema.

The import does not read a card's start date. Member votes of unmapped members
are not kept, since WeKan keeps votes per user.

The export leaves out archived cards and lists, swimlanes, members, dates other
than the due date, checklists, comments, custom fields, attachments and
everything else a card has.

### How it is built and tested

- `models/trelloCreator.js` creates the board.
  `client/components/import/trelloMembersMapper.js` lists the members to map.
- `server/routes/importTrelloZip.js` serves `/import-trello` for a `.json` and
  a `.zip`. `server/trelloApiImport.js` holds the saved API credentials and
  downloads attachments, backgrounds, avatars and stickers.
  `models/trelloImportJobs.js` tracks API import jobs.
- `models/lib/externalExportFormatters.js` (`trello`) writes the export, from
  what `models/lib/externalExporters.js` collects.
- `server/trelloApiExport.js` exports a board into Trello through its API, from
  the plan `models/lib/trelloExportPlan.js` builds out of the board export
  (`models/exporter.js`, with its access check). The same file's
  `swimlanesFromTrelloBoard` turns `Swimlane: ` labels back into swimlanes on
  import. On Sandstorm, `server/sandstormEgress.js` and
  `imports/sandstorm/egress.mjs` route the Trello requests through the
  Powerbox grant.
- `tests/trelloExportPlan.test.cjs` (the mapping and the swimlane round trip),
  `tests/trelloApiExport.test.cjs` (the export against a fake Trello API, with
  its warnings and refusals), `tests/sandstormApiEgress.test.mjs` (the Powerbox
  descriptor, the claim and the proxied requests against a fake bridge proxy)
  and `tests/relayBleed.test.cjs` (no download leaves a Sandstorm grain).
- Unit tests: `tests/trelloCreator.import.test.js`,
  `tests/trelloImport.maplink.test.js`, `tests/trelloImport.zip.test.js`,
  `tests/durableTrelloImport.test.cjs`, `tests/externalScrumPlanning.test.cjs`
  (the Power-Up losses) and `tests/externalExportRoundTrip.test.cjs`. The
  fixture is `tests/fixtures/import-formats/trello.json`.
- Playwright: `tests/playwright/specs/import-export-format-audit.e2e.js`
  (a Trello `.zip` imports a comment, a checklist and exact attachment bytes,
  and a JSON round trip keeps them; the HTTP import obeys the Admin Panel
  import switch and rejects invalid requests).

## Commits

 - [Import: a .zip that becomes a new board, and a Trello API import, run as the importing user](https://github.com/wekan/wekan/commit/a7cd22f94ca17a5702fa7f0c81e439c2df03cebc)
 - [Trello .zip export: the Trello board JSON with the cards' attachment files, imported back with them](https://github.com/wekan/wekan/commit/e8330fb090c885c9d8ea015ed896c34a9b6cf251)
 - [Trello export carries the archived cards and lists, as Trello's closed ones](https://github.com/wekan/wekan/commit/3ac8b802c5a6be6bfebdb4d3303625a8e1cf3484)
 - [Trello export carries the custom fields; the Trello import reads a number field's value as a number](https://github.com/wekan/wekan/commit/c20c7296a8cd6ee2232b9cda99c20f719a2794a2)
 - [Trello export imports back, with its checklists, comments and members](https://github.com/wekan/wekan/commit/cde21a7651262efe00147228ea57cf67d8fdc004)
 - [Trello import of a file with no members no longer does nothing](https://github.com/wekan/wekan/commit/d1be2d2131714d023a22a6ffc0a94de651dc7f4e)
 - [JSON exports whose cards are one array are written a page at a time: Trello, Jira, Asana, Zenkit, OpenProject, GitHub ](https://github.com/wekan/wekan/commit/f293ae4076092a387505b1909053cd66a62441c8)
 - [WeKan and Trello .zip imports use the shared upload, limit and disk check; .mbox and .enex export a page at a time](https://github.com/wekan/wekan/commit/3b1c7ce7bb430834e024d7684734f7586a07b007)
 - [Export boards to Trello, keep swimlanes as labels, and reach Trello from Sandstorm](https://github.com/wekan/wekan/commit/88d00e02f1251716e345b7bbd32185417b08842d)
 - [Attach a card to a card, as Trello's card attachments, and import them from Trello](https://github.com/wekan/wekan/commit/32fa89fdc3d695e97bc0c836528b234b02d44c6b)
 - [Streamed attachments are stored again, and a Trello .zip brings its files](https://github.com/wekan/wekan/commit/e7be1ed082c1c05c1b46a5fae5ad7d4e7f84643c)
 - [Stream live Trello import attachments from Trello into storage as each card is made](https://github.com/wekan/wekan/commit/ddc025c24d707c377afbf278e96d973c636e81e2)
 - [Stream a Trello .zip import from a temporary file, its attachments into storage](https://github.com/wekan/wekan/commit/cd75f8c47630cf5ed714f8f223d23e1cf87c06de)
 - [Fix RelayBleed: send the Trello credential only to Trello's own hosts during live import](https://github.com/wekan/wekan/commit/de6755047643742e621c58d332dead970b1f8325)
 - [Add Legacy HTML4 Trello API imports](https://github.com/wekan/wekan/commit/6a4ce04e2bd8b09b3adc2ee7c6cb9ad0fa964d6c)
 - [Add Legacy HTML4 Trello ZIP imports](https://github.com/wekan/wekan/commit/600ee4b027cc87247a15ca3e91218f05029da458)
 - [Share the server ZIP reader with Trello imports](https://github.com/wekan/wekan/commit/cda021ba21b5db9ceda0ce6472adec6d83dde361)
 - [Greatly improved import from Trello to WeKan](https://github.com/wekan/wekan/commit/899617bd4d83905df05fd8aab1d26630e676fee5)
 - [Fixed new checklists (and checklist items) on a newly added card not being visible until logout/login. The `board` ](https://github.com/wekan/wekan/commit/075e86b00e1f0dc0dea519acd37cece4d0a1fad3)
 - [Ref: trello & wekan importers](https://github.com/wekan/wekan/commit/f8d927c61a1cd9a485e38a1a5ce8e7578e85f473)
 - [Comment out Trello attachment import until it's implemented with API key](https://github.com/wekan/wekan/commit/49a996624f3842c243bb72120b95c27d914e02a9)
 - [Try to fix Trello import Attachment and links not defined](https://github.com/wekan/wekan/commit/5eca3de00fea31721fa2e10b7d3a6f13ca87f39c)
 - [Ref: trello & wekan importers](https://github.com/wekan/wekan/commit/e2934b9b09a28000db969b2ddb1a5189444c7eb7)
 - [Try to fix: Wekan UI fails to finish import of closed Trello boards](https://github.com/wekan/wekan/commit/007e0f1c16c935ce580093a6aec31305c75d1e45)
 - [Fix for issue #1569 Trello data without labels definition](https://github.com/wekan/wekan/commit/74ac7d8d3f6cb3c66b16425c4b3ee4419c8430c2)
 - [Add Trello attached links to the card description](https://github.com/wekan/wekan/commit/1083a92816e2a7b80f596048b9b6bf81e606d36b)
 - [Correctly import Trello dropdown custom fields](https://github.com/wekan/wekan/commit/e463f79532cae9a779889762d48f9ed67f821aad)
 - [Trello custom field import basically working](https://github.com/wekan/wekan/commit/b793716e851e52d7e07f1676d47b63bfefc7a076)
 - [Initial work on import of custom fields from Trello](https://github.com/wekan/wekan/commit/c89a0eb694ff68eecceabae599bfcb96e2d8bab5)
 - [Fix Trello import](https://github.com/wekan/wekan/commit/faad739f974a0392ca73e4db03e5267edcc5dec7)
