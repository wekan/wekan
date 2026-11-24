# Microsoft Teams

## What it is

WeKan imports chats and channels of [Microsoft Teams](https://www.microsoft.com/microsoft-teams),
fetched from Microsoft Graph or from an export file, and exports a board as
Teams chats. They show in **Board View → Chat**.

## Read more

- [Wikipedia: Microsoft Teams](https://en.wikipedia.org/wiki/Microsoft_Teams)
- [chatMessage resource type](https://learn.microsoft.com/graph/api/resources/chatmessage)
- [List messages in a chat](https://learn.microsoft.com/graph/api/chat-list-messages)
- [List channel messages](https://learn.microsoft.com/graph/api/channel-list-messages)
- [Import third-party platform messages to Teams](https://learn.microsoft.com/microsoftteams/platform/graph-api/import-messages/import-external-messages-to-teams)
- [Export options for switching from Microsoft Teams](https://learn.microsoft.com/microsoftteams/migration-from-teams)

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

Fetch them (a work or school account):

1. In Microsoft Graph Explorer (developer.microsoft.com/graph/graph-explorer),
   sign in, consent to **Chat.Read** (and, for channels, **Team.ReadBasic.All**,
   **Channel.ReadBasic.All** and **ChannelMessage.Read.All**, which needs an
   administrator's consent), and copy the token from the **Access token** tab.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → Microsoft Teams**, paste the
   token and click **List**. The token is used for this fetch only and is not
   stored.
3. Choose a chat or a channel and click **Fetch**, then **Import**.

Or choose a file:

- a personal account's export: **teams.live.com/dataexport**, choose **Chat
  history**, and choose the `.tar` file it gives you (its `messages.json` is
  read);
- a `.json` of Graph chat messages - one chat's or channel's messages, or the
  Teams Export API's `messages_<user>.json`;
- the `.json` or `.zip` WeKan exports.

### How to import many boards at once

1. On the import page, choose **Microsoft Teams**, then under **Import many boards**
   choose several files.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Microsoft Teams is imported through the generalized importer
(`models/kanboardCreator.js`), so the page also has the checkbox **One board
per project**.

From a script:

```bash
python3 api.py importboardsfrom teams FILE_OR_DIR ...
```

### How to export

1. Open the board, then **Board Settings → Export**, and choose **Microsoft
   Teams**. The board downloads as `<board>.json`.
2. Teams has no file import: a script sends the messages with Teams' migration
   API (`POST /teams/{id}/channels/{id}/messages` with the channel in migration
   mode), which takes these chat messages as they are. WeKan reads the file
   back.

A card is a chat, its comments the messages, each a Graph chat message with
its author, time and HTML body; the card's description, list and swimlane are
kept beside the chat.

### How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Microsoft Teams**.
2. One `.zip` downloads, with one `.json` per board you can export.

From a script:

```bash
python3 api.py exportallboards teams boards.zip
```

### REST API

- Import: `POST /api/boards/import/teams` with the JSON, `{ "binaryBase64": "..." }` for a `.tar`, or `{ "zipBase64": "..." }` for a `.zip`.
- Export: `GET /api/boards/:boardId/export/teams`.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- At most 2,000 API requests. (`MAX_TEAMS_REQUESTS` in
  [models/lib/apiImport/teams.js](../../../../../../models/lib/apiImport/teams.js#L14))
- At most 200,000 messages. (`MAX_TEAMS_MESSAGES` in
  [models/lib/apiImport/teams.js](../../../../../../models/lib/apiImport/teams.js#L15))
- At most 200,000 messages. Anything past it is left out. (`MAX_CHAT_MESSAGES`
  in
  [models/lib/chatExportFormats.js](../../../../../../models/lib/chatExportFormats.js#L38))
- The chat export text: at most 134,217,728 characters (128 MB of text). More
  stops the import with an error. (`MAX_CHAT_TEXT_LENGTH` in
  [models/lib/chatExportFormats.js](../../../../../../models/lib/chatExportFormats.js#L39))
- One binary file: at most 64 MB. (`MAX_BINARY_BYTES` in
  [server/lib/microsoftArchives.js](../../../../../../server/lib/microsoftArchives.js#L10))
- The .tar file: at most 2 GB. More stops the import with an error.
  (`MAX_TAR_BYTES` in
  [server/lib/microsoftArchives.js](../../../../../../server/lib/microsoftArchives.js#L11))
- The JSON file: at most 256 MB. More stops the import with an error.
  (`MAX_JSON_BYTES` in
  [server/lib/microsoftArchives.js](../../../../../../server/lib/microsoftArchives.js#L12))

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
- **Reading from the service's API**: each request may take 30 seconds and
  answer at most 32 MB, with no redirects followed
  ([server/lib/apiImportRequest.js](../../../../../../server/lib/apiImportRequest.js));
  each text field read is cut to 4,096 characters
  ([models/lib/apiImportServices.js](../../../../../../models/lib/apiImportServices.js)).

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
[models/lib/apiImport/teams.js](../../../../../../models/lib/apiImport/teams.js),
[models/lib/chatExportFormats.js](../../../../../../models/lib/chatExportFormats.js),
[server/lib/microsoftArchives.js](../../../../../../server/lib/microsoftArchives.js).

The tests that pin it:
[tests/teamsApiImport.test.cjs](../../../../../../tests/teamsApiImport.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

A chat message of Microsoft Graph v1.0 has an id, replyToId, messageType
(`message`, the others being system events), createdDateTime, deletedDateTime,
subject, body (`contentType` and `content`, usually HTML), from (a user's id
and displayName), attachments and reactions. A chat is oneOnOne, group or
meeting; a channel message fetched with `$expand=replies` has its replies.
The personal export's `messages.json` is not documented by Microsoft; it is
read as the Skype export it shares its layout with: `conversations`, each with a
`MessageList` of `originalarrivaltime`, `messagetype`, `content` and `from`
(`models/lib/chatExportFormats.js` parseTeamsExport,
`models/lib/apiImport/teams.js`, `server/lib/microsoftArchives.js`).

### What is kept

Each chat or channel as a card in the list Direct messages (oneOnOne), Groups,
Meetings or Channels, in the swimlane of its team; its messages and replies as
comments by their author at their time, the HTML as text, a file attachment as
its name and link, and reactions.

### What is not kept

System events (calls, members joining) and deleted messages are counted, not
imported; files themselves, mentions as links, and message edits. Graph does
not serve personal Teams accounts, so their chats come from the personal
export. On export: checklists, labels and attachments. What was left out is listed in the import's loss report, also in
**Admin Panel → Problems → Recovery**.

### How it is built and tested

`tests/teamsApiImport.test.cjs` reads Graph chat messages with HTML, a file, a
reaction, a system event and a deleted message; a channel with replies; the
Export API's messages of many chats; the personal export's `messages.json` from
a `.tar`; writes a board and reads it back; and fetches through the API client
from a fake Graph, every page and only from graph.microsoft.com, refusing a next
link to another host.

## Commits

 - [Import and export Azure DevOps Boards, Microsoft Lists, Project, Outlook, Teams and OneNote](https://github.com/wekan/wekan/commit/01e88410cd7440b26c5f845d98ae058f93c16a85)
