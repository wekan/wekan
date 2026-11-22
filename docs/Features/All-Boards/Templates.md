# Templates

## What it is

A **template** is a card, a list or a whole board kept as a model to copy from.
Every user has a personal **Templates** board with three swimlanes - Card
Templates, List Templates and Board Templates - and a new card, list or board
can be inserted from one of them with a new title. Template boards are shared
with organizations, teams and email domains rather than with single people,
and an admin can see every user's shared template boards in the Admin Panel.

## Read more

- [VIDEO ABOUT HOW TO USE BOARD TEMPLATES](https://www.youtube.com/watch?v=K0_cP85Bvas)
- [More about templates explained here](https://github.com/wekan/wekan/issues/3127#issuecomment-634348524)
- [Templates feature requests and bugs](https://github.com/wekan/wekan/issues?q=is%3Aissue+is%3Aopen+templates+label%3AFeature%3ATemplates)
- [Template (file format)](https://en.wikipedia.org/wiki/Template_(file_format))
  on Wikipedia
- [Share template with](Share-Template-With.md),
  [Admin Panel / People / Shared templates](../Admin-Panel/People/Shared-Templates.md)
  and [Members and Permissions](../Board-Sidebar/Members/Members.md) in these
  docs

## How to use it

### 1) All Boards page: Templates

Open **All Boards** and click **Templates** in the left menu.

**a) Create Card templates**

1. Create a new list to Card Templates Swimlane
2. Add template cards to that new list.

**b) Create List templates**

1. Create Lists to List Templates Swimlane
2. Add cards etc content to lists.

**c) Create Board Templates**

1. Create List to Board Templates Swimlane.
2. Create Card to List that is at Board Templates Swimlane
3. Clicking black folder icon on that card goes to your new Board Template full screen view.
4. Add content to your Board Template

**d) Save an existing board as a Board Template**

From [#6792](https://github.com/wekan/wekan/issues/6792).

1. Open the board.
2. Open the right sidebar (the hamburger, **Open Sidebar**) and click
   **Board Settings**.
3. Click **Save as Template**.
4. A copy of the board, with its swimlanes, lists, cards, labels and custom
   fields, is added to your Templates / Board Templates swimlane and opens.

The board itself is not changed. The copy is a template board like one made
in 1c above: private, with you as its only member - share it with an
Organization, Team or Domain from All Boards / Templates. The entry is shown
to board admins (copying a whole board needs the same right as Copy Board),
and not on a board that already is a template.

### 2) Insert new Cards/Lists/Boards from Templates

**a) Insert Card Templates**

1. Go to some board.
2. Click Add Card. (Do not write card text).
3. Click Template.
4. Write new Title for template card you are planning to add.
5. Search for Template Card name or see that Template Card name is visible.
6. Click that Template Card.
7. Now Template Card is inserted with your new title.

**b) Insert List Templates**

1. Go to some board.
2. At right edge or all lists, click Add List. (Do not add list name).
3. Click Template.
4. Write new Title for Template List you are planning to add.
5. Search for Template List Name or see if Template List Name is visible.
6. Click that Template List Name.
7. Now Template List is inserted with your new title.

**c) Insert Board Templates**

1. Go to All Boards.
2. Click Add Board. (Do not add new board name).
3. Click Template.
4. Write new Title for Template Board you are planning to add.
5. Search for Template Board Name or see if Template Board Name is visible.
6. Click that Template Board Name.
7. Now Template Board is inserted with your new title.

### 3) Drag a template board to share it

From **All Boards / Templates** you can **drag a Template Board onto an
Organization, Team or Domain** to share it with that group (drag-to-share). The
Organizations and Teams offered as drop targets are only those whose per-org /
per-team **Shared Templates** flag is enabled in
**Admin Panel → People → Organizations / Teams** (see
[Organizations](../Admin-Panel/People/Organizations.md) /
[Teams](../Admin-Panel/People/Teams.md)); organizations and teams without that
flag are not offered as drop targets. The whole flow is in
[Share template with](Share-Template-With.md).

### 4) Shared Templates (Admin view)

1. Open **Admin Panel → People**.
2. In the side menu choose **Shared templates**.
3. Tick one or more **scope** checkboxes — **Organizations**, **Teams**,
   **Domains**. None is ticked on a new instance, so nothing is shown until you
   pick a scope. The ticks are saved as the instance setting
   `Settings.sharedTemplatesScopes`, so they are the same in every browser and
   also decide which kinds of group are offered under
   [Share template with](Share-Template-With.md).
4. For each ticked scope the users are grouped:
   - **Organizations** — by each user's `orgs` (organization display name).
   - **Teams** — by each user's `teams` (team display name).
   - **Domains** — by the domain part of each of the user's email addresses.
5. Under each group, every listed user's shared template boards are shown as
   links that open the template board.

Only users whose Templates board contains at least one shared template board are
listed; users with an empty Templates board are excluded.

## How the numbers are calculated

Templates have no numbers of their own. What the Admin view counts as a
user's "shared template boards" is every card of type `cardType-linkedBoard`
that is not archived, in the Board Templates swimlane of that user's Templates
board (`profile.templatesBoardId`, `profile.boardTemplatesSwimlaneId`), sorted
by `sort` (`adminSharedTemplates` in
[server/models/users.js](../../../server/models/users.js)). A user with zero
such cards is left out. The count beside **Templates** in the All Boards left
menu is explained in [All Boards](All-Boards.md#how-the-numbers-are-calculated).

## How it works in WeKan

### Template boards are group-only

Template boards are shared with **groups** — Organizations, Teams or email
**Domains** — rather than with individual users. The only individual shown on a
template board is its **creator**; everyone else gains access through the
organization, team or domain the template is shared with. Sharing a board with an
email domain is done from the **Domains** tab in the board members sidebar (see
[Members and Permissions](../Board-Sidebar/Members/Members.md)).

### Background

Every user has a personal **Templates** board (a container board of type
`template-container`) with a **Board Templates** swimlane. Each board template a
user creates is a linked-board card (`cardType-linkedBoard`) in that swimlane that
points at the actual template board (see the Per-User Templates feature above).
A template board itself has `type: 'template-board'`.

The Shared templates view collects, for every user whose Templates board is **not
empty**, those template boards and groups the users so admins can see which
templates exist across the organization. This is feature request
[#3313](https://github.com/wekan/wekan/issues/3313).

### How the Admin view works

An admin-only Meteor method, `adminSharedTemplates`, returns one row per
qualifying user with their `orgs`, `teams`, email `domains` and the list of their
shared template boards (resolved from the linked-board cards in the Board
Templates swimlane). The grouping by scope is done client-side
([client/components/settings/peopleBody.js](../../../client/components/settings/peopleBody.js)),
so toggling the scope checkboxes re-groups the same data without re-querying.

The method requires the caller to be an administrator
(`Meteor.Error('not-authorized')` otherwise).

Covered by the e2e suite
[`tests/playwright/specs/26-shared-templates.e2e.js`](../../../tests/playwright/specs/26-shared-templates.e2e.js).

### Save as Template

`saveBoardAsTemplate` ([server/publications/boards.js](../../../server/publications/boards.js))
refuses a caller who is not an admin of the board (`not-authorized`) and a
board that already is a template (`already-a-template`). It copies the board
with `type: 'template-board'`, makes the copy `private`, and adds a linked-board
card for it to the Board Templates swimlane. The menu entry is
`js-save-board-as-template` in
[client/components/sidebar/sidebar.jade](../../../client/components/sidebar/sidebar.jade).

### If you get "Board not Found" after archieving Template Board

From: https://github.com/wekan/wekan/issues/4632

You can use MongoDB GUI like [DBGate or nosqlbooster](../../Backup/Backup.md#dbgate-open-source-mongodb-gui).

With that MongoDB GUI, look what is userID of that user
at users table/collection, and add that userID to
members of boards table/collection where board type is
Template and also set that board Archive to False.

### Status

Implemented and working:
- [Per-user templates](https://github.com/wekan/wekan/issues/2209) — Card, List and Board templates, as described above.
- An admin [Shared Templates](#4-shared-templates-admin-view) view (Admin Panel → People → Shared templates) that lists users' shared template boards grouped by Organization / Team / email Domain.
- Card hamburger menu / Copy Checklist Template to Many Cards.
- [Collapsible Swimlanes](https://github.com/wekan/wekan/issues/2804) — collapse/expand a swimlane from its header.

At [Roadmap](https://boards.wekan.team/b/D2SzJKZDS4Z48yeQH/wekan-open-source-kanban-board-with-mit-license) of xet7, Maintainer of Wekan, these already have [some funding](https://wekan.fi/commercial-support/):
- [Single fixed list titles static at top of swimlanes view](https://github.com/wekan/wekan/issues/2805).
- [Main Boards/Organizing Boards/Nested Tabs](https://github.com/wekan/wekan/issues/2796) + [Top Level Projects](https://github.com/wekan/wekan/issues/641). ([Shared templates #2209](https://github.com/wekan/wekan/issues/2209) is now implemented — see [Shared Templates (Admin view)](#4-shared-templates-admin-view) above.)
- [Teams/Organization Templates](https://github.com/wekan/wekan/issues/802).
- [Bug: Board templates aren't created automatically whenever the user was created by REST API or OAuth2](https://github.com/wekan/wekan/issues/2339).

These don't yet have [funding](https://wekan.fi/commercial-support/):
- [Notification Email templates](https://github.com/wekan/wekan/issues/2148).
- [Email templates](https://github.com/wekan/wekan/issues/2022).
- [Import and Export Checklists](https://github.com/wekan/wekan/issues/904).

At Roadmap of some other Wekan Contributors:

- Prettify email notifications.

## Commits

 - [Shared templates: the group kinds to share with are an instance setting](https://github.com/wekan/wekan/commit/c0339ccc592ceb3f14f5339db864b2e63004ca98)
 - [Save an existing board as a board template](https://github.com/wekan/wekan/commit/14a43da557985bb85e8a73134eda6b243e8521c7)
 - [A WeKan import keeps templates as templates](https://github.com/wekan/wekan/commit/a4359731b1bed397e1616dd8289b0d437f8e7243)
 - [The template picker searches a template board shared by another member](https://github.com/wekan/wekan/commit/07f6cda95e56c36fb38fa1a95e9ddeb1e60d661e)
 - [Mark a board template as the default for new boards](https://github.com/wekan/wekan/commit/5fbbbeca9237ee19a3e94ddf65de30ce45c05fab)
 - [Offer only organizations and teams with Shared Templates on as drop targets](https://github.com/wekan/wekan/commit/ddb88af15b9c73543785b27c803c74eefba6b569)
 - [Drag a template board onto an organization, team or domain to share it](https://github.com/wekan/wekan/commit/4aa8c5eedf4a2ce9aa2f88342c3328e794f42e2a)
 - [Creating a board from a template no longer breaks subtasks](https://github.com/wekan/wekan/commit/25cdc4db0d490b4bbd1cf3c66ac57325fd52cd04)
 - [Save as Template card action, and the shared Templates board creation](https://github.com/wekan/wekan/commit/bc25eee1ba8ddbc169186c07218ab300666756b1)
 - [Admin Panel Shared templates view grouped by organization, team and domain](https://github.com/wekan/wekan/commit/fc9e8674d89ec5b045f2e2c1b14fade9e92baf0d)
 - [Template boards are always shown, which fixes Board not Found after archiving one](https://github.com/wekan/wekan/commit/c01743b53a62313f797fe6680f9100adac37102f)
 - [Templates at All Boards, and the missing /templates address](https://github.com/wekan/wekan/commit/7f32de3bec151df9e656013e8e910eb650b8ce80)
 - [Shared templates, first part](https://github.com/wekan/wekan/commit/0a0cec6ef0eb55391608aade897004db430ba10a)
 - [Template migrations](https://github.com/wekan/wekan/commit/7033315cd36530330af6f785716cce9342ef4a72)
 - [Template swimlanes saved in the profile, and template containers kept](https://github.com/wekan/wekan/commit/64bf455b296a10369e8318183c2c6cd61a122869)
 - [First data model and user interface for templates](https://github.com/wekan/wekan/commit/0a53ee87b94232608b5131f47dd77d2fa4bbc5ba)
