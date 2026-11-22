# Calendar Mode

## What it is

Board header → **Board View** → **Calendar Mode** (#3194, the calendar of
Trello). Each card sits on the day of its **due date**, with its labels and its
whole title, in a month or a week grid. It is read-only: to change a date, open
the card. For dragging cards to new dates, and for the start, end and received
dates, use the [Calendar](Calendar.md) view.

## Read more

- [Calendar](https://en.wikipedia.org/wiki/Calendar) and
  [Week](https://en.wikipedia.org/wiki/Week) on Wikipedia - the month and week
  grids.
- [Trello](https://en.wikipedia.org/wiki/Trello) on Wikipedia and Trello's own
  [Calendar view](https://support.atlassian.com/trello/docs/calendar-view/),
  which this view follows ([#3194](https://github.com/wekan/wekan/issues/3194)).
- [Calendar](Calendar.md), [Multi Board Calendar](Multi-Board-Calendar.md) and
  [Due Date](../../Cards/Dates/Due-Date.md).

## How to use it

1. Open a board.
2. Click **Board View** in the header bar → **Calendar Mode** (in the
   **Calendar and time** group).
3. The current month is shown, each card on the day it is due.
4. Use **Today**, **Previous** and **Next** to move by a month, or by a week
   in the week grid.
5. Click **Week** or **Month** to switch the grid. The choice is remembered in
   this browser.
6. Click a card to open it.

A site admin can turn the calendar views off in Admin Panel / Settings /
Features ("Calendar views").

### What it shows

- Cards that are not archived and have a due date in the shown range,
  narrowed by the [sidebar Filter](../../Board-Sidebar/Filter/README.md). The
  time of day is not shown.
- Within a day: in list order, then card order, then by title.
- Each card has its own colour as a border and its labels with their names.
- The week starts on your own start day of the week (Member Settings), Monday by
  default. Weekday names and the title are in your language.
- Days of the month before and after the shown month are drawn dimmed, and
  today is marked.

### Controls

- **Today**, **Previous**, **Next** - by a month or by a week.
- **Week** / **Month** - remembered in this browser.
- Click a card to open it.

## How the numbers are calculated

All in [models/lib/calendarMode.js](../../../../models/lib/calendarMode.js):

- **The day of a card** is the local calendar day of its `dueAt`, as
  `YYYY-MM-DD` (`dayKey`); a card without a valid due date is not shown.
- **The month grid** (`calendarModeDays`) is made of whole weeks: it starts on
  the first day of the week that holds the 1st of the month and adds weeks of 7
  days until the next month begins, at most 6 weeks. **The week grid** is the 7
  days from the start of the week that holds the shown day.
- **The start of a week** (`startOfWeek`) goes back from the day to your first
  day of the week (0 = Sunday … 6 = Saturday); a missing or invalid setting is
  Monday (1).
- **Previous / Next** (`shiftAnchor`): a month moves to the 1st of the previous
  or next month; a week moves by 7 days. **Today** goes back to today.
- **Order within a day** (`cardsByDueDay`): by the `sort` of the card's list,
  then the card's own `sort`, then the title in alphabetical order. A card whose
  list or sort is unknown goes last.
- **The title** is the month and year (`Intl.DateTimeFormat`, `month: 'long'`),
  or in a week the first and the last day of it, in your language.

## How it works in WeKan

`client/components/boards/calendarModeView.jade`, `.js` and `.css`;
`models/lib/calendarMode.js` (the grid and the order within a day) and
`models/lib/calendarFilter.js` (the card selector). Tests:
`tests/calendarMode.test.cjs`, `tests/calendarFilter.test.cjs`,
`tests/playwright/specs/calendar-mode.e2e.js`.

- **Template**: `calendarModeView` in
  [client/components/boards/calendarModeView.jade](../../../../client/components/boards/calendarModeView.jade):
  a toolbar, a `role="grid"` of weekday headers and weeks, and one link per
  card.
- **Logic**:
  [client/components/boards/calendarModeView.js](../../../../client/components/boards/calendarModeView.js)
  keeps the shown day and the range in `ReactiveVar`s, stores the range in
  `localStorage` as `calendarModeRange`, and reads the cards once per render
  with `board.cardsDueInBetween()` (selector `cardsDueInBetweenSelector` in
  [models/lib/calendarFilter.js](../../../../models/lib/calendarFilter.js),
  combined with the active Filter).
- **No writes**: the view changes no data; a click opens the card's own route,
  and the card opens beside the calendar.
- **Tests**: [tests/calendarMode.test.cjs](../../../../tests/calendarMode.test.cjs),
  [tests/calendarFilter.test.cjs](../../../../tests/calendarFilter.test.cjs) and
  [tests/playwright/specs/calendar-mode.e2e.js](../../../../tests/playwright/specs/calendar-mode.e2e.js).

## Commits

 - [Archived cards are left out of every calendar](https://github.com/wekan/wekan/commit/0fff9d4828660666c1af0c9ffd48c7eea8aee1bd)
 - [Add Calendar Mode to the Board View menu, below Calendar](https://github.com/wekan/wekan/commit/f133ddbba163dacb53077457a44428d3a8e81796)
