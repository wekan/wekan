# Status

<details>
<summary>More status info</summary>

https://wekan.fi/status/

What is not done yet, and why, is in [TODO.md](TODO.md).

</details>

<details>
<summary>Newest WeKan at these platforms</summary>

- [Install](https://wekan.fi/install/)
- [Upgrade WeKan](https://wekan.fi/upgrade/)
- [Docs](https://wekan.fi/docs/)
- [Mac ChangeLog](https://github.com/wekan/wekan/wiki/Mac)
- Older releases: [2026-10](old-CHANGELOG/2026/10.md),
  [2026-10 part 2](old-CHANGELOG/2026/10-part2.md),
  [2026-10 part 3](old-CHANGELOG/2026/10-part3.md),
  [2026-10 part 4](old-CHANGELOG/2026/10-part4.md),
  [2026-10 part 5](old-CHANGELOG/2026/10-part5.md),
  [2026-10 part 6](old-CHANGELOG/2026/10-part6.md),
  [2026-10 part 7](old-CHANGELOG/2026/10-part7.md),
  [2026-09](old-CHANGELOG/2026/09.md),
  [2026-09 part 2](old-CHANGELOG/2026/09-part2.md),
  [2026-09 part 3](old-CHANGELOG/2026/09-part3.md),
  [2026-09 part 4](old-CHANGELOG/2026/09-part4.md),
  [2026-09 part 5](old-CHANGELOG/2026/09-part5.md),
  [2026-09 part 6](old-CHANGELOG/2026/09-part6.md),
  [2026-08](old-CHANGELOG/2026/08.md),
  [2026-08 part 2](old-CHANGELOG/2026/08-part2.md),
  [2026-08 part 3](old-CHANGELOG/2026/08-part3.md),
  [2026-08 part 4](old-CHANGELOG/2026/08-part4.md),
  [2026-07](old-CHANGELOG/2026/07.md),
  [2026-07 part 2](old-CHANGELOG/2026/07-part2.md),
  [2026-06](old-CHANGELOG/2026/06.md), [2026-05](old-CHANGELOG/2026/05.md),
  [2026-04](old-CHANGELOG/2026/04.md), [2026-03](old-CHANGELOG/2026/03.md),
  [2026-02](old-CHANGELOG/2026/02.md), [2026-01](old-CHANGELOG/2026/01.md),
  [2025](old-CHANGELOG/2025.md), [2024](old-CHANGELOG/2024.md),
  [2023](old-CHANGELOG/2023.md), [2022](old-CHANGELOG/2022.md),
  [2021](old-CHANGELOG/2021.md), [2020](old-CHANGELOG/2020.md),
  [2019](old-CHANGELOG/2019.md), [2018](old-CHANGELOG/2018.md),
  [2017](old-CHANGELOG/2017.md), [2016](old-CHANGELOG/2016.md),
  [2015](old-CHANGELOG/2015.md)

</details>

<details>
<summary>Databases</summary>

Which databases WeKan supports
([docs/Databases/Supported.md](docs/Databases/Supported.md)):

- FerretDB v1 with SQLite: the default on every platform - bundle, Docker, Snap
  and Kubernetes.
- FerretDB v1 with PostgreSQL: works. With MySQL or MariaDB: experimental. With
  SAP HANA: experimental, amd64 only.
- FerretDB 2 with PostgreSQL/DocumentDB: not tested.
- MongoDB 6, 7, 8 and 9: the query conformance catalogue answers the same on
  6.0.28, 7.0.43, 8.0.32 and 9.0.2. WeKan's Mocha tests and dev server run on
  Meteor's bundled MongoDB 8.0.29, and docker-compose-mongodb-v7.yml runs WeKan
  on MongoDB 7.
- MongoDB refuses to start on Linux kernels 6.19 to 7.0.13 (Ubuntu 26.04
  included) until MongoDB 8.0.35 or 9.0.4 or kernel 7.0.14; FerretDB is not
  affected.
- MongoDB 3.x to 5.x: not tested with current WeKan; only to dump an old
  database and restore it into a supported one.

</details>

<details>
<summary>Version</summary>

- Version numbers v11.33, v11.54, v11.57, v11.59 and v11.61 do not exist: a bug
  in `releases/release-all.sh` measured the version step from the two newest
  CHANGELOG headings instead of always advancing by one, so once a prepared-
  but-never-published release had its heading removed rather than renamed back
  to `# Upcoming WeKan ® release`, the resulting gap was read as the new normal
  cadence and re-applied on every later release, repeatedly skipping a number.
  Fixed to a fixed +1 step; nothing was lost, these numbers were simply never
  used.
- WeKan 8.75 and newer uses Meteor 3.5
- WeKan 8.43 upgraded to Meteor 3.x, huge thanks to harryadel:
  - https://harryadel.com/dev-diary-24/
  - https://harryadel.com/dev-diary-25/
  - https://harryadel.com/dev-diary-26/
- WeKan 8.00-8.24 used Colorful Unicode Emoji Icons, versions before and after
  use mostly Font Awesome 4.7 icons.
- WeKan 8.00-8.06 had wrong raw database directory setting
  /var/snap/wekan/common/wekan and some cards were not visible, it was fixed at
  WeKan 8.07 where database directory is back to /var/snap/wekan/common and all
  cards are visible.

</details>

# Upcoming WeKan ® release

**In short:** Twelve new **Board View reports** - Created vs. Resolved, Net
Flow, Time in List and more - and **grouped menus**: the Board View menu, the
Import and Export lists and the list, card and swimlane menus have headings.
WeKan imports **mail**, **calendars**, **chats** and **notes**, and large files
are **streamed to disk** within the free space or an Admin Panel limit. Menu
entries that did nothing now work. Cards get the **Kanban and Scrum flow
fields** Blocked, Class of service, MoSCoW and WSJF, lists their **policies**,
the board menu a **standup timer** and a **retrospective board**, and
**InviteBleed** is closed for the old invitation codes too.

This release fixes the following CRITICAL SECURITY ISSUE of [InviteBleed](https://wekan.fi/hall-of-fame/invitebleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4fad2a9000403ae92069060eb3a4b6b53e67f658">Old six-digit invitation codes are refused, and the sign-up form is throttled</a>. Thanks to meifukun and xet7.</summary>

[GHSA-rg85-qx5c-qx67](https://github.com/wekan/wekan/security/advisories/GHSA-rg85-qx5c-qx67)
reported the invitation code brute force again. The 128-bit code of the first
fix was in place, but an invitation made before it, and not used yet, kept its
guessable six-digit code and was still accepted - a re-invite even mailed that
code again. A code shorter than the 22 characters of a 128-bit code is now
refused at sign-up and replaced by a strong one on a re-invite. The throttle was
on `createUser`, which a client is refused anyway, while the sign-up form calls
`ATCreateUserServer`: that method now takes 10 attempts a minute per address,
and each refusal is counted in Admin Panel / Problems under InviteBleed. The
same report's OIDC race
([GHSA-6944-p22h-3qpx](https://github.com/wekan/wekan/security/advisories/GHSA-6944-p22h-3qpx))
and stale impersonation export
([GHSA-j4x8-689m-h4hv](https://github.com/wekan/wekan/security/advisories/GHSA-j4x8-689m-h4hv))
were checked against the current code and were already fixed.
`tests/securityMeifukun.test.cjs` pins both places a code is looked up, sweeps
for any lookup without the strength check, and drives the throttle's Problems
record; `tests/invitationCodeEmail.test.cjs` refuses six-digit and malformed
codes and checks that a re-invite replaces them.

</details>

and adds the following new features:

**Import and Export** - mail, calendars, chats and notes, each into the view it
is for.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ccfa6cf362e9b1eb812804d38e4d85653c5b0b0a">Import mail, calendars, chats and notes, and export .mbox, .enex and Mattermost files</a>. Thanks to xet7.</summary>

The Import page reads nine more kinds of export. **Mail** (an .mbox from
Thunderbird, Apple Mail, mutt or Gmail, or one .eml) becomes cards of Board
View / Email, one per conversation, the replies its comments and Gmail labels
its labels. An **iCalendar** .ics puts tasks into To Do, In Progress, Done or
Cancelled by their status and events into Events, with their dates. A **Google
Takeout** .zip is one board with a swimlane per product - Mail, Tasks, Keep,
Calendar, Google Chat - recognised by content, since Takeout names its folders
in the account's language. **Slack**, **Mattermost**, **Telegram**,
**WhatsApp** and **Discord** (DiscordChatExporter) exports become channels whose
messages are comments, for Board View / Chat. **Evernote** .enex notes keep
their to-dos as checklists, tags as labels and reminders as due dates. The
Export menu writes a board as an .mbox, an .enex and a Mattermost bulk import
file, each read back by the same import. MIME and ENEX are decoded on the
server (mailparser, htmlparser2), the zips under the zip-bomb guards of the
other zip imports, and an imported Message-ID survives the import sanitizer so
a later reply joins its thread. The nine instructions are translated into every
language. `tests/mailFormat.test.cjs`, `icalendarFormat`, `chatExportFormats`,
`enexFormat` and `googleTakeoutFormat` run each format both ways with its
negative cases; `tests/playwright/specs/import-mail-chat-notes.e2e.js` imports
through the page and reads the result in the Email and Chat views.

</details>

**Board View reports** - twelve more reports, each with the export bar at its
top like the other charts.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/63b5e089f5113960f22fc3d72e3dce3ae86981e2">Created vs. Resolved, Net Flow, Time in List, Average Age, Throughput Run, Due Date Performance and six more</a>. Thanks to xet7.</summary>

Added after comparing WeKan's charts with the reports of Jira, Azure DevOps,
Nave, ActionableAgile and the Flow Framework: Created vs. Resolved, Net Flow,
Time in List, Average Age, Throughput Run Chart and Due Date Performance under
Kanban flow; Release Burndown and Epic Progress under Scrum; Workload,
Distribution, Dependency Map and Activity Heatmap under Overview. Each draws a
Chart.js chart over its data table, and its PDF and Excel export write that
table. The calculations are pure (`models/lib/boardReports.js`) and answer one
shape, so the view and both exports read every report the same way. A member
who may see only their assigned cards gets none of them.
`tests/boardReports.test.cjs` checks each report's numbers from known cards,
including a dependency cycle and an empty release;
`tests/playwright/specs/board-reports.e2e.js` opens each from the menu and
downloads its PDF and Excel.

</details>

**Menus** - grouped under headings, as the Admin Panel is.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/257835733b0ec5d950fac6feb2e13c589219bb9d">The Board View menu and the Import and Export lists are grouped under headings</a>. Thanks to xet7.</summary>

The Board View menu and Board Settings / Board View show the views in six
groups - Board, Calendar and time, Scrum, Kanban flow, Overview, and
Communication and code - with the board's own order inside each. The Import
page and the Export menu list the other tools under the same headings from one
table (`models/lib/toolGroups.js`): Kanban and project tools, Issue trackers and
version control, Task and to-do apps, Spreadsheets and tables, Text and
outlines, Mail, calendars, chats and notes, and Fetched from a service.
`tests/boardViewMenu.test.cjs`, `tests/toolGroups.test.cjs` and
`tests/playwright/specs/board-view-groups.e2e.js` check the groups and their
order.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0d8f8b8d96b868a6d75b803ef105e50aad450977">The list, card and swimlane menus are grouped under headings</a>. Thanks to xet7.</summary>

Share and history, Export and import, Add, Watch, Edit or Appearance,
Settings, Move and copy, and Archive. No entry moved or changed its
condition; each heading sits inside its group's condition, so a member who sees
none of a group sees no heading, and a heading is not clickable. The two header
bars keep their layout. `tests/menuGroupHeadings.test.cjs` and
`tests/playwright/specs/menu-group-headings.e2e.js`.

</details>

**Large files** - imports streamed to the disk, within its free space.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/32c24ed84e9d6c8080e89bdd4097f87a3b0b4b04">Import page uploads stream to the server's disk, checked against the free space and an Admin Panel limit</a>. Thanks to xet7.</summary>

A chosen file is POSTed to `/api/import/upload/:source` and written to
`WRITABLE_PATH/import-uploads` a part at a time, instead of being read in the
browser and sent whole through the import method. Before the first byte the
announced size is checked against Admin Panel / Settings / Security **Largest
import** (empty: no limit) and against the free space less a reserve, and the
space again every 64 MB; a refused or interrupted upload leaves no file. Zip
exports are opened from the disk and mailboxes read a message at a time, also
inside a Google Takeout zip. `tests/importUpload.test.cjs` covers the limit,
the full disk before and during the upload and an interrupted one;
`tests/playwright/specs/import-mail-chat-notes.e2e.js` refuses a file over the
limit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3b1c7ce7bb430834e024d7684734f7586a07b007">WeKan and Trello .zip imports use the same limit and disk check; .mbox and .enex export a page at a time</a>. Thanks to xet7.</summary>

The WeKan .zip and Trello package routes had caps of their own (5 GB, and
200 MB with 1 GB unpacked); they now use the shared receiver, so the limit is
the administrator's or the free disk space. The .mbox and .enex exports are
written 500 cards at a time, waiting for the socket, rather than built whole in
memory.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/640e4925935e3842e00a864057b083b6dc386031">Uploaded JSON is parsed from the file a chunk at a time; a Mattermost export a line at a time</a>. Thanks to xet7.</summary>

A JavaScript string cannot be longer than about 512 MB, so `readFile` and
`JSON.parse` could not read a larger uploaded export at all.
`server/lib/streamJson.js` builds the value as the file is read: every escape
and surrogate pair, chunk boundaries anywhere, the same value and refusals as
`JSON.parse`, a `__proto__` key as an own property, nesting bounded.
`tests/streamJson.test.cjs` compares it with `JSON.parse` on 500 random
documents in random chunks.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/60bbf69164766746718c1792f228b6f2809cd715">Jira and CSV / TSV files are uploaded too; their people and columns are read on the server</a>. Thanks to xet7.</summary>

They were the last files the page read itself and sent whole. A Jira file's
people for the map-members step, and a CSV / TSV file's header, sample rows,
guessed mapping and people, now come from the server's reading of the upload
(`csvUploadPreview`, `csvUploadPeople`); each reads only the sender's own
upload, signed in and while import is enabled. `tests/csvUpload.test.cjs` and
`tests/playwright/specs/csv-upload.e2e.js`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e2cbbe510457940b6db26c90b45307a6c539a0e7">Ten more exports are written a page of cards at a time</a>. Thanks to xet7.</summary>

Todoist, TickTick, ClickUp, MeisterTask, Linear, Pivotal, Redmine, Quire and
Taskwarrior exports, with todo.txt, are written 500 cards at a time instead
of as one string. What a row refers to on another page - a parent's number,
a section, a counted column - comes from a light first pass that reads no
descriptions and no comment text (`models/lib/exportPaging.js`).
`tests/exportPaging.test.cjs` checks that the pages together are byte for byte
the whole file, for every page size.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ce40b56abdf5b166f523dab98a14414907809b1f">The Markdown, Obsidian, OPML and Org mode outlines and the Notion CSV are written a page at a time</a>. Thanks to xet7.</summary>

The outlines come list by list in the board's order, each list's heading
opened before its first card and closed after its last wherever a page ends,
and a list with no cards in its place. Every page's board and list titles now
pass the export boundary, as the whole export's do. Markdown and Obsidian write
a list title once, where two lists of one name used to repeat their cards under
both.
`tests/exportPaging.test.cjs` and the 173 round trips of
`import-export-format-audit.e2e.js`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e1261ef5fb9f233e60352ee28a8e4e16eb44a4c7">Leo outlines are written a page at a time too</a>. Thanks to xet7.</summary>

Leo's outline holds only titles and checklists, which the light first pass
already has, so the first page writes it whole and each page then writes its
own cards' texts after it, under the same node numbers.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bad71f9a1e80f54472c87eb8605d5a4206185ea4">Focalboard and Mattermost exports are written a page at a time</a>. Thanks to xet7.</summary>

Their heads - Focalboard's board options, Mattermost's channels and users - are
named over the whole board from the light first pass and written on the first
page; each page then writes its own cards' records.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f293ae4076092a387505b1909053cd66a62441c8">Trello, Jira, Asana, Zenkit, OpenProject, GitHub, Gitea, Forgejo and GitLab exports are written a page at a time</a>. Thanks to xet7.</summary>

Each is one JSON document whose cards are one array: the first page writes the
document around it, and every page its own cards into it. Every part passes the
export boundary and the admin-only field redaction, as a whole document does.
Jira's issue keys and OpenProject's numbers are counted over the whole board,
so a card refers to one on another page. The import/export audit (173) and the
admin-only custom field specs (12) pass.

</details>

**Cards** - Kanban and Scrum flow fields, each one hidden until a board shows
it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0071dde0f36bb7c8582073a2c072159e15f41ceb">Blocked with a reason, Class of service with Expedite's WIP limit, MoSCoW and WSJF on cards</a>. Thanks to xet7.</summary>

Four practices other Kanban and Scrum tools have, offline and with no AI
(docs/Features/Cards/Flow-Fields.md). **Blocked** keeps why, who and since
when, and puts a red badge on the minicard. **Class of service** is Standard,
Fixed date, Expedite or Intangible, and only one open card of a board can be
Expedite. **MoSCoW** is Must, Should, Could or Won't have. **WSJF** divides
the cost of delay by the job size. Each is a row of Board Settings / Card, off
until a board turns it on, and an Admin Panel card field that hides it on every
board. Only the `setCardFlow` method writes them, checking the card edit right
and the values. `tests/cardFlow.test.cjs` and
`tests/playwright/specs/card-flow-fields.e2e.js`.

</details>

**Lists** - the Kanban policies of a board's lists, and the Scrum Definition
of Ready.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9ac7b916c08bb139f1090d4e87b8319aed08d324">List policies, a commitment point, a WIP limit per person and the Definition of Ready</a>. Thanks to xet7.</summary>

A list can carry its own **policy** - when a card may come in and when it is
done there - written from the list menu and shown as a gavel at its header. A
board can name its **commitment point**, the list from which work is committed
to, flagged at that list. A **WIP limit per person** makes an opened card name
each of its people holding more open cards than the limit. All three are off
until a board admin turns them on in Board Settings / List, and each is an
Admin Panel feature that hides it on every board
(docs/Features/Lists/Flow-Policies.md). The Scrum settings get a **Definition
of Ready** beside the Definition of Done, both now readable by every member in
the Scrum views. `tests/boardFlowPolicies.test.cjs`,
`tests/playwright/specs/list-flow-policies.e2e.js` and
`scrum-definition-of-ready.e2e.js`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/524946c1bf14ada5660ffde987574b8129c47732">The list policy popup asks the board's write capability</a>. Thanks to xet7.</summary>

Its edit check called each role helper as an optional call, which the
role-helper guard reads as a bare reference; it asks
`Utils.currentUserCan('write')`, as the server's Lists allow rule does.

</details>

**Scrum meetings** - a standup timer and a retrospective board, in the board
menu.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2f7a4e210f0e90005bba662e7ac418b403ffa2ba">Daily standup timer and retrospective board</a>. Thanks to xet7.</summary>

**Daily standup** lists the board's members in a shuffled order and gives each
the same timebox, set in the Scrum settings, counted down and red once over.
**Retrospective board** makes a new private board with the lists Start doing,
Stop doing, Keep doing and Action items, through the same server path as Add
Board. Both are in the board menu for every member, each turned off per board
in its Scrum settings and for the instance in Admin Panel / Features
(docs/Features/Scrum/Meetings.md). `tests/scrumMeetings.test.cjs` and
`tests/playwright/specs/scrum-meetings.e2e.js`.

</details>

**Split lists** - Doing and Done in one list.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd5c207006ac1c3ac605b4689860b47205a18d80">A list split into Doing and Done</a>. Thanks to xet7.</summary>

A card of a split list marked **Done here** waits, dimmed and edged green, to be
pulled into the next list, and the list header counts Doing and Done. The mark
belongs to the list it was made in, so a card moved on is in Doing again. A
board admin allows split lists in Board Settings / List and splits a list from
its menu; Admin Panel / Features / Split lists hides it everywhere.
`tests/boardFlowPolicies.test.cjs` and
`tests/playwright/specs/list-flow-policies.e2e.js`.

</details>

and fixes the following bugs:

**Member menu** - Edit Profile and Support do what their settings say.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/42959d02f1ea7b87512439415a9ea8187cd4e19b">Edit Profile saves a member's own new username when Username change is allowed</a>. Thanks to xet7.</summary>

With Admin Panel / People / Login **Username change** allowed, a member's new
username was not saved and the popup closed as if it had: `setUsername` wrote
only for a site admin. It now follows `setEmail` beside it - an admin renames
any account, a member their own when the setting allows it - and anything else
is refused with `not-authorized` instead of returning quietly.
`setUsernameAndEmail` needs both changes allowed.
`tests/selfUsernameChange.test.cjs` runs the methods with the collections
stubbed; `tests/playwright/specs/45-profile-email.e2e.js` saves one through the
popup and is refused for another account and with the setting off.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0ccf182001e64d1949b1cec94604cecf08537338">A signed-out visitor sees a Public Support page, and no text of one that is not</a>. Thanks to xet7.</summary>

The `/support` route sent every signed-out visitor to sign-in, so the page's
**Public** setting did nothing and the "only for logged-in users" text was
never shown - while the page's text was sent to every signed-out subscriber of
the settings publication anyway. The route is open, and a visitor who is not
signed in receives the text only when the page is Public. The support popup the
menu no longer opened is removed. `tests/supportPageSignedOut.test.cjs` and
`tests/playwright/specs/support-page-signed-out.e2e.js` check both cases,
including that the text is not in the browser.

</details>

**Card menu** - who sees which entry.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/60c25690dfc2072509f0e1075e905984cb733f5f">Create board from this card is shown to members who can edit the card</a>. Thanks to xet7.</summary>

The entry sat under `unless canModifyCard`, so exactly the members the
`createBoardFromCard` method lets convert a card never saw it. It was in both
branches when it was added; a later refactor kept only that one. It is now
with the card menu's other write entries, not for Workers, when board creation
is allowed. `tests/createBoardFromCardMethod.test.cjs` checks the entry's
conditions in the template, and
`tests/playwright/specs/create-board-from-card-menu.e2e.js` that an editor sees
it and a read-only member does not.

</details>

**Board menu** - an entry that had no way in.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b00e2c81333032063bad33092181cc917911384f">All Boards Settings is back in the board menu, below Date, for board admins</a>. Thanks to xet7.</summary>

The entry was commented out for the "icons random dance"
([#4214](https://github.com/wekan/wekan/issues/4214)), which left its popup -
card counters and member avatars on All Boards, card aging, auto-archive and
personal list widths - with no way in. The All Boards tiles now read one fetch
of `getAllBoardsTileData` instead of reactive cursors, so the loop cannot
return. `tests/boardMenuOrder.test.cjs` pins its place and its board-admin
guard; `tests/playwright/specs/all-boards-settings-menu.e2e.js` opens it and
saves a row.

</details>

**Shared templates** - one choice for the whole instance, and the targets that
it allows.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c0339ccc592ceb3f14f5339db864b2e63004ca98">The group kinds to share templates with are an instance setting, and the targets appear</a>. Thanks to xet7.</summary>

Which group kinds Admin Panel / People / Shared templates allows came from the
browser's localStorage, so it differed per browser and was empty for everyone
but the admin who ticked it. It is `Settings.sharedTemplatesScopes` now,
published to every client, and an admin's earlier ticks are carried over once.
The All Boards / Templates targets were empty for everyone anyway:
`getMyShareableGroups` did not await the user, and read the groups from a
Promise. `tests/sharedTemplatesScopesSetting.test.cjs` and
`tests/playwright/specs/26-shared-templates.e2e.js` check the setting, and that
a user in another browser gets the targets.

</details>

**Sandstorm** - notifications of comments.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a24e3a49a9bb4ce64cc692d4ce75c2cbbed0a9aa">Comment activity notifications await the card, comment and board</a>. Thanks to xet7.</summary>

The Sandstorm activity notifier read the card, the comment and the board from
`ReactiveCache` without `await`. On the server those are Promises, so
`comment.text.match` threw on every comment activity and a card's members were
never found. `tests/serverReactiveCacheAwaited.test.cjs` sweeps `server/` for
any other unawaited result kept in a variable.

</details>

and has the following developer-facing changes:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c4da72ff72ddbe51370bd94ceb19a96b1c540ed5">The shared templates spec runs its tests in order and waits for the reset</a>. Thanks to xet7.</summary>

The scopes are one instance setting now, so the spec's tests run serially,
wait until the page shows the reset the test server sees at its next database
poll, and find each template link inside its own group.

</details>

- [v12.49 is kept in old-CHANGELOG/2026/10.md, where the changelog's size budget moved it](https://github.com/wekan/wekan/commit/3a1d6701554b95bd594828b36021bb187ea565b1). Thanks to xet7.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/11992ac951278a22d376d079e7dfe0347112b04e">The built server bundle is checked with node --check; the streamed export no longer stops the server starting</a>. Thanks to xet7.</summary>

A parameter of the page-at-a-time export was named like a const in its
function's body, so the server bundle did not load; no node suite loads that
ES module, so all of them passed. `tests/serverBundleSyntax.test.cjs` now
checks the built bundle whenever a build is there. The fault never reached a
release.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/905f60a1ea15aa240a65c83d32ba505d6608b6d6">UI specs: Release Burndown gets a release to show; the upload limit test signs in by the login cookie</a>. Thanks to xet7.</summary>

The reports spec seeds a Scrum release; the limit test POSTs with the HttpOnly
login cookie, as the page's own upload does, and checks the warning names the
limit.

</details>

and improves the following translations:

**Languages updated:** 245 languages.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d1732bd3a598e7e2828a4596ec4b60765759003f">Locale files that held another language get their own</a>. Thanks to xet7.</summary>

Values in another language than their locale's tag are replaced with the tag's
language: Northern Sami seeded in Finnish, Veps in Venda, Maltese sentences in
Italian, Northern Ndebele in Shona, Uzbek in Latin letters in the Arabic-script
file, Wolaytta in Ethiopic script, Tsonga in Swati, Luganda in Swahili, the
Armenian "board" and the Vietnamese "history". Words correct in both languages
are kept. Low confidence: the chart and metric names in Veps, Wolaytta, Tsonga,
Luganda and Northern Sami.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v13.20 2026-11-19 WeKan ® release

**In short:** The **REST API** card lists of a list and of a swimlane now carry
what a syncing client needs - when a card changed, its labels, members and
custom field values - so syncing a board needs no request per card. **build.sh**
and **build.bat** can run a single **Playwright** spec.

This release adds the following new features:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/97809cbb3373400992766826aa49349cf89539b7">REST API: the card lists of a list and of a swimlane carry modifiedAt, labelIds, members and customFields</a>. Thanks to rmb82 and xet7.</summary>

`GET /api/boards/:boardId/lists/:listId/cards` and
`GET /api/boards/:boardId/swimlanes/:swimlaneId/cards` returned only the
title, description, placement, dates, assignees and sort of each card. A client
keeping a copy of a dozen boards ([#6928](https://github.com/wekan/wekan/issues/6928))
had to GET every card on its own to learn its labels, members or custom field
values, or whether it had changed. Each item now also has `modifiedAt`,
`dateLastActivity`, `labelIds`, `members` and `customFields`
(`[{ _id, value }]`), and both routes build it in
`models/lib/restCardListItem.js`, so they stay alike. The board access check
is the same and there is no extra query. An admin-only custom field's value is
still `null` for a member who is not a board admin, through the same
redaction as the single-card GET. Each item carries its `boardId` so that
redaction is scoped to this board, and an admin of it still reads a field
shared with other boards. `tests/restCardListFields.test.cjs` pins the fields,
that nothing else of the card is added, and the concealment;
`tests/playwright/specs/rest-card-list-fields.e2e.js` checks both routes
against a running server, as a board admin and as a member.

</details>

and adds the following developer tooling:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e1d6ad77c0c0c687b74d930b9d361d422891ccb8">build.sh and build.bat: Tests -> Playwright single spec runs one spec on the browsers you choose</a>. Thanks to xet7.</summary>

Running one Playwright spec used to mean starting a server by hand and calling
Playwright with the right environment, or running a whole suite. The new Tests
menu option, and `./build.sh --playwright-spec <spec>
[chromium|firefox|webkit|all]
[title filter]`, find the spec by its file name or a part of it. A WeKan
already answering on `:3000` is used as it is. Otherwise a fresh bundle is built
and the test server started the way the whole-suite runs start it, and stopped
afterwards, so a single spec does not pass or fail on a stale bundle. Each
browser runs natively when it can launch and in the Playwright container when
it cannot; Chromium in the VSCodium Flatpak on arm64 runs natively. Logs go to
`.tools/log/test-playwright-spec/<datetime>/`.
`tests/playwrightSingleSpec.test.cjs` checks how a spec is found, that a wrong
spec or browser is refused before anything is built, and that both menus start
and stop the same server.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v13.19 2026-11-19 WeKan ® release

**In short:** **Release builds** no longer fail when the **Snap Store** is slow
to process an upload, or when a **Termux** or **BSD** package mirror has a bad
minute.

This release fixes the following bugs:

**Release builds** - an outside service having a slow moment no longer fails a
target.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d49922a6da63e6b71c18521dcb630eb7559a698d">Snap uploads wait a bounded time for the store, and package mirrors are retried</a>. Thanks to xet7.</summary>

In the v13.18 release run, every wekan and wekan-gantt-gpl snap uploaded and
then sat in the Snap Store's "Status: processing" for hours. `snapcraft upload`
polls that with no limit of its own, so GitHub cancelled the jobs at their
`timeout-minutes` (2 hours native, 6 hours Launchpad) and reported a failed
release. The wekan-ondra snaps, in the same run, were processed in five
minutes. `releases/snap-upload-retry.sh` now gives one upload 30 minutes
(`SNAP_UPLOAD_PROCESSING_BUDGET`). A revision the store has accepted is not
uploaded again: the channels were sent with it, so the store releases it itself
when processing finishes, and the job says so in a warning and in its summary.
An upload cut off before the store accepted it is retried.

Bun android-arm64 died on a Termux mirror mid-sync ("File has unexpected size
... Mirror sync in progress?"), and Bun freebsd-x64 on a FreeBSD package mirror
that was briefly unreachable ("No route to host"). The Termux installs of the
Bun and Android bundles, and single-file's i386 libraries, now go through
`releases/apt-install.sh`, which waits a mirror out. It now also works in
Termux, which has no sudo and keeps apt under its own prefix. Every FreeBSD,
OpenBSD and NetBSD VM `prepare` retries its package install five times, and
says that the mirror is down when it gives up.

`tests/snapUploadProcessingBudget.test.cjs` runs the upload script against a
fake snapcraft: one that is still processing, one cut off before the store
accepted it, and the normal and refused cases. It also checks that no workflow
uploads around the script. `tests/vmPrepareRetry.test.cjs` checks the retry
loop in every VM `prepare`, and that it gives up after its last attempt.
`tests/releaseAptInstall.test.cjs` covers Termux mode and now checks every
workflow for a bare `apt-get`.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v13.18 2026-11-19 WeKan ® release

**In short:** **Admin Panel / Problems** says what its numbers count - "New
problems: 1" and "Checks with findings: 8 / 31", in every language - and a
report row's address, location and user always belong to the same occurrence.

This release fixes the following bugs:

**Admin Panel / Problems / Summary** - its counts read as sentences in every
language.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7c92cf3298bef9ec1199bef5edb48bd334b5fb21">New problems and Data health checks say what they count</a>. Thanks to xet7.</summary>

"1 new problems" glued a number to a plural label, and Data health's
"Last Run: ... - 8/31" did not say that 8 of 31 checks found something. Each is
now one sentence with its numbers as placeholders, `new-problems-count` and
`data-health-checks-found`, translated into all 244 locales; new keys rather
than changed ones, so a Transifex pull does not bring the old wording back. The
menu's "Memory Usage" is "Memory usage" like CPU usage and Disk usage, and
broken translations of it are corrected: Aymara had an English wrapper, Latvian
had Lithuanian, and Dutch, Frisian, Tagalog, Tswana, Yoruba and Hawaiian were
split or in the wrong word order. `tests/problemsSummaryLabels.test.cjs` pins
the placeholders and key order in every locale, and that no bare number is
glued to a label any more.

</details>

**Admin Panel / Problems reports** - who and where in a row belong together.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/80fb1c65fc0a19c1a8f970ea4873fd690188acd8">A row's address, location and user describe one occurrence, not several</a>. Thanks to xet7.</summary>

A summary row keeps the latest occurrence's username, address, location and
detail, but a field the newest occurrence did not carry stayed from an older
one: `summaryUpdate` dropped the other address family only from `$set`, so the
database kept the old value. Security Report showed a German IPv4 as
"Vancouver, CA" - the location of another person's IPv6 beside it - and
JamBleed's "gerald" beside a lockout of account trottola. The newest occurrence
now replaces all the latest fields, and `$unset` clears the ones it does not
carry, in `server/lib/eventLogFold.js` and in the in-memory fold the legacy
migration uses. Existing rows are right from their next occurrence on.
`tests/eventLogSummary.test.cjs` pins both, and that no update sends an empty
`$unset`.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v13.17 2026-11-19 WeKan ® release

**In short:** The **Admin Panel** answers one question per tab: Settings gains
**Appearance**, **Features**, **Feature profiles**, Security, Activities and
notifications, and Delete, Problems keeps only what is going wrong, and every
old
address redirects. The docs now have a page for every menu entry, and cards of
an archived swimlane no longer appear in the first swimlane.

This release adds the following new features:

**The Admin Panel** - one question per tab, and docs that follow the menus.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e1a053d059191640a63a22ab553c0b0c6b833d8d">Settings gains Appearance, Features, Feature profiles, Security, Activities and Delete</a>. Thanks to xet7.</summary>

Who sees and may use what was spread over three tabs: the feature switches and
profiles sat in Settings / Visibility beside the logo, and Security, Delete and
Notifications sat in Problems among the reports. Visibility is Appearance now,
Features and Feature profiles are panes of their own, the three settings moved
to Settings, Problems is Summary, Backup and the reports, and every old address
redirects. People, Teams and Organizations show the feature profile that
applies. `tests/adminPanelStructure.test.cjs` and
`admin-panel-structure.e2e.js` cover it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a8fd080bc8ece74157e5f2e9e436fa2dafe76348">The docs have a page for every menu entry, laid out like the menus</a>. Thanks to xet7.</summary>

Every Admin Panel pane, the member menu, the board header, Board Settings, the
All Boards left menu and the list, swimlane and card menus now have pages,
written from the code, and `Who-Sees-What.md` explains which layer decides what
is shown and what is allowed. What documenting them found is in TODO.md.

</details>

and fixes the following bug:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0d9c8c1250d42c9c55d469d28384a14e59975eee">Cards of an archived swimlane stay hidden with the Archive sidebar closed</a>. Thanks to sro-lbohn, hmeunier95 and xet7.</summary>

[#6927](https://github.com/wekan/wekan/issues/6927), a regression of #6659: on a
board migrated from an old WeKan, cards of an archived swimlane appeared in the
first swimlane and vanished while the Archive was open, because the client
could only exclude archived swimlanes it had loaded. Their ids are now
published on their own and excluded; the cards themselves are not changed.
`tests/archivedSwimlaneCards6927.test.cjs` and
`archived-swimlane-cards-6927.e2e.js` cover it.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.16 2026-11-19 WeKan ® release

**In short:** **ListLockBulkBleed** is fixed, and a list that refuses a role
now also refuses that role's bulk writes, dependency lines, rule actions and
changes to the list or swimlane itself. Administrators can give chosen users,
teams and organizations a smaller WeKan with opt-in **feature profiles**. A
server no longer runs out of memory in the hourly **History integrity audit**,
**scheduled rules** can create cards again, and **Card Excel export** and
clearing a card's text work again.

This release fixes the following CRITICAL SECURITY ISSUE of [ListLockBulkBleed](https://wekan.fi/hall-of-fame/listlockbulkbleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ba3d94390ba724344a2d5cfe50e9dee3cc6f8d89">Bulk REST card writes and server-side card writes ask the list's role exception</a>. Thanks to immanuwell and xet7.</summary>

[GHSA-83w9-74mx-7v83](https://github.com/wekan/wekan/security/advisories/GHSA-83w9-74mx-7v83),
CWE-863. A board admin can refuse a role write access in one list (#4527).
`DELETE /api/boards/:boardId/cards/bulk` and
`POST /api/boards/:boardId/cards/labels` take their cards from the body, so no
URL names a list, and asked only for board write access; the methods
`archiveSelectedCards`, `copyCard` and `createLinkedCard` write from server
code, past the Cards allow/deny rules. A normal member the list refused could
permanently delete its cards in one request, relabel and archive them, and copy
or link new cards into it.

The bulk routes now read every card and ask each list before the first write:
any refusal is a 403 and nothing changes, and each removal and relabel is keyed
on the list that was checked. The refusal shows in Admin Panel / Problems as
ListLockBulkBleed (`authz.list-locked-bulk`, medium, never disables). The
methods answer `not-authorized` and are not recorded, because Copy Card and
Multi-Selection reach them in ordinary use. The same shape was fixed in twelve
more paths: converting a card to a board, adding a subtask,
`createCardWithDueDate`, the iCalendar import, sending and receiving board
email, creating a version-control issue, moving board objects, History and
position-history undo and redo, renaming an attachment, the scoped import and a
card's rule button. Dependency lines keep their own board-wide rule.
`tests/listLockBulkBleed.test.cjs` runs the gate on the reporter's board and
pins every path; `tests/playwright/specs/list-lock-bulk.e2e.js` replays the
proof of concept.

</details>

and adds the following new feature:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fc21b0b177dc8f8902efa39d0f89c8b041c7cf2d">Feature profiles hide features from the users, teams and organizations an administrator chooses</a>. Thanks to mimZD and xet7.</summary>

[#6837](https://github.com/wekan/wekan/issues/6837): Admin Panel / Settings /
Visibility / Features gains feature profiles - a name, the optional features it
hides, and the users, teams and organizations it applies to. It is strictly
opt-in: a user with no profile sees everything, a profile only hides and changes
no data or permission, and the member menu tells the user which profile hides
how many features, so nothing looks missing. Every place that hides a disabled
feature follows it. The new strings are in every language.
`tests/featureProfiles.test.cjs` and `feature-profiles.e2e.js` cover it.

</details>

and fixes the following bugs:

**Per-list role exceptions** - what else a list that refuses a role refuses,
as decided after ListLockBulkBleed.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/da6d9d39b8bd209006fc02fe735f1c277a2be693">Dependency lines follow the card's list</a>. Thanks to xet7.</summary>

A dependency line is stored on its source card, but it followed only the
board-wide dependency rule, so a role a list refused could still add, change and
remove lines on that list's cards. Now the methods answer `not-authorized`, the
REST dependency routes answer 403 recorded as ListLockBleed, and the import
skips such lines; board and site admins are not restricted.
`tests/listLockDependencies.test.cjs` and `tests/listPermissions.test.cjs` pin
it, and `list-lock-bulk.e2e.js` replays it over REST.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3202a1d7ac1027b41af5a5dfbe03893ccbc89c36">Deleting, archiving or moving a list or swimlane follows the list</a>. Thanks to xet7.</summary>

These do the same to the cards in them, yet were gated by board write access
alone. A list that refuses a role now also refuses that role deleting,
restoring, archiving or moving it, and deleting, archiving or moving a swimlane
holding its cards - on DDP, REST (403, recorded as ListLockBleed) and client
writes alike. The list menu no longer offers its archive actions there.
Renaming and reordering stay allowed, and board admins are never restricted.
`tests/listLockStructure.test.cjs` pins it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ee24453dcb5d9ed8af5c07b848cbd5bd8979ae28">A rule action into a refusing list is skipped, and the rest of the rule runs</a>. Thanks to xet7.</summary>

A rule's move, archive, create-card, copy, link and list actions checked only
board write access. Each now asks the lists it writes in as the user who
triggered the rule; a refusing list skips that action and shows in Admin Panel /
Problems as ListLockRule (detected, low), since a rule meeting a locked list is
not an attack. `tests/listLockRules.test.cjs` pins it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a0f36819610e6d0aa9c170340f8421c1b7fc2bbe">List Sync's rule replay skips such an action too</a>. Thanks to xet7.</summary>

The journaled List Sync replay still wrote with board write access only. Each of
its list-writing runners now decides before saving its command, records a
durable skip and lets the rest of the plan run; a replay reads the saved skip,
so it never re-decides and never skips a half-finished action.
`tests/listSyncRuleListSkip.test.cjs` pins it.

</details>

**Server memory and timed jobs** - what runs on its own, every hour.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cfd9a62466a64b58d514d46c3c6560f003704523">Swap alone is not high RAM usage, and resource monitors are not named like vulnerabilities</a>. Thanks to xet7.</summary>

A laptop with many programs open showed "RamBleed, high: high RAM usage started
(>= 90%)" at RAM 52% and swap 60%: swap at 25% started a period by itself. Swap
now counts only while RAM is also tight, the row says what started it, and only
RAM near full is high severity. The RAM, CPU, disk and speed rows are named for
what happened (HighRamUsage, HighCpuUsage, HighDiskUsage, SlowRequest) without a
CWE, and old rows are renamed at startup. `tests/ramHighTracker.test.cjs` and
`tests/resourceStreamNames.test.cjs` cover it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7459c5bde66ea22966526a7179eede62b5233f0e">The History integrity audit streams each board instead of loading it whole</a>. Thanks to xet7.</summary>

A production server died twice with "JavaScript heap out of memory", 42 and 74
seconds after the hourly History integrity audit started, both times in its
first run after a restart. The audit fetched each board's whole History - every
row with its full previous and new content - into memory. It now streams each
board through a cursor and keeps only hashes and small summaries; the findings
are the same, in the same order. `tests/historyIntegrityStreaming.test.cjs`
compares both on forked, tampered and orphaned chains and fails if a board is
fetched whole.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f23695cc1bf6447fb38693ea8fe2e1ce4ab51f8f">Scheduled rules act as the board's admin, so a created card has an author</a>. Thanks to xet7.</summary>

Every run of a scheduled rule with a "create card" action failed with "User ID
is required in cards insertAsync". Scheduled rules, auto-archive and attachment
retention acted as `board.createdBy`, but boards have no such field, so they ran
as nobody. They now act as the board's first active admin
(`models/lib/boardActor.js`), and the rule's new card names its author.
`tests/boardActor.test.cjs` scans the tree so nothing reads `board.createdBy`
again.

</details>

**Cards** - exporting a card, and clearing its text.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/997c6d88ad4c67850831aa99de1f874765c90a41">Card Excel export works with only Description or only Labels selected</a>. Thanks to AhmedLukman and xet7.</summary>

The card Excel exporter loads the board, list and swimlane only when the
selected fields need them, and passes `null` for the rest. The shared card
document builder defaulted them with `board = {}`, which applies only to
`undefined`, so it read `.title` of `null` and the download ended in "Export
failed". The titles are optional now (`board?.title || ''`), which also covers
a PDF card export of a card with no swimlane.
`tests/cardExportDocument.test.cjs`
fails on the old code with that TypeError, and
`tests/playwright/specs/card-excel-field-selection.e2e.js` downloads both
workbooks from the real route and checks that each holds only its own field.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c59c751547aa36fabda088eed4cfd7b8ce6b37e4">REST card update can clear a card title</a>. Thanks to AhmedLukman and xet7.</summary>

`PUT` with `{"title":""}` answered 404 and kept the old title, because the
handler read the title by truthiness. An empty title is a value now, a title
that is not a string is a 400 before anything is written, and
[an update that matches no card](https://github.com/wekan/wekan/commit/79a98822cbe6f1aaa0da0ad2646c7b2cb4fb2726)
is a 404 again. `tests/restCardSort.test.cjs` and
`tests/playwright/specs/rest-card-title.e2e.js` cover it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aacb2fd4d68c4873bd01685dceee172c24e48379">A cleared card title or description can be undone and redone</a>. Thanks to AhmedLukman and xet7.</summary>

Clearing a value is an edit kept in History, not a deletion, so it is
restorable whatever Admin Panel / Problems / Delete says. Undo already put the
old text back, but redo and Restore of the clearing threw: collection2 removes
`''` from `$set` and then refuses the empty modifier. History, the card details,
the board description and the REST card update now write `''` as it is, and a
REST title of only spaces no longer fails with a 500.
`tests/emptyStringClearWrites.test.cjs` and
`tests/playwright/specs/card-clear-undo-redo.e2e.js` cover it.

</details>

and has the following developer-facing changes:

**Card Excel export** - the browser test for the fix above.

- [A Playwright spec drives the card Excel export with one field selected](https://github.com/wekan/wekan/commit/320a3ca8672b6a70867baa0c3f657d3a5eb53536).
  Thanks to AhmedLukman and xet7.

**Node test suites** - a sandbox that resolves its helpers.

- [The attachment cleanup test resolves the Playwright helpers' own requires](https://github.com/wekan/wekan/commit/74dd0b705e21ecb4723dcb8a6055c7edc5aae9aa).
  Thanks to xet7.

**WeLite REST API** - the upstream REST specs, run against the native WeLite
target as well.

- [Ownership selection](https://github.com/wekan/wekan/commit/049b628a0310a33026de423a590a6c33489d5b41). Thanks to xet7.
- [Card title edits](https://github.com/wekan/wekan/commit/22dae19a64325695a17dd90ea7f4675ffeecfbed). Thanks to xet7.
- [Board card sorting](https://github.com/wekan/wekan/commit/5f06b28aef680d2682e7fa4e965a0e797b502214). Thanks to xet7.
- [Archive and restore](https://github.com/wekan/wekan/commit/11fc468ff77f9126b97d1eca72de9c2d90314022). Thanks to xet7.
- [Subtasks](https://github.com/wekan/wekan/commit/db3f489ab27f672c9d1ab4db5feaf3a116eba928). Thanks to xet7.
- [Overtime](https://github.com/wekan/wekan/commit/2033c177ce452f59bc6cb9d3d07a6566169ed015). Thanks to xet7.
- [People features](https://github.com/wekan/wekan/commit/72ee1c8b231896586086ac7067ea6dd96135506c). Thanks to xet7.
- [User update](https://github.com/wekan/wekan/commit/e4115e68905f4b9a2d521a749a9fe77dde322aa9). Thanks to xet7.
- [Checklists](https://github.com/wekan/wekan/commit/ede46c7a9873f20864a77eeda7cb5007762824ff). Thanks to xet7.
- [Write-route scope](https://github.com/wekan/wekan/commit/399a8defec10165e1cf7fa18faa5113d5bb7176f). Thanks to xet7.
- [Assignment removal](https://github.com/wekan/wekan/commit/8abb9504bb1f714873419f7b481650d758294ef7). Thanks to xet7.
- [Dropdown item rename](https://github.com/wekan/wekan/commit/b8fd94a7e70bf65e85b8d06b491e4d3d13e3a9ec). Thanks to xet7.
- [Dropdown item deletion](https://github.com/wekan/wekan/commit/f1adc7982eca4aebf8831403f6b4bd219cec51b9). Thanks to xet7.
- [Custom-field lifecycle](https://github.com/wekan/wekan/commit/6bf2d53d756e59f494ea50587f62bc467afb7b77). Thanks to xet7.
- [Webhook settings](https://github.com/wekan/wekan/commit/f34fee658206ab4d90583f58746067793f10d12a). Thanks to xet7.
- [Native Playwright credentials are seeded before an API token is used](https://github.com/wekan/wekan/commit/a9059b7b155aaea4bf9ccb1647a492bab251bb10).
  Thanks to xet7.

**WeLite attachments** - the attachment workflows in the native browser.

- [The upstream card attachment cascade spec](https://github.com/wekan/wekan/commit/26e27f62c4b6b9e2bcd1e10623de7dd3e0b31b5e). Thanks to xet7.
- [Attachment rename, and a missing form token is refused](https://github.com/wekan/wekan/commit/7c3b798a1d0ff6e26b6afa8f49c3359a73ba526a). Thanks to xet7.
- [Direct attachment removal in Chromium](https://github.com/wekan/wekan/commit/c060c6d2db51b2fc22fab72dadecd90ab173bd8f). Thanks to xet7.
- [The Version Control Attachments workflow](https://github.com/wekan/wekan/commit/b6bc2b200ce7545ca43b2f6b3a3ac39874227812). Thanks to xet7.
- [The Finnish attachment preview](https://github.com/wekan/wekan/commit/c5344761d856cf5234e5a12ccc61f336c6a9a0e8). Thanks to xet7.
- [The cascade spec reuses its browser session](https://github.com/wekan/wekan/commit/bd6b00c5f437237a3cab8bf7d51172d948e45462). Thanks to xet7.
- [The attachment browser workflow gets the time it needs](https://github.com/wekan/wekan/commit/333928f123f9dd061042c8b18b0e44663dc76d04). Thanks to xet7.

**WeLite boards and sessions** - export links and session revocation.

- [Both export links on the board](https://github.com/wekan/wekan/commit/075e6dbe730291543c8a384ce58429167976741c). Thanks to xet7.
- [Revoking one browser session](https://github.com/wekan/wekan/commit/e30c439fa7f4e82bb2f4f949513aa1fcc4287953). Thanks to xet7.

**WeLite right-to-left captions** - Arabic table captions read in their own
direction.

- [People table captions](https://github.com/wekan/wekan/commit/f1fe22ac16254fa3d7f14df6c09dd3f250c7d61a). Thanks to xet7.
- [Regional Arabic People table captions](https://github.com/wekan/wekan/commit/8c1152f23468e76d07c964b5f1358900372c8248). Thanks to xet7.
- [Arabic webhook field captions](https://github.com/wekan/wekan/commit/6f7292cffdfb42a7accf4955735bbd8a43d4472a). Thanks to xet7.
- [Regional Arabic attachment captions](https://github.com/wekan/wekan/commit/ba9504d6db8dbd2adf8e72b98cb10c991a379cda). Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.15 2026-11-18 WeKan ® release

**In short:** **RaceBleed** is fixed: deleting a card while somebody moves it
to another board no longer destroys its checklists, comments and attachments
while the card itself survives there, and a member deleting a card that was
just moved keeps their account. REST handlers now answer **404, not 500**, for
a swimlane, user or board that is not there.

This release fixes the following CRITICAL SECURITY ISSUE of [RaceBleed](https://wekan.fi/hall-of-fame/racebleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c7a496c9cfd8f30e5bda16515eedeaa2ec80dc65">A card's children are destroyed only for a card whose own removal happened</a>. Thanks to xingmuse and xet7.</summary>

[GHSA-3vjg-3p4q-8fwh](https://github.com/wekan/wekan/security/advisories/GHSA-3vjg-3p4q-8fwh),
CWE-367. The REST card delete looked the card up on the board the caller was
authorised for, destroyed its checklists, checklist items, comments,
attachments and subcards by card id, and removed the card itself last, keyed
on that board and list. A move to another board landing in between left the
card alive on a board the deleter cannot read, stripped of every child, with
both requests answering 200. Every hooked removal had the same shape:
collection-hooks runs `Cards.before.remove`, where the cascade was, and then
removes by the caller's original selector - a swimlane, a delete batch, a
parent - which a moved card no longer matches. The custom-field link clean-up
did the same to the cards linked to it.

The card document is now the claim (`models/lib/claimedCardRemoval.js`): the
single and bulk REST deletes remove the card first and destroy its children
only when that removal matched, and the hooked removals cascade from
`Cards.after.remove`, only for a card that is really gone. A list deletion
removes a card only while it is still in that list, and the REST board move
that loses to a delete is a 404 instead of a 500.

A delete that lost the race, or arrived after the card was moved away from
the named board, is refused and shows in Admin Panel / Problems as RaceBleed
(`authz.card-delete-race`, medium). It never disables the account: a stale
view is not an attack, and PurgeBleed's critical record used to disable a
member who deleted a card somebody had just moved.
`tests/claimedCardRemoval.test.cjs` replays the reported race and scans
`server/` for any cascade before or without the card's removal;
`tests/playwright/specs/race-bleed.e2e.js` races twelve moves against
deletes and checks that a surviving card always keeps its checklist.

</details>

and fixes the following bug:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/baaeea27e3dc6083b5d6a39d5b44a4e6d26ca088">REST API: a handler's not-found error is a 404, not a 500</a>. Thanks to xet7.</summary>

`httpStatusForError` knew only `NotFound`, while about two hundred throw sites
spell it Meteor's way - `not-found`, `board-not-found`, `user-not-found` and
the rest. So deleting a missing swimlane, or adding a board member nobody is
called, answered 500 "Internal server error" on a real server, though the
unit test, which stubs the helper, saw the 404. Any name that is or ends in
`not-found` is now a 404 with its message; anything unknown is still a 500
carrying no detail. `tests/restNotFoundStatus.test.cjs` runs the real helper
and fails on a spelling it would not map.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.14 2026-11-16 WeKan ® release

**In short:** a **checklist folded on a minicard** stays folded, and every
profile preference survives a reconnect. The **card shortcuts** open only their
popup, **one shared list header row** really hides the other swimlanes'
headers, and the editors no longer show "comment-placeholder" after the
**i18next 27** update. **Deleting a card** keeps its attachments recoverable.

This release fixes the following bugs:

**Minicards** - folding a checklist, and the preferences it is stored with.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b05972c4c88e108526c85ad3598867d781395e98">A checklist folded on a minicard stays folded: no publication sends the current user a partial profile</a>. Thanks to mimZD and xet7.</summary>

The fold was stored, and half a second later the checklist unfolded again
([#6919](https://github.com/wekan/wekan/issues/6919)). DDP merges only
top-level fields, and Meteor re-runs named subscriptions before the accounts
publication of the whole profile on every login, a reconnect included.
`userDesktopDragHandles` and ten other publications sent the current user a
few `profile` fields; when one won, the client's profile shrank to them until a
reload and every preference in it went back to its default -
[#6691](https://github.com/wekan/wekan/issues/6691) had found the same for the
board view. The drag-handle preference is now published under its own field,
and the others leave the current user out (`server/lib/notCurrentUser.js`).
`tests/noNarrowProfileForCurrentUser6919.test.cjs` finds every such query; the
browser spec folds checklists in Persian after a page load and a reconnect, and
24 of 24 reconnect runs pass where 4 of 24 unfolded before.

</details>

**Keyboard shortcuts** - what `d`, Shift+M and Shift+C open.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/138f727ebbfc30d395fbcfa18ca244e58abe91d7">Card shortcuts open only their popup, next to the minicard or the card menu</a>. Thanks to mimZD and xet7.</summary>

On a hovered minicard, `d`, Shift+M and Shift+C opened the card first, and
Move / Copy went through the card's hamburger menu as well
([#6924](https://github.com/wekan/wekan/issues/6924)). Now only the Due date,
Move card or Copy card popup opens, next to the minicard, and the card stays
closed; on an opened card Move / Copy no longer show the menu first.
`client/lib/cardShortcutPopup.js` allows exactly what a click on the rendered
control would, and `tests/cardShortcutPopup.test.cjs` ties each rule to that
template condition; the browser specs check a non-admin and disabled shortcuts
open nothing.

</details>

**Swimlanes** - one shared list header row.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/39ee1d9512ef0c5c5aec94fe9842c00c7b00da1d">One shared list header row hides the other swimlanes' list headers</a>. Thanks to mimZD and xet7.</summary>

The hiding rule was a plain `display: none`, which loses to the desktop list
header layout's `display: block !important`, so every swimlane kept its headers
and the setting's own browser spec failed. It is `!important` now and outranks
those rules; `tests/sharedListRow6902.test.cjs` checks that against every
`!important` header display rule in the client CSS.

</details>

**Translations** - what a string that is empty on purpose shows.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/79676b3790e4b69fc43e61dcd4379eabe389fae0">An empty translation shows nothing, not its key: no "comment-placeholder" in the editor</a>. Thanks to brlin-tw and xet7.</summary>

i18next 27 ([#6915](https://github.com/wekan/wekan/pull/6915), in v13.13)
changed `returnEmptyString` to default false, so an empty translation falls
back like a missing one - and since the English value is empty too, to its
key. v13.13's notes said it would fall back to English; that was wrong. The
description and comment editors showed the text "comment-placeholder"
([#6921](https://github.com/wekan/wekan/issues/6921)), and eight Blockly
suffixes showed their keys. `TAPi18n.init()` sets `returnEmptyString: true`
again; no language has an empty value where English has text, so nothing that
should fall back to English goes blank. lld, lb, haw and sc had text for the
empty English source and are empty like the other languages.
`tests/i18nEmptyString.test.cjs` runs the real `__()` with the options read
from `tap.js`, and fails without the fix on i18next 27.1.1; the mocha suite and
the description editor's Playwright spec check the placeholder is empty.

</details>

**Attachments** - what happens to the files when a card is deleted or an upload
is renamed.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7875220470de22f8ca5e5488ed58fe4b1c00f11d">Deleting a card soft-deletes its attachments, so they and their history can be restored</a>. Thanks to AhmedLukman and xet7.</summary>

Removing a card looked for attachments by a top-level `cardId`, which normal
attachments do not have - they keep it in `meta.cardId` - so they stayed in
the active listings. They now go through the same recoverable deletion as the
attachment menu and the API: the bytes stay, the history row and the
deleteAttachment activity are written, and the files leave the active lists.
Legacy records with a top-level `cardId` keep the hard purge.
`tests/cardAttachmentCascade.test.cjs` covers single and bulk REST deletion,
refused requests and already deleted files.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1051265fc893fe11abb3d5f447387b560f5ea98a">A browser test deletes a card with attachments through More, Delete and its confirmation</a>. Thanks to AhmedLukman and xet7.</summary>

`tests/playwright/specs/rest-card-attachment-cascade.e2e.js` uploads
attachments in the browser, deletes their card from the card menu and checks
the deletion markers, the history, the active list, the kept bytes and the
other card's attachments.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/628a69c0861c20fbcb612b182ef70b7899b739fa">A renamed upload keeps its file paths consistent before it is validated</a>. Thanks to AhmedLukman and xet7.</summary>

When an upload's name was corrected to match its real file type, the paths
were written to the database without waiting, and the in-memory file object
kept the old ones, so the next write could put the old path back and the
validator read a path that no longer existed. `rename()` now updates the
original and version paths in memory and in the record, including the
top-level path the validator reads, and the upload hooks and the
file-extension migration wait for it. `tests/attachmentRenamePaths.test.cjs`
and `attachment-upload-rename.e2e.js` cover failures, ordering, the original
bytes and the card display.

</details>

and hardens the following security check:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/040d853c8e7c0092db264527497a7dd8878dc248">RedirectBleed: a direct client write of an avatar URL follows the avatar dialog's rule</a>. Thanks to meifukun and xet7.</summary>

meifukun's five reports from July, fixed then
([RedirectBleed](https://wekan.fi/hall-of-fame/redirectbleed/),
[SourceBleed](https://wekan.fi/hall-of-fame/sourcebleed/),
[LiveBleed](https://wekan.fi/hall-of-fame/livebleed/),
[CasRaceBleed](https://wekan.fi/hall-of-fame/casbleed/),
[MetricsBleed](https://wekan.fi/hall-of-fame/metricsbleed/)), arrived as
GitHub security advisories and were checked again against the current code:
all five are fixed, and `tests/securityMeifukun.test.cjs` pins each. One gap
was found: `setAvatarUrl` refuses `javascript:`, `file:` and the rest, but the
Users allow rule permits every `profile.*` field, so a browser-console
`Users.update` stored what the method refuses. It was not exploitable - the
URL is shown only as an image and fetched only through `fetchSafe` - but the
rule is now `models/lib/avatarUrlScheme.js`, shared by both avatar methods and
a Users deny rule that records the refused write in Admin Panel / Problems.
`tests/avatarUrlDirectWrite.test.cjs` covers every way to write the field and
checks no client code writes it directly.

</details>

and has the following developer-facing fixes:

- [The FreeBSD bundle guard follows dependabot's freebsd-vm 1.6.0, which node-patches now uses too](https://github.com/wekan/wekan/commit/5ec3aaf85f4edb605a7180593486c5edd24ac713).
  Thanks to xet7.
- [build.sh's source test mode starts again: meteor/package/main imports resolve](https://github.com/wekan/wekan/commit/495a6faa634841f5fbb50fc1dd535d42f1c57a52).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.13 2026-11-15 WeKan ® release

**In short:** **Copy Checklist** and the other destination pickers list the
cards of a large board again: a board that loads its cards lazily used to leave
the card dropdown empty. Dependabot's updates, among them **i18next 27** and
the **mongodb** driver 7.8.0, are kept.

This release fixes the following bugs:

**Destination pickers** - choosing a card on another board, whatever that
board's size.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e46d7a2376ebfa413cec15843d8b7fc374fe63e0">The card dropdown lists the cards of a board that loads lazily</a>. Thanks to ChrisMagnuson and xet7.</summary>

Copy Checklist's card dropdown stayed empty for a board with more cards than
the lazy-loading threshold (Card loading `auto` above 500 cards, or `lazy`),
however long one waited ([#6917](https://github.com/wekan/wekan/issues/6917)).
The pickers read the chosen board's cards from the `board` publication, which
ships no cards for a lazy board, and a picker opens no list that would fetch
its own window. A new `destinationCards` publication ships the titles and
places of one list's cards in one swimlane, or of the whole board for the
parent-card picker, whatever the card-loading mode. It is scoped like the
other card publications: the board must be readable, and an assigned-only
member gets only the cards assigned to them.

Copy / Move checklist, Copy checklist from a template card, Move / Copy card,
Link card and the parent-card picker use it. Done waits until the chosen
list's cards are there, a remembered card is checked against them rather than
against the board, and the open board's Filter no longer empties the
destination list. `tests/destinationCards6917.test.cjs` runs the publication
on a 1,144-card board, an assigned-only member, an unreadable board and bad
arguments, and the dialog with a lazy destination;
`tests/playwright/specs/copy-checklist-lazy-destination.e2e.js` copies a
checklist to such a board.

</details>

and updates the following dependencies:

- **mongodb 7.7.0 → 7.8.0** — the server's database driver
  ([#6914](https://github.com/wekan/wekan/pull/6914)).
- **i18next 26.5.11 → 27.1.1** — translations
  ([#6915](https://github.com/wekan/wekan/pull/6915)). 27 changes defaults
  WeKan does not rely on: it sets `fallbackLng` and `cleanCode` itself, turns
  escaping off and registers sprintf on its own instance. An empty translation
  now falls back to English instead of showing nothing.
- **sanitize-html 2.18.1 → 2.18.2** — HTML sanitizing
  ([#6916](https://github.com/wekan/wekan/pull/6916)).
- **puppeteer 25.15.0 → 25.17.0** and **@typescript-eslint/parser 8.72.1 →
  8.72.2** — tooling ([#6909](https://github.com/wekan/wekan/pull/6909),
  [#6913](https://github.com/wekan/wekan/pull/6913)).
- **@playwright/test 1.64.1 → 1.65.0** in tests/playwright — the browser tests
  ([#6911](https://github.com/wekan/wekan/pull/6911)).
- **softprops/action-gh-release 3.0.3 → 3.0.4**, **docker/login-action 4.7.0
  → 4.8.0**, **azure/setup-helm 5.0.1 → 5.1.0** and **vmactions/freebsd-vm
  1.5.9 → 1.6.0** — CI ([#6912](https://github.com/wekan/wekan/pull/6912),
  [#6910](https://github.com/wekan/wekan/pull/6910),
  [#6908](https://github.com/wekan/wekan/pull/6908),
  [#6907](https://github.com/wekan/wekan/pull/6907)).

Thanks to dependabot.

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.12 2026-11-14 WeKan ® release

**In short:** WeKan is updated to **Meteor 3.6.1**, whose DDP server refuses
malformed messages without stalling the connection. **One shared list header
row** now shows the same lists in every swimlane, scrolling together, and
**Shift+M** and **Shift+C** open Move Card and Copy Card. Those popups
remember the swimlane and list, not only the board. The embedded-engine
benchmark takes **OpenTelemetry 1.47.0** for a Dependabot alert. A **REST
API** write that changes nothing answers 404, and a card deletion naming the
wrong list no longer strips the card's checklists (**ListLockBleed**).

This release fixes the following CRITICAL SECURITY ISSUE of [ListLockBleed](https://wekan.fi/hall-of-fame/listlockbleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d4c0d3e8820520dc7b1cef5b27e9e3e516a67158">A card deletion naming another list no longer strips the card's checklists and comments</a>. Thanks to xet7.</summary>

A follow-up to [ListLockBleed](https://wekan.fi/hall-of-fame/listlockbleed/),
[GHSA-4734-8vrg-8j3w](https://github.com/wekan/wekan/security/advisories/GHSA-4734-8vrg-8j3w),
found while checking the REST deletions. `DELETE
/api/boards/:boardId/lists/:listId/cards/:cardId` found the card by board
alone, removed its checklists, checklist items, comments and attachments, and
only then removed the card by board AND list. With the wrong list id the card
stayed, emptied, and the reply was 200. Only the list in the URL was asked
whether the caller may write, so a member a list refuses could strip the cards
of that list by naming one they may write. The card now has to be in the named
list, its own list is asked as well, and the refusal shows in Admin Panel /
Problems as `authz.list-locked`. `tests/restWriteRoutes404.test.cjs` runs the
handler on both cases and requires the list check before anything is removed,
and `tests/playwright/specs/rest-write-routes-404.e2e.js` checks that the
checklist survives against a running server.

</details>

and adds the following new features:

**Keyboard shortcuts** - the opened card's actions from the keyboard.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8508c150159a160b13b45505065ff788171a777a">Shift+M opens Move Card and Shift+C opens Copy Card</a>. Thanks to mimZD and xet7.</summary>

They act on the opened card, or on the hovered or selected minicard, which is
opened first, as the `d` due date shortcut does. They click the card's menu and
then its Move Card or Copy Card item, so the menu's permissions decide: Move
Card for board admins, Copy Card for everyone who is not a Worker, and a menu
without the item is closed again. Shift keeps them apart from `m` (assign
yourself) and `c` (archive). The shortcut list names them with the already
translated popup titles. User-defined shortcuts, also asked in
[#6904](https://github.com/wekan/wekan/issues/6904), are not part of this.
`tests/cardMenuKeyboardShortcut.test.cjs` drives the DOM logic, and
`tests/playwright/specs/move-copy-keyboard-shortcut-6904.e2e.js` presses the
keys, with shortcuts off, while typing, and as a non-admin member.

</details>

**The Swimlanes view** - swimlanes that share their lists.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/67321dcb6c071e1d9572fb79eb344349178d274b">One shared list header row shows the same lists in every swimlane, scrolling together</a>. Thanks to mimZD and xet7.</summary>

The setting only hid the list headers of every swimlane but the first, while
each swimlane kept lists of its own: a new swimlane showed no lists, and each
scrolled sideways alone. With it on, every swimlane now shows all of the
board's lists under the one header row, as swimlanes were before lists belonged
to one, and the swimlanes scroll sideways together. Each list still holds the
cards of the swimlane it is shown in. Nothing is written to a list or a card, so
on a board whose swimlanes have different lists, turning the setting off shows
each swimlane's own lists again. While it is on, a list dropped under another
swimlane is reordered, never moved there with its cards.
`tests/sharedListRow6902.test.cjs` and
`tests/playwright/specs/shared-list-row-6902.e2e.js` cover it, with the setting
on and off.

</details>

and updates the following dependencies:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ed5a5349416b4e6374b2c19db480b64a7793a25c">Updated to Meteor 3.6.1</a>. Thanks to xet7.</summary>

`meteor update --release METEOR@3.6.1` refused it: Meteor 3.6.1 pins
`ddp-server@~3.6.1`, and WeKan's local fork of ddp-server was `3.6.0_1`. Of
WeKan's six Meteor package forks only ddp-server changed in 3.6.1, so its fixes
are rebased onto the fork, now `3.6.1_1`: a non-string unsubscription or ping
id is refused, and a protocol handler that throws synchronously is contained.
The packages 3.6.1 bumps (accounts-base, accounts-express, accounts-password,
minimongo, mongo, webapp) are updated. WeKan configures OAuth services on the
server only, so 3.6.1's restriction on client-side configuration does not
affect it. `tests/meteor353SecurityFixes.test.cjs` checks that the fork carries
the 3.6.1 fixes and not the older code.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0566bf6ec8b40d5af0ff317babfced7072424d57">The Docker image and the Bun build use Meteor 3.6.1</a>. Thanks to xet7.</summary>

The Dockerfile's `METEOR_RELEASE` is `METEOR@3.6.1`. The Bun build refused
every release but 3.6; its patch applies unchanged to 3.6.1, so 3.6.1 is
accepted, pinned to its commit.

</details>

- [OpenTelemetry 1.42.0 → 1.47.0 and klauspost/compress 1.18.7 → 1.20.2 in the Go module of the embedded-engine benchmark](https://github.com/wekan/wekan/commit/e0eb6c64dbd976f2195563c59f169e8129855a34).
  Dependabot alert \#189: attribute values made of U+FFFD runes bypassed
  OpenTelemetry's AttributeValueLengthLimit. govulncheck then reported
  GO-2026-6865 in klauspost/compress. A test holds every `go.mod` at or above
  these floors.

Thanks to dependabot.

and fixes the following bugs:

**Move and Copy card** - where their popups open.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4b47ec81a72aab1ab8d04addb8fe41b7e0181841">They open on the swimlane and list chosen last time, not only the board</a>. Thanks to mimZD and xet7.</summary>

The remembered swimlane and list were checked right after subscribing to the
remembered board. For another board than the open one, its swimlanes and lists
had not arrived yet, so both were reset to the first. That check now waits for
the board's documents, and falls back to the first swimlane and list only when
a remembered one is really gone. The same picker serves Move, Copy, Link to
board, Copy many and Convert checklist item to card.
`tests/moveCopyRemembersDestination6901.test.cjs` runs the real dialog classes
with the board arriving later, and
`tests/playwright/specs/move-copy-remembers-destination-6901.e2e.js` opens the
popups.

</details>

**The Swimlanes view** - the swimlane resize line.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8d5109b4b9d7f77205e6ba8fd2c581a9c4720ff9">The resize line reaches the right edge of a swimlane scrolled to the right</a>. Thanks to mimZD and xet7.</summary>

The swimlane-height resize handle sits in the swimlane that scrolls its row of
lists sideways, so it moved with the lists, and after scrolling right by some
distance the line stopped that far short of the right edge. It now follows the
swimlane's scroll, in right-to-left boards too.
`tests/swimlaneResizeHandleScroll6903.test.cjs` and
`tests/playwright/specs/swimlane-resize-handle-scroll-6903.e2e.js` measure it.

</details>

**The REST API** - a write that changes nothing answers 404, not 200.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2733c8ba65342dfb0bdfbbddff03f366ac8756b5">Deleting a missing or another board's custom field answers 404</a>. Thanks to AhmedLukman and xet7.</summary>

`DELETE /api/boards/:boardId/custom-fields/:customFieldId` answered 200 for a
custom field that did not exist, was on another board or was already deleted,
because the removal matched nothing and the reply did not check. It now answers
a JSON 404 when the board-scoped removal removes nothing. A real deletion still
answers 200 and its `before.remove` hook still clears the field's values from
the board's cards and its activities. `tests/restCustomFieldDelete.test.cjs`
and `tests/playwright/specs/rest-custom-field-delete.e2e.js` cover it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cefb6771cbde23a468526448256f182309c49bdd">Deleting a missing dropdown item of a custom field answers 404</a>. Thanks to AhmedLukman and xet7.</summary>

`DELETE` of a custom field's `dropdown-items/:dropdownItemId` answered 200
even when the custom field had no such item, because `$pull` of an absent item
still matched the field. The update now also requires the item
to be in `settings.dropdownItems`, so a missing item, a missing field or one
on another board matches nothing and answers a JSON 404, while the other items
stay. `tests/restDropdownItemDelete.test.cjs` and
`tests/playwright/specs/rest-dropdown-item-delete.e2e.js` cover it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d4c0d3e8820520dc7b1cef5b27e9e3e516a67158">The other deletions and updates of a record that is not there answer 404 too</a>. Thanks to xet7.</summary>

The two entries above, and the integrations of #6900, had siblings that
answered 200 for a change that changed nothing: deleting a swimlane, a list
(also an already deleted one), a card, a card dependency or a board domain
that is not there; renaming a missing custom field (even with an empty body),
adding dropdown items to one, or renaming a dropdown item it does not have;
updating a dependency the card does not have; adding or removing a member of a
board that does not exist, a user that does not exist, or a user who is not a
member; and deleting the tokens of a user that does not exist. Each now looks
the record up on its board first and answers a JSON 404, and removing a
board's last admin, which the board keeps, answers 409. Member removal also
deactivates the active entry of a user listed twice, not the first entry. An
unknown token of a real user still answers 200: revoking makes sure it is
gone. `tests/restWriteRoutes404.test.cjs` runs each handler with the record
missing and present, and fails for any REST write in `server/` whose path
names a record and that has no 404; `DELETE /api/boards/:boardId` was already
right, because the board check answers 404 first.
`tests/playwright/specs/rest-write-routes-404.e2e.js` replays them against a
running server.

</details>

and has the following developer-tooling fixes:

**Meteor skills** - the agent notes for installing Meteor.

- [The npm fallback install works with npm 12](https://github.com/wekan/wekan/commit/58273d2bf8d43bcd6a4ef36cbe657668db1569aa). Thanks to xet7.

**Node test suites** - tests that depended on the machine.

- [The npmRetry test passes with a localized bash](https://github.com/wekan/wekan/commit/e95596c3b0c7a71f235bcb16ba2b703c41fc648e). Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.11 2026-11-13 WeKan ® release

**In short:** The **file-integrity scan** stops reporting attachments and
avatars that WeKan deleted itself as missing, which had buried real
**StorageBleed** findings under thousands of false ones. The recurring-checklist
reset no longer scans every **checklist** on each tick. In the **REST API**, a
refused custom-field update changes nothing, ownership transfer takes only the
boards the user administers, and deleting a missing integration answers 404.

This release fixes the following bugs:

**The file-integrity scan** - what it counts as a missing file.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ec05ff008928c390b11fec225c564f2dd209ec7f">Files WeKan deleted or moved itself are no longer reported missing</a>. Thanks to Raymond-Voogt and xet7.</summary>

The daily scan keeps one baseline per stored file and reports a baseline whose
file is gone as a StorageBleed. Nothing removed a baseline, so every attachment
the retention purge deleted and every avatar a user deleted was reported on
every run from then on; one finding was folded 1,164 times. The baseline is now
forgotten in Attachments and Avatars `onAfterRemove`, for every version path.
That is the retention purge's path: Meteor-Files unlinks the files itself after
that hook, without going through the store strategy. It is also forgotten in
the filesystem strategy's `unlink()` and, for the old path, in `rename()`. A
file that vanishes any other way keeps its baseline and is still reported.
Baselines orphaned before this fix stay until removed, as
[#6898](https://github.com/wekan/wekan/issues/6898) describes.
`tests/integrityBaselineForgottenOnDelete.test.cjs` fails on a delete or rename
in the filesystem strategy that does not forget its baseline, and
`tests/playwright/specs/integrity-baseline-on-delete.e2e.js` deletes an avatar
in the UI.

</details>

**Database indexes** - the queries the background jobs make.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c37575f1faff4e8ca518c7eae0ba7e50d05c1fae">The recurring-checklist reset reads only recurring checklists</a>. Thanks to Raymond-Voogt and xet7.</summary>

The reset cron asks for every checklist with a `resetInterval` on each tick,
and with no index that read the whole collection (about 45,000 documents on the
reporting instance), shown as a collection scan on Admin Panel / Problems. A
partial index on `resetInterval`, like the one recurring cards got, holds only
the recurring checklists. `tests/checklistResetIndex.test.cjs` pins the index
and a selector that can use it.

</details>

**The REST API** - custom fields, ownership transfer and integrations.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a81ec6ecdfea8a0b0709d7c0cd463cfd051ca80f">A refused custom-field update leaves the whole field unchanged</a>. Thanks to AhmedLukman and xet7.</summary>

`PUT /api/boards/:boardId/custom-fields/:customFieldId` wrote each property
with its own update, so a refused `type` or `settings` left the name and flags
sent before it already saved. The properties are now saved in one board-scoped
update that the schema accepts or refuses as a whole. Authorization, the field
allowlist and the reply are unchanged. `tests/restCustomFieldUpdate.test.cjs`
and `tests/playwright/specs/rest-custom-field-update.e2e.js` cover both.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4b4db92a1b97eae43770e56082012073d87c4c9a">Ownership transfer takes only the boards the user administers</a>. Thanks to AhmedLukman and xet7.</summary>

`takeOwnership` selected boards where the user was a member and somebody, not
necessarily the user, was an administrator. The user and the administrator flag
are now matched on the same member, so a board where the user is an ordinary
member is left as it is. `tests/restOwnershipSelection.test.cjs` and
`tests/playwright/specs/rest-ownership-selection.e2e.js` cover it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ab685a7f6fe0450a31b9150a14b17b909933c86f">Deleting a missing or another board's integration answers 404</a>. Thanks to AhmedLukman and xet7.</summary>

`DELETE /api/boards/:boardId/integrations/:intId` answered 200 for an
integration that did not exist, was on another board or was already deleted,
because the removal matched nothing and the reply did not check. It now looks
the integration up on that board first, after the board-admin check, like PUT
and the activities routes, and answers the same JSON 404. Server errors still
answer 500. `tests/restIntegrationWriteRoutes404.test.cjs` and
`tests/playwright/specs/rest-integration-update.e2e.js` cover it, including
the board's webhook settings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a8e25952aa6b244b76891c3fa3cdc1779d35a78f">Ownership transfer finishes before it replies, and a deleted account leaves the board when removed</a>. Thanks to xet7.</summary>

`takeOwnership` called the async `changeOwnership()` without `await`, so the
reply was sent before the board changed and a failed update was an unhandled
rejection behind a 200. `Boards.removeMember` tested
`!ReactiveCache.getUser(id)`, which on the server is a Promise and always
truthy. Because of that, the branch that removes a member whose account was
deleted never ran there, and that member only lingered as inactive. Both
calls are awaited now. `tests/reactiveCacheNegatedAwait.test.cjs` fails on any
negated un-awaited `ReactiveCache` lookup in `server/` or `models/`.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.10 2026-11-13 WeKan ® release

**In short:** The release's **Snap Store** credential check bounds each
snapcraft install attempt, so a Snap Store that hangs no longer stops a release.

This release has the following developer-tooling fix:

**Release builds** - the snap jobs.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/560ff74a79f8c998bd0aa4fd63664155eecd5f28">Every snapcraft install attempt is bounded, and snap-auth-check has room for all five</a>. Thanks to xet7.</summary>

In the v13.09 release the Snap Store failed snap-auth-check's first two
snapcraft install attempts and then let the third hang with no output, until
the job's 10-minute timeout cancelled it - the retry never got its remaining
turns. Each `snap install snapcraft` in the release workflow now runs under
`timeout 180`, an attempt cut short is aborted (`snap abort --last=install`)
so the next one does not meet snapd's change still in progress, and
snap-auth-check's job timeout is 25 minutes, enough for all five attempts.
`tests/snapAuthPreflight.test.cjs` fails on an unbounded install, a retry
without the abort, or a job timeout that cannot hold five attempts.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.09 2026-11-12 WeKan ® release

**In short:** The release's **Snap Store** credential check retries installing
snapcraft, so one Snap Store timeout no longer stops a release.

This release has the following developer-tooling fix:

**Release builds** - the snap jobs.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/534646347c4b6467f539cb01171487d27fc7ddc7">snap-auth-check retries installing snapcraft, as the snap build job does</a>. Thanks to xet7.</summary>

The v13.08 release stopped in snap-auth-check before it asked the Snap Store
anything: the one `snap install snapcraft` timed out reaching api.snapcraft.io,
while the snap build job already retried five times. The check retries the
same way now, and when every attempt fails it says the store did not answer
rather than that SNAP_AUTH is wrong. `tests/snapAuthPreflight.test.cjs` fails on
any snapcraft install in any workflow without the retry.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.08 2026-11-12 WeKan ® release

**In short:** The **REST API** creates a card under the **parent** it is given,
and a refused **integration URL** no longer leaves the other fields of the same
update written. The **single-file** WeKan for **32-bit ARM** builds again, with
an i386 Node.js of the exact version its bundle embeds. A **GitHub CodeQL**
alert in the security alert download script is fixed.

This release fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ed19817433e14ef4f8cb7d9623f5d8b84a1794ff">The security alert download summary carries no secret scanning field, and kept secrets are owner-only</a>. Thanks to GitHub CodeQL and xet7.</summary>

Code scanning alert #604 (`py/clear-text-storage-sensitive-data`, CWE-312):
`releases/sec/download_github_security.py` wrote a secret scanning alert's type
name into `SUMMARY.md`. That was the type of the secret, not the secret, but
`SUMMARY.md` is never redacted, so it now names only the kind of finding and
points at `secret-scanning/`. With `--include-secret-values` the files that hold
the secrets are created readable by their owner only.
`tests/securityDownloadScript.test.cjs` pins both, and that no secret scanning
field reaches the summary. This is a maintainer tool, not WeKan's server, so
there is no attempt for Admin Panel → Problems to record.

</details>

and fixes the following bugs:

**The REST API** - creating cards and updating integrations.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/552950ed637d6ddeb486322e3c08dd61dbfc13dc">A card created with a parentId is created under that parent</a>. Thanks to AhmedLukman and xet7.</summary>

`POST /api/boards/:boardId/lists/:listId/cards` read `parentId` from the URL
parameters, which that route does not have, so the parent in the request body
was ignored: it was never stored, and the visibility check for the parent
(GHSA-jvv9-498p-hxrg) never saw it. It is read from the body now, as the bulk
endpoint does. A parentId that is not a string is refused with 400, and a parent
on a board the caller cannot see is still refused and recorded under
ParentBleed. `tests/restCardParent.test.cjs` and
`tests/playwright/specs/rest-card-parent.e2e.js` cover a stored parent, the
subtask it renders as, an empty parent and the refused requests.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1418cb8480e0ca13ccecc54290b16c36d40f82a6">An integration update with a refused URL changes nothing</a>. Thanks to AhmedLukman and xet7.</summary>

`PUT /api/boards/:boardId/integrations/:intId` wrote `enabled` and `title`
before it checked the new URL against the SSRF rules (GHSA-hc3x-hq3m-663q), so a
request whose URL was refused with 400 had already changed those two fields. The
URL is validated first now, like the delivery settings, and a refused request
leaves the integration as it was. `tests/restIntegrationUpdate.test.cjs` and its
Playwright spec pin the order.

</details>

and has the following developer-tooling fixes:

**Release builds** - the single-file executables.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c35c672ffb398b68be22f257087db28738eb4701">The 32-bit host Node.js of a single file is its bundle's exact version</a>. Thanks to xet7.</summary>

The v13.07 single files for armhf, armv6 and armv7 stopped on "The bundle's
Node.js is v26.13.0 but this is v26.13.1". A 32-bit target's SEA blob is
written by a 32-bit Node.js, and `.github/workflows/single-file.yml` borrowed
the i386 bundle's. Each bundle takes the newest Node.js of the pinned major its
platform has, so i386 had v26.13.1 while 32-bit ARM had v26.13.0. The host is
now resolved with `releases/resolve-node-source.sh` at the target bundle's exact
version, checked against its published SHA256, and refused unless it reports
that version. `tests/singleFile.test.cjs` pins all three, and that the host is
never taken from another platform's bundle.

</details>

**Browser tests** - what a spec may rely on from the database.

- [list-sync-estimate's checkbox test no longer depends on the order an index returns](https://github.com/wekan/wekan/commit/af76406d127568b45b0e76659160a8821cdf00a2) -
  it expected an unsorted find of activities in insertion order, which
  activities' cardId/createdAt index returns newest first. Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.07 2026-11-12 WeKan ® release

**In short:** **ListLockAttachBleed** is fixed: when a list refuses a role
write access, that refusal now also holds for the attachment API's upload,
delete, copy and move. **CodeQL** alerts #602 and #603 in the tests are fixed,
**fast-xml-parser** is updated to 5.12.0, spent time reads as a **duration**,
the **indexes** that LDAP, card member and History queries need are added, and
Admin Panel → Problems can **Clear** resolved problems, which also age out.

This release fixes the following CRITICAL SECURITY ISSUE of [ListLockAttachBleed](https://wekan.fi/hall-of-fame/listlockattachbleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7bb3e13ba9">A list that refuses a role write access refuses its attachment API writes too</a>. Thanks to Furkan Derse and xet7.</summary>

[ListLockAttachBleed](https://wekan.fi/hall-of-fame/listlockattachbleed/),
reported by email, its GitHub security advisory awaited. A board admin can
refuse a role write access in one list (#4527). The card screen, the card and
checklist routes ([ListLockBleed](https://wekan.fi/hall-of-fame/listlockbleed/))
and the interface's own attachment upload and delete applied that refusal, but
the attachment API's upload, delete, copy and move, over REST and DDP, asked
only for board write access and the assigned-only rule. A normal member the
list refused could therefore still add and remove files on its cards. Every
attachment write that names a card now asks that card's list as well, a move
both the card it takes the file from and the one it puts it on, and the
refusal shows in Admin Panel / Problems. `tests/listLockAttachments.test.cjs`
runs the guard on the reported case and fails on any attachment write in the
tree without the list check beside it, and
`tests/playwright/specs/list-lock-attachments.e2e.js` replays the writes
against a running server.

</details>

and fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2b65b713a0f7b537efbe7c25bb2a8b454e88d1ad">Alerts #602 and #603: no test hands a path to a shell at all</a>. Thanks to GitHub CodeQL and xet7.</summary>

The fix for #601 passed the paths to `bash -c` as arguments rather than
pasting them into the script, but that still hands a temporary path to a
shell, and CodeQL flagged the two umask tests in
`tests/releaseDownloads.test.cjs` again. They no longer use a shell: `fetch.sh`
runs as bash's program with its arguments, the umask is set on the test's
process and put back, and `chmod +x` is `fs.chmodSync`. The macOS sandbox test
runs its probes as programs the same way. The guard now refuses any value
given to a shell's `-c` script as an argument, and found one more test doing
it. The findings were in tests, not in WeKan, so there is no attempt to show in
Admin Panel → Problems.

</details>

and adds the following new features:

**The Admin Panel** - Problems, and getting rid of the ones that are handled.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fefabbf113">Problems has a Clear button, and resolved problems age out on their own</a>. Thanks to Raymond-Voogt and xet7.</summary>

The problem streams were append-only, and Acknowledge only reset the "new"
count, so a problem fixed long ago stayed in the table and buried the ones
that are live now. Clear, beside Acknowledge, calls the admin-only
`clearEventLog`, which deletes the checked streams' events up to now and
stamps the acknowledgement. Anything that happens after the click shows as a
new problem again, and an unknown stream in the list clears nothing. A daily
sweep, claimed once per installation, deletes events older than
`EVENTLOG_RETENTION_DAYS` (default 90, `0` keeps them forever); a recurring
problem's folded row keeps a recent date, so it stays. The setting is listed
on every platform and in the Helm chart, and the button is translated to
every language. `tests/eventLogClearAndRetention.test.cjs` runs Clear and the
sweep on an in-memory log, including a non-admin and an unknown stream, and
`tests/playwright/specs/problems-clear.e2e.js` clears one stream in the UI.

</details>

and updates the following dependencies:

- [**fast-xml-parser 5.11.2 → 5.12.0**](https://github.com/wekan/wekan/commit/a76a19058ac896651ccd30311c36d48ee7f47b86) — Dependabot
  alert #188: with `stopNodes`, an unterminated stop node made it rescan the
  rest of the input from every `<`, O(n²) CPU; 5.12.0 stops at the first
  failed scan. Brought in by the Azure and Google Cloud storage clients. The
  test runs the alert's input and pins that no lockfile resolves an older
  version. Thanks to dependabot.

and fixes the following bugs:

**Cards** - how spent time is shown.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e8e8039ff">Spent time is shown as a duration, not decimal hours</a>. Thanks to brlin-tw and xet7.</summary>

A card's spent time showed as decimal hours, such as 12.58 for 12 hours and
35 minutes, which reads as twelve hours and fifty-eight minutes. The badge now
shows `12h35m`, drops the units that are zero and shows `0s` for none, and its
tooltip keeps the rounded hours. The formatter is
`models/lib/spentTimeFormat.js`; `tests/spentTimeFormat.test.cjs` pins it and
`tests/playwright/specs/spent-time-format.e2e.js` checks the badge. A
follow-up imports it the way `cardTime.js` imports its other helpers.

</details>

**The REST API** - logging out a token.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd59a8ff70">POST /api/deletetoken waits for the token to be deleted before answering</a>. Thanks to AhmedLukman and xet7.</summary>

`Accounts.destroyToken` was not awaited, so the route answered success before
the token was gone, and a failed database write never reached its error
handler. It is awaited now. `tests/restTokenRevocation.test.cjs` covers a slow
and a failed deletion, authorization and session isolation, and
`tests/playwright/specs/rest-token-revocation.e2e.js` logs a browser out with
it.

</details>

**Database indexes** - the queries that scanned whole collections.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8dc77a89d8">Indexes for the LDAP id, cards' assignees and members, and History by entity and hash</a>. Thanks to Raymond-Voogt and xet7.</summary>

An LDAP login looked the user up by `services.ldap.id`, a member's cards were
found by `assignees` and `members`, and the card history by entity and by
integrity hash, all without an index, so each scanned its whole collection on
a large installation. They have indexes now, the LDAP one sparse.
`tests/cardQueryIndexes.test.cjs` and `tests/ldapAndHistoryIndexes.test.cjs`
pin them.

</details>

and adds the following developer tool:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/801f8956fe813a5da0264abf660c18363d2d3bc2">releases/sec downloads a GitHub organization's Security and quality alerts with gh</a>. Thanks to xet7.</summary>

`releases/sec/download-github-security.sh wekan` saves every repository's
Dependabot, code scanning, secret scanning and security advisory alerts to
`.tools/log/sec/<organization>/<repository>/<YYYY-MM-DD_HH-MM-SS>/`, a
directory per kind with a file per alert and a `SUMMARY.md` of the open ones.
It runs the GitHub CLI outside the editor's sandbox, where `gh` and its login
are, so the alerts can be read and fixed from the files inside it. A kind
GitHub does not answer is recorded with its reason, a secret scanning alert's
secret is redacted unless asked for, and a name that is not a GitHub name is
refused before it becomes a path. The test runs it against a stand-in `gh`;
see `releases/sec/README.md`.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.06 2026-11-11 WeKan ® release

**In short:** **CodeQL** alert #601 in a test is fixed, with two more tests
that had the same fault. A card's **overtime** set through the REST API is
saved where WeKan reads it, and cards that lost it before are repaired at
startup. Card **members and assignees** whose account was deleted can be removed
and added without an error, and clearing a card **date** no longer passes as a
date set to the rules, the due date count and the activity feed.

This release fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d482856e03129d13c6e171a1503db60d81ab5166">Alert #601: no path is quoted into a bash -c script in the tests</a>. Thanks to GitHub CodeQL and xet7.</summary>

CodeQL flagged a shell command built from environment values (CWE-78, CWE-88)
in `tests/npmRetry.test.cjs`, whose `bash -c` script pasted a temporary path
and a checkout path into its text with `JSON.stringify` - JSON's quotes are not
the shell's, so a path with `$(`, a backtick or `$` would change the command.
The paths now go in through the environment. The guard written for alerts #549
and #550 only knew `source "${path}"`; it now refuses any value quoted into a
`-c` script across the tests, and found the same fault in
`tests/releaseDownloads.test.cjs` and `tests/macosSandbox.test.cjs`, fixed as
arguments. The finding was in tests, not in WeKan, so there is no attempt to
show in Admin Panel → Problems.

</details>

and fixes the following bugs:

**Card overtime** - what the REST API stores, and what it stored before.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f74ef4c40d85f9f6b91b8f4ecfc7372f67d32100">A REST card update saves isOverTime as the isOvertime WeKan reads</a>. Thanks to AhmedLukman.</summary>

A PUT with `{"isOverTime": true}` answered 200 and changed nothing anyone saw:
the handler wrote `isOverTime`, while the schema and the UI use `isOvertime`.
The request keeps its spelling and the validated value is stored in
`isOvertime`. Browser tests cover JSON and form updates, the stored value, a
REST read, the open card, a reload, and refused requests, and the unit test
pins the stored field name.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/569756b66c0fc3e3c41aba93fa8311994c6fa754">An isOverTime stored before that fix becomes isOvertime at startup</a>. Thanks to AhmedLukman and xet7.</summary>

Every overtime set through the API since `b895e61237` was stored under the
field nothing reads. The `card-overtime-field` schema upgrade step folds it
into `isOvertime` where the card has none, keeps the value the UI already shows
where it has both, and removes the stray field - version-gated and idempotent
like the steps beside it. Tests pin the fold, the precedence and a second pass
finding nothing; as negatives, no work on cards without the field, and no
server code writing `isOverTime` into a card.

</details>

**Card members and assignees** - people whose account is gone.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5e9d1cb6305a4a36f9cb890c7f5babb66ab4f43c">A member or assignee whose account is gone can be removed</a>. Thanks to AhmedLukman.</summary>

Removing a card member or assignee whose user account no longer exists read
`user.username` of nobody and answered HTTP 500, so the stale id could never
be removed. Both removal hooks now look the name up safely and still record
the removed id. Unit tests run the real hooks, and browser tests cover stale,
missing, repeated and normal removals with their authentication and scope
checks.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/32590ee7ab89b41ca6f764a58ec0f43d56d48ab8">Adding a member or assignee whose account is gone no longer throws either</a>. Thanks to AhmedLukman and xet7.</summary>

The joining halves of the same two hooks had the same read. The REST route
checks the user before adding, but a client update, a copied or imported card,
or a rule can still add such an id. Both now record the join with the id and
no username. Tests run the real hooks, and a tree-wide test finds no
`const x = user.field;` straight after a user lookup without a guard.

</details>

**Card dates** - what clearing a date records.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/50334816caf227237124b007c53a467c8f6919f5">Clearing a card date no longer passes through the timing hook as a date set</a>. Thanks to xet7.</summary>

The hook that records `a-dueAt` and the other date activities read
`modifier.$set[field]` for every date update, but clearing a date sends only a
`$unset`: without a `$set` the hook threw, and with one beside it an `a-dueAt`
without a value was written - counted as a due date change (#6081), matched by
the "date set or changed" rule triggers (#2474) and shown as an empty date in
the activity feed. Now a date set records its value, a date cleared records
only the date it had - as a rule's removeDate does, and as the board timeline
rewinds - and clearing a date the card does not have records nothing. The rules
skip a cleared date, and the feed shows only the date it had. Tests run the real
hook with a set, a `$unset` alone and a `$unset` beside a `$set`, and a
tree-wide test finds no `modifier.$set[...]` read that assumes the `$set` is
there.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.05 2026-11-10 WeKan ® release

**In short:** WeKan is updated to **Meteor 3.6**. The **Android** bundles
build again, after v13.04's npm retry broke their install, and the **Super
Productivity** export no longer fails for a board with a card whose list is
archived.

This release updates the following dependencies:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0fbef8936fa2524d21048669e4c41be15e4e3f38">Updated to Meteor 3.6</a>. Thanks to xet7.</summary>

From 3.6-rc.1. `meteor update` refused it, because WeKan's forks of six Meteor
packages in `packages/` declared 3.6-rc.1's versions, and a local package
overrides the release's. Meteor 3.6 changed those six only in their version
line, so each fork now declares 3.6's version with its `_1` wrap number. The
Dockerfile builds with Meteor 3.6, and the Bun build's patch applies unchanged
to it as `meteor-3.6.patch`. WeKan builds with Meteor 3.6, and the node suites
pass.

</details>

and fixes the following bugs:

**Release builds** - what the release workflow builds.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d08f658deae3b8369b75f1c54371ad8c1cf9367d">The Android bundles build again: npm-retry.sh is given Android's node and npm</a>. Thanks to xet7.</summary>

v13.04's four Android bundle jobs all failed with "environment: node: unbound
variable". v13.04 sent the Android npm installs through
`releases/npm-retry.sh` by the name of `build-bundle.sh`'s own `npm` shell
function. `npm-retry.sh` is a new bash with `set -u`: the exported function
reached it, but the `$node` and `$npm_cli` it reads did not, so it failed before
npm ran. The two installs now give `npm-retry.sh` the program itself, still
retried on a network error. `tests/npmRetry.test.cjs` fails when any
`releases/` script gives `npm-retry.sh` one of its own shell functions, and
reproduces the failure.

</details>

**Exports** - a board in another tool's format.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8b4fe0e7376194c498219a0b496340a94020098a">The Super Productivity export no longer fails on a card whose list is archived</a>. Thanks to xet7.</summary>

A card whose list is archived is collected with an empty list title. The
Super Productivity formatter tagged that card with a tag that did not exist, so
the export threw "Cannot read properties of undefined (reading 'taskIds')" and
the whole board's export failed. That list is now "Untitled", for its tag and
its panel alike, so the panel shows its cards and every tag a task names
exists. `tests/superProductivityFormat.test.cjs` fails with that error on the
old formatter. It was found while checking Weddy's Super Productivity export
against WeKan's formatter.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.04 2026-11-09 WeKan ® release

**In short:** **ListLockBleed** is fixed: when a list refuses a role write
access, that refusal now also holds for the checklist and checklist-item REST
routes. The **Sandstorm** and **Android** bundles retry their npm install when
github.com is briefly unavailable.

This release fixes the following CRITICAL SECURITY ISSUE of [ListLockBleed](https://wekan.fi/hall-of-fame/listlockbleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/commit/214b20e7ad">A list that refuses a role write access refuses its checklist REST writes too</a>. Thanks to tsurutanmen and xet7.</summary>

[ListLockBleed](https://wekan.fi/hall-of-fame/listlockbleed/),
[GHSA-4734-8vrg-8j3w](https://github.com/wekan/wekan/security/advisories/GHSA-4734-8vrg-8j3w).
A board admin can refuse a role write access in one list (#4527). The card
and comment REST routes and the DDP checklist writes applied that refusal,
but the six checklist and checklist-item REST routes asked only the board. A
member the list refused could therefore still create, rename, tick and delete
the checklists of its cards with an API token. Those routes now ask the
card's list and answer 403, and the refusal shows in Admin Panel / Problems.
`tests/listPermissions.test.cjs` fails for any REST write route of the tree
that names a card without asking its list. And
`tests/playwright/specs/list-lock-checklists.e2e.js` replays the six writes
against a running server.

</details>

and fixes the following bugs:

**Release builds** - what the release workflow does when a download fails.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c3f12b5659">The Sandstorm and Android bundles retry their npm install through a GitHub outage</a>. Thanks to xet7.</summary>

v13.03's Sandstorm .spk failed with "npm error 504 Gateway Time-out" for
github.com's `meteor/node-source-map-support` tarball: the same kind of
outage `releases/npm-retry.sh` has retried since v10.86. That install in
`releases/sandstorm-slim-spk.sh`, and the Android bundle's server and sharp
installs, ran npm without it, because `tests/npmRetry.test.cjs` read only
`release-all.yml`. All three go through the retry now. The test follows
every `releases/` script a workflow runs and fails on a bare npm install in
any of them.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.03 2026-11-09 WeKan ® release

**In short:** The amd64 **snaps** no longer fail the release when the Ubuntu
archive is briefly unreachable: the build waits for it and retries once.

This release fixes the following bugs:

**Release builds** - what the release workflow does when a build fails.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a7ace18af8">The amd64 snaps wait out an Ubuntu archive outage instead of failing</a>. Thanks to xet7.</summary>

v13.02's native amd64 snap and both amd64 snap variants failed within eight
minutes of each other with "Failed to refresh package list: failed to run apt
update" while Snapcraft installed build-packages; the arm64 snaps, served by
`ports.ubuntu.com`, built. `releases/snap-refresh-managed-apt.py` recovered
only a stale `.deb` 404, so the one guarded retry never ran. It now also
recognises a failed apt update in the managed build instance, retries
`apt-get update` there with a 30/60/120/240 s backoff, and lets the Snapcraft
retry run only once the archive answers; a longer outage stays fatal. It
prints apt's own error lines first, so a failing job says why apt failed.
`tests/snap-managed-apt.py` pins the recovery, its bound, and that unrelated
failures are still refused.

</details>

and has the following developer-tooling fix:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6cc84a07cd">The security regression inventory counts UnassignedArchiveBleed as guarded</a>. Thanks to tsurutanmen and xet7.</summary>

`tests/securityRegressionCoverage.test.cjs` failed once the Hall of Fame
published UnassignedArchiveBleed, because its inventory did not have the name.
It is guarded now by `tests/assignedCardMethods.test.cjs` and
`tests/playwright/specs/assigned-card-methods.e2e.js`, which name it.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.02 2026-11-09 WeKan ® release

**In short:** **UnassignedArchiveBleed** is fixed: a member with the
**Normal, assigned only** role archives and converts only the cards assigned
to them, through every card method.

This release fixes the following CRITICAL SECURITY ISSUE of [UnassignedArchiveBleed](https://wekan.fi/hall-of-fame/unassignedarchivebleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1513b2e98c">An assigned-only member archives and converts only the cards assigned to them</a>. Thanks to tsurutanmen and xet7.</summary>

[UnassignedArchiveBleed](https://wekan.fi/hall-of-fame/unassignedarchivebleed/),
[GHSA-6xqf-jh8x-4wxc](https://github.com/wekan/wekan/security/advisories/GHSA-6xqf-jh8x-4wxc).
The DDP methods `archiveSelectedCards` and `createBoardFromCard` asked only
for the board's write capability, which the Normal, assigned only role has, so
such a member who knew a card's id archived any card of the board - and its
subtasks - and turned any card into a linked-board card. Both now also ask
the card, as `copyCard` does; a selection is checked whole before the first
card is archived. A refusal is shown in Admin Panel / Problems.
`tests/assignedCardMethods.test.cjs` fails for any server method that takes a
card id and decides by the board's write access alone.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.01 2026-11-08 WeKan ® release

**In short:** Translations: the strings still in English are written in **33
more languages**, **Sardinian** is Sardinian instead of Italian and **Moroccan
Arabic** is Darija instead of Persian. Dependabot's updates of **mailparser**,
**isomorphic-git**, **pdfjs-dist** and the S3 libraries are checked and kept,
with the S3 client brought to the version the upload library needs.

This release updates the following dependencies:

- **mailparser 3.12.4 → 3.14.2** — inbound email and bounces; it brings
  nodemailer 10.3.1, libmime 5.6.4 and @zone-eu/mailsplit 5.4.30, the same
  authors' packages ([#6886](https://github.com/wekan/wekan/pull/6886)).
- **isomorphic-git 1.44.8 → 1.44.10** — the GitHub wiki sync; reads commit and
  tag headers the way git does ([#6885](https://github.com/wekan/wekan/pull/6885)).
- **@aws-sdk/lib-storage 3.1155.0 → 3.1161.0** — S3 uploads
  ([#6884](https://github.com/wekan/wekan/pull/6884)); it needs the
  client-s3 below.
- **filesize 11.0.28 → 11.0.30** — file sizes shown
  ([#6883](https://github.com/wekan/wekan/pull/6883)).
- **pdfjs-dist 6.4.299 → 6.5.438** — PDF previews
  ([#6882](https://github.com/wekan/wekan/pull/6882)).
- **mongodb 7.7.0 → 7.8.0** in tests/playwright — the browser tests' seeding
  only ([#6880](https://github.com/wekan/wekan/pull/6880)).
- **helm/chart-releaser-action 1.8.0 → 1.9.0** and **vmactions/netbsd-vm
  1.5.2 → 1.5.3** — CI, each still pinned to the commit its tag names
  ([#6881](https://github.com/wekan/wekan/pull/6881),
  [#6879](https://github.com/wekan/wekan/pull/6879)).

Each was checked before it was kept: every package's integrity matches its
lockfile entry, none has an install script, the action pins are the commits of
their tags, and the new versions add no network calls or telemetry.

Thanks to dependabot.

- **@aws-sdk/client-s3 3.1159.0 → 3.1161.0** - [the version @aws-sdk/lib-storage 3.1161.0 requires as a peer](https://github.com/wekan/wekan/commit/e33b3f26d3db1f15fcea20542c6143d142e84f65); tests/dependencySecurityUpdates.test.cjs caught the mismatch, and only AWS SDK packages changed version. Thanks to xet7.

and updates the following translations:

**Languages updated:** 31 languages.

**Every string in the language** - what was still English, or another language.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1211221a0fe35a9be4b41ef2954935df1c71e62a">The strings still in English, written in 33 more languages</a>. Thanks to xet7.</summary>

Every value still equal to English was written in the locale's language from
its existing translations and kanban terms; only English placeholders were
filled, human translations were not touched and every `__x__` and `%s` is
English's. The commit names the languages written with low confidence.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d1d3beb12d62f245ca8f044e5d389e4edb950b92">Sardinian is Sardinian, not Italian</a>. Thanks to xet7.</summary>

1772 values of `sc.i18n.json` were Italian or Italian/Sardinian mixtures; the
locale tag is authoritative, so they are Sardinian now.
`tests/sardinianTranslationProgress.test.cjs` scans every value for words only
Italian has, and proves the scan catches the old strings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fe0e187fa0907cf77017e7029eeabdb2450ef1f1">Moroccan Arabic is Darija, not Persian</a>. Thanks to xet7.</summary>

374 values of `ary.i18n.json` were Persian, Persian words in Arabic text, or
English left in. `tests/moroccanArabicNotPersian.test.cjs` scans every value for
words only Persian has, pins repaired values and checks every placeholder.

</details>

and has the following developer-facing changes:

- [Companion repositories are found in .tools/w, .tools/xet7 and .tools/Secretchronicles](https://github.com/wekan/wekan/commit/11bed267889c77ffc6651e858a6eb6ec1e4c83a1). Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v13.00 2026-11-07 WeKan ® release

**In short:** **CreateBleed** is fixed: "Only admins can create boards" now
holds on every path that creates a board - the browser console, the REST API,
imports, copies, clones and cards - not only on the Add Board form. The **REST
API documentation** spells the name **WeKan**, so the API pages published on
wekan.fi pass its brand-spelling check again.

This release fixes the following CRITICAL SECURITY ISSUE of [CreateBleed](https://wekan.fi/hall-of-fame/createbleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5c1f6088f4">Only admins create boards on every path, not only through Add Board</a>. Thanks to tsurutanmen and xet7.</summary>

[CreateBleed](https://wekan.fi/hall-of-fame/createbleed/),
[GHSA-qcfm-2g4w-wqcc](https://github.com/wekan/wekan/security/advisories/GHSA-qcfm-2g4w-wqcc).
Admin Panel / Settings / Visibility / "Only admins can create boards"
([#4475](https://github.com/wekan/wekan/issues/4475)) was checked only inside
`createBoardWithInitialSwimlanes`, the Add Board form. A user who is not an
admin still created working boards with a console `Boards.insert` - the
board collection's allow rule approves any signed-in user - with
`POST /api/boards` and with both board import routes, as reported, and also
with `importBoard`, `cloneBoard`, `copyBoard`, `POST /api/boards/:boardId/copy`
and `createBoardFromCard`. The boards belonged to their creator; no other
user's data was read or changed.

One decision (`models/lib/boardCreationPolicy.js`) and one guard
(`server/lib/boardCreationGuard.js`) are now asked by every one of those paths
before they write, and by a new `Boards.deny` insert rule. A board template
stays every member's own, and boards WeKan makes by itself - a user's
Templates board, a board's subtasks board - are not user creations. A refused
REST call answers 403. A refusal is recorded in Admin Panel / Problems as
CreateBleed (`authz.board-creation`, low, CWE-863, never disables the
account), and Duplicate and "Create board from card" are hidden like Add
Board, so only a client bypassing the interface reaches it.
`tests/createBleed.test.cjs` drives the decision, the guard and the real deny
rule against the reporter's console insert, and fails if any path that creates
a board for a user does not ask the guard, or if anything else reads the
setting; `tests/playwright/specs/createbleed-board-creation-admin-only.e2e.js`
replays the report against a running server.

</details>

and fixes the following documentation bugs:

**REST API documentation** - the name is WeKan in the API reference, from the
generator to the page wekan.fi publishes.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4d5fe63fc4">The REST API documentation spells the name WeKan</a>. Thanks to xet7.</summary>

The header of `openapi/generate_openapi.py` and the JSDoc of six models said
"Wekan REST API", "extend Wekan", "a production Wekan server" and "in the
Wekan board", so every `public/api/wekan.yml` and the API pages built from it
said Wekan too, and the v12.95, v12.96 and v12.97 pages on wekan.fi failed its
`tests/brand-spelling.test.cjs`. The generator, the model comments and
`wekan.yml` now say WeKan. `tests/openapiBrandSpelling.test.cjs` checks the
generated file, the generator header and every model JSDoc block, and fails on
the files before this change.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0275363043">The built API page says WeKan, so the v12.99 page on wekan.fi does too</a>. Thanks to xet7.</summary>

The v12.99 version bump rebuilt `public/api/wekan.html` with the generator from
before the fix, and `releases/release-website.sh` copies that file to wekan.fi
as `api/v12.99/index.html`. Its visible text and the JSON Redoc rebuilds the
page from now say WeKan, and `tests/openapiBrandSpelling.test.cjs` checks the
built page as well.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.99 2026-11-06 WeKan ® release

**In short:** The **mac-arm64** release bundle builds again: its job asked for
GitHub's retired **macos-14** runner and was cancelled in the v12.98 release
run. The **weba** instructions now live in the weba repository itself.

This release fixes the following release build bug:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7e4483b1a9">The mac-arm64 bundle is built on macos-15, because GitHub retired macos-14</a>. Thanks to xet7.</summary>

In the v12.98 release run, build-mac-arm64 was cancelled with "The
configuration 'macos-14-arm64-us-default' is not supported", so v12.98 has no
mac-arm64 bundle. The job now runs on `macos-15`, which is Apple Silicon too
and is what `mac.yml` already uses. `tests/workflowRunnerLabels.test.cjs` lists
`macos-14` as retired, so no workflow can ask for it again, and checks that
build-mac-arm64 asks for a current Apple Silicon runner.

</details>

and has the following developer documentation change:

- [The weba instructions moved from AGENTS.md and CLAUDE.md into the weba repository](https://github.com/wekan/wekan/commit/b4cb989391).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.98 2026-11-06 WeKan ® release

**In short:** **GroupLinkBleed** is fixed: a board admin can no longer skip the
board methods by writing the board directly, to attach an organization or team
they do not belong to or to add a member past the invitation checks.
**Public board CSV and TSV exports** honour the selected columns, and the REST
**card archive, restore and custom-field** endpoints answer an unmatched card
with a JSON 404 instead of 500, and a REST **card update** can set sort 0, turn
overtime off and clear a description. The **notifications drawer** gets its
attachments again, and the developer instructions cover the **weba** Gambas
companion repository.

This release fixes the following CRITICAL SECURITY ISSUE of [GroupLinkBleed](https://wekan.fi/hall-of-fame/grouplinkbleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e3458004ec">Board admins can no longer attach foreign teams or add members by direct board writes</a>. Thanks to bhaswanthc and xet7.</summary>

[GroupLinkBleed](https://wekan.fi/hall-of-fame/grouplinkbleed/),
[GHSA-v544-rmr5-38gx](https://github.com/wekan/wekan/security/advisories/GHSA-v544-rmr5-38gx).
The board allow rule lets a board admin update any field, and two checks lived
only in Meteor methods: adding only the organizations and teams the admin
belongs to ([#5141](https://github.com/wekan/wekan/issues/5141)), and the
invitation's checks, including the same organization/team policy
([#6116](https://github.com/wekan/wekan/issues/6116)). A client writing the
board over DDP skipped both, so a whole team could be given an attacker's
board and any user added to it. Client writes naming `orgs`, `teams` or
`domains`, and client updates that add or reactivate a member, are now
refused and shown in Admin Panel / Problems; role changes and removals still
pass. `tests/groupLinkBleed.test.cjs` runs the real deny rules and fails if a
method-guarded board field is client-writable.

</details>

and fixes the following bugs:

**Exports** - the CSV and TSV columns a public board exports.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4762bed8c1">Public board CSV and TSV exports honour the selected fields</a>. Thanks to AhmedLukman and xet7.</summary>

On a public board the CSV and TSV export ignored `fields=` and wrote all 20
columns, while a private board wrote only the selected ones (PR
[#6875](https://github.com/wekan/wekan/pull/6875)). The validated selection is
now parsed once, before the public/private branch, so both get the same
columns; a missing, empty or unrecognised selection still exports all of them,
and the export guards are unchanged. `tests/publicCsvExportFields.test.cjs`
drives the route for comma, semicolon and tab, and a Playwright spec checks the
export menu's checkboxes on a public board.

</details>

**REST API** - what the card endpoints accept, and answer when no card matches.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3b33c7d7ba">Card archive and restore answer a JSON 404 for an unmatched card instead of 500</a>. Thanks to AhmedLukman and xet7.</summary>

`POST …/cards/:cardId/archive` and `…/unarchive` threw `Meteor.Error(404)`
when no card matched the board, list, id and archive state. A WebApp handler is
a plain connect handler, so that reached the client as HTTP 500 (PR
[#6876](https://github.com/wekan/wekan/pull/6876)). They now answer through
`sendJsonResult` with `{ error: 'Card not found' }` and 404, writing nothing.
`tests/restCardArchive.test.cjs` and a Playwright spec cover a missing card,
the wrong list, the wrong board, the wrong state and refused callers.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b0a71ba57b">A card update can set sort to 0</a>. Thanks to AhmedLukman and xet7.</summary>

`PUT …/cards/:cardId` with `{ "sort": 0 }` answered 404 and left the card
where it was, because the handler read `sort` by truthiness (PR
[#6877](https://github.com/wekan/wekan/pull/6877)). It now writes any sort that
is present. `tests/restCardSort.test.cjs` and a Playwright spec check 0, other
numbers, form-encoded `'0'`, an omitted sort and refused callers.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b895e61237">A card update checks sort, isOverTime and description, so false and empty work</a>. Thanks to AhmedLukman and xet7.</summary>

Writing `sort` whenever it is present would also have written `null`, `''` or
`'abc'` as the card's position, and the same handler read `isOverTime` and
`description` by truthiness, so overtime could not be turned off and a
description could not be cleared. `parseCardScalarFields()` decides all three
by presence before the first write: sort a finite number, isOverTime a boolean
(`'true'`/`'false'` from a form too), description a string or `null` to clear.
Anything else is a 400 and the card is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d5f660c27">The card custom-field update answers a JSON 404 for an unmatched card instead of 500</a>. Thanks to AhmedLukman and xet7.</summary>

`POST …/cards/:cardId/customFields/:customFieldId` had the same
`throw new Meteor.Error(404)` as the archive endpoints, and now answers the
same JSON 404. `tests/restHandlerNotFound.test.cjs` drives it for a matching,
missing, wrong-list, wrong-board and archived card, and scans every
`WebApp.handlers` route in the tree so no REST handler answers not-found by
throwing again.

</details>

**Notifications** - what the notifications drawer receives.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/adb73fd8ee">The notifications drawer receives its attachments again, without a server exception</a>. Thanks to xet7.</summary>

Every `notificationAttachments` subscription failed with `Publish function can
only return a Cursor or an array of Cursors`: Attachments is an ostrio:files
FilesCollection, and the publication returned its FilesCursor instead of the
Mongo cursor it wraps. It now returns `.cursor`, as every other attachment
publication does. `tests/publishFilesCursor.test.cjs` runs the publication and
scans every publishing file so no attachment or avatar cursor query is
published without it.

</details>

and has the following developer-facing changes:

**Tests** - guards that had drifted from the code they pin.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/68b575637d">Three client guards follow the code they pin again</a>. Thanks to xet7.</summary>

`sidebarBelowHeader`, `maximizedCardPosition` and `titleClickToEdit` read
source that the full screen button, the phone-below-header rule and the
Pointer Events drag had since moved. The behaviour had not changed; the guards
now read the new places, `titleClickToEdit` calls `cardHeaderPress()` from
`models/lib/windowDrag.js`, and each still fails when its behaviour is removed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/081690875d">The real single executable test says why it cannot run on a kernel with large pages</a>. Thanks to xet7.</summary>

`--build-sea` injects the SEA blob with LIEF, which adds 4 KiB-aligned
segments; a Linux kernel with 16 KiB or 64 KiB pages cannot map them, and the
executable dies with SIGSEGV - a one-line `console.log` SEA does too. The test
failed there as `null !== 0`; it is now skipped on such a kernel with that
reason. Release builders have 4 KiB pages and still run it.

</details>

**Developer instructions** - what an assistant working in this repository is
told.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1ef7a57ce4">AGENTS.md and CLAUDE.md describe the weba companion repository</a>. Thanks to xet7.</summary>

`.tools/weba` is the separate `wekan/weba` repository, a Gambas Web UI Kanban
with SQLite by default. The instructions say where its project, forms, browser
reports and database modules are, that WeKan's author, local-commit and no-push
rules apply there too, how to compile and run it with `gbc3`/`gbx3` from the
local Gambas under `.tools/bin/gambas3`, how its tests run on a copy of the
database, and to keep its SQL portable across Gambas database drivers.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.97 2026-11-06 WeKan ® release

**In short:** `build.sh` and the `releases/` scripts now work on **Arch Linux**
and **Omarchy**, and the release builds no longer lose the **OpenBSD arm64
bundle** to a smoke test that left WeKan running, or the **s390x snap** to
Launchpad outages that were counted as build failures.

This release fixes the following release build bugs:

**Release builds** - bundles and snaps that built correctly but failed the job.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b46f155fa3">The BSD smoke test stops WeKan and FerretDB and removes its files before returning</a>. Thanks to xet7.</summary>

v12.96 openbsd-arm64: `releases/bsd/smoke.sh` returned OK with WeKan and
FerretDB still running, because `start-wekan.sh` runs its TERM trap only after
the foreground node exits. FerretDB then removed `wekan.sqlite-wal` and `-shm`
while the VM's copyback rsync walked the workspace, and rsync exit 24 failed a
bundle that had built and started. The smoke test now stops both, waits until
they are gone and deletes its work directory. `tests/bsdBundles.test.cjs`
runs it against a launcher of `start-wekan.sh`'s shape and fails if a process
or a smoke-test file is left behind.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b46f155fa3">Launchpad outages seen only in snapcraft's execution log earn snap retries</a>. Thanks to xet7.</summary>

v12.96 s390x: all three attempts met Launchpad's `HTTP Error 503` /
`Error: Timeout`, but snapcraft printed only its last exception, "Could not
find repository at path ...", so the outage was counted as three WeKan
failures. `infra_failure()` now reads this attempt's snapcraft execution logs
too, and counts the "You do not have permission to create refs/" push refusal
from the half-created repository. `tests/snapLaunchpadInfraRetry.test.cjs`
pins both, and its negatives an earlier attempt's log and one with no outage.

</details>

and has the following developer-tooling fix:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c61a1b7f41">build.sh and releases scripts work on Arch Linux and Omarchy</a>. Thanks to xet7.</summary>

Omarchy is Arch with Hyprland: pacman, the Arch repositories and yay for the
AUR. `releases/ensure-tools.sh` names it and the other Arch derivatives
explicitly. Packages are installed with `pacman -S --needed` instead of the
unsupported `-Sy` partial upgrade; a full `-Syu` runs only on a never-synced
pacman or with `WEKAN_PACMAN_SYU=1`, and a failed install says to update first
(`omarchy-update` on Omarchy). 7zip replaces Arch's retired p7zip, snapcraft
gets snapd from the AUR with yay or paru, the SSH server menu entries use
`sshd.service` outside Debian/Ubuntu, and Playwright's browser libraries come
from pacman (or dnf) instead of the apt-only `--with-deps`, with WebKit in the
Playwright Docker image on Arch. `tests/archOmarchyScripts.test.cjs` drives
the helpers offline, and its negative test fails if any shell script does a
`pacman -Sy` partial upgrade or installs p7zip.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.96 2026-11-05 WeKan ® release

**In short:** The release **bundle starts again**: v12.95's build stopped on
boot because the **nodemailer** 10 raised inside Meteor's email package no
longer had the files that package was built against.

This release fixes the following bug:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5a21b074d4">The bundle starts again, with nodemailer 10 inside Meteor's email package</a>. Thanks to xet7.</summary>

v12.95 raised the nodemailer in `meteor/email` from 8.0.3 to 10.3.1, and
nodemailer 10 moved `lib/` to `dist/cjs/`. `packages/email.js`, compiled
against 8.0.3, links `lib/nodemailer.js` and `lib/well-known/index.js` and
`Npm.require`s `lib/mail-composer` by path, so build-amd64 failed its smoke
boot. `releases/bundle-npm-security-bumps.json` now shims nodemailer as it
already shims uuid 11: `lib/nodemailer.js` and every `lib/<name>` directory the
exports map lists are written back, forwarding to `dist/cjs`, with a
`lib/package.json` marking them CommonJS because nodemailer is `"type":
"module"`. A fresh local bundle taken through build-amd64's install, bump, trim
and prune steps passes `releases/bundle-smoke-boot.sh`.
`tests/bundleNpmSecurityBumps.test.cjs` requires the recorded paths through the
shim, checks every exported `lib/<name>`, and fails without the CommonJS marker.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.95 2026-11-05 WeKan ® release

**In short:** **Continuous backup** now runs on one server at a time, with a
lease, when WeKan has several servers. Missing-board **exports** and REST
updates of missing **integrations**, **users**, **organizations** and **teams**
answer 404 instead of 200, the **minicard** shows a picked Requested by and
Assigned by, a card stops offering the attachment "+" when uploads are blocked,
and the Docker image's **nodemailer**, **body-parser**, **qs**, **uuid** and
**postcss-selector-parser** are raised past the advisories a Grype scan found.

This release fixes the following bugs:

**Exports** - what the export routes answer when something is wrong.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c0d666ffa">Missing-board exports return 404, and an over-long export token returns 400</a>. Thanks to AhmedLukman and xet7.</summary>

The board Excel export answered a missing board with HTTP 200 and only the text
`Board not found` (PR #6869). The two PDF export routes had the same fault, and
the Excel and PDF routes answered an over-long auth token with 200 as well,
while `export.js` already used 404 and 400. All of them now choose their status
the same way.

`tests/exportErrorStatuses.test.cjs` scans every `models/export*.js` route for a
text answer without a status, so the fault cannot return anywhere there; the
PR's route and browser tests stay.

</details>

**Continuous backup** - which server streams it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/880ec2d707">Only one server streams it at a time, holding a lease</a>. Thanks to Raymond-Voogt and xet7.</summary>

With several WeKan servers on one database, every server applied the continuous
backup setting, so
each of them tailed the oplog and wrote its own archives into the same target
directory
(\#6861). The leader now holds a lease, one `continuousBackupLease` document
with its id and an
expiry. Taking it is one atomic operation, the leader renews it every 15 seconds
and it lapses after
45, so another server takes over within a minute when the leader stops, and a
server that loses the
lease stops its stream. Startup, saving the settings and a change saved on
another server converge
through that loop; a restore or a fetch from the cloud takes the lease and waits
one renewal so it
is the only writer. One server is always its own leader.

Checked against the real driver on FerretDB (SQLite): 24 clients at once give
exactly one leader, and
renewal, expiry, the old leader losing the lease and release behave.
`tests/continuousBackupLease.test.cjs`
pins the same and the wiring.

</details>

**Attachments** - what a card offers when the administrator blocked uploads.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d8b3579117">A card no longer offers the attachment "+" when uploads are blocked for the whole site</a>. Thanks to Raymond-Voogt and xet7.</summary>

Admin Panel / Attachments / Transfer limits already has "Attachments upload" and
"API upload" set to
Blocked, and the server refuses on every path: the upload pipeline,
`api.attachment.upload` and
`.copy`, and the `/api/attachment` upload, upload-background and copy routes.
The card still showed
the "+" button and accepted a drop or paste for an upload that would then be
refused. It now asks
the server one boolean, at most once a minute, and hides both. No second setting
was added
(\#6870 proposed a `disableAttachments`), so nothing can disagree with what the
server enforces.

`tests/attachmentUploadPolicy.test.cjs` pins the client, the method, the server
enforcement it relies
on, and that no `disableAttachments` setting exists.

The method was not imported at first, so the call failed and the "+" stayed;
[a follow-up](https://github.com/wekan/wekan/commit/3aaa46fdae) loads it, and
`tests/serverModulesLoaded.test.cjs` now passes.

</details>

**REST API** - what the integration, user, organization and team update routes
answer for something that is not there.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6012521ccc">An integration update for a missing or wrong-board integration returns 404</a>. Thanks to AhmedLukman and xet7.</summary>

`PUT /api/boards/:boardId/integrations/:intId` answered 200 with the requested
id when no
integration matched that id and board (PR #6871). The two activities routes
(`POST` and `DELETE`
`.../activities`) updated nothing and answered 200 with `data: null`. All three
now look the
integration up on that board after board-admin authorization and answer the JSON
404 the `GET`
route already uses, before validating or writing anything.

`tests/restIntegrationWriteRoutes404.test.cjs` pins, for the whole file, that
every handler that
updates an integration looks it up first and only after authorization; the PR's
route and browser
tests stay.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d3edc56170">An update of a missing user returns 404</a>. Thanks to AhmedLukman and xet7.</summary>

`PUT /api/users/:userId` answered 200 with no data when no user had that id,
for every action (PR #6873). After the admin check it now answers a JSON 404
`User not found` before taking ownership, disabling or enabling a login.
`tests/restUserUpdate.test.cjs` runs the handler for every action against a
missing user, and checks that authorization still comes first, that
self-disable stays a no-op and that a database failure stays a safe 500;
`tests/playwright/specs/rest-user-update.e2e.js` drives it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4d44349ab6">A feature update of a missing organization or team returns 404</a>. Thanks to AhmedLukman and xet7.</summary>

`PUT /api/admin/orgs/:orgId/features` and `PUT
/api/admin/teams/:teamId/features`
answered 200 with `data: undefined` when there was no such organization or team
(PR #6874). They now answer a JSON 404 `Organization not found` / `Team not
found`. `tests/restPeopleFeatures.test.cjs` runs both handlers for missing and
existing records, empty bodies, denied authorization and database failures;
`tests/playwright/specs/rest-people-features.e2e.js` checks the Admin Panel /
People feature checkboxes.

</details>

**The minicard** - who requested and who assigned a card.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/22e5df55d7">Requested by and Assigned by show when a member was picked, with one icon per field everywhere</a>. Thanks to mueschel and xet7.</summary>

The opened card's + button picks board members into `requesters` /
`assigners`, and the free-text name is optional, but the minicard drew only the
free text: a requester picked the usual way never showed although Show on
Minicard was on (#6872). The minicard now shows the picked members as avatars
beside any typed name. Card Settings also had the icons swapped - a head with a
plus for Requested by and a cart for Assigned by - and now uses the cart and
user-plus that the opened card and the minicard use.
`tests/minicardRequestedAssignedBy6872.test.cjs` pins the avatars, the
either-or condition and one icon per field, and fails on a minicard block gated
on the free text alone;
`tests/playwright/specs/minicard-requested-by-6872.e2e.js`
drives it.

</details>

and updates the following dependencies:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dad03959d9">nodemailer 10.3.1, body-parser 1.20.9 and 2.4.0, qs 6.16.1, uuid 11.1.1 and postcss-selector-parser 6.1.5 in the bundle</a>. Thanks to the Grype scan reporter and xet7.</summary>

A Grype scan of the image found High and Medium advisories in packages that
Meteor's own packages carry inside `programs/server/npm/node_modules/meteor/`,
where `package.json` and its `overrides` cannot reach.
`releases/bump-bundle-npm-deps.mjs` raises them after `meteor build`.

- **nodemailer 8.0.11 to 10.3.1** (GHSA-2x7j-588g-ccc2, GHSA-v53p-9fqp-m79j,
  GHSA-p6gq-j5cr-w38f and the rest fixed in 10.1.4 or later). It was listed as
  not fixable because the fix is a new major. `meteor/email` only calls
  `createTransport`, the `stream` plugin hook, `nodemailer/lib/well-known` and
  `nodemailer/lib/mail-composer`, and all four were run against 10.3.1 through
  the bundle's own package specifiers.
- **body-parser 1.20.6 and 1.20.8 to 1.20.9, and 2.3.0 to 2.4.0**
  (GHSA-27r3-jxmh-p828). A minimum may now be written `body-parser@2`, which
  applies to copies of that major only, so each major is raised inside itself.
- **qs to 6.16.1** (GHSA-6pq8-jhm2-2vcw) and **postcss-selector-parser 6.1.4 to
  6.1.5** (GHSA-rj75-hqrm-r3gf).
- **uuid 8.3.2 and 9.0.1 to 11.1.1** (GHSA-w5hq-g745-h8pq). uuid 11 moved its
  entry point from `dist/index.js` to `dist/cjs/index.js`, which killed the
  server on boot the one time it was tried. The bumper now writes the old
  `dist/index.js` back as `export * from './esm/index.js'`: it is an ES module
  because uuid is `"type": "module"`, and Node 26 `require()`s it.

glob 14 and minimatch 11 were already in `package.json`; the scanned image
predates them. The runtime image installs no compiler (`gcc-14-base` is Debian's
one-file package), so the multi-stage build the report asks for is already how
it is built. Run against a copy of the published image's bundle, the bumper
raised all of the above and every raised copy loaded.

**This release's bundle did not start.** "Every raised copy loaded" was checked
by loading each package, not by booting the bundle: nodemailer 10 moved `lib/`
to `dist/cjs/`, Meteor's `email` package still links the `lib/` paths of 8.0.3,
and build-amd64 failed its smoke boot with "Cannot find module
.../meteor/email/node_modules/nodemailer/lib/nodemailer.js". The fix is in the
next release.
`tests/bundleNpmSecurityBumps.test.cjs` pins the minimums, the per-major
rule and the shim, and runs the bumper with `--dry-run` on a bundle of
body-parser, uuid and nodemailer copies at, below and above their minimums.

</details>

and has the following documentation change:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/016b4bf3bd">Only maintainer mode commits directly and updates changelogs, and a pull request has one feature or fix</a>. Thanks to xet7.</summary>

CLAUDE.md and AGENTS.md now say that a pull request contributor, to wekan/wekan
or to the maintainer's repositories under `.tools/`, sends each feature or fix
as its own pull request with only related changes in it, and changes no
changelog. The maintainer, or an agent working as the maintainer, writes the
entry after merging, when there is a commit to link.
`tests/changelogFormat.test.cjs` checks both files.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.94 2026-11-04 WeKan ® release

**In short:** On an iPad the **opened card covers the header bar** instead of
sitting
behind it, and the speed test measures where the time goes when a WeKan board is
opened, on FerretDB and on MongoDB.

This release fixes the following bugs:

**Opened cards** - where a card opens.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/efaf94242e">On a phone in desktop mode the opened card starts below the header bar</a>. Thanks to xet7.</summary>

The header wraps to several rows on a phone, far taller than the 8px the
floating card docks at, so the card's top row was among the header's rows and
was only seen by dragging it down. Below 801px a card without an inline top,
popup cards included, now starts at `--wekan-header-height` + 8px. A dragged
place is an inline top, so it is kept when the finger is lifted.
`tests/cardBelowHeaderOnPhone.test.cjs` pins the rule and that it never
matches a dragged card.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/006d24502c">The opened card covers the header bar on an iPad instead of sitting behind it</a>. Thanks to xet7.</summary>

On iPad Chrome (and Safari) the opened card's top row - the collapse caret, the
card
number, the menu, maximize and X - was behind the header bar, although the
card's
`z-index` is 2001 and the header's 1000. iOS WebKit makes every scrolling
element
(`#content`, the board wrapper) a stacking context of its own, so the card's
`z-index`
is compared only inside it, and the header bar, itself a stacking context, is
painted
over all of it. While a card is open the header bar is now at the level of the
content,
which comes after it in the page and paints over it; with no card open it keeps
its
own level. A browser spec makes the same trap with `isolation: isolate` on
`#content`
and the board wrapper and shows the card over the header, open and collapsed,
with its
close button reachable, in Chromium and WebKit; without the rule it fails as the
screenshot shows. `tests/cardOverHeaderStacking.test.cjs` pins the rule and its
selector. An iPad is the final check.

</details>

and has the following documentation change:

**Database speed test** - how fast the databases answer WeKan's queries.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3621413d6f">The speed test measures where the time goes when a WeKan board is opened, on FerretDB and on MongoDB</a>. Thanks to Raymond-Voogt and xet7.</summary>

`docs/Databases/FerretDB/1/SpeedTest/app` opens a board of 200, 2,000 and 5,000
cards in
Chromium on WeKan with FerretDB (SQLite) and with MongoDB 8, and profiles the
Meteor
server (Node inspector) and FerretDB (pprof). Two runs each. The Meteor server
uses
0.1-0.5 s of CPU, the same on both, and its DDP server is 1% of that; the
browser gets
the same ~210 KB at every size. A 5,000-card board takes FerretDB 400-600 ms
longer to
open (first card +42-48%), a small board only 70-100 ms, and FerretDB spends
about 4 s
of CPU on it, 39% in the SQLite engine and 34% filtering in Go what it read. So
a
backend rewritten in another language would save part of a fraction of a second,
while
the part that scales with the board is the database layer. The README says what
was not
measured: a production build, the browser's own time, and which query sends the
`aggregate`. `tests/boardOpenProfile.test.cjs` pins the analysis of the profile
and what
the README claims.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.93 2026-11-04 WeKan ® release

**In short:** The database **speed test** has a new small-scale result, ordered
from fastest to slowest with how many times slower each database is, and two
more databases: **pgrust** (PostgreSQL in Rust) and **TiDB**. Noria, YugabyteDB
and CockroachDB were looked at and cannot be used, for reasons the README gives.

This release adds the following new features:

**Database speed test** - how fast the databases answer WeKan's queries.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/46c0ad43e8">Results.md is a quick small-scale run, fastest first, with how many times slower each is</a>. Thanks to Raymond-Voogt and xet7.</summary>

The speed test was only ever run at twice a production WeKan, which takes hours.
`WEKAN_SPEEDTEST_SCALE=0.05` is 1/20 of one and the whole run takes under half
an
hour. Results.md opens with an **At a glance** table: rank, the total of all
queries, and **how many times slower** than the fastest database, for the
average
user and for the slowest one (the biggest board or the busiest user). Every
table
is ordered by its own numbers, so the slowest-user table can rank differently,
the
loading table is ordered by the whole load time, and the header says the real
data
size and the real operating system (it said "twice a production WeKan" and
"Linux" whatever was measured). `tests/dbSpeedTest.test.cjs` pins the ranks, the
ratios, the per-table order and the header, with a negative test for each.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/46c0ad43e8">The speed test includes pgrust, PostgreSQL rewritten in Rust</a>. Thanks to Raymond-Voogt and xet7.</summary>

[pgrust](https://github.com/malisper/pgrust) v0.4-beta is wire compatible with
PostgreSQL 18, so FerretDB's PostgreSQL handler uses it unchanged, and it gives
the
same answers as MongoDB. It is **not faster** than PostgreSQL for WeKan's
queries
(174 ms against 145 ms in total), and creating WeKan's 47 indexes takes 38 s
against 1 s. In the conformance run it is opt-in (`WEKAN_CONFORMANCE_PGRUST=1`).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f576a0cca9">The speed test includes TiDB, and the README says which other databases cannot run FerretDB and why</a>. Thanks to Raymond-Voogt and xet7.</summary>

TiDB 7.5 (Apache-2.0, MySQL protocol, one process on its own storage) runs
FerretDB's MySQL handler and gives the same answers as MongoDB, after one change
in FerretDB: its metadata table's generated columns are `VIRTUAL`, because TiDB
refuses `ALTER TABLE ... ADD COLUMN ... STORED`. Opt-in in the conformance run
(`WEKAN_CONFORMANCE_TIDB=1`). Noria has no JSON type, triggers or generated
columns, which the MySQL handler needs; YugabyteDB refuses a `CREATE INDEX` on a
`jsonb` expression, which every FerretDB v1 PostgreSQL index is; CockroachDB is
under a proprietary licence. The README's **Other databases tried** has the
reasons.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1c44876beb">The speed test includes Dolt, and VersionHistory tests what version history would give undo and redo</a>. Thanks to Raymond-Voogt and xet7.</summary>

[Dolt](https://github.com/dolthub/dolt) (git for data, MySQL protocol) runs under
FerretDB's existing MySQL handler and gives the same answers, but is by far the
slowest: 20,470 ms in total, 1,230x MongoDB, because every query over cards is a
2.8 s whole-table scan. `docs/Databases/FerretDB/1/VersionHistory` drives
WeKan-shaped changes through FerretDB onto Dolt and through the REST API of
TerminusDB. Dolt makes a commit per FerretDB write for +0.4 ms, undoes and
redoes
with `DOLT_REVERT` and reads any earlier state with `AS OF`, but names the SQL
user and not the WeKan user, and cannot restore one field of a document that
changed again (a conflict). TerminusDB records the author and message of every
commit and restores one field while later changes stay, but speaks neither the
MongoDB protocol nor SQL. WeKan's own History remains the undo; Dolt would be a
backup and audit layer under it. ClickHouse and StarRocks were tried with the
MySQL handler and need a handler of their own, which has not been written.
`tests/versionHistoryExperiment.test.cjs` and `tests/dbSpeedTest.test.cjs` pin
the
scripts and the findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/96d56ecc6c">Go databases that could be linked into FerretDB were compared with its SQLite: none is faster where it counts</a>. Thanks to Raymond-Voogt and xet7.</summary>

`docs/Databases/FerretDB/1/SpeedTest/embedded` is a Go module of its own (pure
Go,
no cgo) that loads the speed test's cards into SQLite set up as FerretDB sets it
and into Pebble, Badger, bbolt, BuntDB, Nutsdb and Clover, and asks each the
questions WeKan asks of cards, at 15,377 and 153,768 cards. Every engine must
give
the right counts first. A board's cards take the same time on every engine that
is
not slower, because decoding the JSON dominates; the key-value stores win single
reads and writes by microseconds that a FerretDB call hides, and would make the
handler do in Go what SQL does in SQLite. Pebble is 12x slower on fetching a
board, Clover 90-190x slower in total, and bbolt with its default fsync 100-160x
slower on writes. The README accounts for every entry of the awesome-go
databases section. `tests/embeddedEnginesBench.test.cjs` pins the export, the
engines, the SQLite setup and the conclusion.

</details>

**The header bar** - what sits beside the logo.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f25957dcf3">A full screen button to the right of the logo in the header bar</a>. Thanks to xet7.</summary>

A button puts the whole page in full screen and takes it out again with the
Fullscreen API, in iPad Safari, desktop browsers and Android browsers. Its label
is the existing Maximize, so no language file changes. It is drawn only where
the
browser offers the API and the page may use it: iPhone Safari does not have it
for pages (use Add to Home Screen, the manifest says `display: standalone`), and
neither does a page in an iframe without `allowfullscreen`. The icon follows the
browser's own events, so leaving with Esc is understood.
`tests/fullscreenButton.test.cjs`
drives the pure part with fake documents, including a refusal, and
`tests/playwright/specs/header-fullscreen.e2e.js` checks the position, the
label,
entering, leaving, Esc and the negative case in Chromium and WebKit.

</details>

and updates the following dependencies:

- **minimatch 10.2.6 → 11.0.4** in the `npm-packages/exceljs` and vendored
  `jade` lockfiles ([GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249),
  Dependabot alerts \#180 and \#182), through overrides on `readdir-glob`,
  `glob` 13 and
  `test-exclude`, as the root lockfile has; a test reads every
  `package-lock.json`.
- **klauspost/compress 1.18.0 → 1.18.7**, **golang.org/x/net 0.23.0 → 0.62.0**,
  **golang.org/x/text 0.14.0 → 0.43.0**, **golang/glog 1.0.0 → 1.2.4** and
  **OpenTelemetry 1.41.0 → 1.42.0** in the Go module of the embedded-engine
  benchmark (Dependabot alerts \#183-\#187; `govulncheck` reports none). A test
  holds
  every `go.mod` at or above these floors.

Thanks to dependabot.

and fixes the following bugs:

**Opened cards** - where a card opens.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/84b0480aa8">A card opened as a popup covers the header bars instead of opening below them</a>. Thanks to xet7.</summary>

On an iPad, a card opened from the Roadmap view (and from search results and the
table view) opened below the top header, and collapsed it was a bar floating
over
the swimlane. A card opened as a popup got the generic wide-layout rule
`top: 97px` and `z-index: 30`, because the desktop-mode rules that dock an
opened
card at the top skip a popup, while the popup wrapper rule in the same file says
it must cover the header bars. It now docks at `top: 8px` with `z-index: 2001`
in
the wide layout; mobile mode keeps its full-window rule. This was reproduced in
Chromium and in WebKit with an iPad profile; whether it is the whole of what an
iPad shows is for the iPad to say.
`tests/cardPopupOverHeader.test.cjs` pins the rule and
`tests/playwright/specs/card-popup-over-header.e2e.js` shows the card over the
header, open and collapsed, and fails without the fix (top 97 against a header
88
high).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1b05673200">The opened card and every popup move under a finger, on an iPad</a>. Thanks to xet7.</summary>

On an iPad the opened card did not move when dragged from the collapse caret,
the
space beside it, the card number, or the drag handle, while the page behind it
scrolled. The card window was moved by mouse events only, which a finger does
not
send while it moves, and its drag areas did not say `touch-action: none`, so the
browser took the gesture for a scroll. It is moved by Pointer Events now: the
header row or the handle starts the drag; a link or button in the row (the
caret,
close, the menu) still does its job when tapped and moves the window when
dragged,
without also collapsing or closing; the title still edits when tapped; and with
drag handles on only the handle moves it. The card number is above the title's
edit
zone, so it drags too. The window is kept within reach, and `touch-action: none`
is
on the card header, its handle and every popup's title bar and handle, so popups
move by finger as well.
`tests/windowDragTouch.test.cjs` pins the decisions and the wiring, and
`tests/playwright/specs/card-window-touch-drag.e2e.js` drags with a real touch
from
each place with handles on and off, taps the caret, drags with a mouse and moves
a
popup; the finger tests fail without the fix. Tested in Chromium; an iPad is the
final check.

</details>

and has the following documentation change:

**Database speed test** - what was improved, and what was tried and was not.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d05a42a5af">The speed test README lists the improvements since the last run, and what did not help</a>. Thanks to Raymond-Voogt and xet7.</summary>

SQLite sorts in the database and stores JSONB, PostgreSQL answers membership
from a GIN index and pushes down `$or`, `$elemMatch` and `$and`, MySQL and
MariaDB read through their indexes with multikey side tables, and WeKan no
longer scans whole collections every hour or at every start of every server. The
small run found one more: **PostgreSQL planned from no statistics** until
autovacuum analyzed a freshly indexed table, so a Due Cards query took 407 ms
and
84 ms after; FerretDB now analyzes the table when its indexes are created (the
PostgreSQL row went from 454 to 145 ms, and from last place to eighth). A
profile of Due Cards on SQLite found another: a membership test made SQLite turn
the whole `members` array into JSON text and parse it again for every row, and
reading it from the column instead cut the visible-boards query from 26 to 16 ms
(All Boards 6.9 → 4.9 and 5.9 → 3.9 ms, Due Cards 54.5 → 43.9 ms, the SQLite
total 82.7 → 68.3 ms) with identical answers. Tried and
not kept, with the numbers: sorting in the database on PostgreSQL (52 ms against
38-49 ms decoded in Go) and `ANALYZE TABLE` on MySQL and MariaDB (no change).

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.92 2026-11-03 WeKan ® release

**In short:** A missing **REST checklist** answers a JSON 404 instead of an
empty 500.

This release fixes the following bugs:

**REST API** - answers for things that are not there.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d231df56fc">A missing checklist, or one under another card, answers a JSON 404 instead of an empty 500</a>. Thanks to AhmedLukman and xet7.</summary>

[\#6867](https://github.com/wekan/wekan/pull/6867). `GET
/api/boards/:boardId/cards/:cardId/checklists/:checklistId` answered `500` with
no body when the checklist did not exist or belonged to another card. It now
answers `404` with `Checklist not found or does not belong to the specified
card`, the text the update and delete routes already use; the board-access check
and the parent-card check are unchanged. `tests/restChecklistGet.test.cjs`
drives
the registered handler (found, missing, another card, another board, access
denied, and a failing lookup that must not become a false 404) and
`tests/playwright/specs/rest-checklist-not-found.e2e.js` reads the checklist
over REST and after a page reload.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.91 2026-11-03 WeKan ® release

**In short:** A **GitHub CodeQL** finding in a test is fixed, and the guard
against
replacing text with itself now also sees patterns with a `^` or `$` anchor.

This release has the following developer-tooling fix:

**Code scanning** - the tests that guard the tree.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/62da564a1e">A test no longer replaces getLabel with itself, and the identity-replacement guard knows anchored patterns</a>. Thanks to GitHub CodeQL and xet7.</summary>

Code scanning alert #600 (`js/identity-replacement`, CWE-116):
`tests/boardLabelLookup.test.cjs` cut the `getLabel` method out of
`models/boards.js` and then ran `.replace(/^getLabel/, 'getLabel')` on it, which
does nothing because the slice already starts at `getLabel`. The line is gone.
`tests/noIdentityReplacement.test.cjs` skipped every regular expression with an
anchor, so it could not see the shape; a leading `^` or a trailing `$` over
plain characters is now compared like any other, with samples of both for the
guard to detect and the existing samples that must not be reported.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.90 2026-11-03 WeKan ® release

**In short:** The login page can have its own **background color**, Member
Settings
has a per-member switch, **Show focus outline**, to hide the blue focus ring,
and
**Escape closes the add-list composer**.

This release adds the following new features:

**Member Settings** - what each member can set for themselves.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/144777ae6b">Change Settings has Show focus outline, to hide the blue focus ring for yourself</a>. Thanks to mimZD and xet7.</summary>

[\#6755](https://github.com/wekan/wekan/issues/6755). The blue ring WeKan draws
round the focused control is an accessibility feature (WCAG 2.4.7) and stays on
by
default, but it also shows after a click on a minicard, and a member asked
whether
it can be turned off. Change Settings now has **Show focus outline**, ticked
while
the ring shows. Unticking it stores `profile.hideFocusOutline` for the signed-in
member (a method that takes no user id from the client) and puts a class on the
page that hides the outline and its halo for that member only; field borders and
the colour a button takes on focus stay. The label is translated into every
language file; the translations of these were written without a native speaker
and
are the least certain: Akan, Aymara, Bambara, Tibetan, Breton, Cherokee,
Dzongkha,
Ewe, Fulah, Fijian, Guarani, Manx, Hausa, Hawaiian, Igbo, Inuktitut,
Kalaallisut,
Kashmiri, Cornish, Luganda, Ladin, Nahuatl, Neapolitan, Northern Ndebele,
Northern
Sotho, Chichewa, Oromo, Quechua, Kirundi, Aromanian, Kinyarwanda, Northern Sami,
Samoan, Shona, Swati, Southern Sotho, Tigrinya, Tigre, Klingon, Tswana, Tongan,
Tsonga, Venda, Volapük, Walamo, Wolof, Xhosa and Tamazight.
`tests/hideFocusOutline6755.test.cjs` and
`tests/playwright/specs/hide-focus-outline-6755.e2e.js` pin it, including that
one
member hiding the ring does not hide it for another.

</details>

**The login page** - how the sign-in page and the support page look.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6b27764452">Admin Panel / Lay-out has a Login page background color, and the login text and the support page have a readable layout</a>. Thanks to Raymond-Voogt and xet7.</summary>

[\#6866](https://github.com/wekan/wekan/issues/6866). The login page stayed
grey whatever the Admin Panel said: the custom HTML fields only render after
sign-in and the text below the login logo is sanitised. The new setting
`loginBackgroundColor` takes a hex colour only (`#rgb` or `#rrggbb`); anything
else means "not set", so the value in the CSS custom property can never carry
CSS of its own. The text under the logo is white on a dark colour and black on a
light one. It is put on the page only while the sign-in layout is shown and
removed when it closes. The support page was text flush against the window edge
with no headings: it is now a centred white column of at most 860px, and the
text under the login logo gets the same column without a card of its own, both
with sized bold headings and space between paragraphs. The label is translated
into every language file. `tests/loginBackground6866.test.cjs` pins the colour
decision, that nothing but the validated value reaches the page, and the layout.

</details>

and fixes the following bugs:

**Lists** - the add-list composer.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f4b5025a7b">Escape closes the inline add-list composer</a>. Thanks to mimZD and xet7.</summary>

[\#6865](https://github.com/wekan/wekan/issues/6865). The composer that opens after
a list (or in an empty swimlane) stays open once a list is created, so several
can
be added, and only its X closed it: Escape did nothing. Escape now closes it,
with
the same reset as the X, at the level of an inlined form, and a click elsewhere
still does not. `tests/addListEscape6865.test.cjs` and
`tests/playwright/specs/add-list-escape-6865.e2e.js` pin it before and after a
list
is created.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.89 2026-11-03 WeKan ® release

**In short:** Keyboard **shortcuts run once on a non-Latin keyboard**: `d` no
longer opens the Due date popup and closes it again on a Farsi layout.

This release fixes the following bugs:

**Keyboard shortcuts** - what a key does on each layout.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0110e84ce5">A shortcut runs once on a Farsi, Cyrillic or other non-Latin keyboard</a>. Thanks to mimZD and xet7.</summary>

[\#6840](https://github.com/wekan/wekan/issues/6840). `d` opened the Due date
popup and closed it at a glance, "sometimes", for a reporter whose keyboard was
Farsi. `client/lib/keyboard.js` re-dispatched every key typed on another script
as its Latin key, a leftover from Mousetrap, which read the typed character.
hotkeys-js, which replaced it, resolves a key from `event.code` and `keyCode`
and so already ran the shortcut for the physical d key on any layout; the copy
ran
every shortcut a second time, the due date editor opened and the repeat clicked
the
same control again, closing it. The same doubling was behind Shift+D on a Latin
keyboard (#6750). The re-dispatch is gone. `tests/keyboardNonLatinOnce.test.cjs`
pins that no handler turns a typed character back into a key, and reads
hotkeys-js's own rule; `tests/playwright/specs/keyboard-nonlatin-once.e2e.js`
sends
real key events for Latin, Farsi and Cyrillic and counts one run each.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.88 2026-11-03 WeKan ® release

**In short:** **Every board theme** and **every color a member chooses** is
readable: the dark themes' **Card Settings**, popups and sidebars, the header of
eight themes, and a custom accent, text or label color made legible. A padded
**REST label** name no longer creates a second label.

This release fixes the following bugs:

**Dark themes** - cleandark, moderndark, dark and exodark.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a6b10e3592">Card Settings, popups, sidebars and the quiet text are readable in the dark themes</a>. Thanks to Samunosuke and xet7.</summary>

[\#6863](https://github.com/wekan/wekan/issues/6863). Card Settings drew white
text on light grey blocks (1.07:1 in cleandark); popup items, the board
sidebar's Keyboard shortcuts row, "Add custom field" and its sister buttons and
the sidebar's labels were black on dark (1.18 to 2.19:1); and a list header's
`!important` light grey beat each theme's own and left its light text on it
(1.09:1 in moderndark, 1.27:1 in exodark). Part of it was new: the accessibility
audit made the quiet text greys dark for every theme, so the dark themes showed
dark grey on dark; the rest was older, rules that never followed the dark
themes. The quiet text is now a variable, `#595959` on the light themes and a
light grey where the surface is dark (cleandark, moderndark, and dark and
exodark on the board, the card and the sidebar); Card Settings' sections, its
muted text, the popup items, the quiet buttons, the shortcuts row, the sidebar
labels, dark's swimlane header and moderndark's selected minicard and primary
buttons follow the theme; and the list header's `!important` is gone.
`tests/playwright/specs/46-axe-theme-contrast.e2e.js` runs axe-core's colour
contrast rule on the four themes (the board, the sidebar, Card Settings, an
opened card and the custom fields popup) and finds nothing;
`tests/darkThemeContrast6863.test.cjs` pins each rule. The header colours of
relax, nephritis and modern, and a few lines of clearblue and cleanlight, are
still below 4.5 and are listed in the accessibility audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8b2114cd0f">Every board theme, and every color a member chooses, is readable</a>. Thanks to Samunosuke and xet7.</summary>

[\#6863](https://github.com/wekan/wekan/issues/6863) asked to check the other
themes too, and the same scan was run on all 25. White text on the accent was
2.1 to 4.3:1 in nephritis, pumpkin, moderatepink, strongcyan, limegreen, relax,
corteza and modern, and their dark, hover and emphasis shades were as low: the
accents are darkened, with the same hue, until white text and the header's
`#f2f2f2` labels read at 4.5:1, and the hover and selected shades follow
(limegreen
is a forest green now, strongcyan a teal: white at 4.5:1 cannot be had on a
bright
accent). The colour-slide themes that end in the same colours read too. The
filter sidebar's headings (`#808080`, in every theme), the clear themes' quiet
text and cleanlight's add-dependency link are darker. No colour contrast failure
is left on the board, the sidebars, Card Settings, an opened card and its popups
in any theme. axe-core cannot measure text over a gradient, so the six
colour-slide headers are not covered by it.

A color a member chooses is one half of a pair, and the other half is worked out
(`models/lib/contrastColor.js`). A custom theme accent, or the two ends of a
custom
slide, is darkened under the header's white text until it reads, and the
picker's
preview shows the color that will be drawn. The text color from Member Settings
is
moved, with its hue, until it reads at 4.5:1 on the surfaces of the theme in
use,
says so when it changed, and no longer reaches the header bars, labels and
primary
buttons, which sit on a color of their own (`#626262` was 1.18:1 on the blue
header). A dependency line is drawn at 3:1 against the surface. Kanri's tag text
is the better of dark and light, which the brightness test it replaces was not.
A
custom label, card, list or swimlane color already derived its text, black or
white, and that is now pinned at 4.5:1 for every color.
`tests/playwright/specs/46-axe-theme-contrast.e2e.js` scans every theme and four
colors that do not read; `tests/customColorContrast.test.cjs` pins the rules.

</details>

**REST API** - board labels.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0426c7741a">A padded label name finds the stored label instead of creating another</a>. Thanks to AhmedLukman and xet7.</summary>

[\#6864](https://github.com/wekan/wekan/pull/6864). A label is looked up by name
and color before one is added, and the lookup compared the name as it was sent
while the schema stores it trimmed, so a padded " Bug " missed the stored "Bug"
and every repeat of the request created another label with the same name and
color. The pull request trimmed the name in the REST builder; the lookup is
shared
by the card's label form, the importers and the list sync, so it trims too, and
a
legacy label stored with padding is still found. A different color, letter case
or inner space stays a different label. `tests/boardLabelLookup.test.cjs` pins
it.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.87 2026-11-03 WeKan ® release

**In short:** A **REST API** "get one" that finds nothing answers **404**
instead of 200 with an empty body.

This release fixes the following bugs:

**REST API** - what a request for one item answers when there is none.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1ded34dfdd">A single-item GET that finds nothing answers 404, not an empty 200</a>. Thanks to AhmedLukman and xet7.</summary>

[\#6862](https://github.com/wekan/wekan/pull/6862). The scoped card GET
(`/api/boards/:boardId/lists/:listId/cards/:cardId`) sent HTTP 200 with no body
for a missing, wrong-list, wrong-board or archived card, which a client cannot
tell from a card with nothing in it. The pull request fixed that one route; the
same shape was in the list, swimlane, custom field, comment and integration
GETs, and the user GET threw a TypeError for an unknown name, which reached the
caller as a server error. Each now answers 404 ("Card not found", "List not
found" and so on). The board check stays first in each, so someone with no
access gets the same answer for an existing and a missing id. The global card
GET, which finds a card by id alone, already answered 404.
`tests/restSingleItem404.test.cjs` runs every one of these routes from its own
source with a cache that finds nothing, something, and a stranger, and fails if
any single-item GET route under server/ has no not-found branch.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.86 2026-11-02 WeKan ® release

**In short:** The daily **notification cleanup** and the **file integrity
audit**
run once for the whole installation, not once per server.

This release fixes the following bugs:

**Database load** - work that every server of a cluster repeated.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4e28465964">The notification cleanup and the file integrity audit run once, not on every server</a>. Thanks to Raymond-Voogt and xet7.</summary>

[\#6861](https://github.com/wekan/wekan/issues/6861). The notification cleanup
ran at every start and daily on every server, reading and rewriting the same
18,000 users 24 times at a rollout, and a notification another server added
between a read and its write was lost. A run now claims a document per job and
day in the dailyJobRuns collection (a duplicate key means another server has
it), and the timer looks hourly for an unclaimed day, so the cleanup still
happens daily when no server restarts. The file integrity audit read its last
run, checked it, and then wrote it, so two servers whose hourly check fell at
the same moment both scanned every file; one atomic update, matching only while
the last run is older than the interval, now claims the run. Continuous backup
has no leader and every server writes its own stream into the same directory;
that needs a lease, which is not built, so the documentation now says it is for
one server, and item 3 of the issue stays open. `tests/dailyClaim.test.cjs`
pins the claims with 24 servers at once, that other database errors are not
swallowed, and that neither job runs unclaimed.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.85 2026-11-02 WeKan ® release

**In short:** The findings of the **accessibility audit** are fixed in the
default theme: header and label **colour contrast**, names that contain the
visible text, named form fields, card section headings that are real buttons,
and landmarks and headings on every page. axe-core now finds no violation on
22 pages. A cleared database connection pool is reported as a lost connection.

This release fixes the following bugs:

**Accessibility** - what an automated axe-core scan of the default theme found
(see Audit.md in docs/Features/General/Accessibility).

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c8bcc4817d">axe-core finds no violation on 22 pages of the default theme</a>. Thanks to xet7.</summary>

The audit of 2026-11-02 found, on seven pages, colour contrast of the header
bars and the labels (WCAG 1.4.3), a Label in Name mismatch on the Starred menu,
the user menu and the avatars (2.5.3), form fields without a name (4.1.2),
headings that were buttons holding other controls (4.1.2), and missing
landmarks and headings. Each is fixed, and the scan, now on 22 pages (the
signed-out ones, All Boards and its lists, the other pages, the Admin Panel, a
board and an opened card), finds nothing.

The default theme's blue is `#2573a7` instead of `#2980b9` everywhere the
stylesheets, the accent table and the colour picker name it, so white and the
`#f2f2f2` button labels reach 5.14 and 4.59. The label colours green, red, sky,
magenta and gray and the Global search list chips have black text. The quiet
greys `#8c8c8c` and `#727479`, the "no items" text and the grey board tiles
are darker. The Starred menu, the user menu link and an avatar drawn as initials
have those letters or numbers in their accessible name. The Pomodoro field and
the comment, description and edit-comment editors have a name (the editor takes
a `labelKey`). A section heading of the card details is an `h3` holding a real
`button` with `aria-expanded`; the section menu and the layout toggle are
beside the button, and Enter, Space and a click on the heading still fold the
section. The sign-in and register form is the `main` landmark, its title is the
level-one heading and the empty logo `h1` is a spacer; every other page's title
in the header bar is the level-one heading, Activity, Import and Bookmarks have
one, and the shortcuts list can be reached by keyboard.

`tests/accessibilityAuditFixes.test.cjs` pins each fault by its shape (contrast
ratios are computed from the stylesheets), and
`tests/playwright/specs/45-axe-accessibility.e2e.js` runs axe-core on the pages
and fails on any violation. Other board colours and themes, the phone width,
dark mode, popups, and the views not scanned still need the same check.

</details>

**Database problems** - how Admin Panel -> Problems and the startup read the
database.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/abc23a7eda">A cleared connection pool is a lost connection, and the board key backfill uses the key index</a>. Thanks to Raymond-Voogt and xet7.</summary>

[\#6860](https://github.com/wekan/wekan/issues/6860). While a MongoDB pod
restarted, a method's "Connection pool for <host> was cleared" reached Admin
Panel -> Problems as "did not match its schema": collection2 wraps a failed
write as "ValidationError: Failed validation" plus the driver's text, so the
class name PoolClearedError was gone, and the host in the text is a replica set
member's name (wekan-mongodb-0.wekan-mongodb-internal in a StatefulSet) that
MONGO_URL does not list, so the "getaddrinfo ENOTFOUND" behind it did not count
as the database's. The text itself is now a lost connection, for the Problems
page and for both startup guards, and a message about a pool setting is not.
The board key backfill looked for boards without a key with an `$or` that
included an exists-false branch, a scan of every board at every start of every
server (32,600 boards in the report); `key: null` already matches a missing
field, so one `$in` on the `key` index finds the same boards, and the same
selector still guards the writes, so a key a board admin set meanwhile is never
replaced. `tests/databaseErrorsWrappedCause.test.cjs` and
`tests/boardKeyBackfill.test.cjs` pin both, and that no exists-false branch on
`key` is left.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.84 2026-11-02 WeKan ® release

**In short:** GitHub code scanning's **code-quality** findings are fixed: a
promise formatted as text, undeclared globals, an upload that hung on an
unreadable file, and the lint around them. `npm run lint:promises`
now finds promises that are not awaited or handled.

This release fixes the following bugs:

**Code quality** - findings of GitHub code scanning.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/582a22c291">The real faults among the code-quality findings, and the lint around them</a>. Thanks to GitHub CodeQL and xet7.</summary>

A card's original-position description formatted a promise, because it did
not await the history it reads. The attachment swipe distances and two
drag-scroll locals were undeclared globals. A file that cannot be read during
a GridFS upload now unlinks itself instead of leaving the upload open, since
`pipe()` does not pass a read error on. `api.py` called `exit()`, which is
missing when the site module is not loaded, and its usage branch never
exited; it uses `sys.exit()`. A rules test redefined a property and a
security-log test kept an unreachable branch. Besides these: 31 missing
semicolons, unused imports in the card details, the exporters and the
attachment API, unused Python imports, and a comment on each empty except
clause. The list-sync scanner test cut its source at the last
`Meteor.startup`, which the index startup of the schema-scan fix had moved;
it now cuts at the first one after the scanner. Two unhandled rejections are
caught as well: the instance-editing
hook's board lookup and the service worker registration.
`tests/codeqlFindingsRegression.test.cjs` pins the shape of each fault.
Findings in vendored bundles (the Office viewer, Jade, capnp-es, exceljs)
and style-only ones are left as they are.

</details>

and has the following developer-tooling fixes:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f1d2a497bc">npm run lint:promises finds promises that are not awaited, handled or marked void</a>. Thanks to xet7.</summary>

GitHub code scanning's "Missing await" finding was a real fault in
`models/cards.js` (a description formatted a promise), and a plain ESLint
cannot see that kind of mistake because it does not know which calls return a
promise. `npm run lint:promises` runs typescript-eslint's
`no-floating-promises` and `no-misused-promises` over `models/lib`,
`server/lib` and `imports/lib`, with the type information read from
`tsconfig.lint.json`; the code stays JavaScript and nothing is type-checked.
The eleven findings were promises that already catch their own errors, now
marked `void`, and three checks that used a promise as a boolean.
`tests/promiseLint.test.cjs` keeps the configuration in place and the tree
clean.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.83 2026-11-02 WeKan ® release

**In short:** An **LDAP** login with a reused login name no longer opens the
previous owner's account, and existing accounts record their directory
identifier.

This release fixes the following bugs:

**LDAP** - matching a directory entry to a WeKan account at login, import and
background sync.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e91c14cd9a">A reused login name no longer opens the previous owner's account</a>. Thanks to Raymond-Voogt and xet7.</summary>

[\#6859](https://github.com/wekan/wekan/issues/6859). The login looked for the
account by the entry's unique identifier, then by username, then with
LDAP_EMAIL_MATCH_ENABLE by e-mail, and the last two did not check whether the
account already belonged to another directory entry. When a directory gave a
deleted employee's sAMAccountName to a new colleague, the new colleague logged
into the old account and saw its boards, cards and comments; two entries
sharing an e-mail address did the same, and so did the import with
LDAP_MERGE_EXISTING_USERS. An account that records an identifier of the same
attribute with a different value is now refused at login ("LDAP
authentication failed") and skipped by the import. An account without an
identifier, with an identifier of another attribute, or with an identifier
without its attribute (made before \#4654) is still accepted, so switching
LDAP_UNIQUE_IDENTIFIER_FIELD to objectGUID locks nobody out. When that field is
empty the identifier is the login name itself, so a reused name cannot be
detected: set it to objectGUID or entryUUID.

Three more faults in the same matching are fixed. An existing account never
recorded services.ldap.id and its attribute (only a new account did), so
accounts from before \#4654 never got an attribute and a changed
LDAP_UNIQUE_IDENTIFIER_FIELD never took effect; the login and the sync now
record both. LDAP_EMAIL_MATCH_REQUIRE looked the user up with _id equal to the
username, which never matches a random id, so every existing user's login
tried to create the account again; it uses the username. The background sync
bound an account without an identifier to the first of several entries with
its name; it now skips that account, neither updating nor disabling it.
`tests/ldapAccountBinding.test.cjs` pins each of these, and that no lookup by
_id equal to the username is left in the package and no name or e-mail match
reaches the login without the check. A refused login is not recorded in
Admin Panel -> Problems: the LDAP package cannot reach the application's
security log, and the new colleague who is refused is not an attacker.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.82 2026-11-02 WeKan ® release

**In short:** A card moved to another board, restored from the archive or given
a number no longer takes a **card number** another card on that board has.

This release fixes the following bugs:

**Card numbers** - the number each card has on its board.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e68938698c">A moved, restored or renumbered card cannot take a number another card has</a>. Thanks to Raymond-Voogt and xet7.</summary>

[\#6858](https://github.com/wekan/wekan/issues/6858). Follow-up to
[\#6815](https://github.com/wekan/wekan/issues/6815), which checked the number
of every new card. A card also enters a board's numbering through an update: a
move to another board, where the browser computed the number from the
destination cards it had loaded, usually none, so the card got 1 or another
low number already taken; a restore from the archive, since an archived card
may share its number with an open one; and a number set by the REST API or an
import. Three card numbers used by more than one open card showed up again in
Admin Panel -> Problems -> Data health two days after the renumbering. A
before-update hook now does what the insert hook does: a number another card
on that board has is replaced by a fresh one from the board's counter, after
raising the counter to the board's highest number; a free number is kept and
the counter raised past it. The card itself never counts as taken, and
ordinary edits, moves within a board, archiving and cards without a number
are left alone. `tests/cardNumberUnique6815.test.cjs` pins which updates are
checked, the move, the restore and the free numbers.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.81 2026-11-02 WeKan ® release

**In short:** The **database health** probe reports a finding once, not once
per server.

This release fixes the following bugs:

**Database health** - the probe behind Admin Panel -> Problems -> Database.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/114e9ecd5a">One server probes the database per period, so a finding is reported once</a>. Thanks to Raymond-Voogt and xet7.</summary>

[\#6857](https://github.com/wekan/wekan/issues/6857). Every server read the
same MongoDB log and counters every five minutes and recorded each finding
itself, so one collection scan became up to 24 identical rows with 24
replicas - more than 400 warnings over 68 pages in the report. A probe now
claims the period in one shared document (collection databaseHealthProbe);
only the server that gets it probes, a duplicate key means another server has
it. The state that compares one probe with the next - log lines seen, the
scanned-documents counter, uptime, restarts, latencies - lives in that
document, so the next probe on whichever server continues where the last one
stopped. A server without the claim still checks its own data directory, and
a claim that cannot be made at all does not stop the probe.
`tests/databaseHealthProbeClaim.test.cjs` pins the claim, the shared state
and that each finding is reported once.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.80 2026-11-02 WeKan ® release

**In short:** **minimatch** is updated to 11.0.4 for GHSA-g3hv-75wg-m249, a
glob pattern that used up CPU and memory.

This release updates the following dependencies:

- **minimatch 10.2.6 → 11.0.4** — Dependabot alerts #180 and #182,
  [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)
  (CVE-2026-118764, CWE-405, moderate): before 11.0.1 a crafted glob pattern
  made it grow its glob parts without bound and compare them pairwise, using
  up CPU and memory. It came in through archiver, typescript-eslint and
  Babel's CLI; all of them now use 11.0.4, and
  `tests/minimatchGlobparts.test.cjs` fails if a 10.x copy returns
  ([commit](https://github.com/wekan/wekan/commit/a3630d96ce)).
  Thanks to dependabot.

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.79 2026-11-02 WeKan ® release

**In short:** A cluster of servers runs the **schema re-check** and the
**due-date reminders** once, and a slow-query warning says which query it is.
The site **announcement** shows on Home and All
Boards too. The **date picker** popup shows the year and has year, month and
day drop-downs under the calendar. The **macOS sandbox** for VSCodium no longer
asks for a keychain, starts from the checkout, and can carry a **Claude Code**
token so its login sticks.

This release fixes the following bugs:

**Database load** - work that every server of a cluster repeated.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d42369e96a">The schema re-check and the due-date reminders run once, not on every server</a>. Thanks to Raymond-Voogt and xet7.</summary>

[\#6855](https://github.com/wekan/wekan/issues/6855). With 24 replicas on one
database every start of every server re-checked the schema, reading 1.1
million cards several times, and each server sent its own due-date reminder
for every card. The re-check now claims a run in the migration collection, so
one server does it and the others skip; a claim older than 2 hours, from a
server killed mid-run, is taken over. A run that leaves work it cannot do
(an attachment whose file is gone) is retried once a day instead of at every
start, and a clean run clears that. The daily reminder scan is claimed per day
in the dueReminderRuns collection, so the first server scans and the rest get
a duplicate key and skip. A partial index on lists serves the 15-minute list
sync scan, and a sparse index on boards.dueReminderDays the due-date lookup.
`tests/schemaUpgradeSteps.test.cjs` and `tests/dueScanClaim.test.cjs` pin the
claims, the stale takeover, the daily retry and that the scheduler claims
before it scans.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc79de8c57">A collection-scan row names the command, the operators per field and the queryHash</a>. Thanks to Raymond-Voogt and xet7.</summary>

[\#6856](https://github.com/wekan/wekan/issues/6856). Admin Panel -> Problems
-> Database named only the collection and the filtered fields, for example
"wekan.lists (filter on archived,syncSource.enabled,syncSource.type)", which
does not say which query it is, and a slow getMore read "filter on nothing".
The row now shows the command (find, distinct, aggregate, ...), for a getMore
the query it continues, each field with the operators used on it - for example
`archived:$exists` or `$nor[sort:$gte$lte]` - and MongoDB's queryHash, so
the query can be found in the code and with explain(). Values never reach the
row. `tests/databaseHealthScans.test.cjs` pins the shape, the queryHash, the
getMore origin and that no value leaks.

</details>

**Announcement** - the site announcement of Admin Panel -> Announcement.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/64b5762020">The announcement shows on Home and on every All Boards list</a>. Thanks to titver968 and xet7.</summary>

[\#6854](https://github.com/wekan/wekan/issues/6854). The banner waited
for the user to be a member of the current board, and Home, Remaining, Starred,
Templates and the other All Boards pages have no current board, so it showed
only on boards. It now shows to every signed-in user on those pages, and to the
members of the open board on a board page; a visitor who is not signed in still
does not see it (#1281).
`tests/announcementAudience.test.cjs` pins the rule and that no membership test
of a current board is left in front of the banner.

</details>

**Date picker** - the calendar in the Received, Start, Due and End date popups.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/45c291b406">The calendar heading shows the year as well as the month</a>. Thanks to brlin-tw and xet7.</summary>

[\#6853](https://github.com/wekan/wekan/issues/6853). The popup calendar
heading named only the month, so after the arrows had moved past December
there was no sign of which year was shown; the selected date beside it does
not change when the month does. The heading now reads for example "January
2027", in every calendar system. `tests/calendarPickerControls.test.cjs` pins
the year in the heading and that no picker mode leaves it out again, and the
Playwright date display spec expects it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dcaa316a01">Any year by number, and month and day drop-downs, under the calendar</a>. Thanks to brlin-tw and xet7.</summary>

[\\#6853](https://github.com/wekan/wekan/issues/6853). The heading above the
calendar now shows only the month and the year, no longer the YYYY-MM-DD of
the selected day. Under the calendar are three controls: a year field, where
any whole year can be typed or stepped to - thousands of years back or ahead,
0 being 1 BC and -2999 3000 BC, as far as a date reaches (about 275,000 years
either side of 1970) - a drop-down of the months of that year, and one of the
days of that month. A pick selects the date and shows its month; Enter in the
year field applies the year instead of saving the popup, and a value that is
not a year puts the field back. The months and days are read from the calendar
system in use, so they hold for the Islamic, Hebrew, Japanese and every other
system, including leap months and a short thirteenth month. A day that the new
month lacks falls to its last day. Calendars whose eras restart or switch the
count (Japanese, ROC, Coptic, Ethiopic) refuse a year no number can name.
`tests/calendarDropdowns.test.cjs` checks ten calendar systems and that no
date text is left in the heading.

</details>

and has the following developer-tooling fixes:

**The macOS sandbox** - running VSCodium and Claude Code in the sandbox on a
Mac.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c58b2896d1">VSCodium no longer asks for a keychain in the macOS sandbox</a>. Thanks to xet7.</summary>

The sandbox refuses `~/Library/Keychains`, so VSCodium's secret storage asked
for a keychain to keep "VSCodium Key" in, with a "Reset To Defaults" button
that would have replaced the login keychain. `sandbox.sh` now starts VSCodium
with `--use-mock-keychain`, so the real Keychain is never touched. The README
explains the price: extension secrets in `.tools/vscodium/user-data` are only
obfuscated. `tests/macosSandbox.test.cjs` covers the sandbox script.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/21c94ce098">Claude Code stays signed in inside the macOS sandbox, and the sandbox starts in the checkout</a>. Thanks to xet7.</summary>

Claude Code keeps its login in the Keychain, which the sandbox cannot reach.
`sandbox.sh --claude-token` now saves a token from `claude setup-token` to
`.tools/secrets/claude-oauth-token` (read from the clipboard, line breaks
joined, a cut-short token refused) and passes it as `CLAUDE_CODE_OAUTH_TOKEN`,
with onboarding marked done and the extension's login prompt off. The script
also changes to the checkout first, because Finder starts it in the home
directory, which the sandbox refuses ("EPERM: process.cwd failed"), and starts
VSCodium with `nohup` so closing the launcher's Terminal does not close it.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.78 2026-11-02 WeKan ® release

**In short:** **CrossBoardExportBleed** and **UnassignedAttachBleed** are
fixed: a checklist scope stays on its board, every export obeys Disable all
export and Anonymize export users, and an assigned-only member changes
attachments only on their own cards. **SAML** logins use **node-saml 5.2.0**,
and **continuous backup** no longer misses a change made right after it starts.
**Keyboard shortcuts** keep working after a popup closes, and the Rules page has
a way back to the board.

This release fixes the following CRITICAL SECURITY ISSUES:

**Exports** - what a board export may contain, and whether it runs at all.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/be6727607c">A checklist scope stays on its board, and every export obeys Disable all export and Anonymize export users</a>. Thanks to ccsimplyspolit and xet7.</summary>

[CrossBoardExportBleed](https://wekan.fi/hall-of-fame/crossboardexportbleed/),
[GHSA-8885-xrq4-j47h](https://github.com/wekan/wekan/security/advisories/GHSA-8885-xrq4-j47h).
A board export scoped with `?checklistId=` streamed a checklist of another,
even private, board with its items and creator; it is now bound to the
exported board's cards. The streaming CSV/TSV export ignored Disable all
export and Anonymize export users, and so did the Excel, PDF, chart, calendar
and external-format exports: every export route now refuses with 403 when
export is disabled, and every exporter that names people anonymizes. Refusals
are shown in Admin Panel / Problems.

</details>

**Attachments** - who may add or delete a card's files through the API.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/532a96da11">An assigned-only member adds and deletes attachments only on cards assigned to them</a>. Thanks to Javier García Herrera and xet7.</summary>

[UnassignedAttachBleed](https://wekan.fi/hall-of-fame/unassignedattachbleed/),
[GHSA-w26g-rc43-q6cm](https://github.com/wekan/wekan/security/advisories/GHSA-w26g-rc43-q6cm).
A member with the Normal, assigned only role whose card assignment was removed
kept the card and attachment ids, and `POST /api/attachment/upload` and
`DELETE /api/attachment/delete/:id` still added a file to that card and
soft-deleted its existing one: both asked only for board write access. The
DDP methods, and copy and move onto a target card, had the same gap. All
eight handlers now apply the card rule the ordinary card Delete used, and a
refusal is shown in Admin Panel / Problems.
`tests/unassignedAttachBleed.test.cjs`
fails if any attachment API write lacks it.

</details>

and updates the following dependencies:

- **isomorphic-git 1.44.3 → 1.44.8** — the GitHub wiki sync
  ([#6846](https://github.com/wekan/wekan/pull/6846)).
- **@node-saml/node-saml 5.1.0 → 5.2.0** — SAML; see the fix below, without
  which it changed nothing that runs ([#6850](https://github.com/wekan/wekan/pull/6850)).
- **@typescript-eslint/eslint-plugin 8.72.0 → 8.72.1** — lint only
  ([#6849](https://github.com/wekan/wekan/pull/6849)).
- **@rspack/dev-server 2.2.1 → 2.2.2** — development server only
  ([#6848](https://github.com/wekan/wekan/pull/6848)).
- **mailparser 3.12.2 → 3.12.4** — inbound email and bounces
  ([#6845](https://github.com/wekan/wekan/pull/6845)).
- **i18next 26.5.4 → 26.5.11** — translations
  ([#6847](https://github.com/wekan/wekan/pull/6847)).
- **@aws-sdk/client-s3 3.1155.0 → 3.1159.0** — S3 backups; see the
  @smithy/core fix below ([#6844](https://github.com/wekan/wekan/pull/6844)).
- **imapflow 2.8.0 → 2.9.1** — the IMAP mailbox
  ([#6842](https://github.com/wekan/wekan/pull/6842)).
- **glob 13.0.6 → 14.0.3** — no WeKan code loads it: it is only the target of
  an `archiver-utils` override that archiver 8 no longer needs; @babel/cli and
  rimraf keep their own copies ([#6851](https://github.com/wekan/wekan/pull/6851)).
- **helm/chart-releaser-action 1.7.0 → 1.8.0** and **docker/login-action 4.6.0
  → 4.7.0** — CI, each still pinned to the commit its tag names
  ([#6843](https://github.com/wekan/wekan/pull/6843),
  [#6841](https://github.com/wekan/wekan/pull/6841)).

Thanks to dependabot.

and fixes the following bugs:

**Dependencies** - what the updates above did, and did not, change.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5c50f38e25">SAML logins are verified by node-saml 5.2.0, as package.json says</a>. Thanks to xet7.</summary>

The bump changed the app's `package.json`, but a login is verified by the
`wekan-accounts-saml` package's own copy, still pinned to 5.1.0 - so nothing
that runs changed. 5.2.0 rejects a message with more than one Issuer, checks
`idpIssuer`, rejects a `RelayState` that is not the signed one, and checks a
POST LogoutResponse's status and issuer. The package pins 5.2.0 now, and
`samlLogin.test.cjs` requires both to name the same version. A login
roundtrip with the package's copy logs in a signed Response and a signed
Assertion, and refuses a changed NameID, another key, an unsigned response and
an answer to a request WeKan never made.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/338afc15f8">@smithy/core 3.38.1, the AWS SDK's logger redaction fix</a>. Thanks to xet7.</summary>

The S3 SDK bump resolved `@smithy/core` 3.37.0, deprecated for a bug that
passed sensitive fields nested in lists or maps unredacted to a custom logger
([aws-sdk-js-v3#8393](https://github.com/aws/aws-sdk-js-v3/issues/8393));
3.36.2 before it had the bug too. WeKan's only AWS client, the S3 backup,
passes no logger, so nothing leaked. Updated in the lockfile only, one
package; the telemetry gate (`releases/check-telemetry.py`), which had failed
on the deprecation note's new github.com link, passes again. The ten updates
add no package, install script, network host or telemetry, and every tarball
matches its lockfile hash.

</details>

**Continuous backup** - what it sees right after it starts.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8cbe2605fe">Files are watched before the first scan, and a macOS start catches up once</a>. Thanks to xet7.</summary>

The file engine scanned its sources first and only then started watching, so
a change made between the two waited for the next scan, five minutes by
default. macOS FSEvents also delivers nothing for a moment after a watcher is
created. The watchers start first now, sharing one queue with the scan so a
change is recorded once, and on macOS one catch-up scan runs two seconds after
the start; Linux's inotify needs none. A new test with a silent watcher pins
the order, the macOS catch-up and that Linux runs no second scan.

</details>

**Single-file builds** - signing and the start/backup commands.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8d4f4caa2f">A macOS build is signed whatever its target is called, and start/backup return once WeKan runs</a>. Thanks to xet7.</summary>

Only a target named mac or darwin was ad-hoc signed, so a Mach-O built under
another label had the signature its injected archive invalidated, and macOS
killed it before it printed anything. Every Mach-O output is signed now, read
from the file's magic number. `start --background` and `backup` returned
before WeKan wrote its pid file, so a `stop` right after them said WeKan was
not running and left it running; both wait now until the pid file names the
process they started. `singleFile.test.cjs` passes 24 of 24, the real single
executable included.

</details>

**Release builds** - the bundles each platform downloads.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/24a7270b7f">Android bundles start again: npm 12 runs argon2's and bcrypt's install scripts</a>. Thanks to xet7.</summary>

npm 12 lets only declared dependencies run install scripts, and the rebuild
directories declared none, so argon2 and bcrypt were never compiled. Prebuilds
hid it everywhere except Android, whose bundles crash-looped on "No native build
was found for platform=android". Each rebuild directory now declares the
reviewed installers it holds, and the Android build loads both before starting
WeKan.

</details>

**Filters** - the filter sidebar's date ranges.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c5f5ad2338">A refused date range says why in the form, so Clear still works in Firefox</a>. Thanks to xet7.</summary>

A reversed card date or card movement range was reported with the browser's
validation bubble, which Firefox opens over the Apply and Clear buttons and
which took every click on them: the range could not be cleared. The end date
is still marked invalid, and the reason is a `role="alert"` line in the form;
editing the range or Clear takes it back.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4ad13db5ef">The date-range forms are checked by WeKan, not refused by WebKit after Clear</a>. Thanks to xet7.</summary>

After Clear, WebKit kept a half-edited date in the From field and silently
refused the next submit, so a new range never applied. Both forms are
`novalidate` now; WeKan's own check already marks a refused range and says
why.

</details>

**History recovery** - an undo or redo that is still waiting for the server.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/96845f6f4b">Retry is enabled only once the board lets this person write on it</a>. Thanks to xet7.</summary>

After a reload the notice showed before the board and its members arrived,
and a Retry clicked then did nothing and the notice stayed. Retry is disabled
until it can act; Forget stays usable.

</details>

**Keyboard shortcuts** - when a focused button or link lets them through.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ba0de93f79">Shortcuts keep working after a click on a minicard or a closed popup</a>. Thanks to mimZD and xet7.</summary>

The shortcut filter refused every key while a link or button had the focus.
The minicard is itself a link, so clicking its date badge or menu left it
focused, and closing a popup returns focus to its opener: hovering a card and
pressing d did nothing until a reload. A focused control now keeps only its
own keys - Enter, Space for a button, the arrows for a tab - and every other
key is a shortcut again ([#6755](https://github.com/wekan/wekan/issues/6755)).

</details>

**Rules** - the way back from the Rules page.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/34d9817110">The Rules page has a Back to the board</a>. Thanks to mimZD and xet7.</summary>

The page lost its Back with its old sidebar, and only the trigger, action and
rule details pages kept one, to the rules list. The list and its Workflow,
Bots, Blocks and History views now link back to the board; the three
sub-pages keep only their own Back ([#6852](https://github.com/wekan/wekan/issues/6852)).

</details>

**Sign-in** - the error shown on the sign-in page.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3a2fef4dc7">Login errors are rendered from template state, so a redraw of the form keeps them</a>. Thanks to xet7.</summary>

The error region sits inside the form's loading switch, and an error written
into it was lost whenever that part of the form was drawn again. The template
now renders the message as escaped text from a reactive value. The SAML error
test also waits for the finished form before it clicks.

</details>

**Whiteboard** - how its lines are drawn.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/40f60582b7">A line is drawn at its own width, not the whiteboard's 800</a>. Thanks to xet7.</summary>

The line's `stroke-width=width` found the template's `width` helper - the
drawing's width - before the line's own field, so every line was drawn 800
wide, one black shape over the whole whiteboard. The lines use `strokeWidth`
now, and a test fails if any of their fields shares a helper's name.

</details>

and has the following developer-tooling fixes:

**The whole-suite run** - EVERYTHING, on a Mac and in a sandboxed editor.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/16103f9ad2">The test database is kept in .tools/, not beside the checkout</a>. Thanks to xet7.</summary>

`build.sh` and `build.bat` put the :3001 test database in the checkout's
parent directory, the one thing a test run wrote outside the repository, and a
sandboxed editor could not create it. It is `.tools/mongodb-test-<port>` now;
`toolsDirOnly.test.cjs` pins it in both scripts.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7f948bf438">On macOS the Playwright container uses Docker's bridge network, not the host network</a>. Thanks to xet7.</summary>

Firefox tests waited the full 60 seconds for a page whose document never
came. Docker Desktop's host network lost about one connection in 75 to
`host.docker.internal` (8 of 600 connects never completed), while the bridge
network lost none in 1000. Nothing there needs the host network on macOS, so
the container uses the bridge network; Linux keeps the host network.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d9e48a909d">The list-sync specs' mock servers are reachable from WeKan when the browsers run in Docker on macOS</a>. Thanks to xet7.</summary>

WeKan fetched from mock Jira and GitLab servers on the container's loopback,
which Docker Desktop keeps from the host. build.sh already forwarded the test
SMTP port into the container; it now forwards a small pool of ports the same
way, and those specs take one of them.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ffe207e191">The Docker test proxy dials the host again when a connect is never answered</a>. Thanks to xet7.</summary>

On the bridge network too, Docker Desktop's gateway now and then left one
connect to the host unanswered through nine retransmits while the next went
straight through. The proxy reads nothing from the browser until a connection
is up, drops a dial that has not connected in 1.5 seconds and dials again, up
to five times, so no byte is lost or sent twice.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8a1f7a14a9">The Playwright container sees the repo and the files root at their own host paths</a>. Thanks to xet7.</summary>

Specs and the server share files by path. With the repository mounted at
`/repo`, the continuous backup tests gave the server a key file it could not
find and looked for a stream it wrote elsewhere. Both are mounted at their
host paths now, so a path names the same file on both sides.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a6bec88266">The phone invitation tile is measured in one layout with its buttons</a>. Thanks to xet7.</summary>

Measured one at a time, the tile and its buttons were taken from two layouts:
Firefox drew the row above the board list in between and moved the tile down
29 pixels. They are measured together now, and the test still fails when the
tile clips its buttons, the original #6488 bug.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f5eb4ecf61">The Mac smoke test asks libproc, not ps, whether a process group still lives</a>. Thanks to xet7.</summary>

When macOS refuses to signal a group of zombies, the smoke test asked `ps`
whether a member was alive, and a Mac that does not let the build run `ps`
failed a correct app. On macOS it asks the kernel through `proc_listpids` and
`proc_pidinfo` now, starting no process; elsewhere it uses `ps` as before.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/897376ba54">The button theme test checks the Board Settings that still have action buttons</a>. Thanks to xet7.</summary>

Card Settings has had no column actions since card actions moved into each
section's own menu, so the test failed on Card in every theme. Swimlane and
List are checked in all four themes, and the test says why Card is not.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d5e3325e87">Card Settings section order waits for the published board before reading the card</a>. Thanks to xet7.</summary>

The test writes the board straight to the database and reloads. The board
publication's cursor has `limit: 1`, so on the standalone test MongoDB it
polls and a reload could get the old board for up to ten seconds. The test
waits for the published board, up to 15 seconds, before it reads the card.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/89b64966c6">The password minimum specs wait until the server has the policy they wrote</a>. Thanks to xet7.</summary>

The specs write the password policy straight into the settings document, and
on the standalone test MongoDB the server's settings observer polls, so for up
to ten seconds it still enforced the old policy. `untilServerHas()` asks
`getPasswordPolicy` until the server has it, then reloads the sign-up form; 6
of 6 with two workers.

</details>

**Browser tests** - specs that read the page before it had settled, in Firefox.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dbf07aadf9">The activity recovery report is searched again until no worker lease covers it</a>. Thanks to xet7.</summary>

The report is a snapshot, and the live recovery worker's short lease could
make it show a seeded orphan as being delivered. The test searches again
until the snapshot falls between leases.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9188843369">The checklist drag tests drag once the opened card's rows hold still</a>. Thanks to xet7.</summary>

Sections drawn above the checklist moved its rows 50 pixels between measuring
and releasing, so the release opened an item's editor or dropped it in the
wrong place.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0cea141702">The duplicate relation picker is opened once the card has opened</a>. Thanks to xet7.</summary>

A picker opened while the card was still opening was closed again when the
card settled.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0403e27c62">The notification delivery sections are opened until they stay open</a>. Thanks to xet7.</summary>

The language arriving after the click drew the popup again with its sections
closed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2042fd5102">The Blocks drag test grabs the block's body, not its edge</a>. Thanks to xet7.</summary>

A Khmer label overflows its block in Firefox, and the first point found was
the block's outline, where a press drags nothing.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0a1f8584ee">The board view popup is opened until it stays open for the Product Backlog</a>. Thanks to xet7.</summary>

The language arriving after the click drew the header again and closed the
popup.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/efe0e9287c">A language switch is waited for, and WebKit does not freeze on asking for a push subscription</a>. Thanks to xet7.</summary>

A spec that switched language and clicked at once clicked into the redraw
that followed, which closed its popup; every page of the test context now
waits until it shows the new language. Playwright's WebKit froze the page on
asking for a push subscription, which Member Notification Settings does on
opening; there the page answers that it has none.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c8c254dc5">The viewport matrix cleans up only what it seeded</a>. Thanks to xet7.</summary>

The matrix is Chromium-only. In Firefox and WebKit its setup never ran, but
its cleanup did, and failed every viewport.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f241681e80">Background notification recovery checks its own mail</a>. Thanks to xet7.</summary>

The shared SMTP sink had caught another worker's mail first.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c71c875649">The custom field settings popup is opened until its Create button shows</a>. Thanks to xet7.</summary>

The opened card was still drawing and closed the popup again.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4a9c3f21d2">The drawing surface's width is waited for</a>. Thanks to xet7.</summary>

The element's layout follows its viewBox a frame later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c8ed3e0fd0">The bulk export popup is opened until it stays</a>. Thanks to xet7.</summary>

All Boards was still drawing after the route changed, in all five Haitian
Creole tests.

</details>

**Test coverage** - October changes that had no test of their own.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/148d18d456">Server changes are tested: OpenSSL 4 decrypt refusal, the Scrum rollover lease, the backup catch-up scan</a>. Thanks to xet7.</summary>

Each with a negative test, and the lease with a tree-wide one: every lease
field is written only by its claim.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/79c40407d1">Admin Panel pane titles, audit log alignment, storage help, Data health and card reports are tested</a>. Thanks to xet7.</summary>

Unit and negative tests, and a Chromium browser test of the titles, the
right-to-left audit log, the storage help shown once and Data health's own
"Never".

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/121f37be91">The drawing refit, Due Cards scope, dependency import counts and SAML's one Issuer are tested</a>. Thanks to xet7.</summary>

A signed SAML Response with two Issuers is refused in the browser, which
node-saml 5.1.0 accepted; an assigned-only member's Due Cards show only their
own cards.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3ccb465c3f">The keyboard shortcut browser test focuses the minicard link itself</a>. Thanks to mimZD and xet7.</summary>

Chromium does not leave the focus on the minicard after its menu is closed,
so the test makes the reported state directly; it passes in Chromium and
WebKit.

</details>

**The source-loaded server** - starting WeKan from source for development.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/15877dd1bc">A local package fork that a prebuilt package implies is loaded first</a>. Thanks to xet7.</summary>

The source server stopped at "isopack dynamic-import not yet loaded". It now
gets past that, and still stops later on "Cannot find module
'meteor/accounts-base'"; the browser tests ran against the bundle server.

</details>

**The changelog** - its guards between releases.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/05cc2460ea">The short changelog guard holds between releases too, when there is no Upcoming section yet</a>. Thanks to xet7.</summary>

`changelogShort.test.cjs` assumed an Upcoming section was always there, so it
failed right after every release, before anything new was written. With none
it checks that the newest release comes first and that nothing links an
Upcoming that does not exist.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.77 2026-10-31 WeKan ® release

**In short:** Two **node test guards** follow the movable popups and the date
picker of v12.76.

This release has the following developer-tooling fix:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ff2c0ed7f6">The date-popup guards follow movable popups and the date picker's empty cells</a>. Thanks to xet7.</summary>

`calendarPopupResize.test.cjs` asserted that a popup without a date editor does
not drag, and `calendarTodayMarker.test.cjs` picked a month's days with
`filter(Boolean)`. Both described v12.76 before it changed on purpose: every
popup drags by its title bar, or by its handle alone with drag handles on, and
an empty picker cell is an object with its own `_id`. Both are pinned instead.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.76 2026-10-31 WeKan ® release

**In short:** Security features: a **password policy** with an optional
breached-password check, **Admin Panel / Problems / Password length**,
**compulsory two-factor authentication**, sign-out of **idle sessions** and of
every session after a password change, an **audit log** of what administrators
did, **HSTS**, a cross-site request guard, and **S3 encryption at rest**.
**Sign-up** works again; the date picker has **Today**, the whole card title
edits and **every popup can be moved**; and an old **Sandstorm** grain migrated
from MongoDB 3 shows its boards again.

This release adds the following security features:

**Signing in** - which passwords are accepted and which are reported, who must
have a second factor, and when sessions end.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d7abe9910a">New passwords have a minimum length, and a breached one can be refused</a>. Thanks to xet7.</summary>

`PASSWORD_MIN_LENGTH` (default 8) and `PASSWORD_CHECK_PWNED` (off by default),
in Admin Panel / People / Login and on every platform. The browser sends a
password to Meteor hashed, so the server checks every password that reaches it
as text - Admin Panel Set password and Add user, `POST /users/register` - and
the sign-up, Change Password, reset and enrolment forms check in the browser.
Signing in is never checked, so an existing shorter password keeps working
until it is changed. A breached password is found with Have I Been Pwned's
k-anonymity range API: only 5 hex digits of the SHA-1 leave WeKan, and an
unreachable service never refuses a password. A refused password is ordinary
use, not an attack, so it is not recorded in Admin Panel / Problems.
`tests/passwordPolicy.test.cjs` checks every place a password reaches the
server as text, and that nothing else sets one without the check.

</details>

- [The breached-password check computes its lookup digest once, with Web Crypto, in browser and server; it is never stored (CodeQL \#599)](https://github.com/wekan/wekan/commit/f406d46fe7).
  Thanks to GitHub CodeQL and xet7.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c99aa7f845">Admin Panel / Problems / Password length lists who signs in with a too short password</a>. Thanks to xet7.</summary>

The minimum above was enforced as soon as it existed. Now `PASSWORD_MIN_LENGTH`
(default 8) is the length below which a sign-in is REPORTED, and the new
`PASSWORD_MIN_LENGTH_ENFORCE` (off by default) makes it a rule: a shorter new
password is refused, and an account that signs in with an older shorter one
sees only "Change your password" until it has a long enough one. Signing in is
never refused, so nobody is locked out by a minimum set after their password.
LDAP, OAuth2, OIDC, SAML, CAS and Sandstorm passwords are their provider's, and
are neither reported nor asked. Meteor sends a password hashed, so the browser
that typed it says "it was short" after signing in - never the password or its
length. The page has both settings and one row per account: username, first and
last such login, the latest IPv4 and IPv6 address with flag and city when a CDN
says where it is, the count and when it was fixed, filtered Too short (default),
Fixed or All. Node suites `passwordPolicy`, `passwordChangeRequired` and
`shortPasswordLogins`; Playwright `password-length-report` changes each setting
on the page and checks what it does, in Chromium and WebKit.
[Password length](docs/Features/Admin-Panel/Problems/Password-length.md).

</details>

- [The Password length pane names itself in the title bar, like every other Admin Panel pane](https://github.com/wekan/wekan/commit/85af731c1b).
  Thanks to xet7.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c99aa7f845">Changing one's own password signs every session of the account out, this one too</a>. Thanks to xet7.</summary>

Meteor's Change Password kept the session that changed it, and a reset link
signed the reset in. Now Member Settings, the forced change and a reset link
all end every session of the account, and only the new password signs in
again; the browser goes to the sign-in page as soon as it is signed out, since
the server closes the connection before the answer can arrive. An
administrator's Set password already signed everything out.
`password-change-other-sessions.e2e.js` changes it in one of two browsers:
both are signed out, the old password is refused and the new one signs in.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d7abe9910a">Two-factor authentication can be made compulsory, for administrators or for everybody</a>. Thanks to xet7.</summary>

`REQUIRE_2FA`: `off` (default), `admins` or `all`. It covers the accounts that
sign in with a WeKan password; LDAP, OAuth2, SAML, CAS and Sandstorm accounts
sign in through an identity provider and are never asked. Such an account can
still sign in - it has to, to enrol - and sees only the set-up until it has
2FA. Until then the server refuses every method and publication but signing in
and enrolling, HTTP routes do not accept its login and the REST API gives it no
token; once required, 2FA cannot be switched off. An account between signing
in and enrolling is ordinary use, so nothing is recorded in Problems.
`tests/requireTwoFactor.test.cjs` runs the real wrappers.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/41173f0f6b">A browser session is signed out after LOGOUT_IDLE_MINUTES without activity</a>. Thanks to xet7.</summary>

`LOGOUT_WITH_TIMER` ends a login at a deadline however busy its user is; nothing
ended a session somebody walked away from. The browser now reports a key press,
click, touch or scroll at most once a minute, the server keeps the time per
login token in `idleSessions`, and once a minute every token idle past the
limit is removed, which signs its connections out. A tab that reconnects by
itself - a laptop waking up - is not activity, and REST API tokens are never
removed. The time is kept beside the user rather than on the token, because
updating one element of the token array needs the positional `$` operator,
which not every database WeKan runs on supports. `tests/idleLogout.test.cjs`.

</details>

**HTTP** - what every response tells the browser, and which requests are
accepted only from WeKan's own pages.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4993242c5f">Strict-Transport-Security on every response of an HTTPS site</a>. Thanks to xet7.</summary>

Without HSTS, a link typed as plain HTTP or a downgrade on a hostile network
could strip TLS from the next visit unless the reverse proxy added the header.
It is now sent whenever `ROOT_URL` is https: 180 days, this host only.
`HSTS_MAX_AGE`, `HSTS_INCLUDE_SUBDOMAINS` and `HSTS_PRELOAD` change it; 0 stops
it, and preload is sent only with includeSubDomains and at least a year. Every
response also carries `X-Content-Type-Options: nosniff` and
`Referrer-Policy: strict-origin-when-cross-origin`. A header has no attempt to
record. `tests/securityHeaders.test.cjs`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/48a2e97ea3">A state-changing request that logs in only with the cookie must come from WeKan itself</a>. Thanks to xet7.</summary>

`POST /import-trello` and other routes accept the login cookie as the login.
The cookie is SameSite=Strict, which keeps it off a cross-site request in
today's browsers; this is the second line, for older browsers, same-site
sibling hosts and routes added later. A POST, PUT, PATCH or DELETE whose only
login is the cookie must carry an Origin, or Referer, naming `ROOT_URL`'s host
or the Host / X-Forwarded-Host it was sent to - on Sandstorm, the grain's own
host. A refusal is recorded in Admin Panel / Problems as
`csrf.cross-site-cookie` and never blocks the account whose cookie it was.
`tests/crossSiteRequest.test.cjs` also fails when a route registers a handler
that runs before the guard.

</details>

**The Admin Panel** - a record of what administrators changed.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4d5b832499">People / Audit log shows what site administrators did</a>. Thanks to xet7.</summary>

Nothing recorded who set somebody's password, made somebody an admin, changed
a login setting or restored a backup. Every call of those administrative
methods by a site administrator is now kept for a year, one document each:
when, who, the action, its outcome - a refused call too - its arguments and
the address. A password or a secret never reaches the trail: credential-named
keys, password arguments by position and passwords inside URLs are replaced by
`[redacted]`. An administrator editing cards is not in it, and a trail that
cannot be written never changes what the method did.
`tests/adminAudit.test.cjs`.

</details>

- [The audit log has its own URL, /admin/people/audit-log, a title, and right-to-left alignment](https://github.com/wekan/wekan/commit/2017f2871f).
  Thanks to xet7.

**Attachments** - where the files are kept, and how.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/482c2c29f4">Files and backups in S3 can be encrypted at rest</a>. Thanks to xet7.</summary>

Admin Panel / Attachments / S3 / Server-side encryption: SSE-S3 (AES256) or
SSE-KMS, with a KMS key or the account's default. S3 encrypts each object as it
is written and decrypts it for WeKan on read, so reads, range requests and
moves are unchanged; every upload, renamed object and backup written to S3
carries it. On the filesystem, encryption at rest stays with the disk or volume
(LUKS, an encrypted cloud volume): exports, PDF, thumbnails, virus scans,
backups and WebDAV all read the stored files directly.
`tests/s3Encryption.test.cjs`.

</details>

and adds the following new features:

**Dates** - choosing a date in a date popup.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc21c901f4">The date picker has a Today button, back to today's month from wherever the arrows went</a>. Thanks to mimZD and xet7.</summary>

The board Calendar view and Calendar mode already had Today; the date picker
of every date popup had only « ‹ › ». Today shows today's month and focuses
today, and changes nothing until a day is clicked and saved. Testing it found a
picker bug that was already there: a month navigated back to was drawn wrong -
October as "29, empty, 30, empty", without its 31st - because Blaze matched the
weeks and days, which had no `_id`, by position. Every week and cell has one
now. `calendarPickerControls.test.cjs` and `calendar-today-marker.e2e.js`,
which checks every day of the month in order after Today.

</details>

**The opened card and popups** - editing a card's title, and moving windows.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/22a12dc7f8">The whole card title edits; the window and every popup move by their bar or drag handle</a>. Thanks to mimZD and xet7.</summary>

The title was split like a minicard's: the leading half edited and the
trailing half dragged the window, so a click on the right of the title did not
edit. All of it edits now. With drag handles off the window is moved from the
empty space of its header row above the title, between the collapse caret and
the menu; with them on, by the drag handle alone. Every popup moves the same
way - by its title bar, or its handle alone - where only four kinds moved
before, and a drag no longer makes a popup placed from the right edge, or one
with a margin, jump as it begins. `card-title-edit-and-move-6839.e2e.js` in
Chromium and WebKit.

</details>

**Member Settings** - Change Settings.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ffd5cbd2ad">Change Settings: icons in a column on the first line, compact wrapped lines, rows divided</a>. Thanks to mimZD and xet7.</summary>

Its settings are sentences, and most wrap; on the shared popup list each line
was 33px high with the icon centred between them and nothing between one
setting and the next. Each row is an icon column, the words and the check mark
now, the icon on the first line, a wrapped line an ordinary line high, and a
rule between rows. `change-settings-popup-6835.e2e.js` in Persian and English.

</details>

and fixes the following bugs:

**The d shortcut** - opening the Due date editor from the keyboard.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b1403ca7af">d opens the Due date editor of a card that is still being opened, and it stays open</a>. Thanks to mimZD and xet7.</summary>

On a slower server a card's details render a few hundred milliseconds after
the click that opens it, and `d` pressed in that moment found no Due date
control and did nothing; only the hovered-minicard path waited. Both wait now
for that card's control. The card details also closed their card's popup when
merely rendered again, so a popup could open and shut at once; they close it
now only when the card is closed or another card opened. The Playwright test
emulates a 300 ms connection, and fails on the code before this change.

</details>

- [Typing d in the card title types at the end of the title in WebKit too](https://github.com/wekan/wekan/commit/73c21dfe3e).
  Thanks to xet7.

**Minicards** - what a minicard shows, and where.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cf4b48df09">A due date uses the minicard's width instead of three lines beside an empty strip</a>. Thanks to mimZD and xet7.</summary>

The dates row reserved 84px at its trailing edge - a third of a narrow card -
for nothing, and a due date with its "1 day left" was broken over three lines.
It reserves the drag handle's 24px now. The rest of
[#6834](https://github.com/wekan/wekan/issues/6834) is in TODO Later.
`minicard-dates-width-6834.e2e.js` in English and Persian.

</details>

- [A card-button rule is a button on the minicard: Board Settings / Card, Card buttons, Show on Minicard, since v12.16, now with a test](https://github.com/wekan/wekan/commit/429fdc5319).
  Thanks to mimZD and xet7.

**Signing up** - registering a new account with the sign-up form.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/508484ef1e">Registering no longer answers Internal server error, and signs the new user in</a>. Thanks to xet7.</summary>

The REQUIRE_2FA wrapper of every method and publication, and the Audit log's
wrapper of the administrators' methods, awaited before calling the handler -
even with REQUIRE_2FA off. audit-argument-checks asks synchronously, the moment
a handler returns, whether check() saw every argument, so the handler's own
check() came too late: sign-up answered "Internal server error" while the
account was created anyway (the next try said it already existed), and the
starredPublicBoards and translation publications failed for everybody. A
wrapper now calls the handler at once when it needs no lookup, and hands the
audit over when it must await (`server/lib/argumentChecks.js`).
`tests/wrappedHandlerArgumentChecks.test.cjs` runs both wrappers under a model
of the audit, and the sign-up Playwright test registers - with no mail server
configured - and checks that the new user is signed in.

</details>

**Upgrading old data** - documents from old WeKan versions are brought to the
current structure at startup, so nothing that is in the database stays hidden.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2ab0afdc93">Boards from before the templates feature are shown on All Boards again</a>. Thanks to xet7.</summary>

A Sandstorm grain migrated from MongoDB 3 to FerretDB copied every document -
1 board, 31 cards, 8 lists - and then showed an empty All Boards page. Boards,
swimlanes, lists and cards made before the templates feature have no `type`:
the schemas fill it on insert only. All Boards publishes `type: 'board'` and
the card queries ask for `cardType-card`, and a missing field matches neither.
The new `type-defaults-backfill` startup step sets the schema default where
`type` is missing, null or empty, and never changes an explicit type such as
a template or a linked card. `tests/schemaUpgradeSteps.test.cjs` upgrades the
grain's shape and checks that typed documents are left alone.

The same log showed `merge-per-swimlane-lists FAILED ... missing schema for key
"swimlaneId"`: FerretDB's SQLite `distinct` could not read documents without
the fields it asked for. That is fixed in the FerretDB fork (Upcoming FerretDB
release), which the next bundle includes.

</details>

**Snap** - backing up, restoring and repairing a snap from the host's shell.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0b5c855820">Backup and restore instructions find mongodump and mongorestore on AlmaLinux, Rocky Linux and Fedora</a>. Thanks to Group-Deed and xet7.</summary>

snapd keeps the snaps in `/var/lib/snapd/snap` on Fedora, RHEL, AlmaLinux,
Rocky Linux, CentOS Stream and Arch Linux, which have no `/snap`. The
instructions exported `/snap/wekan/current/bin` and its `lib/x86_64-linux-gnu`,
so restoring a backup on Rocky Linux failed until both were found by hand, and
only Arch had a note - for the library path alone. Every instruction now picks
the directory with one `S=` line and the CPU's library directory with
`$(uname -m)`, so arm64 works too. `database-role`, `database-compare` and
`database-merge`, which can be run from a host shell, find the snap in either
place. `tests/snapPathElLinux.test.cjs` fails on an export of a `/snap`-only
path in any document and on a script that falls back to `/snap` alone.

</details>

and has the following developer-tooling fixes:

**The build log** - what a build from build.sh and build.bat writes while it
runs, and how much of it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6551062492">EVERYTHING builds without the per-require module trace, so it no longer fills the disk</a>. Thanks to xet7.</summary>

The build's `NODE_DEBUG=module` trace wrote over 12 GB in the first half hour
of an EVERYTHING run on macOS - twice, through tee - and slowed the build it
traced, so the run would fill the disk before it reached the tests. A build
from the `build.sh` menu still traces by default; `WEKAN_BUILD_TRACE_MODULES=0`
turns it off, and EVERYTHING sets that unless the caller asked for `1`. The
other build diagnostics (resolver commands, npm verbose, `METEOR_PROFILE`) are
unchanged. `tests/buildCommandOutput.test.cjs` checks that a menu build still
traces and that nothing exports the module trace unconditionally.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5a13e927bc">Every build traces module resolution only when WEKAN_BUILD_TRACE_MODULES=1 asks for it</a>. Thanks to xet7.</summary>

Turning the trace off for EVERYTHING alone was not enough: a dev build from the
menu wrote 1.1 GB, three million lines, in its first three minutes. So the
trace is now opt-in in `build.sh` and `build.bat` alike, and the diagnostics
line says whether it is on and how to turn it on. The entry above describes
the menu default as it was then. `tests/buildCommandOutput.test.cjs` pins the
opt-in in both scripts, and fails on a trace turned on by default or
unconditionally.

</details>

**Meteor in .tools** - starting the Meteor that build.sh and build.bat keep in
the repository's own tools directory.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9a118c83b2">Meteor starts with one springboard instead of springboarding forever</a>. Thanks to xet7.</summary>

A build from the menu printed `uname -p` and `sysctl hw.cpu64bit_capable` over
and over and never reached its first package. With `METEOR_WAREHOUSE_DIR` set
and no `SANDBOX`, Meteor takes the running tool to be wherever the warehouse's
`meteor` link points - 3.5.4, the release it was installed with - so with
`.meteor/release` at 3.6-rc.1 every start springboarded to 3.6.0-rc.1, found
itself the wrong tool again and springboarded again: 28 times in 20 seconds of
`meteor --version`. The 1.1 GB build log above was the same loop, its module
trace printed again on every exec. `releases/tools-env.sh` and `tools-env.bat`
now set `SANDBOX=true` beside the warehouse, as Meteor's own self-test does,
and so do the Nextcloud test scripts and the dev-source runner.
`tests/meteorSpringboardLoop.test.cjs` checks both scripts, fails on any file
that sets the warehouse without `SANDBOX`, and runs the installed Meteor to
count its springboards.

</details>

and updates the following documentation:

- [Security settings: every hardening option of a WeKan site on one page](https://github.com/wekan/wekan/commit/302b47db6f).
  Thanks to xet7.
- [Admin Panel / People / Audit log: what it records and what it never does](https://github.com/wekan/wekan/commit/f165a24192).
  Thanks to xet7.

and updates the following translations:

**Languages updated:** 234 languages.

**Password length** - the strings of Admin Panel / Problems / Password length
and of the Change your password dialog.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3f9379ac86">The 18 new password-length strings in every language</a>. Thanks to xet7.</summary>

Each string is in the language and script its locale tag names, with the terms
the file already uses for password, account, save and sign in, and `__min__`
kept exactly; only those 18 keys changed in each file. The commit lists the
languages written with low confidence, for a speaker to correct on Transifex.

</details>

**Security features** - the strings of the password policy, two-factor, the
audit log and S3 encryption.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/de23dece66">The 16 new security strings in every language, and Frisian two-factor text that was Dutch</a>. Thanks to xet7.</summary>

Each string is in the language and script its locale tag names, with the terms
the file already uses for password, account, attachment, backup and two-factor
authentication, and `__min__` kept exactly. fy and fy-NL had Dutch two-factor
strings, now Frisian (`tests/frisianTwoFactorLanguage.test.cjs`); Tigre spells
storage መክዘን, not Tigrinya's መኽዘን. The commit lists the languages written
with low confidence, for a speaker to correct on Transifex.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.75 2026-10-30 WeKan ® release

**In short:** Changing a password signs the account out in every other browser,
and now a test proves it in two real browsers.

This release adds the following security regression test:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dc9a7bb1ac">A changed password signs the account out in every other browser</a>. Thanks to xet7.</summary>

A report described a session that stayed signed in on a second browser after
the password was changed on the first. WeKan does not do that: Member Settings
/ Change Password is Meteor's changePassword, which removes every login token
but the changing session's, the admin's Set password and a password reset
remove them all, and a session whose token is gone is closed.
`password-change-other-sessions.e2e.js` runs the report in two browsers - the
other one is signed out within seconds, stays signed out after a reload, and
only the new password works - three times in Chromium and in WebKit.
`tests/passwordChangeSessions.test.cjs` pins those paths and fails on a password
change that keeps the other sessions.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.74 2026-10-30 WeKan ® release

**In short:** **Caddy** and **FerretDB**, the Go servers WeKan ships, no longer
open MPTCP listeners, which Linux kernel bug **CVE-2026-98432** is reachable
through. The real fix is a patched host kernel.

This release has the following security hardening:

**Go servers** - Caddy and FerretDB, and the kernel bug behind their listeners.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e9751b65d4">Caddy and FerretDB run with no MPTCP listener (CVE-2026-98432)</a>. Thanks to xet7.</summary>

CVE-2026-98432 is a Linux kernel use-after-free in IPv4 TCP connection
handling, shown to give remote code execution through an MPTCP listener, and
since Go 1.24 every Linux listen socket of a Go program is MPTCP by default.
Every place WeKan starts Caddy or FerretDB sets `GODEBUG=multipathtcp=0`: the
snap, the Docker entrypoint, the bundle launcher, every docker-compose FerretDB
and the Sandstorm grain. Caddy needs no rebuild, because Go reads `GODEBUG` at
start, and wekan/FerretDB now builds with `godebug multipathtcp=0` too. An
operator's own `multipathtcp` setting is kept. Checked on Linux: a Go server's
default listener uses MPTCP, and with the setting it does not.
`tests/goMptcpOff.test.cjs` pins every launcher. This is a kernel bug, not
WeKan's, so there is no attempt to show in Admin Panel → Problems; upgrade the
host kernel.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.73 2026-10-30 WeKan ® release

**In short:** **CHANGELOG.md** is now short: the In short of the upcoming
release and of the five newest releases, in plain Markdown. The status and every
change of each release are in **CHANGELOG-big.md**, which is the one that is
written. **CodeQL** alert #598 in the Sandstorm host test is fixed, and the
release script pulls before releasing, so a moved main no longer stops it.

This release fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fcd995095d">Alert #598: the Sandstorm host test names no host but sandstorm.org</a>. Thanks to GitHub CodeQL and xet7.</summary>

CodeQL flagged incomplete URL substring sanitization (CWE-20) in
`tests/sandstormOrgHosts.test.cjs`, which picked the files to check by whether
they contained the old Sandstorm host name as a substring. The test no longer
names that host at all: it finds every Sandstorm host on a top-level domain
other than `org` by its shape, written as a URL, so property paths, file names
and the domains reserved for tests are not taken for hosts. Run against the
files from before the switch to sandstorm.org, it finds the 13 old hosts. The
finding was in a test, not in WeKan, so there is no attempt to show in Admin
Panel → Problems.

</details>

and has the following developer-tooling changes:

**Publishing a release** - how the release script reaches GitHub.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e372016826">Release All pulls before releasing, and pulls and retries when its push is refused</a>. Thanks to xet7.</summary>

v12.73 was prepared on a main that origin had moved past: the release bot's
v12.72 version bump had landed meanwhile. The push of "Prepare v12.73 release"
was refused and the script stopped before dispatching the workflow, so no
release ran and no tag was made. `release-all.sh` now runs build.sh's git pull
before it chooses the version or renames anything, and pushes with build.sh's
git push, which pulls and pushes once more when origin moved meanwhile. If the
push still does not finish, it says the workflow was not dispatched and how to
dispatch it. `tests/releaseUpcomingPreflight.test.cjs` pins the order.

</details>

**Release history** - which file is written, and which is read.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f1c0db247a">CHANGELOG.md is the In short of the five newest releases, written from CHANGELOG-big.md</a>. Thanks to xet7.</summary>

The changelog is `CHANGELOG-big.md` now, renamed in a commit of its own
(`61e838df46`) so its history follows it: `# Status`, `# Upcoming` and every
release in full. The release tooling, the release workflow and its notes'
link, the commit-link repair, the archive and the tests use it.
`CHANGELOG.md` is generated from it by `releases/changelog-short.mjs`: no
Status or Upcoming, only each of the five newest releases' In short and a link
to its full section, with no `<details>` or `<summary>` and only Markdown
links. `release-all.sh` regenerates it in the release commit, the Sandstorm App
Market shows it, and `tests/changelogShort.test.cjs` fails when it is not what
the generator writes. CLAUDE.md and AGENTS.md describe both files.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1af642069c">The short CHANGELOG.md starts with the upcoming release's In short</a>. Thanks to xet7.</summary>

What was about to be released was only in `CHANGELOG-big.md`. The short file
now starts with the unreleased `# Upcoming WeKan ® release` - its In short and
a link to its full section - with the five newest releases below it; right
after a release, when there is no Upcoming yet, none is invented. CLAUDE.md and
AGENTS.md say what "update wekan changelog" does to both files.
`tests/changelogShort.test.cjs` pins it.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.72 2026-10-30 WeKan ® release

**In short:** A card link can no longer launch an operating-system handler with
a code-execution history, such as **ms-msdt** (Follina) or **telnet**, even if
an administrator lists it, and an attempt to write one shows in **Admin Panel →
Problems**. The **Apache** guide follows the 2024 Confusion Attacks, and the
Sandstorm store build publishes to **both app markets**.

This release has the following security hardening:

**Card links** - which custom URL schemes may become clickable.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b4e5f90afb">A card link never launches an OS handler with a code-execution history, even when listed</a>. Thanks to xet7.</summary>

Custom URL schemes link only when Admin Panel → Features → URL lists them, and
never `javascript:` or another scheme that runs code in the page. A listed
operating-system handler was linked, though, and some have a public
code-execution history: `ms-msdt` (Follina, CVE-2022-30190), `search-ms`,
`search`, `ms-officecmd`, `ms-appinstaller`, `ms-cxh`, `ms-cxh-full` and
`telnet`, the last step of a 2026 browser full chain. They are never linked now,
by the app and by the markdown package, and a click on one does nothing. A card,
comment or checklist that adds a link to one shows in Admin Panel → Problems as
HandlerLink, with who wrote it. The Visibility docs say what a listed `file:`
does on Windows. `tests/urlSchemeAllowlist.test.cjs` and
`custom-url-schemes.e2e.js` (Chromium and WebKit) pin it.

</details>

**Apache** - the reverse proxy guide.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1a97c8bd86">The Apache guide asks for httpd 2.4.60 and builds no proxy target from the request</a>. Thanks to xet7.</summary>

Checked against the 2024 Confusion Attacks on Apache httpd (CVE-2024-38472 to
CVE-2024-38477 and CVE-2024-39573, fixed in 2.4.60). The examples passed the
WebSocket with `ProxyPassMatch` and `$1`, a request capture in a proxy target,
and the sub-URL one never matched its WebSocket at all. Both use
`ProxyPass ... upgrade=websocket` now, and a new section lists what not to add.
Verified with Apache 2.4.67 in front of a WebSocket server, at `/` and at
`/wekan`; `tests/apacheReverseProxy.test.cjs` pins it.

</details>

and has the following developer-tooling fixes:

**Sandstorm** - publishing the Sandstorm package, and how its app market listing
looks.

- [The store build publishes WeKan to both Sandstorm app markets](https://github.com/wekan/wekan/commit/10851cd3f4),
  apps.sandstorm.org and apps.sandstorm.io. Thanks to ocdtrekkie.
- [Fix the publish command's argument order](https://github.com/wekan/wekan/commit/2c1fc39f61).
  Thanks to ocdtrekkie and xet7.
- [The sandstorm.org host test allows that publish step](https://github.com/wekan/wekan/commit/55b71ce19e),
  and checks both markets are published to. Thanks to xet7.
- [New board view screenshots for the Sandstorm app market listing](https://github.com/wekan/wekan/commit/a086323a1f).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.71 2026-10-30 WeKan ® release

**In short:** The **Sandstorm** build installs Sandstorm from
**install.sandstorm.org**, as the Sandstorm workflows already did, and the
docs link sandstorm.org. The Hall of Fame guards read every vulnerability name
now that each one links to its own page.

This release has the following developer-tooling fixes:

**Releases** - where the Sandstorm build gets Sandstorm.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ca2dc5fae5">The Sandstorm build installs Sandstorm from install.sandstorm.org</a>. Thanks to xet7.</summary>

v12.69's Sandstorm build stopped because the certificate of
install.sandstorm.io had expired. The Release All job fetches the installer
from install.sandstorm.org, as the standalone Sandstorm workflows already did,
and so does `releases/install-sandstorm.sh`. That installer downloads Sandstorm
from dl.sandstorm.org and sets up a development server at local.sandstorm.org,
so the docs and code comments link sandstorm.org too, each address checked;
only the demo stays on sandstorm.io, which has no sandstorm.org name.
`tests/sandstormOrgHosts.test.cjs` keeps it that way.

</details>

**Tests** - the guards that compare WeKan's security tests with the Hall of
Fame.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/43c4d41877">The Hall of Fame guards read a linked vulnerability name too</a>. Thanks to xet7.</summary>

The two suites that compare WeKan's security tests with the Hall of Fame read
only names without a link, so the four whose names already linked to their
pages - ImportPlacementBleed, SamlSubjectBleed, StampBleed and UploadBleed -
were never checked. On wekan.fi every name is now a link; the suites read it,
and list those four as guarded by the tests that name them.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.70 2026-10-29 WeKan ® release

**In short:** The **AppImages** and the **Launchpad** snaps build again: their
FerretDB and mongo-tools are readable by every user, and the snap source
carries what its downloads need. **Continuous backup** names a changed
encrypted file as changed with **OpenSSL 4**, and the release and test tooling
runs on macOS and reports a bad certificate as one.

This release fixes the following bugs:

**Continuous backup** - restoring an encrypted backup file.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ffe49dd2fd">A changed encrypted file is reported as changed, also with OpenSSL 4</a>. Thanks to xet7.</summary>

A Node.js linked to OpenSSL 4 reports an AES-GCM tag mismatch as
`ERR_OSSL_BAD_DECRYPT` ("bad decrypt"), where OpenSSL 3 says "Unsupported state
or unable to authenticate data". `decryptFile()` matched only the second, so
with OpenSSL 4 a changed backup file or a wrong key surfaced as a raw OpenSSL
error instead of "An encrypted backup file has changed or the key is wrong".
Both are recognised, and the partial output is still removed.
`tests/continuousBackupEncryption.test.cjs` passes with OpenSSL 4.1.0 and
3.5.9.

</details>

and has the following developer-tooling fixes:

**Releases** - the AppImages, the Launchpad snaps, the Bun assets and what a
failed download says.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dfdadaa8ca">The AppImages are built again: FerretDB and mongo-tools are readable by every user</a>. Thanks to xet7.</summary>

`releases/fetch.sh` downloaded into a `mktemp` file and moved it into place,
so every download kept mktemp's 0600, and the bundled `ferretdb` and
`mongo-tools` were 0711 after `chmod +x`. Since that day's appimagetool
refuses such a file - a user other than the owner gets "Permission denied" -
all six v12.69 AppImages failed. A download gets the mode its umask gives a
new file, and the AppDir is made `a+rX` before it is packed;
`tests/releaseDownloads.test.cjs` fails on the old `fetch.sh` with 711.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a1f2c006b4">The Launchpad snap source carries the tools-env.sh that fetch.sh needs</a>. Thanks to xet7.</summary>

Only the files the snap recipe reads are uploaded to Launchpad, and the list
had `releases/fetch.sh` without the `releases/tools-env.sh` it sources. In the
armhf build the caddy part's `fetch.sh` had no `TMPDIR`, and curl got an empty
`-o` seven times, with pauses of up to 480 s, before it was called an outage.
The file is uploaded, `tools-env.sh` makes `.tools/tmp` in such a tree, and
`fetch.sh` stops at once without a temporary file or when curl cannot start.
`tests/releaseSnapLaunchpadFlatten.test.cjs` requires every `releases/` file a
listed script uses to be listed. s390x had failed on Launchpad itself: even a
new build answered "Could not find repository at path".

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6bbb4d39bc">A download whose TLS certificate cannot be verified is named as that, not as an outage</a>. Thanks to xet7.</summary>

v12.69's Sandstorm build stopped because the certificate of
install.sandstorm.io expired that day, and `fetch.sh` reported "The server is
having an outage" for curl's exit 60. It now says the certificate could not be
verified and that only that server's owner can fix it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2dcccf0d4a">The Bun release assets build with Python 3.9, which macOS ships as python3</a>. Thanks to xet7.</summary>

`hashlib.file_digest` is Python 3.11+ and `Path.write_text(newline=)` is
3.10+, so `releases/bun/assets.py` stopped with AttributeError and TypeError on
macOS's python3 3.9. It hashes in chunks and writes the LF-only `.sha256sum`
through `open(newline='\n')`; `tests/bun-release.py` still pins LF on every
platform and that neither newer call comes back.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/48a8937ff0">A snap attempt finds its own Launchpad build log by name, not only by mtime</a>. Thanks to xet7.</summary>

Whether a build log belonged to the current attempt was decided by `-nt`
against the attempt's marker alone. bash 3.2 compares whole seconds, so a log
written in the marker's second was not "newer": it was neither printed nor
checked for a Launchpad infrastructure failure. `this_attempts_log()` counts a
log whose name did not exist when the attempt started, or one rewritten after
the marker, and an earlier attempt's untouched log still does not count.
`tests/snapLaunchpadInfraRetry.test.cjs` covers all three cases.

</details>

**Tests** - the suites that need process listings and sandbox-exec on macOS,
and three that tested the wrong row, too early or the old layout.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bf266fb4da">DB conformance recognises a live run where ps is not allowed</a>. Thanks to xet7.</summary>

Inside a sandboxed macOS app `ps` fails with "operation not permitted", so
every live conformance run looked dead and a second run would remove its
containers. `command_line_of()` falls back to `pgrep -lf`, which still works
there, and `tests/dbConformanceStaleContainers.test.cjs` pins the fallback.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5534c8830c">The macOS suites run inside the sandboxed editor too</a>. Thanks to xet7.</summary>

`tests/mac-smoke-app.py` checked with `ps` that a killed descendant was gone;
it waits for `os.kill(pid, 0)` to find it gone and uses `ps` only to tell a
zombie from a live process. `tests/macosSandbox.test.cjs` skips its live
`sandbox-exec` check only when even an `(allow default)` profile cannot be
applied, which is the case inside the sandbox it tests.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d06b468629">ReplyBleed's mocha test counts the attempt in every ReplyBleed row</a>. Thanks to xet7.</summary>

ReplyBleed is one Admin Panel → Problems row per source, and the webhook's
source is the client address, so in a test database that persists between
runs the test's `findOne` read the bounce test's row, whose count the spoofed
reply never moves. It sums the count over all ReplyBleed rows, as
`emailBounces.tests.js` already does.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e4b83d2274">The keyboard card move test waits for the reset sorts to reach the client</a>. Thanks to xet7.</summary>

The test reset three cards to sort 0 in the database and waited only for id
order on the page, which the old sorts already gave one time in six, so the
move was sometimes computed from stale values and failed one run in three. It
waits for the client's own copy of the three cards.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/856a32968b">The board drag settings test opens Card's Draggable table in its section hamburger</a>. Thanks to xet7.</summary>

Since Board Settings / Card became the card's Card Settings, its Draggable
table is in the Card section's hamburger, and the test failed in every
language waiting for it in the popup. It opens Card as the cog menu does, as
`board-settings-columns.e2e.js` already does.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.69 2026-10-29 WeKan ® release

**In short:** **ImportPlacementBleed** is fixed: an import is placed only on its
own board. **Invite via Email** adds the invited new user again, instead of
the first user of the database. The **OpenBSD** bundle starts again, and
**History** works on **FerretDB**: date custom field changes are recorded there,
and the database migration says when documents did not arrive.

This release fixes the following CRITICAL SECURITY ISSUE of [ImportPlacementBleed](https://wekan.fi/hall-of-fame/importplacementbleed/):

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0d6d481fcb">An import into a board is placed only beside that board's own list, swimlane or card</a>. Thanks to Zachariah Mithani (AploSec) and xet7.</summary>

The scoped importer, reached by `POST /api/import/zip` and the `importScoped`
method, authorized the import on `boardId` alone. The `listId` and
`swimlaneId` beside it were written onto the new cards as given, and a `cardId`
was looked up with no board, so a writer of board A could create cards on A
whose list and swimlane were board B's, and probe whether a card id existed on
a board they cannot see. Before anything is written, the list, swimlane and
card are now looked up together with the board's id; an id of another board is
refused (400 over REST, `error-import-placement` from the method), with the
same answer for a foreign card and a missing one. A refusal is shown in Admin
Panel → Problems as ImportPlacementBleed, without blocking the account, since
an import menu left open while its list moved can reach it.
`tests/importPlacementBleed.test.cjs` pins the decision, the check before every
write and a negative scan for a target id used without the board;
`security-import-placement.e2e.js` runs the reporter's attack by both routes
and fails on the previous code.

</details>

and fixes the following bugs:

**Board members** - who an invitation adds to a board.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8556459f97">Invite via Email adds the invited new user, not the first user of the database</a>. Thanks to momosari and xet7.</summary>

Meteor 3's server `Accounts.createUser` is `createUserAsync`, and
`inviteUserToBoard` called it without `await`. The new user's id was a Promise,
which `findOneAsync` read as the empty selector `{}`, so it returned the FIRST
user - usually the site administrator - who was added to the board and got the
invitee's language and invited boards
([#6831](https://github.com/wekan/wekan/issues/6831)). It happened on any
database, not only FerretDB. `createUser` and `sendEnrollmentEmail` are awaited,
the user found must be the one just created, and every server `ReactiveCache`
getter now refuses a Promise as its id or selector, so a missing `await` fails
loudly instead of picking the first document.
`tests/inviteNewUserByEmail.test.cjs`
pins the guard, the reporter's case and that no server file calls an async
Accounts API without `await`; `invite-member-email-case.e2e.js` invites a new
address and checks that exactly that account joined - it fails on the previous
code.

</details>

**Bundles** - starting WeKan on the BSDs.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ec6cf66bff">The OpenBSD bundle starts again, start-wekan.sh takes only a number from sysctl</a>. Thanks to xet7.</summary>

OpenBSD's `sysctl` prints nothing and exits 0 for a name it does not have, so
`sysctl -n hw.memsize || sysctl -n hw.physmem` stopped at the empty
`hw.memsize`, and `$(( / 1048576 ))` ended `start-wekan.sh` before WeKan
answered (the v12.68 BSD bundles job). Both `start-wekan.sh` copies now try
`hw.memsize`, `hw.physmem64` (NetBSD, whose `hw.physmem` is 32-bit) and
`hw.physmem` in turn and take the first numeric answer.
`tests/macosShellPortability.test.cjs` runs those lines against fake OpenBSD,
NetBSD and macOS `sysctl`s, and shows the old chain failing on the OpenBSD one.

</details>

**History on FerretDB** - what the History of a card keeps, and what the
database migration copies.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/01968fc637">Date custom field changes are recorded on FerretDB, and the migration reports refused documents</a>. Thanks to vijlautens and xet7.</summary>

A History row of a date-valued custom field held `datePaths` as an array of
path arrays, `[["3","value"]]`. FerretDB v1 does not store an array inside an
array, so on FerretDB the change was not recorded, and the text database
migration to FerretDB dropped those rows while it swallowed the per-document
error and still reported success
([#6832](https://github.com/wekan/wekan/issues/6832)). Each path is now a JSON
string, `'["3","value"]'`; rows already written in the array form on MongoDB
still restore, and the migration to FerretDB rewrites them to strings. The
migration counts every document the target refuses and ends as failed, with the
count per collection and the first error. `tests/changeHistoryGroups.test.cjs`
pins the string form, the legacy restore, the rewrite with no array left inside
an array, and that a refused document is counted before success;
`history-nested-dates.e2e.js` checks the stored row.

</details>

and has the following release-tooling fix:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/99d9958e39">Release all missing builds the missing assets even when the rerun of failed jobs fails again</a>. Thanks to xet7.</summary>

The planner needed `recover`, so one job failing again in the rerun of the full
release skipped the planner and every build after it. For v12.68 the rerun
failed on four Launchpad snaps (503 / timeout) and on the OpenBSD bundle, whose
`start-wekan.sh` fault is in the tagged code and so in every rerun of it. The
planner now runs unless the run is cancelled, each job after it checks the
planner's own result, and `recover` stays red and names the jobs that failed
again. `tests/retryFailedRelease.test.py` pins both.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.68 2026-10-29 WeKan ® release

**In short:** **Card Settings**, in Board Settings / Card, becomes two panes of
checklists - the minicard's and the card's - with a checkbox per section and
the board's custom fields as items, and the opened card and the minicard
follow its sections and order; every opened card shows every field its board
allows, empty or not. WeKan moves to **Meteor 3.6-rc.1**, keeping its own
security additions to Meteor's packages. **Data health** in Admin Panel /
Problems can now clean up custom fields whose boards were all deleted, and
empty fields no longer show **Scrum** sections on boards that have Scrum
turned off.

This release adds the following new features:

**Card Settings** - one set of checklists for what cards and minicards show,
on the opened card and in Board Settings / Card alike.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c0ec28e82f">Card Settings on the opened card, its sections as checklists</a>. Thanks to xet7.</summary>

The opened card's "+ Add" is now **Card Settings**, and it no longer opens the
Board Settings / Card popup: the button and everything below it are replaced
by Card Settings itself until the X beside its title puts the card back. Under
the title, **Show** chooses Show on Minicard or Show on Card, and the sections
(Card, Date, Time, ... Comments) are drawn like checklists - the section is
the checklist's title, its rows the items, each checkbox the board-wide Show
on Card or Show on Minicard of that field. A row's hamburger holds On this
card and Show empty; a section's holds Select all / Select none, its card
actions and, for Card, Show empty fields, Ask for a reason and the Draggable
table. Sections and rows drag like checklists and their items; a section's
order is the board's new `cardSettingsSectionOrder`. Sections collapse, kept
per user. Board Settings / Card is still the popup. Design:
[Card Settings](docs/Features/Cards/Card-Settings.md).
`tests/cardSettingsOnCard.test.cjs` and `card-add-fields.e2e.js` pin it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/52de57c844">Board Settings / Card shows the same checklists as the opened card, by the same templates</a>. Thanks to xet7.</summary>

Board Settings / Card had its own layout - a left menu of sections and a pane
of two lists with column headings. It now draws the opened card's Card
Settings itself, with no card: Show on Minicard / Show on Card, the sections
as checklists and the same hamburgers; only On this card is left out, and the
popup's header is the title and X. It is 600px wide instead of 1200px. With
drag handles on, a row or section is dragged only by its handle and the rest
scrolls the page; with them off, by its icon and name. A row dropped on
another section goes back and nothing is saved. Testing both open at once
found three faults, now fixed: their Show radios were one group, Select all
could act on the other one, and switching Show could put a click on the
neighbouring row. Docs:
[Card Settings](docs/Features/Cards/Card-Settings.md).
`tests/cardSettingsOnCard.test.cjs` compares the templates and
`card-add-fields.e2e.js` the two views, row by row, and the drag rules.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5adfc1b9db">A space between a checkbox and its label, on the rows and in the hamburgers</a>. Thanks to xet7.</summary>

A checkbox touched its label on the rows of Card Settings and in their
hamburgers' popups. Both now have a space's width between them. A tick is
drawn rotated and reached past its box, so left to right it is drawn a little
further left: a ticked box keeps the same space and its label does not move.
`card-add-fields.e2e.js` measures it, ticked and unticked.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e5bc58105">A checkbox per section, every field always shown, Card Settings only in Board Settings</a>. Thanks to xet7.</summary>

The opened card has no Card Settings button any more; Card Settings is Board
Settings / Card. A card shows every field its board shows on cards, empty or
not, so On this card, Show empty and Show empty fields are gone. Each section
has a checkbox before its title that hides the whole section on the chosen
side - the card or the minicard - while its rows keep their ticks. A section
with one row is one line, and a hamburger is drawn only when it holds
something. Custom Fields lists the board's custom fields as items, reordered
by drag and drop, with a + under them that creates one. Card actions stay in
the card's own section hamburgers. See
[Card Settings](docs/Features/Cards/Card-Settings.md).
`tests/cardSettingsSectionShown.test.cjs`,
`tests/cardSettingsCustomFields.test.cjs` and `card-add-fields.e2e.js` pin it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9c9742e09d">Hamburger menus open on top of Card Settings, next to their button</a>. Thanks to xet7.</summary>

A hamburger of Card Settings opened its menu in Card Settings' place, and
Card Settings disappeared until the back arrow. Its menus and forms - a custom
field's edit form, the + under Custom Fields - now open as a layer on top of
Card Settings, next to their button, Card Settings still visible under it.
Their X, their button again, a press elsewhere or Escape closes them. A layer
opens toward the middle of Card Settings, so the + form no longer ran out of
its left side. `tests/popupLayer.test.cjs` and `card-add-fields.e2e.js` pin it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2bd5d1180a">Two panes; the card and the minicard follow Card Settings' order; menus open inline</a>. Thanks to xet7.</summary>

The opened card and the minicard now draw Card Settings' sections in Card
Settings' order, each section's fields in its rows' order, so dragging a
section or a row there moves it on the card or the minicard; the order is per
side, and a default board's card starts with Labels. Every section of the card
has the same heading, Voting and Planning Poker included. Card Settings shows
the minicard's pane and the card's side by side, each folding and scrolling on
its own, with a splitter between them to change their widths, stacked when
narrow; the Show radio is gone and the corner grip resizes the popup. A
hamburger's content opens under its line instead of in a popup, the hamburger
showing it is open, which replaces the layers of the entry above.
`card-settings-sections-order.e2e.js` and the new node tests pin it.

</details>

and updates the following dependencies:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/120f484a30">Meteor 3.6-rc.1, with WeKan's six Meteor package forks rebased onto it</a>. Thanks to xet7.</summary>

[Meteor 3.6-rc.1](https://forums.meteor.com/t/meteor-3-6-rc-1-rspack-2-x-native-typescript-node-js-26-pnpm-monorepos-instrumentation-pwas-and-a-friendlier-cli/64773/18)
carries the security fixes of Meteor 3.5.3 and 3.5.4. `meteor update
--release 3.6-rc.1` first failed with "No version of shell-server satisfies
all constraints": WeKan's forks of allow-deny, ddp-server, dynamic-import,
facebook-oauth, google-oauth and shell-server in `packages/`, made because
3.6-rc.0 lacked the 3.5.3 fixes, were pinned to rc.0's versions. They were not
deleted, because rc.1 still lacks what is WeKan's own in them: the Admin Panel
/ Problems reports of refused attempts, and the crypto-RNG keys of
dynamic-import and meteor shell (rc.1 still uses `Math.random()`). Each fork
is now rc.1's package with WeKan's changes merged onto it three-way, versioned
rc.1's `_1`. The experimental Bun build's Meteor patch applies unchanged to
rc.1 and is renamed for it; the Dockerfile's `METEOR_RELEASE` follows. See
[Meteor 3.5.3 security fixes](docs/Security/Meteor-3.5.3-Security-Fixes-2026-10-22.md).
`tests/meteor353SecurityFixes.test.cjs` and `meteorForkRandomKeys.test.cjs`
pin the forks, and `meteor-353-security.e2e.js` passes on rc.1.

</details>

and fixes the following bugs:

**The opened card** - its sections show only what the board allows.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0a224b3cea">Show empty fields shows no Scrum section the board has turned off</a>. Thanks to jullbo and xet7.</summary>

With Board Settings / Card's "Show empty fields" on (since v12.66), every
opened card showed the "Scrum settings" heading and its sections although
Board Settings / Scrum had none of its fields turned on
([#6830](https://github.com/wekan/wekan/issues/6830)). The Scrum fields are
the card's only sections with no board flag in the template, and the card's
section list asked only whether the card shows the field - which Show empty
fields, Show empty and On this card answer yes. A Scrum section now needs the
board's Scrum visibility first, as Members, Vote and Poker already did; a
turned-on Scrum field is still shown empty.
`tests/scrumSectionsShowEmpty6830.test.cjs` pins the rule and that no other
client code decides a Scrum section by the card alone, and
`card-add-fields.e2e.js` checks the card.

</details>

**Data health** - Admin Panel / Problems' checks of custom fields.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9dc3fc3f31">Custom fields whose boards were all deleted get their own check</a>. Thanks to Raymond-Voogt and xet7.</summary>

"Custom fields listing a board that does not exist" also counted fields whose
boards were ALL deleted, which its Repair skips on purpose, since removing the
dead boards would leave the field on no board. The count could therefore never
go down: one instance showed 510 fields and "Repaired: 0" after every click
([#6829](https://github.com/wekan/wekan/issues/6829)). Those fields now have a
check of their own, "Custom fields whose boards were all deleted", whose
Repair deletes the definitions after the confirming second click. No existing
board shows them; a value a card on a live board still holds is left alone and
stays listed under "Cards with values for a custom field that is not on their
board". The old check counts only fields with a live board left, so its Repair
brings it to zero. `tests/dataHealth6818.test.cjs` pins both checks, the
confirmation, and that live fields and card values are not touched.

</details>

and fixes the following translation:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/81e6988491">Southern Sotho: dikarolo, not masimo, for data fields</a>. Thanks to xet7.</summary>

**Languages updated:** Southern Sotho.

Three Southern Sotho strings called a data field "masimo", which means farm
fields: Show empty fields, the fields of a cron schedule, and the webhook's
optional fields. They now use "dikarolo", the word the file already uses for
card and custom fields. `sesotho-popup-titles.e2e.js` caught the first; the
other two are low confidence.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.67 2026-10-28 WeKan ® release

**In short:** a list's **Add card** form closes once the card is added, unless
**Member Settings** keeps it open for the next one. And the v12.66 release build
is whole again: the **emulated-CPU Linux bundles** and **win32**, **FreeBSD**,
**OpenBSD**, the **Mac app**, the **Sandstorm** .spk, the **Ondra** and **Gantt
GPL** snaps and the **Bun** bundles had failed to build or to start - most
because build scripts had moved their files into `.tools/` and some callers had
not.

This release adds the following new features:

**Add card** - a list's form for new cards.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/70de255333">The form closes after the card is added, unless Member Settings keeps it open</a>. Thanks to brlin-tw and xet7.</summary>

The form stayed open after every card for the next one, which
[#6827](https://github.com/wekan/wekan/issues/6827) found unexpected. It now
closes once the card - or every card of a multi-line paste - is added. Member
Settings / Change Settings has a new switch, **Keep the Add card form open
after adding a card**, off by default, for typing several cards in a row. The
form is closed after the last title rather than at submit, because the paste
loop still reads the form between titles, and a failed add keeps the form and
its text. The two new strings are translated into every language, many with
low confidence (listed in the commit). `tests/keepAddCardFormOpen6827.test.cjs`
and `keep-add-card-form-open-6827.e2e.js` pin both settings, a paste and a
failure.

</details>

and fixes the following bugs:

**Linux bundles for emulated CPUs** - armhf, armv6, armv7, i386, ppc64le,
riscv64 and s390x, and win32 built from the i386 one.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/427d212627">The container that installs their Node.js gets .tools/tmp as its /tmp again</a>. Thanks to xet7.</summary>

`install-node-for-arch.sh` refuses to run without `TMPDIR`, because a
container's own `/tmp` is a small part of its writable layer.
`releases/repack-bundle-for-arch.sh` mounts this checkout's `.tools/tmp` there
and sets it; the release workflow's own `docker run` did not, so every
emulated arch stopped at "TMPDIR must be the mounted .tools/tmp" in v12.66,
and win32, which builds from the i386 bundle's Node.js, had nothing to build
with. The step now mounts `.tools/tmp/repack-<arch>-tmp` as `/tmp`.

</details>

**FreeBSD, OpenBSD and the Mac app** - bundles started by `start-wekan.sh`
where there is no `/proc`.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/290e525b46">start-wekan.sh starts WeKan again where there is no /proc</a>. Thanks to xet7.</summary>

Since the macOS shell-script work, the memory budget read `/proc/meminfo` with
no fallback. `awk` fails where there is no `/proc`, and under `set -eu` an
assignment from a failed substitution ends the script without a word - so in
v12.66 the FreeBSD and OpenBSD bundles and the Mac app never started WeKan,
with an empty log. The read has its `|| true` again and `sysctl` gives the
memory. `tests/macosShellPortability.test.cjs` runs those lines under `set
-eu` without `/proc` and requires a number, with the unguarded line as the
negative case, and fails on any `set -e` script whose `/proc` read in `$(...)`
has no fallback.

</details>

**Sandstorm** - the .spk and the meteor-spk toolchain it is packed with.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f68b130f15">meteor-spk is assembled where the .spk is packed from, in .tools</a>. Thanks to xet7.</summary>

`sandstorm-src/build-deps.sh` still assembled `meteor-spk.deps` in
`~/projects/meteor-spk`, and the workflows put that on PATH, while
`releases/sandstorm-slim-spk.sh` looked in `.tools/projects/meteor-spk`: "no
meteor-spk.deps", and the v12.66 .spk did not pack. `build-deps.sh` now uses
the same `.tools` directory, as do the Sandstorm, Sandstorm store and
meteor-spk workflows. `tests/toolsDirOnly.test.cjs` scans `sandstorm-src/`
too, and fails on a workflow that names `~/projects`.

</details>

**Snaps** - the Ondra and Gantt GPL variants, built from a copy of the tree.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d24598ce25">A copy of the source tree without .git gets its own .tools/tmp</a>. Thanks to xet7.</summary>

`releases/tools-env.sh` made `.tools/tmp` only in a git checkout, so that
scripts mounted alone into a container do not make a `/.tools` there. The
variant snaps build from a copy without `.git`, so no `TMPDIR` was found and
every `fetch.sh` in `snapcraft.yaml` stopped at "TMPDIR: unbound variable" -
which v12.66 reported as the Caddy download failing. A tree with
`package.json` beside `releases/tools-env.sh` counts as a source tree.
`tests/toolsDirOnly.test.cjs` checks such a copy, and `releases/` alone as the
negative case, where no `.tools/` is made and no `TMPDIR` is invented.

</details>

**Bun bundles** - their Linux smoke tests.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1167cbd3b0">The smoke-test MongoDB starts on a 6.19+ kernel, and Chromium is found</a>. Thanks to xet7.</summary>

linux-x64: `mongo:8` refused to start on the runner's newer kernel ("Linux
kernel versions 6.19 and newer has a known incompatibility"); the smoke test
pins `mongo:9.0.4`, which recognises Ubuntu kernels that have the fix
([Supported databases](docs/Databases/Supported.md)). linux-arm64: Chromium
was installed into `~/.cache/ms-playwright` while the build looked in
`.tools/ms-playwright`; the install step now uses the same path.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bce686ce46">Its guard pins mongo:9.0.4, not the mongo:8 that stopped starting</a>. Thanks to xet7.</summary>

`tests/bunSmokeMongo.test.cjs` required the workflow to run `mongo:8`, the
floating tag that refused to start on the runner's kernel. It now requires
`mongo:9.0.4`, and fails if `mongo:8` comes back.

</details>

and updates the following documentation:

- [WeKan vs Trello vs Jira says when WeKan added each feature it listed as missing](https://github.com/wekan/wekan/commit/cbdff47edb).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.66 2026-10-28 WeKan ® release

**In short:** two CRITICAL security fixes: **UploadBleed** - attachment uploads
were not authorized at all - and **StampBleed**, and a **FrameBleed** follow-up.
**Card Settings** opens on Card, with **Show empty fields**, a **Show empty**
column, **Select all** / **Select none** and **drag and drop** lists. A card
opened from its link no longer vanishes behind a **reverse proxy**; minicards
show only filled custom fields, lost cards reappear, card numbers stay unique, a
[label] title prefix is opt-in, Problems gets a nightly **Data health** scan,
**database load** on many-pod installations drops, and the **API's JSON
uploads** and the site logo are stored again.

This release fixes the following CRITICAL SECURITY ISSUES:

**Attachments, checklists and text notes** - what a client may put on a card,
and into which board.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/51111e1958">An attachment upload is authorized: signed in, and allowed to edit the card or write the board</a>. Thanks to xet7.</summary>

[UploadBleed](https://wekan.fi/hall-of-fame/uploadbleed/): Meteor-Files' upload
pipeline stores an attachment with a server-side insert, past the allow rules,
and its only hook cleaned the file name. Anyone, signed in or not, could put a
file on any card of any board - published to its members with an activity and
notifications - and the admin's switch blocking uploads was skipped too. Every
chunk is authorized on the server now, and a card attachment's board, list and
swimlane are its card's. Attempts are recorded in Admin Panel / Problems;
`tests/uploadBleed.test.cjs` drives the decision and fails on any
FilesCollection whose upload is not checked on the server.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/51111e1958">Nothing inserted on one's own card can carry another board's id or checklist</a>. Thanks to xet7.</summary>

[StampBleed](https://wekan.fi/hall-of-fame/stampbleed/): checklists, checklist
items, text notes and attachments are published by the board id they carry,
which the server kept as the client sent it, while the insert was checked on
the card only - so a document on one's own card could be stamped with a private
board's id, and a checklist item drawn in that board's checklist. The board is
taken from the card on insert
([with the #6813 fix](https://github.com/wekan/wekan/commit/4bd6a7f088)),
and a forged insert is refused and recorded in Admin Panel / Problems. Found
reviewing the contributed patch for
[#6813](https://github.com/wekan/wekan/issues/6813), which would have relied on
the stamp. `tests/stampBleed.test.cjs` fails on any card child without an
insert board check.

</details>

**Earlier fixes, regression audit** - every fixed vulnerability checked again,
and the same mistakes found elsewhere closed.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ebcd02be6f">Siblings of six fixed vulnerabilities closed; every earlier fix is still in place</a>. Thanks to xet7.</summary>

Every Hall of Fame vulnerability without a test naming it was checked against
the current source; none had been reverted. The same mistakes were found again
and closed: [FloppyBleed](https://wekan.fi/hall-of-fame/floppybleed/) - an
upgrade step could copy any server file into an attachment by its stored name;
[FilePathBleed](https://wekan.fi/hall-of-fame/filebleed/) - a top-level
`path` let a client point an attachment at any file to delete or read;
[MoveStorageBleed](https://wekan.fi/hall-of-fame/snowbleed/) - anybody
who could see a board could delete its attachments through validation;
[IntegrationBleed](https://wekan.fi/hall-of-fame/integrationbleed/) - the REST
reads gave webhook URLs to every member;
[AttachmentMigrationBleed](https://wekan.fi/hall-of-fame/snowbleed/) - migration
methods answered about any board;
[LegacyAttachBleed](https://wekan.fi/hall-of-fame/legacyattachbleed/) and
[MimeStorageBleed](https://wekan.fi/hall-of-fame/mimebleed/) - more
script types and handler forms are served safely. Attempts are recorded in
Admin Panel / Problems where they can be attributed. 128 of 137 published
vulnerabilities now have a named regression test
(`tests/securityRegressionCoverage.test.cjs`).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e8a1106782">A 304 Not Modified no longer replaces a stored file's own Content-Security-Policy</a>. Thanks to xet7.</summary>

[FrameBleed](https://wekan.fi/hall-of-fame/framebleed/) follow-up, found by the
browser test of SVG attachments: files are served `private, no-cache`, so every
later view revalidates and gets a 304, and a browser updates the stored
response's headers with the 304's. The app-wide `frame-ancestors 'self'` of the
FrameBleed restore therefore replaced a file's own policy - an SVG's
`default-src 'none'` and `sandbox` - from the second view on. The SVG stayed
sanitized, so a layer of defence was lost rather than script allowed. The
framing headers are left off a 304 now; `tests/frameBleed.test.cjs` pins it and
fails on any other handler that sets a CSP for every response. Not recorded in
Problems: it fires on ordinary revalidation, not on an attempt.

</details>

and adds the following new features:

**Board Settings / Card** - the fields every card of a board shows from the
start.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/80b936223f">Show when empty: the fields every card of the board shows even while they are empty</a>. Thanks to jullbo and xet7.</summary>

[#6806](https://github.com/wekan/wekan/issues/6806): since an opened card shows
only the fields it has data in, a board where nearly every card gets labels, a
due date and a checklist needed + Add, the section and On this card on each new
card before a field could be filled in. A new column of Board Settings / Card -
and of + Add, the same popup - made a ticked field count like data, on every
card. It became Always show in the next entry.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b54525abbe">Always show, for every field: the description, attachments and comments are its default ticks</a>. Thanks to jullbo and xet7.</summary>

The column is **Always show** and covers every per-card field. The description,
attachments and comments were always shown by a fixed list; now they are the
default of the board's `cardFieldsAlwaysShown`, so a board that never set it
shows them as before, and unticked they are shown when the card has a
description, an attachment or a comment, like any other field. On this card
still hides an always-shown field from one card, and Show on Card off still
hides it from all. It is a board admin's setting.
`tests/cardFieldsAlwaysShown6806.test.cjs` pins the default, unticking the
four, the storage and the column, and fails on any caller that does not pass
the board; `card-add-fields.e2e.js` ticks Due date and unticks Comments in the
browser.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1aa9df6075">Card Settings opens on Card, Show empty fields for the board, and the column is Show empty</a>. Thanks to jullbo and xet7.</summary>

Card Settings opens on its topmost entry, Card - also from + Add, which opened
on the first section of fields. Under the Card pane's title, **Show empty
fields** (the board's `showEmptyCardFields`, off by default): ticked, every card
of the board shows all its fields, the empty ones too, and the Show empty
columns are hidden - by CSS only, so their ticks stay saved and come back as
they were. The Always show column is called **Show empty**, stored as before.
`tests/cardFieldsAlwaysShown6806.test.cjs` and `card-add-fields.e2e.js` cover
it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c8a15b514f">Card Settings: Select all and Select none per column, headings aligned with their cells, labels whole</a>. Thanks to xet7.</summary>

Under each column heading of every pane - On this card, Show on Minicard, Show
on Card, Show empty - **Select all** and **Select none** set that column for the
open section's rows at once, for who may change that column; a personal row
(Labels text, List title) is left as it is. The headings drifted left of their
cells and the labels were cut: the heading line had a smaller font, and the
columns are in em. The font is on the headings now, every heading and cell
starts at its column's start, and the popup is up to 1200px wide.
`tests/cardSettingsSelectAllAligned.test.cjs` and `card-add-fields.e2e.js` pin
it, the latter measuring the headings, cells and labels.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/37b3c8f599">Card Settings: Ask for a reason matches Show empty fields, and the select buttons match Draggable's</a>. Thanks to xet7.</summary>

Ask for a reason when moving cards was a Font Awesome square a few pixels off
Show empty fields above it; it is the same animated checkbox now, in the same
place, read reactively from the board. Select all and Select none under the
columns' headings were links; they are the Draggable table's buttons, white
text on the theme's colour. `tests/cardSettingsSelectAllAligned.test.cjs` pins
both, and `card-add-fields.e2e.js` measures the checkboxes and compares the
buttons' colours.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8224852de1">Card Settings: a Show on Card and a Show on Minicard list per section, reordered by drag and drop again</a>. Thanks to xet7.</summary>

The order arrows of 2026-10-25 could follow only one side's order, and their
number was the field's place among all of that side's fields: an arrow often
changed the number while nothing visibly moved. Each section has the two lists
again, each in its own order and reordered by drag and drop, as since
2026-10-02 - Show on Card with On this card and Show empty beside each row, and
Show on Minicard. Up and Down on a focused row move it one row in its list.
`tests/cardSettingsCoverage.test.cjs` runs the drop's placement against the
real layout; `settings-drag-reorder.e2e.js` drags both lists.

</details>

**Add card** - what a typed or pasted title becomes.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f89c8f8030">[Text] at the start of a new card's title becomes a label only when turned on in Member Settings</a>. Thanks to jullbo and xet7.</summary>

[#6810](https://github.com/wekan/wekan/issues/6810): since #3986 a title starting
with [Text] lost the prefix and got the label Text, created when the board had
none - for everybody, without a hint - so titles pasted from ticket systems and
mails ([EXTERNAL] ...) changed and filled boards with labels. It is a Member
Settings switch now, off by default; who wants #3986's behaviour turns it on.
`tests/titleBracketLabel6810.test.cjs` and `title-bracket-label-6810.e2e.js`
cover both states.

</details>

**Admin Panel / Problems** - what in the database points at nothing, and what
it reads far too much of.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d9cf523f9e">Data health: a nightly scan of broken references, with repairs</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6818](https://github.com/wekan/wekan/issues/6818): Problems now lists cards on
a missing or another board's list or swimlane, ghost and duplicate board
members, boards with no active admin, custom field values and boards that no
longer exist, orphan checklist items and dangling subtasks or linked cards. The
scan runs nightly when the CPU is low, claimed so one pod scans at a time. A
repair that moves data runs the same upgrade steps as an upgrade; one that
deletes asks twice and the server refuses it unconfirmed. Repairs use `$pull`
or guarded updates, so a concurrent edit is not lost, and a member dedupe keeps
the admin entry. `tests/dataHealth6818.test.cjs` pins it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b87858baaf">Database: queries without an index and a high read rate are reported</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6826](https://github.com/wekan/wekan/issues/6826): a 10 GB collection scanned
three times per search and an hourly job reading every card were visible only
in MongoDB's own log. The 5-minute database probe now adds
`db.collection-scan`, the "Slow query" lines where a query read a whole
collection of at least 10,000 documents, grouped by collection and the field
names filtered on, never values; and `db.scan-rate`, over 50,000 documents
read per second between two probes. Without the `getLog` privilege, and on
FerretDB, the log check is skipped. Both rows are in
[Storage Requirements](docs/Databases/MongoDB/Storage-Requirements.md);
`tests/databaseHealthScans.test.cjs` pins them.

</details>

and fixes the following bugs:

**Board Settings / Card** - a field ticked Show on Card but empty, and the
Draggable
table's checkboxes.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/66ee2d12f3">A ticked Draggable checkbox is a checkbox, not a dot</a>. Thanks to mimZD and xet7.</summary>

[#6820](https://github.com/wekan/wekan/issues/6820): the Draggable table
brought its native checkboxes back but kept the 9px 14px padding forms.css
gives every input, so a ticked 16px box left the browser about 2px to draw
in. The WIP limit groups popup and task-list checkboxes in a description had
the same fault. `tests/nativeCheckboxPadding6820.test.cjs` fails on any
stylesheet that brings back a native checkbox with that padding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ccc67ddf68">Show on Card and an empty field: Show empty fields, Show empty or On this card show it</a>. Thanks to mimZD and xet7.</summary>

[#6817](https://github.com/wekan/wekan/issues/6817): on v12.65 a Due date ticked
in Show on Card was not shown on a card without one. Show on Card says what a
card can show; an opened card shows a field when it has data. An empty one is
shown by Card Settings / Card's Show empty fields, the Show empty column, or +
Add / On this card, all in this release.
`tests/showOnCardEmptyField6817.test.cjs`
pins the reporter's board through each.

</details>

**Admin Panel / Attachments** - the Retention page.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e6f7d226ca">The Google Cloud Storage key help is shown once</a>. Thanks to xet7.</summary>

A leftover copy of the key's description, from before the English and
translated pairs, showed the same sentence twice under the field.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e998651ea">A storage setting's English description is not shown twice</a>. Thanks to xet7.</summary>

Each storage setting shows its description and menu path in English and in
the user's language, and the English was typed into the template a second
time: in English, and wherever a translation is missing, the same sentence
stood twice. The English comes from en.i18n.json now, and the translation is
shown only when it differs.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2799eb900f">Retention shows readable labels, choice names and the default of an empty variable</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6819](https://github.com/wekan/wekan/issues/6819): the page showed only
variable names, the raw choices, and Default () when a variable was set but
empty, as a Helm chart or docker-compose file does. Fields have translated
labels with the variable name beside them, help lines and choice names, and an
empty variable shows its default. From the reporter's patch;
`tests/attachmentRetentionLabels6819.test.cjs`.

</details>

**Opened card** - a card opened from its link.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7ed3ca7c5c">A card opened from its link stays open when the connection comes back while the page loads</a>. Thanks to brlin-tw and xet7.</summary>

[#6808](https://github.com/wekan/wekan/issues/6808): behind a reverse proxy the
DDP connection can drop and come back while a card's link loads; a
subscription re-run before the resumed login answered with nothing, the card
left Minimongo for a moment, and the close-on-removal of #3114 closed it and
went to the board's address. The window now waits while the subscription,
connection or login is settling, then asks the server - the 'card'
publication's own rule - and closes only on its no. A card really deleted,
archived or moved still closes. `tests/openCardClose6808.test.cjs` pins it and
fails on any close on Minimongo's word alone; the browser test drops and
restores the connection.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/036ac4f56b">A card deleted elsewhere while open also leaves the card's address</a>. Thanks to brlin-tw and xet7.</summary>

The browser test of [#6808](https://github.com/wekan/wekan/issues/6808) found
the other half: when the card window was already gone - the card deleted in
another tab - the check that asks the server ran inside the window's own
autorun, which was stopped with it, so the address stayed on the deleted card.
The check now runs outside the window and also from its teardown, and
`tests/openCardClose6808.test.cjs` pins both.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8f9103c336">It stays visible after Maximize and Minimize, or Collapse</a>. Thanks to xet7.</summary>

The class that keeps the window unpainted until it is placed beside its
minicard was a static class removed by hand. Blaze writes a tag's static
classes again whenever its class attribute changes, so maximizing and
minimizing, or collapsing, left the card open but invisible. It is a reactive
class now, off for good once placed; `tests/cardDetailsPlacement.test.cjs`
fails on a static one.

</details>

**Minicard** - its custom fields.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a24da2a039">Only the custom fields that have a value, as before</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6811](https://github.com/wekan/wekan/issues/6811): the rewrite of the
minicard's sections dropped the check of 2019, so every field a card carries -
also the ones added empty by Automatically on card / Always on card - was drawn
as an empty row. An empty, blank or unset value is not drawn; 0 and an unticked
checkbox are values. The opened card is unchanged. From the reporter's patch;
`tests/minicardFilledCustomFields6811.test.cjs` and its browser test.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f6fd560817">After the upgrade, Show on card custom fields stay on the minicards</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6812](https://github.com/wekan/wekan/issues/6812): custom fields on minicards
became an opt-in Board Settings / Card switch with false written into every
board, so fields marked Show on card vanished from minicards. A once-ever
upgrade step turns the switch on for each board that has such a field; a board
turned off later stays off. From the reporter's patch, with its three tests in
`tests/schemaUpgradeSteps.test.cjs`.

</details>

**Date popups** - Save without picking a day.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6f5aab875b">Save without picking a day saves today instead of Invalid date</a>. Thanks to brlin-tw and xet7.</summary>

[#6809](https://github.com/wekan/wekan/issues/6809): a date popup of a card
without that date opens the calendar on today, marks it and names it in the
heading, but its date field was empty, so Save answered Invalid date. The form
starts from today now, and Save saves today at the popup's default time. A
card's own date is kept, and an emptied field is still refused.
`tests/datePickerToday6809.test.cjs` and a browser test.

</details>

**Checklists** - a drag on one's own board, and deleting a checklist.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4bd6a7f088">Dragging a checklist item on one's own board is no longer reported as a cross-board attack</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6813](https://github.com/wekan/wekan/issues/6813): a drag sets cardId and
checklistId to where the item already is, and for a comment-only member or a
Worker their own board is one they cannot write to, so ChecklistBleed's canary
named them as attackers in Admin Panel / Problems. The board the item is on is
no destination now - the board of its source card, which the allow rule decides
on, not the item's own boardId as the reporter's patch read it: insert kept a
boardId the client sent, and a forged one would have let an item onto a victim
card. Checklists, checklist items and text notes take boardId from their card
on insert always. A move to another unwritable board is still denied and
reported. `tests/checklistSameBoardCanary6813.test.cjs` runs the real deny
functions, the forged boardId included.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/742996dcce">Deleting a checklist deletes its items</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6816](https://github.com/wekan/wekan/issues/6816): every way to delete a
checklist - the card, the REST API, a rule - removed only the checklist, and its
items stayed behind pointing nowhere (2335 of them in one production database).
The checklist's items are removed with it now, as deleting a card already
removes its children. Items orphaned before are left for the administrator.
From the reporter's patch; `tests/checklistDeleteItems6816.test.cjs` and a
browser test.

</details>

**Cards** - their numbers, and cards moved to another board long ago.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f2908f34e7">Their numbers stay unique: the server checks the number a browser sends</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6815](https://github.com/wekan/wekan/issues/6815): a card added in the browser
brought the number the browser computed from the cards in its view, so with
lazy loading numbers were reissued (842 duplicates in one production database).
The server replaces a number another card on the board has, and raises the
counter to a free one it did not issue - seeding a new counter from the board's
highest number, which the reporter's patch skipped. Existing duplicates are not
renumbered. `tests/cardNumberUnique6815.test.cjs` runs the real hook.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/32031c64c4">Moved to another board before #5874, they are shown again</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6814](https://github.com/wekan/wekan/issues/6814): a card moved before the
\#5874 fix could still point at a list of the board it left, and was shown
nowhere (706 such cards in one production database). An upgrade step gives each
its board's first unarchived list, or a Rescued Data list. It runs before
swimlane-structure, so a card left on the old board's swimlane gets one of its
board in the same pass. From the reporter's patch, with three tests in
`tests/schemaUpgradeSteps.test.cjs`.

</details>

**Add card** - the due date hint.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f852cb7032">The due date hint follows the board's switch while the form is open</a>. Thanks to xet7.</summary>

The hint was recomputed only on typing, so turning Due date from title off in
Board Settings / Card left a hint already shown. `tests/titleDueDate.test.cjs`
pins it.

</details>

**Editors** - the first keys typed into a form.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/69a8bae0c6">Text typed right after a form opens is no longer selected and replaced</a>. Thanks to xet7.</summary>

50 ms after an inlined form opens it focuses the field and selects what it
holds, so the first key replaces a title being edited. Text typed in those
50 ms was selected too, and Enter for a new line left only a line break. The
selection is skipped once the field has changed;
`tests/inlinedFormSingleOpen.test.cjs` pins it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9c0f408a00">Autofocus no longer takes the keyboard from a field being typed in</a>. Thanks to xet7.</summary>

Whenever a re-render added a field marked autofocus, the last one on the
page was focused and its text selected 50ms later - also while somebody was
typing elsewhere. On the import page that moved the attachment token into the
pasted Jira export, replacing it. Only a field just added is focused now, and
never away from a field being typed in.

</details>

**Board visibility** - the Private and Public choices.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/437da1d9c7">The Private and Public descriptions are shown again</a>. Thanks to xet7.</summary>

The helper handed the translation function over unbound, so it threw and
both descriptions were an empty line in every language since custom
descriptions came to Admin Panel / Settings / Visibility.
`tests/visibilityDesc.test.cjs` fails on any unbound one in the tree.

</details>

**Drawing** - the size of a new drawing.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2929b61c85">A new drawing fills the window it is shown in, also once maximized</a>. Thanks to xet7.</summary>

A new drawing was fitted to the popup before it was maximized and kept that
size. It is refitted whenever its room changes, until it is zoomed or resized
by hand.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bb614743fd">Maximized, a drawing takes the window, and opened at the right it is not cut off</a>. Thanks to xet7.</summary>

The refit above was right, but a maximized drawing was still drawn 784px
wide: popup.css kept the older design's 800 x 500 shape and overrode the
drawing's own size. That rule is gone. Opened from the card's menu at the
right of the window, the Drawing popup also grew past the window's edge,
cutting off Save; a movable popup that grows is now kept inside the window.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/58751aa339">The Drawing popup is as wide as its drawing, so nothing in it is cut off</a>. Thanks to xet7.</summary>

The fix above was not the whole story: measured in the rebuilt app, the
popup never grew. Every popup is at most 380px wide, the 820px drawing
overflowed inside it and the popup clipped the larger pen sizes and Save. The
Drawing popup is now up to 860px wide, so the rule that keeps a growing popup
inside the window has a size change to act on.

</details>

**Apple Glass Pastel** - muted text on light glass.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9679aaf636">Muted text is darker, readable on every light surface</a>. Thanks to xet7.</summary>

The theme's quiet text, `#6b7280`, was 4.51:1 on `#f7f7f7` and 4.44:1 on the
tinted card header, at or under the 4.5:1 it needs; `#4b5563` is about 7:1.
The opened card and sidebar contrast tests now wait for the theme before they
measure, as the header test does.

</details>

**Linked cards** - the fields a linked card shows.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1f5a7b8220">A linked card shows the fields and member avatars its source card has</a>. Thanks to xet7.</summary>

Which fields a card shows is decided from its data, and a linked card has no
data of its own: members, labels and dates live on the source card. The choice
counted the linked card's own empty fields, so its members' avatars were hidden
after a reload. The data and counts now come from the source card, while the
Show on Card choices stay those of the board the card is opened on.
`tests/linkedCardShownFields.test.cjs` pins it.

</details>

**Search** - board search and Global Search.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6c2edd6752">Board search highlights one result at a time</a>. Thanks to xet7.</summary>

Enter steps to the next card found, and each step added its highlight without
removing the previous one, so two cards were marked at once. The previous
highlight is now removed first.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/125e1659f8">Cards with attachments are found again, by has:attachment and by file name</a>. Thanks to xet7.</summary>

Global Search looked attachments up by a top-level `cardId`, but an attachment
records its card in `meta.cardId`, so has:attachment and a file name search
found nothing; has:-attachment and has:-checklist matched the same cards as
their positive forms. Both now read `meta.cardId`, skip deleted attachments and
honour the negation. `tests/searchHasAttachmentPredicate.test.cjs` pins it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dad16609c9">Board search finds the text as typed, not as a regular expression</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6822](https://github.com/wekan/wekan/issues/6822): the sidebar search, the
link-card popup, the list, swimlane and board pickers and the import member
search compiled the typed term as a regular expression, so "C++", "(2026)" or
"[x" threw and showed nothing, and "." matched any character. They match the
text literally now, still ignoring case, like every server-side search; the
Advanced Filter's `/regex/` syntax is unchanged.
`tests/searchLiteralTerm.test.cjs` fails on any client or model file that
compiles a raw term again.

</details>

**Activities** - what a new card records.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f3b211b37">A new issue and a linked card made over REST record "created" once, not twice</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6823](https://github.com/wekan/wekan/issues/6823): Version Control's New issue
and the REST route that creates a linked card inserted through the collection,
whose hook already records the activity, and then recorded it again, so
watchers got two notifications and two emails. The extra calls are gone, and
the hook names the card's author when it runs outside a method, so the REST
card keeps its author. `tests/noDoubleCreateActivity.test.cjs` fails on any
explicit record after a hooked insert.

</details>

**Database load** - background jobs and searches on a large installation with
many pods.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d481bffdfe">The History audit and the position-history cleanup run once per installation</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6821](https://github.com/wekan/wekan/issues/6821): both were per-process
timers, so 24 pods read the whole History 24 times an hour and asked one query
per board membership - 148,660 - 24 times a day to trim nothing. Both are
SyncedCron jobs now, one pod per scheduled time, waiting for a quiet CPU. The
cleanup visits only the user/board pairs over 1000 entries and keeps the same
newest 1000. `tests/positionHistoryCleanup.test.cjs` checks it against the old
result.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2be842351b">Search sessions are indexed, and everybody's stale sessions are removed</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6824](https://github.com/wekan/wekan/issues/6824): every global search and
card report scanned the whole `sessiondata` collection three times, and only
the searching user's own day-old sessions were ever removed - one instance held
4,751 sessions, 10 GB. It has indexes on `{ userId, sessionId }` and
`modifiedAt` now, and sessions older than a day are removed for everybody.
`tests/searchSessionIndexes.test.cjs` pins it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e9440d503e">The hourly recurring-card job no longer reads every card</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6825](https://github.com/wekan/wekan/issues/6825): with no index on
`recurrenceInterval`, the job was a full scan - 1.1 million cards, 1.1 s every
hour on one instance. A partial index holds only the cards that recur.
`tests/recurrenceIndex.test.cjs` pins it.

</details>

**Attachments** - files stored by the API, the site logo, and a validated move.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e7505a4fef">The API's JSON uploads and copies, and the site logo, are stored again</a>. Thanks to xet7.</summary>

The JSON branches of REST upload, upload-background and copy, their
Meteor-method twins and Admin Panel's site logo upload called
`Attachments.insertAsync`, which Meteor-Files has only on the client, so each
failed with "is not a function". They use `writeAsync` now, whose after-upload
hook also validates the file and moves it to the default or copy storage.
`tests/attachmentApiServerWrite.test.cjs` fails on any server-side
`insertAsync` of a Meteor-Files collection.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d3e80af1ac">Validate and move to storage moves the file again</a>. Thanks to xet7.</summary>

The method moved the file by calling `moveAttachmentToStorage` from
`Meteor.defer`, where there is no user, so that method's login check refused
every move. All its checks are made before the defer, so the deferred step moves
the file itself, as the upload path does. `tests/moveStorageBleed.test.cjs`
fails on any deferred or timed callback that calls a Meteor method.

</details>

**REST API** - where a new card goes.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c355926767">A new card's list and swimlane must belong to the board in the URL</a>. Thanks to xet7.</summary>

POST cards and POST cards/bulk wrote another board's list or swimlane onto a
new card, which then showed on neither board - the #6572 shape the PUT route
already refuses. Both answer 400 naming the field now, the bulk route per entry.
`tests/restCardPlacement.test.cjs` fails on any REST handler that inserts a
card without the check.

</details>

**Lists** - who sets a WIP limit.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a40c4495d4">A WIP limit is set by a board admin, on every path</a>. Thanks to xet7.</summary>

The WIP limit methods required a board admin, but a member with write access
could still set `wipLimit` with a plain list update or REST PUT. A deny rule and
a REST admin check apply the methods' rule everywhere; title, color and starred
stay with write access. `tests/wipLimitAdminOnly.test.cjs` runs the real deny
rule.

</details>

**Admin Panel / Problems** - AuthBleed attempts, and Data health's wording.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/314c153c9b">AuthBleed attempts are recorded</a>. Thanks to xet7.</summary>

[AuthBleed](https://wekan.fi/hall-of-fame/authbleed/): `copyBoard`, `copyCard`,
`copySwimlane` and `createCardWithDueDate` refused without a trace. A
signed-out caller of any of them, and any refusal of `createCardWithDueDate`,
which no WeKan client calls, is recorded as `authz.copy` now. Membership
refusals of the copy dialogs are not: a template or a stale dialog reaches them
in ordinary use, and a high-severity record would disable that login.
`tests/authBleedCopyMethods.test.cjs` pins both.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/77956c98ed">Data health's "Never" has a key of its own</a>. Thanks to xet7.</summary>

The status line reused List Sync's "never synced" key. `data-health-never-run`
is filled in every locale from that locale's existing translation of the same
English word, and a Transifex translation still replaces it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/35ba67ee69">File status lists every kind of finding, not 500 rows of one</a>. Thanks to xet7.</summary>

The report lists 500 findings and counts the rest, first come first served:
14358 integrity baseline move candidates took every row, and the wrong file
extension a type check is run to find was only a number in the totals. A
kind with fewer rows listed now takes the place of one from the kind with the
most. `tests/fileStatusAudit.test.cjs` pins it.

</details>

and has the following developer-facing changes:

**Tests** - guards and specs that read the wrong thing.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c40503a2b">Three Firefox specs wait for what they test, and drag inside the window</a>. Thanks to xet7.</summary>

The search phrases spec searched before the browser had the setting it had
just written, the Card Settings column spec counted a pane that had not
rendered yet, and the drawing spec dragged a corner handle past the window's
edge, which Firefox does not deliver.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/21b2da9ad2">The title heading colour guard reads the heading block itself</a>. Thanks to xet7.</summary>

`tests/boardViewTitleViewer.test.cjs` read from the last comment of
`minicard.css` and `cardDetails.css` to the end of the file, so it passed only
while the rules after the heading sizes set no colour, and failed once the Card
kind check mark of v12.65 was appended with its own. It now reads the heading
block and still fails on a colour there.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2dfdf77c2b">The Card Settings drag and drop spec turns drag handles on for its user</a>. Thanks to xet7.</summary>

The fixture's user has an `id`, not an `_id`, so `setHandles(user._id, ...)`
matched no user and the handle half of `settings-drag-reorder.e2e.js` never had
drag handles on.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8788458a87">The browser specs' boards show every field, as the specs were written for</a>. Thanks to xet7.</summary>

With Show empty fields off by default, a new board hides a card's empty
fields, and the specs that open a card to add a checklist or a date found no
button to click. The seeded board turns Show empty fields on; the Card Settings
spec, which tests the switch itself, turns it off again.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/00cf8f0958">The shared-template language specs read the description where it is</a>. Thanks to xet7.</summary>

The Corsican and Southern Sotho specs looked for the description and the hint
inside the scope checkbox list; both are its siblings in `.templates-settings`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6241be9053">The specs add a first checklist with the title line's +, where #6796 put it</a>. Thanks to xet7.</summary>

The bottom add checklist link appears only once a card has a checklist, so
every spec adding a first checklist failed, and 12-checklists skipped its
checks silently.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a4197f228f">The Card Settings specs open the section a row is in, and pick the list by its side</a>. Thanks to xet7.</summary>

The popup draws only the open section's rows, each once per list.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/978af29b33">The language specs read the option values, tabs, addresses and texts the app has</a>. Thanks to xet7.</summary>

Corsican, Haitian, Scottish Gaelic, Latin, Malagasy and Irish specs; a plain
member is not shown the Rules editor at all, and the server still refuses
their rule writes.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a8f65adff2">Specs follow deliberate changes, and their fake SMTP server waits for its port</a>. Thanks to xet7.</summary>

LinkedWriteBleed over REST is refused and recorded without disabling the
account (#6798); notification intents are seeded recent, past the expiry of
\#6768; an invite mail goes to a running SMTP sink, and a sink waits for a busy
port.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/13d3a74b3f">The S3 settings spec expects both of its translated Save buttons</a>. Thanks to xet7.</summary>

The S3 pane has had two Save buttons since \#6465, one under the Enabled and
Read switches and one after the connection fields; the spec matched one.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4a656baea3">The Scrum, Sesotho and drag reorder specs read one list per side, and open the SMTP fields first</a>. Thanks to xet7.</summary>

Card Settings draws each row once per list and leaves the minicard list head
empty; the Date section starts with the fixed Mark as complete row; the SMTP
host field is shown only while email settings are on and SMTP is chosen.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/02bb0814c3">linkedWritePolicy and webhookBleed read the code as it is now</a>. Thanks to xet7.</summary>

One sliced up to a line the double-activity fix removed and so read the rest of
the file; the other pinned copyBoard's signed-out refusal as one line, which now
records an AuthBleed attempt first. Both keep their assertions.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d8d7b01334">The Card Settings both-sides and Scrum title specs follow the current Card Settings</a>. Thanks to xet7.</summary>

Six rows have no minicard side by design, which one spec read as missing; the
other read the pane title before Card Settings, which opens on Card now, had
switched to Scrum. Both failed in the Chromium stage of a full run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cbf9d2f843">The UploadBleed and StampBleed specs do the legitimate case first, and check the block</a>. Thanks to xet7.</summary>

The attempt came first, and a signed-in account that attempts a
vulnerability is blocked and signed out - so the legitimate upload and
checklist that followed ran signed out and were refused. Each spec now does
the legitimate case first and checks that the attempt blocked the account.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3f72fcd7f9">The Move and Copy Card helpers wait for the destination picker before reading it</a>. Thanks to xet7.</summary>

Asked while the popup was still rendering, the helper saw no boards select
and moved the card within its own board; #6793's Move Card spec then waited
for a board change that never came.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9549388dd0">The smaller font preset is measured on the Card Settings heading text</a>. Thanks to xet7.</summary>

The headings' smaller font was moved from their line to their text, so the
em-sized columns stay aligned with their cells; the spec still measured the
line.

</details>


**.tools/ and the editor sandboxes** - every file the scripts write stays in the
checkout, and VSCodium can be confined to it on Linux, macOS and Windows.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aeff4900df">Every file the scripts write stays in .tools/: temporary files, downloads, Meteor, Node.js, npm</a>. Thanks to xet7.</summary>

They wrote to `/tmp`, `/var/folders`, `~/Downloads` or `~/Lataukset`,
`~/.meteor`, `~/.nvm`, `~/.npm`, `/usr/local` and into `~/.zshrc`. Now
`releases/tools-env.sh` keeps temporary files, downloads, release zips,
Meteor, Node.js, the npm cache and Go in `.tools/`, and puts those tools on
`PATH` without touching a shell rc file. Every `mktemp` names `.tools/tmp`,
because macOS's ignores `TMPDIR` otherwise. Containers get `.tools/tmp` as
their `/tmp`, verified with MariaDB's temporary tables.
`tests/toolsDirOnly.test.cjs` keeps it so.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e79ec61bcc">build.bat and the releases\ batch files keep every file in .tools\ too</a>. Thanks to xet7.</summary>

`releases\tools-env.bat` does on Windows what `tools-env.sh` does, and
`build.bat` unpacks the Dockerfile's Node.js from nodejs.org's zip into
`.tools`, verified against `SHASUMS256.txt`, instead of a system-wide
Chocolatey install. Meteor goes into `.tools\.meteor`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/42ed50413f">macOS: VSCodium under sandbox-exec, reaching only ~/Documents/repos/wekan</a>. Thanks to xet7.</summary>

The macOS counterpart of the Linux Flatpak sandbox:
`docs/Security/Sandboxes/macOS/sandbox.sh` refuses the home directory,
`~/.ssh`, other users and other disks, and opens only the checkout.
VSCodium's settings, `HOME` and temporary files are kept in `.tools`.
Verified on macOS 27 with VSCodium running inside. The README explains the
design, including why Chromium's own sandbox is off.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6ac70c4cdd">Windows: VSCodium in Windows Sandbox, seeing only Downloads\repos\wekan</a>. Thanks to xet7.</summary>

`docs/Security/Sandboxes/Windows/sandbox.bat` starts a disposable Hyper-V
Windows Sandbox in which the checkout is the only mapped folder. VSCodium
and PortableGit are downloaded once into `.tools`, each verified before it
is unpacked. Not run on Windows yet; the README says what to check.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8af1e8aec8">mirror.sh uses the WeKan checkout as the source, not a second clone</a>. Thanks to xet7.</summary>

Syncing wekan/wekan cloned all of GitHub's 500 MB into
`.tools/wekan-github`, although that is this checkout. The source's
branches and tags are fetched into it under a private namespace instead,
which took 1.7 seconds, and deleted after the push. Only the destination
mirrors are cloned.

</details>

**Helm chart** - the chart's settings reference and its memory.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9994e82bae">values.yaml's settings reference is generated from docker-compose.yml</a>. Thanks to xet7.</summary>

Copied by hand once, the chart's commented reference of every WeKan setting
had fallen 74 settings behind. `releases/charts-values-reference.mjs`
regenerates it, `release-charts.sh` runs it on every chart release, and a
comment after a value no longer becomes part of it. In wekan/charts the
WeKan pod now requests 512 MiB and is limited to 2 GiB, as #6606 had asked:
the old 1 GiB gave a heap WeKan crash-looped in.

</details>

**macOS** - the scripts and tests, run on a Mac with bash 3.2 and BSD tools.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/96ad680cd4">The release scripts find the checkout on every system</a>. Thanks to xet7.</summary>

They hard-coded Linux's `~/repos/wekan`, so on a Mac, where the checkout is
`~/Documents/repos/wekan`, they changed into nothing or a stale copy. Each finds
the checkout from its own location now, and the download folder is `Lataukset`
only where it exists. `tests/repoLocationPerOs.test.cjs` pins the three places.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9927adcb44">Companion repositories are read from .tools/ only, never from ../w/</a>. Thanks to xet7.</summary>

The Hall of Fame tests, the Helm chart scripts and the Docker cleanup still fell
back to an old `../w/` beside the repository; a stale `../w/wekan.fi` failed a
test with markup the site no longer has. `tests/noLegacySiblingRepos.test.cjs`
keeps `../w/` from coming back.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/283e51eac0">The root and releases/ shell scripts run on macOS too</a>. Thanks to xet7.</summary>

Every script was checked with macOS's bash 3.2 and for GNU-only options: an
associative array, an empty array under `set -u`, a broken `find-replace.sh`,
`sha256sum`, `nproc`, GNU `sed -i`, `ln -sfT`, `stat -c` and `ip` each have a
portable form or a fallback. `tests/macosShellPortability.test.cjs` parses every
bash script with bash 3.2 and fails when one of these shapes comes back.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fa1bb293f9">The UCS migration hook locks without flock, and the Nextcloud package is packed without GNU tar</a>. Thanks to xet7.</summary>

Without `flock` the UCS hook takes the same lock with perl's `flock()` on its
file descriptor. `releases/nextcloud-pack.sh` packs the ExApp under its app id
with options GNU tar and bsdtar share, and keeps macOS's `._*` files out;
the release workflow and its test use it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1f9ada5599">No /proc: conformance runs keep each other's containers, and the start scripts see the real memory</a>. Thanks to xet7.</summary>

On a Mac `db-conformance.sh` saw every live run as dead and removed its
containers; it reads the command line with `ps` there. `start-wekan.sh` and the
bundle's start script assumed 2 GiB and now ask `sysctl`, and the speed monitor
shows the load average.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/43e09631c4">A Node.js without single executable applications is named, not run</a>. Thanks to xet7.</summary>

Homebrew's Node.js is built without them, and the single-file build stopped with
a bare exit 9. It says what to do now, and its tests skip that build and expect
the host's own arch rather than x64.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0ed8fb20f2">strip-node.sh is exercised on a real Mach-O</a>. Thanks to xet7.</summary>

On a Mac the ELF fixture is a Mach-O, so those cases skip, and a new case checks
that the local symbols go, the exported one stays and the binary is re-signed
and runs.

</details>

and updates the following documentation:

- [Show empty fields of Card Settings, the \[label\] title switch of Member Settings, and Data health repairs](https://github.com/wekan/wekan/commit/30e960e129).
  Thanks to xet7.

and updates the following translations:

**Languages updated:** 232 languages.

**Board Settings / Card** - the Show empty and Show empty fields headings.

- [Show empty and Show empty fields in every language](https://github.com/wekan/wekan/commit/1aa9df6075).
  Thanks to xet7.

**Member Settings** - the [label] switch of Add card.

- [Turn \[label\] at the start of a new card title into a label, in every language](https://github.com/wekan/wekan/commit/f89c8f8030).
  Thanks to xet7.
- [Tigre and Tsonga wording of the switch](https://github.com/wekan/wekan/commit/595e26cfa8).
  Thanks to xet7.

**Admin Panel / Attachments** - the Retention help line.

- [Tigre card noun in the Retention help line](https://github.com/wekan/wekan/commit/c7145402af).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.65 2026-10-25 WeKan ® release

**In short:** an **opened card** shows only the fields it has, with **+ Add**
for the rest. **Drawing** works with a pen on the whole window - from Add Card
and Add attachment, saved as SVG, with an eraser, palm rejection and a lasso
that moves, resizes, groups and layers lines - and **SVG** is an image again,
sanitized whole at any size, streaming, on upload and on every serve.
**FerretDB** answers WeKan's queries in the database on every backend, and
**SQLite** stores documents as JSONB. **Right-to-left** checkboxes and list
resizing are fixed.

This release fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a90576bafa">The speed test report escapes a backslash before the pipe in a table cell</a>. Thanks to GitHub CodeQL and xet7.</summary>

CodeQL alerts #593, #594 and #595 (`js/incomplete-sanitization`):
`docs/Databases/FerretDB/1/SpeedTest/report.cjs` escaped `|` as `\|` in
Markdown table cells but not a backslash, so a value ending in one turned the
added backslash into a literal one and its pipe split the cell. One `mdCell()`
escapes the backslash first, then the pipe, and a line break becomes a space;
the database's name and the query's title now go through it too.
`tests/speedTestReportCells.test.cjs` checks that no value can add a column to
its row, and that nothing in the tree escapes a pipe without the backslash. The
report is built from local results, so there is no attempt to record in
Admin Panel / Problems.

</details>

and adds the following new features:

**Opened card** - only the fields a card has, and "+ Add" for the rest.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6fe0a7ef94">An opened card shows only the fields it has data in, and + Add under the cover adds the rest</a>. Thanks to xet7.</summary>

An opened card shows the fields it has data in, plus its description,
attachments and comments - empty or not - and its cover when it has one.
"+ Add", under the cover, opens the Admin Panel's own left menu and pane: the
sections (Date, Members, Scrum settings, ...) on the left, their fields from
Board Settings / Card on the right, each with a checkbox that shows or hides
the field on this card. Board Settings / Card still decides what a card can
show. The design is
[Card fields](https://github.com/wekan/wekan/blob/main/docs/Features/Cards/Card-Fields.md);
`tests/cardShownFields.test.cjs` and
`tests/playwright/specs/card-add-fields.e2e.js` cover it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c4f528159b">Cover on by default, a new drawing is the cover, no empty Similar cards or Custom Fields, and a better + Add popup</a>. Thanks to xet7.</summary>

The opened card's cover image is on by default; a once-ever upgrade step turns
it on for boards created while it was opt-in, and a board turned off later
stays off. A new drawing becomes the card's cover. There is one separator line
under "+ Add": the Sort group drew its rule for fields the card did not show.
Similar cards and Custom Fields are shown only when there is something in
them. The "+ Add" popup moves by its title bar (the drag handle of every
movable popup is shown only while drag handles are on), maximizes, is wide
and high enough for its labels and menu, and only a clicked checkbox animates.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5d80b07bed">A maximized card has its comments in the right column</a>. Thanks to xet7.</summary>

The comments section is its own template, in the left column of the opened
card and, when the card is maximized, at the top of the right one beside the
fields.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/20e2273c07">Board Settings / Card and + Add are one popup, with sections in a left menu</a>. Thanks to xet7.</summary>

Board Settings / Card is the Admin Panel's left menu and pane, and the opened
card's "+ Add" opens the same popup for that card. Every row is in one section;
each line has, in reading order, On this card (from a card), Show on Minicard,
Show on Card and the field, each side with its checkbox, its position and up
and down arrows. A row's name leaves out its section's ("Sprint", not "Scrum
settings: Sprint"). "On this card" is new in every language.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4f20f24201">Five card actions are in the hamburger of the section they act on</a>. Thanks to xet7.</summary>

They left the card's actions menu: on the opened card each is in the hamburger
of the section it acts on - the Scrum fields the card shows are one Scrum
settings section with Card kind in its hamburger - and in Card Settings they
are at the top of that section's pane. `tests/cardSectionActions.test.cjs`
fails for a hamburger whose items are not in Card Settings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/65621f44cc">The card actions menu in a new order, as one list</a>. Thanks to xet7.</summary>

Move Card, Copy Card, Save as Template, Copy Template to Many Cards, Card
recurrence, Move to Top, Move to Bottom, Watch, Star; Set color, Drawing; Copy
link to clipboard, Link to board, QR code, History, Export, Import, Move Card to
Archive, More. Each item keeps the permission it had.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c69f3fe25a">Card Settings: Card first, Subtasks and Planning Poker sections, settings in their pane</a>. Thanks to xet7.</summary>

The first entry is Card, with the move-reason question, Draggable and the
card's own rows. Subtask settings, Edit custom fields, Change spent time, Card
kind, Edit voting and Edit Planning Poker are forms at the top of their pane
instead of popups; saved there, Card Settings stays open.

</details>

- [Card Settings: the pane's columns line up, and an inline form's buttons no longer push the rows aside](https://github.com/wekan/wekan/commit/ede0d68b27).
  Thanks to xet7.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f33987931f">Card Settings / Custom Fields: Create Field and Link fields are forms in the pane</a>. Thanks to xet7.</summary>

Under Edit custom fields, the pane has the two forms its buttons opened: Create
Field (also from Board Settings, for a board admin) and Link fields to another
card. A field saved there empties the form for the next one and Card Settings
stays open; opened as their own popup they step back when saved, as before.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ca53019d96">Card kind shows which kind is selected</a>. Thanks to xet7.</summary>

In Card Settings / Scrum settings and in the Card kind popup the selected kind
has a check mark at the end of its line and is bold, and the list is a
radiogroup with `aria-checked`. Before, it only had an `is-active` class that
nothing styled. `tests/cardKinds.test.cjs` pins the mark on each kind.

</details>

**Drawing** - handwriting and sketching on a card, with a pen too
([#6802](https://github.com/wekan/wekan/issues/6802)).

<details>
<summary><a href="https://github.com/wekan/wekan/commit/54726264d3">A new drawing from Add Card and Add attachment, on the whole window, saved as SVG</a>. Thanks to mimZD and xet7.</summary>

Add attachment / Drawing, and Add Card's new Drawing button - shown while the
composer adds one card: the card is added, opened and drawn on - open a new
drawing on the whole window, saved as an SVG attachment of the card, its lines
kept for editing. The eraser takes away the lines it touches, and palm rejection
keeps a hand resting on a tablet from drawing once a pen has. A lasso tool is
not part of it. `tests/cardDrawingPen.test.cjs` and
`tests/playwright/specs/card-drawing-pen.e2e.js`; described in
[Drawing.md](docs/Features/Cards/Drawing.md).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c11976a2e1">The Drawing popup moves by its title bar or a drag handle, and maximizes</a>. Thanks to mimZD and xet7.</summary>

Like the opened card: dragged by its title bar or the handle beside it, with the
card's maximize / minimize button. Minimizing puts it back where it was, a
maximized popup stays put, the drawing keeps its shape so the pen lands under
the
pointer, and a popup left maximized opens maximized again. Drag to move,
Maximize
and Minimize are in every language.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4bea319239">Board Settings / Card calls the Whiteboard row Drawing</a>. Thanks to mimZD and xet7.</summary>

The row that shows or hides the Drawing popup's Open as whiteboard button is
named after the card menu's Drawing, with its existing translations.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1c26e1bcd0">A lasso selects lines to move, resize, group and ungroup, and to change their layer</a>. Thanks to mimZD and xet7.</summary>

Issue #6802 suggested a lasso for selecting and moving things. A loop drawn with
it
selects every line wholly inside, and a grouped line brings its whole group.
The selection moves from inside its box, stopping at the edge; resizes from
its corner handle, line widths to the nearest allowed one; groups and
ungroups, the group saved with the drawing; and goes to the front, the back,
or one layer up or down. Undo now steps back through every change.
`tests/cardDrawingLasso.test.cjs` and
`tests/playwright/specs/card-drawing-lasso.e2e.js` cover each step, with
every locale translated.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d5d027a6f2">The whole window to draw on, growing from its corner, zoom, any color, and Save above the drawing</a>. Thanks to xet7.</summary>

The drawing area takes all the room the popup has instead of a fixed 800 x 500:
a handle at its corner makes it larger, or smaller without cutting a line, and
the magnifier zooms it. Clicking a color opens a color wheel, a brightness
slider and the HTML color code; custom colors are added to the palette, and
the eyedropper picks a color from the screen (or the drawing). Save is above
the drawing, and Add Card's Drawing is in Search / Template / Drawing / More
options. `tests/cardDrawingCanvasColors.test.cjs` and
`tests/playwright/specs/card-drawing-canvas.e2e.js` cover it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/91c12ebcce">Custom colors are kept with the account when signed in, in the browser otherwise</a>. Thanks to xet7.</summary>

The custom colors added to the palette are stored in the user's profile
(`profile.drawingColors`, the `setDrawingColors` method), so they follow the
user to every browser. Only `#rrggbb` codes are stored, each once, at most 16,
and nobody who is not signed in can store any. Drawing on a public board
without signing in keeps them in that browser.

</details>

**SVG images** - an image like any other again, made safe where it is served.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0afb1336db">SVG is uploaded and shown as an image: an attachment, a cover, a board background, an avatar</a>. Thanks to xet7.</summary>

SVG uploads were refused, and every SVG served as a download, after
JVN#74210258. Every uploaded SVG was already sanitized before it is stored - no
script, event handler, `javascript:` URI, `foreignObject` or XML loop - so they
are allowed again. Every route that serves a file now sanitizes an SVG whole
again before sending it, under a Content-Security-Policy with no script and
`sandbox`, so it runs nothing even opened directly. Removed active markup is
logged to Admin Panel / Problems.
`tests/svgServing.test.cjs` also fails when a serving route skips this, and
`tests/playwright/specs/svg-attachment.e2e.js` uploads one and uses it as a
cover and a board background.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e748559838">An SVG of any size is sanitized whole, streaming, on upload, on validation and when served</a>. Thanks to xet7.</summary>

The sanitizer was a set of regular expressions over the whole file: it read
the file into memory, missed an entity-encoded `&#106;avascript:`, saw nothing
in UTF-16, and the serve path sent anything over 8 MB as an unsanitized
download while validation rejected every SVG over its 1 MB scan. A streaming
tokenizer, `models/lib/svgSanitizer.js`, replaces it everywhere: script,
foreignObject, iframe/object/embed, SMIL set/animate, event handlers,
script URIs after decoding references, dangerous CSS, DOCTYPE/ENTITY and
processing instructions are removed wherever they are, however the file is
split into chunks. `tests/svgSanitizerStreaming.test.cjs` splits a hostile SVG
at every byte offset, and sanitizes a 132 MB file with payloads at the start,
middle and end in about 3 s with 38 MB of memory.

</details>

and has the following database speed improvements:

**FerretDB** - WeKan's queries answered in the database instead of in Go, on
every database FerretDB supports; measured with the speed test in
[docs/Databases/FerretDB/1/SpeedTest](docs/Databases/FerretDB/1/SpeedTest).

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/ea7951d7">SQLite stores documents as SQLite JSONB, and an existing database is converted once</a>. Thanks to xet7.</summary>

Every filter, sort key, index and multikey trigger parsed a document's JSON text
again. Documents are now kept in SQLite's binary JSONB and turned back into the
same text in Go ([the reader](https://github.com/wekan/FerretDB/commit/6e725c9b)). On 61,507 cards due cards went
from 1,003 to 519 ms, All Boards from 95 to 42 ms, search from 12.6 to 5.2 ms
and creating the 44 indexes from 107 to 70 s; nothing got slower.

**At the first start with this FerretDB, an existing SQLite database is
converted**, table by table, each in one transaction: 204,212 documents took
81 s, and the file grows until SQLite reuses the freed pages. A table whose
conversion fails stays text and keeps working. **After it, an older WeKan or
FerretDB cannot read the database**, so take a backup before upgrading if a
downgrade may be needed.

</details>

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/5be94bb7">PostgreSQL answers $and, $or and $elemMatch, and membership tests through a GIN index</a>. Thanks to xet7.</summary>

[An array's GIN index](https://github.com/wekan/FerretDB/commit/9c06c788) answers `members.userId`, [a top-level
`$and`](https://github.com/wekan/FerretDB/commit/555273c1) no longer reads the whole table, and an `$or` and an
`$elemMatch` are conditions in the database. All Boards count went from 8-9 s to
11 ms for a typical user on twice the production data, and due cards from 2,031
to 815 ms on 61,507 cards.

</details>

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/dbc7d65d">MySQL and MariaDB use their indexes, and adding them takes minutes instead of tens of minutes</a>. Thanks to xet7.</summary>

A card by `_id` went from 3.4 s to 1.8 ms on MySQL, and adding the 44 indexes
from
20 minutes to 3. [Multikey side tables](https://github.com/wekan/FerretDB/commit/a2caced7) answer membership tests,
[an `$or` of `_id` sets is one `UNION ALL`](https://github.com/wekan/FerretDB/commit/c7b0a1c8) - All Boards with a
starred board 900 ms to 6 ms on MySQL and 5.7 s to 7 ms on MariaDB - and
[`$and`, `$or`, `$elemMatch` and a long `$in`](https://github.com/wekan/FerretDB/commit/df43d76d) are answered in the
database: due cards 1,957 to 750 ms on MySQL. MariaDB, whose JSON is text,
keeps what an index answers.

</details>

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/19311038">SQLite sorts in the database</a>. Thanks to xet7.</summary>

A sorted query no longer reads and keeps every match in Go to return a few: the
ten newest of 30,000 users allocate 2.6 MB instead of 264 MB, and the first
batch of an unlimited sort comes 30% sooner ([each key read once](https://github.com/wekan/FerretDB/commit/34b02dbe)).

</details>

and updates the following dependencies:

- **fast-uri 3.1.8 → 3.1.9** and **undici 7.30.0 → 7.30.1** — [the npm
  group](https://github.com/wekan/wekan/pull/6804).
- **actions/setup-python 7.0.0 → 7.1.0** — [in
  bun.yml](https://github.com/wekan/wekan/pull/6803).

Thanks to dependabot.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/31332bfed4">@azure/msal-node 6.0.1 → 7.1.1 by an npm override, for GHSA-xcx6-jx8p-x3h5</a>. Thanks to xet7.</summary>

`npm audit` reported two high severity issues: msal-node below 7.1.0 may
disclose authorization code flow parameters to an attacker-controlled endpoint
([GHSA-xcx6-jx8p-x3h5](https://github.com/advisories/GHSA-xcx6-jx8p-x3h5)). It
comes through the Azure Blob storage adapter's `@azure/identity`, whose newest
release still asks for msal-node 6, so `npm audit fix --force` changed nothing.
`package.json` overrides it; 7's only breaking change is one `@azure/identity`
does not use, and a token request still reaches Microsoft Entra. WeKan's Azure
Blob storage signs in with `DefaultAzureCredential`, not the authorization code
flow. `npm audit` finds 0 vulnerabilities, and `tests/msalNodeAdvisory.test.cjs`
fails if a vulnerable copy is locked again.

</details>

and fixes the following bugs:

**Right-to-left languages** - checkboxes and list resizing work the way they do
left-to-right.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6bb926af19">A checked checkbox sits on its own square, not beside it</a>. Thanks to mimZD and xet7.</summary>

[#6786](https://github.com/wekan/wekan/issues/6786): after its first fix the tick
was a check mark right-to-left, but it was still placed with
`inset-inline-start`/`margin-inline-end`, which a right-to-left page flips: the
narrowed, rotated box started at the square's right edge and was pushed further
right, outside its box. It is placed with `left`/`margin-right` now, like its
borders, so it lands on the square in the same place as left-to-right and the
label does not move; the import page keeps its label gap on the reading side.
`tests/rtlCheckMark.test.cjs` fails on any tick placed logically, and the
Playwright spec measures the tick on its square in both directions.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/80208a7141">Resizing a list follows the pointer instead of moving the other way</a>. Thanks to mimZD and xet7.</summary>

[#6801](https://github.com/wekan/wekan/issues/6801): a list's resize handle is on
its inline end, which is its left edge right-to-left, but the new width was the
start width plus the pointer's movement - so dragging the handle out of the list
narrowed it and dragging it in widened it. The movement is now counted with the
list's own direction, as the board sidebar and the left menus already did.
`tests/rtlListResize.test.cjs` pins it and fails when any width resizer does not
flip right-to-left; a Playwright spec drags the handle out and back in, in both
directions.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/37024aa9f9">The comment form's avatar is inside the card</a>. Thanks to mimZD and xet7.</summary>

[#6805](https://github.com/wekan/wekan/issues/6805): the comment form kept 38px
free for the writer's avatar with a physical left margin, but drew the avatar at
the reading start, so right-to-left it was outside the card. The room is
`margin-inline` now, and the other margins of the comments are logical too.
`tests/commentFormRtl6805.test.cjs` fails on any left- or right-only margin or
padding in `comments.css`.

</details>

**Notifications** - what the server log says when one is not delivered.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bf7520f972">A notification that is not delivered says which check failed</a>. Thanks to xet7.</summary>

"Activity notification delivery incomplete; pending intent retained" filled
the server log, one line for nearly every activity, and never said why: the
error was dropped. That line, and the recovery and cleanup ones, now carry the
failure's code, such as `activity-notification-intent-invalid` or `sync-busy`.
Any other error gives only its name and code, never its message, which can
contain an address or a card title. `tests/notificationFailureReason.test.cjs`
fails when a notification failure line drops its reason again.

</details>

and has the following developer-facing changes:

**Database tests** - the conformance catalogue and the speed test.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e9fa734853">Conformance checks indexed equality, array membership and mixed-type sorting</a>. Thanks to xet7.</summary>

Three cases for what FerretDB now answers from indexes or in the database: an
equality or `$in` on an indexed field (inside an array, a value differing only
by case, special characters, numbers, a long string), membership in an indexed
array of documents in every shape the array can take and after writes, and a
sort over every simple type with ties, null and missing fields, with and
without a limit, then with an array and a document among the values.
[A later commit](https://github.com/wekan/wekan/commit/494cbee598) adds both
inside an `$and`, as the due cards query sends them. SQLite, PostgreSQL, MySQL
and MariaDB answer all 114 cases as MongoDB 8 does.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/18878f6f29">Conformance checks the $or, $elemMatch and long $in shapes FerretDB now answers in the database</a>. Thanks to xet7.</summary>

The visible boards and the due cards of the `dueCards` publication - an `$or`
of the open permissions and a membership `$elemMatch`, and an `$or` of array
fields inside an `$and` - and an `$in` longer than the 32 values FerretDB's
MySQL backend compares with JSON functions, with negatives that must stay in Go.
SQLite, PostgreSQL, MySQL and MariaDB answer all 115 cases as MongoDB 8.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9d2b64273b">db-conformance.sh no longer removes the containers of a run that is still going</a>. Thanks to xet7.</summary>

At start it removed every `wekan-conformance-db-*` container and network as
left behind by an interrupted run, including those of a run still in
progress: a speed test beside a conformance run lost its MySQL in the middle of
Due Cards ("connection refused") and its MariaDB while loading. Containers and
networks now carry the process id of their run as a label, and one whose run is
alive is kept; one without the label, of a run that ended, or whose process id
now belongs to something else is removed as before.
`tests/dbConformanceStaleContainers.test.cjs` runs the script's own functions
against a fake docker.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e81d17da80">New speed test results for SQLite, PostgreSQL, MySQL and MariaDB</a>. Thanks to xet7.</summary>

The four FerretDB v1 backends again, at twice the production data, after the
MySQL/MariaDB index reads, their multikey side tables, PostgreSQL's GIN
membership index and SQLite sorting in the database; every database returned
the same data as MongoDB. All Boards count went from 8-9 s to 159 ms on
PostgreSQL and from 9.4 s to 1.1 s on MySQL, and adding the 44 indexes takes
172 s on MySQL and 901 s on MariaDB instead of 20 and 40 minutes. The fixes for
the People page on SQLite, All Boards with a starred board on MySQL/MariaDB and
Due Cards' `$and` came after this run.

</details>

**Tests** - guards that had fallen behind a deliberate change.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/132fecbfd8">The import page guard pins the checked tick's physical margins from the first right-to-left fix</a>. Thanks to mimZD and xet7.</summary>

`tests/importPage.test.cjs` still required the checked box's label gap to be
`margin-inline-end`, which the [#6786](https://github.com/wekan/wekan/issues/6786)
fix changed on purpose. It now pins `margin-right` with the right-to-left rule
that moves the gap to the left, and the unchecked box's logical gap.

</details>

and updates the following translations:

**Languages updated:** Romanian, Standard Moroccan Tamazight, Tigre, Urdu.

**Wrong languages** - each locale in the language its tag names.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d3dead539b">Romanian, Tamazight and Urdu in their own languages</a>. Thanks to xet7.</summary>

About 160 Romanian values were Italian, with some Spanish and French; about
330 Tamazight values were Arabic, or Kabyle and French in Latin letters, now
in Tifinagh; and most of the Urdu file was English spelled letter by letter in
Urdu script ("منتقل کو توپ" - توپ is a cannon - for Move to Top), now natural
Urdu. Search keywords in these locales are one word, as the query parser reads
them. `tests/wrongLanguageCorrections20261025.test.cjs` pins the languages,
the placeholders and the keywords.

</details>

**Other** - one more translation fix.

- [Tigre: the import size message uses the attested plural for files](https://github.com/wekan/wekan/commit/52bcd74efa).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.64 2026-10-24 WeKan ® release

**In short:** a **database speed test** times the common WeKan queries on every
database WeKan runs on, with twice a production WeKan of data, and checks they
all answer the same; its findings made **FerretDB** several times faster and
stopped MariaDB losing edits. Every platform runs the prebuilt
**ferretdb-sqlite**
FerretDB, the **Sandstorm .spk** carries only what a grain runs, and every build
loads **collection2** before the models.

This release adds the following new features:

**Sandstorm** - a smaller .spk, built from what a grain actually uses.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e413cd4720">The .spk leaves out every login method but Sandstorm's, and FerretDB's other database handlers</a>. Thanks to xet7.</summary>

A grain has one login (Sandstorm's), one database (FerretDB on SQLite) and one
mailbox (the grain's own address), but the .spk carried every login package
WeKan has and a FerretDB with the PostgreSQL, MySQL and SAP HANA handlers.
`releases/sandstorm-slim-spk.sh`, now used by `sandstorm.yml` and
`release-all.yml`, builds with a package profile
(`releases/sandstorm-slim.mjs`) that drops accounts-password, 2FA,
passwordless, lockout, OAuth2/OIDC, CAS, LDAP, SAML and the seven social logins
for that one build. It always trims the bundle for a linux/x64 sockjs grain,
verifies none of those packages got in and packs with `spk pack`.
`sandstorm-src/build-deps.sh` builds FerretDB from source with
`ferretdb_no_postgresql,ferretdb_no_mysql`. Under Sandstorm the Admin Panel
hides the login panes, Database migration, the IMAP/webhook mail settings and
the password fields, and the REST password login answers `sandstorm-sso-only`.
Against wekan-12.63-sandstorm.spk the file is 3.8 MiB (2.1 %) smaller and
unpacks 26.7 MiB smaller. Docker, Snap and the bundles are unchanged. (The
FerretDB source build was replaced by the prebuilt SQLite-only binary, see
FerretDB below.)
`tests/sandstormSlim.test.cjs` and
`tests/playwright/specs/sandstorm-slim.e2e.js` pin it. Design:
[Smaller-wekan-spk.md](docs/Platforms/FOSS/Container/Sandstorm/Smaller-wekan-spk.md).

</details>

**FerretDB** - every platform takes the smaller SQLite-only build, prebuilt.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/89da0e5be7">Every platform runs the prebuilt SQLite-only ferretdb-sqlite binary from wekan/FerretDB</a>. Thanks to xet7.</summary>

wekan/FerretDB now releases `ferretdb-sqlite-<arch>` beside `ferretdb-<arch>`:
the same FerretDB with only the SQLite handler, about 5 MB smaller, and also
as the `ferretdb-sqlite` image. `releases/ferretdb-asset.sh` chooses for every
download: the newest release that has `ferretdb-sqlite-<arch>`, and until one
does, the full `ferretdb-<arch>` of the newest release, which has the SQLite
handler too. The log says which one was taken. It verifies the download
against its `.sha256sum` and gives the tag, URL and checksum to the provenance
table. All bundle jobs of `release-all.yml`, `release-all-missing.yml`,
`bsd.yml`, the preflight and the local release bundle use it, so the Docker
images, snap, AppImage, Flatpak, macOS and Windows packages get it too. No
workflow builds FerretDB: the Sandstorm deps download the same binary. The
default `docker-compose.yml` downloads `ferretdb-sqlite-<arch>`
(`FERRETDB_BINARY`); the PostgreSQL, MySQL, MariaDB and SAP HANA compose files
keep the full binary. `tests/ferretdbSqliteAsset.test.cjs` pins it. See
[FerretDB v1](docs/Databases/FerretDB/1/README.md).

</details>

**Databases** - how fast each database answers WeKan, and whether the same.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/70485c38df">A database speed test: the common WeKan queries on every database, twice a production WeKan of data</a>. Thanks to xet7.</summary>

`docs/Databases/FerretDB/1/SpeedTest/speedtest.sh` (build.sh / build.bat ->
Tests -> Database speed test) loads 30,116 users, 92,306 boards, 221,038 lists,
222,546 swimlanes and 615,070 cards - twice a production WeKan, skewed like a
real one - with WeKan's own indexes into SQLite, PostgreSQL, MySQL and MariaDB
through FerretDB v1, MongoDB 6, 7, 8 and 9 and FerretDB 2, one at a time, and
times 18 queries as WeKan builds them. `Results.md` ranks the databases fastest
first, and the run fails when any answer or stored write differs from MongoDB's.
MongoDB 9 was fastest; FerretDB + SQLite, after the FerretDB fixes it led to
(below), came next. The README says what was found, what was improved and what
could still be: sorting in the database, multikey indexes beyond SQLite,
MySQL/MariaDB reads through their index columns, SQLite's JSONB.

</details>

and fixes the following bugs:

**Due Cards** - what the page reads to find them.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c64b3a3b1d">The page reads only the ids and members of the boards it may show</a>. Thanks to xet7.</summary>

The publication fetched every board the user may see - every public board of
the instance among them, whole - to read two fields, and wrapped its board list
in an `$or` that neither MongoDB nor FerretDB could use an index for. It asks
for
`_id` and `members` only, and with no assigned-only board uses a plain `boardId`
list; an assigned-only board still shows only the user's assigned cards. With
FerretDB's fixes, Due Cards on FerretDB + SQLite went from 34 s to 12.8 s on the
speed test. `tests/dbSpeedTest.test.cjs` checks both board scopes.

</details>

**FerretDB 2** - the compose file that runs WeKan on it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f9e1e90131">Its compose file starts with the current DocumentDB image</a>. Thanks to xet7.</summary>

`ghcr.io/ferretdb/postgres-documentdb:17` installs `pg_cron`, which may only be
created in the database named `postgres`; with `POSTGRES_DB: ferretdb` the
DocumentDB extension failed to install and the database never started.
`docker-compose-ferretdb-v2-postgresql.yml` uses `postgres` now - found when the
speed test started FerretDB 2 from that file's images.

</details>

**Collections** - which attachSchema the models get.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2699f4deea">Collection2 is loaded before the models, so every write is cleaned and given its defaults</a>. Thanks to xet7.</summary>

Collection2's attachSchema is in its lazy main module, which only
aldeed:schema-index loads, with an async `Collection2.load()`. The models
attached their schemas with whichever attachSchema existed first: collection2's,
or the bare shim in `imports/collectionHelpers.js`, which never cleans a write.
The full build happened to load collection2 first. The smaller Sandstorm build
reached the models sooner, so a new board's swimlane was stored without
`archived`, `sort` and `type`, and the board opened empty. `server/main.js` now
loads `meteor/aldeed:collection2/main` before the models in every build.
Without accounts-password the server also no longer stops on
`Accounts.emailTemplates` (`server/lib/accountsEmailTemplates.js`) or on
useraccounts' "at least one account service". `tests/sandstormSlim.test.cjs`
and the board, list and card test in `sandstorm-slim.e2e.js` pin it.

</details>

and has the following developer-tooling fix:

- [The Sandstorm package-import guard escapes the whole package name in its pattern](https://github.com/wekan/wekan/commit/f1e447dd36). Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.63 2026-10-22 WeKan ® release

**In short:** copying a card, linking it to another board or making one from a
**card template** no longer fails when the card carries values of another
board's **custom fields**, and no longer records AdminFieldBleed against the
user who tried.

This release fixes the following bugs:

**Custom fields** - which values a card brings to the board it is copied or
linked to.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/63ebdb9072">Copying or linking a card carries only the custom field values of its new board</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6800](https://github.com/wekan/wekan/issues/6800): a card made from a card
template, linked from another board or copied - and each subtask copied with it
- took its whole customFields array along: values of another board's fields,
of deleted fields, and entries with no field id. The admin-only field guard
could not match those to a field of the new board, refused the whole card and
recorded AdminFieldBleed against the user. Copy, subtask copy and link now keep
only values of fields defined on the destination board; an admin-only value of
that board is kept, so the guard still decides it.
`tests/copyForeignCustomFields.test.cjs` fails on the code before the fix.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.62 2026-10-22 WeKan ® release

**In short:** an opened card is **decluttered** - add buttons on their title's
line, a compact attachment list with its upload rules in the upload popup, and
two new **Show on Card** rows for attachment previews and details - and
**Board Settings / Card** spreads into columns to fit the screen, with rows
dragged by handle, icon or label. List moves no longer raise false
**HistoryIntegrity** reports, refused edits no longer **disable accounts**, and
a
restarting database is no longer a **crash**.

This release adds the following new features:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2c520ef382">A decluttered opened card, a compact attachment list, and Card Settings that fits the screen</a>. Thanks to mueschel and xet7.</summary>

[#6796](https://github.com/wekan/wekan/issues/6796): an opened card gave most
of its height to controls with nothing in them. A field's add button now sits
on its title's line; Requested and Assigned By put their two buttons side by
side; the checklist controls share a line. Attachments: the upload rules are in
the upload popup instead of above every list, "+" is a small button, a file
with nothing to preview gets a small file button, and the name has a line of
its own. Two new Board Settings / Card / Show on Card rows, **Attachments:
Preview** and **Attachments: Details**, are on by default.

Board Settings / Card is a centred panel as wide (up to 1800px) and tall as
the window, and each list spreads into as many columns as fit, read top to
bottom: on 1920x1080 nothing scrolls. Its rows are dragged by the handle, the
icon or the label with drag handles on, and by the icon or the label with them
off; before, only the handle dragged, and only vertically. A Node test and a
Playwright spec cover the layout, the new rows and every drag case.

</details>

and fixes the following bugs:

**History** - the checksum every change history row carries.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/76f9d41bf4">A list move with no swimlane no longer fails its own history checksum</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6797](https://github.com/wekan/wekan/issues/6797): Admin Panel / Problems /
Security showed HistoryIntegrity (critical) 81,833 times. A list bound to no
one swimlane has `swimlaneId: ''`; the legacy history append hashed the row
with '' and stored it through collection2's default clean, which turned it into
null, so every such move failed its own checksum. It now inserts as the
stored-chain path does, and rows already stored that way verify - null for ''
only in the id and label fields, so any real change still fails.
`tests/historyEmptyStringChecksum.test.cjs` fails on the code before the fix.

</details>


**Admin Panel / Problems** - which events disable an account or are reported as
a crash.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/425b4ddea7">An ordinary refused edit on one's own board no longer disables the account</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6798](https://github.com/wekan/wekan/issues/6798): four accounts on one
instance were disabled in three days. A Worker's allowed card move or checklist
tick was first refused by the general card check, which recorded
LinkedWriteBleed (high, blocked) and disabled the Worker; a read-only or
comment-only member whose screen still offered an edit was disabled the same
way. The Worker rules now ask without recording first and record only a change
still refused, and `authz.linked-write` is still recorded but no longer
disables an account. `tests/workerNoSelfBlock.test.cjs` runs both rules from
their source.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f37204b1c3">A MongoDB pod restarting is a lost connection, not a critical crash</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6799](https://github.com/wekan/wekan/issues/6799): while a MongoDB pod
restarted in Kubernetes, its name did not resolve and nine critical CrashBleed
events were recorded although WeKan kept running. `getaddrinfo ENOTFOUND` and
`EAI_AGAIN` for the database's own host (from MONGO_URL and MONGO_OPLOG_URL) are
now a lost connection, transient at startup and at run time - another host
that does not resolve is still not a database problem - and the crash recorder
skips what is transient. `tests/databaseDnsRestart.test.cjs` runs the guards
and the recorder's own listeners.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.61 2026-10-22 WeKan ® release

**In short:** WeKan's npm dependencies move to their newest versions, among
them **Blockly 13.4**, whose new toolbox search is translated into every
language, and **imapflow**, **mailparser**, **pdfjs-dist** and
**isomorphic-git**, which now have tests that run them the way WeKan does. The
**core26 snap** gets the Caddy part the main snap already had, a language saved
as **ca@valencia** shows Valencian, and **Admin Panel / Problems** stops
re-reporting list indexes and calling a lost connection a schema bug.

This release updates the following dependencies:

- [The small npm updates](https://github.com/wekan/wekan/commit/8a00898252):
  `@aws-sdk/*` 3.1155.0, `@fastify/busboy` 3.2.4, `@tweedegolf/sab-adapter-*`,
  `blockly` 13.4.0, `dompurify` 3.4.17, `file-type` 22.2.0, `filesize`
  11.0.28, `i18next` 26.5.4, `meteor-node-stubs` 1.2.32, `wasmagic` 1.0.12,
  and for development `@rspack/core` 2.2.9, `@typescript-eslint/*` 8.72.0 and
  `puppeteer` 25.15.0. Thanks to xet7.
- [imapflow 2.8.0, mailparser 3.12.2, pdfjs-dist 6.4.299, isomorphic-git
  1.44.3 and pretty-ms 10](https://github.com/wekan/wekan/commit/189adaee52),
  each with a test that runs it as WeKan does: the IMAP poller against
  WeKan's fake IMAP server, attachment text search on a PDF, and the GitHub
  wiki import's history reading. Thanks to xet7.
- [vmactions/openbsd-vm 1.4.9 and actions/setup-node v7.1.0](https://github.com/wekan/wekan/commit/92001bcfd9);
  the BSD bundles are still built on OpenBSD 7.8. Thanks to xet7.

and fixes the following bugs:

**Admin Panel / Problems** - what a database message is reported as, and how
often.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/058a2dcbce">List sort indexes are made from key objects, so they are no longer re-created at every start</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6794](https://github.com/wekan/wekan/issues/6794): "Created the missing index
"-modifiedAt" on lists" came back at every start, from every pod. The list
sort options were passed to `ensureIndex` as strings, so lists got indexes on
fields literally named "-modifiedAt", "-title" and "-sort", and the "is it
there already?" check compared a string with an index key object, which never
matched. Startup now ensures one index per sort field and drops the three
stray ones; `ensureIndex` turns a string key into the key it means.
`tests/listSortIndexes.test.cjs` uses the reporter's real index list, runs
`ensureIndex` itself against a fake collection, and fails on any call in the
tree whose key is not an index key object.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a9e680d4b2">A lost database connection inside a validation error is a connection problem, not a schema bug</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6795](https://github.com/wekan/wekan/issues/6795): while MongoDB restarted,
"ValidationError: Failed validation Socket 'connect' timed out" was reported as
an empty required field and a WeKan bug, and treated as fatal at startup.
collection2 wraps whatever failed during validation, so the schema rule now
yields to a lost connection, timeout, lock or too many connections in the same
message, and the MongoDB driver's own network, server-selection, pool and
not-primary errors are connection problems. The test runs both startup guards'
own decision on the reported error and on every wrapped transient cause.

</details>

**Snap** - the Caddy reverse proxy part of the core26 snap.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2ad5999bc7">The core26 snap gets the fixed Caddy part, and both snaps fall back to Caddy 2.11.7</a>. Thanks to xet7.</summary>

`snapcraft-core26.yaml` still had the Caddy part `snapcraft.yaml` had before
v10.71: the version from `api.github.com`, whose 403 to a busy CI runner ended
the part under pipefail before its 2.8.4 fallback ran; a plain curl with no
retry; and a default Caddyfile that proxied to port 3000, where WeKan does not
listen when Caddy is on. Both snaps build from `snap-src`, so core26 now has
the main snap's part, and both pin 2.11.7 as the fallback.
`tests/releaseSnapArches.test.cjs` read `snapcraft.yaml` only, which is how
the copy was missed; it now checks every `snapcraft*.yaml` and the
Caddyfile's port.

</details>

**Languages** - which language a saved setting selects.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6a37160bc8">A language saved as ca@valencia shows Valencian, not English</a>. Thanks to xet7.</summary>

The Valencian file is `ca@valencia.i18n.json` but its registry tag is
`ca-valencia`, and the resolver treated only `_` as `-`, so a profile saved
as the file's name stayed in English. Both resolvers now compare through one
`normalizeLanguageTag`, and `tests/browserLanguageFallback.test.cjs` requires
every locale file name to resolve to a registry language.

</details>

and has the following translation updates:

**Blockly toolbox search** - the five texts Blockly 13.4 adds, in every
language.

**Languages updated:** 230 languages.

- [Toolbox search, in every locale](https://github.com/wekan/wekan/commit/8a00898252),
  written from each file's own words for "block" and "search", with `%1`
  kept. Corrected while there: Polish "Szukaj blokad" (search for
  blockades) from Blockly's catalog, a stray "(1)" in Arabic, English mixed
  into Odia's "no results", and Telugu's literal `null` that the importer
  had replaced. The commit lists the languages translated with low
  confidence, for a speaker to correct. Thanks to translators and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.60 2026-10-22 WeKan ® release

**In short:** **sanitize-html 2.18.1** fixes a stack overflow that nested
`<iframe>` tags caused in WeKan's import and export sanitizer, and a failed
import or export no longer **disables the account** of whoever ran it unless it
was an attempt. The forked Meteor **dynamic-import** and **meteor shell** keys
come from the crypto RNG.

This release fixes the following CRITICAL SECURITY ISSUES:

**Imports and exports** - what nested `<iframe>` did to the sanitizer, and who
a failure is blamed on.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/96ed9ad202">sanitize-html 2.18.1: nested iframes no longer crash imports and exports, or lock out who ran them</a>. Thanks to xet7.</summary>

sanitize-html 2.18.0 re-sanitized the fallback of a discarded `<iframe>` with
no recursion limit
([GHSA-c9rx-x947-fp3h](https://github.com/advisories/GHSA-c9rx-x947-fp3h),
CWE-674). WeKan's server sanitizer (`server/lib/inputSanitizer.js`) discards
every tag, so it took that path: a few kilobytes of nested `<iframe>` threw
`RangeError: Maximum call stack size exceeded` in `secureTransfer`, which
sanitizes every import and export. `secureTransfer` records a throw as a high
"blocked" event naming the user, and that disables the account, so a card
planted with the payload locked out the next member who exported the board.
2.18.1 bounds the recursion and keeps `nestingLimit` across it; it also drops
the `deepmerge` dependency.

[The tests](https://github.com/wekan/wekan/commit/d89bcab8e0):
`tests/sanitizeHtmlNestedIframe.test.cjs` runs WeKan's own `sanitizeInput`
options on three nested-iframe payloads and checks the installed and locked
versions; with 2.18.0 it fails with the same `RangeError`. Its negative test
fails if anything else imports sanitize-html. The Playwright spec exports and
imports a board holding the payload and checks that nobody is locked out.
Nothing is refused, so there is no Admin Panel → Problems key.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/567f99227b">A failed import or export disables an account only when it was an attempt</a>. Thanks to xet7.</summary>

`secureTransfer` recorded every throw as a high "blocked" event naming the
user, and that disables the account - so sanitize-html 2.18.0's crash, or any
other library fault, locked out whoever happened to run the import or export.
The transfer boundary now marks its own refusals (a cycle, a non-plain object,
a size limit), and only those are recorded as blocked: high, and medium for a
size limit, as before. Anything else shows in Admin Panel → Problems as
ImportExportFailure: detected, still naming whose import or export it was, and
never blocking an account.

`tests/transferFailure.test.cjs` drives real boundary refusals and a sanitizer
that throws through the account-blocking decision itself, and fails with the
old `secureTransfer`. It also fails if the boundary throws a plain `Error` or
anything other than `secureTransfer` calls it.

</details>

and fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6efd39a70e">The dynamic-import and meteor shell keys come from the crypto RNG</a>. Thanks to GitHub CodeQL and xet7.</summary>

Alert 591 (js/insecure-randomness, CWE-338), in WeKan's fork of Meteor's
`dynamic-import`: the key that lets a request read the SERVER's dynamic modules
(`?key=` on `/__meteor__/dynamic-import/fetch`) came from `Math.random()`,
whose state can be recovered from earlier outputs, and was compared with
`===`. `meteor shell`'s connection key, which runs code in the server process,
was made and compared the same way. Meteor 3.5.3 and 3.6-rc.0 both have this.

Both now come from `crypto.randomBytes` (160 and 128 bits) and are compared
with `crypto.timingSafeEqual`. `tests/meteorForkRandomKeys.test.cjs` runs both,
and fails on any `Math.random()` in the forks and on a key, secret, token,
nonce, salt, password or code made from `Math.random()` anywhere in the tree. A
wrong key is not recorded in Admin Panel → Problems: another WeKan instance
behind the same load balancer legitimately sends its own.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.59 2026-10-22 WeKan ® release

**In short:** WeKan carries **Meteor 3.5.3's six security fixes** - DDP,
allow/deny, dynamic import, Google and Facebook login, and meteor shell - on
Meteor 3.6-rc.0, which does not have them yet. **Release recovery** no longer
stops on a passing GitHub API error, and **Cancel workflow** is kept able to
stop every release workflow.

This release fixes the following CRITICAL SECURITY ISSUES:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e0189bc53b">Meteor 3.5.3's six security fixes on Meteor 3.6-rc.0</a>. Thanks to Meteor developers, Vext Labs and xet7.</summary>

Meteor published the same six fixes as 3.3.3, 3.4.2 and 3.5.3
([announcement](https://forums.meteor.com/t/meteor-security-releases-3-3-3-3-4-2-and-3-5-3/64836)).
3.6-rc.0, which WeKan runs, does not have them: its tag is behind 3.5.3 by
exactly the 15 security commits. Going back to 3.5.3 would also mean Node.js
24 and Rspack 1, so WeKan carries 3.6-rc.0's `allow-deny`, `ddp-server`,
`dynamic-import`, `facebook-oauth`, `google-oauth` and `shell-server` in
`packages/` with Meteor's 3.5.3 patch applied unchanged:

- DDP: a message named `__proto__`, `toString` or not a string, and an async
  handler that rejected, crashed the server.
- allow/deny: a top-level `__proto__` in an update was missing from the field
  list the validators saw.
- dynamic `import()`: requests are bounded in size (413) and complexity (400).
- Google and Facebook direct-token login: a token issued to another
  application was accepted. Identity now comes from the provider, and a
  Facebook verification error no longer carries the app secret.
- `meteor shell`: its history and compile cache are private.
- Deploy discovery is in `meteor-tool`, which an app cannot replace. WeKan is
  never deployed with `meteor deploy`, and a test keeps it so.

Refused attempts show in Admin Panel → Problems as Meteor DDP, Meteor
allow-deny, Meteor dynamic-import and Meteor OAuth, and none disables an
account. `tests/meteor353SecurityFixes.test.cjs` runs each fix's own code and
searches the tree for the shape of each fault; every check fails on the unfixed
packages, and the suite fails when `.meteor/release` moves on, because a fork
would silently keep 3.6-rc.0's code. The Playwright spec sends each attack to
a running WeKan built with the forks. See
[Meteor 3.5.3 security fixes](docs/Security/Meteor-3.5.3-Security-Fixes-2026-10-22.md).

</details>

and has the following release-tooling fixes:

**Release workflows** - how a release run recovers from GitHub errors, and how
it stops when cancelled.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e304e1948a">Release recovery waits out GitHub API errors instead of dying on one</a>. Thanks to xet7.</summary>

The Recover job of Release All missing died on one HTTP 502 from the GitHub
API while `gh run watch --exit-status` listed the rerun's jobs, so its plan
and every build after it were skipped. `releases/retry-failed-release.py` now
polls `gh run view`, retries up to ten API errors in a row, waits for the new
attempt instead of reading the old attempt's failure, and stops only on the
rerun's own conclusion. `tests/retryFailedRelease.test.py` pins the 502, a
failed rerun, a lasting outage and the stale attempt, and that `gh run watch`
is gone.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/94e1749977">Every workflow's jobs that run after a cancel end on their own</a>. Thanks to xet7.</summary>

Cancel workflow does not cancel a job whose `if:` is still true, and
`always()` is true in a cancelled run. `tests/releaseCancelSafeJobs.test.cjs`
checked only `release-all.yml`; it now fails on a job on `always()` in any
workflow that is a reusable-workflow call or has no timeout of 60 minutes or
less. Every such job today is a short report and is bounded. node-patches had
eleven five-hour resume stages called this way, and Cancel workflow did not
stop them.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.58 2026-10-21 WeKan ® release

**In short:** an existing board can be **saved as a board template**, large
**Jira** exports import instead of failing, and **comments** stay with a card
moved to another board. A **GitHub CodeQL** alert in a test is fixed.

This release fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e18794fa46">The invite-by-email test escapes the address completely, and a partial escape is found anywhere</a>. Thanks to GitHub CodeQL and xet7.</summary>

Alert 590: the #6788 e2e put the stored address into a `$regex` with only `.`
escaped, so a backslash in the address could cancel the escape. It now uses
escape-string-regexp, the module the server matches addresses with.
`tests/incompleteEscaping.test.cjs` knew only single-character patterns; it now
also reports a character class without a backslash replaced by a backslash
escape, and found this line before it was fixed. It is a test, so nothing is
recorded in Admin Panel → Problems.

</details>

and adds the following new feature:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/14a43da557">Board menu / Save as Template turns an existing board into a board template</a>. Thanks to xet7.</summary>

Asked on IRC ([#6792](https://github.com/wekan/wekan/issues/6792)): a board
template could only be built inside the Templates board. Save as Template
copies the board - swimlanes, lists, cards, labels and custom fields - as a
template board, private with the creator as its one member, and adds the linked
card in the user's Templates / Board Templates swimlane that makes it a
template; the copy opens. Board admins only, as Copy Board, and not offered on
a board that already is a template. The entry reuses the card's own "Save as
Template" words. `tests/largeImportAndBoardTemplate.test.cjs` pins the guards
and the linked card, and a Playwright spec saves a board from the menu and
checks a non-admin and a template board are refused.

</details>

and fixes the following bugs:

**Import** - a large file imports instead of failing halfway or with an
internal error.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/14a43da557">A Jira export of hundreds of issues imports, and a file too large says so</a>. Thanks to xet7.</summary>

From IRC ([#6792](https://github.com/wekan/wekan/issues/6792)): a Jira import of
25 issues worked and one of 858 failed. The import boundary refused documents
over 250,000 values, and a Jira search export carries some 250 per issue even
without comments, so it stopped at under 1,000 issues. The refusal was a plain
Error, "Internal server error" on the import page. The cap is now four million
values, a file over it is refused as "The file is too large to import at
once", and the import deadline is `WEKAN_IMPORT_TIMEOUT_MS` plus half a second
per record, on the server and in the page's watchdog alike. The test imports
the 858-issue shape that the old cap refused.

</details>

**Moving cards** - what belongs to a card goes with it to another board.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/696b5b073f">Comments stay with a card moved to another board, and do not reappear only when it moves back</a>. Thanks to fabiosalles and xet7.</summary>

The board publication finds a board's comments, comment reactions, text notes,
checklists, checklist items and attachments by the board id each row carries
(#6480), but a card that changed board re-homed only its checklists and items.
Its comments were still published to the board it left. Attachments followed
only when the move ran on the server, never for a drag in the browser, and the
REST card move skipped the hooks entirely. Now one list,
`models/lib/cardChildrenBoard.js`, names every such collection, and one helper
re-homes them from the move hook, the REST move and the durable rule move. The
startup schema upgrade step `card-children-boardid` moves rows that a move
already left behind to their card's board.
`tests/cardChildrenFollowMove.test.cjs` pins the list and fails on any move
path that skips the helper, and a Playwright spec moves a commented card with
the Move Card popup and by REST.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.57 2026-10-20 WeKan ® release

**In short:** attachments can be **deleted after a set time** and deleted ones
**purged**, every **backup** is recorded with failures and overdue runs shown,
and the newest features' settings are on **every platform** and in the **Admin
Panel**. Adding a board member by email works whatever the letter case, and the
**Security report** stops crying wolf.

This release adds the following new features:

**Attachments and backups** - how long files and backups are kept, and whether
the backups worked.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dcf91e4471">Attachment retention: delete card attachments after N days, purge deleted ones after M days</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6789](https://github.com/wekan/wekan/issues/6789): off unless configured, a
nightly job deletes card attachments older than `ATTACHMENTS_RETENTION_DAYS`
through the card's own restorable Delete, optionally only on inactive cards.
`ATTACHMENTS_PURGE_DELETED_AFTER_DAYS` then removes them for good, file
included, from every storage backend. There are also dry-run and per-night
cap settings. All five are in **Admin Panel / Attachments / Retention** and on
every platform. `tests/attachmentRetention.test.cjs` and a UI spec cover it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/06b7ce994a">Backup status: every run recorded, failures and overdue backups shown, old backups pruned</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6790](https://github.com/wekan/wekan/issues/6790): a backup's result lived only
in the memory of the server that ran it, so after a restart, or on another pod,
nobody could tell whether last night's backup worked. Every run is now recorded
for 400 days. Admin Panel / Problems / Backup shows the last success, the last
failure, the next run and the history. Problems / Summary and `/metrics` report
failed and overdue backups. `BACKUP_KEEP_DAYS`, also in Admin Panel /
Attachments / Backup, prunes old local backups and always keeps the newest.
`tests/backupRuns.test.cjs` covers it.

</details>

**Admin Panel settings** - the newest features' environment variables.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/718fdb5dac">The newest features' settings are on every release platform and in the Admin Panel</a>. Thanks to xet7.</summary>

An audit found 30 variables new since v12.00. The Email to card limits, the
login-cookie limit and Windows SSO are now Admin Panel settings. Those and the
per-process switches are listed in the Dockerfile, docker-compose, start-wekan
and the snap; none had been. `tests/envVarCoverage.test.cjs` now fails for any
variable read that is neither an Admin Panel setting nor environment-only with
a stated reason.

</details>

and fixes the following bugs:

**Board members** - adding a colleague to a board.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/193fb449bd">Adding a board member by email works in any letter case, and search finds colleagues past five matches</a>. Thanks to Raymond-Voogt and xet7.</summary>

[#6788](https://github.com/wekan/wekan/issues/6788): LDAP and OIDC store an
address as the directory spells it, and the invite matched it exactly, so
"jan.jansen@example.com" found nobody and WeKan tried to create a new account.
The match is now case-insensitive, anchored and escaped. The member search read
five users before filtering out disabled accounts and other organizations, so a
colleague could be hidden; it filters first now. A test of the source and a
UI spec cover both (`tests/inviteMemberEmailCase.test.cjs`).

</details>

**Admin Panel / Problems / Security** - reports that named an attack or a
tampering where there was none, and labels it showed in English.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4f3ec0afa3">History rows are hashed as stored, so an unset value is not tampering</a>. Thanks to xet7.</summary>

HistoryIntegrity reported "checksum-mismatch", critical, 89472 times, on a row
nobody had touched. Meteor stores rows with `ignoreUndefined`, so a content
value like `deletedAt: list.deletedAt` (unset) is dropped when stored, and the
row's hash, which still covered it, failed every audit. Rows are now hashed as
stored. Rows written before this verify by re-adding exactly the keys the
other side of the change has. A changed or removed real value still fails.
`tests/changeHistoryIntegrity.test.cjs` stores rows through BSON as the
driver does.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c7c541ccc5">FileNameBleed: a percent-encoded name is not an exploit, and opening a file is not an upload</a>. Thanks to xet7.</summary>

Opening a board of 2019 photos with Cyrillic names tripped "uploaded a
filename carrying an exploit pattern; URL-encoded name". Percent-encoding is
how browsers and older WeKan store any non-ASCII name. It is no longer a
dangerous reason. Path traversal and null bytes are now named from the
decoded name, so an encoded `../` still trips the path-traversal canary. A
name repaired while a file is read never trips the upload canary.
`tests/filenameCanaryReasons.test.cjs` covers both directions.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/52f127c0a5">A clean file-integrity scan is no longer a StorageBleed event</a>. Thanks to xet7.</summary>

The background scan reported its own summary ("0 changed, 0 with no record
saying why") on every run, 41 times. The summary is recorded only beside the
changed or missing files it sums up; a clean run goes to the server log.
`tests/fileIntegrity.test.cjs` pins it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8a23306c2e">Locations from Cloudflare keep their letters: Dinkelsbühl, not DinkelsbÃ¼hl</a>. Thanks to xet7.</summary>

Cloudflare sends the city as UTF-8 bytes and Node reads header values as
Latin-1. A value that is valid UTF-8 as bytes is now read as UTF-8; genuine
Latin-1 and percent-encoded names are unchanged. `tests/geoHeadersUtf8.test.cjs`
includes a real HTTP request.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3d703965c4">IPv6 location and Instrumentation are translated</a>. Thanks to xet7.</summary>

The IPv6 location column is the translated "location" plus " (IPv6)", and the
Instrumentation report has a title key, translated into every language
(French: "Instrumentation logicielle"). Several translations are
low-confidence and listed in the commit.

</details>

**Release builds** - jobs that v12.56 lost to infrastructure rather than to
WeKan.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/294a9016d3">Bun bundles wait for their smoke-test MongoDB, and replace a lost one</a>. Thanks to xet7.</summary>

v12.56's Bun linux-x64 bundle stopped with "Topology is closed": nothing
listened on the smoke-test database's port. The container had been started
with `--rm` and never checked, so its log was gone too. `bun.yml` now waits
until it answers a ping, and prints its log if it does not. `build-target.sh`
checks again before starting WeKan, with the new `releases/bun/wait-mongo.mjs`;
a lost database is shown and replaced once. `tests/bunSmokeMongo.test.cjs`
covers it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/727e96e527">Launchpad snaps retry an outage there for longer, not three strikes</a>. Thanks to xet7.</summary>

v12.56's ppc64el snap gave up after 20 minutes of a five-hour budget. The
builder lost TLS while cloning our source, and the next two attempts, a minute
apart, met Launchpad's HTTP 503. An attempt that fails on Launchpad
infrastructure now earns another, up to six, after a growing pause. Other
failures keep three attempts. `tests/snapLaunchpadInfraRetry.test.cjs` runs
the workflow's own check against logs shaped like v12.56's, and against the
negatives. Its git-error pattern says `RPC failed;` rather than naming curl
([follow-up](https://github.com/wekan/wekan/commit/363cd22916)), as the
downloads guard requires.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.56 2026-10-20 WeKan ® release

**In short:** accounts nobody uses can be **disabled after a set number of
days**, from the Admin Panel or the environment, and **LDAP background sync**
disables what the directory disabled. Admin Panel / People shows everyone's
**Last active**, check marks are check marks in **right-to-left** languages,
and **restored list swimlanes** survive the next upgrade.

This release adds the following new features:

**People** - who uses WeKan, and what happens to accounts nobody does.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b933a69cd4">Inactive accounts can be disabled; LDAP sync honours its search filter; everyone's Last active is shown</a>. Thanks to Raymond-Voogt and xet7.</summary>

- [#6783](https://github.com/wekan/wekan/issues/6783): Admin Panel / People
  showed "Last active" as "-" for every user but the administrator, because
  the `people` publication did not carry `lastConnectionDate`. The table's own
  row projection left it out too, which the UI test found
  ([the table's half](https://github.com/wekan/wekan/commit/c4376f92a5)).
- [#6784](https://github.com/wekan/wekan/issues/6784):
  `USERS_DISABLE_INACTIVE_AFTER_DAYS` disables, once a night, accounts unused
  for that many days, and revokes their logins.
  - Admins are never disabled.
  - An account with no recorded activity starts its count on the first run,
    not from when it was created.
  - Re-enabling an account restarts its count.
  - The setting is in **Admin Panel / People / Login** as well as in every
    platform's settings. It is read each night, so a change there needs no
    restart.
- [#6785](https://github.com/wekan/wekan/issues/6785): LDAP background sync
  looked users up without `LDAP_USER_SEARCH_FILTER`. An account the filter
  excludes, such as one disabled in Active Directory, could not log in but was
  still found: it was never disabled, and a manual disable was undone on the
  next sync. The filter is now part of the lookup, and an account disabled for
  inactivity is not re-enabled by the sync.

From the patch by Raymond-Voogt. `tests/inactiveUsers.test.cjs`,
`tests/ldapBackgroundSync.test.cjs`, `tests/ldapUserIdFilter.test.cjs`,
`tests/authConfigCatalog.test.cjs` and
`inactive-users-last-active.e2e.js` cover it.

</details>

and fixes the following bugs:

**Right-to-left languages** - how a checked checkbox looks.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b4bcded492">A checked checkbox shows a check mark in right-to-left languages too</a>. Thanks to mimZD and xet7.</summary>

[#6786](https://github.com/wekan/wekan/issues/6786): the tick is a box rotated
40 degrees and drawn by its bottom and side borders. The side was
`border-inline-end`, which a right-to-left page puts on the left, so the tick
opened the other way. All 25 rules that draw a tick now use `border-right`.
`tests/rtlCheckMark.test.cjs` fails if any checked state in `client/` draws
one with a logical border, and `rtl-check-mark.e2e.js` compares both
directions.

</details>

**Admin Panel / Problems** - repairs that stay repaired.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3469f84c78">Restored list swimlanes stay restored after a WeKan upgrade</a>. Thanks to mimZD and xet7.</summary>

[#6787](https://github.com/wekan/wekan/issues/6787): after every new release,
the startup upgrade's `merge-per-swimlane-lists` step, written for v7.98-era
damage, un-bound every list on a board with two lists of one title, the lists
"Lists missing their swimlane" -> Restore had bound included. So the count
came back the same after each upgrade. A list bound to the swimlane it was
created in, with all its cards there, is now left alone. Press Restore once
more after upgrading. `tests/schemaUpgradeSteps.test.cjs` covers the issue's
board and two negatives.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.55 2026-10-18 WeKan ® release

**In short:** the **32-bit ARM single files** are injected outside the 32-bit
Node.js that ran out of memory doing it, and each **musl AppImage** is built
once, under a name of its own.

This release fixes the following bugs:

**Release builds** - single files and AppImages that v12.54 built broken,
twice, or not at all.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/29dfe94886">A 32-bit ARM single file's blob is injected in a 64-bit process</a>. Thanks to xet7.</summary>

v12.54's retry did not help: armv7 failed with `std::bad_alloc` on all three
attempts. A 32-bit target's blob must be written by a 32-bit Node.js, and
`--build-sea` also injects it with LIEF in that process, which does not have
the address space for it. The i386 Node.js now writes only the blob
(`--experimental-sea-config`), and `releases/single-file/sea-inject-elf.py`
injects it with LIEF 1.0.0, the version Node.js vendors, step for step as
`--build-sea` does. The result is byte-identical to `--build-sea`'s, for a
non-PIE x64 Node.js and the PIE node-armv7. win32 and 64-bit targets are
unchanged, and the retry is gone. `tests/singleFileSeaInject.test.cjs`
compares the two outputs byte for byte where LIEF is available.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2cbb038719">Each musl AppImage is built once, and every AppImage job has its own name</a>. Thanks to xet7.</summary>

The glibc AppImages call built the musl rows too, so "AppImage x86_64" and
"AppImage aarch64" ran twice. Their logs then collided in the run's log
archive and asked to be overwritten when it was unpacked. That call now builds
only the glibc four, the job is named `AppImage x86_64-musl` and so on, and
each run checks only its own AppImages are attached. The musl run had warned
that the glibc ones were missing. `tests/muslBundles.test.cjs` checks that the
names are unique and that each row is built by one call.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.54 2026-10-18 WeKan ® release

**In short:** the **Android** bundles, the **x86_64 musl AppImage** and the
**armhf single file**, which v12.53 could not build or start, build again.

This release fixes the following bugs:

**Release builds** - bundles that v12.53 built broken or not at all.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/519869b561">Android bundles preload termux-exec, so bcrypt's install script runs</a>. Thanks to xet7.</summary>

Every Android bundle of v12.53 stopped in `npm-rebuild.js` with "sh: 1:
node-gyp-build: not found". Termux has no `/usr/bin/env`, so a
`#!/usr/bin/env node` script runs only through termux-exec, an `LD_PRELOAD`
library that Termux's `login` exports, and the workflow starts bash without
`login`. `releases/android/build-bundle.sh` now exports it the way `login`
does. `tests/androidBundles.test.cjs` pins it before `npm install`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fa0c03437c">A single file's --build-sea is tried again when it runs out of memory</a>. Thanks to xet7.</summary>

The armhf single file of v12.53 failed with `std::bad_alloc`. A 32-bit target
is injected by the 32-bit i386 Node.js, and the executable, the 180 MiB
archive and LIEF's copies of both come near its 4 GiB address space: armv7
and armv6, with the same archive and host, built in the same run. `buildSea()`
retries up to three times on `std::bad_alloc` only.
`tests/singleFileSeaInject.test.cjs` covers the retry and that no other
failure is retried.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/df5560ad51">musl bundles carry every library their Node.js needs, libatomic too</a>. Thanks to xet7.</summary>

Every x86_64 musl AppImage of v12.53 did not start in a bare Alpine: "Error
loading shared library libatomic.so.1". `node-runtime` held only libstdc++
and libgcc_s, and the build container had libatomic through g++. The musl
build now copies every `NEEDED` library of `bundle/node` except musl's libc,
and `AppImage.yml` checks each is there before packing.
`tests/muslBundles.test.cjs` pins both.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.53 2026-10-18 WeKan ® release

**In short:** moving a card with an **outgoing webhook** no longer disables
the mover's account as **HookBleed**, and a security refusal that says it
blocks nobody (**RedirectBleed**, **LiveBleed**, **IntegrationBleed**) now
really does not.

This release fixes the following bugs:

**Outgoing webhooks** - a card move delivered to a webhook is the server's own,
and costs nobody their account.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b01c233269">Moving a card with an outgoing webhook is no HookBleed and keeps the mover's account</a>. Thanks to do4me and xet7.</summary>

[#6782](https://github.com/wekan/wekan/issues/6782): the activity hook sent
webhooks through `Meteor.call('outgoingWebhooks')`, and that method took a
call without `this.connection` to be the server's own. Meteor gives a
server-side `Meteor.call` the user and connection of the method it runs in,
and a card moved in a browser runs in that browser's method. The server's own
`act-moveCard` delivery was therefore taken for a client forging one. It was
logged as HookBleed, and the mover's account was disabled.

- The server now delivers through `deliverActivityWebhook()`, a function that
  no client can call. It reads the integration again and names the
  activity's actor. The method accepts only the card-opened notification, as
  it already did for clients.
- A server delivery no longer needs the actor to be a member of the hook's
  board. That check had also stopped global webhooks and activities with no
  method behind them, such as REST and timers.
- `securityLog.record()` passed neither the catalog key nor `blocksAccount`
  to the block decision. Every high-severity refusal therefore disabled the
  account it named: a hook refused for its own internal address disabled the
  mover too, and the existing `blocksAccount: false` of RedirectBleed and
  LiveBleed never applied. Both reach the decision now, and `ssrf.webhook`
  is `blocksAccount: false`, because the mover did not write the hook's URL.

`tests/hookBleedServerDelivery.test.cjs` covers:

- a card move delivered with nothing logged, also in an inherited context;
- a forged call, still refused, logged and blocking;
- the card-opened notification;
- failing and internal hooks that block nobody, through `record()` itself;
- a scan of the whole tree that no server code calls a method gated on
  `this.connection` from inside a client's method.

`hook-bleed.e2e.js` moves a card in the Move dialog with a webhook enabled.
An account disabled by this before the upgrade is enabled again in Admin
Panel / People.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.52 2026-10-18 WeKan ® release

**In short:** the release builds that failed in v12.51 work again: the
**Android** bundles, the **musl AppImages** and the **i386** and
**freebsd-x64** single files. Nine dependency updates, among them
**qrcode-generator 2** and **actions/download-artifact 8**, were checked
against how WeKan uses them.

This release updates the following dependencies:

- **qrcode-generator 1.4.4 → 2.0.4** — [the SQRL sign-in QR
  code](https://github.com/wekan/wekan/pull/6775); now ES module and CommonJS
  builds, and the SVG of WeKan's call is byte for byte the same.
- **temml 0.13.5 → 0.14.0** — [math in
  Markdown](https://github.com/wekan/wekan/pull/6777); WeKan's
  `renderToString` options give the same output for formulas, errors and
  `\href`.
- **i18next 26.4.2 → 26.4.5** — [the translation
  library](https://github.com/wekan/wekan/pull/6779).
- **@swc/core 1.16.13 → 1.16.18** — [the compiler of the
  build](https://github.com/wekan/wekan/pull/6778).
- **@rspack/cli 2.2.8 → 2.2.9** — [the bundler's command
  line](https://github.com/wekan/wekan/pull/6773).
- **@playwright/test 1.63.0 → 1.64.1** — [the browser
  tests](https://github.com/wekan/wekan/pull/6776).
- **actions/download-artifact 7.0.0 → 8.0.2** — [in five
  workflows](https://github.com/wekan/wekan/pull/6774); a hash mismatch now
  fails the download, and every artifact WeKan uploads is still a zip.
- **actions/setup-python 6.3.0 → 7.0.0** — [in
  bun.yml](https://github.com/wekan/wekan/pull/6780); the removed `pip-install`
  input was not used.
- **vmactions/freebsd-vm 1.5.5 → 1.5.9** — [in
  bsd.yml](https://github.com/wekan/wekan/pull/6781), the version bun.yml
  already uses.

Thanks to dependabot.

and fixes the following bugs:

**Release builds** - the Android, musl and single-file builds of v12.51, and
the guards of the dependency updates.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/53729d47f5">The guards follow freebsd-vm 1.5.9 and qrcode-generator 2.0.4</a>. Thanks to dependabot and xet7.</summary>

Two tests stopped at the merged updates. `tests/bsdBundles.test.cjs` pinned
`bsd.yml`'s FreeBSD VM action to its old commit, because the VM that builds
the bundle's native modules must be the one that built node-freebsd-x64. It
now reads the pin and requires wekan/node-patches to use the same commit, and
node-patches now does. `tests/sqrl.test.cjs` required qrcode-generator 1.4.4
exactly, and now requires an exact version.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0670cc65a3">Android bundles: the checkout belongs to Termux's user, so npm may chmod</a>. Thanks to xet7.</summary>

Every Android bundle of v12.51 stopped with EPERM. npm chmods each package's
bin when it installs (`uuid/dist/bin/uuid`), and only a file's owner may
chmod it, so making the bind mount writable to everyone (`a+rwX`) was not
enough. `android.yml` now reads the uid of Termux's user from the image,
chowns the checkout to it before the rebuild, and takes it back before
packaging. If it cannot read the uid, it stops the job.
`tests/androidBundles.test.cjs` pins the order and the negative case.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bce305029a">musl bundles carry libstdc++ and libgcc_s, so their Node.js starts on a bare Alpine</a>. Thanks to xet7.</summary>

Every musl AppImage of v12.51 died at once in Alpine with "Error relocating
.../bundle/node: _ZTVN10__cxxabiv117__class_type_infoE: symbol not found".
The musl Node.js is linked against GCC's C++ runtime. The Alpine that
`musl.yml` builds in had it installed, and a user's Alpine does not. The
bundle's `node-runtime` now holds that Alpine's `libstdc++.so.6` and
`libgcc_s.so.1`, with a license notice. `start-wekan.sh` puts them on the
library path, as it does with libatomic, and the AppImage workflow requires
both files in a musl bundle. Its smoke test still adds only curl to Alpine,
so `tests/muslBundles.test.cjs` would catch this fault again.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c316616ef8">Single files: a Node.js that LIEF cannot inject is skipped with the reason, not failed</a>. Thanks to xet7.</summary>

The v12.51 i386 single file stopped with `std::bad_alloc`, and the
freebsd-x64 one with "Failed to relocate ELF program headers". Node.js
injects the archive with LIEF:

- The i386 Node.js is a PIE with 1,524 R_386_32 relocations, which LIEF does
  not adjust. postject, which uses the same LIEF, "succeeds" and leaves a
  broken binary.
- The FreeBSD Node.js is a non-PIE with two bss-like segments.

`releases/single-file/sea-inject.mjs` detects both from the ELF before
anything is built. `build.mjs` then exits 3 with the reason, which
`single-file.yml` turns into a notice. wekan/node-patches now builds the
i386 Node.js as a non-PIE and the FreeBSD one as a PIE, so both single files
come back with its next release. A target that was not built leaves a
one-line artifact saying why, so its Start job no longer logs "Artifact not
found" errors. `tests/singleFileSeaInject.test.cjs` checks both cases on
synthetic ELF files, and its negative cases let through what LIEF does
inject.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.51 2026-10-17 WeKan ® release

**In short:** eleven **helpers that need no AI** - features other kanban
apps sell as AI, done here with plain code: a **due date from the title**,
**similar cards**, **rule suggestions**, a board **Summary**, **Since your last
visit**, **At risk**, **suggested members**, a **forecast done date**, a
**checklist from the description**, **action items** and **search phrases**.
A card's drawing also opens as a **whiteboard** that several people draw on
at once, and **Apple Glass Pastel** is now Liquid Glass. Each can be hidden
per board or for the whole WeKan. A **CodeQL** alert in a test is fixed.

This release fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6090be4dfd">Alert #588: a test removes template declarations to a fixed point</a>. Thanks to GitHub CodeQL and xet7.</summary>

js/incomplete-multi-character-sanitization in
tests/templatesAreRendered.test.cjs: one replace each removed template
declarations and Template.<name>.helpers/onCreated/... from the source the
test scans, so removing one could splice its neighbours into another. Both
now repeat until nothing changes, as for alerts #545 and #570-#582, and
tests/tagStrippingFixedPoint.test.cjs now also finds a multi-character removal
of an on<Capital> name outside such a loop anywhere in the tree. A test's
source scan, never run on user input, so nothing reaches Admin Panel ->
Problems.

</details>

and adds the following new features:

**Helpers that need no AI** - computed from the board's own data, hidden like
every other optional part, and translated in every language.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f8267d704e">A due date typed at the end of a card title becomes its due date</a>. Thanks to xet7.</summary>

"Call the printer tomorrow 14:00", "Soita huomenna klo 14", "friday 9:30",
"in 3 days" or "23.10." at the end of a new card's title gives the card that
due date, and the words leave the title. The words come from the browser's
own Intl tables (relative days, weekdays, the language's date order and the
word before a time), so every language works without a word list, and English
works in every language. Only the end of the title is read, a time alone needs
a colon, a day word or am/pm, and "Release 1.2" is never a date. A hint under
the field shows the date and its x keeps the words; the opened card's title
reads it only when the title changed. Board Settings / Card row *Due date
from title*. models/lib/titleDueDate.js; tests/titleDueDate.test.cjs checks
eleven languages, the negatives and every WeKan language tag, and
assist-due-from-title.e2e.js the form, the x, the board switch and the
opened card.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f8267d704e">Similar cards and possible duplicates while adding a card and on the opened card</a>. Thanks to xet7.</summary>

Letter triples and the Dice coefficient - letter pairs for scripts written
without spaces - rank the board's open cards against the title being typed or
the opened card's title and description. The add-card form lists up to three,
marking one 80 % alike or more as a possible duplicate; the opened card has a
Similar cards section. The method cards.similar reads through
server/lib/assistGate.js: a board the caller may read, the board's switch and
the Admin Panel's, and for an assigned-only member only the cards assigned to
them. tests/similarCards.test.cjs and assist-similar-cards.e2e.js, with the
assigned-only and switched-off negatives.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2211b24119">Rules suggests rules from what people keep doing by hand</a>. Thanks to xet7.</summary>

When the same person does one thing to a card and within two minutes
another, the pair is counted once per card; seen on three cards in 30 days it
is offered above the rule list - moved to a list then a label, a member or
archive, and so on. A pair a rule already does is not offered. Create goes
through rules.createRule with the trigger and action the wizard builds, and
Dismiss hides one for that admin on that board. Board admins only, and
Admin Panel / Settings / Visibility / Features has a Rule suggestions tick.
tests/ruleSuggestions.test.cjs and assist-rule-suggestions.e2e.js.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/083c863fb7">Board menu: Summary, what each person did in the last day or week</a>. Thanks to xet7.</summary>

Per person: done (marked complete, given an end date, archived or moved into
the last list), moved, added, commented, and what they have overdue now -
from the activities and History, only the cards the reader may see. Copy as
text gives Markdown with card links. An Admin Panel / Settings / Visibility /
Features tick. tests/boardSummary.test.cjs and assist-board-summary.e2e.js.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/083c863fb7">Board menu: Since your last visit, with how many changes</a>. Thanks to xet7.</summary>

What others changed since the visit before this one, grouped by card. Opening
a board remembers the visit in profile.boardVisits (500 boards at most) even
while the feature is hidden; a board never opened shows its last seven days.
tests/sinceLastVisit.test.cjs and assist-since-last-visit.e2e.js.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/083c863fb7">At risk: a triangle on the minicard and the reasons in the opened card</a>. Thanks to xet7.</summary>

A weighted score: overdue 3, due within two days with less than half the
checklist done 2, blocked by an open card 2, idle 14 days in a middle list
2, moved back twice 1 (the opened card counts those). 3 or more is at risk;
a complete card never is. models/lib/cardRisk.js; tests/cardRisk.test.cjs and
assist-at-risk.e2e.js.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/083c863fb7">Suggested members in the Members and Assignees popups</a>. Thanks to xet7.</summary>

Up to three active board members, by points from the board's open cards that
share this card's labels (2 each), list (1) and swimlane (1); people already
on the card are skipped. A Show on Card row only, the one row with no
minicard side. tests/memberSuggestions.test.cjs and
assist-suggested-members-forecast.e2e.js.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/083c863fb7">Forecast done date for one card, 50 % and 85 %</a>. Thanks to xet7.</summary>

From the cycle times of the board's cards finished in 180 days, counting only
those that took at least as long as this card has been open; fewer than five
say so. The server sends the times once per board, numbers only, scoped by
role. On the opened card's dates, and on the minicard when a board turns that
side on. tests/cardForecast.test.cjs and the e2e above.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3cb089b8ca">Checklists: From description makes a checklist or subtasks from its list</a>. Thanks to xet7.</summary>

The description's list lines - "- ", "* ", "+ ", "1. ", "1) " and task boxes,
never inside a code block - are previewed, then made into a checklist ticked
where the line was [x], or into subtasks through addSubtaskCard. The
description is not changed. tests/descriptionListItems.test.cjs and
assist-from-text.e2e.js.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3cb089b8ca">Cards from the action items of a comment or a description</a>. Thanks to xet7.</summary>

"TODO: ...", "- [ ] ..." and "@user ..." lines become cards at the top of the
card's list, each linking back to the card, with the mentioned user as member
when they are an active board member - a mention of anybody else stays in the
title. On the comment's line, and in the card menu for the description.
tests/actionItems.test.cjs and assist-from-text.e2e.js.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3cb089b8ca">Global search understands plain phrases such as my overdue cards</a>. Thanks to xet7.</summary>

Ten phrases in the reader's language, and in English everywhere, run as the
search operators in the reader's language; the page shows the query it ran,
and a query that already has an operator is never rewritten. An Admin Panel /
Settings / Visibility / Features tick. tests/searchPhrases.test.cjs and
assist-search-phrases.e2e.js.

</details>

**Apple Glass Pastel** - the theme as Apple's Liquid Glass, readable everywhere.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c49f7f51b">Liquid Glass surfaces, and every text and icon measured readable</a>. Thanks to xet7.</summary>

Header bars, swimlanes, lists, minicards, the opened card, the sidebar and
popups are frosted glass over the pastel mesh: a translucent fill, blur and
saturation, a rim of light brightest on top, a diagonal sheen and larger
corners. The header bars are glass instead of solid blue, with dark text;
blue stays for the primary action and what is active. Reduce transparency
gets near-opaque surfaces. theme-appleglasspastel-contrast.e2e.js measures
every text and icon against the pixels really behind it, to WCAG AA, on the
board, card, sidebar, board menu and All Boards at laptop and phone size; it
found white header text and icons, the forced-white hamburger, grey sidebar
headings and icons, and a white hovered menu row, all fixed.

</details>

**Whiteboard** - a card's drawing full screen, for several people at once.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/390007e380">A card's drawing opens as a whiteboard that several people draw on at once</a>. Thanks to xet7.</summary>

Card menu -> Drawing -> Open as whiteboard: the drawing under the header bar,
over the opened card, with the drawing's and Red Strings' own colours, widths,
Undo, Clear and Save picture, scaled to the screen. Each line is one atomic
$push with its id and author, carried to everyone by the card's publication;
Undo and Clear take away only one's own lines, Save picture writes only the
PNG. Who may draw is who may edit the card. A Board Settings / Card row.
tests/whiteboard.test.cjs, and whiteboard.e2e.js draws from two browsers at
the same moment.

</details>

and improves the documentation:

- [docs/Features: guides for the eleven helpers that need no AI, filed by menu](https://github.com/wekan/wekan/commit/e76f12bcdd),
  and TODO Later lists them. Thanks to xet7.
- [docs/Features: Cards / Whiteboard](https://github.com/wekan/wekan/commit/d9bb7b4f4f). Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.
