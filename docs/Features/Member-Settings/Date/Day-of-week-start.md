# Set day of the week start

## What it is

Countries start the week on different days: Monday in most of Europe, Sunday in
the United States, Saturday in some others. **Set day of the week start** chooses
which weekday is the first column of your calendars and where "this week" and
"next week" begin. It is a personal setting, saved to your profile; WeKan's
default is Monday.

## Read more

- [Week](https://en.wikipedia.org/wiki/Week) and
  [ISO week date](https://en.wikipedia.org/wiki/ISO_week_date) on Wikipedia.
- [Date settings](README.md) and [Calendar systems](Calendar-Systems.md).

## How to use it

1. Open your username at the top right, then **Date**.
2. Below Date Format, select **Set day of the week start**.
3. Choose the first weekday and click **Save**.

The Calendar view uses this preference for its first column. The same Save
button applies the date format and calendar-system choices in this popup.
See [Date settings](README.md) and [Calendar systems](Calendar-Systems.md).

## How the numbers are calculated

- The setting is a day index **0 to 6**: 0 = Sunday, 1 = Monday ...
  6 = Saturday, stored as `profile.startDayOfWeek`.
- **Default 1 (Monday):** `getStartDayOfWeek()` in
  [models/users.js](../../../../models/users.js) returns 1 when the field is
  unset.
- `toFullCalendarFirstDay()` in
  [client/lib/calendarFirstDay.js](../../../../client/lib/calendarFirstDay.js)
  passes a whole number 0..6 (also a numeric string) through unchanged, turns a
  day name such as `"sunday"` into its index, and turns anything else into 1,
  so a bad value can never break the calendar.
- The **Due this week / Due next week** filters count their week from this day
  too ([#4881](https://github.com/wekan/wekan/issues/4881)).

## How it works in WeKan

- **Control:** the `#start-day-of-week` select of `dateFormatEditor` (member
  scope) in
  [client/components/forms/dateFormatSettings.jade](../../../../client/components/forms/dateFormatSettings.jade);
  **Save** in
  [dateFormatSettings.js](../../../../client/components/forms/dateFormatSettings.js)
  calls `changeStartDayOfWeek(startDay)`. A signed-out visitor's choice is kept
  in `localStorage`.
- **Method:** `changeStartDayOfWeek` in
  [server/models/users.js](../../../../server/models/users.js) checks the value
  is a number and that a user is signed in, then `setStartDayOfWeek()` saves it.
- **Used by:** the board Calendar view (FullCalendar `firstDay`), the month
  grids of the date picker
  ([imports/lib/calendarMonth.js](../../../../imports/lib/calendarMonth.js)) and
  the due-week filters.
- **Tests:** [tests/weekStart.test.cjs](../../../../tests/weekStart.test.cjs) and
  [tests/calendarMonthWeekAlignment.test.cjs](../../../../tests/calendarMonthWeekAlignment.test.cjs).

## Commits

 - [the week start is grouped into the direct Date popup](https://github.com/wekan/wekan/commit/e13f4f6c29c55a50c423d5887c297455b552b4c2)
 - [selected-calendar month grids align with the week start](https://github.com/wekan/wekan/commit/71b77aedad9401dc9f734ac8e980abe735569b5e)
 - [Due this week and next week filters follow the week start](https://github.com/wekan/wekan/commit/e5c844fca7190d158302472862bab380707ff3aa)
 - [the Calendar view follows the week start](https://github.com/wekan/wekan/commit/7eec78c0409fdf5b5eeef0b1088894353bc892aa)
 - [option to change the first day of the week in user settings](https://github.com/wekan/wekan/commit/8e14459cff4da1391f536dfbc6441abb21e9c215)
