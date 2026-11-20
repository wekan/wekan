The upcoming WeKan release and the 5 newest, in short. Everything
each one changed and the project status are in
[CHANGELOG-big.md](CHANGELOG-big.md), and older releases in [old-CHANGELOG](old-CHANGELOG/).

Written by `node releases/changelog-short.mjs` from CHANGELOG-big.md:
make changes there.

# v13.22 2026-11-20 WeKan ® release

Repeating tasks of **Taskwarrior**, **Microsoft To Do**,
**Todoist**, **TickTick**, **Tasks.org**, **Vikunja**, **Super Productivity**,
**iCalendar**, **Org mode** and **Obsidian Kanban** now repeat in WeKan, and
their exports write the repeat back. **Release All**
builds and pushes **wekan**, **wekan-ondra** and **wekan-gantt-gpl** to every
Snap Store channel, and **Release All Missing** adds what a release lacks,
snaps included. A **WeKan board** imported from its own export keeps all of
its Board Settings and card fields, and **Rocket.Chat** and **Fizzy** are
imported and exported.

[All changes in v13.22](CHANGELOG-big.md#v1322-2026-11-20-wekan--release)

# v13.21 2026-11-20 WeKan ® release

Twelve new **Board View reports** - Created vs. Resolved, Net
Flow, Time in List and more - and **grouped menus**: the Board View menu, the
Import and Export lists and the list, card and swimlane menus have headings.
WeKan imports **mail**, **calendars**, **chats** and **notes**, and large files
are **streamed to disk** within the free space or an Admin Panel limit. Menu
entries that did nothing now work. Cards get the **Kanban and Scrum flow
fields** Blocked, Class of service, MoSCoW and WSJF, lists their **policies**,
the board menu a **standup timer** and a **retrospective board**, every export
is **written a page at a time**, and **InviteBleed** is closed for the old
invitation codes too.

[All changes in v13.21](CHANGELOG-big.md#v1321-2026-11-20-wekan--release)

# v13.20 2026-11-19 WeKan ® release

The **REST API** card lists of a list and of a swimlane now carry
what a syncing client needs - when a card changed, its labels, members and
custom field values - so syncing a board needs no request per card. **build.sh**
and **build.bat** can run a single **Playwright** spec.

[All changes in v13.20](CHANGELOG-big.md#v1320-2026-11-19-wekan--release)

# v13.19 2026-11-19 WeKan ® release

**Release builds** no longer fail when the **Snap Store** is slow
to process an upload, or when a **Termux** or **BSD** package mirror has a bad
minute.

[All changes in v13.19](CHANGELOG-big.md#v1319-2026-11-19-wekan--release)

# v13.18 2026-11-19 WeKan ® release

**Admin Panel / Problems** says what its numbers count - "New
problems: 1" and "Checks with findings: 8 / 31", in every language - and a
report row's address, location and user always belong to the same occurrence.

[All changes in v13.18](CHANGELOG-big.md#v1318-2026-11-19-wekan--release)
