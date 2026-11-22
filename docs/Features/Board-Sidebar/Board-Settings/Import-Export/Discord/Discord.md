# Discord

## What it is

WeKan imports a Discord channel exported with
[DiscordChatExporter](https://github.com/Tyrrrz/DiscordChatExporter) as a
board for **Board View → Chat**: the channel is a card in its category, the
server its swimlane, and the messages the card's comments.

## Read more

- [Wikipedia: Discord, the chat app](https://en.wikipedia.org/wiki/Discord)
- [DiscordChatExporter](https://github.com/Tyrrrz/DiscordChatExporter)

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. Export the channel with DiscordChatExporter in the **JSON** format.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → Discord (DiscordChatExporter)**.
3. Choose the `.json` file, or paste its text - or, when DiscordChatExporter
   ran with `--media` (the attachments downloaded beside the JSON), zip the
   folder with the `.json` and its `_Files` folder and choose the `.zip`.
4. Map the authors to WeKan members, or leave them as they are.
5. Click **Import**.

### How to import many boards at once

1. On the import page, choose **Discord (DiscordChatExporter)**, then under **Import many boards**
   choose several files, or one `.zip` that holds them.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Discord is imported through the generalized importer
(`models/kanboardCreator.js`), so the page also has the checkbox **One board
per project**: each swimlane the import would create becomes its own board.

From a script:

```bash
python3 api.py importboardsfrom discord FILE_OR_DIR ...
```

### How to export

Discord has no import of its own for a file WeKan could write, so WeKan does not export to it. Export the board in another format, for example [WeKan JSON](../WeKan/WeKan.md).

### How to export all boards at once

Discord has no import of its own for a file WeKan could write, so WeKan does not export to it. Export the board in another format, for example [WeKan JSON](../WeKan/WeKan.md).

### REST API

- Import: `POST /api/boards/import/discord` with the file's text, or a
  `.zip` as `{ "zipBase64": "..." }`, as for every source of the import page.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- At most 200,000 messages. Anything past it is left out. (`MAX_CHAT_MESSAGES`
  in
  [models/lib/chatExportFormats.js](../../../../../../models/lib/chatExportFormats.js#L38))
- The chat export text: at most 134,217,728 characters (128 MB of text). More
  stops the import with an error. (`MAX_CHAT_TEXT_LENGTH` in
  [models/lib/chatExportFormats.js](../../../../../../models/lib/chatExportFormats.js#L39))

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

This format's own code:
[models/lib/chatExportFormats.js](../../../../../../models/lib/chatExportFormats.js),
[models/lib/importedReactions.js](../../../../../../models/lib/importedReactions.js).

The tests that pin it:
[tests/chatExportFormats.test.cjs](../../../../../../tests/chatExportFormats.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

The JSON has `guild`, `channel` (name, category, topic, type) and
`messages` with `author`, `timestamp` and `content`; an array of such exports
imports every channel (`models/lib/chatExportFormats.js`). Ordinary messages and
replies are imported; pins, joins and other system messages are not.

### What is kept

Channel name and topic, category, server, messages with author, nickname and time.

### What is not kept

Attachments that are only links (not downloaded with `--media`) and stickers (counted), embeds, a server's own emoji reactions. An attachment the zipped folder carries is an attachment of the channel's card. What was left out is listed in the import's loss report, also in
**Admin Panel → Problems → Recovery**.

### Replies

A reply, found by its `reference`, is a reply to the comment of the message it answers,
one level deep as WeKan's replies are: a reply to a reply goes under the same
comment. A reply to a message that is not in the file is a comment of its own,
starting with "↳".

### Reactions

A message's reactions become the comment's reactions, read from the emoji itself.
WeKan keeps a reaction by who reacted, so a reaction is kept for each person
mapped to a WeKan user in the members step. The loss report counts the
reactions of people who were not mapped, and those with an emoji WeKan cannot
store: a shortcode WeKan does not know, a server's or a chat's own emoji, or an
emoji of several code points (a skin tone, a flag). See
`models/lib/importedReactions.js`.

### How it is built and tested

`tests/chatExportFormats.test.cjs` reads a channel with an attachment and a system message, and refuses JSON without a channel and messages.

## Commits

 - [Telegram and Discord imports bring their message files: a zipped export folder's photos and files are attachments](https://github.com/wekan/wekan/commit/828ca63713b0a034c9e1c436341cd60435c01443)
 - [Chat imports keep reactions: Slack, Mattermost, Telegram and Discord reactions become the comments' reactions](https://github.com/wekan/wekan/commit/f467e31d176a2be66cfffecd87d9ac9938ff0d93)
 - [Import and export mail, calendars, chats and notes: mbox/.eml, iCalendar, Google Takeout, Slack, Mattermost, Telegram ](https://github.com/wekan/wekan/commit/ccfa6cf362e9b1eb812804d38e4d85653c5b0b0a)
