# Calendar systems

## What it is

A calendar system is the way dates are counted and named: the Gregorian
calendar most of the world uses, or for example the Jalali (Persian), Hebrew,
Islamic or Japanese calendar. **Calendar system (date display)** lets each
member see every date in WeKan in the calendar they use. The choice is
independent of the interface language - an English interface can use Jalali,
for example - and it changes only how dates are shown and picked, never the
stored date. Only the selected calendar is displayed in each date position.

## Read more

- [Calendar](https://en.wikipedia.org/wiki/Calendar),
  [Gregorian calendar](https://en.wikipedia.org/wiki/Gregorian_calendar),
  [Solar Hijri calendar](https://en.wikipedia.org/wiki/Solar_Hijri_calendar)
  (Jalali) and [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) on Wikipedia.
- [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
  on MDN - the browser's built-in calendar conversion WeKan uses.
- [Common Locale Data Repository](https://en.wikipedia.org/wiki/Common_Locale_Data_Repository)
  on Wikipedia, and its data at
  [unicode-org/cldr-json](https://github.com/unicode-org/cldr-json) - the source
  of the calendar names.
- [Date settings](README.md) and [Set day of the week start](Day-of-week-start.md).

## How to use it

**Choose a calendar**

1. Click your username or avatar at the top right, then **Date**.
2. Below **Date Format** and **Set day of the week start**, open **Calendar
   system (date display)**. **Gregorian** is the default.
3. Pick a calendar and click **Save**.

The choices are Gregorian, Jalali/Persian, Buddhist, Chinese, Coptic,
Dangi/Korean, Ethiopic Amete Alem, Ethiopic, Hebrew, Indian national, Islamic,
Islamic civil, Islamic Saudi Arabia, Islamic tabular, Islamic Umm al-Qura,
ISO 8601, Japanese and Republic of China. The additional choices come from
the browser's built-in Unicode calendar support. A browser only lists the
additional calendars it supports. Gregorian and Jalali retain their existing
preference names, so upgrading preserves saved settings.

The preference applies to card and minicard dates, vote/poker deadlines,
checklist deadlines, custom-field dates, label milestones, notifications,
activity/history dates, archives, board timeline/original positions, Gantt
date labels and administrative date tables. Date ordering follows your
existing date-format preference. Era-based calendars retain the era alongside
the year; leap-month names are retained where applicable.

**Select a date and a time**

Card date popups, date custom fields, checklist deadlines, label milestones,
quick-add deadlines and scheduled-rule dates use the shared calendar input.

1. Open a date popup (for example a card's Due date). It shows the selected
   calendar's month grid immediately, across the popup's full width, including
   for Gregorian. Compact date fields outside these popups use the date button
   to open their grid.
2. Move through months and years with « ‹ › » (previous year, previous month,
   next month, next year). **Today**, between the month and ›, shows today's
   month and focuses today; it changes nothing until a day is clicked.
3. Or jump directly: under the calendar, the **year** is a number field (type
   any year, or step it), and **month** and **day** are drop-downs, in every
   calendar system.
4. Click a day to select it. The popup grid stays visible after choosing a
   day.
5. Pick the time with the separate hour and minute lists, then click **Save**.
   Saving without picking a day saves today.

Compact Gregorian fields outside popups use the browser's native Gregorian
date input. The popup fits its controls without nested scroll areas. Drag its
bottom-right resize corner to change width and height, or focus that handle
with Tab and use arrow keys. The handle cannot shrink it below its initial
content height. Its size is bounded by the viewport; on an unusually short
window, the outer popup provides scrolling so controls remain reachable.

The date popup can be moved by dragging its title bar with a mouse or touch
pointer. Movement keeps the popup inside the viewport; the Back and Close
controls remain clickable. Calendar month/year navigation and day buttons use
the same active theme styling as Save, with the selected day and keyboard
focus still indicated. The bottom-right resize handle remains available after
moving the popup.

In date popups, the heading above the calendar names the displayed month and
its year in the member's calendar. (It used to combine the month with the
whole selected date; since 2026-11-02 it shows the month and year only, and the
year, month and day controls under the calendar show the selection.) The
separate Date label and date summary above the calendar are removed.

Time controls provide separate hour and minute lists, covering all 24 hours
and all 60 minutes. Both can be selected with a mouse or keyboard. Only the
hour and minute dropdowns are visible; the combined time value
is hidden internally for the existing save handlers. Typing a date, colon or
other punctuation is not required. Existing due-date defaults, including
17:00 for a new due date, are preserved.

| Key | Date-grid action |
| --- | --- |
| Tab / Shift+Tab | Move between controls; the grid has one date tab stop |
| Left / Right | Previous / next adjacent date; visual direction follows RTL |
| Up / Down | Same weekday in the previous / next week |
| Home / End | First / last date of the current week |
| Page Up / Page Down | Previous / next selected-calendar month |
| Shift+Page Up / Shift+Page Down | Previous / next selected-calendar year |
| Enter / Space | Select the focused day |
| Escape | Close a compact grid; popup grids remain visible |

Changing focus alone does not save or select a date. Selecting a day keeps
focus on the popup grid; compact inputs return
focus to the date button. Day buttons have full-date accessible names, the
selected day exposes its state, month changes have a live announcement, and
keyboard focus has a visible outline. Time lists support native arrow-key
and Tab navigation.

## How the numbers are calculated

- **18 calendars:** `CALENDAR_SYSTEM_IDS` in
  [imports/lib/calendarSystems.js](../../../../imports/lib/calendarSystems.js).
  Gregorian (`gregory` for Intl) and Jalali (`persian` for Intl) are always
  offered; each other one only when
  `new Intl.DateTimeFormat('en', { calendar }).resolvedOptions().calendar`
  gives that calendar back in this browser (`supportsCalendar()`).
- **Months:** single-board and multi-board month views use the selected
  calendar's actual month boundaries in both the grid and list month views
  ([imports/lib/calendarMonth.js](../../../../imports/lib/calendarMonth.js)).
  Their day grids align each date with the member's selected weekday start,
  including months with 29, 30 or 31 days. Previous/next navigation moves
  between those months, including short months and leap months.
- **Years:** the year field is a whole number in the calendar in use, where
  year 0 is 1 BC; it is found by jumping through the calendar, so thousands of
  years back or ahead are one entry away, up to the range a JavaScript date
  holds.
- **Time:** 24 hour options (0-23) and 60 minute options (0-59); a new due date
  defaults to 17:00.

## How it works in WeKan

Week and day views retain their existing start-of-week and time-grid behavior,
with dates rendered in the selected calendar. Choosing, dragging or resizing an
event still represents the same underlying instant.

Dates remain native dates in storage. The picker passes a Gregorian ISO
value internally to the existing save handlers. That value is not presented
as a second calendar. Machine-readable datetime attributes and interchange
formats remain native ISO dates, so reminders, APIs, sorting and imports
continue to refer to the same instant.

Everything works on-premise without Internet access. No new runtime dependency
or translation service is used. Additional calendar conversion uses the
browser's built-in `Intl.DateTimeFormat`; the existing Jalali converter is
retained. Calendar-name translations use static
[Unicode CLDR locale data](https://github.com/unicode-org/cldr-json), with the
[Unicode license](../../../../imports/i18n/calendar-labels-LICENSE.txt).
Locales without CLDR calendar-name translations retain English placeholders
for the new names, ready for the normal translation workflow. Existing
translations are preserved.

Files: the calendar list and conversion are
[imports/lib/calendarSystems.js](../../../../imports/lib/calendarSystems.js)
(`availableCalendarSystems()`, `nativeCalendarParts()`,
`formatNativeCalendarDate()`), the month grids
[imports/lib/calendarMonth.js](../../../../imports/lib/calendarMonth.js), the
shared input `calendarDateInput` in
[client/components/forms/calendarDateInput.jade](../../../../client/components/forms/calendarDateInput.jade)
and [calendarDateInput.js](../../../../client/components/forms/calendarDateInput.js),
and the member's choice is part of the Date popup
(`memberDateSettingsPopup` in
[client/components/forms/dateFormatSettings.jade](../../../../client/components/forms/dateFormatSettings.jade)).

### Verification

`tests/calendarDateDisplay.test.cjs` covers calendar availability, independent
language/preferences, date displays and native storage boundaries.
`tests/calendarMonthWeekAlignment.test.cjs` covers month-grid alignment
without changing the underlying month boundaries.
`tests/calendarPickerControls.test.cjs` covers real month grids, leap days,
click selection, keyboard/RTL navigation, time selection and the Today button.
`tests/calendarDropdowns.test.cjs` covers the year, month and day controls, and
`tests/calendarPopupResize.test.cjs` the resizing. The Playwright
calendar-display spec
([44-calendar-date-display.e2e.js](../../../../tests/playwright/specs/44-calendar-date-display.e2e.js))
covers rendered badges, popup selection and saving; it requires a running
WeKan server and database.

## Commits

 - [the year is a number field, any year by typing or stepping](https://github.com/wekan/wekan/commit/dcaa316a01b3dca35a64bb8e16d6fab712566eb2)
 - [year, month and day drop-downs under the calendar](https://github.com/wekan/wekan/commit/492895200bef27c1d1e008858150040f6f3fa119)
 - [the heading names the year as well as the month](https://github.com/wekan/wekan/commit/45c291b4064a658450cd4b9366b1fb7074986b92)
 - [a Today button, and a month navigated back to is drawn whole](https://github.com/wekan/wekan/commit/bc21c901f4d0023adf11c0f856602b767def655a)
 - [every popup moves by its bar or handle](https://github.com/wekan/wekan/commit/22a12dc7f87b768033f03fe5a378df63dd4e46b7)
 - [Save without picking a day saves today instead of Invalid date](https://github.com/wekan/wekan/commit/6f5aab875b0f1627a866f825c5eaa164920dd141)
 - [today is filled green in the date popup](https://github.com/wekan/wekan/commit/b7ba1e20750254e35c01fba90694a77938fb7788)
 - [today is marked in the date popup calendar](https://github.com/wekan/wekan/commit/519fb2c105f8a2b6e41d6125c3fe28501acfb360)
 - [the calendar system moves into the direct Date popup](https://github.com/wekan/wekan/commit/e13f4f6c29c55a50c423d5887c297455b552b4c2)
 - [month grids align with the configured week start](https://github.com/wekan/wekan/commit/71b77aedad9401dc9f734ac8e980abe735569b5e)
 - [the selected calendar's real month ranges in grid and list views](https://github.com/wekan/wekan/commit/9c7c14d3ff12fe5d86156913b58184a6dd074e87)
 - [date popups can be dragged, and calendar buttons follow the theme](https://github.com/wekan/wekan/commit/3988ab5eabac06b6b6f1ca34fa09a0e830fe9f2b)
 - [the formatted date beside the month in the heading](https://github.com/wekan/wekan/commit/9fda12cdd63e8f760ca15c31b1f4fff506913a64)
 - [date controls fit without nested scrolling, and the popup resizes](https://github.com/wekan/wekan/commit/398d5f42d41f6c0cc49f425ea1703fa4a2d059fc)
 - [a full-width calendar directly in date popups](https://github.com/wekan/wekan/commit/236676ff53c58baaef0ff9484b727445400c6b79)
 - [member-selected calendars and accessible date and time controls](https://github.com/wekan/wekan/commit/5057a0a2c1079780f6560369e989d0022c54e53a)
