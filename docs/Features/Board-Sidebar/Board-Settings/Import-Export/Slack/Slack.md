# Slack

WeKan imports a Slack workspace export `.zip` as a board for **Board View →
Chat**: each channel is a card, and its messages and thread replies are the
card's comments, by their author and time.

## How to import

1. In Slack, open the workspace settings, choose **Import/Export Data →
   Export**, start the export and download the `.zip` when Slack mails the
   link.
2. In WeKan, go to **All Boards → New → Import → Slack**.
3. Choose the `.zip` file.
4. Map the Slack users to WeKan members, or leave them as they are.
5. Click **Import**, and open the board in **Board View → Chat**.

## How to import many boards at once

1. On the import page, choose **Slack**, then under **Import many boards**
   choose several files, or one `.zip` that holds them.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Slack is imported through the generalized importer
(`models/kanboardCreator.js`), so the page also has the checkbox **One board
per project**: each swimlane the import would create becomes its own board.

From a script:

```bash
python3 api.py importboardsfrom slack FILE_OR_DIR ...
```

## How to export

Slack has no import of its own for a file WeKan could write, so WeKan does not export to it. Export the board in another format, for example [WeKan JSON](../WeKan/WeKan.md).

## How to export all boards at once

Slack has no import of its own for a file WeKan could write, so WeKan does not export to it. Export the board in another format, for example [WeKan JSON](../WeKan/WeKan.md).

## Format details

The export has `users.json`, `channels.json` (and `groups.json`, `dms.json`,
`mpims.json` when the export holds them) and each conversation's days as
`<channel>/<YYYY-MM-DD>.json` (`server/lib/chatArchives.js`). Public channels
go to the list **Channels**, private ones and group messages to **Groups**,
direct messages to **Direct messages** (`models/lib/chatExportFormats.js`).
Mentions `<@U123>` become `@name`, channel links `#name`, links their text with
the address; a thread reply starts with `↳`. Join and leave messages are left
out.

## What is kept

Channels with their topic and purpose, every message and thread reply with its author and time.

## What is not kept

Files and images (counted in the loss report), reactions, edits and pins. The zip is read within the same bounds as the other zip imports. What was left out is listed in the import's loss report, also in
**Admin Panel → Problems → Recovery**.

## REST API

- Import: `POST /api/boards/import/slack` with the file's text, or a
  `.zip` as `{ "zipBase64": "..." }`, as for every source of the import page.

## How it is built and tested

`tests/chatExportFormats.test.cjs` builds a Slack export zip with two days, a thread reply, a file, a join message and mentions, and refuses a zip that is not a Slack export.

## Sources

- [Slack: Export your workspace data](https://slack.com/help/articles/201658943)
- [Slack: How to read Slack data exports](https://slack.com/help/articles/220556107)
