# WhatsApp

WeKan imports a WhatsApp chat export `.txt` as a board for **Board View →
Chat**: the chat is a card and its messages are the card's comments.

## How to import

1. In WhatsApp, open the chat, then **⋮ → More → Export chat** (iPhone:
   the chat's name → **Export Chat**), choose **Without media**, and save the
   `.txt` file.
2. In WeKan, go to **All Boards → New → Import → WhatsApp**.
3. Choose the `.txt` file, or paste its text.
4. Map the senders to WeKan members, or leave them as they are.
5. Click **Import**.

## How to import many boards at once

1. On the import page, choose **WhatsApp**, then under **Import many boards**
   choose several files, or one `.zip` that holds them.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

WhatsApp is imported through the generalized importer
(`models/kanboardCreator.js`), so the page also has the checkbox **One board
per project**: each swimlane the import would create becomes its own board.

From a script:

```bash
python3 api.py importboardsfrom whatsapp FILE_OR_DIR ...
```

## How to export

WhatsApp has no import of its own for a file WeKan could write, so WeKan does not export to it. Export the board in another format, for example [WeKan JSON](../WeKan/WeKan.md).

## How to export all boards at once

WhatsApp has no import of its own for a file WeKan could write, so WeKan does not export to it. Export the board in another format, for example [WeKan JSON](../WeKan/WeKan.md).

## Format details

One line per message in the phone's date format: Android
`16/11/2026, 10:00 - Name: text`, iPhone `[16/11/2026, 10:00:00] Name: text`,
with dots or slashes, 12- or 24-hour time, and Finnish `klo`
(`models/lib/chatExportFormats.js`). A line without a date continues the
message above it. Day and month are read day first unless a day number over 12
shows the month comes first. The times have no time zone in the file and are
read as UTC. A chat of more than two people goes to **Groups**.

## What is kept

Every message with its sender and time, multi-line messages.

## What is not kept

Media (`<Media omitted>`, attached files - counted), system lines such as the encryption notice. What was left out is listed in the import's loss report, also in
**Admin Panel → Problems → Recovery**.

## REST API

- Import: `POST /api/boards/import/whatsapp` with the file's text, or a
  `.zip` as `{ "zipBase64": "..." }`, as for every source of the import page.

## How it is built and tested

`tests/chatExportFormats.test.cjs` reads Android, US (AM/PM) and iPhone lines, multi-line messages, system lines and media, and refuses text with no dated line.

## Sources

- [WhatsApp Help: How to export your chat history](https://faq.whatsapp.com/1180414079177245)
