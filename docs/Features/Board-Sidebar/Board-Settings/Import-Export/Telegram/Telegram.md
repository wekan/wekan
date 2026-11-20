# Telegram

WeKan imports Telegram Desktop's JSON export as a board for **Board View →
Chat**: each chat is a card and its messages are the card's comments.

## How to import

1. In Telegram Desktop, open **Settings → Advanced → Export Telegram data**
   (or a chat's menu → **Export chat history**), choose the format
   **Machine-readable JSON**, and export.
2. In WeKan, go to **All Boards → New → Import → Telegram**.
3. Choose `result.json`, or paste its text - or, to bring the photos and
   files along, zip the whole export folder (the one with `result.json`,
   `photos/` and `files/`) and choose the `.zip`.
4. Map the people to WeKan members, or leave them as they are.
5. Click **Import**.

## How to import many boards at once

1. On the import page, choose **Telegram**, then under **Import many boards**
   choose several files, or one `.zip` that holds them.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Telegram is imported through the generalized importer
(`models/kanboardCreator.js`), so the page also has the checkbox **One board
per project**: each swimlane the import would create becomes its own board.

From a script:

```bash
python3 api.py importboardsfrom telegram FILE_OR_DIR ...
```

## How to export

Telegram has no import of its own for a file WeKan could write, so WeKan does not export to it. Export the board in another format, for example [WeKan JSON](../WeKan/WeKan.md).

## How to export all boards at once

Telegram has no import of its own for a file WeKan could write, so WeKan does not export to it. Export the board in another format, for example [WeKan JSON](../WeKan/WeKan.md).

## Format details

One chat's export is `{ name, type, messages }`; the whole account's has
`chats.list` (`models/lib/chatExportFormats.js`). Personal and bot chats and
Saved Messages go to **Direct messages**, groups and supergroups to
**Groups**, channels to **Channels**. A message's text, a string or a list of
text parts and entities, is joined into plain text; its time is
`date_unixtime`. Service messages (a member joined, a title changed) are left
out.

## What is kept

Chats, message text, author and time.

## Replies

A reply, found by its `reply_to_message_id`, is a reply to the comment of the message it answers,
one level deep as WeKan's replies are: a reply to a reply goes under the same
comment. A reply to a message that is not in the file is a comment of its own,
starting with "↳".

## Reactions

A message's reactions become the comment's reactions, read from the emoji itself; Telegram's export names the most recent people who reacted.
WeKan keeps a reaction by who reacted, so a reaction is kept for each person
mapped to a WeKan user in the members step. The loss report counts the
reactions of people who were not mapped, and those with an emoji WeKan cannot
store: a shortcode WeKan does not know, a server's or a chat's own emoji, or an
emoji of several code points (a skin tone, a flag). See
`models/lib/importedReactions.js`.

## What is not kept

Photos and files the export did not download ("File not included"), and every one when only `result.json` is imported (counted); stickers and voice messages not in the zipped folder (counted); custom emoji reactions; edits. A photo or file the zipped folder carries is an attachment of the chat's card. What was left out is listed in the import's loss report, also in
**Admin Panel → Problems → Recovery**.

## REST API

- Import: `POST /api/boards/import/telegram` with the file's text, or a
  `.zip` as `{ "zipBase64": "..." }`, as for every source of the import page.

## How it is built and tested

`tests/chatExportFormats.test.cjs` reads one chat with text entities, a service message and a photo, and an account export with two chats, and refuses JSON that is neither.

## Sources

- [Telegram Desktop](https://desktop.telegram.org/)
