# Design: Requested By and Assigned By become people

Status: **implemented** · Owner: xet7 · Related:
[#6586](https://github.com/wekan/wekan/issues/6586),
[One-Card-Layout.md](../ImportExport/Excel/One-Card-Layout.md).

## What is asked for

Requested By and Assigned By are free **text** today. They should keep that text
field AND gain **member fields of the same kind Assignees has** - a user picked
from a popup, shown as an avatar or initials - everywhere a card is seen,
exported or imported.

## The database fields

Mirror `assignees` exactly, because that is the shape asked for:

```js
  assignees:  { type: [String], optional: true, defaultValue: [] }   // exists
  requesters: { type: [String], optional: true, defaultValue: [] }   // new
  assigners:  { type: [String], optional: true, defaultValue: [] }   // new
```

`requesters` / `assigners` rather than a longer name because WeKan already calls
them that internally: `js-card-details-requester`, `editCardRequesterForm`. The
existing `requestedBy` / `assignedBy` strings STAY - a card may have both a
person and a note about who asked.

Mutations mirror the assignee ones: `assignRequester`, `unassignRequester`,
`toggleRequester`, and the same three for assigners.

## Shared picker pattern

Members, Assignees, Requested By and Assigned By use the same interaction: a
row of avatars, a round `+` that opens a picker, and a popup listing board
members. Requested By and Assigned By share `cardIdentityPicker`; their
free-text `Add` link remains directly below `+` and opens the existing editor.

The selected people and free text are independent, so a card can record board
members and also retain a name or note imported from an external tracker.

## The same avatar everywhere

An avatar is `+userAvatar` / `+userAvatarInitials` inside a `.member` box - the
box is what gives it its size, and every avatar rule in `userAvatar.css` is
scoped to it. That is already true of the board sidebar, the cards, Admin Panel
/ People and, since the Offices pane was fixed, Admin Panel / Problems. The new
fields use the same two templates and the same box, so there is nothing new to
style.

## Exports and imports

| Where | Must carry |
| --- | --- |
| Excel card block | the avatars' initials and the text, in the People meta rows |
| PDF card block | the same, through `models/lib/cardDocument.js` |
| WeKan JSON export / import | `requesters`, `assigners`, and the two strings |
| CSV / TSV | the names, resolved, beside the text |
| Trello / Jira / ... | whatever each format has for a person, else the names |

The export half is one change, not five: the card document's header already
draws `requested-by` and `assigned-by` from `data.requestedBy` /
`data.assignedBy`, so it gains the two user lists beside them and both formats
follow. `tests/requestedAssignedByRoundTrip.test.cjs` already checks the field
survives a round trip and is the place to extend.

## Implementation order

1. Schema + mutations (mirroring assignees).
2. The shared member-picker pattern, with one picker template for Requested By
   and Assigned By.
3. The picker popups.
4. The card document carries both lists; Excel and PDF draw initials + text.
5. Import/export round trip, and the tests that pin it.
