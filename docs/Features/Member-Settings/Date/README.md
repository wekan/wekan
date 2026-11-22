# Date format

## What it is

The date format decides how dates are written in WeKan: year-month-day,
day-month-year or month-day-year, with or without the time. It can be set at
three levels - for everyone by a site admin, for one board by a board admin,
and for yourself - and the most personal enabled one wins. The **Date** entry
of the member menu also holds the first day of the week and the calendar
system; they have pages of their own:

- [Set day of the week start](Day-of-week-start.md)
- [Calendar systems](Calendar-Systems.md)

## Read more

- [Date format by country](https://en.wikipedia.org/wiki/Date_format_by_country)
  and [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) on Wikipedia.
- [ISO week date](https://en.wikipedia.org/wiki/ISO_week_date) on Wikipedia,
  for **Show week of year (ISO 8601)**.
- [Set day of the week start](Day-of-week-start.md) and
  [Calendar systems](Calendar-Systems.md).

## How to use it

**Set your own date format**

1. Click your username or avatar at the top right, then **Date**.
2. The popup first shows **Date Format for everyone** and **Board: Date
   Format**, each *Enabled* or *Disabled* with its saved value, so you can see
   what you would inherit.
3. Under **Member Settings: Date Format**, tick the checkbox (it shows
   *Enabled* or *Disabled* at once) and pick a format in the drop-down.
4. Optionally set **Set day of the week start** and **Calendar system (date
   display)** below it.
5. Click **Save**. Save applies all three selections.

Date format settings apply in this order, using only checked settings:

1. Username menu → Member Settings → Date: your personal override.
2. Right sidebar → Board Settings → Date: this board's override, saved by a board admin.
3. Admin Panel → Settings → Visibility → Date: the site's default, saved by a site admin.

Uncheck a setting and save to inherit the next enabled default. The selected
value remains saved for later use. Without an enabled setting, dates use the
normal year-month-day default and existing locale-specific displays.

Below the board Date popup’s Save button and horizontal rule, Show week of year
(ISO 8601) toggles your existing week-number display preference immediately.

The board popup shows whether the global format is enabled and its saved value.
The member popup shows the global and current board statuses and saved values,
including disabled settings. Outside a board, the board override is disabled.
The bold Member Settings: Date Format heading follows the board status directly,
without a rule. Its checkbox shows Enabled or Disabled immediately, above the
format dropdown. Horizontal rules separate the following settings.

Below Date Format, the member popup also contains Set day of the week start and
Calendar system (date display). Save applies all three selections. These controls
are no longer under Change Settings. The summaries and controls use existing
translations.

Each scope supports year-month-day, day-month-year and month-day-year, with or
without time. The preference affects displayed dates, date exports and ambiguous
date filters; it does not change stored timestamps or the selected calendar.
Guests inherit board and global settings.

Opened cards always call their date section **Date**. That section contains date
fields and keeps its collapse state; format settings live in the menus above.

## How the numbers are calculated

- **Six formats** (`DATE_FORMATS` in
  [models/lib/dateFormatPolicy.js](../../../../models/lib/dateFormatPolicy.js)):
  `YYYY-MM-DD`, `DD-MM-YYYY`, `MM-DD-YYYY` and the same three with
  `-date-only` (no time).
- **Which one applies** - `resolveDateFormat()` in the same file, first match
  wins:
  1. your own format, when your override is enabled and the format is one of
     the six;
  2. the board's `dateFormat`, when `dateFormatOverride` is set on the board;
  3. the site's `globalDateFormat`, when the global setting is enabled (its
     stored legacy name is `hideDateFormat`);
  4. otherwise `YYYY-MM-DD`.

## How it works in WeKan

- **Popups:** `memberDateSettingsPopup` and the shared `dateFormatEditor`
  (scope `member`, `board` or global) in
  [client/components/forms/dateFormatSettings.jade](../../../../client/components/forms/dateFormatSettings.jade)
  and [dateFormatSettings.js](../../../../client/components/forms/dateFormatSettings.js).
  The menu entry is `js-member-date-settings` in
  [client/components/users/userHeader.jade](../../../../client/components/users/userHeader.jade).
- **Methods:** member Save calls `changeDateFormat(format, enabled)`,
  `changeStartDayOfWeek(startDay)` and `changeCalendarSystem(calendar)` in
  [server/models/users.js](../../../../server/models/users.js); board Save
  calls `setBoardDateFormat(boardId, format, enabled)`.
- **Resolution:** [models/lib/dateFormatPolicy.js](../../../../models/lib/dateFormatPolicy.js).
- **Tests:** [tests/globalDateFormat.test.cjs](../../../../tests/globalDateFormat.test.cjs),
  [tests/repairedDateFormatLabels.test.cjs](../../../../tests/repairedDateFormatLabels.test.cjs)
  and the browser test
  [tests/playwright/specs/global-date-format.e2e.js](../../../../tests/playwright/specs/global-date-format.e2e.js).

## Commits

 - [the member Date format status and section layout](https://github.com/wekan/wekan/commit/b87b0aca1ce72efce449c878ad13b7e39bb599cb)
 - [the ISO week-number toggle moves into Board Settings / Date](https://github.com/wekan/wekan/commit/e217f1215a0f99271f1f752f841fe412fb0c3339)
 - [member date preferences grouped in the direct Date popup](https://github.com/wekan/wekan/commit/e13f4f6c29c55a50c423d5887c297455b552b4c2)
 - [date format controls for global, board and member settings](https://github.com/wekan/wekan/commit/94b59bef014503e5dd8aaeb5ebf8500311b96daf)
 - [date-only formats](https://github.com/wekan/wekan/commit/16b1b307fc365049f4ea59f3e310ac47b8543b4c)
 - [an admin date format for everyone](https://github.com/wekan/wekan/commit/46607d4299cf51836b892be91490111a1f81bb7e)
