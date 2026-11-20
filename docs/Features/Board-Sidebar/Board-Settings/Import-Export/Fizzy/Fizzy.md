# Fizzy

WeKan imports a board from [Fizzy](https://github.com/basecamp/fizzy), the
kanban tool of 37signals, and exports a board as the account export Fizzy's own
account import reads.

## How to import

1. In Fizzy, export either:
   - the whole account: **Account settings → Export** (admins and owners), or
   - your own cards: your profile → **Download my data**.
   Fizzy e-mails a link to the `.zip`.
2. In WeKan, go to **All Boards → New → Import → Fizzy**.
3. Choose the `.zip`, or one card's `.json` from the personal export, or paste
   that file's text.
4. Map the people to WeKan members, or leave them as they are.
5. Click **Import**.

## How to import many boards at once

1. On the import page, choose **Fizzy**, then under **Import many boards**
   choose several files.
2. Each file becomes its own board. The boards are imported without member
   mapping; members can be mapped later.

Fizzy is imported through the generalized importer
(`models/kanboardCreator.js`), so the page also has the checkbox **One board
per project**: each Fizzy board becomes a WeKan board of its own.

From a script:

```bash
python3 api.py importboardsfrom fizzy FILE_OR_DIR ...
```

## How to export

1. Open the board, then **Board Settings → Export**, and choose **Fizzy**. The
   board downloads as `<board>.zip`.
2. In Fizzy, make a new account from the zip with its account import
   (**Import** when signing up an account, or `script/import-account` on a
   server you run).

Each swimlane is a Fizzy board (a board with one swimlane is one Fizzy board
named after it), each list a column in the board's order, and the lists named
**Maybe?**, **Not now** and **Done** are Fizzy's own places of the same names.
An archived card is closed (Done). The account is named after the board. The
people are users of the new account with no e-mail address, so the import never
joins them to existing accounts; every user can open every board.

## How to export all boards at once

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then **Fizzy**.
2. One `.zip` downloads, with one Fizzy account export per board you can export.

From a script:

```bash
python3 api.py exportallboards fizzy boards.zip
```

## Format details

The account export (`app/models/account/data_transfer/*` in Fizzy) holds a row
of each table as `data/<table>/<id>.json` with every column of
`db/schema.rb`, `data/account.json`, the users as `data/users/<id>.json`, rich
text as `data/action_text_rich_texts/<id>.json` and the uploaded files as
`storage/<blob key>`. Ids are UUIDv7 written in base36, 25 characters. The
personal data export (`Card::Exportable`) holds `<number>.json` per card -
number, title, board, status, creator, description (HTML), dates and comments -
and its files under `<number>/<blob key>_<filename>`
(`models/lib/fizzyFormat.js`, `server/lib/fizzyArchive.js`).

A Fizzy board becomes a swimlane; its columns become lists in their position
order, after **Maybe?** (cards not yet triaged into a column) and before
**Not now** (postponed) and **Done** (closed) - the status names Fizzy itself
exports.

## What is kept

Boards, columns, cards with title, description, created date and due date,
tags as labels, assignees as the card's members, the creator as "requested by",
steps as the checklist **Steps**, comments by their author at their time, a
golden card as the colour gold, and the files in a description or a comment
(and a card's image) as attachments.

## What is not kept

Drafts never published (counted), reactions, watchers and pins (counted), and
boosts, events, notifications, webhooks and column colours. On export: users'
e-mail addresses, attachments, and a card's other dates. What was left out is
listed in the import's loss report, also in **Admin Panel → Problems →
Recovery**.

## REST API

- Import: `POST /api/boards/import/fizzy` with one card's `.json` text, or a
  `.zip` as `{ "zipBase64": "..." }`.
- Export: `GET /api/boards/:boardId/export/fizzy`.

## How it is built and tested

`tests/fizzyFormat.test.cjs` reads an account export with columns out of
order, a triaged, an untriaged, a closed, a postponed and a draft card, tags,
assignments, steps, a comment, an embedded file and a missing one; reads a
personal data export with its files; refuses what is not a Fizzy export and a
file path outside a card's folder; and exports a board, checks every row has
every column Fizzy's import requires, is named by its id and names only users
of the export, and reads it back. The Playwright round trip
(`tests/playwright/specs/export-import-round-trip.e2e.js`) sends it through the
server.

## Sources

- [Fizzy source](https://github.com/basecamp/fizzy)
- [Fizzy account data transfer](https://github.com/basecamp/fizzy/tree/main/app/models/account/data_transfer)
- [Fizzy card export](https://github.com/basecamp/fizzy/blob/main/app/models/card/exportable.rb)
- [Fizzy exports API](https://github.com/basecamp/fizzy/blob/main/docs/api/sections/exports.md)
