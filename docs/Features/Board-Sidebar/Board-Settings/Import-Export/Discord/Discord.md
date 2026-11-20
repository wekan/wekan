# Discord

WeKan imports a Discord channel exported with
[DiscordChatExporter](https://github.com/Tyrrrz/DiscordChatExporter) as a
board for **Board View → Chat**: the channel is a card in its category, the
server its swimlane, and the messages the card's comments.

## How to import

1. Export the channel with DiscordChatExporter in the **JSON** format.
2. In WeKan, go to **All Boards → New → Import → Discord (DiscordChatExporter)**.
3. Choose the `.json` file, or paste its text - or, when DiscordChatExporter
   ran with `--media` (the attachments downloaded beside the JSON), zip the
   folder with the `.json` and its `_Files` folder and choose the `.zip`.
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

## Replies

A reply, found by its `reference`, is a reply to the comment of the message it answers,
one level deep as WeKan's replies are: a reply to a reply goes under the same
comment. A reply to a message that is not in the file is a comment of its own,
starting with "↳".

## Reactions

A message's reactions become the comment's reactions, read from the emoji itself.
WeKan keeps a reaction by who reacted, so a reaction is kept for each person
mapped to a WeKan user in the members step. The loss report counts the
reactions of people who were not mapped, and those with an emoji WeKan cannot
store: a shortcode WeKan does not know, a server's or a chat's own emoji, or an
emoji of several code points (a skin tone, a flag). See
`models/lib/importedReactions.js`.

## What is not kept

Attachments that are only links (not downloaded with `--media`) and stickers (counted), embeds, a server's own emoji reactions. An attachment the zipped folder carries is an attachment of the channel's card. What was left out is listed in the import's loss report, also in
**Admin Panel → Problems → Recovery**.

## REST API

- Import: `POST /api/boards/import/discord` with the file's text, or a
  `.zip` as `{ "zipBase64": "..." }`, as for every source of the import page.

## How it is built and tested

`tests/chatExportFormats.test.cjs` reads a channel with an attachment and a system message, and refuses JSON without a channel and messages.

## Sources

- [DiscordChatExporter](https://github.com/Tyrrrz/DiscordChatExporter)
