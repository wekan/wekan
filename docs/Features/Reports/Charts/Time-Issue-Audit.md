# Time and time-tracking issue audit

Checked the live open issue list on 2026-09-26 (162 open issues), including
all descriptions, then read each relevant issue and all comments. Searching
for time tracking, time spent, spent time, cycle/lead time, duration, elapsed,
Pomodoro, timesheets and work logs finds these two open work-metric requests:

| Issue | Existing source evidence | Remaining work |
| --- | --- | --- |
| [#1476: Metrics](https://github.com/wekan/wekan/issues/1476), sojournerc | `chartCalculations.js` and `boardChartData.js` already implement cycle/lead times, throughput, WIP, and velocity-based completion estimates. | Add the five flow reports described in [Flow analytics](Flow-Analytics.md), using the same board data and export mechanism. |
| [#1598: Activity/time history and move reasons](https://github.com/wekan/wekan/issues/1598), ladistrupl | Universal History records dates, spent-time changes and checklist completion. Activities already record checked/unchecked items. Activity timestamps use `displayDate` and are selectable, formatted date/time text. Time view totals `spentTime` by card and current assignee. | Preserve history on card/checklist deletion, capture move reasons, and expose time adjustments by their recorded author. An assignee is not necessarily the person who entered a time adjustment. |

Related requests were also read in full:

- [#1673: Activity date display](https://github.com/wekan/wekan/issues/1673),
  zombah: exact timestamps already render inline through
  `client/config/blazeHelpers.js` and `client/lib/dateDisplay.js`. Current user,
  board and administrator date-format preferences apply. The old
  relative-time-only/hover-only limitation is already gone.
- [#1618: Action summaries](https://github.com/wekan/wekan/issues/1618),
  martinbruno90: this is a broader checklist ownership, cross-board personal
  overview and calendar request, rather than elapsed-time tracking. My Cards,
  card assignees and calendar/Gantt views already exist; checklist due dates
  are supported by `server/lib/checklistDeadlines.js`. Do not close this entire
  request merely because card-level time reports exist.

The general history feature is reused for these reports. Existing Flowtime
sessions already add their elapsed hours to `spentTime`; manual time entry
and the Time view use that same field. No second timer or timesheet store is
introduced. Database query support is not the missing feature here: the new
reports use plain board-scoped reads and pure calculations, rather than new
aggregation operators requiring a FerretDB implementation.

## Implemented missing pieces of #1598

- Keep card and checklist Activities when their source item is deleted. Their
  stored titles and timestamps remain visible from the board activity feed.
  Keep a card-removal snapshot in the existing universal History for reports;
  deleting the whole board still follows the normal board purge policy.
- Add an optional **Move: Reason** field to the existing Move Card dialog and
  an **Ask for move reason** board card setting. When enabled, ordinary
  interactive list moves ask for an optional reason. Automation can supply a
  reason without a dialog. The reason is recorded with the move, not inferred
  from a comment or another field. Skipping a reason is allowed.
- Record whole positions centrally in the existing collection history hook.
  The old server-only `Card.move` logger missed direct client collection moves
  and REST updates. One combined position row also keeps its reason attached
  to the move and makes undo/redo restore the pair together.
- Extend the existing Time view with timestamped `spentTime` adjustments grouped
  by the history author. This is explicitly an adjustment audit, not a claim
  that the person editing the total personally performed all of the work.
  Existing card and assignee totals remain available, and exports include both.
