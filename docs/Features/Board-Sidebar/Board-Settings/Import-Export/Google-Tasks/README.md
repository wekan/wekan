# Google Tasks

## What it is

WeKan imports [Google Tasks](https://tasks.google.com/) straight from Google's
[Tasks API](https://developers.google.com/workspace/tasks), with an access
token. Each task list becomes a list and each task a card, with its notes,
links, due date and subtasks; completed tasks are imported archived. Google
Tasks has no export file, so there is nothing to paste.

## Read more

- [Wikipedia: Google Tasks](https://en.wikipedia.org/wiki/Google_Tasks)
- [Google Tasks API](https://developers.google.com/workspace/tasks): overview
- [REST reference](https://developers.google.com/workspace/tasks/reference/rest):
  the `TaskList` and `Task` resources, `tasklists.list` and `tasks.list`
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/):
  where to get an access token

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

First get an access token. The token is used for that one fetch only and is
not stored.

1. Open the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
   and sign in with the Google account whose tasks you want.
2. In **Step 1**, open **Tasks API v1** and select
   `https://www.googleapis.com/auth/tasks.readonly`, then click **Authorize
   APIs** and allow access.
3. In **Step 2**, click **Exchange authorization code for tokens**.
4. Copy the **Access token**. It is valid for about one hour.

Then import:

1. In WeKan, go to **All Boards → Add Board → Import → Import board → Google Tasks**.
2. Paste the access token and click **List**.
3. Choose **Google Tasks (all lists)** or one task list, then click **Fetch**.
4. Continue as with any import: map the members, then click **Import**.
5. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

The token only reads: the scope `tasks.readonly` cannot change anything in
Google Tasks.

### How to import many boards at once

Choose **Google Tasks (all lists)**: every task list comes on one WeKan board,
one list each. Google Tasks has no swimlanes, so every card is in the swimlane
**Default**. To get one board per task list, import each list on its own.

### How to export

WeKan does not export to Google Tasks. Google Tasks has no import file, and
WeKan does not write to Google.

### How to export all boards at once

There is no Google Tasks export, so there is none for all boards either.

### REST API

```bash
python3 api.py importboardfrom googletasks tasks.json    # POST /api/boards/import/googletasks
```

The HTTP route is `POST /api/boards/import/googletasks` with the fetched JSON
(`{ "googletasks": true, "lists": [...] }`) as `board`. Fetch it yourself
with the API calls above, or with the client.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- At most 100 lists. (`MAX_LISTS` in
  [models/lib/apiImport/googletasks.js](../../../../../../models/lib/apiImport/googletasks.js#L8))
- At most 200 pages. More stops the import with an error. (`MAX_PAGES` in
  [models/lib/apiImport/googletasks.js](../../../../../../models/lib/apiImport/googletasks.js#L9))
- At most 20,000 tasks. (`MAX_TASKS` in
  [models/lib/apiImport/googletasks.js](../../../../../../models/lib/apiImport/googletasks.js#L10))
- At most 20,000 tasks. More stops the import with an error. (`MAX_GOOGLE_TASKS`
  in
  [models/lib/googletasksApiFormat.js](../../../../../../models/lib/googletasksApiFormat.js#L6))

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
[models/lib/apiImport/googletasks.js](../../../../../../models/lib/apiImport/googletasks.js),
[models/lib/googletasksApiFormat.js](../../../../../../models/lib/googletasksApiFormat.js),
[releases/live-tests/googletasks-import.mjs](../../../../../../releases/live-tests/googletasks-import.mjs).

The tests that pin it:
[tests/googletasksApiImport.test.cjs](../../../../../../tests/googletasksApiImport.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

The client (`models/lib/apiImport/googletasks.js`) sends
`Authorization: Bearer <token>` and reads:

- `GET https://tasks.googleapis.com/tasks/v1/users/@me/lists?maxResults=100`:
  the task lists (`items[]` with `id`, `title`, `updated`), following
  `nextPageToken`;
- `GET https://tasks.googleapis.com/tasks/v1/users/@me/lists/{id}`: the title
  of one chosen list;
- `GET https://tasks.googleapis.com/tasks/v1/lists/{id}/tasks?maxResults=100&showCompleted=true&showHidden=true`:
  each list's tasks (`id`, `title`, `notes`, `status`, `due`, `completed`,
  `parent`, `position`, `deleted`, `hidden`, `links`, `updated`,
  `webViewLink`), following `nextPageToken`.

It returns `{ googletasks: true, lists: [{ id, title, tasks }] }`, which is
also what the REST API takes. The token is never put in a URL. Paging stops at
a page token seen before, after 200 pages, at 100 lists, and at 20,000 tasks.

The parser (`models/lib/googletasksApiFormat.js`):

- each task list is a list (a repeated title gets ` (2)`);
- the board is called "Google Tasks", or after the list when there is one;
- top-level tasks are cards, ordered by `position`, with the task id as the
  source reference;
- subtasks (`parent`) are a checklist "Subtasks" on the parent card, in
  `position` order, done when completed. A subtask whose parent is not in the
  data is a card of its own;
- `due` is a date: Google keeps no time for it, so it is imported at
  midnight UTC;
- a completed task is archived, with `completed` as its end date;
- `links` are added to the description as `description: link` lines.

### What is kept

| Google Tasks | WeKan |
| --- | --- |
| Task list `title` | List, in order; the board title when one list |
| Task `title` | Card title |
| `notes` | Card description |
| `links` | Lines at the end of the description |
| `due` | Due date |
| `status: completed` | Archived card |
| `completed` | End date |
| Subtasks (`parent`) | Checklist "Subtasks", done = completed, with the subtask's due date |
| `position` | Card and checklist item order |
| Hidden (cleared) completed tasks | Archived cards |

### What is not kept

The import reports these on the loss report:

- deleted tasks (`deleted: true`), counted per list;
- the notes and links of a subtask: a checklist item has a title, done, a due
  date and an assignee;
- a subtask whose parent is missing (it becomes its own card);
- a due date that is not a date;
- a second list with the same title (it is imported as `<title> (2)`);
- lists and tasks that are not objects.

Not imported and not reported: `updated`, `webViewLink`, `etag` and the
time of `due`, which Google does not keep. Google Tasks has no members,
labels, comments or attachments.

### How it is built and tested

- `models/lib/apiImportServices.js` lists the service and its one field,
  `token`. `models/lib/apiImport/googletasks.js` lists and fetches,
  `models/lib/googletasksApiFormat.js` reads the result into the normalized
  board, and the generalized importer (`models/kanboardCreator.js`) creates
  it.
- `tests/googletasksApiImport.test.cjs` tests the client with a fake
  `request` (the Bearer header, paging, a repeated page token, an error
  status, the token never in a URL) and the parser with every field, and
  rejects wrong shapes.
- `releases/live-tests/googletasks-import.mjs` is the live test: with
  `WEKAN_LIVE_GOOGLE_TASKS_TOKEN` set to a `tasks.readonly` access token it
  lists, fetches all lists and parses them, against Google itself. It only
  reads. Run it from **build.sh → Tests → Live tests**, or with
  `node releases/live-tests/googletasks-import.mjs`.

## Commits

 - [Imported subtasks keep their due date and person: a checklist item has both](https://github.com/wekan/wekan/commit/cf6f67e789ac404866d4b51591820570850baaa3)
 - [Import: Planka, Microsoft To Do, KanbanFlow, Basecamp, Google Tasks and Google Keep from their APIs](https://github.com/wekan/wekan/commit/46e30f01e48f2676a47c0052007f5c4ea951a923)
