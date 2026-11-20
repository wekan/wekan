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

## Import and Export of everything each tool has

Asked on 2026-11-20: check and fix that everything each tool with a WeKan
import or export can hold comes across, whether a whole export is read or
written at once or only a part of it (a board, a project, some lists, a date
range), and check each tool's newest features - what its current version
exports and imports - so their data has a place in WeKan too. For every tool,
compare its newest export file, documentation and changelog with the parser
and the formatter here, record what is lost in the import loss report
(`unsupported`), and add what has a place in WeKan.

Done so far: `tests/playwright/specs/export-import-round-trip.e2e.js` exports
a board in each of the 41 formats WeKan both writes and reads and imports the
file back; every one brings the card back, and its KEEPS table holds each
format to what its file keeps of the description, the checklist and the
comment, so a format that loses more fails. The Trello export imports back
with checklists, comments, members, custom fields and archived cards and
lists, and a Trello .zip export carries the attachment files; the GitHub,
Gitea and Forgejo exports carry the comments. What is left below is per tool: the
tool's newest features against its parser and formatter.

- WeKan's own JSON and .zip: every field of the current schema, attachments
  and their versions, custom fields, rules, templates, Scrum data, and a part
  of a board as well as all of it.
- Kanban and project tools: Kanboard, Nextcloud Deck, OpenProject, Asana,
  Zenkit, Planner, monday.com, Wrike, Teamwork, Businessmap, ClickUp, Notion,
  Plane, Taiga, Focalboard, Nullboard, Kanri, Obsidian Kanban, MeisterTask,
  Quire, Planka, KanbanFlow, Basecamp - sub-items, dependencies, time
  tracking, custom fields, comments, attachments and their newer views.
- Issue trackers: Jira, GitHub, GitLab, Gitea, Forgejo, Redmine, Linear,
  Pivotal - epics, sprints, versions and milestones, links between issues,
  work logs, reactions, and fields added in their newest releases.
- Task tools: Todoist, TickTick, Tasks.org, Super Productivity, todo.txt,
  Taskwarrior, Vikunja, Microsoft To Do, Google Tasks, Google Keep -
  recurrence, reminders, priorities, sub-tasks and sections.
- Spreadsheets, text and outlines: CSV / TSV, Excel, Markdown, Leo, OPML,
  Org mode - every column, and every Org property and timestamp.
- Mail, calendars and chats: mail, mbox, iCalendar, Google Takeout, Slack,
  Mattermost, Telegram, WhatsApp, Discord, Evernote .enex - threads, replies,
  reactions, recurring events and the attached files that are now only
  counted.
