# Gantt chart

## What it is

A Gantt chart draws work on a calendar: each card is a row, and its dates are
marked on the days and weeks they fall on, so you see at a glance what starts,
what is due and what overlaps. WeKan has three Gantt board views. **Gantt** is
WeKan's own table-style chart with one icon per card date. **Frappe Gantt** and
**DHTMLX Gantt** draw each card as a bar that a member with write access can
drag to reschedule the card.

This new Gantt feature was added to MIT WeKan 2025-12-22 at
https://github.com/wekan/wekan

## Read more

- [Gantt chart](https://en.wikipedia.org/wiki/Gantt_chart) at Wikipedia.
- [ISO week date](https://en.wikipedia.org/wiki/ISO_week_date) at Wikipedia -
  the week numbering the table-style Gantt uses.
- [Frappe Gantt](https://github.com/frappe/gantt) (MIT, zero runtime
  dependencies) - the library of the Frappe Gantt view, also at
  [frappe.io/gantt](https://frappe.io/gantt).
- [DHTMLX Gantt Community Edition](https://github.com/DHTMLX/gantt) (MIT since
  v10, zero runtime dependencies) - the library of the DHTMLX Gantt view.
- [Old WeKan Gantt GPL](https://github.com/wekan/wekan-gantt-gpl) - the
  previous, deprecated GPLv2 Gantt (see below).
- WeKan: [Calendar](Calendar.md), [Roadmap](Roadmap.md) (a Frappe Gantt per
  custom field value), [Due Date](../../Cards/Dates/Due-Date.md),
  [Checklists](../../Cards/Checklists.md),
  [Board report charts](Charts/Board-Report-Charts.md) (the same Export popup).

## How to use it

**Where to find it.** At "All Boards" page, click board to open one board view.
There, the Gantt views are in the **Board View** menu (the button in the board
header that shows the current view's name and a caret), in the group
**Calendar and time**: **Gantt**, **Frappe Gantt** and **DHTMLX Gantt**.

```
┌─ Board View ▾ ──────────────────────┐
│ ...                                  │
│ ▸ Gantt              <- here         │
│   Frappe Gantt                       │
│   DHTMLX Gantt                       │
│ ...                                  │
└───────────────────────────────────────┘

┌ Gantt ──────────────────────────────────────────────┐
│ Task            | wk1 | wk2 | wk3 | wk4 | ...        │
│ Card A          |  ▬▬▬▬▬▬  🔵🟢🟡🔴 (date icons)      │
│ Card B          |       ▬▬▬▬▬▬▬                       │
└─────────────────────────────────────────────────────────┘
```

**The table-style Gantt:**

1. Open a board that has cards with at least one of Received/Start/Due/End
   dates set.
2. Click **Board View** (top bar) → **Gantt**.
3. Gantt shows all dates, according to selected date format at opened card:
   Received Start Due End. Gantt dates are shown for every week where exist
   dates at the current opened board: one table per week, headed
   "Task week <number>" and the seven days with their dates.
4. Click a task's name to open its card (it opens above the chart; close it
   with the card's close button).
5. Click any of the four date icons on a row (Received/Start/Due/End) to
   change that date directly from the chart - this table view has no
   drag-to-reschedule, only the click-a-date-icon editor.
6. **Export** at the top exports the chart as PDF or Excel, through the same
   export popup as the [report charts](Charts/Board-Report-Charts.md).

**Two additional Gantt engines: Frappe and DHTMLX.** Besides the built-in
table-style Gantt above, the same **Board View** menu offers two more Gantt
renderers built on third-party libraries. All three read the same four card
dates (Received/Start/Due/End) from the same board's cards; what differs is the
library and, importantly, whether you can **drag** a bar to reschedule a card
instead of only clicking a date icon.

```
┌─ Board View ▾ ──────────────────────┐
│ ▸ Gantt                              │
│ ▸ Frappe Gantt        <- here        │
│ ▸ DHTMLX Gantt        <- or here     │
└───────────────────────────────────────┘
```

- **Frappe Gantt** uses [frappe-gantt](https://github.com/frappe/gantt). Each
  card is drawn as one draggable bar spanning its Start-Due (or the fallback
  pair, see the numbers below); the bar's left/right edges can be **dragged
  to reschedule the card** when you have write access to the board - dragging
  is disabled (`readonly_dates`) for a member without write permission.
  Clicking a bar opens the card. A dropdown switches the time scale: Hour,
  Quarter Day, Half Day, Day, Week (the default), Month and Year, and a
  Today button scrolls to today.
- **DHTMLX Gantt** uses [dhtmlx-gantt Community
  Edition](https://github.com/DHTMLX/gantt). Same idea - one draggable bar per
  card, drag-to-reschedule gated on write access (`gantt.config.readonly`) -
  but rendered by a different library with its own look (a classic
  grid+timeline split) and its own drag/hover interaction feel. Hovering a bar
  shows a tooltip with all four dates. Its double-click edit box is turned
  off: cards are edited on the card itself.

**Steps to use Frappe or DHTMLX Gantt:**

1. Open a board that has cards with a Start (or Received) date, and
   preferably a Due (or End) date.
2. Click **Board View** (top bar) → **Frappe Gantt** or **DHTMLX Gantt**.
3. Click a card's bar to open its card. Frappe Gantt's popup and the DHTMLX
   tooltip list every one of the four dates that is set.
4. If you have write access to the board, drag a bar or its edge to change
   that card's dates directly on the chart; the change is saved back to
   whichever of the four dates that edge represents.
5. Without write access the chart is still readable, just not draggable.
6. A board with nothing to draw shows "No Cards Found".

**Prerequisites:**

- The table-style Gantt shows a card that has at least one of
  Received/Start/Due/End set; a card with none of the four is skipped.
- Frappe Gantt and DHTMLX Gantt draw a card only when it has a **Start** or a
  **Received** date: a card with only a Due or End date has no bar there.
- Checklist items with a due date are drawn too, in Frappe Gantt and DHTMLX
  Gantt, as "card: item" (see [Checklists](../../Cards/Checklists.md)).
- Dragging to reschedule (Frappe/DHTMLX only) requires board write access.
- A site admin can turn all three off with "Gantt views" in
  [Admin Panel → Settings → Features](../../Admin-Panel/Settings/Features.md),
  and a board admin can hide each in
  [Board Settings → Board View](../../Board-Sidebar/Board-Settings/Board-View.md).

## How the numbers are calculated

**Table-style Gantt**
([client/components/gantt/gantt.js](../../../../client/components/gantt/gantt.js)):

- **Weeks.** For every card date (Received, Start, Due, End) the ISO 8601 week
  is computed: the date is moved to the Thursday of its week, and the week
  number is `ceil(((that Thursday - 1 January of its year) / 1 day + 1) / 7)`;
  the year is the Thursday's year. Each distinct year-week gets one table,
  sorted by the Monday it starts on. A week with no card dates gets no table.
- **Days.** Seven columns, Monday to Sunday, from that Monday.
- **Rows.** A card is a row of a week when any of its four dates falls in that
  ISO week.
- **Icons.** A cell shows the icon of the date that falls on that day:
  Received (inbox), Start (rocket), Due (clock), End (chequered flag). When
  two dates fall on the same day, only the first in that order is shown.
  Today's column and Saturdays and Sundays get their own highlight.

**Frappe Gantt and DHTMLX Gantt**
([client/components/gantt/frappeGantt.js](../../../../client/components/gantt/frappeGantt.js),
[client/components/gantt/dhtmlxGantt.js](../../../../client/components/gantt/dhtmlxGantt.js)):

- **Bar start** = the card's Start, or its Received when it has no Start. A
  card with neither is left out.
- **Bar end** = the card's Due, or its End when it has no Due. When there is
  no end, or the end is not after the start, the bar ends one day after the
  start.
- **DHTMLX duration** = `max(1, round((end - start) / 86 400 000 ms))` whole
  days.
- **Progress** = 100 % (DHTMLX: 1) when the card has an End date, otherwise 0.
- **Overdue** = the card has a Due date, no End date, and the Due date is
  before today; the bar is drawn red (Frappe: class `gantt-task-overdue`,
  DHTMLX: `#e74c3c`).
- **Checklist items**: an item with a due date on a card that is not archived
  is a one-day bar ending on its due date, done (100 %) when the item is
  finished; DHTMLX draws them purple (`#8e44ad`)
  ([models/lib/checklistItemSchedule.js](../../../../models/lib/checklistItemSchedule.js)).
- **Frappe sizes**: bar height 30 px, header heights 45 px and 30 px, each
  multiplied by the member's font size setting so the 150 % preset still fits.
- **Dragging** writes the start edge to Start (or Received, when the bar
  started from Received) and the end edge to Due (or End, when the bar ended
  on End). A checklist item's bar writes only that item's due date.

**Export** ([server/lib/boardChartData.js](../../../../server/lib/boardChartData.js)
`'gantt'`, [models/lib/chartExportRows.js](../../../../models/lib/chartExportRows.js)):
one row per card of the board that has a Start, Due or End date or a creation
date, sorted by Start (or creation date when there is no Start), with the
columns Card, Start, Due and End; an empty date is written as `-`.

## How it works in WeKan

- **Views.** `client/components/gantt/`:
  [gantt.jade](../../../../client/components/gantt/gantt.jade) and
  [gantt.js](../../../../client/components/gantt/gantt.js) (table-style,
  date icons open the card's own Received/Start/Due/End date popups),
  [ganttCard.js](../../../../client/components/gantt/ganttCard.js) (the card
  opened above the chart),
  [frappeGantt.jade](../../../../client/components/gantt/frappeGantt.jade) /
  [frappeGantt.js](../../../../client/components/gantt/frappeGantt.js) and
  [dhtmlxGantt.jade](../../../../client/components/gantt/dhtmlxGantt.jade) /
  [dhtmlxGantt.js](../../../../client/components/gantt/dhtmlxGantt.js).
- **Libraries.** `frappe-gantt` and `dhtmlx-gantt` are npm dependencies in
  [package.json](../../../../package.json), loaded with a dynamic `import()`
  only when the view opens. frappe-gantt's CSS is vendored into
  `frappeGanttLib.css`, because its package exports no CSS subpath.
  `dhtmlx-gantt` is a JavaScript **singleton**, so switching away from this
  view and back destroys and recreates it rather than reusing an instance.
- **Data.** The cards of the open board from the browser's card collection;
  the writes are the card's own `setReceived`, `setStart`, `setDue` and
  `setEnd` (the same calls the Calendar view's drag uses) and a checklist
  item's `setDue`. Write access is checked with
  `Utils.currentUserCan('write', board)`.
- **Translations.** Month and weekday names come from
  [client/lib/ganttLocale.js](../../../../client/lib/ganttLocale.js); Frappe's
  own "Today" and "Mode" texts are re-translated by an observer. A member's
  non-Gregorian calendar system is used for the date labels.
- **Titles** are rendered by the shared title viewer, see
  [Board-view titles](Title-Rendering.md).
- **Menu and feature switch.**
  [models/lib/boardViewSettings.js](../../../../models/lib/boardViewSettings.js)
  (`board-view-gantt`, `board-view-gantt-frappe`, `board-view-gantt-dhtmlx`)
  and [models/lib/instanceFeatures.js](../../../../models/lib/instanceFeatures.js)
  (`views-gantt`).
- **Tests.**
  [tests/ganttDateVisibility.test.cjs](../../../../tests/ganttDateVisibility.test.cjs),
  [tests/ganttLocale.test.cjs](../../../../tests/ganttLocale.test.cjs),
  [tests/frappeChromeObserver.test.cjs](../../../../tests/frappeChromeObserver.test.cjs),
  [tests/checklistItemSchedule.test.cjs](../../../../tests/checklistItemSchedule.test.cjs),
  [tests/chartExportPopup.test.cjs](../../../../tests/chartExportPopup.test.cjs),
  [tests/boardViewMenu.test.cjs](../../../../tests/boardViewMenu.test.cjs).

## Old WeKan Gantt GPL

Previous GPLv2 WeKan Gantt is deprecated https://github.com/wekan/wekan-gantt-gpl

## UCS

[Gantt feature at UCS](../../../Platforms/FOSS/Container/Docker/UCS#gantt)

## Commits

 - [Dated checklist items in the Frappe and DHTMLX Gantt](https://github.com/wekan/wekan/commit/7ca1489279e35b85e07a6b2d5420694f6b673d47)
 - [Optional features: a site admin can turn the Gantt views off](https://github.com/wekan/wekan/commit/18d57b2b8f789b11409afbd485cff139adeb3095)
 - [Frappe Gantt's translation observer no longer rewrites identical labels](https://github.com/wekan/wekan/commit/670c20311309e4f9f0db4611d801e5fd4b9084ab)
 - [Security-aware title viewer for the Gantt task names](https://github.com/wekan/wekan/commit/457614a2acd21dae9bfff49dfc955695a2bc4ebb)
 - [Member-selected calendar systems in the Gantt date labels](https://github.com/wekan/wekan/commit/5057a0a2c1079780f6560369e989d0022c54e53a)
 - [One translated Export popup, and Frappe Gantt's own texts translated](https://github.com/wekan/wekan/commit/364903fd8e91f005d596b913c86db5333a11a3eb)
 - [Month and weekday names translated in Frappe and DHTMLX Gantt](https://github.com/wekan/wekan/commit/10c58867a63e755e11520c7245cc3fd88cfbfc3c)
 - [frappeGantt.js imports its own template](https://github.com/wekan/wekan/commit/ca9384c4a5d6d45adea8970895c15e9266f4a674)
 - [All four card dates shown, and drag to reschedule](https://github.com/wekan/wekan/commit/17aa92e90aa97bee086f2efb6ecd6e50d7ab5ef9)
 - [Frappe Gantt gets its own Board View entry, and DHTMLX Gantt is added](https://github.com/wekan/wekan/commit/e5e4c97154f5ecf940958504c65f1159cf0b7165)
 - [Build fix: Frappe Gantt's CSS vendored](https://github.com/wekan/wekan/commit/0782d8c666bbaad5b4e393f1fc194d48ff3b0dde)
 - [Frappe Gantt added below the table-style Gantt](https://github.com/wekan/wekan/commit/5d5317d968907edcaa06011dc8fd760a21121e4f)
 - [Gantt PDF and Excel export](https://github.com/wekan/wekan/commit/3abc1078c2f060cb3fa373f224c530013f0f38d1)
 - [Font Awesome icons for the Gantt date cells](https://github.com/wekan/wekan/commit/3487d2519daca7c030f22039dc53cd70d6856617)
 - [Gantt converted from JavaScript to Jade, part 2](https://github.com/wekan/wekan/commit/3af3c9a89d8a4020b6f1ccada7da2ccbec1a8562)
 - [Gantt converted from JavaScript to Jade](https://github.com/wekan/wekan/commit/2d3bef9033134c3b62cf22179bbee4b6fea81444)
 - [Gantt chart added to the board view menu](https://github.com/wekan/wekan/commit/f34e4c0e363e386dbcce8e6ee8933b2d50491c58)
