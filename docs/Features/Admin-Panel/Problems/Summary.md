# Admin Panel / Problems / Summary

The first pane of Admin Panel / Problems, and the one it opens on: what is
running now, what is wrong now, and how many new problems each problem stream
has. Address: `/admin/problems/summary` (the bare `/admin/problems` and the old
`/admin-reports` open it too). Site administrators only: the page shows "not
authorized" to anybody else, and every method behind it refuses a caller who is
not `isAdmin`. Organization administrators do not see it.

The pane reloads itself every 30 seconds. The same overview is printed by
`snap run wekan.problems` ([Snap.md](Snap.md)) and returned by
`GET /api/admin/problems` ([REST API](../../../API/REST-API.md#admin-panel-problems)).

## Status

From the `systemStatusReport` method (`server/methods/systemStatus.js`,
`server/lib/systemStatus.js`, `models/lib/problemsOverview.js`).

**In progress** - every migration or repair that is running now, read from the
persisted status collections so it is right after a restart too:

- the database text migration (MongoDB to and from FerretDB v1), with its
  direction and phase ([Migrations.md](Migrations.md));
- the board data-repair, as `done/total` boards ([Repairs.md](Repairs.md));
- data recovery / maintenance;
- an attachment migration or repair.

When nothing runs, the pane says "No migrations or repairs are in progress."
While something does, it says logins can be slow until it finishes.

**Problems** - each detected problem as a line with its count and detail:

| Problem | Button | What the button does |
| --- | --- | --- |
| Broken cards - cards with no board, swimlane or list, or an invalid type | **Repair broken cards** | Runs the `repairBrokenCards` method over every board, then says how many were fixed and how many cannot be placed on any board (no board id at all). |
| Lists missing their swimlane ([#6670](https://github.com/wekan/wekan/issues/6670)) | **Restore** | Runs `restoreListSwimlanes`: puts each list back in the swimlane it was created in, where that is still recorded and still exists, and says how many were restored and how many remain board-wide. |
| A failing login-page check | - | Configuration, not data; the detail says what to change ([Login-Problems.md](Login-Problems.md)). |
| A failed or overdue Admin Panel backup | - | See [Backup](../../../Backup/Backup.md#did-the-backup-work-history-health-and-monitoring). |
| A data health finding | **Repair** | Runs `repairDataHealth` for that check. A repair that only moves data runs on one click; one that deletes data first turns into **Confirm** and runs on the second click ([Data-Health.md](Data-Health.md)). |

Every button is disabled while its repair runs, and the overview reloads when
it is done so the count changes straight away.

## Data health

The last run of the nightly read-only data health scan, as
`<date> UTC - <checks that found something>/<checks>`, or that it has never
run. **Start** runs the scan now (`dataHealthScanNow`); it runs in the
background and its findings appear under Problems above
([Data-Health.md](Data-Health.md)).

## Problems (the event streams)

One checkbox line per event stream with problems newer than its last
acknowledgement, written as the menu path
(`Admin Panel → Problems → Security Report`) with its count of new problems.
The streams are `security`, `speed`, `tests`, `cpu`, `ram`, `disk`, `database`,
`integrity` and `mail` (`EVENT_STREAMS` in `models/eventLog.js`); the API usage
report is not one of them. A row with severity `info` is never counted as a new
problem (`models/lib/eventLogProblems.js`), so a CPU spike that only records
its own mitigation does not raise the count.

Tick the streams you have reviewed, then:

- **Acknowledge** (`acknowledgeEventLog`) - resets the new-problem count of each
  ticked stream. The rows stay in its pane.
- **Clear** (`clearEventLog`,
  [#6893](https://github.com/wekan/wekan/issues/6893)) - deletes every row of
  each ticked stream up to now and acknowledges it. A problem that happens
  again after the click shows as new again.

This is the only place problems are acknowledged or cleared; the stream panes
themselves are read-only. With nothing new, the section says "No new problems."

Rows also age out by themselves after `EVENTLOG_RETENTION_DAYS` days (default
`90`, `0` keeps them for ever), checked once a day for the whole installation.

## Related

- [README.md](README.md) - every Problems pane.
- [Design.md](Design.md) - why each problem is one summary row.
- [Security remediation design](../../../Security/Remediation/WeKan.md) - the
  event log behind the streams.
