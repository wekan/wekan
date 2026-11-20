# Discord

WeKan imports a Discord channel exported with
[DiscordChatExporter](https://github.com/Tyrrrz/DiscordChatExporter) as a
board for **Board View → Chat**: the channel is a card in its category, the
server its swimlane, and the messages the card's comments.

## How to import

1. Export the channel with DiscordChatExporter in the **JSON** format.
2. In WeKan, go to **All Boards → New → Import → Discord (DiscordChatExporter)**.
3. Choose the `.json` file, or paste its text.
4. Map the authors to WeKan members, or leave them as they are.
5. Click **Import**.

## How to import many boards at once

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

## How to export

Discord has no import of its own for a file WeKan could write, so WeKan does not export to it. Export the board in another format, for example [WeKan JSON](../WeKan/WeKan.md).

## How to export all boards at once

Discord has no import of its own for a file WeKan could write, so WeKan does not export to it. Export the board in another format, for example [WeKan JSON](../WeKan/WeKan.md).

## Format details

The JSON has `guild`, `channel` (name, category, topic, type) and
`messages` with `author`, `timestamp` and `content`; an array of such exports
imports every channel (`models/lib/chatExportFormats.js`). Ordinary messages and
replies are imported; pins, joins and other system messages are not.

## What is kept

Channel name and topic, category, server, messages with author, nickname and time.

## What is not kept

Attachments and stickers (counted), embeds, reactions. What was left out is listed in the import's loss report, also in
**Admin Panel → Problems → Recovery**.

## REST API

- Import: `POST /api/boards/import/discord` with the file's text, or a
  `.zip` as `{ "zipBase64": "..." }`, as for every source of the import page.

## How it is built and tested

`tests/chatExportFormats.test.cjs` reads a channel with an attachment and a system message, and refuses JSON without a channel and messages.

## Sources

- [DiscordChatExporter](https://github.com/Tyrrrz/DiscordChatExporter)
