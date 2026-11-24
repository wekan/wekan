# Mattermost

## What it is

WeKan imports a Mattermost bulk export as a board for **Board View →
Chat**, and exports a board as a bulk import file Mattermost reads. A channel
is a card and its posts are the card's comments.

## Read more

- [Wikipedia: Mattermost, the chat app](https://en.wikipedia.org/wiki/Mattermost)
- [Mattermost bulk export](https://docs.mattermost.com/manage/bulk-export-tool.html)
- [Mattermost bulk loading data](https://docs.mattermost.com/onboard/bulk-loading-data.html)

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. On the Mattermost server, run `mmctl export create`, then
   `mmctl export download` and take the `.jsonl` file from the zip.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → Mattermost**.
3. Choose the `.jsonl` file, or paste its text.
4. Map the users to WeKan members, or leave them as they are.
5. Click **Import**.

### How to import many boards at once

1. On the import page, choose **Mattermost**, then under **Import many boards**
   choose several files, or one `.zip` that holds them.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Mattermost is imported through the generalized importer
(`models/kanboardCreator.js`), so the page also has the checkbox **One board
per project**: each swimlane the import would create becomes its own board.

From a script:

```bash
python3 api.py importboardsfrom mattermost FILE_OR_DIR ...
```

### How to export

1. Open the board, then **Board Settings → Export**, and choose **Mattermost**.
   The board downloads as `<board>.jsonl`.
2. Zip it and import it on the Mattermost server with `mmctl import upload`
   and `mmctl import process`.

The file has one team named after the board, a public channel per card (its
list as the purpose), the card's description and comments as posts, and a user
per author with the address `<username>@wekan.invalid`, so the import never
joins them to existing accounts by e-mail.

### How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Mattermost**.
2. One `.zip` downloads, with one `.jsonl` file per board you can export.

From a script:

```bash
python3 api.py exportallboards mattermost boards.zip
```

### REST API

- Import: `POST /api/boards/import/mattermost` with the file's text, or a
  `.zip` as `{ "zipBase64": "..." }`, as for every source of the import page.
- Export: `GET /api/boards/:boardId/export/mattermost`.

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
[models/lib/chatExportFormats.js](../../../../../../models/lib/chatExportFormats.js),
[models/lib/importedReactions.js](../../../../../../models/lib/importedReactions.js).

The tests that pin it:
[tests/chatExportFormats.test.cjs](../../../../../../tests/chatExportFormats.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

Bulk export JSONL: a `version` line, then `team`, `channel`, `user`, `post`
and `direct_channel` / `direct_post` lines; a post carries its `replies`
(`models/lib/chatExportFormats.js`). Teams become swimlanes, public channels
the list **Channels**, private ones **Groups**, direct messages **Direct
messages**; a reply starts with `↳`.

### What is kept

Channels with header and purpose, posts and replies with author and time, teams.

### What is not kept

Attachments (counted), custom emoji, users' profiles and preferences. What was left out is listed in the import's loss report, also in
**Admin Panel → Problems → Recovery**.

### Replies

A reply, found by the post it is nested in, is a reply to the comment of the message it answers,
one level deep as WeKan's replies are: a reply to a reply goes under the same
comment. A reply to a message that is not in the file is a comment of its own,
starting with "↳".

### Reactions

A message's reactions become the comment's reactions, read from Mattermost's `emoji_name`, such as `+1` or `tada`.
WeKan keeps a reaction by who reacted, so a reaction is kept for each person
mapped to a WeKan user in the members step. The loss report counts the
reactions of people who were not mapped, and those with an emoji WeKan cannot
store: a shortcode WeKan does not know, a server's or a chat's own emoji, or an
emoji of several code points (a skin tone, a flag). See
`models/lib/importedReactions.js`.

### How it is built and tested

`tests/chatExportFormats.test.cjs` reads a bulk export with a team, a channel, a reply and a direct post, refuses a file without a version line and a line that is not JSON, and exports a board and reads it back.

## Commits

 - [Chat imports keep reactions: Slack, Mattermost, Telegram and Discord reactions become the comments' reactions](https://github.com/wekan/wekan/commit/f467e31d176a2be66cfffecd87d9ac9938ff0d93)
 - [Focalboard and Mattermost exports are written a page of cards at a time](https://github.com/wekan/wekan/commit/bad71f9a1e80f54472c87eb8605d5a4206185ea4)
 - [Uploaded JSON is parsed from the file a chunk at a time; a Mattermost export a line at a time](https://github.com/wekan/wekan/commit/640e4925935e3842e00a864057b083b6dc386031)
 - [Import and export mail, calendars, chats and notes: mbox/.eml, iCalendar, Google Takeout, Slack, Mattermost, Telegram ](https://github.com/wekan/wekan/commit/ccfa6cf362e9b1eb812804d38e4d85653c5b0b0a)
 - [Import and export boards as Focalboard (Mattermost Boards) archive text](https://github.com/wekan/wekan/commit/5d26e9fff8b1a873f032019bfd7cc5c4e68b66d1)
