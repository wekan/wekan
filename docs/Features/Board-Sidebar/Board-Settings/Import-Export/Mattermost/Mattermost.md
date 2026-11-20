# Mattermost

WeKan imports a Mattermost bulk export as a board for **Board View →
Chat**, and exports a board as a bulk import file Mattermost reads. A channel
is a card and its posts are the card's comments.

## How to import

1. On the Mattermost server, run `mmctl export create`, then
   `mmctl export download` and take the `.jsonl` file from the zip.
2. In WeKan, go to **All Boards → New → Import → Mattermost**.
3. Choose the `.jsonl` file, or paste its text.
4. Map the users to WeKan members, or leave them as they are.
5. Click **Import**.

## How to import many boards at once

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

## How to export

1. Open the board, then **Board Settings → Export**, and choose **Mattermost**.
   The board downloads as `<board>.jsonl`.
2. Zip it and import it on the Mattermost server with `mmctl import upload`
   and `mmctl import process`.

The file has one team named after the board, a public channel per card (its
list as the purpose), the card's description and comments as posts, and a user
per author with the address `<username>@wekan.invalid`, so the import never
joins them to existing accounts by e-mail.

## How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Mattermost**.
2. One `.zip` downloads, with one `.jsonl` file per board you can export.

From a script:

```bash
python3 api.py exportallboards mattermost boards.zip
```

## Format details

Bulk export JSONL: a `version` line, then `team`, `channel`, `user`, `post`
and `direct_channel` / `direct_post` lines; a post carries its `replies`
(`models/lib/chatExportFormats.js`). Teams become swimlanes, public channels
the list **Channels**, private ones **Groups**, direct messages **Direct
messages**; a reply starts with `↳`.

## What is kept

Channels with header and purpose, posts and replies with author and time, teams.

## What is not kept

Attachments (counted), reactions, emoji, users' profiles and preferences. What was left out is listed in the import's loss report, also in
**Admin Panel → Problems → Recovery**.

## REST API

- Import: `POST /api/boards/import/mattermost` with the file's text, or a
  `.zip` as `{ "zipBase64": "..." }`, as for every source of the import page.
- Export: `GET /api/boards/:boardId/export/mattermost`.

## How it is built and tested

`tests/chatExportFormats.test.cjs` reads a bulk export with a team, a channel, a reply and a direct post, refuses a file without a version line and a line that is not JSON, and exports a board and reads it back.

## Sources

- [Mattermost bulk export](https://docs.mattermost.com/manage/bulk-export-tool.html)
- [Mattermost bulk loading data](https://docs.mattermost.com/onboard/bulk-loading-data.html)
