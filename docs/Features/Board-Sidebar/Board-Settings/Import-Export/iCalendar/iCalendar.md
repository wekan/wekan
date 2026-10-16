# iCalendar

WeKan exports a board's card dates as an iCalendar (`.ics`) calendar feed,
and imports the events of an `.ics` file as cards. The feed is one-way and
read-only: a calendar app that can subscribe to a URL shows the board's dates
and fetches them again later, but changes made in the calendar do not come
back to WeKan. The import adds cards to a list of an existing board; it does
not create a board, and it has no entry on the import page.

## How to import

The `.ics` import is available through the REST API and `api.py`, not on the
import page.

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

## How to import many boards at once

There is nothing to import as boards: an `.ics` file adds cards to a list of
a board that already exists. To import several files, run `importics` once for
each.

## How to export

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

## How to export all boards at once

This is not available for iCalendar. The feed is a calendar of one board, so
**Export all boards** does not offer it. Subscribe to each board's feed.

## Format details

From the [format coverage](../Format-Coverage.md) audit:

- **Authoritative shape:** RFC 5545 plus RFC 7986 additive properties.
- **Required import coverage:** unfolded and escaped UTF-8 content lines, UID
  identity, recurrence, exclusions, timezone, start, end and duration, status,
  summary, description, URL, attendees and categories.

The current import reads much less than that list. What the code does:

### Import (`server/lib/icsImport.js`)

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

### Export (`models/lib/icalExport.js`)

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

## What is kept

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

## What is not kept

The import does not read, and does not report: time zones, recurrence
(`RRULE`, `RDATE`, `EXDATE`), `DURATION`, `STATUS`, `LOCATION`, `URL`,
attendees, organizer, categories, alarms, and to-dos (`VTODO`). Importing the
same file twice creates the cards twice.

The export leaves out archived cards, cards without dates, labels, members,
checklists and every other card field. Changes made in the calendar app are
not sent back to WeKan; full two-way CalDAV sync is not provided.

## REST API

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

## How it is built and tested

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

## Sources

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
