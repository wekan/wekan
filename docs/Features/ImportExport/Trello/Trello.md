# Trello

WeKan imports boards from [Trello](https://trello.com/) in three ways: one
board's JSON export, a `.zip` with many boards and their attachments, and
directly from Trello's API with an API key and token. Trello lists become
lists, cards become cards, and labels, checklists, comments, custom fields,
votes, stickers, locations and attachments come along.

WeKan also exports a board as Trello board JSON. Trello itself cannot import
JSON, so that file is for WeKan and for other tools that read Trello exports.

## How to import

### One board, from its JSON export

1. In Trello, open the board menu (the three dots), choose **Print, export,
   and share**, then the JSON export
   ([Trello's guide](https://support.atlassian.com/trello/docs/exporting-data-from-trello/)).
   Save the JSON.
2. In WeKan, go to **All Boards → New → Import → Trello**.
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

### Directly from Trello's API

1. Get a Trello API key, and generate a token under it. WeKan's page points to
   `https://trello.com/app-key` for this.
2. In WeKan, go to **All Boards → New → Import → Trello**, and scroll to
   **Import directly from Trello with API key and token**.
3. Enter the key and token and click **Save**. They are kept on the server and
   never sent to the browser again.
4. Click **List Trello workspaces**, choose where to place the imported
   workspaces under **Place imported workspaces under**, and select the boards.
5. Click **Import selected boards**. The import runs as a job on the server.
   **Import progress** shows it, and it can be cancelled, resumed, or
   cancelled with the boards it already made deleted.

## How to import many boards at once

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

## How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Under **Select what to include:**, tick the parts to export.
3. Under **JSON**, choose **Trello**. The board downloads as a `.json` file.
4. Trello cannot import it: Trello's own documentation says it is not possible
   to import JSON or CSV to re-create a Trello board
   ([Trello's guide](https://support.atlassian.com/trello/docs/exporting-data-from-trello/)).
   The file is read by WeKan's Trello import and by other tools that import
   Trello exports.

## How to export all boards at once

1. **All Boards → sidebar → Export all boards**, then choose **Trello**.
   This downloads one `.zip` with one Trello file per board you can
   export: boards you are a member of, that are not archived and are not
   templates. A board you may not export is left out and named in
   `skipped.txt` in the `.zip`.
2. To export only some boards, use **Multi-Selection** in the All Boards
   sidebar, select the boards, then **Export**.

From a script: `python3 api.py exportallboards trello boards.zip`.

## Format details

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

## What is kept

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

## What is not kept

The import reports on the loss report the Power-Up data (`pluginData`) of the
board and of its cards: Trello has no native sprints or releases, and
Power-Up data has no published schema.

The import does not read a card's start date. Member votes of unmapped members
are not kept, since WeKan keeps votes per user.

The export leaves out archived cards and lists, swimlanes, members, dates other
than the due date, checklists, comments, custom fields, attachments and
everything else a card has.

## REST API

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

## How it is built and tested

- `models/trelloCreator.js` creates the board.
  `client/components/import/trelloMembersMapper.js` lists the members to map.
- `server/routes/importTrelloZip.js` serves `/import-trello` for a `.json` and
  a `.zip`. `server/trelloApiImport.js` holds the saved API credentials and
  downloads attachments, backgrounds, avatars and stickers.
  `models/trelloImportJobs.js` tracks API import jobs.
- `models/lib/externalExportFormatters.js` (`trello`) writes the export, from
  what `models/lib/externalExporters.js` collects.
- Unit tests: `tests/trelloCreator.import.test.js`,
  `tests/trelloImport.maplink.test.js`, `tests/trelloImport.zip.test.js`,
  `tests/durableTrelloImport.test.cjs`, `tests/externalScrumPlanning.test.cjs`
  (the Power-Up losses) and `tests/externalExportRoundTrip.test.cjs`. The
  fixture is `tests/fixtures/import-formats/trello.json`.
- Playwright: `tests/playwright/specs/import-export-format-audit.e2e.js`
  (a Trello `.zip` imports a comment, a checklist and exact attachment bytes,
  and a JSON round trip keeps them; the HTTP import obeys the Admin Panel
  import switch and rejects invalid requests).

## Sources

- [Exporting data from Trello](https://support.atlassian.com/trello/docs/exporting-data-from-trello/):
  the JSON export, and that Trello imports no JSON or CSV
- [Trello Boards API](https://developer.atlassian.com/cloud/trello/rest/api-group-boards/)
  and [Cards API](https://developer.atlassian.com/cloud/trello/rest/api-group-cards/):
  the board and card objects
- [Automating exports](https://developer.atlassian.com/cloud/trello/guides/rest-api/automating-exports/):
  exporting boards through the API
- [Trello Attachments Downloader](https://github.com/wekan/trello-attachments-downloader):
  the `.zip` with boards and attachment files

## More

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
