# All Boards / Templates / Share template with

While **Templates** is the selected row of the All Boards left menu, a
**Share template with** heading appears directly under it, followed by one row
(`fa-share-alt`) per group a template board can be shared with
(`shareTargets` in `client/components/boards/boardsList.js`). Each row's
tooltip is *Drag a Template Board here to share it*. With no targets, neither
the heading nor rows are drawn.

## Which groups are offered

The server method `getMyShareableGroups` (`server/sharedTemplateTargets.js`)
returns, for the signed-in user:

- the **organizations** they belong to whose **Shared Templates** switch is on,
- the **teams** they belong to whose **Shared Templates** switch is on,
- the **email domains** of their own email addresses.

The page then keeps only the kinds - organizations, teams, domains - that are
ticked as scopes in Admin Panel / People / Shared templates. Those ticks are
the instance setting `Settings.sharedTemplatesScopes`
(`models/lib/sharedTemplatesScopes.js`), the same for every user in every
browser; with none ticked, no targets are offered. (They used to be read from
the browser's `localStorage`, so they differed per browser; the first time an
admin opens that pane, ticks still stored there are carried over to the
setting when the instance has none yet.)

## Sharing

Drag a template board's icon onto a row and drop it. Several selected boards
can be dropped at once with [Multi-Selection](../General/Multi-Selection.md);
boards dragged from the Archive are ignored. For each board the drop adds the
group to the board and never removes an existing share:

| Row | Method | Added to the board |
| --- | --- | --- |
| Organization | `setBoardOrgs` | `orgs`: `{ orgId, orgDisplayName, isActive: true }` |
| Team | `setBoardTeams` | `teams`: `{ teamId, teamDisplayName, isActive: true }`; members unchanged |
| Domain | `setBoardDomains` | `domains`: `{ domain, isActive: true }` |

A board that already has that group is left as it is. The server methods
require the user to be an **admin of the board** being shared, and only
teams the board admin belongs to may be added.

## Related

- [Templates](Templates.md)
- [Admin Panel / People / Shared templates](../Admin-Panel/People/Shared-Templates.md)
- [Organizations](../Admin-Panel/People/Organizations.md) and
  [Teams](../Admin-Panel/People/Teams.md) - the Shared Templates switches
