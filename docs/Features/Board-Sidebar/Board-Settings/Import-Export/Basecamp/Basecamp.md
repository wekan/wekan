# Basecamp

## What it is

WeKan imports a [Basecamp](https://basecamp.com) project straight from the
[Basecamp 4 / 3 API](https://github.com/basecamp/bc3-api). Basecamp has no
export file a kanban board can be made from, so the import page fetches the
project itself, with an account id and an access token. Each card table
becomes a swimlane with its columns as lists, and the project's to-do lists
become a swimlane "To-dos". Cards and to-dos keep their text, dates,
assignees, steps and comments.

## Read more

- [Wikipedia: Basecamp, the company and its project management app](https://en.wikipedia.org/wiki/Basecamp_(company))
- [bc3-api](https://github.com/basecamp/bc3-api): the Basecamp 4 / 3 API
- [projects](https://github.com/basecamp/bc3-api/blob/master/sections/projects.md),
  [card tables](https://github.com/basecamp/bc3-api/blob/master/sections/card_tables.md),
  [card table cards](https://github.com/basecamp/bc3-api/blob/master/sections/card_table_cards.md),
  [card table steps](https://github.com/basecamp/bc3-api/blob/master/sections/card_table_steps.md),
  [to-do lists](https://github.com/basecamp/bc3-api/blob/master/sections/todolists.md),
  [to-dos](https://github.com/basecamp/bc3-api/blob/master/sections/todos.md),
  [comments](https://github.com/basecamp/bc3-api/blob/master/sections/comments.md)
- [pagination and User-Agent](https://github.com/basecamp/bc3-api#pagination)

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

1. Get an access token for Basecamp:
   - register an app at [launchpad.37signals.com](https://launchpad.37signals.com/integrations)
     and go through its OAuth 2 flow
     ([bc3-api authentication](https://github.com/basecamp/bc3-api#authentication))
     to get an access token; or
   - use a token an existing integration of yours already has.
2. Find the account id: the number after `basecamp.com/` in the address when
   you are signed in, as in `https://3.basecamp.com/999999999/projects`.
3. In WeKan, go to **All Boards → Add Board → Import → Import board → Basecamp**.
4. Type the account id and the access token, and click **List projects**.
   The token is used for that fetch only and is not stored; the field is
   cleared once it is sent.
5. Choose the project and click **Fetch**. WeKan fetches the project's card
   tables and to-do lists.
6. Continue as with any import: map the members, then click **Import**.
7. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

### How to import many boards at once

One fetch is one project. Repeat the import for each project to bring in.

Basecamp is imported through the generalized importer
(`models/kanboardCreator.js`), so the page also has a checkbox **One board per
project**: each swimlane the import would create becomes its own board, named
after that swimlane. For Basecamp that makes each card table, and the
to-do lists, a board of its own, each with only its own columns.

### How to export

WeKan has no export to Basecamp: Basecamp imports no kanban file. To move a
board to Basecamp, export it as CSV or another format from **Board Settings →
Export** and bring it in by hand.

### How to export all boards at once

There is no Basecamp export, so there is nothing to export all at once.

### REST API

```bash
curl -X POST https://wekan.example.com/api/boards/import/basecamp \
  -H "Authorization: Bearer $WEKAN_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"board\": $(cat basecamp.json)}"
```

`POST /api/boards/import/basecamp` takes the fetched JSON (above) as `board`.
The fetch itself happens on the import page, from the server, through its
address guard; the REST API does not call Basecamp.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- At most 200 pages. More stops the import with an error. (`MAX_PAGES` in
  [models/lib/apiImport/basecamp.js](../../../../../../models/lib/apiImport/basecamp.js#L20))
- At most 5,000 projects. (`MAX_PROJECTS` in
  [models/lib/apiImport/basecamp.js](../../../../../../models/lib/apiImport/basecamp.js#L21))
- At most 20 card tables. Anything past it is left out. (`MAX_CARD_TABLES` in
  [models/lib/apiImport/basecamp.js](../../../../../../models/lib/apiImport/basecamp.js#L22))
- At most 200 lists. Anything past it is left out. (`MAX_LISTS` in
  [models/lib/apiImport/basecamp.js](../../../../../../models/lib/apiImport/basecamp.js#L23))
- At most 20,000 items. More stops the import with an error. (`MAX_ITEMS` in
  [models/lib/apiImport/basecamp.js](../../../../../../models/lib/apiImport/basecamp.js#L24))
- At most 20,000 comments. (`MAX_COMMENTS` in
  [models/lib/apiImport/basecamp.js](../../../../../../models/lib/apiImport/basecamp.js#L25))
- At most 20,000 tasks. More stops the import with an error.
  (`MAX_BASECAMP_TASKS` in
  [models/lib/basecampApiFormat.js](../../../../../../models/lib/basecampApiFormat.js#L15))

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
[models/lib/apiImport/basecamp.js](../../../../../../models/lib/apiImport/basecamp.js),
[models/lib/basecampApiFormat.js](../../../../../../models/lib/basecampApiFormat.js),
[releases/live-tests/basecamp-import.mjs](../../../../../../releases/live-tests/basecamp-import.mjs).

The tests that pin it:
[tests/basecampApiImport.test.cjs](../../../../../../tests/basecampApiImport.test.cjs).

The details of the format, what is kept and how it is tested are below.

### Format details

`models/lib/apiImport/basecamp.js` sends, below
`https://3.basecampapi.com/<account>` and with the headers
`Authorization: Bearer <token>` and `User-Agent: WeKan (https://wekan.fi)`
(Basecamp refuses a request without a User-Agent):

- `GET /projects.json`: the projects to choose from;
- `GET /projects/<id>.json`: the project, and its `dock`;
- for each enabled `kanban_board` in the dock, `GET /card_tables/<id>.json`:
  the card table and its `lists` (columns), then for each column
  `GET /card_tables/lists/<id>/cards.json`;
- for the dock's `todoset`, `GET /todosets/<id>/todolists.json`, then for
  each to-do list `GET /todolists/<id>/todos.json` and the same with
  `?completed=true`;
- for a card or to-do whose `comments_count` is more than 0, its
  `comments_url`, only when that address is below the same account.

These are the flat routes bc3-api documents as canonical; the
`/buckets/<project>/…` routes are the older equivalent. Basecamp names the next
page in a `Link` header, which the import's request does not return, so every
collection is read as `?page=1`, `?page=2`, … until an empty page, at most 200
pages. The account id must be digits only. Limits: 20,000 cards and to-dos,
20,000 comments, 20 card tables, 200 columns or to-do lists.

The fetched JSON, which is also what the REST API takes:

```json
{ "basecamp": true,
  "project": { "id": "77", "name": "Website" },
  "cardTables": [{ "title": "Design", "lists": [{ "title": "Triage", "type": "Kanban::Triage", "cards": [] }] }],
  "todolists": [{ "title": "Launch", "todos": [] }] }
```

`models/lib/basecampApiFormat.js` reads it:

- the project name is the board title;
- each card table is a swimlane named after it; its columns are lists with
  their titles kept, whatever their type: `Kanban::Triage`, `Kanban::Column`,
  `Kanban::DoneColumn` or `Kanban::NotNowColumn`. A repeated title in one card
  table gets ` (2)`;
- the to-do lists are a swimlane "To-dos", each to-do list a list;
- rich text (HTML) is read as plain text: tags are dropped, `<br>` and the end
  of a paragraph or list item become line breaks, and entities are decoded;
- people are matched by name (or email address when there is no name) on the
  members step.

### What is kept

| Basecamp | WeKan |
| --- | --- |
| Project `name` | Board title |
| Card table | Swimlane |
| Card table column (`lists`) | List, title kept |
| Card `title`, `content` | Card title, description |
| To-do list | List in the swimlane "To-dos" |
| To-do `content`, `description` | Card title, description |
| `due_on` | Due date |
| `starts_on` (to-dos) | Start date |
| `created_at` | Created date |
| `completed` | Due date marked done; a completed to-do is archived |
| `assignees` | Members: the first as owner, then the others |
| Card `steps` (`title`, `completed`, `due_on`, `assignees`) | Checklist "Steps", each item with the step's due date and first assignee |
| Comments (`content`, `creator`, `created_at`) | Comments |
| Card and to-do `id` | Source reference |

### What is not kept

- message boards, docs and files, schedules, chat (Campfire), check-ins and
  every other dock tool besides card tables and to-dos;
- attachments and images inside rich text (the text is kept);
- formatting of rich text;
- to-do list descriptions and to-do groups;
- column colors, step due dates and step assignees;
- boosts, subscribers and client visibility;
- archived and trashed cards and to-dos;
- a date that is not a date, and items that are not objects, are reported on
  the loss report.

### How it is built and tested

- `models/lib/apiImportServices.js` lists Basecamp with its fields: account
  and token.
- `models/lib/apiImport/basecamp.js` fetches the project;
  `models/lib/basecampApiFormat.js` reads it into the normalized board that
  `models/kanboardCreator.js` creates.
- `tests/basecampApiImport.test.cjs` runs the client with a fake request (the
  headers, a non-digit account refused before any request, paging to an empty
  page, comments fetched only when counted and only from Basecamp, an error
  status passed on) and the parser on every field and wrong shapes.
- `releases/live-tests/basecamp-import.mjs` is a read-only live test against
  the real API: with `WEKAN_LIVE_BASECAMP_ACCOUNT` and
  `WEKAN_LIVE_BASECAMP_TOKEN` set it lists the projects, fetches the first and
  parses it; without them it is skipped. It writes nothing.

## Commits

 - [Basecamp card steps keep their due date and assignee](https://github.com/wekan/wekan/commit/a72b29726821301db304b4120bcc21566650202a)
 - [Live tests: no log line carries anything from a login (CodeQL #586)](https://github.com/wekan/wekan/commit/de95789e4568ea2424a471f2e5ceac3001f2d3f9)
 - [Fix three guards the last commits tripped](https://github.com/wekan/wekan/commit/a6a1d3c1a61537d203813d71a22c8b94c01e41f8)
 - [Import: Planka, Microsoft To Do, KanbanFlow, Basecamp, Google Tasks and Google Keep from their APIs](https://github.com/wekan/wekan/commit/46e30f01e48f2676a47c0052007f5c4ea951a923)
