# Slack

## What it is

WeKan imports a Slack workspace export `.zip` as a board for **Board View →
Chat**: each channel is a card, and its messages and thread replies are the
card's comments, by their author and time.

## Read more

- [Wikipedia: Slack, the chat app](https://en.wikipedia.org/wiki/Slack_(software))
- [Slack: Export your workspace data](https://slack.com/help/articles/201658943)
- [Slack: How to read Slack data exports](https://slack.com/help/articles/220556107)

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. In Slack, open the workspace settings, choose **Import/Export Data →
   Export**, start the export and download the `.zip` when Slack mails the
   link.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → Slack**.
3. Choose the `.zip` file. To bring the messages' files along, give a Slack
   token with the `files:read` scope under the file sign-in (a user token of a
   Slack app installed in the workspace): the files are on Slack's file host,
   behind its sign-in, and are not in the export zip.
4. Map the Slack users to WeKan members, or leave them as they are.
5. Click **Import**, and open the board in **Board View → Chat**.

### How to import many boards at once

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

### How to export

Slack has no import of its own for a file WeKan could write, so WeKan does not export to it. Export the board in another format, for example [WeKan JSON](../WeKan/WeKan.md).

### How to export all boards at once

Slack has no import of its own for a file WeKan could write, so WeKan does not export to it. Export the board in another format, for example [WeKan JSON](../WeKan/WeKan.md).

### REST API

- Import: `POST /api/boards/import/slack` with the file's text, or a
  `.zip` as `{ "zipBase64": "..." }`, as for every source of the import page.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- At most 200,000 messages. Anything past it is left out. (`MAX_CHAT_MESSAGES`
  in
  [models/lib/chatExportFormats.js](../../../../../../models/lib/chatExportFormats.js#L38))
- The chat export text: at most 134,217,728 characters (128 MB of text). More
  stops the import with an error. (`MAX_CHAT_TEXT_LENGTH` in
  [models/lib/chatExportFormats.js](../../../../../../models/lib/chatExportFormats.js#L39))
- The .zip file: at most 128 MB. More stops the import with an error.
  (`MAX_ZIP_BYTES` in
  [server/lib/chatArchives.js](../../../../../../server/lib/chatArchives.js#L17))
- At most 50,000 files in the archive. More stops the import with an error.
  (`MAX_ZIP_ENTRIES` in
  [server/lib/chatArchives.js](../../../../../../server/lib/chatArchives.js#L18))
- The unpacked .zip contents: at most 256 MB. (`MAX_INFLATED_BYTES` in
  [server/lib/chatArchives.js](../../../../../../server/lib/chatArchives.js#L19))
- One file inside the .zip: at most 128 MB. More stops the import with an error.
  (`MAX_ENTRY_BYTES` in
  [server/lib/chatArchives.js](../../../../../../server/lib/chatArchives.js#L20))

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
[models/lib/importedReactions.js](../../../../../../models/lib/importedReactions.js),
[server/lib/chatArchives.js](../../../../../../server/lib/chatArchives.js).

The tests that pin it:
[tests/chatExportFormats.test.cjs](../../../../../../tests/chatExportFormats.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

The export has `users.json`, `channels.json` (and `groups.json`, `dms.json`,
`mpims.json` when the export holds them) and each conversation's days as
`<channel>/<YYYY-MM-DD>.json` (`server/lib/chatArchives.js`). Public channels
go to the list **Channels**, private ones and group messages to **Groups**,
direct messages to **Direct messages** (`models/lib/chatExportFormats.js`).
Mentions `<@U123>` become `@name`, channel links `#name`, links their text with
the address; a thread reply starts with `↳`. Join and leave messages are left
out.

### What is kept

Channels with their topic and purpose, every message and thread reply with its author and time.

### What is not kept

Files and images without a token, deleted ones, and ones hidden by the plan's history limit (counted in the loss report), edits and pins. With a token, each file is downloaded from `files.slack.com` only, through the import's guarded download, and attached to the channel's card. The zip is read within the same bounds as the other zip imports. What was left out is listed in the import's loss report, also in
**Admin Panel → Problems → Recovery**.

### Replies

A reply, found by its `thread_ts`, is a reply to the comment of the message it answers,
one level deep as WeKan's replies are: a reply to a reply goes under the same
comment. A reply to a message that is not in the file is a comment of its own,
starting with "↳".

### Reactions

A message's reactions become the comment's reactions, read from Slack's shortcode, such as `thumbsup` or `tada`.
WeKan keeps a reaction by who reacted, so a reaction is kept for each person
mapped to a WeKan user in the members step. The loss report counts the
reactions of people who were not mapped, and those with an emoji WeKan cannot
store: a shortcode WeKan does not know, a server's or a chat's own emoji, or an
emoji of several code points (a skin tone, a flag). See
`models/lib/importedReactions.js`.

### How it is built and tested

`tests/chatExportFormats.test.cjs` builds a Slack export zip with two days, a thread reply, a file, a join message and mentions, and refuses a zip that is not a Slack export.

## Commits

 - [Slack import downloads the messages' files with a Slack token](https://github.com/wekan/wekan/commit/dd8242b82ffe97bb760471a3677550632d72a4d8)
 - [Chat imports keep reactions: Slack, Mattermost, Telegram and Discord reactions become the comments' reactions](https://github.com/wekan/wekan/commit/f467e31d176a2be66cfffecd87d9ac9938ff0d93)
 - [Import and export mail, calendars, chats and notes: mbox/.eml, iCalendar, Google Takeout, Slack, Mattermost, Telegram ](https://github.com/wekan/wekan/commit/ccfa6cf362e9b1eb812804d38e4d85653c5b0b0a)
