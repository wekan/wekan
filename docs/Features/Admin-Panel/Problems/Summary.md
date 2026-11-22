# Admin Panel / Problems / Summary

## What it is

The first pane of Admin Panel / Problems, and the one it opens on: what is
running now, what is wrong now, and how many new problems each problem stream
has. It is the administrator's daily check: one page that says whether a
migration is slowing logins down, whether some cards or lists need a repair,
and which reports have something new, with the buttons to fix or acknowledge
them. Address: `/admin/problems/summary` (the bare `/admin/problems` and the old
`/admin-reports` open it too). Site administrators only: the page shows "not
authorized" to anybody else, and every method behind it refuses a caller who is
not `isAdmin`. Organization administrators do not see it.

## Read more

- [Dashboard (computing)](https://en.wikipedia.org/wiki/Dashboard_(computing))
  on Wikipedia - one screen that summarises the state of a system.
- In WeKan: [README.md](README.md) (every Problems pane), [Snap.md](Snap.md)
  (the same overview as text), [Design.md](Design.md) (one summary row per
  problem), [REST API](../../../API/REST-API.md#admin-panel-problems),
  [Data-Health.md](Data-Health.md), [Repairs.md](Repairs.md).

## How to use it

**Open it**

1. Log in as a site administrator.
2. Click your avatar or username at the top right and choose **Admin Panel**.
3. Click the **Problems** tab. It opens on **Summary**.

**Read what is running and what is wrong**

1. Under **Status**, read the in-progress list. When something runs, the page
   says logins can be slow until it finishes; otherwise it says "No migrations
   or repairs are in progress."
2. Read the problem lines below it. Each has a count and a detail line saying
   what to do.

**Fix what has a button**

1. Click **Repair broken cards**, **Restore** or **Repair** beside the problem.
2. For a data health repair that deletes data the button turns into
   **Confirm**; click it again to run it.
3. Wait: the button shows "Repairing…" and is disabled until the repair is
   done, then the count updates.

**Run the data health scan now**

1. Under **Data health**, click **Start**. The scan runs in the background; its
   findings appear under Status when it is done.

**Acknowledge or clear the problem streams**

1. Under **Problems**, tick each line you have reviewed, for example
   **Admin Panel → Problems → Security Report**.
2. Click **Acknowledge** to reset their new-problem count (the rows stay), or
   **Clear** to delete their rows up to now.

## How the numbers are calculated

| Number | How it is computed |
| --- | --- |
| Reload | the pane reloads every 30 seconds (`Meteor.setInterval(..., 30000)` in [client/components/settings/problemsSummary.js](../../../../client/components/settings/problemsSummary.js)). |
| Broken cards | `Cards.find(brokenCardsSelector()).countAsync()`: cards whose `boardId`, `swimlaneId` or `listId` is null, `''` or missing ([models/lib/brokenCardsRepair.js](../../../../models/lib/brokenCardsRepair.js)). The detail line also mentions an invalid type, but the count does not test the type. |
| Repair broken cards result | how many cards were placed on their board's first usable list / swimlane, and how many cannot be placed (no board id at all; never deleted). |
| Lists missing their swimlane | lists with no `swimlaneId` whose creation swimlane is recorded in the list's position history and still exists, and whose cards are not in another swimlane ([server/lib/restoreListSwimlanes.js](../../../../server/lib/restoreListSwimlanes.js), [models/lib/listSwimlaneRestore.js](../../../../models/lib/listSwimlaneRestore.js)). Restore reports how many were restored and how many remain. |
| Board data-repair | `boardsDone/boardsTotal` boards ([Repairs.md](Repairs.md)). |
| Data health | `<date> UTC - Checks with findings: <found> / <checks>`, the date as `YYYY-MM-DD HH:MM`; "Never" when the scan has never run. |
| New problems: N | per stream, rows newer than that stream's last acknowledgement whose severity is not `info` ([models/lib/eventLogProblems.js](../../../../models/lib/eventLogProblems.js)). Rows with no severity are counted. A stream with 0 is not listed. |
| Clear | deletes every row of each ticked stream with a date up to now, and acknowledges it at that time ([models/eventLog.js](../../../../models/eventLog.js) `clearEventLog`). |
| Retention | rows older than `EVENTLOG_RETENTION_DAYS` days (default 90; `0` keeps them for ever) are deleted, checked once an hour and run once a day for the whole installation (the first server to claim the day does it). |

## How it works in WeKan

The same overview is printed by `snap run wekan.problems` ([Snap.md](Snap.md))
and returned by `GET /api/admin/problems`
([REST API](../../../API/REST-API.md#admin-panel-problems)), which also gives the
new-problem count per stream ([server/models/eventLog.js](../../../../server/models/eventLog.js)).

### Status

From the `systemStatusReport` method
([server/methods/systemStatus.js](../../../../server/methods/systemStatus.js),
[server/lib/systemStatus.js](../../../../server/lib/systemStatus.js),
[models/lib/problemsOverview.js](../../../../models/lib/problemsOverview.js)).

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
| Lists missing their swimlane ([#6670](https://github.com/wekan/wekan/issues/6670)) | **Restore** | Runs `restoreListSwimlanes`: puts each list back in the swimlane it was created in, where that is still recorded and still exists, and says how many were restored and how many remain board-wide. A list with cards in another swimlane is left alone, since binding it would hide them. |
| A failing login-page check | - | Configuration, not data; the detail says what to change ([Login-Problems.md](Login-Problems.md)). |
| A failed or overdue Admin Panel backup | - | See [Backup](../../../Backup/Backup.md#did-the-backup-work-history-health-and-monitoring). |
| A data health finding | **Repair** | Runs `repairDataHealth` for that check. A repair that only moves data runs on one click; one that deletes data first turns into **Confirm** and runs on the second click ([Data-Health.md](Data-Health.md)). |

Every button is disabled while its repair runs, and the overview reloads when
it is done so the count changes straight away.

### Data health

The last run of the nightly read-only data health scan, as
`<date> UTC - Checks with findings: <found> / <checks>`, or "Never" when it has
never run. **Start** runs the scan now (`dataHealthScanNow`); it runs in the
background and its findings appear under Problems above
([Data-Health.md](Data-Health.md)).

### Problems (the event streams)

One checkbox line per event stream with problems newer than its last
acknowledgement, written as the menu path
(`Admin Panel → Problems → Security Report`) with its count of new problems
(`New problems: N`), from the `eventLogProblemAreas` method.
The streams are `security`, `speed`, `tests`, `cpu`, `ram`, `disk`, `database`,
`integrity` and `mail` (`EVENT_STREAMS` in `models/eventLog.js`); the API usage
report is not one of them. A row with severity `info` is never counted as a new
problem (`models/lib/eventLogProblems.js`), so a CPU spike that only records
its own mitigation does not raise the count.

The menu name comes from `STREAM_LABEL_KEY` in `problemsSummary.js`, which
names Security Report, Speed, Tests, CPU usage, Memory usage and Disk usage.
`database`, `integrity` and `mail` have no entry there, so their line shows the
stream id itself (for example `Admin Panel → Problems → database`).

Tick the streams you have reviewed, then:

- **Acknowledge** (`acknowledgeEventLog`) - resets the new-problem count of each
  ticked stream. The rows stay in its pane.
- **Clear** (`clearEventLog`,
  [#6893](https://github.com/wekan/wekan/issues/6893)) - deletes every row of
  each ticked stream up to now and acknowledges it. A problem that happens
  again after the click shows as new again.

This is the only place in the web page where problems are acknowledged or
cleared; the stream panes themselves are read-only. With nothing new, the
section says "No new problems." The REST API has the same acknowledge, as
`POST /api/admin/problems/:stream/acknowledge`.

Rows also age out by themselves after `EVENTLOG_RETENTION_DAYS` days (default
`90`, `0` keeps them for ever), checked once a day for the whole installation.

### Tests

- [tests/problemsStatus.test.cjs](../../../../tests/problemsStatus.test.cjs) -
  the Status overview: in progress, broken cards, login checks.
- [tests/eventLogProblems.test.cjs](../../../../tests/eventLogProblems.test.cjs) -
  `info` rows are not new problems.
- [tests/eventLogClearAndRetention.test.cjs](../../../../tests/eventLogClearAndRetention.test.cjs) -
  Clear and retention.
- [tests/problemsSummaryLabels.test.cjs](../../../../tests/problemsSummaryLabels.test.cjs) -
  the counts read as translated sentences.
- [tests/listSwimlaneRestore.test.cjs](../../../../tests/listSwimlaneRestore.test.cjs)
  and [tests/dataHealth6818.test.cjs](../../../../tests/dataHealth6818.test.cjs) -
  Restore and Data health.
- [server/lib/tests/brokenCardsRepair.tests.js](../../../../server/lib/tests/brokenCardsRepair.tests.js) -
  Repair broken cards.
- [tests/playwright/specs/problems-clear.e2e.js](../../../../tests/playwright/specs/problems-clear.e2e.js) -
  the Clear button in a browser.

## Related

- [README.md](README.md) - every Problems pane.
- [Design.md](Design.md) - why each problem is one summary row.
- [Security remediation design](../../../Security/Remediation/WeKan.md) - the
  event log behind the streams.

## Commits

 - [Counts read as sentences, in every language](https://github.com/wekan/wekan/commit/7c92cf3298bef9ec1199bef5edb48bd334b5fb21)
 - [A Clear button, and resolved problems age out](https://github.com/wekan/wekan/commit/fefabbf1134fd7d4c56c4375c0ac103032b75770)
 - [Data health's "Never" gets its own translation key](https://github.com/wekan/wekan/commit/77956c98eda8c8bbd0c7fbc609dc0e46c6101385)
 - [Data health: a nightly scan of broken references, with repairs](https://github.com/wekan/wekan/commit/d9cf523f9e86ec7c7c26a8def5380e249add7ca3)
 - [Failed and overdue backups are listed as problems](https://github.com/wekan/wekan/commit/06b7ce994ad193357a20fc6a036060ea04c83947)
 - [Memory usage and Disk usage streams on the Summary list](https://github.com/wekan/wekan/commit/b6a3d98736ebf58ef3905613e303d091ef89f65a)
 - ["Lists missing their swimlane" no longer counts board-wide lists, and Restore never hides cards](https://github.com/wekan/wekan/commit/ebf2a019a6722222a1d6d69ee1d1f4e65ff505de)
 - [REST API for the Problems overview, streams and acknowledge](https://github.com/wekan/wekan/commit/bbcd98d9d83b874200ba45b2cbc2a495585031d9)
 - [Restore lost list swimlanes from Summary](https://github.com/wekan/wekan/commit/290cdc6a4dec20f62e09fdcd4978709e3fb7333c)
 - [Stop showing a finished board-repair and info CPU rows as problems](https://github.com/wekan/wekan/commit/1fb382f0eb14763a0a51b3269ff2f19466f31d4b)
 - [Add a Repair button for broken cards](https://github.com/wekan/wekan/commit/d168a9d30223d507c2de703ca2922ac61a25db6b)
 - [The Status overview: migrations and repairs in progress, and the login-page checks](https://github.com/wekan/wekan/commit/5a1c9a61e98d0e1bc2ce566229bcdce3f81745ae)
 - [Add the Problems button and page, replacing the banner and the Reports button](https://github.com/wekan/wekan/commit/0085f7fbfa81e820ce0736dd28b2b0786ac6e41c)
