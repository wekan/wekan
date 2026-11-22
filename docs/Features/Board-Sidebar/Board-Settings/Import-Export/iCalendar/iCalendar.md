# iCalendar

## What it is

WeKan exports a board's card dates as an iCalendar (`.ics`) calendar feed,
and imports the events of an `.ics` file as cards. The feed is one-way and
read-only: a calendar app that can subscribe to a URL shows the board's dates
and fetches them again later, but changes made in the calendar do not come
back to WeKan. The import adds cards to a list of an existing board; it does
not create a board, and it has no entry on the import page.

## Read more

- [Wikipedia: iCalendar, the calendar data format](https://en.wikipedia.org/wiki/ICalendar)
- [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545): iCalendar, its events,
  text escaping, line folding and date forms
- [RFC 7986](https://www.rfc-editor.org/rfc/rfc7986): newer calendar
  properties
- [Export events from Google Calendar](https://support.google.com/calendar/answer/37111):
  exporting one calendar as `.ics`
- [Add a calendar from a URL in Google Calendar](https://support.google.com/calendar/answer/37100):
  subscribing to a feed

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

On the import page: **All Boards → Add Board → Import → Import board → iCalendar (.ics)**, then
choose the `.ics` file or paste its text. A new board is made: tasks (`VTODO`)
go to **To Do**, **In Progress**, **Done** or **Cancelled** by their `STATUS`,
events (`VEVENT`) to **Events**, with their start, due and completion dates;
`CATEGORIES` and `PRIORITY` become labels, a subtask (`RELATED-TO`) keeps its
parent, and the calendar's name is the board's title. A repeating item
(`RRULE`) is imported once, and that is in the loss report
(`models/lib/icalendarFormat.js`, `tests/icalendarFormat.test.cjs`).

Into an existing list of a board, through the REST API and `api.py`:

1. Get the `.ics` file from the calendar app. In Google Calendar on a
   computer: under **My calendars**, point at the calendar, click **More →
   Settings and sharing**, and under **Calendar settings** choose **Export
   calendar**. For other apps, see their documentation.
2. Find the ids of the board, swimlane and list the cards go to, for example
   with `python3 api.py swimlanes BOARDID` and `python3 api.py lists BOARDID`.
3. Run:

   ```bash
   python3 api.py importics BOARDID SWIMLANEID LISTID calendar.ics
   ```

   One card is created in that list for every event (`VEVENT`). The answer
   says how many cards were created and their ids.

You need write access to the board: a role that may add cards. There is no
loss report for this import.

### How to import many boards at once

There is nothing to import as boards: an `.ics` file adds cards to a list of
a board that already exists. To import several files, run `importics` once for
each.

### How to export

1. In WeKan, open the board, then **Board Settings → Export**. The entry is
   offered only for a whole board.
2. Under **iCal**, choose **Calendar feed (iCal)**. The board's dates
   download as an `.ics` file named after the board.
3. To import the file once, use the calendar app's import. To subscribe so
   the dates stay current, copy the link of **Calendar feed (iCal)** instead
   of clicking it, and add it in the calendar app as a calendar from a URL. In
   Google Calendar on a computer: next to **Other calendars**, click **Add
   other calendars**, choose **From URL**, paste the link and click **Add
   calendar**. For other
   apps, see their documentation. The calendar app must be able to reach your
   WeKan server.

For a private board the link carries your login token (`authToken`), so
anyone who has the link can read the feed as you, until that login token is
removed, for example when you log out. A public board's feed needs no token.

### How to export all boards at once

This is not available for iCalendar. The feed is a calendar of one board, so
**Export all boards** does not offer it. Subscribe to each board's feed.

### REST API

```bash
python3 api.py importics BOARDID SWIMLANEID LISTID calendar.ics
curl -o board.ics "https://WEKAN-SERVER/api/boards/BOARDID/calendar.ics?authToken=TOKEN"
```

- `POST /api/boards/BOARDID/swimlanes/SWIMLANEID/lists/LISTID/ics` with the
  body `{ "ics": "BEGIN:VCALENDAR..." }` creates the cards and answers
  `{ "created": N, "cardIds": [...] }`. It needs write access to the board.
  The Meteor method `importIcsToBoard(boardId, listId, swimlaneId, icsText)`
  does the same.
- `GET /api/boards/BOARDID/calendar.ics?authToken=TOKEN` is the feed; a
  public board needs no token. `swimlaneId` or `listId` narrow it.

The `importboardfrom`, `importboardsfrom`, `exportboardformat` and
`exportallboards` commands do not apply to iCalendar.

## How the numbers are calculated

The limits and conversions of this format, from its own code:

- Export lines are folded at 75 characters, as RFC 5545 requires. (`MAX` in
  [models/lib/icalExport.js](../../../../../../models/lib/icalExport.js#L48))
- The iCalendar file: at most 67,108,864 characters (64 MB of text). More stops
  the import with an error. (`MAX_ICS_LENGTH` in
  [models/lib/icalendarFormat.js](../../../../../../models/lib/icalendarFormat.js#L29))
- At most 50,000 calendar components (events and to-dos). Anything past it is
  left out. (`MAX_ICS_COMPONENTS` in
  [models/lib/icalendarFormat.js](../../../../../../models/lib/icalendarFormat.js#L30))

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

This format's own code:
[models/lib/icalExport.js](../../../../../../models/lib/icalExport.js),
[models/lib/icalendarFormat.js](../../../../../../models/lib/icalendarFormat.js),
[server/lib/icsImport.js](../../../../../../server/lib/icsImport.js),
[server/methods/icsImport.js](../../../../../../server/methods/icsImport.js).

The tests that pin it:
[server/lib/tests/icsImport.tests.js](../../../../../../server/lib/tests/icsImport.tests.js),
[tests/calendarbleed.test.cjs](../../../../../../tests/calendarbleed.test.cjs),
[tests/icalExport.test.cjs](../../../../../../tests/icalExport.test.cjs),
[tests/icalendarFormat.test.cjs](../../../../../../tests/icalendarFormat.test.cjs),
[tests/playwright/specs/export-access.e2e.js](../../../../../../tests/playwright/specs/export-access.e2e.js).

The details of the format, what is kept and how it is tested are below.

### Format details

From the [format coverage](../Format-Coverage.md) audit:

- **Authoritative shape:** RFC 5545 plus RFC 7986 additive properties.
- **Required import coverage:** unfolded and escaped UTF-8 content lines, UID
  identity, recurrence, exclusions, timezone, start, end and duration, status,
  summary, description, URL, attendees and categories.

The current import reads much less than that list. What the code does:

#### Import (`server/lib/icsImport.js`)

- Folded lines are unfolded, and `\,`, `\;` and `\n` in text are unescaped.
- Only `VEVENT` blocks are read; everything outside them (`VTIMEZONE`,
  `VTODO` and the calendar's own properties) is skipped.
- From each event it reads `SUMMARY` (card title), `DESCRIPTION` (card
  description), `DTSTART` (start date) and `DTEND` (due date; without
  `DTEND`, the due date is `DTSTART`). `UID` is read but not stored.
- A date-time `YYYYMMDDTHHMMSS` is read as UTC, with or without the trailing
  `Z`; a `TZID` parameter is ignored. A date `YYYYMMDD` (all day) is midnight
  UTC. A value in any other form leaves the date empty.
- The cards are created in the given list and swimlane, in the order of the
  events. The list and the swimlane must belong to the board.

#### Export (`models/lib/icalExport.js`)

The route is `GET /api/boards/BOARDID/calendar.ics` (`models/export.js`).
Every card that is not archived and has at least one date gives up to three
events, the dates the board's Calendar view draws:

- a start-to-end event, when the card has a start or an end date, named after
  the card;
- a due event, named `TITLE (due)`;
- a received event, named `TITLE (received)`.

Each event has a `UID` made from the card id and the kind (`CARDID-span@wekan`,
`-due@wekan`, `-received@wekan`), so a calendar recognizes the same event when
it fetches the feed again; `DTSTAMP`; `DTSTART` and `DTEND` in UTC;
`SUMMARY`; `DESCRIPTION` (the card's description) and `URL` (the card's
link). The calendar is named `WeKan - BOARD TITLE`. Text is escaped and long
lines are folded at 75 characters as RFC 5545 asks. The route also takes
`swimlaneId` or `listId` to export only that part of the board.

### What is kept

On import:

| iCalendar | WeKan |
| --- | --- |
| `VEVENT` | Card in the given list and swimlane |
| `SUMMARY` | Title |
| `DESCRIPTION` | Description |
| `DTSTART` | Start date |
| `DTEND` (else `DTSTART`) | Due date |

On export:

| WeKan | iCalendar |
| --- | --- |
| Card with a start or end date | Event from start to end |
| Due date | Event `TITLE (due)` |
| Received date | Event `TITLE (received)` |
| Card title, description, link | `SUMMARY`, `DESCRIPTION`, `URL` |
| Card id | `UID` |
| Board title | Calendar name |

### What is not kept

The import does not read, and does not report: time zones, recurrence
(`RRULE`, `RDATE`, `EXDATE`), `DURATION`, `STATUS`, `LOCATION`, `URL`,
attendees, organizer, categories, alarms, and to-dos (`VTODO`). Importing the
same file twice creates the cards twice.

The export leaves out archived cards, cards without dates, labels, members,
checklists and every other card field. Changes made in the calendar app are
not sent back to WeKan; full two-way CalDAV sync is not provided.

### How it is built and tested

- Import: `server/lib/icsImport.js` (parser) and `server/methods/icsImport.js`
  (method, REST route and the write-access check).
- Export: `models/lib/icalExport.js` (feed writer) and `models/export.js`
  (route and access check). The menu entry is `ical` in
  `client/components/boards/exportScope.js`.
- Unit tests: `tests/icalExport.test.cjs` (escaping, dates, folding, events),
  `server/lib/tests/icsImport.tests.js` (parsing, unfolding, unescaping, all-day
  dates) and `tests/calendarbleed.test.cjs` (only roles with write access may
  import).
- Playwright: `tests/playwright/specs/export-access.e2e.js` (an assigned-only
  member cannot read the unfiltered feed).

## Commits

 - [Repeating tasks of other tools repeat in WeKan: daily, weekly and monthly as the card's recurrence](https://github.com/wekan/wekan/commit/24ac6b2bd2e55323fa1c6e52eb53ff3291fc80fb)
 - [Import and export mail, calendars, chats and notes: mbox/.eml, iCalendar, Google Takeout, Slack, Mattermost, Telegram ](https://github.com/wekan/wekan/commit/ccfa6cf362e9b1eb812804d38e4d85653c5b0b0a)
 - [ListLockBulkBleed: bulk and server-side card writes ask the list's role exception](https://github.com/wekan/wekan/commit/ba3d94390ba724344a2d5cfe50e9dee3cc6f8d89)
 - [Add a per-board iCal (.ics) export feed, answering #2836](https://github.com/wekan/wekan/commit/a49e9d70aa744944b3fdbb5d96ac8fb50033547d)
 - [Use canonical REST board write access](https://github.com/wekan/wekan/commit/d1c75e995053aa9cae77d92f421c03d64587c17e)
 - [Require write access for ICS imports](https://github.com/wekan/wekan/commit/e062042c15fac4a5292c053d77a829f19b4a57bd)
 - [Security log: wire upload / metrics-XFF / export-authz remediation points](https://github.com/wekan/wekan/commit/6678c92e08762ead403fe756e28df2ef2800af5f)
 - [Add ICS import REST API + OpenAPI + api.py example (#6323)](https://github.com/wekan/wekan/commit/b4bbf2480a094511e84b157b8e7635121023ee39)
 - [Add #6323: import Google Calendar .ics files into board cards (MVP)](https://github.com/wekan/wekan/commit/0a43d8ac3cc7d5b325dffa4d587ac649e03a1781)
 - [Import single card: now uses historical dates](https://github.com/wekan/wekan/commit/81bd55113789e53e65080604bb29a3d61df83684)
