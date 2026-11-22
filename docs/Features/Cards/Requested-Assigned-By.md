# Design: Requested By and Assigned By become people

Status: **implemented** · Owner: xet7 · Related:
[#6586](https://github.com/wekan/wekan/issues/6586),
[One-Card-Layout.md](../Board-Sidebar/Board-Settings/Import-Export/Excel/One-Card-Layout.md).

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

## Commits

 - [Shown on the minicard when a member was picked, with the same icon everywhere](https://github.com/wekan/wekan/commit/22e5df55d7ff2ef03ee05c9e6adfe128844b1d77)
 - [Icons for the card's person add buttons](https://github.com/wekan/wekan/commit/96e598059a90e46dbdd6e86dda96c9758713fa11)
 - [Titles and anchors for the card's people pickers](https://github.com/wekan/wekan/commit/c183b5bf88e5f9c855c7cef40e9e9f2d83d044d7)
 - [Select requesters and assigners from board members](https://github.com/wekan/wekan/commit/bb5275e9743c01868cc0826d4645913a8f27a830)
 - [Assigned By shows when there is an assigner, not when there is a requester](https://github.com/wekan/wekan/commit/e6df1a5d6dca294600e06f1a2e6f12661e9422a3)
 - [The PDF draws the shared card document, Requested By and Assigned By included](https://github.com/wekan/wekan/commit/f6e31444521ffc71c9a1cd78cceaa001c52b8e9b)
 - [A + to set them, and they survive an export and import round trip](https://github.com/wekan/wekan/commit/050df89f06ab07a17899a4b032beeae04676c270)
 - [Requested By and Assigned By text fields on the card](https://github.com/wekan/wekan/commit/3ce3fa74b350ff1af73b0fffddaeff4b0f126e2c)
