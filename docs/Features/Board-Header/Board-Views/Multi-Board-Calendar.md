# Multi Board Calendar

## What it is

A Planyway-style calendar that shows the received/start/due/end dates of
cards across **every board you are a member of**, not just the board you
currently have open - one place to see everything due this week regardless
of which board it lives on. Each calendar entry is prefixed with its board's
title so cards from different boards stay distinguishable. See
[#2469](https://github.com/wekan/wekan/issues/2469).

## Read more

- [Calendaring software](https://en.wikipedia.org/wiki/Calendaring_software)
  at Wikipedia.
- [FullCalendar](https://fullcalendar.io/) - the calendar library both WeKan
  calendar views draw with.
- [Planyway](https://planyway.com/) - the Trello calendar the request was
  modelled on.
- WeKan: [Calendar](Calendar.md) (one board),
  [Bigboard](Bigboard.md) (the same board selection),
  [Due Date](../../Cards/Dates/Due-Date.md),
  [Filter](../../Board-Sidebar/Filter/README.md).

## How to use it

**Where to find it.** **Board View menu (top bar) → Multi Board Calendar**, from
inside any board, in the menu's **Calendar and time** group.

```
┌─ Board View ▾ ────────────┐
│ ...  Calendar             │
│ ▸ Multi Board Calendar    │  <- here
│ ...                       │
└──────────────────────────────┘

┌ Multi Board Calendar ─────────── < September 2026 > ──┐
│ Mon   Tue   Wed   Thu   Fri   Sat   Sun                 │
│  1     2     3     4     5     6     7                  │
│              [Alpha] Ship v2                             │
│  8     9    10    11    12    13    14                  │
│       [Beta] Review   [Alpha] Docs Due                   │
└───────────────────────────────────────────────────────────┘
```

**Steps to use it:**

1. Open any board you belong to.
2. Click **Board View** (top bar) → **Multi Board Calendar**. It says
   "Loading, please wait." until the cards of every board are loaded.
3. The calendar shows the cards with a date, across all boards you are a
   member of, each labelled `[Board title] Card title`. A Received, Due or
   End date gets its own entry with the date's name after the title, for
   example `[Alpha] Docs Due`.
4. Use the buttons at the right of the title: **Today**, **Previous** /
   **Next**, and the Day, Week and Month views, each also as a list.
5. Click an entry to open that card directly (works across boards).
6. An active sidebar [Filter](../../Board-Sidebar/Filter/README.md) narrows
   the calendar on every board.

**Prerequisites.** Cards need a Received/Start/Due/End date set to appear at
all - see [Due Date](../../Cards/Dates/Due-Date.md). Only boards you are a
member of are included, same as [Bigboard](Bigboard.md), which this view's
board-lookup logic is shared with. Entries cannot be dragged here: change a
card's dates in its own board's [Calendar](Calendar.md) or on the card. A site
admin can turn the calendar views off with "Calendar views" in
[Admin Panel → Settings → Features](../../Admin-Panel/Settings/Features.md).

## How the numbers are calculated

- **Which boards**
  ([client/components/boards/multiboardCalendarView.js](../../../../client/components/boards/multiboardCalendarView.js)):
  boards that are not archived, are of type `board` (not templates), list
  you in their members, and whose title is not a helper board's `^...^`
  ([models/lib/helperBoards.js](../../../../models/lib/helperBoards.js)).
- **Which cards** ([models/lib/calendarFilter.js](../../../../models/lib/calendarFilter.js)),
  for the visible range [start, end], never archived cards:
  - a Start-End entry for a card whose Start-End span overlaps the range
    (starts before and runs at its start, starts before and runs at its end,
    or lies inside it);
  - a Received entry when Received is in the range, a Due entry when Due is
    in the range and an End entry when End is in the range, each one hour
    long from that date.
- **All-day**: an entry is all-day when it is exactly 24 hours long.
- **Order**: by entry id (board id, card id, then the order they were made).
- **Week numbers** in the first column count weeks from the week that holds
  1 January, with weeks starting on the day of your "start day of week"
  setting: `floor((days from that first week's start) / 7) + 1`
  ([models/lib/weekStart.js](../../../../models/lib/weekStart.js)).
- **Colour**: an entry has the card's colour; Received, Due and End entries
  get their own class.

## How it works in WeKan

- **View**:
  [client/components/boards/multiboardCalendarView.jade](../../../../client/components/boards/multiboardCalendarView.jade)
  and [.js](../../../../client/components/boards/multiboardCalendarView.js).
  It subscribes to the `board` publication of every one of your boards, and
  builds the FullCalendar events from each board's `cardsInInterval`,
  `cardsReceivedInBetween`, `cardsDueInBetween` and `cardsEndInBetween`
  ([models/boards.js](../../../../models/boards.js)).
- **Shared options**: the toolbar, week numbers, time format, first day of
  the week, translation and right-to-left direction come from
  [models/lib/calendarBaseOptions.js](../../../../models/lib/calendarBaseOptions.js),
  the same as the single-board Calendar; this view sets `editable`,
  `selectable` and `navLinks` off.
- **Permissions**: only boards whose publication you may receive are shown,
  so the board's normal visibility and role rules apply.
- **Menu and feature switch**: `board-view-multiboard-cal` in
  [models/lib/boardViewSettings.js](../../../../models/lib/boardViewSettings.js),
  feature `views-calendar` in
  [models/lib/instanceFeatures.js](../../../../models/lib/instanceFeatures.js).
- **Tests**:
  [tests/multiboardCalendarRuntime.test.cjs](../../../../tests/multiboardCalendarRuntime.test.cjs),
  [tests/calendarBaseOptions.test.cjs](../../../../tests/calendarBaseOptions.test.cjs),
  [tests/calendarFilter.test.cjs](../../../../tests/calendarFilter.test.cjs),
  [tests/boardViewMenu.test.cjs](../../../../tests/boardViewMenu.test.cjs).

## Commits

 - [The Calendar and Multi Board Calendar share their calendar options](https://github.com/wekan/wekan/commit/5908fab5dea018cebc4b39c3a69c7d608781cb28)
 - [Optional features: a site admin can turn the calendar views off](https://github.com/wekan/wekan/commit/18d57b2b8f789b11409afbd485cff139adeb3095)
 - [FullCalendar 5 direction option for right-to-left languages](https://github.com/wekan/wekan/commit/ef12548a9820dbe75df444a6f65f8bc953c2b3cc)
 - [The filter and routing APIs imported in the multi-board calendar](https://github.com/wekan/wekan/commit/8c96ac84f4d7450a8affffbc383c1387fd89c7bf)
 - [The selected month view applied to the multi-board calendar](https://github.com/wekan/wekan/commit/37043149f51022b5d7796ceee0fdff016af139a2)
 - [Member-selected calendars and accessible date controls](https://github.com/wekan/wekan/commit/5057a0a2c1079780f6560369e989d0022c54e53a)
 - [Missing TAPi18n import fixed](https://github.com/wekan/wekan/commit/48106ee17e67f400cb47e37c2a97711a37c1e463)
 - [The Multi Board Calendar board view added](https://github.com/wekan/wekan/commit/0c15b56f6e3db5b52e43ceaf238dfac30ab7fb6d)
