# All Boards / Templates / Share template with

## What it is

Template boards are shared with **groups** - organizations, teams and email
domains - rather than with single people. While **Templates** is the selected
row of the All Boards left menu, a **Share template with** heading appears
directly under it, with one row per group a template board can be shared with.
Dragging a template board onto a row shares it with that group (#5850).

## Read more

- [Template (file format)](https://en.wikipedia.org/wiki/Template_(file_format))
  on Wikipedia
- [Drag and drop](https://en.wikipedia.org/wiki/Drag_and_drop)
- [Templates](Templates.md) and
  [Admin Panel / People / Shared templates](../Admin-Panel/People/Shared-Templates.md)
  in these docs

## How to use it

**Before it can be used** (admin)

1. Open **Admin Panel / People / Shared templates** and tick the kinds -
   Organizations, Teams, Domains - that templates may be shared with.
2. For an organization or team, switch on its **Shared Templates** in
   **Admin Panel / People / Organizations** or **Teams**.

**Share a template board**

1. Open **All Boards** and click **Templates** in the left menu.
2. Under **Share template with**, find the organization, team or domain.
   Each row's tooltip is *Drag a Template Board here to share it*.
3. Drag the template board's icon onto the row and drop it. Several boards
   selected with [Multi-Selection](../Multi-Selection.md) can be dropped
   at once.

With no targets, neither the heading nor rows are drawn.

## How the numbers are calculated

This feature has no numbers of its own. Its rules are:

- one row (`fa-share-alt`) per target returned for you, after the scope filter;
- a domain target is the part after the last `@` of each of your email
  addresses, lower-cased, each domain once;
- a drop only adds; it never removes an existing share, and a board that
  already has the group is left as it is.

## How it works in WeKan

The rows are `shareTargets` in
[client/components/boards/boardsList.js](../../../client/components/boards/boardsList.js).

### Which groups are offered

The server method `getMyShareableGroups` (`server/sharedTemplateTargets.js`)
returns, for the signed-in user:

- the **organizations** they belong to whose **Shared Templates** switch is on
  (`orgSharedTemplates: true`),
- the **teams** they belong to whose **Shared Templates** switch is on
  (`teamSharedTemplates: true`),
- the **email domains** of their own email addresses.

The page then keeps only the kinds - organizations, teams, domains - that are
ticked as scopes in Admin Panel / People / Shared templates. Those ticks are
the instance setting `Settings.sharedTemplatesScopes`
(`models/lib/sharedTemplatesScopes.js`), the same for every user in every
browser; with none ticked, no targets are offered. (They used to be read from
the browser's `localStorage`, so they differed per browser; the first time an
admin opens that pane, ticks still stored there are carried over to the
setting when the instance has none yet.)

### Sharing

Drag a template board's icon onto a row and drop it. Several selected boards
can be dropped at once with [Multi-Selection](../Multi-Selection.md);
boards dragged from the Archive are ignored. For each board the drop adds the
group to the board and never removes an existing share:

| Row | Method | Added to the board |
| --- | --- | --- |
| Organization | `setBoardOrgs` | `orgs`: `{ orgId, orgDisplayName, isActive: true }` |
| Team | `setBoardTeams` | `teams`: `{ teamId, teamDisplayName, isActive: true }`; members unchanged |
| Domain | `setBoardDomains` | `domains`: `{ domain, isActive: true }` |

A board that already has that group is left as it is. The server methods
([server/models/boards.js](../../../server/models/boards.js)) require the user
to be an **admin of the board** being shared, and only organizations and teams
the board admin belongs to may be added (a site admin may add any;
`forbiddenNewGroupIds()` in
[models/lib/boardGroupLinks.js](../../../models/lib/boardGroupLinks.js)).

| File | What it does |
| --- | --- |
| [server/sharedTemplateTargets.js](../../../server/sharedTemplateTargets.js) | `getMyShareableGroups`. |
| [models/lib/sharedTemplatesScopes.js](../../../models/lib/sharedTemplatesScopes.js) | Pure: the three scopes and how the setting is read. |
| [client/components/boards/boardsList.jade](../../../client/components/boards/boardsList.jade) | The heading and the rows. |
| [tests/sharedTemplatesScopesSetting.test.cjs](../../../tests/sharedTemplatesScopesSetting.test.cjs) | The setting and its migration from `localStorage`. |
| [tests/playwright/specs/26-shared-templates.e2e.js](../../../tests/playwright/specs/26-shared-templates.e2e.js) | The shared templates flow in a browser. |

### Related

- [Templates](Templates.md)
- [Admin Panel / People / Shared templates](../Admin-Panel/People/Shared-Templates.md)
- [Organizations](../Admin-Panel/People/Organizations.md) and
  [Teams](../Admin-Panel/People/Teams.md) - the Shared Templates switches

## Commits

 - [The group kinds to share with are an instance setting, and the targets appear](https://github.com/wekan/wekan/commit/c0339ccc592ceb3f14f5339db864b2e63004ca98)
 - [Offer only organizations and teams whose Shared Templates switch is on](https://github.com/wekan/wekan/commit/ddb88af15b9c73543785b27c803c74eefba6b569)
 - [Drag a template board onto an organization, team or domain to share it](https://github.com/wekan/wekan/commit/4aa8c5eedf4a2ce9aa2f88342c3328e794f42e2a)
