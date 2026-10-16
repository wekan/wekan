# Forgejo

WeKan imports the issues of a [Forgejo](https://forgejo.org) repository and
exports a board as Forgejo issues. Both directions use the JSON array that
Forgejo's API returns for a repository's issues, which has the same shape as
Gitea's and GitHub's. Open issues become cards in an **Open** list and closed
issues cards in a **Closed** list. Forgejo has no file export of issues, so
the file is made with the API, and the exported file goes back into Forgejo
only through the API. [Gitea](../Gitea/Gitea.md) uses the same format, and WeKan reads both
with one parser.

## How to import

1. In Forgejo, create an access token (see
   [API usage](https://forgejo.org/docs/latest/user/api-usage/)) and get the
   issues as JSON from `GET /api/v1/repos/OWNER/REPO/issues`:

   ```bash
   curl -H "Authorization: token TOKEN" \
     "https://FORGEJO-SERVER/api/v1/repos/OWNER/REPO/issues?type=issues&state=all&page=1&limit=50" > issues.json
   ```

   `type=issues` leaves pull requests out. The API returns the issues a page
   at a time; `GET /api/v1/settings/api` tells the server's default and
   largest page size. Fetch the next pages too and join them into one array
   (for example with `jq -s 'add' page*.json > issues.json`). WeKan imports
   what the file holds.
2. In WeKan, go to **All Boards → New → Import → Forgejo**.
3. Tick the parts to import (**Select what to include**). Only the ticked parts
   are imported.
4. Paste the JSON into the text box and click **Import**. There is no member
   mapping step for Forgejo.
5. If anything could not be brought over, the import page shows it under
   **Imported with warnings** before it opens the board. The same report is
   kept in **Admin Panel → Problems → Recovery**.

The import page says the same: *Paste a Forgejo issues JSON array
(GET /repos/OWNER/REPO/issues). Issues become cards grouped into Open / Closed
lists.*

Comments are not in the issue list. To keep them, a script can add to each
issue a `comments_data` array with what the issue's comments endpoint
(`GET /api/v1/repos/OWNER/REPO/issues/INDEX/comments`) returned. Each
comment becomes a WeKan card comment. Comments the issue's `comments` count
has but the file does not carry are reported as not imported.

## How to import many boards at once

- On the import page, under **Import many boards**, choose several export
  files, or one `.zip` that holds them. Each file becomes its own board,
  imported without member mapping (members can be mapped later).
- Forgejo is imported through the generalized importer, so the page also offers
  **One board per project**: each swimlane the import would create becomes its
  own board, named after that swimlane. A Forgejo import always puts every issue
  in one swimlane, **Default**, so for Forgejo this option makes no difference.
  To get one board per repository, save each repository's issues to its own
  file and choose all the files. Links (parent cards, dependencies) between
  cards that end up on different boards are reported in the loss report
  rather than kept.
- From a script: `python3 api.py importboardsfrom forgejo FILE_OR_DIR ...`
  (files, directories of files, or `.zip` files).

## How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Under **Select what to include**, tick the parts you want. Description,
   labels and dates are the parts this format has a place for.
3. Choose **Forgejo** in the JSON list. The board downloads as a `.json` file.
4. Forgejo has no import for this file: issues are created through its API,
   one `POST /api/v1/repos/OWNER/REPO/issues` per item with its `title` and
   `body`, and items with `"state": "closed"` are closed afterwards with
   `PATCH /api/v1/repos/OWNER/REPO/issues/INDEX`. The fields these endpoints
   take, including how labels and milestones are given, are listed in the API
   reference of your server at `/api/swagger`.

## How to export all boards at once

- **All Boards → sidebar → Export all boards**, choose **Forgejo**: this
  downloads one `.zip` with one Forgejo issues file per board you can export
  (boards you are a member of, not archived, not templates).
- To export only some boards: **Multi-Selection** in the All Boards sidebar,
  select the boards, then **Export**.
- From a script: `python3 api.py exportallboards forgejo boards.zip`.

## Format details

From the [format coverage](../Format-Coverage.md) audit (one row for Gitea and
Forgejo):

- **Authoritative shape:** the current issue API and release schema of the
  selected server.
- **Required import coverage:** GitHub-like fields plus milestone, deadline,
  assignees, comments and server-specific labels and state metadata.
- Forgejo milestones remain labels; they do not become Scrum releases.

What the current code does: Forgejo and Gitea share one parser,
`parseGitea` in `models/lib/externalParsers.js` (the `forgejo` key maps to
it), which is GitHub's (`parseIssuesArray`):

- It accepts an array of issues, several pages joined into one array, or an
  object with an `issues` array.
- Items with a `pull_request` value are skipped.
- `state: "closed"` puts the card in **Closed**; anything else in **Open**.
- Labels keep their names; colors are not read, so the labels are black.
- `state_reason` other than `completed` is kept as a `state_reason:...` label.
- The milestone is kept as a `milestone:<title>` label. Its `due_on` is the
  card's due date; without a milestone date, the issue's `due_date` (Forgejo's
  deadline) is.
- The first assignee is the owner; further assignees become
  `assignee:<login>` labels and are reported.
- The issue's author (`user.login`) is **Requested By**.
- `Source: #NUMBER URL` is added at the end of the description.
- Each embedded comment becomes a card comment: `body` is the text,
  `user.login` (or `user.username`) the author and `created_at` the date. The
  comments are read from `comments_data`, or from `comments` when it is an
  array instead of the API's count. An entry without text is reported and
  skipped. The description is not changed by comments.
- A comment is posted by the importing user with the author's login leading
  the text (`alice: ...`), because the import page has no member mapping for
  Forgejo. When a `membersMapping` maps the login, the comment is posted by
  that WeKan user and the text is unchanged.
- The issue number is kept as the card's sync key for
  [List Sync](../Sync.md).
- Boards imported from Forgejo are named **Imported Gitea/Forgejo issues**.

The audit asks for more than the code reads: server-specific label and state
metadata and label colors are not imported.

The export (`forgejo` in `models/lib/externalExportFormatters.js`) is the same
as GitHub's: for each card that is not archived, `title`, `body`, `state`
(`closed` when the list name contains done, closed, complete, archiv or
finished, otherwise `open`), `labels` (as `{ "name": ... }`) and `due_date`.

## What is kept

| Forgejo | WeKan |
| --- | --- |
| Issue (not a pull request) | Card |
| `state` open / closed | List **Open** / **Closed** |
| `title`, `body` | Card title, description |
| `labels[].name` | Labels (black) |
| `state_reason` other than completed | Label `state_reason:...` |
| `milestone.title` | Label `milestone:...` |
| `milestone.due_on`, else `due_date` | Due date |
| First of `assignees` (`assignee`) | Owner, when mapped to a WeKan user |
| Other assignees | Labels `assignee:...` |
| `user.login` | Requested By |
| `number`, `html_url` | `Source:` line in the description, and the sync key |
| `comments_data` (added by your script): `body`, `user.login`, `created_at` | Card comments, with their author and date |

## What is not kept

The import reports these on the loss report:

- assignees after the first (they are kept as labels);
- comments that exist on Forgejo but were not embedded in the file;
- embedded comments without text.

These are not read and not reported: label colors, creation, update and close
dates, the pinned and locked state, reactions, time tracking and dependencies.

The import page has no member mapping for Forgejo, so the owner becomes a card
member only when a `membersMapping` is sent through the REST API.

The Forgejo export does not write owners, assignees, comments, checklists,
subtasks, custom fields, attachments or archived cards.

## REST API

```bash
python3 api.py importboardfrom forgejo issues.json           # POST /api/boards/import/forgejo
python3 api.py importboardsfrom forgejo repo1.json repo2.json
python3 api.py exportboardformat BOARDID forgejo issues.json   # GET /api/boards/BOARDID/export/forgejo
python3 api.py exportallboards forgejo boards.zip            # GET /api/export-all-boards/forgejo?authToken=...
```

`POST /api/boards/import/forgejo` takes the issues array as the body, or as
`{ "board": [...] }`, with an optional `membersMapping`. The mass export route
takes an optional `&boardIds=ID1,ID2` to export only those boards.

## How it is built and tested

- `models/lib/externalParsers.js` (`parseGitea`, under the `forgejo` key)
  reads the issues; `models/kanboardCreator.js` writes the board.
- `models/lib/externalExportFormatters.js` (`forgejo`) writes the export;
  `models/lib/externalExporters.js` collects the board.
- Unit tests: `tests/githubImport.test.cjs` (the shared GitHub, Gitea and
  Forgejo parser), `tests/kanboardLinksGithubComments.test.cjs` (embedded
  comments, shared by the three), `tests/externalExportRoundTrip.test.cjs`,
  `tests/importFormatAudit.test.cjs`.
- Playwright: `tests/playwright/specs/import-export-format-audit.e2e.js`
  (fixture import through the page, malformed JSON is rejected, the export
  menu link returns the file and refuses an unrelated user).

## Sources

- [Forgejo API usage](https://forgejo.org/docs/latest/user/api-usage/):
  tokens, the `Authorization: token` header, pagination, and the API
  reference at `/api/swagger` on every server, which lists the issue
  endpoints and their fields

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).
