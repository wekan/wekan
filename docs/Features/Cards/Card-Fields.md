# Card fields: only what the card has, and "+ Add"

An opened card shows **only the fields it has data in**. A card with a due date
and two labels shows its due date and its labels, and not the empty start date,
received date, members, custom fields and the rest beside them.

## What every card shows

Four things are always there, empty or not, because they are what a card is
for:

| Shown | When |
| --- | --- |
| **Cover** | when the card has a cover - on by default in Board Settings / Card; a new drawing becomes the cover |
| **Description** (its title and its text) | always, also when empty |
| **Attachments**, with **Add attachment** | always, also when there are none |
| **Comments** | always, also when there are none |

Two sections are shown only when there is something in them: **Similar
cards**, when the board has cards like this one, and **Custom Fields**, when
the card has a custom field value (or Custom Fields is ticked in **+ Add**,
which is how a card with none gets the section and its menu).

Every other field is shown when it has data: a date that is set, labels,
members, a checklist, a custom field with a value, a vote question, a Scrum
sprint, and so on. A creator, a card number, the history and the other
fields every card has anyway are shown only when added.

## "+ Add"

Under the cover, above the card's fields, **+ Add** opens a popup that looks
and works like the Admin Panel: the same **left menu** and the same **pane
title** (the shared templates of the [Left Menu](../All-Boards/Left-Menu.md)
design), with the fields on the right.

- The **left menu** lists the sections: Date, Members, Labels, Description,
  Checklists, Attachments, Time, Custom Fields, Voting, Scrum settings,
  Comments and Card.
- The **right pane** lists the fields of the open section - the same items,
  icons and names as [Board Settings / Card](../Board-Sidebar/Board-Settings/Card.md)
  - each with a **checkbox**, ticked when this card shows the field.

| Section | Fields |
| --- | --- |
| Date | Received, Start, Due, End, Mark as complete |
| Members | Members, Assignee, Creator, Requested by, Assigned by |
| Labels | Labels, Stickers, Location |
| Description | Description title, Description text |
| Checklists | Checklists, Subtasks |
| Attachments | Cover image, Attachments, Text notes |
| Time | Spent time, Flowtime, Pomodoro |
| Custom Fields | Custom Fields |
| Voting | Voting question, Planning Poker |
| Scrum settings | Sprint, Past sprints, Release, Issue type, Acceptance criteria, Backlog rank |
| Comments | Comments, Activities |
| Card | Card number, Dependencies, Card sorting by number, Show lists, Swimlane |

**Ticking** an empty field shows it on this card, ready to be filled in.
**Unticking** a field hides it from this card, also when it has data - the data
stays, and ticking it again shows it. The choice is the card's own and is kept
with the card; a field whose tick matches what its data would decide leaves
nothing stored.

**+ Add** is shown to whoever may change the card. Below it there is one
separator line, above the first section the card shows: a section the card
does not show draws no line of its own.

## Board Settings / Card still decides what a card can show

[Board Settings / Card](../Board-Sidebar/Board-Settings/Card.md) and Admin
Panel / Settings / Visibility / Features decide what the cards of a board CAN
show. A field turned off there is shown on no card, whatever the card's data
or its own choice, and is not offered in **+ Add**; a section with no field
left is not in the left menu.

The rows of Board Settings / Card that are not a field of their own - Collapse,
Labels text, Labels above the title, the attachment previews and details, the
count badges, Card color, Parent and Linked card, and the helpers such as
Similar cards, At risk, Forecast and Due date from the title - change how a
shown field looks or help to fill it. They follow Board Settings / Card alone
and are not in **+ Add**.

## How it works

`models/lib/cardShownFields.js` holds the rules: the sections, what counts as
data for each field, which fields a card shows, and the card's view of the
board. The card stores two lists:

| Field | Holds |
| --- | --- |
| `shownFields` | fields shown although empty |
| `hiddenFields` | fields hidden although they have data |

Only the field keys of the sections are accepted (`models/cards.js`).

The opened card's templates read the board's flags (`currentBoard.allowsDueDate`
and so on). The opened card and each of its section templates get their own
`currentBoard` helper (`client/components/cards/cardAddFields.js`): this card's
view of the board, whose flags read false for the fields the card does not
show - the same overlay as Admin Panel / Visibility / Features
(`models/lib/cardFieldVisibility.js`), one level down. The board itself is
never changed, and the minicard and the rest of the board are not affected.
The Scrum fields, which are sections of their own, are left out of the card's
section order the same way.

## Related files

| File | What it is |
| --- | --- |
| `models/lib/cardShownFields.js` | The sections, "has data", what a card shows, the card's board view |
| `client/components/cards/cardAddFields.jade` | The "+ Add" popup: the Admin Panel's left menu and pane |
| `client/components/cards/cardAddFields.js` | The popup, and the card's own `currentBoard` |
| `client/components/cards/cardAddFields.css` | The button, and the Admin Panel layout in a popup |
| `client/components/cards/cardDetails.jade` | The "+ Add" button under the cover |
| `models/cards.js` | `shownFields`, `hiddenFields` |
| `tests/cardShownFields.test.cjs` | The rules, the wiring, and that no card section template is left out |
| `tests/playwright/specs/card-add-fields.e2e.js` | An empty card, "+ Add", a field with data |
