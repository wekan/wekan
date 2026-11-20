# TODO

What is not done yet in WeKan, with the reason it is not done. This used to be
the TODO Later block inside `# Status` of `CHANGELOG-big.md`; it lives here so
the changelog only says what changed.

- An item here is NOT done, so it thanks nobody and links no commit. Link the
  issue when there is one: `[#NNNN](https://github.com/wekan/wekan/issues/NNNN)`
  and a one-line reason.
- When an item is done, REMOVE it from this file and write its entry in the
  `# Upcoming WeKan ® release` section of `CHANGELOG-big.md`, linking the commit.
  A fixed item never stays here.
- An investigated issue that cannot be fixed or verified here is added under
  the category that says why. An emptied category is removed.

`tests/todoFile.test.cjs` checks this shape.

## Need the running app to reproduce/verify

- The WebKit stage cannot run in the Flatpak sandbox: MiniBrowser needs its own
  sandbox, and turning that off is not allowed there. Run it on a host.

## Translations in the wrong language

Found on 2026-11-20 while translating the new Import and menu headings: these
locale files hold values in another language than their tag, which the
translation rules say to replace with the tag's language.

- `se` (Northern Sami): values seeded in Finnish.
- `ve-PP` (Veps): values in Venda, for example `board-view-cumulative-flow`.
- `uz-AR` (Uzbek, Arabic script): values in Latin script, for example
  `calendar` as "Kalendar".
- `wal` (Wolaytta): values in Ethiopic script, for example "ጊዜ" for time.
- `mt` (Maltese): `board-view-cumulative-flow` in Italian.
- `nd` (Northern Ndebele): the view names look like Shona.
- `hy` (Armenian): `board` as Վարչություն, "administration".

## Menus grouped so they are easier to understand

Asked on 2026-11-20, after the Admin Panel was reorganised into groups. The
Board View menu and the Import and Export lists are grouped now; this is the
rest.

- Swimlanes view: the swimlane, list and card hamburger menus and the board
  header's buttons, reviewed against the same idea - entries grouped by what
  they act on (the item itself, its contents, moving and copying, view and
  settings, archive and delete), with a heading per group as the board menu
  already has.

## Import and Export of large files

Asked on 2026-11-20. A file chosen on the Import page for the generalized
importer's sources is now streamed to the server's disk a part at a time, with
the free space checked before and while it is written and the Admin Panel
limit (none: the free disk space) applied; zips are opened from the disk and
mailboxes read a message at a time. This is the rest.

- JSON and text formats are still read whole into memory once uploaded:
  read them in bounded pieces too (a streaming JSON parser for the large JSON
  exports - Jira, Taiga, Telegram - and line by line for the CSV and line
  formats).
- WeKan's own .zip and Trello's package have upload routes of their own with
  fixed caps (200 MB and 1 GB): route them through the same upload, limit and
  disk check.
- Export: write a large board to the response as it is collected, in parts,
  instead of building the whole file in memory first.

## Reports to add to Board Views

Found on 2026-11-20 by comparing the Board View menu
(`models/lib/boardViewSettings.js`: Gantt, Burndown, Burnup, Cumulative Flow,
Control, Cycle Time, Lead Time, Flow Efficiency, Throughput Histogram, WIP
Run, Aging WIP, Blocker Analysis, Monte Carlo, Process Behavior, Size vs.
Cycle Time, Velocity, Sprint Report, Dashboard, Pulse, Statistics, Time) with
the reports of Jira, Azure DevOps, Nave, ActionableAgile and the Flow
Framework. Each is a Board View with the same export bar at its top as the
other reports, drawn with Chart.js (already a dependency) from the board's
cards and change history.

- Created vs. Resolved: cards added and cards finished per day or week, and
  the running difference - is the work arriving faster than it leaves.
- Net Flow: departures minus arrivals per week as bars, with the trend.
- Time in List: how long cards spent in each list (median and 85th
  percentile per list), from the change history of their moves.
- Average Age: the mean age of the unfinished cards on each day.
- Throughput Run Chart: cards finished per week over time, with the median
  line (the histogram shows only the distribution).
- Workload: open cards and their sizes per assignee and member, stacked by
  list.
- Distribution: open and finished cards by label, swimlane, card type or a
  custom field, as a pie and as a table (Jira's pie chart report, the Flow
  Framework's flow distribution).
- Due Date Performance: finished cards on time, late and without a due date,
  per week, and how late on average.
- Release Burndown: per Scrum release, the remaining work and the projected
  finish from the velocity of the last sprints.
- Epic Progress: for each card with subtasks, its subtasks done, open and
  added over time.
- Dependency Map: the cards and their dependencies (blocks, fixes, relates) as
  a graph, the blocked chains first.
- Activity Heatmap: changes per weekday and hour, and per member and day.
