# Planka

WeKan imports a board from [Planka](https://github.com/plankanban/planka),
the self-hosted kanban app, by reading it from Planka's REST API. Planka v1
and v2 are both read. Lists become lists and cards keep their description,
due date, labels, members, task lists and comments.

## How to import

1. In WeKan, go to **All Boards → New → Import → Planka**.
2. Type the Planka address (for example `https://planka.example.com`), your
   Planka username (or e-mail address) and password. They are used for this
   fetch only and are not stored; the password field is cleared once sent.
3. Press **List**. WeKan logs in to Planka and lists every board you can see,
   as "Project / Board".
4. Choose a board and press **Fetch**. WeKan reads the board, every card's
   comments, and logs out of Planka again.
5. Continue the import as usual: map the members, then **Import**.
6. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

The WeKan server makes the requests, so it must be able to reach the Planka
address. A Planka on the server's own network (a private address) is refused
unless the WeKan administrator allows its host in
`API_IMPORT_ALLOWED_PRIVATE_HOSTS`. A Planka login that needs a two-factor
code or accepting terms first cannot be used.

## How to import many boards at once

Planka boards are fetched one at a time: press **Fetch** for each board and
import it. Each becomes its own WeKan board.

## How to export

WeKan does not export to Planka. Planka has no import of its own format to
read such a file with; it imports Trello boards, so a WeKan board can reach
Planka through WeKan's **Trello** export (**Board Settings → Export → JSON →
Trello**) and Planka's **Import from Trello**, with what that format keeps.

## How to export all boards at once

WeKan does not export to Planka, so there is no all-boards export for it
either. See [How to export](#how-to-export).

## Format details

What is fetched (`models/lib/apiImport/planka.js`), with a Bearer token from
`POST /api/access-tokens` (`{ emailOrUsername, password }`):

- `GET /api/projects`: the projects and their boards, for the list;
- `GET /api/boards/:id`: the board as `item`, and as `included` its `users`,
  `labels`, `lists`, `cards`, `cardMemberships`, `cardLabels`, `taskLists`
  (v2), `tasks`, `attachments` and custom fields;
- each card's comments: Planka v2's `GET /api/cards/:cardId/comments`, or, when
  that answers 404, Planka v1's `GET /api/cards/:cardId/actions`, where a
  comment is an action of type `commentCard` with its text in `data.text`.
  Both answer 50 at a time, newest first, and are read page by page
  (`beforeId`). A v2 card whose `commentsTotal` is 0 is not asked. Comments are
  fetched for at most 5,000 cards;
- `DELETE /api/access-tokens/me` logs out at the end.

The fetched JSON is `{ planka: <board answer>, comments: { cardId: [{ text,
userId, createdAt }] }, commentUsers: { userId: { username, name } } }`, and
`models/lib/plankaApiFormat.js` reads it:

- lists by `position` (a repeated name gets ` (2)`). Planka v2's list `type`:
  `active` and `closed` lists are imported as lists; the cards of the
  `archive` list are imported archived, into the list they were in
  (`prevListId`, otherwise the first list); the cards in the `trash` are not
  imported;
- cards by `position`: `name`, `description`, `dueDate`, the due date being
  done (v1 `isDueDateCompleted`, v2 `isDueCompleted`), `createdAt`, the card
  id as the source reference;
- `creatorUserId` as the card's owner and `cardMemberships` as its assignees,
  both by Planka `username`, which the members step maps to WeKan users;
- `cardLabels` as labels. Planka's label colors are names (`berry-red`,
  `lagoon-blue` …): each maps to the closest WeKan color, or keeps the hex
  Planka draws it with. A label without a name is named after its color;
- task lists (v2 `taskLists`, with each task's `taskListId`) as checklists
  with their names; Planka v1's tasks, straight on the card, as one "Tasks"
  checklist. `isCompleted` is done;
- comments with their author and date. An author who is no longer a board
  member is still named, from the users the comments answer included.

Limit: 20,000 cards. Every card goes to the swimlane Default.

## What is kept

| Planka | WeKan |
| --- | --- |
| Board `name` | Board title |
| Lists (`active`, `closed`) | Lists, in order |
| Card `name` | Card title |
| `description` | Card description |
| `dueDate` | Due date |
| `isDueDateCompleted` / `isDueCompleted` | Due date marked done |
| `createdAt` | Created date |
| `creatorUserId` | Card owner (mapped member) |
| `cardMemberships` | Card assignees (mapped members) |
| Labels (`name`, `color`) | Labels with their color |
| Task lists and tasks | Checklists |
| Comments | Comments, with author and date |
| Cards in the `archive` list | Archived cards |

## What is not kept

The import reports these on the loss report:

- cards in the Planka trash;
- attachments: they are files on the Planka server;
- custom field values;
- the stopwatch time;
- a due date that is not a date;
- a second list with the same name (it is imported as `<name> (2)`);
- a card whose list is not on the board;
- the comments of cards beyond the first 5,000.

Not read at all: board and card subscriptions, board backgrounds, the card
cover image, the project itself, the activity history other than comments,
a task's assignee or linked card, and Planka's notification settings.

## REST API

The import page's **List** and **Fetch** are Meteor methods on the WeKan
server (`server/apiImport.js`). The fetched JSON can also be imported without
the page, by posting it to WeKan's import route:

```bash
python3 api.py importboardfrom planka planka.json      # POST /api/boards/import/planka
```

- `POST /api/boards/import/planka` with the fetched JSON as `board`.

## How it is built and tested

- `models/lib/apiImportServices.js` lists the service and the fields the page
  asks for; `models/lib/apiImport/planka.js` is the client and
  `server/lib/apiImportRequest.js` the request it is given on the server,
  through the SSRF guard (no redirects, 30 seconds, bounded size).
- `models/lib/plankaApiFormat.js` reads the fetched JSON into the normalized
  board, and `models/kanboardCreator.js` creates it, with label colors from
  `models/lib/importedTaskPlan.js`.
- `tests/plankaApiImport.test.cjs` is the unit test: Planka v1 and v2
  fixtures, every field of the mapping, wrong shapes refused, and the client
  with a fake Planka (login, listing, fetching with comment pages, the v2 to
  v1 fallback, an error keeping its HTTP status, and the password never in a
  URL).
- `releases/live-tests/planka-import.mjs` is the live test against a real
  Planka, run by hand from **build.sh → Tests → Live tests** with
  `WEKAN_LIVE_PLANKA_URL`, `WEKAN_LIVE_PLANKA_USERNAME` and
  `WEKAN_LIVE_PLANKA_PASSWORD`. It is read-only: it lists the boards, fetches
  and parses the first one, and writes nothing to Planka except the login
  token it creates and deletes.

## Sources

- [Planka](https://github.com/plankanban/planka): the app
- [server/config/routes.js](https://github.com/plankanban/planka/blob/master/server/config/routes.js):
  the REST routes
- [boards/show.js](https://github.com/plankanban/planka/blob/master/server/api/controllers/boards/show.js):
  what a board answer includes
- [the models](https://github.com/plankanban/planka/tree/master/server/api/models):
  `List.js` (list types), `Card.js`, `Label.js` (label colors), `TaskList.js`,
  `Task.js`, `Comment.js`
- [styles.module.scss](https://github.com/plankanban/planka/blob/master/client/src/styles.module.scss):
  the colors Planka draws its labels with

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).
