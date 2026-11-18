# Board Settings / Scrum settings

**Right sidebar / Board Settings / Scrum settings** (`fa-repeat`) is a group of
its own, between the Rules group and **Change Color**. Shown to **board admins
only**. It does not open a popup: it switches the board to the **Sprints** view
and opens that view's **Scrum settings** section
(`Session.set('scrumOpenSettings', true)` and
`Utils.setBoardView('board-view-sprints')` in
`client/components/sidebar/sidebar.js`).

## The settings

`details.scrum-settings` in `client/components/boards/scrum/scrumView.jade`,
drawn when the server says the user is a board admin (`canAdmin`):

| Field | What it sets |
| --- | --- |
| Enable Scrum planning | Whether Scrum planning is on for this board. |
| Product Goal | Free text. |
| Definition of Done | Free text. |
| Product Owner | One active board member, or none. |
| Scrum Master | One active board member, or none. |
| Developers | Any number of active board members. |
| Working days | One or more of Monday to Sunday (required). |
| Estimate source | **Planning poker estimate** or **Numeric custom field**. |
| Custom Fields | The custom field to read estimates from, or none. |
| Estimate unit | Free text, up to 80 characters. |
| Completion policy | A card counts as done when it is **marked complete**, or when it is **in a Done-category list**. |

**Save** calls `scrum.configure` (`server/scrum.js`), which checks again that
the caller is a board admin and stores the settings in the board's `scrum`
field with a revision number; a save based on an older revision is refused as a
conflict. The estimate source, estimate field, estimate unit and completion
policy cannot be changed while a sprint is active.

Below it, **Import Scrum planning into this board** takes a WeKan board export
or a Scrum transfer file, previews what would change, and imports on
confirmation (`scrum.importIntoBoard`, board admins only). Existing sprints and
releases are linked rather than duplicated; cards are matched by ID, or by card
number and title, and unmatched cards are listed and left unchanged.

## Related

- [Sprints](../../Board-Header/Board-Views/Scrum/Sprints.md)
- [Product Backlog](../../Board-Header/Board-Views/Scrum/Product-Backlog.md)
- [Sprint reports and velocity](../../Board-Header/Board-Views/Scrum/Sprint-Reports.md)
- [Scrum design](../../Board-Header/Board-Views/Scrum/Scrum-Design.md)
