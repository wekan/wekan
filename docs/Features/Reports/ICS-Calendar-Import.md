# ICS / Google Calendar Import (MVP, import-only)

Issue: [#6323](https://github.com/wekan/wekan/issues/6323)

This feature lets you import an iCalendar (`.ics`) file — for example a Google
Calendar export — into a WeKan board. Each calendar event (`VEVENT`) becomes a
card whose **start** and **due** dates are populated, so the imported events
show up on the board's **Calendar** and **Gantt** views.

> **Scope:** This is the MVP and is **import-only** (one direction:
> `.ics` file → WeKan cards). **Two-way Google Calendar sync is NOT included.**
> For the read-only export direction (WeKan → an iCal feed that Google Calendar
> can subscribe to), see the separate
> [`wekan-ical-server`](https://github.com/wekan/wekan-ical-server) project.

## What gets imported

For each `VEVENT` block:

| iCalendar property | WeKan card field |
|--------------------|------------------|
| `SUMMARY`          | `title`          |
| `DESCRIPTION`      | `description`    |
| `DTSTART`          | `startAt`        |
| `DTEND`            | `dueAt` (and `endAt` semantics) |
| `UID`              | kept on the parsed event (for de-dup / future sync) |

If an event has no `DTEND`, `dueAt` falls back to `DTSTART` so single-point
events still render on the calendar.

## The parser

The core is a small, **dependency-free, pure** parser at
[`server/lib/icsImport.js`](../../../server/lib/icsImport.js). It uses only string
operations and regexes (no npm packages), which keeps it easy to unit-test and
safe to reuse.

It correctly handles:

- Multiple `VEVENT` blocks in one file.
- **Line unfolding** (RFC 5545): physical lines beginning with a space or tab
  are continuations of the previous line.
- **Date** values `YYYYMMDD` (all-day events) and **date-time** values
  `YYYYMMDDTHHMMSSZ`. Both are interpreted as UTC for deterministic,
  timezone-independent parsing.
- **Escaped TEXT** values: `\,` → comma, `\;` → semicolon, `\n` / `\N` →
  newline, `\\` → backslash.
- Properties with parameters, e.g. `DTSTART;VALUE=DATE:20261225`.
- Empty or garbage input — returns an empty array, never throws.

### Public functions

```js
import { parseIcs, icsEventToCard, icsToCards } from '/server/lib/icsImport';

// 1. Parse raw .ics text into plain event objects.
const events = parseIcs(icsText);
// => [{ summary, description, start: Date|null, end: Date|null, uid }, ...]

// 2. Map one event to a WeKan card-shaped object.
const card = icsEventToCard(events[0], { boardId, listId, swimlaneId });
// => { title, description, startAt, dueAt, boardId, listId, swimlaneId }

// 3. Do both in one step.
const cards = icsToCards(icsText, { boardId, listId, swimlaneId });
```

`icsToCards` does not touch the database — it only produces card-shaped plain
objects. Persisting them is the caller's responsibility (see below).

## Creating cards: the Meteor method

A thin server method wires the parser into the existing Cards API:
[`server/methods/icsImport.js`](../../../server/methods/icsImport.js), registered
in `server/imports.js`.

```js
// Client (or server) call:
Meteor.call(
  'importIcsToBoard',
  boardId,
  listId,
  swimlaneId,
  icsFileText,            // the raw contents of the uploaded .ics file
  (err, res) => {
    // res => { created: <number>, cardIds: [...] }
  },
);
```

The method:

- Requires a logged-in user.
- Verifies the user can see the board, is a **member** (not read-only).
- Verifies the target `listId` and `swimlaneId` belong to the board
  (no cross-board writes).
- Creates one card per event with `startAt` / `dueAt` set.

To wire a full upload UI, read the selected `.ics` file's text on the client
(e.g. with `FileReader`) and pass it as the `icsText` argument. A dedicated
upload form in the board import dialog is **deferred** (secondary to the parser
MVP).

## Tests

Unit tests (mocha + chai, self-contained) are at
[`server/lib/tests/icsImport.tests.js`](../../../server/lib/tests/icsImport.tests.js)
and cover: single and multiple events, all-day vs date-time forms, folded
lines, escaped text, `icsEventToCard` field mapping and the `dueAt` → `start`
fallback, and empty/garbage input.

Run with:

```sh
meteor test --once --driver-package meteortesting:mocha
```

## Not included (deferred)

- **Two-way Google Calendar sync** (live updates in either direction).
- A board-import upload UI/dialog (call the method or `icsToCards` directly for
  now).
- Recurrence rules (`RRULE`), attendees, alarms, and timezone (`VTIMEZONE` /
  `TZID`) conversion — date-times are treated as UTC.
