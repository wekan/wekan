# Board Settings / Date

## What it is

A board's own date format: a board administrator can make every member see the
board's dates in one format, overriding the format the Admin Panel sets for
everyone. The same popup has your own **Show week of year (ISO 8601)** toggle,
and for board admins the board's calendar sync over CalDAV, which puts the
cards' due dates in a calendar such as Nextcloud Calendar.

## Read more

- [Wikipedia: ISO 8601](https://en.wikipedia.org/wiki/ISO_8601), the date
  format and its week numbers
- [Wikipedia: ISO week date](https://en.wikipedia.org/wiki/ISO_week_date)
- [Wikipedia: CalDAV](https://en.wikipedia.org/wiki/CalDAV)
- [All three date scopes and the member controls](../../Member-Settings/Date/README.md)

## How to use it

**Set the board's date format:**

1. A board administrator opens **Right sidebar / Board Settings / Date**.
2. The top of the popup shows whether the global **Date Format for everyone**
   is enabled and its saved value.
3. Check the board override (**Date Format**), choose a format, and **Save**.
   Unchecking it makes the board inherit the global setting. A member's enabled
   personal format takes precedence over both.

**Show week numbers:** below **Save** and the horizontal rule, **Show week of
year (ISO 8601)** toggles your own week-number display immediately; it does not
set a format for everyone.

**Sync due dates with a calendar (board admins):**

1. Under **Calendar sync (CalDAV)**, write the calendar's address, the user
   name and an app password (not your own password).
2. Tick **Sync due dates with this calendar** and click **Save**.
3. **Sync all now** pushes every card of the board at once.

See [all three date scopes and the member controls](../../Member-Settings/Date/README.md).

## How the numbers are calculated

- **Which format is shown** (`resolveDateFormat` in
  [models/lib/dateFormatPolicy.js](../../../../models/lib/dateFormatPolicy.js)):
  the member's own format when they enabled it, otherwise this board's format
  when its override is on, otherwise the Admin Panel's format for everyone
  when it is enabled, otherwise `YYYY-MM-DD`. A format must be one of the six
  known ones - `YYYY-MM-DD`, `DD-MM-YYYY`, `MM-DD-YYYY` and the same three
  without the time - or the next level is used.
- **Week numbers** follow ISO 8601 (`getISOWeek` in
  [imports/lib/dateUtils.js](../../../../imports/lib/dateUtils.js)): weeks
  start on Monday and week 1 is the week with the year's first Thursday; a
  date's week is the week of the Thursday of its Monday-to-Sunday week.
- **Calendar sync**: due dates moved in the calendar are read back every 15
  minutes ([server/caldavSync.js](../../../../server/caldavSync.js)).

## How it works in WeKan

The popup is `boardDateSettingsPopup` in
[client/components/forms/dateFormatSettings.jade](../../../../client/components/forms/dateFormatSettings.jade),
with the shared `dateFormatEditor` that Member Settings uses too, and its code
in
[client/components/forms/dateFormatSettings.js](../../../../client/components/forms/dateFormatSettings.js).
**Save** calls `setBoardDateFormat` in
[server/models/boards.js](../../../../server/models/boards.js), which allows
only a board admin and stores `dateFormat` and `dateFormatOverride` on the
board. The week toggle is the user's own setting. The CalDAV link is read and
saved by `getCalDavLink`, `saveCalDavLink` and `syncCalDavNow` in
[server/caldavSync.js](../../../../server/caldavSync.js), each for board admins
only; the password is never sent back to the browser.

## Commits

 - [CalDAV: a board's card due dates in Nextcloud Calendar or any CalDAV calendar](https://github.com/wekan/wekan/commit/c76f3e2e984e2d56af64c6570f774938938328e8)
 - [Clarify member Date format status and section layout](https://github.com/wekan/wekan/commit/b87b0aca1ce72efce449c878ad13b7e39bb599cb)
 - [Move ISO week-number toggle into Board Settings Date](https://github.com/wekan/wekan/commit/e217f1215a0f99271f1f752f841fe412fb0c3339)
 - [Group member date preferences in the direct Date popup](https://github.com/wekan/wekan/commit/e13f4f6c29c55a50c423d5887c297455b552b4c2)
 - [Move date format controls to global, board and member settings](https://github.com/wekan/wekan/commit/94b59bef014503e5dd8aaeb5ebf8500311b96daf)
 - [Add cleaner task board presentation and date-only formats](https://github.com/wekan/wekan/commit/16b1b307fc365049f4ea59f3e310ac47b8543b4c)
 - [Add an admin date format override for everyone](https://github.com/wekan/wekan/commit/46607d4299cf51836b892be91490111a1f81bb7e)
