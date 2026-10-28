# Card fields: every field the board shows, empty or not

An opened card shows **every field its board shows on cards** - Board
Settings / Card's **Show on Card** checkbox of the field's row - **empty or
not**. An empty Due date, an empty Members, an empty Custom Fields section are
drawn on every card of a board that shows them, ready to be filled in. A field
the board does not show is on no card, whatever the card holds.

Until 2026-10-28 an opened card showed only the fields it had data in, plus
what the board's **Show empty** column, Card's **Show empty fields** and the
card's own **On this card** added. All three are gone, and the opened card has
no **Card Settings** button any more: what the cards of a board show is set in
one place, [Card Settings](Card-Settings.md) - **Board Settings / Card**.

## What decides what a card shows

| Decides | Where |
| --- | --- |
| Whether a field is shown on the board's cards | its row's checkbox with **Show on Card** chosen |
| Whether a whole section (Date, Members, ...) is shown on them | the section's own checkbox, left of its title |
| Whether the administrator offers the field at all | Admin Panel / Settings / Visibility / Features |

Two sections still appear only when there is something to show: **Similar
cards**, when the board has cards like this one, and the **cover**, when the
card has one (on by default in Board Settings / Card; a new drawing becomes
the cover). **Custom Fields** is on every card the reader may change whose
board shows it: its hamburger is where the fields are added to the card.

## Card Settings

[Card Settings](Card-Settings.md) is Board Settings / Card: **Show**, then the
sections as checklists, their rows as checklist items, Show on Minicard / Show
on Card choosing what the checkboxes are. Each section has a checkbox of its
own for the whole section; a section with one row is one line; Custom Fields'
items are the board's custom fields with a **+** under them. A hamburger is
drawn only when it has something in it.

A row's name leaves out what its section already says: under **Scrum settings**
the rows are Sprint, Past sprints, Release, Issue type, Acceptance criteria and
Backlog rank.

| Section | Rows |
| --- | --- |
| Card | Ask for a reason when moving cards, Draggable (in its hamburger); Card number, Collapse, Parent card, Linked card, Dependencies, Card sorting by number, Show lists, Swimlane, Card buttons, Similar cards |
| Date | Received, Start, Due, End, Mark as complete, Due date from the title, At risk, Forecast |
| Time | Spent time, Flowtime, Pomodoro |
| Members | Members, Assignee, Creator, Requested by, Assigned by, Suggested members |
| Labels | Labels, Labels above the title, Labels text (the board's and your own), Stickers, Location, Card color |
| Description | Description title, Description text, Description badge |
| Checklists | Checklists, Checklist title, Checklist due date, Checklist count, Checklist from description |
| Subtasks | Subtasks (one line) |
| Attachments | Cover image, Attachments, Attachment count, Previews, Details, Text notes, Drawing |
| Custom Fields | the board's custom fields, and **+** |
| Voting | Voting question (one line) |
| Planning Poker | Planning Poker (one line) |
| Scrum settings | Sprint, Past sprints, Release, Issue type, Acceptance criteria, Backlog rank |
| Comments | Comments, Comment count, Unread comments, Activities, Action items |

**List title** - a card's own choice to show its list's name - is not in Card
Settings (there is no card there); each card sets it in its own menu.

Board Settings / Card moves by its title bar (or the drag handle, when drag
handles are on) and has maximize / minimize beside its close button.

## Card actions in their sections

Actions that were in the opened card's actions menu are in the section they
act on, in the **hamburger** at the end of that section's heading on the
opened card:

| Action | Opened card |
| --- | --- |
| Filter: Subtasks | Subtasks hamburger (with the subtask settings) |
| Edit voting | Voting hamburger |
| Edit Planning Poker | Planning Poker hamburger |
| Change spent time | Spent time hamburger |
| Card kind | Scrum settings hamburger |
| Subtask settings | Subtasks hamburger - also in Card Settings' Subtasks hamburger, for a board admin |
| Edit custom fields | Custom Fields hamburger |
| Create Field | Custom Fields hamburger, then Create Field - also Card Settings' **+** under Custom Fields |
| Link fields to another card | Custom Fields hamburger, then Link fields |

Each opens its own popup. A card's own actions are on the card; Card Settings,
which is about every card of the board, has only the board's
(`tests/cardSectionActions.test.cjs`). Filter: Subtasks is for every reader;
the editing actions are for whoever may change the card.

## The rows that are not a field of their own

Collapse, Labels text, Labels above the title, the attachment previews and
details, the count badges, Card color, Parent and Linked card, and the helpers
such as Similar cards, At risk, Forecast and Due date from the title change how
a shown field looks or help to fill it. They follow Board Settings / Card like
every row.

## How it works

The opened card's templates read the board's flags (`currentBoard.allowsDueDate`
and so on). The opened card and each of its section templates get their own
`currentBoard` helper (`client/components/cards/cardAddFields.js`
`CARD_FIELD_TEMPLATES`): the board as its cards see it
(`models/lib/cardShownFields.js` `boardForCard`), whose flags read false for
the rows of a section hidden whole on Show on Card - the same overlay as Admin
Panel / Visibility / Features (`models/lib/cardFieldVisibility.js`), one level
down. It is the same for every card of the board: it does not depend on what
the card holds. The minicard has its own (`boardForMinicard`,
`client/components/cards/minicard.js`). The board itself is never changed. The
Scrum fields, which are sections of their own, are left out of the card's
section order the same way.

The legacy fields - `shownFields` / `hiddenFields` on a card,
`cardFieldsAlwaysShown` / `showEmptyCardFields` on a board - stay in the
schema so documents that have them validate; nothing reads or writes them.

## Related files

| File | What it is |
| --- | --- |
| `models/lib/cardShownFields.js` | The card's and the minicard's board view, `boardAllows` |
| `models/lib/cardSettingsSections.js` | Card Settings' sections, the row names within them, which sections are hidden per side |
| `models/lib/cardSettingsCustomFields.js` | Custom Fields' items in Card Settings |
| `client/components/sidebar/sidebar.jade`, `sidebar.js` | Card Settings (`boardCardSettingsPopup`, `cardSettingsInline`) |
| `client/components/sidebar/sidebar.css`, `client/components/cards/cardAddFields.css` | A row's line; the checklist look |
| `client/components/cards/cardAddFields.js` | The opened card's own `currentBoard` |
| `client/components/cards/cardDetails.jade` | The opened card, its section hamburgers |
| `client/lib/filterSubtasks.js` | Filter: Subtasks |
| `tests/cardShownFields.test.cjs` | The rule, the wiring, and that no card section template is left out |
| `tests/cardFieldsAlwaysShown6806.test.cjs` | #6806 met by the rule; Show empty and Show empty fields gone |
| `tests/cardSettingsSectionShown.test.cjs` | The section checkbox, one-line sections, the views |
| `tests/cardSectionActions.test.cjs` | The actions in their sections, none left in the actions menu |
| `tests/cardSettingsCoverage.test.cjs` | Every row in a section, a checkbox and a handler for each side |
| `tests/playwright/specs/card-add-fields.e2e.js` | An empty card, Card Settings, the section checkbox, Custom Fields |
| `docs/Features/Cards/Card-Settings.md` | Card Settings |
