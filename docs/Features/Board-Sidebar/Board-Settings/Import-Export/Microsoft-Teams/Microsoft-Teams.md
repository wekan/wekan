# Microsoft Teams

WeKan imports chats and channels of [Microsoft Teams](https://www.microsoft.com/microsoft-teams),
fetched from Microsoft Graph or from an export file, and exports a board as
Teams chats. They show in **Board View → Chat**.

## How to import

Fetch them (a work or school account):

1. In Microsoft Graph Explorer (developer.microsoft.com/graph/graph-explorer),
   sign in, consent to **Chat.Read** (and, for channels, **Team.ReadBasic.All**,
   **Channel.ReadBasic.All** and **ChannelMessage.Read.All**, which needs an
   administrator's consent), and copy the token from the **Access token** tab.
2. In WeKan, go to **All Boards → New → Import → Microsoft Teams**, paste the
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

## How to import many boards at once

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

## How to export

1. Open the board, then **Board Settings → Export**, and choose **Microsoft
   Teams**. The board downloads as `<board>.json`.
2. Teams has no file import: a script sends the messages with Teams' migration
   API (`POST /teams/{id}/channels/{id}/messages` with the channel in migration
   mode), which takes these chat messages as they are. WeKan reads the file
   back.

A card is a chat, its comments the messages, each a Graph chat message with
its author, time and HTML body; the card's description, list and swimlane are
kept beside the chat.

## How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Microsoft Teams**.
2. One `.zip` downloads, with one `.json` per board you can export.

From a script:

```bash
python3 api.py exportallboards teams boards.zip
```

## Format details

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

## What is kept

Each chat or channel as a card in the list Direct messages (oneOnOne), Groups,
Meetings or Channels, in the swimlane of its team; its messages and replies as
comments by their author at their time, the HTML as text, a file attachment as
its name and link, and reactions.

## What is not kept

System events (calls, members joining) and deleted messages are counted, not
imported; files themselves, mentions as links, and message edits. Graph does
not serve personal Teams accounts, so their chats come from the personal
export. On export: checklists, labels and attachments. What was left out is listed in the import's loss report, also in
**Admin Panel → Problems → Recovery**.

## REST API

- Import: `POST /api/boards/import/teams` with the JSON, `{ "binaryBase64": "..." }` for a `.tar`, or `{ "zipBase64": "..." }` for a `.zip`.
- Export: `GET /api/boards/:boardId/export/teams`.

## How it is built and tested

`tests/teamsApiImport.test.cjs` reads Graph chat messages with HTML, a file, a
reaction, a system event and a deleted message; a channel with replies; the
Export API's messages of many chats; the personal export's `messages.json` from
a `.tar`; writes a board and reads it back; and fetches through the API client
from a fake Graph, every page and only from graph.microsoft.com, refusing a next
link to another host.

## Sources

- [chatMessage resource type](https://learn.microsoft.com/graph/api/resources/chatmessage)
- [List messages in a chat](https://learn.microsoft.com/graph/api/chat-list-messages)
- [List channel messages](https://learn.microsoft.com/graph/api/channel-list-messages)
- [Import third-party platform messages to Teams](https://learn.microsoft.com/microsoftteams/platform/graph-api/import-messages/import-external-messages-to-teams)
- [Export options for switching from Microsoft Teams](https://learn.microsoft.com/microsoftteams/migration-from-teams)
