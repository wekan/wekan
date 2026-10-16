# Calendar Mode

Board header → **Board View** → **Calendar Mode** (#3194, the calendar of
Trello). Each card sits on the day of its **due date**, with its labels and its
whole title, in a month or a week grid. It is read-only: to change a date, open
the card. For dragging cards to new dates, and for the start, end and received
dates, use the [Calendar](Calendar.md) view.

A site admin can turn the calendar views off in Admin Panel / Settings /
Visibility / Features ("Calendar views").

## What it shows

- Cards that are not archived and have a due date in the shown range,
  narrowed by the [sidebar Filter](../../Board-Sidebar/Filter/README.md). The
  time of day is not shown.
- Within a day: in list order, then card order, then by title.
- Each card has its own colour as a border and its labels with their names.
- The week starts on your own start day of the week (Member Settings), Monday by
  default. Weekday names and the title are in your language.

## Controls

- **Today**, **Previous**, **Next** - by a month or by a week.
- **Week** / **Month** - remembered in this browser.
- Click a card to open it.

## Implementation

`client/components/boards/calendarModeView.jade`, `.js` and `.css`;
`models/lib/calendarMode.js` (the grid and the order within a day) and
`models/lib/calendarFilter.js` (the card selector). Tests:
`tests/calendarMode.test.cjs`, `tests/calendarFilter.test.cjs`,
`tests/playwright/specs/calendar-mode.e2e.js`.
