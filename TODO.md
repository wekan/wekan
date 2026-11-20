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

## Import and Export formats to add

Found on 2026-11-20 by comparing `models/lib/importSources.js` and the export
menu (`client/components/boards/exportScope.js`) with the export files other
programs write and document. Each goes into the existing Import page and
Export menu, through the generalized importer (`models/lib/externalParsers.js`,
`models/kanboardCreator.js`) and the external exporters
(`models/lib/externalExportFormatters.js`), so a message becomes mail in Board
View / Email, a chat's messages become comments in Board View / Chat, and dated
items show in Calendar and Gantt.

- Mail: mbox (RFC 4155, as Thunderbird, Apple Mail, mutt and Gmail write it)
  and single .eml messages (RFC 5322 / MIME). Import: each conversation (by
  Message-ID, In-Reply-To and References) is one card in the Inbox list with
  its `email` set, the replies its comments. Export: the board as an .mbox.
- Google Takeout .zip (<https://takeout.google.com>): Tasks (`Tasks/Tasks.json`,
  task lists and tasks with due dates and completion), Keep (`Keep/*.json`,
  notes, checklists, labels, colors, archived), Mail (`Mail/*.mbox`, as above),
  Calendar (`Calendar/*.ics`, events and tasks) and Google Chat
  (`Google Chat/Groups/*/messages.json`, a space's messages). One import makes
  one board with a swimlane per product. Import only: Takeout cannot be imported
  back into Google.
- iCalendar .ics on the Import page (RFC 5545): VTODO tasks by STATUS into
  To Do / In Progress / Done / Cancelled, and VEVENT events, with their dates,
  CATEGORIES as labels and the calendar's name as the board title. The existing
  calendar-only ICS import reads VEVENT into one list; the .ics feed export
  already exists.
- Slack workspace export .zip (<https://slack.com/help/articles/201658943>):
  `users.json`, `channels.json` and `<channel>/<YYYY-MM-DD>.json`. A channel is
  a card, its messages and thread replies the card's comments, so Board View /
  Chat reads it as the channel. Import only: Slack does not import its own
  export.
- Mattermost bulk export JSONL (<https://docs.mattermost.com/manage/bulk-export-tool.html>):
  `channel`, `post` and `direct_post` lines with their `replies`. Import as
  channels with comments; export the board as a bulk import file Mattermost's
  `mmctl import` reads, a card being a channel and its comments the posts.
- Telegram Desktop export `result.json` (Settings / Advanced / Export Telegram
  data, JSON): one chat or the full export's `chats.list`. A chat is a card,
  its messages the comments; text entities are joined to plain text. Import
  only.
- WhatsApp "Export chat" .txt (one line per message, `date, time - name:
  text`, in the phone's date format; the bracketed iOS form too). One chat is
  one card with its messages as comments. Import only.
- Discord channel export JSON as DiscordChatExporter writes it
  (<https://github.com/Tyrrrz/DiscordChatExporter>): `guild`, `channel`,
  `messages[]` with `author`, `timestamp` and `content`. A channel is a card.
  Import only.
- Evernote .enex (<https://evernote.com/blog/how-evernotes-xml-export-format-works>):
  notes with title, ENML content, created/updated, tags and the reminder time.
  A note is a card, its tags labels, its to-do checkboxes a checklist, the
  reminder the due date. Export: the board as an .enex Evernote and Joplin
  import.

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
