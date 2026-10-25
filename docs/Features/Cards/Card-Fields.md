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

## "+ Add" and Board Settings / Card: one popup

Under the cover, above the card's fields, **+ Add** opens
[Board Settings / Card](../Board-Sidebar/Board-Settings/Card.md) - the same
popup Board Settings opens - for this card. It looks and works like the Admin
Panel: the same **left menu** and the same **pane title** (the shared templates
of the [Left Menu](../All-Boards/Left-Menu.md) design), with the rows on the
right.

- The **left menu** lists the sections. The first, **Card**, holds what is
  not a field - Ask for a reason when moving cards and the Draggable table,
  with its select-all - and the card's own rows. Then Date, Time, Members,
  Labels, Description, Checklists, Subtasks, Attachments, Custom Fields,
  Voting, Planning Poker, Scrum settings and Comments.
- The **right pane** lists every row of the open section, one line each: its
  icon and name, then a **Show on Minicard** cell and a **Show on Card** cell -
  each the board-wide checkbox of that side, the field's position on that side
  and its **up and down arrows** (the Up and Down keys on a focused arrow do the
  same; a row that only modifies another has none).
- Opened from a card, a third cell, **On this card**, says whether this card
  shows the field (the per-card fields only).

A row's name leaves out what its section already says: under **Scrum settings**
the rows are Sprint, Past sprints, Release, Issue type, Acceptance criteria and
Backlog rank.

| Section | Rows |
| --- | --- |
| Card | Ask for a reason when moving cards, Draggable; Card number, Collapse, Parent card, Linked card, Dependencies, Card sorting by number, Show lists, List title, Swimlane, Card buttons, Similar cards |
| Date | Received, Start, Due, End, Mark as complete, Due date from the title, At risk, Forecast |
| Time | Spent time, Flowtime, Pomodoro |
| Members | Members, Assignee, Creator, Requested by, Assigned by, Suggested members |
| Labels | Labels, Labels above the title, Labels text (the board's and your own), Stickers, Location, Card color |
| Description | Description title, Description text, Description badge |
| Checklists | Checklists, Checklist title, Checklist due date, Checklist count, Checklist from description |
| Subtasks | Subtasks |
| Attachments | Cover image, Attachments, Attachment count, Previews, Details, Text notes, Drawing |
| Custom Fields | Custom Fields |
| Voting | Voting question |
| Planning Poker | Planning Poker |
| Scrum settings | Sprint, Past sprints, Release, Issue type, Acceptance criteria, Backlog rank |
| Comments | Comments, Comment count, Unread comments, Activities, Action items |

**On this card**: ticking an empty field shows it on this card, ready to be
filled in; unticking a field hides it from this card, also when it has data -
the data stays, and ticking it again shows it. The choice is the card's own and
is kept with the card; a field whose tick matches what its data would decide
leaves nothing stored.

**+ Add** is shown to whoever may change the card. Its board-wide checkboxes
and arrows work for a board admin; for anybody else they are shown disabled,
and only **On this card** and their own rows (Labels text, List title) change.
Below **+ Add** there is one separator line, above the first section the card
shows: a section the card does not show draws no line of its own.

The popup moves by its title bar (or the drag handle, when drag handles are on)
and has maximize / minimize beside its close button.

## Card actions in their sections

Five actions that were in the opened card's actions menu are in the section
they act on: in the **hamburger** at the end of that section's heading on the
opened card, and - when Card Settings is opened from the card with **+ Add** -
at the top of that section's pane.

| Action | Opened card | Card Settings pane |
| --- | --- | --- |
| Filter: Subtasks | Subtasks hamburger (with the subtask settings) | Subtasks |
| Edit voting | Voting hamburger | Voting |
| Edit Planning Poker | Planning Poker hamburger | Planning Poker |
| Change spent time | Spent time hamburger | Time |
| Card kind | Scrum settings hamburger | Scrum settings |
| Subtask settings | Subtasks hamburger | Subtasks - also from Board Settings, for a board admin |
| Edit custom fields | Custom Fields hamburger | Custom Fields |
| Create Field | Custom Fields hamburger, then Create Field | Custom Fields - also from Board Settings, for a board admin |
| Link fields to another card | Custom Fields hamburger, then Link fields | Custom Fields |

In the Card Settings pane each of these is the **form itself**, right under the
pane's title - not a link to a popup - except Filter: Subtasks, which is an
action. Saved there, Card Settings stays open (a new custom field's form is
emptied for the next one); the hamburger on the opened card still opens the
same form as its own popup.

Everything in a section's hamburger on the opened card is also at the top of
that section's pane in Card Settings, under its title and above Show on
Minicard / Show on Card (`tests/cardSectionActions.test.cjs` fails for a
hamburger that is not).

A section is on the opened card when the field is on in Card Settings and the
card has data in it or shows it **On this card**: tick Voting "On this card" to
get the Voting heading, then its hamburger asks the question. The Scrum fields
the card shows are one section, **Scrum settings**, under one heading, each
field by its own name. Filter: Subtasks is for every reader; the editing
actions are for whoever may change the card.

## Board Settings / Card still decides what a card can show

**Show on Card** and Admin Panel / Settings / Visibility / Features decide what
the cards of a board CAN show. A field turned off there is shown on no card,
whatever the card's data or its own choice.

The rows that are not a field of their own - Collapse, Labels text, Labels
above the title, the attachment previews and details, the count badges, Card
color, Parent and Linked card, and the helpers such as Similar cards, At risk,
Forecast and Due date from the title - change how a shown field looks or help
to fill it. They follow Board Settings / Card alone and have no **On this
card**.

## How it works

`models/lib/cardShownFields.js` holds the rules: what counts as data for each
field, which fields a card shows, and the card's view of the board.
`models/lib/cardSettingsSections.js` holds the popup's sections. The card stores two lists:

| Field | Holds |
| --- | --- |
| `shownFields` | fields shown although empty |
| `hiddenFields` | fields hidden although they have data |

Only the per-card field keys are accepted (`models/cards.js`).

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
| `models/lib/cardShownFields.js` | "Has data", what a card shows, the card's board view |
| `models/lib/cardSettingsSections.js` | The popup's sections, and the row names within them |
| `client/components/sidebar/sidebar.jade` | The popup (`boardCardSettingsPopup`): the left menu, the pane, the rows |
| `client/components/sidebar/sidebar.js` | Its sections, rows, checkboxes, order arrows and On this card |
| `client/components/sidebar/sidebar.css` | The pane's layout |
| `client/components/cards/cardAddFields.js` | "+ Add", and the card's own `currentBoard` |
| `client/components/cards/cardDetails.jade` | The "+ Add" button under the cover, the section hamburgers |
| `client/lib/filterSubtasks.js` | Filter: Subtasks |
| `tests/cardSectionActions.test.cjs` | The five actions in their sections, none left in the actions menu |
| `models/cards.js` | `shownFields`, `hiddenFields` |
| `tests/cardShownFields.test.cjs` | The rules, the wiring, and that no card section template is left out |
| `tests/cardSettingsCoverage.test.cjs` | Every row in a section, a checkbox and a handler for each side |
| `tests/playwright/specs/card-add-fields.e2e.js` | An empty card, "+ Add", a field with data, the popup |
