# GitLab

## What it is

WeKan imports the issues of a [GitLab](https://about.gitlab.com) project and
exports a board as GitLab issues. Both directions use the JSON array that
GitLab's [Issues API v4](https://docs.gitlab.com/api/issues/) returns for a
project. Open issues become cards in an **Open** list and closed issues cards
in a **Closed** list. Iterations become Scrum sprints and milestones Scrum
releases. GitLab has no file export of issues in this shape, so the file is
made with the API, and the exported file goes back into GitLab only through
the API.

## Read more

- [Wikipedia: GitLab](https://en.wikipedia.org/wiki/GitLab)
- [Issues API](https://docs.gitlab.com/api/issues/): listing and creating
  issues, the iteration, milestone, weight, time stats and task completion
  fields, and the `created_at` and `iid` rights
- [REST API](https://docs.gitlab.com/api/rest/): pagination,
  fetching every page
- [Notes API](https://docs.gitlab.com/api/notes/): an issue's comments
- [Issue links API](https://docs.gitlab.com/api/issue_links/): the links
  between issues
- [Personal access tokens](https://docs.gitlab.com/user/profile/personal_access_tokens/):
  the token for the API

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. In GitLab, get the issues as JSON with
   [List all project issues](https://docs.gitlab.com/api/issues/),
   using a [personal access token](https://docs.gitlab.com/user/profile/personal_access_tokens/)
   with the `read_api` scope:

   ```bash
   curl --header "PRIVATE-TOKEN: TOKEN" \
     "https://gitlab.com/api/v4/projects/ID/issues?state=all&with_labels_details=true&per_page=100&page=1" > issues.json
   ```

   Use your own GitLab server's address instead of `gitlab.com` when you have
   one. The API returns the issues a page at a time
   ([pagination](https://docs.gitlab.com/api/rest/)): fetch the next
   pages too and join them into one array (for example with
   `jq -s 'add' page*.json > issues.json`). WeKan imports what the file holds.
2. Optionally, a script can add to each issue a `notes` array (from
   [the issue's notes](https://docs.gitlab.com/api/notes/))
   and a `links` array (from
   [the issue's links](https://docs.gitlab.com/api/issue_links/)). WeKan then
   imports the comments and the links between issues.
3. In WeKan, go to **All Boards → Add Board → Import → Import board → GitLab**.
4. Tick the parts to import (**Select what to include**). Only the ticked parts
   are imported. Sprints and releases are imported only when **Scrum
   settings** is ticked.
5. Paste the JSON into the text box and click **Import**. There is no member
   mapping step for GitLab.
6. If anything could not be brought over, the import page shows it under
   **Imported with warnings** before it opens the board. The same report is
   kept in **Admin Panel → Problems → Recovery**.

The import page says the same: *Paste a GitLab issues JSON array
(GET /projects/ID/issues). Issues become cards grouped into Open / Closed
lists.*

### How to import many boards at once

- On the import page, under **Import many boards**, choose several export
  files, or one `.zip` that holds them. Each file becomes its own board,
  imported without member mapping (members can be mapped later).
- GitLab is imported through the generalized importer, so the page also
  offers **One board per project**: each swimlane the import would create
  becomes its own board, named after that swimlane. A GitLab import always
  puts every issue in one swimlane, **Default**, so for GitLab this option
  makes no difference. To get one board per project, save each project's
  issues to its own file and choose all the files. Links (parent cards,
  dependencies) between cards that end up on different boards are reported in
  the loss report rather than kept.
- From a script: `python3 api.py importboardsfrom gitlab FILE_OR_DIR ...`
  (files, directories of files, or `.zip` files).

### How to export

1. In WeKan, open the board, then **Board Settings → Export**.
2. Under **Select what to include**, tick the parts you want. Tick **Scrum
   settings** to write sprints and releases as iterations and milestones.
3. Choose **GitLab** in the JSON list. The board downloads as a `.json` file.
4. GitLab has no import for this file: issues are created through its API.
   For each item, call
   [Create an issue](https://docs.gitlab.com/api/issues/)
   (`POST /projects/ID/issues`) with its `title`, `description`, `labels`
   (comma separated) and `due_date`. `created_at` is accepted only from an
   administrator or project owner. Close the items with
   `"state": "closed"` afterwards with
   [Update an issue](https://docs.gitlab.com/api/issues/)
   (`state_event=close`). Iterations, milestones and assignees must already
   exist in GitLab and are given by their ids.

### How to export all boards at once

- **All Boards → sidebar → Export all boards**, choose **GitLab**: this
  downloads one `.zip` with one GitLab issues file per board you can export
  (boards you are a member of, not archived, not templates).
- To export only some boards: **Multi-Selection** in the All Boards sidebar,
  select the boards, then **Export**.
- From a script: `python3 api.py exportallboards gitlab boards.zip`.

### REST API

```bash
python3 api.py importboardfrom gitlab issues.json          # POST /api/boards/import/gitlab
python3 api.py importboardsfrom gitlab project1.json project2.json
python3 api.py exportboardformat BOARDID gitlab issues.json  # GET /api/boards/BOARDID/export/gitlab
python3 api.py exportallboards gitlab boards.zip           # GET /api/export-all-boards/gitlab?authToken=...
```

`POST /api/boards/import/gitlab` takes the issues array as the body, or as
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
[server/lib/scrumTransferImport.js](../../../../../../server/lib/scrumTransferImport.js).

The tests that pin it:
[tests/externalExportRoundTrip.test.cjs](../../../../../../tests/externalExportRoundTrip.test.cjs),
[tests/externalScrumPlanning.test.cjs](../../../../../../tests/externalScrumPlanning.test.cjs),
[tests/gitlabImport.test.cjs](../../../../../../tests/gitlabImport.test.cjs),
[tests/importFormatAudit.test.cjs](../../../../../../tests/importFormatAudit.test.cjs),
[tests/playwright/specs/gitlab-scrum-import.e2e.js](../../../../../../tests/playwright/specs/gitlab-scrum-import.e2e.js),
[tests/playwright/specs/import-export-format-audit.e2e.js](../../../../../../tests/playwright/specs/import-export-format-audit.e2e.js).

The details of the format, what is kept and how it is tested are below.

### Format details

From the [format coverage](../Format-Coverage.md) audit:

- **Authoritative shape:** the current
  [Issues API v4](https://docs.gitlab.com/api/issues/).
- **Required import coverage:** state, labels with details, assignees, author,
  milestone (as a Scrum release), iteration (as a Scrum sprint), weight, due
  date, time stats, task completion, links, discussions and attachments.

GitLab ([#2698](https://github.com/wekan/wekan/issues/2698)) meets the same
contract as GitHub: every assignee, the author, creation and close dates, time
spent, labels with details, milestone, iteration, issue type and
confidentiality as tags (milestones and iterations are also Scrum releases and
sprints, below), weight, time estimate and task completion as custom fields,
embedded `notes` as comments (system notes skipped), embedded `links` as
dependencies, and the `group/project#iid` reference and web URL at the end of
the description. A confidential issue is warned about, because on the board
the board's visibility decides who reads it. Epics, which are group-level, and
comments that exist upstream but were not embedded are reported in
`unsupported`. List Sync still writes only title, description and time fields
on existing cards; the others apply when a card is created.

#### Sprints and releases

GitLab imports create Scrum sprints and releases from what the export really
carries (`models/lib/externalScrumPlanning.js`), written through the same
journaled Scrum import stage as Jira and WeKan JSON
(`server/lib/scrumTransferImport.js`), so an interrupted import is recovered
like theirs ([Scrum import recovery](../Scrum-Import-Recovery.md)). The import
page's **Scrum settings** part decides whether any of it is imported.

- **Sprints:** an issue's `iteration`: `title` (an untitled cadence iteration
  is named by its dates, as GitLab shows it), `description` as the goal,
  `start_date`, `due_date`; `state` 1 / `upcoming` is planned.
- **Releases:** an issue's `milestone`: `title`, `description`, `start_date`,
  `due_date`; `state` `active` is planned, `closed` is released.
- **Also:** the `milestone:` and `iteration:` labels stay, because List Sync
  writes labels and not Scrum planning, and earlier boards filter by them.
- **Reported, not imported:** a current (2) iteration is imported as planned:
  there is no commitment snapshot. A closed (3) iteration is not imported:
  there is no commitment or close snapshot. A closed milestone has no close
  date. Malformed dates, unknown states, untitled milestones, and iterations
  with neither id nor title are reported.

Two records with the same name stay two records and are reported; one source
id listed on many issues is one record. A card in an iteration that is not
imported stays in the backlog. The GitLab export writes each card's sprint and
release back as `iteration` and `milestone` when Scrum settings are selected;
a cancelled sprint or release has no equivalent there and is left out. The
format carries no commitment snapshot, so an exported active or closed sprint
comes back as the import above describes.

#### What the current code does

The parser is `parseGitlab` in `models/lib/externalParsers.js`:

- It accepts an array of issues, or an object with an `issues` array.
- Labels are read as strings or as `with_labels_details` objects; only the
  name is kept, so the labels are black.
- `issue_type` other than `issue` becomes a `type:...` label, and
  `confidential` a `confidential` label plus a warning.
- `assignees` (or `assignee`): the first is the owner, the rest are further
  card members, each only when mapped to a WeKan user.
- `weight` becomes the **Weight** custom field,
  `time_stats.time_estimate` the **Time estimate (hours)** custom field and
  `task_completion_status` the **Tasks** custom field (`done/total`).
  `time_stats.total_time_spent` becomes the card's spent time in hours.
- `notes` that are not system notes become comments, written by the importing
  user with the GitLab author's name at the start.
- `links` become dependencies: `relates_to` is related-to, `blocks` blocks,
  `is_blocked_by` is-blocked-by. They link issues by `iid` within the same
  import.
- The `iid` is kept as the card's sync key for [List Sync](../Sync.md).

The export (`gitlab` in `models/lib/externalExportFormatters.js`) writes, for
each card that is not archived: `title`, `description`, `state` (`closed` when
the list name contains done, closed, complete, archiv or finished, otherwise
`opened`), `labels` (names), `due_date`, and, when the parts are ticked,
`assignees` (owner first), `author`, `created_at`, `closed_at` (closed items
only), comments as `notes`, the spent hours as `time_stats.total_time_spent`
(seconds), and the sprint and release as `iteration` and `milestone`. It writes no `iid`, so importing the file again does not add a
second `Source:` line.

### What is kept

| GitLab | WeKan |
| --- | --- |
| Issue | Card |
| `state` opened / closed | List **Open** / **Closed** |
| `title`, `description` | Card title, description |
| `labels` (names) | Labels (black) |
| `milestone` | Scrum release, and label `milestone:...` |
| `iteration` | Scrum sprint, and label `iteration:...` |
| `issue_type` other than issue | Label `type:...` |
| `health_status` (on_track, needs_attention, at_risk) | Label `health:...` |
| `severity` of an incident (not UNKNOWN) | Label `severity:...` |
| `confidential` | Label `confidential`, and a warning |
| `due_date`, else `milestone.due_date` | Due date |
| `created_at` | Creation date |
| `closed_at` of a closed issue | End date |
| `assignees` | Owner and members, when mapped |
| `author` | Requested By |
| `weight` | Custom field **Weight** |
| `time_stats.time_estimate` | Custom field **Time estimate (hours)** |
| `time_stats.total_time_spent` | Spent time (hours) |
| `task_completion_status` | Custom field **Tasks** |
| `notes` (not system notes) | Comments |
| `links` | Dependencies |
| `references.full` (else `#iid`), `web_url` | `Source:` line in the description |
| `iid` | Sync key |

### What is not kept

The import reports these on the loss report:

- the parent epic (epics are group-level in GitLab);
- comments that exist on GitLab but were not embedded in the file;
- a confidential issue (imported, with a warning);
- the Scrum cases listed under **Sprints and releases** above;
- links to issues that are not in the same import.

These are not read: label colors, system notes, and GitLab's
time-tracking history beyond the totals.

The import page has no member mapping for GitLab, so assignees and comment
authors become WeKan users only when a `membersMapping` is sent through the
REST API. Without it, comments are posted by the importing user with the
GitLab author's name at the start.

The GitLab export does not write weight, time estimate, task completion,
custom fields, checklists, subtasks, dependencies, attachments, archived
cards, or a cancelled sprint or release.

### Attachment files

The files linked from an issue and its comments (`/uploads/<secret>/<name>`)
are downloaded as before. A private project's upload needs a sign-in: under
**Attachment files** on the import page, give the GitLab address and a personal
access token (scope `read_api`); the import then downloads each upload of that
GitLab through `GET /api/v4/projects/<id>/uploads/<secret>/<name>`, which GitLab
17.4 and later document, with the token as `Authorization: Bearer`.

The address and the sign-in go with that one import: they are sent only to the
address typed there (an export file names any URL it likes, and one pointing
an attachment elsewhere gets no sign-in), never stored and never logged, and
the token field is emptied when Import is pressed. Every download goes through
the import's SSRF guard, which checks each redirect and drops the sign-in on a
redirect to another host, and lands in Admin Panel → Attachments → Default
Storage like any upload. A file that cannot be fetched is on the loss report
with the reason, and the import goes on. Leaving the fields empty imports the
board without its files. Unticking **Attachments** under what to include
leaves them out too. A service on a private address is refused by the same
guard. `models/lib/importAttachmentAuth.js` decides what is asked of whom.
Through the REST API (`POST /api/boards/import/<source>`), send the same as
`"attachmentAuth": { "url": ..., "username": ..., "token": ... }` beside
`"board"`.

### How it is built and tested

- `models/lib/externalParsers.js` (`parseGitlab`) reads the issues;
  `models/lib/externalScrumPlanning.js` (`gitlabScrumPlanning`) reads the
  sprints and releases; `models/kanboardCreator.js` writes the board.
- `models/lib/externalExportFormatters.js` (`gitlab`) writes the export;
  `models/lib/externalExporters.js` collects the board, with its sprints and
  releases.
- Unit tests: `tests/gitlabImport.test.cjs`,
  `tests/externalScrumPlanning.test.cjs`,
  `tests/externalExportRoundTrip.test.cjs`, `tests/importFormatAudit.test.cjs`.
- Playwright: `tests/playwright/specs/gitlab-scrum-import.e2e.js` (an
  iteration and a milestone import as a sprint and a release and export back;
  a closed iteration is reported and not invented; without Scrum settings no
  sprints or releases are made) and
  `tests/playwright/specs/import-export-format-audit.e2e.js` (fixture import,
  malformed JSON, the export menu link).

## Commits

 - [GitLab: an issue's health status and an incident's severity are kept as labels](https://github.com/wekan/wekan/commit/c916b154731084d1a9e7674852575a205ff68a66)
 - [ClickUp and GitLab exports write spent time, which their imports read and a round trip lost](https://github.com/wekan/wekan/commit/14afc74adbb6659ee3a8f57ebe84999b439557c6)
 - [GitHub, Gitea, Forgejo and GitLab imports report reaction counts instead of dropping them](https://github.com/wekan/wekan/commit/1b9ec7b9a1ba12f83969379ec059dd9bd5ec5c3a)
 - [JSON exports whose cards are one array are written a page at a time: Trello, Jira, Asana, Zenkit, OpenProject, GitHub ](https://github.com/wekan/wekan/commit/f293ae4076092a387505b1909053cd66a62441c8)
 - [Import: attachment files of Jira, Nextcloud Deck, OpenProject, Asana and GitLab](https://github.com/wekan/wekan/commit/51238ed8ad80179fa54517ab429b7a14c31510e8)
 - [Import Scrum sprints and releases from GitLab, OpenProject and Asana](https://github.com/wekan/wekan/commit/958e9e13f3d200fe321bdeee09cdb127cfb6629a)
 - [Export to GitLab with the people, dates and comments its importer reads](https://github.com/wekan/wekan/commit/65f5cb45b69790107cd08e00d41111f83b9aeeec)
 - [Bring the GitLab importer and Sync source up to the format contract](https://github.com/wekan/wekan/commit/d71bab65b379a979e40aa8c55daadaf71bd8abf5)
 - [Add a list-sync job that keeps a list up to date from Jira (and GitHub/GitLab/Gitea)](https://github.com/wekan/wekan/commit/a01e8478c30cce9569c6e68f5eb374031b162191)
