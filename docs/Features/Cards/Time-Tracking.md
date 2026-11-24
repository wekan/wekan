# Time Tracking

## What it is

Time tracking records how much time has been spent on a card. Each card has a
**Spent time (hours)** total, an optional estimate, an **Overtime** flag and a
**Time by day** log of who logged how many hours on which day. The total is
what the [Time view](../Board-Header/Board-Views/Time-View.md),
[Workload](../Workload/README.md) and [Billing](../Billing/README.md) read;
the [Flowtime and Pomodoro](Flowtime-and-Pomodoro.md) timers add to it.
External time trackers such as Titra and calendars through iCal can be used
with WeKan too.

## Read more

- Wikipedia: [Time-tracking software](https://en.wikipedia.org/wiki/Time-tracking_software),
  [Timesheet](https://en.wikipedia.org/wiki/Timesheet),
  [Overtime](https://en.wikipedia.org/wiki/Overtime) and
  [iCalendar](https://en.wikipedia.org/wiki/ICalendar).
- In WeKan: [Flowtime and Pomodoro](Flowtime-and-Pomodoro.md),
  [Time view](../Board-Header/Board-Views/Time-View.md),
  [Time and issue audit](../Board-Header/Board-Views/Charts/Time-Issue-Audit.md),
  [Workload](../Workload/README.md) and [Billing](../Billing/README.md).

### Titra

This was found 2020-05-20 at [Time Tracking Wekan issue](https://github.com/wekan/wekan/issues/812#issuecomment-631111730), thanks!

Titra Time Tracking, GPLv3
- [titra.io](https://titra.io/) (its old free-time-tracking-online page
  no longer answers)
- https://github.com/kromitgmbh/titra/

Wekan Integration:
- https://github.com/kromitgmbh/titra/wiki/Wekan-integration

### iCal

https://github.com/wekan/wekan/issues/2836

https://github.com/wekan/wekan-ical-server

## How to use it

**Show the field on the board:** Board sidebar (hamburger menu) → **Board
Settings** → **Card**, row **Spent time (hours)**: *Show on Card* and *Show on
Minicard*.

**Set the total, the estimate and the flags:**

1. Open the card. In the **Time** section, click the hamburger beside
   **Spent time (hours)** (**Change spent time**), or click the time badge.
2. Enter **Time** in hours (decimals allowed, for example `1.5`).
3. Optionally fill in **Estimated hours**, and tick **Billable** and
   **Overtime**.
4. Click **Save**. **Delete** clears the time and the Overtime flag.

**Log time on a day:**

1. In the same popup, under **Time by day**, pick the **Date**, enter the
   **Hours** and an optional **Note**.
2. Click **Log time**. The entry is listed with who logged it; your own entry
   can be removed with the trash icon until it is approved or invoiced.

The badge turns red when **Overtime** is ticked, green otherwise; with an
estimate it reads like `1h30m / 4h`.

## How the numbers are calculated

- **Spent time** is stored in decimal hours (`spentTime` in
  [models/cards.js](../../../models/cards.js)); a value below 0 is refused
  with **Invalid time**.
- **The badge** shows it as a duration
  ([models/lib/spentTimeFormat.js](../../../models/lib/spentTimeFormat.js)):
  the hours are rounded to whole seconds and split into days (24 h), hours,
  minutes and seconds, leaving out zero units - `12h34m56s`, `1d2h`, `0s`.
  Its tooltip says **Spent Time** or **Overtime**, with the hours rounded to
  two decimals.
- **Estimated hours:** 0 to 10,000, in steps of 0.25 in the popup; what is
  left is the estimate less the time spent.
- **Time by day** ([models/lib/timeEntries.js](../../../models/lib/timeEntries.js)):
  an entry is more than 0 and at most 1,000 hours, on a `YYYY-MM-DD` date,
  with a note of at most 500 characters; hours are rounded to four decimals.
  Logging adds the hours to the card's total and removing one takes them off
  again. Any other change of the total - the popup, a timer, the REST API, an
  import - is recorded as an entry of that day for the difference, and time
  spent before entries were kept becomes one undated entry, once. The list
  shows the newest 500 entries.
- A linked card shows, and changes, the time of the card it links to.

## How it works in WeKan

- Card fields `spentTime`, `estimatedHours`, `billable` and `isOvertime` in
  [models/cards.js](../../../models/cards.js), with `getSpentTime`,
  `setSpentTime`, `getIsOvertime`, `setIsOvertime` and the estimate and
  billable helpers.
- The popup `editCardSpentTimePopup`, the badge `cardSpentTime` and
  `cardTimeEntries` are in
  [client/components/cards/cardTime.jade](../../../client/components/cards/cardTime.jade)
  and [cardTime.js](../../../client/components/cards/cardTime.js); the Time
  section is in [cardDetails.jade](../../../client/components/cards/cardDetails.jade).
- [server/timeEntries.js](../../../server/timeEntries.js) - the methods
  `timeEntryAdd`, `timeEntryRemove` and `timeEntriesOfCard`, and the hook that
  turns every other change of `spentTime` into an entry. Who may change the
  card may log time on it; who may see it may read its entries; an entry on an
  invoice or approved is not removed.
- REST: `spentTime` and `isOverTime` (the REST spelling, stored as
  `isOvertime`) on the card edit endpoint in
  [server/models/cards.js](../../../server/models/cards.js).
- Tests: [tests/spentTimeFormat.test.cjs](../../../tests/spentTimeFormat.test.cjs),
  [tests/spentTimeCardSettings.test.cjs](../../../tests/spentTimeCardSettings.test.cjs)
  and [tests/timeEntries.test.cjs](../../../tests/timeEntries.test.cjs).

## Commits

 - [Time approval for billed hours](https://github.com/wekan/wekan/commit/d88662d69c212650a7ed5d0ab82d69262a2c6690)
 - [Time by day: log hours on a day, and see who logged what](https://github.com/wekan/wekan/commit/13b0d5fe37d5ff73e109e06a4fdc21418497e273)
 - [Billable: whether a card's time goes on invoices](https://github.com/wekan/wekan/commit/604b3dbe84c17d11af722826741866c8953e91b3)
 - [Estimated hours beside the time spent](https://github.com/wekan/wekan/commit/165dfa3c1676f6069d456ead021fa0db69f92e22)
 - [An isOverTime stored through REST before the fix becomes isOvertime](https://github.com/wekan/wekan/commit/569756b66c0fc3e3c41aba93fa8311994c6fa754)
 - [Spent time is shown as a duration, not decimal hours](https://github.com/wekan/wekan/commit/3e8e8039ffd4e26ab9a060b229c67dfffe0d82af)
 - [Fix REST card overtime persistence](https://github.com/wekan/wekan/commit/f74ef4c40d85f9f6b91b8f4ecfc7372f67d32100)
 - [Change spent time in the Time section's hamburger](https://github.com/wekan/wekan/commit/4f20f24201b4b51c07118b1ebd543a774ee4a79f)
 - [Fix setting overtime](https://github.com/wekan/wekan/commit/3c6915e217de2c9c572b3716a398b77da1693e24)
 - [Two-way binding of card and board times](https://github.com/wekan/wekan/commit/724d26379c33afc2c3d44d3722b0c5c35c1b80ed)
 - [The spent time title says Overtime or Spent time](https://github.com/wekan/wekan/commit/d38071457ce1ae722d025216fb2bf6ba958697ac)
 - [Card spent time, which can be overtime or not](https://github.com/wekan/wekan/commit/eec3c301bc7b0f29d7a7fcfcf59d330ceb604985)
