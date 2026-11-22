# Board Settings / Scrum settings

## What it is

How this board plans its work with Scrum: whether Scrum planning is on, the
Product Goal, the Definitions of Ready and Done, the Scrum roles, the working
days, the meeting helpers, and how estimates are read and when a card counts
as done. The settings are a section of the **Sprints** view; the Board
Settings entry opens it there.

## Read more

- [Wikipedia: Scrum (software development)](https://en.wikipedia.org/wiki/Scrum_(software_development))
- [The Scrum Guide](https://scrumguides.org/scrum-guide.html)
- [Wikipedia: Planning poker](https://en.wikipedia.org/wiki/Planning_poker)
- [Sprints](../../Board-Header/Board-Views/Scrum/Sprints.md)
- [Product Backlog](../../Board-Header/Board-Views/Scrum/Product-Backlog.md)
- [Sprint reports and velocity](../../Board-Header/Board-Views/Scrum/Sprint-Reports.md)
- [Scrum design](../../Board-Header/Board-Views/Scrum/Scrum-Design.md)

## How to use it

1. Open the board, its right sidebar, then **Board Settings → Scrum settings**
   (`fa-repeat`). It is a group of its own, between the Rules group and
   **Change color**, shown to **board admins only**.
2. It does not open a popup: it switches the board to the **Sprints** view and
   opens that view's **Scrum settings** section
   (`Session.set('scrumOpenSettings', true)` and
   `Utils.setBoardView('board-view-sprints')` in
   [client/components/sidebar/sidebar.js](../../../../client/components/sidebar/sidebar.js)).
3. Fill in the fields below and click **Save**.

The section is `details.scrum-settings` in
[client/components/boards/scrum/scrumView.jade](../../../../client/components/boards/scrum/scrumView.jade),
drawn when the server says the user is a board admin (`canAdmin`):

| Field | What it sets |
| --- | --- |
| Enable Scrum planning | Whether Scrum planning is on for this board. |
| Product Goal | Free text. |
| Definition of Ready | Free text: when a backlog item may be taken into a sprint. Shown to every member in the Scrum views once written. |
| Definition of Done | Free text. Shown to every member in the Scrum views once written. |
| Product Owner | One active board member, or none. |
| Scrum Master | One active board member, or none. |
| Developers | Any number of active board members. |
| Working days | One or more of Monday to Sunday (required). |
| Daily standup, Minutes per person | Whether the board menu offers the [daily standup timer](Scrum-Meetings.md), and each member's timebox. |
| Retrospective board | Whether the board menu offers making a [retrospective board](Scrum-Meetings.md). |
| Estimate source | **Planning poker estimate** or **Numeric custom field**. |
| Custom Fields | The custom field to read estimates from, or none. |
| Estimate unit | Free text, up to 80 characters. |
| Completion policy | A card counts as done when it is **marked complete**, or when it is **in a Done-category list**. |

**Import Scrum planning into this board** (below the settings) takes a WeKan
board export or a Scrum transfer file, previews what would change, and imports
on confirmation (`scrum.importIntoBoard`, board admins only). Existing sprints
and releases are linked rather than duplicated; cards are matched by ID, or by
card number and title, and unmatched cards are listed and left unchanged.

## How the numbers are calculated

From `DEFAULT_SCRUM_SETTINGS` and `normalizeScrumSettings` in
[models/lib/scrum.js](../../../../models/lib/scrum.js):

- **Defaults**: Scrum planning off, estimates from planning poker in `points`,
  a card done when it is marked complete, working days Monday to Friday, daily
  standup and retrospective board on, 2 minutes per person.
- **Minutes per person**: a whole number from 1 to 15.
- **Working days**: one to seven of Monday (1) to Sunday (7), each counted once.
- **Estimate unit**: up to 80 characters, and not empty. The Product Goal and
  the Definitions are text of up to 10,000 characters.
- **Revision**: every save adds one to the board's `scrumRevision`; a save based
  on an older revision is refused as a conflict.

## How it works in WeKan

**Save** calls `scrum.configure` ([server/scrum.js](../../../../server/scrum.js)), which checks again that
the caller is a board admin and stores the settings in the board's `scrum`
field with a revision number; a save based on an older revision is refused as a
conflict. The estimate source, estimate field, estimate unit and completion
policy cannot be changed while a sprint is active.

The import is `scrum.importIntoBoard` in the same file, also for board admins
only. Each save is recorded in the board's history (`recordScrumChange`). The
validation is [models/lib/scrum.js](../../../../models/lib/scrum.js) and the
methods are
[server/scrum.js](../../../../server/scrum.js), pinned by
[tests/scrumDomain.test.cjs](../../../../tests/scrumDomain.test.cjs) and
[tests/scrumMethods.test.cjs](../../../../tests/scrumMethods.test.cjs).

## Commits

 - [Daily standup timer and retrospective board in the board menu](https://github.com/wekan/wekan/commit/2f7a4e210f0e90005bba662e7ac418b403ffa2ba)
 - [List policies, the commitment point, a WIP limit per person, and the Definition of Ready](https://github.com/wekan/wekan/commit/9ac7b916c08bb139f1090d4e87b8319aed08d324)
 - [Scrum: release names on cards, the import-into-board preview and the import report show again](https://github.com/wekan/wekan/commit/6ec8773937fee6cd2bbb9a1cf189bebd9fd884a9)
 - [Import Scrum planning into an existing board](https://github.com/wekan/wekan/commit/ef549078367ca55e3ec45b62d9df915ae6f8162b)
 - [Let a card be in more than one release](https://github.com/wekan/wekan/commit/727ceedd011106189b16013d710409caf3b690ca)
 - [Let a board admin finish or discard an interrupted Scrum import online](https://github.com/wekan/wekan/commit/6f52f2b42adb39cfe2bb479faec577971d58dba0)
 - [Show each Scrum field as its own Board Settings / Card row](https://github.com/wekan/wekan/commit/6d950b7474c394b8f2ef08a2a388c5918a66e3d4)
 - [Move Scrum settings above Change color in Board Settings](https://github.com/wekan/wekan/commit/7bf6f8a44b18cc4b324e666b933ef5d86eeda6e4)
 - [Retain sprint calendars and report planned working days](https://github.com/wekan/wekan/commit/196faa9cd5c49ffdc5ee7cfa598e76c480415da9)
 - [Expose Scrum team accountabilities and working days in settings](https://github.com/wekan/wekan/commit/65217313f048d099aaaebf9c43c9000b206bdddd)
 - [Add Scrum sprint planning, its settings, optional metadata and snapshot reports](https://github.com/wekan/wekan/commit/83eac102113623f8e0bc91b012c994b3c8291765)
