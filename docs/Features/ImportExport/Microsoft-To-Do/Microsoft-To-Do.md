# Microsoft To Do

WeKan imports [Microsoft To Do](https://to-do.office.com/) lists straight
from Microsoft's API, [Microsoft Graph](https://learn.microsoft.com/en-us/graph/api/resources/todo-overview).
Microsoft To Do has no export file, so WeKan fetches the lists with an
access token the member pastes on the import page. Each To Do list becomes a
WeKan list and each task a card, with its notes, dates, steps, categories,
importance and status.

## How to import

1. Get a Microsoft Graph access token that may read your tasks:
   1. Open [Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)
      and sign in with the Microsoft account that has the lists.
   2. Click **Modify permissions** (or the profile menu → **Consent to
      permissions**), find **Tasks.Read** and consent to it.
   3. Open the **Access token** tab and copy the token.

   The token is valid for about an hour. WeKan uses it for that fetch only
   and does not store it.
2. In WeKan, go to **All Boards → New → Import → Microsoft To Do**.
3. Paste the token, then click **List**.
4. Choose **Microsoft To Do (all lists)** or one list, then click **Fetch**.
5. Continue as with any import: map the members, then click **Import**.
6. Read the loss report on the import page. It is also kept in **Admin Panel →
   Problems → Recovery**.

All lists make one board called "Microsoft To Do", one WeKan list per To Do
list. One list makes a board named after that list.

## How to import many boards at once

Microsoft To Do is fetched, not read from files, so it has no import of many
files at once. To make each To Do list its own board, fetch and import one
list at a time: after **List**, choose the next list, **Fetch** and
**Import** again, with the same token while it is valid.

The fetched JSON can also be saved and imported again through the REST API
(below), one board per document.

## How to export

WeKan does not export to Microsoft To Do. To take a WeKan board to To Do,
export it as [iCalendar](../iCalendar/iCalendar.md) or CSV and use a tool that writes To
Do tasks through Microsoft Graph; To Do itself reads no file.

## How to export all boards at once

There is no export to Microsoft To Do, for one board or for all of them.

## Format details

The client (`models/lib/apiImport/mstodo.js`) sends, with the header
`Authorization: Bearer <token>` and nothing else of the member's:

- `GET https://graph.microsoft.com/v1.0/me/todo/lists`: the
  [todoTaskList](https://learn.microsoft.com/en-us/graph/api/resources/todotasklist)s
  (`id`, `displayName`, `wellknownListName`);
- `GET https://graph.microsoft.com/v1.0/me/todo/lists/{id}/tasks?$expand=checklistItems`
  for each list chosen: its
  [todoTask](https://learn.microsoft.com/en-us/graph/api/resources/todotask)s
  with their steps.

Both follow `@odata.nextLink` pages, and only to `https://graph.microsoft.com`;
a next link to any other host is refused, so the token never leaves Graph.
Limits: 1,000 pages and 50,000 tasks.

What it returns, and what the import page imports:

```json
{ "mstodo": true,
  "lists": [{ "id": "…", "displayName": "Tasks", "wellknownListName": "defaultList",
              "tasks": [ todoTask, … ] }] }
```

The todoTask fields that are read: `id`, `title`, `body` (`content`,
`contentType`), `status` (`notStarted`, `inProgress`, `completed`,
`waitingOnOthers`, `deferred`), `importance` (`low`, `normal`, `high`),
`isReminderOn` and `reminderDateTime`, `dueDateTime`, `startDateTime`,
`completedDateTime` (each `{ dateTime, timeZone }`), `createdDateTime`,
`categories`, `checklistItems` (`displayName`, `isChecked`), `recurrence`,
`linkedResources` (`webUrl`, `displayName`, `applicationName`) and
`hasAttachments`.

What the current code does (`models/lib/mstodoApiFormat.js`):

- An HTML body becomes plain text: tags are removed, line breaks, paragraphs
  and list items become lines, and entities (`&amp;`, `&nbsp;`, `&#228;` …)
  are decoded. A text body is kept as it is.
- Graph sends dates in UTC; a `dateTime` without an offset is read as UTC.
- Links of `linkedResources`, when present, are added to the description
  under "Linked:".
- A task with `status: completed` is imported as an archived card, ended at
  `completedDateTime`; with a due date, the due date is marked done.
- A repeated list name gets ` (2)`.
- Every card goes to the swimlane Default.

## What is kept

| Microsoft To Do | WeKan |
| --- | --- |
| List `displayName` | List title; the board title when one list is imported |
| Task `title` | Card title |
| `body` | Card description, as plain text |
| `dueDateTime` | Due date |
| `startDateTime` | Start date |
| `createdDateTime` | Created date |
| `completedDateTime` | End date |
| `status: completed` | Archived card |
| `status: inProgress`, `waitingOnOthers`, `deferred` | Label "In progress" (blue), "Waiting on others" (orange), "Deferred" (gray) |
| `importance: high` | Label "High importance" (red) |
| `categories` | Labels |
| `checklistItems` (`displayName`, `isChecked`) | Checklist "Steps" |
| `linkedResources` | Links in the description |

## What is not kept

The import reports these on the loss report:

- reminders (`isReminderOn`, `reminderDateTime`): WeKan has no reminders;
- repeats (`recurrence`): the card is imported once;
- attachments (`hasAttachments`): they are not fetched;
- a date that is not a date;
- a second list with the same name (it is imported as `<name> (2)`);
- lists and tasks that are not objects.

Not reported, because WeKan has no place for them: `lastModifiedDateTime`,
`importance: low` and `normal`, and the "My Day" and flagged-email lists'
special meaning (`wellknownListName`); their tasks are imported like any
other.

## REST API

The fetched JSON can be imported like an export file:

```bash
python3 api.py importboardfrom mstodo fetched.json   # POST /api/boards/import/mstodo
```

The HTTP route is `POST /api/boards/import/mstodo` with the fetched JSON
(`{ "mstodo": true, "lists": [...] }`) as `board`. The REST API does not take a
token: fetch first, then post what was fetched.

## How it is built and tested

- `models/lib/apiImportServices.js` lists the service and its one field, the
  token. `models/lib/apiImport/mstodo.js` lists and fetches from Microsoft
  Graph; the server passes it a request that goes through the SSRF guard.
  `models/lib/mstodoApiFormat.js` reads the result into WeKan's normalized
  board, and `models/kanboardCreator.js` creates the board.
- `tests/mstodoApiImport.test.cjs` is the unit test: realistic Graph
  answers, every field mapped, wrong shapes refused, and the client with a
  fake request (listing, paging over `@odata.nextLink`, refusing a next link
  to another host, the token only in the `Authorization` header).
- `releases/live-tests/mstodo-import.mjs` is the live test against Microsoft
  Graph, from **build.sh → Tests → Live tests** or directly with
  `WEKAN_LIVE_MSTODO_TOKEN=<token> node releases/live-tests/mstodo-import.mjs`.
  It only reads: it lists, fetches all lists, parses them and checks every
  list and task arrived. It is skipped without a token.

## Sources

- [To Do API overview](https://learn.microsoft.com/en-us/graph/api/resources/todo-overview):
  the lists and tasks of Microsoft Graph
- [todoTaskList](https://learn.microsoft.com/en-us/graph/api/resources/todotasklist)
  and [List lists](https://learn.microsoft.com/en-us/graph/api/todo-list-lists)
- [todoTask](https://learn.microsoft.com/en-us/graph/api/resources/todotask)
  and [List tasks](https://learn.microsoft.com/en-us/graph/api/todotasklist-list-tasks)
- [checklistItem](https://learn.microsoft.com/en-us/graph/api/resources/checklistitem)
  and [linkedResource](https://learn.microsoft.com/en-us/graph/api/resources/linkedresource)
- [Paging Microsoft Graph data](https://learn.microsoft.com/en-us/graph/paging):
  `@odata.nextLink`
- [Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer):
  where to get a token

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).
