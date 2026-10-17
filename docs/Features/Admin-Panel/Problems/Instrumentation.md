# Problems / Instrumentation

Open **Admin Panel → Problems → Instrumentation** to see live Meteor 3.6
instrumentation counters. The page shows DDP connection totals and per-method
and per-publication call counts, errors, and average/maximum duration when
Meteor supplies a duration. It refreshes every five seconds.

Above the table, one bar per area of WeKan - Cards, Boards, Lists, Login,
People, Notifications, Attachments, Settings, Problems and the rest - gives the
whole picture at a glance: the bar's length is the area's calls against the
busiest area's, its red end the share that failed, and beside it the calls, the
average duration and the errors. Click an area to show only its methods and
publications in the table; click it again to show all. The grouping is
`models/lib/instrumentationAreas.js`; an operation that fits no area is under
Other, and `tests/instrumentationAreas.test.cjs` keeps that to a handful of
WeKan's own.

The counters exist only in this WeKan server process. They start when the server
starts, reset on restart, and show one process when multiple instances run.
Operation names and counts are retained in memory (at most 200 names). Arguments,
results, error details, addresses, and user/connection IDs are never retained
by this report. Only a site admin can request its snapshot.
