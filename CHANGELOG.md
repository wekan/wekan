The upcoming WeKan release and the 5 newest, in short. Everything
each one changed and the project status are in
[CHANGELOG-big.md](CHANGELOG-big.md), and older releases in [old-CHANGELOG](old-CHANGELOG/).

Written by `node releases/changelog-short.mjs` from CHANGELOG-big.md:
make changes there.

# v13.24 2026-11-21 WeKan ® release

Six more of **Microsoft**'s tools are imported and exported under
the Microsoft heading: **Azure DevOps Boards**, **Microsoft Lists**,
**Microsoft Project** (XML), **Outlook** (.msg in, .eml out), **Teams** and
**OneNote**, the last two also fetched from Microsoft Graph. **Sandstorm** grain
backups of twelve apps are imported and nine exported, and **Vietnamese** no
longer shows Malay text.

[All changes in v13.24](CHANGELOG-big.md#v1324-2026-11-21-wekan--release)

# v13.23 2026-11-20 WeKan ® release

The **Import** page and the **Export** menu list a company's
products under the company's name: **37signals**, **Atlassian**, **Google** and
**Microsoft**.

[All changes in v13.23](CHANGELOG-big.md#v1323-2026-11-20-wekan--release)

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
