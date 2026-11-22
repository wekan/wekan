# Google Keep

## What it is

WeKan imports the notes of [Google Keep](https://keep.google.com) through the
[Google Keep API](https://developers.google.com/workspace/keep/api). Keep has
no boards or notebooks, so all notes become one board **Google Keep**: text
notes are cards in the list **Notes**, checklist notes are cards in the list
**Lists** with their items as a checklist.

The Keep API is for **Google Workspace** only. A personal Gmail account
cannot use it: Google gives the Keep API scopes only to apps that a Workspace
administrator allows, or to a service account with domain-wide delegation.

## Read more

- [Wikipedia: Google Keep, the note-taking service](https://en.wikipedia.org/wiki/Google_Keep)
- [Google Keep API](https://developers.google.com/workspace/keep/api): overview
- [notes resource](https://developers.google.com/workspace/keep/api/reference/rest/v1/notes)
  and [notes.list](https://developers.google.com/workspace/keep/api/reference/rest/v1/notes/list):
  the Note fields and paging
- [OAuth 2.0 scopes for Google APIs](https://developers.google.com/identity/protocols/oauth2/scopes#keep):
  `keep.readonly`
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
- [Domain-wide delegation](https://support.google.com/a/answer/162106)

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. Get an OAuth 2.0 access token with the scope
   `https://www.googleapis.com/auth/keep.readonly` for the Workspace account
   whose notes you import. Either:
   - where the Workspace admin allows it, in the
     [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/):
     under **Step 1**, type the scope
     `https://www.googleapis.com/auth/keep.readonly`, click **Authorize APIs**
     and sign in, then under **Step 2** click **Exchange authorization code
     for tokens** and copy the **Access token**; or
   - with a service account that has
     [domain-wide delegation](https://developers.google.com/workspace/guides/create-credentials#service-account)
     for that scope, ask for a token as the user (for example
     `gcloud auth print-access-token --impersonate-service-account=...` with
     the user as subject, or Google's client libraries).
   An access token is valid for about an hour.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → Google Keep**.
3. Paste the token and click **List**. Google Keep has one thing to import:
   **Google Keep (all notes)**.
4. Click **Fetch**. WeKan fetches the notes and puts them in the text box.
5. Click **Import**, map members if asked, and continue.
6. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

The token is used for that one fetch only, sent to Google as an
`Authorization: Bearer` header, and not stored. The token field is cleared
once it is sent.

Google Takeout's Keep export (a `.zip` of one `.json` and `.html` per note)
is a different format and is not what this importer reads.

### How to import many boards at once

Google Keep has no boards: one fetch is every note of the account, and it
becomes one WeKan board. To import the notes of several Workspace users, get
a token for each and import each in turn.

The fetched JSON is imported through the generalized importer, so the
**One board per project** checkbox is there too; every note goes to the
swimlane **Default**, so it makes no difference here.

### How to export

WeKan does not export to Google Keep. The Keep API can create notes, but
WeKan only reads it (the token has the `keep.readonly` scope).

### How to export all boards at once

There is no Google Keep export, see above.

### REST API

```bash
python3 api.py importboardfrom googlekeep notes.json     # POST /api/boards/import/googlekeep
```

The HTTP route is `POST /api/boards/import/googlekeep` with the fetched JSON
(`{ "googlekeep": true, "notes": [...] }`) as `board`. Fetching from Google is
the import page's step; with the REST API, fetch the notes yourself with the
same token and send them.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- At most 200 pages. More stops the import with an error.
  (`MAX_GOOGLE_KEEP_PAGES` in
  [models/lib/apiImport/googlekeep.js](../../../../../../models/lib/apiImport/googlekeep.js#L15))
- At most 20,000 notes. More stops the import with an error.
  (`MAX_GOOGLE_KEEP_NOTES` in
  [models/lib/apiImport/googlekeep.js](../../../../../../models/lib/apiImport/googlekeep.js#L16))
- A title is cut to 80 characters. (`MAX_GOOGLE_KEEP_TITLE` in
  [models/lib/googlekeepApiFormat.js](../../../../../../models/lib/googlekeepApiFormat.js#L27))
- Nesting deeper than 8 levels is not followed. (`MAX_DEPTH` in
  [models/lib/googlekeepApiFormat.js](../../../../../../models/lib/googlekeepApiFormat.js#L33))

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
- **Reading from the service's API**: each request may take 30 seconds and
  answer at most 32 MB, with no redirects followed
  ([server/lib/apiImportRequest.js](../../../../../../server/lib/apiImportRequest.js));
  each text field read is cut to 4,096 characters
  ([models/lib/apiImportServices.js](../../../../../../models/lib/apiImportServices.js)).

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
[models/lib/apiImport/googlekeep.js](../../../../../../models/lib/apiImport/googlekeep.js),
[models/lib/googlekeepApiFormat.js](../../../../../../models/lib/googlekeepApiFormat.js),
[releases/live-tests/googlekeep-import.mjs](../../../../../../releases/live-tests/googlekeep-import.mjs).

The tests that pin it:
[tests/googlekeepApiImport.test.cjs](../../../../../../tests/googlekeepApiImport.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

`models/lib/apiImport/googlekeep.js` fetches
`GET https://keep.googleapis.com/v1/notes?pageSize=100`, following
`nextPageToken` as `pageToken` until there is none, and hands the parser:

```json
{ "googlekeep": true, "notes": [ /* Note resources */ ] }
```

A [Note](https://developers.google.com/workspace/keep/api/reference/rest/v1/notes)
has `name` (`notes/...`), `createTime`, `updateTime`, `trashTime`, `trashed`,
`title`, `body` (either `text.text`, or `list.listItems[]` with `text.text`,
`checked` and `childListItems[]`), `permissions[]` (`name`, `role`, `email`)
and `attachments[]` (`name`, `mimeType[]`). Without a filter the API leaves
trashed notes out.

What the current code does (`models/lib/googlekeepApiFormat.js`):

- a text note becomes a card in **Notes**, with the text as the description;
- a checklist note becomes a card in **Lists** with the checklist **Items**,
  `checked` = done. WeKan checklists are flat, so a child item follows its
  parent with the prefix `↳ `;
- a note without a title takes its first non-empty line (or its first item),
  cut to 80 characters; a note with neither is "Untitled note";
- `name` is the source reference and `createTime` the card's creation date;
- only lists that have cards are made; with no notes the board gets **Notes**;
- every card goes to the swimlane **Default**;
- the parser also reads the API's own `{ "notes": [...] }` answer, and
  refuses anything without a `notes` array;
- limits: 200 pages and 20,000 notes.

### What is kept

| Google Keep | WeKan |
| --- | --- |
| All notes | Board "Google Keep" |
| Text note | Card in the list "Notes" |
| Checklist note | Card in the list "Lists" |
| `title` (or the first line) | Card title |
| `body.text.text` | Card description |
| `body.list.listItems` (`text`, `checked`) | Checklist "Items" |
| `childListItems` | Checklist items prefixed `↳ ` |
| `createTime` | Card creation date |

### What is not kept

The import reports these on the loss report:

- trashed notes, counted (they are not imported);
- attachments, with their count and types: they are not downloaded;
- sharing: a note shared with other people (any permission besides the
  owner's) is reported with how many; add them as board members. E-mail
  addresses are not written to the report;
- a `createTime` that is not a date;
- a note body that is neither text nor a list, and notes that are not
  objects.

Not reported because the Keep API does not give them: colors, labels,
reminders, pinned and archived state, and drawings. `updateTime` has no place
on a WeKan card.

### How it is built and tested

- `models/lib/apiImport/googlekeep.js` is the client (list and fetch) and
  `models/lib/googlekeepApiFormat.js` the parser; the services and their
  fields are in `models/lib/apiImportServices.js`. The server fetches through
  the SSRF guard in `server/lib/apiImportRequest.js`, and
  `models/kanboardCreator.js` creates the board.
- `tests/googlekeepApiImport.test.cjs` tests both with a fake request: the
  Bearer header, paging, a repeated page token aborting, an error status
  passing through, the token never being in a URL, every field mapped and
  wrong shapes refused.
- `releases/live-tests/googlekeep-import.mjs` is the live test against
  Google, read only: with `WEKAN_LIVE_GOOGLE_KEEP_TOKEN` set it lists,
  fetches and parses the account's notes, and skips without it. Run it from
  **build.sh → Tests → Live tests**, or
  `node releases/live-tests/googlekeep-import.mjs`.

## Commits

 - [GitHub, Gitea and Forgejo keep an issue's creation and close dates, people and Gitea's time estimate, both ways](https://github.com/wekan/wekan/commit/efeb55f57a903a80ab7b6ee124a87f9ce39bdf00)
 - [Imported subtasks keep their due date and person: a checklist item has both](https://github.com/wekan/wekan/commit/cf6f67e789ac404866d4b51591820570850baaa3)
 - [Nextcloud Deck labels keep their colors](https://github.com/wekan/wekan/commit/22d000b9136b11a4f8030d0e5d42e77518a70f64)
 - [Kanboard keeps its task recurrence, estimate, score, reference and external links, both ways](https://github.com/wekan/wekan/commit/28891103f6bec2d51e1dd1531103235d95a1a70c)
 - [Chat imports keep threads: a reply is a reply to the comment of the message it answers](https://github.com/wekan/wekan/commit/1122e49ca96930ac19f0431b514f68f7716da45a)
 - [Chat imports keep reactions: Slack, Mattermost, Telegram and Discord reactions become the comments' reactions](https://github.com/wekan/wekan/commit/f467e31d176a2be66cfffecd87d9ac9938ff0d93)
 - [Import: Planka, Microsoft To Do, KanbanFlow, Basecamp, Google Tasks and Google Keep from their APIs](https://github.com/wekan/wekan/commit/46e30f01e48f2676a47c0052007f5c4ea951a923)
 - [Record every board import before its first write, and let an admin keep or discard an interrupted one](https://github.com/wekan/wekan/commit/e8fac5e85ca09f33dd32eb9fbd25300afa3fbd90)
 - [Add a list-sync job that keeps a list up to date from Jira (and GitHub/GitLab/Gitea)](https://github.com/wekan/wekan/commit/a01e8478c30cce9569c6e68f5eb374031b162191)
