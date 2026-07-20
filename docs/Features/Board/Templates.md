[VIDEO ABOUT HOW TO USE BOARD TEMPLATES](https://www.youtube.com/watch?v=K0_cP85Bvas)

[More about templates explained here](https://github.com/wekan/wekan/issues/3127#issuecomment-634348524)

[Templates feature requests and bugs](https://github.com/wekan/wekan/issues?q=is%3Aissue+is%3Aopen+templates+label%3AFeature%3ATemplates)

***
Implemented and working:
- [Per-user templates](https://github.com/wekan/wekan/issues/2209) — Card, List and Board templates, as described below.
- An admin [Shared Templates](#shared-templates-admin-view) view (Admin Panel → People → Shared templates) that lists users' shared template boards grouped by Organization / Team / email Domain.
- Card hamburger menu / Copy Checklist Template to Many Cards.
- [Collapsible Swimlanes](https://github.com/wekan/wekan/issues/2804) — collapse/expand a swimlane from its header.

At [Roadmap](https://boards.wekan.team/b/D2SzJKZDS4Z48yeQH/wekan-open-source-kanban-board-with-mit-license) of xet7, Maintainer of Wekan, these already have [some funding](https://wekan.fi/commercial-support/):
- [Single fixed list titles static at top of swimlanes view](https://github.com/wekan/wekan/issues/2805).
- [Main Boards/Organizing Boards/Nested Tabs](https://github.com/wekan/wekan/issues/2796) + [Top Level Projects](https://github.com/wekan/wekan/issues/641). ([Shared templates #2209](https://github.com/wekan/wekan/issues/2209) is now implemented — see [Shared Templates (Admin view)](#shared-templates-admin-view) below.)
- [Teams/Organization Templates](https://github.com/wekan/wekan/issues/802).
- [Bug: Board templates aren't created automatically whenever the user was created by REST API or OAuth2](https://github.com/wekan/wekan/issues/2339).

These don't yet have [funding](https://wekan.fi/commercial-support/):
- [Notification Email templates](https://github.com/wekan/wekan/issues/2148).
- [Email templates](https://github.com/wekan/wekan/issues/2022).
- [Import and Export Checklists](https://github.com/wekan/wekan/issues/904).

At Roadmap of some other Wekan Contributors:

- Prettify email notifications.

***

# Template boards are group-only

Template boards are shared with **groups** — Organizations, Teams or email
**Domains** — rather than with individual users. The only individual shown on a
template board is its **creator**; everyone else gains access through the
organization, team or domain the template is shared with. Sharing a board with an
email domain is done from the **Domains** tab in the board members sidebar (see
[Members and Permissions](../Members/Members.md)).

## Drag a template board to share it

From **All Boards / Templates** you can **drag a Template Board onto an
Organization, Team or Domain** to share it with that group (drag-to-share). The
Organizations and Teams offered as drop targets are only those whose per-org /
per-team **Shared Templates** flag is enabled in
**Admin Panel → People → Organizations / Teams** (see
[Admin Panel](../Admin-Panel/Admin-Panel.md)); organizations and teams without that
flag are not offered as drop targets.

***

# If you get "Board not Found" after archieving Template Board

From: https://github.com/wekan/wekan/issues/4632

You can use MongoDB GUI like [DBGate or nosqlbooster](../../Backup/Backup.md#dbgate-open-source-mongodb-gui).

With that MongoDB GUI, look what is userID of that user
at users table/collection, and add that userID to
members of boards table/collection where board type is
Template and also set that board Archive to False.

***

# Current Per-User Templates Feature

## 1) All Boards page, top right: Templates

### a) Create Card templates

1. Create a new list to Card Templates Swimlane
2. Add template cards to that new list.

### b) Create List templates

1. Create Lists to List Templates Swimlane
2. Add cards etc content to lists.

### c) Create Board Templates

1. Create List to Board Templates Swimlane.
2. Create Card to List that is at Board Templates Swimlane
3. Clicking black folder icon on that card goes to your new Board Template full screen view.
4. Add content to your Board Template

## 2) Insert new Cards/Lists/Boards from Templates

### a) Insert Card Templates

1. Go to some board.
2. Click Add Card. (Do not write card text).
3. Click Template.
5. Write new Title for template card you are planning to add.
4. Search for Template Card name or see that Template Card name is visible.
6. Click that Template Card.
7. Now Template Card is inserted with your new title.

### b) Insert List Templates

1. Go to some board.
2. At right edge or all lists, click Add List. (Do not add list name).
3. Click Template.
4. Write new Title for Template List you are planning to add.
5. Search for Template List Name or see if Template List Name is visible.
6. Click that Template List Name.
7. Now Template List is inserted with your new title.

### c) Insert Board Templates

1. Go to All Boards.
2. Click Add Board. (Do not add new board name).
3. Click Template.
4. Write new Title for Template Board you are planning to add.
5. Search for Template Board Name or see if Template Board Name is visible.
6. Click that Template Board Name.
7. Now Template Board is inserted with your new title.

***

# Shared Templates (Admin view)

The Admin Panel has a **Shared templates** view that lets an administrator browse
all users' shareable template boards, grouped by **Organization**, **Team** or
email **Domain**. This is feature request
[#3313](https://github.com/wekan/wekan/issues/3313).

## Background

Every user has a personal **Templates** board (a container board of type
`template-container`) with a **Board Templates** swimlane. Each board template a
user creates is a linked-board card (`cardType-linkedBoard`) in that swimlane that
points at the actual template board (see the Per-User Templates feature above).

The Shared templates view collects, for every user whose Templates board is **not
empty**, those template boards and groups the users so admins can see which
templates exist across the organization.

## Web UI

1. Open **Admin Panel → People**.
2. In the side menu choose **Shared templates**.
3. Tick one or more **scope** checkboxes — **Organizations**, **Teams**,
   **Domains**. The checkboxes are **live view filters** and are **unchecked by
   default**, so nothing is shown until you pick a scope.
4. For each ticked scope the users are grouped:
   - **Organizations** — by each user's `orgs` (organization display name).
   - **Teams** — by each user's `teams` (team display name).
   - **Domains** — by the domain part of each user's verified email address.
5. Under each group, every listed user's shared template boards are shown as
   links that open the template board.

Only users whose Templates board contains at least one shared template board are
listed; users with an empty Templates board are excluded.

## How it works

An admin-only Meteor method, `adminSharedTemplates`, returns one row per
qualifying user with their `orgs`, `teams`, email `domains` and the list of their
shared template boards (resolved from the linked-board cards in the Board
Templates swimlane). The grouping by scope is done client-side, so toggling the
scope checkboxes re-groups the same data without re-querying.

The method requires the caller to be an administrator
(`Meteor.Error('not-authorized')` otherwise).

Covered by the e2e suite
[`tests/playwright/specs/26-shared-templates.e2e.js`](../../../tests/playwright/specs/26-shared-templates.e2e.js).
