# Calendar systems

Open your member menu, select **Member Settings**, and choose **Calendar system
(date display)**. **Gregorian** is the default. The choice is independent of
the interface language: an English interface can use Jalali, for example.
Only the selected calendar is displayed in each date position.

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

## Selecting dates and times

Card date popups, date custom fields, checklist deadlines, label milestones,
quick-add deadlines and scheduled-rule dates use the shared calendar input.
Date popups show the selected calendar's month grid immediately, across
the popup's full width, including for Gregorian. Compact date fields outside
these popups use the date button to open their grid. Click a day to select
it. Previous/next month and year buttons
allow navigation without typing. The popup grid stays visible after choosing
a day. Compact Gregorian
fields outside popups use the browser's native Gregorian date input. The popup
fits its controls without nested scroll areas. Drag its bottom-right resize
corner to change width and height, or focus that handle with Tab and use
arrow keys. The handle cannot shrink it below its initial content height.
Its size is bounded by the viewport; on an unusually short window, the
outer popup provides scrolling so controls remain reachable.

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

## Calendar views and storage

Single-board and multi-board month views use the selected calendar's actual
month boundaries. Previous/next navigation moves between those months,
including short months and leap months. Week and day views retain their
existing start-of-week and time-grid behavior, with dates rendered in the
selected calendar. Choosing, dragging or resizing an event still represents
the same underlying instant.

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
[Unicode license](../../../imports/i18n/calendar-labels-LICENSE.txt).
Locales without CLDR calendar-name translations retain English placeholders
for the new names, ready for the normal translation workflow. Existing
translations are preserved.

## Verification

`tests/calendarDateDisplay.test.cjs` covers calendar availability, independent
language/preferences, date displays and native storage boundaries.
`tests/calendarPickerControls.test.cjs` covers real month grids, leap days,
click selection, keyboard/RTL navigation and time selection. The Playwright
calendar-display spec covers rendered badges, popup selection and saving;
it requires a running WeKan server and database.

The date popup can be moved by dragging its title bar with a mouse or touch pointer. Movement keeps the popup inside the viewport; the Back and Close controls remain clickable. Calendar month/year navigation and day buttons use the same active theme styling as Save, with the selected day and keyboard focus still indicated. The bottom-right resize handle remains available after moving the popup.
