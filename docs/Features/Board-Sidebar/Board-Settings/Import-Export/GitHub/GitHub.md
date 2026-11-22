# GitHub

## What it is

WeKan imports the issues of a [GitHub](https://github.com) repository and
exports a board as GitHub issues. Both directions use the JSON array that
GitHub's [Issues REST API](https://docs.github.com/en/rest/issues/issues)
returns for a repository. Open issues become cards in an **Open** list and
closed issues cards in a **Closed** list. GitHub has no file export of issues,
so the file is made with the API, and the exported file goes back into GitHub
only through the API.

## Read more

- [Wikipedia: GitHub](https://en.wikipedia.org/wiki/GitHub)
- [Wikipedia: issue tracking systems](https://en.wikipedia.org/wiki/Issue_tracking_system)
- [REST API endpoints for issues](https://docs.github.com/en/rest/issues/issues):
  listing, creating and updating issues, pull requests in the list, `per_page`
  up to 100
- [REST API endpoints for issue comments](https://docs.github.com/en/rest/issues/comments):
  the comments of an issue
- [Managing your personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens):
  the token for a private repository

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. In GitHub, get the issues as JSON with the
   [List repository issues](https://docs.github.com/en/rest/issues/issues#list-repository-issues)
   endpoint. A public repository needs no token; a private one needs a
   [personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens):

   ```bash
   curl -L -H "Accept: application/vnd.github+json" \
     -H "Authorization: Bearer TOKEN" \
     "https://api.github.com/repos/OWNER/REPO/issues?state=all&per_page=100&page=1" > issues.json
   ```

   One request returns at most 100 issues. Fetch `page=2`, `page=3` and so on
   until a page is empty, and join the pages into one array (for example with
   `jq -s 'add' page*.json > issues.json`). WeKan imports what the file holds;
   it does not fetch the remaining pages itself.
2. In WeKan, go to **All Boards → Add Board → Import → Import board → GitHub**.
3. Tick the parts to import (**Select what to include**). Only the ticked parts
   are imported.
4. Paste the JSON into the text box and click **Import**. There is no member
   mapping step for GitHub.
5. If anything could not be brought over, the import page shows it under
   **Imported with warnings** before it opens the board. The same report is
   kept in **Admin Panel → Problems → Recovery**.

The import page says the same: *Paste a GitHub issues JSON array
(GET /repos/OWNER/REPO/issues). Issues become cards grouped into Open / Closed
lists.*

GitHub's list endpoint returns pull requests too. WeKan skips every item that
has a `pull_request` key, so only issues become cards.

Comments are not in the issue list. To keep them, a script can add to each
issue a `comments_data` array with what
[List issue comments](https://docs.github.com/en/rest/issues/comments#list-issue-comments)
returned for it, for example:

```bash
curl -L -H "Accept: application/vnd.github+json" -H "Authorization: Bearer TOKEN" \
  "https://api.github.com/repos/OWNER/REPO/issues/NUMBER/comments?per_page=100" > comments-NUMBER.json
```

Each comment becomes a WeKan card comment. Comments the issue's `comments`
count has but the file does not carry are reported as not imported.

### How to import many boards at once

- On the import page, under **Import many boards**, choose several export
  files, or one `.zip` that holds them. Each file becomes its own board,
  imported without member mapping (members can be mapped later).
- GitHub is imported through the generalized importer, so the page also
  offers **One board per project**: each swimlane the import would create
  becomes its own board, named after that swimlane. A GitHub import always puts
  every issue in one swimlane, **Default**, so for GitHub this option makes no
  difference. To get one board per repository, save each repository's issues
  to its own file and choose all the files. Links (parent cards,
  dependencies) between cards that end up on different boards are reported in
  the loss report rather than kept.
- From a script: `python3 api.py importboardsfrom github FILE_OR_DIR ...`
  (files, directories of files, or `.zip` files).

### How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Under **Select what to include**, tick the parts you want. Description,
   labels and dates are the parts this format has a place for.
3. Choose **GitHub** in the JSON list. The board downloads as a `.json` file.
4. GitHub has no import for this file: issues are created through its API.
   For each item, call
   [Create an issue](https://docs.github.com/en/rest/issues/issues#create-an-issue)
   (`POST /repos/OWNER/REPO/issues`) with its `title`, `body` and `labels`.
   An item with `"state": "closed"` is closed afterwards with
   [Update an issue](https://docs.github.com/en/rest/issues/issues#update-an-issue)
   (`PATCH /repos/OWNER/REPO/issues/NUMBER` with `"state": "closed"`).

### How to export all boards at once

- **All Boards → sidebar → Export all boards**, choose **GitHub**: this
  downloads one `.zip` with one GitHub issues file per board you can export
  (boards you are a member of, not archived, not templates).
- To export only some boards: **Multi-Selection** in the All Boards sidebar,
  select the boards, then **Export**.
- From a script: `python3 api.py exportallboards github boards.zip`.

### REST API

```bash
python3 api.py importboardfrom github issues.json          # POST /api/boards/import/github
python3 api.py importboardsfrom github issues1.json issues2.json
python3 api.py exportboardformat BOARDID github issues.json  # GET /api/boards/BOARDID/export/github
python3 api.py exportallboards github boards.zip           # GET /api/export-all-boards/github?authToken=...
```

`POST /api/boards/import/github` takes the issues array as the body, or as
`{ "board": [...] }`, with an optional `membersMapping`. The mass export route
takes an optional `&boardIds=ID1,ID2` to export only those boards.

## How the numbers are calculated

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
[models/lib/issueAttachments.js](../../../../../../models/lib/issueAttachments.js).

The tests that pin it:
[tests/externalExportRoundTrip.test.cjs](../../../../../../tests/externalExportRoundTrip.test.cjs),
[tests/githubImport.test.cjs](../../../../../../tests/githubImport.test.cjs),
[tests/importFormatAudit.test.cjs](../../../../../../tests/importFormatAudit.test.cjs),
[tests/kanboardLinksGithubComments.test.cjs](../../../../../../tests/kanboardLinksGithubComments.test.cjs),
[tests/playwright/specs/import-export-format-audit.e2e.js](../../../../../../tests/playwright/specs/import-export-format-audit.e2e.js).

The details of the format, what is kept and how it is tested are below.

### Format details

From the [format coverage](../Format-Coverage.md) audit:

- **Authoritative shape:** the versioned
  [Issues REST API](https://docs.github.com/en/rest/issues/issues), with
  comments, events and attachments referenced from Markdown.
- **Required import coverage:** issues excluding pull requests, open/closed
  state, state reason, labels with colors, assignees, reporter, milestone,
  dates, comments, relationships and URLs. Pagination must be completed by API
  clients.
- GitHub milestones remain labels; they do not become Scrum releases (GitLab's
  do, see [GitLab](../GitLab/GitLab.md)).

What the current code does (`models/lib/externalParsers.js`,
`parseIssuesArray`, shared with Gitea and Forgejo):

- It accepts an array of issues, several pages joined into one array, or an
  object with an `issues` array.
- Items with a `pull_request` key are skipped.
- `state: "closed"` puts the card in **Closed**; anything else in **Open**.
- Labels keep their names. Label colors are not read, so the labels are black.
- `state_reason` other than `completed` is kept as a `state_reason:...` label.
- The milestone is kept as a `milestone:<title>` label, and its `due_on` (or
  `due_date`) is the card's due date.
- The first assignee is the card's owner. Further assignees are kept as
  `assignee:<login>` labels and reported.
- The issue's author is the card's **Requested By**.
- The issue number and its URL are added at the end of the description as
  `Source: #NUMBER URL`.
- Each embedded comment becomes a card comment: `body` is the text,
  `user.login` (or `user.username`, `user.name`) the author and `created_at`
  the date. The comments are read from `comments_data`, or from `comments`
  when it is an array instead of the API's count. An entry without text is
  reported and skipped. The description is not changed by comments.
- A comment is posted by the importing user with the author's login leading
  the text (`alice: ...`), because the import page has no member mapping for
  GitHub. When a `membersMapping` maps the login, the comment is posted by
  that WeKan user and the text is unchanged.
- The issue number is kept as the card's sync key, so a list can be kept up to
  date with [List Sync](../Sync.md).
- The issue's files - the `user-attachments` and `user-images` links in its
  body and comments - are downloaded through the import's SSRF guard and
  attached to the card, in Admin Panel → Attachments → Default Storage. A file
  that cannot be fetched is on the loss report.
- The whole board can be read as GitHub's issue tracker in
  [Board View / Version Control](../../../../Board-Header/Board-Views/Version-Control-View.md), and List
  Sync's **Comments, labels, state and files** keeps comments, labels, state
  and files up to date too.

The audit lists more than the code reads: the code does not read label colors,
creation or close dates, relationships or events.

The export (`models/lib/externalExportFormatters.js`, `githubLike`) writes, for
each card that is not archived: `title`, `body` (the description), `state`
(`closed` when the list name contains done, closed, complete, archiv or
finished, otherwise `open`), `labels` (as `{ "name": ... }`), `due_date`, the
owner as `assignee` (and `assignees`), the creator as `user`, `created_at`,
`closed_at` for a closed issue.
GitHub has no `due_date` field; WeKan reads it back when the file is imported
again.

### What is kept

| GitHub | WeKan |
| --- | --- |
| Issue (not a pull request) | Card |
| `state` open / closed | List **Open** / **Closed** |
| `title`, `body` | Card title, description |
| `labels[].name` | Labels (black) |
| `state_reason` other than completed | Label `state_reason:...` |
| `milestone.title` | Label `milestone:...` |
| `milestone.due_on`, else `due_date` | Due date |
| `created_at`, and `closed_at` of a closed issue | Created and end dates |
| `type.name` (GitHub's issue types: Bug, Feature, Task, or the organization's own) | Label `type:<name>` |
| First of `assignees` (`assignee`) | Owner, when mapped to a WeKan user |
| Other assignees | Labels `assignee:...` |
| `user.login` | Requested By |
| `number`, `html_url` | `Source:` line in the description, and the sync key |
| `comments_data` (added by your script): `body`, `user.login`, `created_at` | Card comments, with their author and date |
| Files linked in the issue or its comments (`github.com/user-attachments/…`, `user-images.githubusercontent.com/…`) | Card attachments, downloaded into Admin Panel → Attachments → Default Storage (`models/lib/issueAttachments.js`) |

### What is not kept

The import reports these on the loss report:

- assignees after the first (they are kept as labels);
- comments that exist on GitHub but were not embedded in the file;
- embedded comments without text.

These are not read and not reported: label colors, creation, update and close
dates, reactions (also on comments), comment edit dates, locked state, events
and linked issues.

The import page has no member mapping for GitHub, so the owner becomes a card
member only when a `membersMapping` is sent through the REST API.

The GitHub export does not write owners, assignees, comments, checklists,
subtasks, custom fields, attachments or archived cards.

### How it is built and tested

- `models/lib/externalParsers.js` (`parseGithub`) reads the issues;
  `models/kanboardCreator.js` writes the board.
- `models/lib/externalExportFormatters.js` (`github`) writes the export;
  `models/lib/externalExporters.js` collects the board; `models/export.js`
  serves `/api/boards/:boardId/export/github`.
- Unit tests: `tests/githubImport.test.cjs`,
  `tests/kanboardLinksGithubComments.test.cjs` (embedded comments),
  `tests/externalExportRoundTrip.test.cjs` (export read back by the parser),
  `tests/importFormatAudit.test.cjs` (document shape).
- Playwright: `tests/playwright/specs/import-export-format-audit.e2e.js`
  (the fixture imports through the page, malformed JSON is rejected, an
  embedded comment becomes a card comment, and the export menu link returns
  the file and refuses an unrelated user).

## Commits

 - [Docs: GitHub's issue type as a type: label](https://github.com/wekan/wekan/commit/246b23eaf72fd1df9eea95f9ce287d7643cbff1b)
 - [GitHub's issue type is kept as a "type:" label](https://github.com/wekan/wekan/commit/9ceb4dbf55ecb2518c64d449b9d6d06703b961a9)
 - [GitHub, Gitea and Forgejo keep an issue's creation and close dates, people and Gitea's time estimate, both ways](https://github.com/wekan/wekan/commit/efeb55f57a903a80ab7b6ee124a87f9ce39bdf00)
 - [GitHub, Gitea, Forgejo and GitLab imports report reaction counts instead of dropping them](https://github.com/wekan/wekan/commit/1b9ec7b9a1ba12f83969379ec059dd9bd5ec5c3a)
 - [GitHub, Gitea and Forgejo exports carry the cards' comments](https://github.com/wekan/wekan/commit/ba31f2b592f9db1de8dabaf0ea20d3bdcf4553eb)
 - [JSON exports whose cards are one array are written a page at a time: Trello, Jira, Asana, Zenkit, OpenProject, GitHub ](https://github.com/wekan/wekan/commit/f293ae4076092a387505b1909053cd66a62441c8)
 - [Fix GitHub code scanning code-quality findings](https://github.com/wekan/wekan/commit/582a22c2914e5eaaeea84f29a3c75970195bf5e5)
 - [Board View / Version Control, issue files and synced issue details](https://github.com/wekan/wekan/commit/326d9bbf619ed811e9db92896a67f0ea6fa60b24)
 - [Import Kanboard task links as parent cards and dependencies, and GitHub comments as card comments](https://github.com/wekan/wekan/commit/594867bab71e249f559eb6590286027d4be38d07)
 - [Add a list-sync job that keeps a list up to date from Jira (and GitHub/GitLab/Gitea)](https://github.com/wekan/wekan/commit/a01e8478c30cce9569c6e68f5eb374031b162191)
 - [Add Markdown import/export and give GitHub-style import loss reporting](https://github.com/wekan/wekan/commit/237b4f3f883b9e0bcf3a05a82eb7325cb9c00439)
 - [Fix Sandstorm export board from web. - Fix Error when logging in to Wekan REST API when using Sandstorm Wekan.   ](https://github.com/wekan/wekan/commit/32f896f19d31f92b5c2e540d0960d00fbf1bf9c3)
