# Problems / Instrumentation

Open **Admin Panel → Problems → Instrumentation** to see live Meteor 3.6
instrumentation counters. The page shows DDP connection totals and per-method
and per-publication call counts, errors, and average/maximum duration when
Meteor supplies a duration. It refreshes every five seconds.

The counters exist only in this WeKan server process. They start when the server
starts, reset on restart, and show one process when multiple instances run.
Operation names and counts are retained in memory (at most 200 names). Arguments,
results, error details, addresses, and user/connection IDs are never retained
by this report. Only a site admin can request its snapshot.
