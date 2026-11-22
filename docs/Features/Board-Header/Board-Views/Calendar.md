# Calendar

## What it is

The Calendar view shows a board's cards on a calendar by their dates: a card
with a start and an end date as a bar from one to the other, and its received,
due and end dates as their own entries. Dated checklist items are shown too.
You can drag a card to give it a new due date, stretch it to change its end
date, and click a day to create a new card due on that day. It is drawn with
the [FullCalendar](https://fullcalendar.io/docs) library.

## Read more

- [Calendar](https://en.wikipedia.org/wiki/Calendar),
  [Week](https://en.wikipedia.org/wiki/Week) and
  [ISO week date](https://en.wikipedia.org/wiki/ISO_week_date) on Wikipedia -
  the grid, the week and the week numbers shown in it.
- [FullCalendar documentation](https://fullcalendar.io/docs), the library that
  draws the view, and its
  [selectable](https://fullcalendar.io/docs/selectable) option, which is how a
  click on a day creates a card.
- [Calendar Mode](Calendar-Mode.md), Trello's kind of calendar, read-only;
  [Multi Board Calendar](Multi-Board-Calendar.md), the cards of many boards.
- [Calendar systems and accessible date/time selection](../../Member-Settings/Date/Calendar-Systems.md).

## How to use it

Choose the calendar in Member Settings. See
[calendar systems and accessible date/time selection](../../Member-Settings/Date/Calendar-Systems.md).

**Open the Calendar view.**

1. Open a board.
2. Click **Board View** in the header bar → **Calendar** (in the **Calendar and
   time** group).
3. The month is shown. The buttons on the right of the title are **Today**,
   **Previous**, **Next**, then **Day** / **List**, **Week** / **List** and
   **Month** / **List**: a grid or a list for a day, a week or a month.

### Create card

At Calendar View, on Month when you click a date it will ask you if you want to
create a new card and give its name. It then creates at first swimlane and at
first list the card with the due date that it got from the date you clicked.

1. Click a day (on **Week** or **Day**, drag over the hours you mean).
2. The **Create new card** dialog opens. Type the card's title.
3. Click **Add Card**. The card is created in the board's first swimlane and
   first list, due at the start of what you selected.
4. When the board has no swimlane or no list yet, one called *Default* is
   created first.

Video demonstration:

https://user-images.githubusercontent.com/70445835/184324324-b4bd466e-6873-4eef-8ca5-b6e4d9f95ac5.mp4

**Change a card's dates.**

1. Drag a card's entry to another time: its **due date** becomes the new start.
   Dropping it on an all-day slot is reverted.
2. Drag the end of a card's bar: its **end date** becomes the new end.
3. Click a card to open it beside the calendar.

The [sidebar Filter](../../Board-Sidebar/Filter/README.md) applies: only the
cards it lets through are shown, and the calendar redraws when the filter
changes.

## How the numbers are calculated

- **Which cards** (selectors in
  [models/lib/calendarFilter.js](../../../../models/lib/calendarFilter.js),
  combined with the Filter): cards of this board that are not archived and
  - for the bar: whose start and end overlap the shown range - the start is
    before the range and the end in it, the start in it and the end after it,
    or both inside it;
  - for **Received**, **Due** and **End**: whose `receivedAt`, `dueAt` or
    `endAt` is within the shown range, both ends included.
- **Length of an entry**: the bar runs from `startAt` to `endAt`. Received, Due
  and End entries, and a checklist item's entry, last one hour
  (`date + 36e5` milliseconds), and are titled *card title Received*, *Due* or
  *End*. An entry is drawn as all-day when its end is exactly 24 hours after its
  start.
- **Order**: the entries are sorted by their id before they are drawn.
- **The week**: it starts on your own **start day of week** from Member
  Settings, Monday by default or when the setting is not a valid day
  (`toFullCalendarFirstDay`). The **week numbers** are counted from that same
  first day (`weekNumberCalculation` in
  [models/lib/calendarBaseOptions.js](../../../../models/lib/calendarBaseOptions.js),
  #4946), so the number matches how the week is laid out.
- **Business hours**: Monday to Friday, 8:00 to 18:00, are shaded as working
  time.
- **Times** are shown with a full am/pm marker (`hour: 'numeric', minute:
  '2-digit', meridiem: 'short'`).

## How it works in WeKan

- **Template**: `calendarView` in
  [client/components/boards/boardBody.jade](../../../../client/components/boards/boardBody.jade),
  styles in
  [client/components/boards/calendarView.css](../../../../client/components/boards/calendarView.css).
- **Options and events**: `calendarOptions` in
  [client/components/boards/boardBody.js](../../../../client/components/boards/boardBody.js)
  adds to the shared `calendarBaseOptions()` (also used by Multi Board Calendar):
  `editable`, `selectable`, `navLinks`, `businessHours`, and the `events()`,
  `eventDrop` (calls `card.setDue()`), `eventResize` (calls `card.setEnd()`) and
  `select` (the Create card dialog) callbacks. The cards come from
  `cardsInInterval`, `cardsReceivedInBetween`, `cardsDueInBetween` and
  `cardsEndInBetween` in [models/boards.js](../../../../models/boards.js);
  dated checklist items from `datedChecklistItems()` in
  [models/lib/checklistItemSchedule.js](../../../../models/lib/checklistItemSchedule.js)
  (their entries cannot be dragged).
- **Creating a card** calls the `createCardWithDueDate` method in
  [server/models/cards.js](../../../../server/models/cards.js), which requires a
  signed-in board member with write access and a list of that board that does
  not refuse the member's role a new card.
- **Turning it off**: a site admin can hide the calendar views in Admin Panel /
  Settings / Features (**Calendar views**); a board admin can hide it for a
  board in [Board Settings / Board View](../../Board-Sidebar/Board-Settings/Board-View.md).
- **Tests**: [tests/calendarFilter.test.cjs](../../../../tests/calendarFilter.test.cjs),
  [tests/calendarBaseOptions.test.cjs](../../../../tests/calendarBaseOptions.test.cjs),
  [tests/calendarToolbarLayout.test.cjs](../../../../tests/calendarToolbarLayout.test.cjs),
  [tests/calendarTodayMarker.test.cjs](../../../../tests/calendarTodayMarker.test.cjs),
  [tests/calendarMonthWeekAlignment.test.cjs](../../../../tests/calendarMonthWeekAlignment.test.cjs),
  [tests/calendarDateDisplay.test.cjs](../../../../tests/calendarDateDisplay.test.cjs),
  and the browser specs
  [tests/playwright/specs/issue-calendar-filter.e2e.js](../../../../tests/playwright/specs/issue-calendar-filter.e2e.js),
  [tests/playwright/specs/calendar-today-marker.e2e.js](../../../../tests/playwright/specs/calendar-today-marker.e2e.js)
  and
  [tests/playwright/specs/44-calendar-date-display.e2e.js](../../../../tests/playwright/specs/44-calendar-date-display.e2e.js).

More about the design:

- How it works https://github.com/wekan/wekan/issues/2687#issuecomment-1545235649
- Fix for Calendar View Create Card https://github.com/wekan/wekan/pull/5019
- Calendar view logic https://github.com/wekan/wekan/issues/4511

## <a name="Time"></a>Time

* [Due Date](../../Cards/Dates/Due-Date.md)
* [Day of week start](../../Member-Settings/Date/Day-of-week-start.md)

## What features are missing

* [Calendar issues](https://github.com/wekan/wekan/issues?q=is%3Aissue+is%3Aopen+calendar+label%3AFeature%3ACalendar-view)
* [Time Tracking](../../Cards/Time-Tracking.md)
* [Gantt Chart](Gantt.md)

## Commits

 - [Archived cards are left out of every calendar](https://github.com/wekan/wekan/commit/0fff9d4828660666c1af0c9ffd48c7eea8aee1bd)
 - [The Calendar and Multi Board Calendar views share their calendar options](https://github.com/wekan/wekan/commit/5908fab5dea018cebc4b39c3a69c7d608781cb28)
 - [Dated checklist items show in the calendar](https://github.com/wekan/wekan/commit/7ca1489279e35b85e07a6b2d5420694f6b673d47)
 - [Today is marked in the Calendar view](https://github.com/wekan/wekan/commit/519fb2c105f8a2b6e41d6125c3fe28501acfb360)
 - [All four card dates are shown, with drag editing](https://github.com/wekan/wekan/commit/17aa92e90aa97bee086f2efb6ecd6e50d7ab5ef9)
 - [All toolbar buttons move to the right of the title](https://github.com/wekan/wekan/commit/e0e03e20033d433443e13c911d64755a90f02d99)
 - [Week numbers respect the start day of week](https://github.com/wekan/wekan/commit/75df523ef0324dd018955c82370df97fb3a3b8cc)
 - [The Calendar view honours the board Filter](https://github.com/wekan/wekan/commit/b0da9097c18dea12ccce8dec6de8a5cf2519551a)
 - [The Calendar view respects the start-day-of-week setting](https://github.com/wekan/wekan/commit/7eec78c0409fdf5b5eeef0b1088894353bc892aa)
 - [Toolbar labels and the create-card dialog styled consistently](https://github.com/wekan/wekan/commit/7b443b7bfc03641a3c64274b7c42f58af839d9f6)
 - [Create a card from the Calendar view](https://github.com/wekan/wekan/commit/0bd8b298d758b7754abdef0323e014f6c803175b)
 - [Moving a card in the calendar changes its due date](https://github.com/wekan/wekan/commit/6b4613d3ed6020b4072fe6540da5fdb0b2e85ac7)
 - [Due dates are shown in the Calendar view](https://github.com/wekan/wekan/commit/62b72a03c4889377169411c8cdbf372c71cac1af)
 - [Only the current board's cards are shown](https://github.com/wekan/wekan/commit/787941857d14fb63d4a292e4452c08d3fec1036d)
