# Google Keep

WeKan imports the notes of [Google Keep](https://keep.google.com) through the
[Google Keep API](https://developers.google.com/workspace/keep/api). Keep has
no boards or notebooks, so all notes become one board **Google Keep**: text
notes are cards in the list **Notes**, checklist notes are cards in the list
**Lists** with their items as a checklist.

The Keep API is for **Google Workspace** only. A personal Gmail account
cannot use it: Google gives the Keep API scopes only to apps that a Workspace
administrator allows, or to a service account with domain-wide delegation.

## How to import

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
2. In WeKan, go to **All Boards → New → Import → Google Keep**.
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

## How to import many boards at once

Google Keep has no boards: one fetch is every note of the account, and it
becomes one WeKan board. To import the notes of several Workspace users, get
a token for each and import each in turn.

The fetched JSON is imported through the generalized importer, so the
**One board per project** checkbox is there too; every note goes to the
swimlane **Default**, so it makes no difference here.

## How to export

WeKan does not export to Google Keep. The Keep API can create notes, but
WeKan only reads it (the token has the `keep.readonly` scope).

## How to export all boards at once

There is no Google Keep export, see above.

## Format details

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

## What is kept

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

## What is not kept

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

## REST API

```bash
python3 api.py importboardfrom googlekeep notes.json     # POST /api/boards/import/googlekeep
```

The HTTP route is `POST /api/boards/import/googlekeep` with the fetched JSON
(`{ "googlekeep": true, "notes": [...] }`) as `board`. Fetching from Google is
the import page's step; with the REST API, fetch the notes yourself with the
same token and send them.

## How it is built and tested

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

## Sources

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
