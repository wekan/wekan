# Card fields: every field the board shows, empty or not

## What it is

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

## Read more

- [Kanban board](https://en.wikipedia.org/wiki/Kanban_board) on Wikipedia -
  the cards whose fields these are.
- [Progressive disclosure](https://en.wikipedia.org/wiki/Progressive_disclosure),
  why a board shows only the fields it uses, and
  [Hamburger button](https://en.wikipedia.org/wiki/Hamburger_button), the
  section menus.
- In WeKan: [Card Settings](Card-Settings.md),
  [Board Settings / Card](../Board-Sidebar/Board-Settings/Card.md),
  [Custom Fields](CustomFields/CustomFields.md),
  [Flow fields](Flow-Fields.md) and
  [Admin Panel / Settings / Features](../Admin-Panel/Settings/Features.md).

## How to use it

1. Open the board's cog menu, **Board Settings**, then **Card** (Card
   Settings).
2. In the **Show on Card** pane, tick the rows of the fields every opened card
   of the board shows, and untick the rest; a section's own checkbox, left of
   its title, shows or hides the whole section.
3. Drag a section or a row to change the order the opened card draws them in.
4. Open a card: it shows every ticked field, empty or not, ready to be filled
   in, in that order. The minicard follows the **Show on Minicard** pane the
   same way.
5. A card's own actions are in the hamburger at the end of a section's
   heading on the opened card (see below).

### What decides what a card shows

| Decides | Where |
| --- | --- |
| Whether a field is shown on the board's cards | its row's checkbox in the **Show on Card** pane |
| In which section, and where in it | the row's section, and its place among that section's rows there |
| In what order the sections are | the order of the sections in the Show on Card pane |
| Whether a whole section (Date, Members, ...) is shown on them | the section's own checkbox, left of its title |
| Whether the administrator offers the field at all | Admin Panel / Settings / Features |

### The card's sections

The opened card is drawn in **Card Settings' sections**, in the order the Show
on Card pane shows them, each headed with the section's icon and title (its
caret collapses it), and the fields of a section in the order of its rows
there - drag a section or a row in Card Settings and the card follows. The
default is Labels, Date, Members, Card, Time, Custom Fields, Voting, Planning
Poker, Description, Scrum settings, Checklists, Subtasks, Attachments,
Comments; [Card Settings](Card-Settings.md) lists where each field is.

Not in the order: the **title bar** (Mark complete, the number, the cover
above it, Collapse, Parent and Linked card, Labels above the title, the card
color), the **activities**, which are the right column of every opened card,
and - on a **maximized** card - the **comments**, which move to the top of
the right column. A section the card has nothing to show for draws no
heading. The minicard follows the Show on Minicard pane the same way, without
headings.

Two things still appear only when there is something to show: **Similar
cards** (in Card), when the board has cards like this one, and the **cover**, when the
card has one (on by default in Board Settings / Card; a new drawing becomes
the cover). **Custom Fields** is on every card the reader may change whose
board shows it: its hamburger is where the fields are added to the card.

### Card Settings

[Card Settings](Card-Settings.md) is Board Settings / Card: two panes, Show on
Minicard and Show on Card, each with the sections as checklists and their rows
as checklist items, the checkboxes that pane's side. Each section has a checkbox of its
own for the whole section; a section with one row is one line; Custom Fields'
items are the board's custom fields with a **+** under them. A hamburger is
drawn only when it has something in it.

A row's name leaves out what its section already says: under **Scrum settings**
the rows are Sprint, Past sprints, Release, Issue type, Acceptance criteria and
Backlog rank.

| Section | Rows |
| --- | --- |
| Labels | Labels, Labels above the title, Labels text (the board's and your own), Stickers, Location, Card color |
| Date | Received, Start, Due, End, Mark as complete, Due date from the title, At risk, Forecast |
| Members | Members, Assignee, Creator, Requested by, Assigned by, Suggested members |
| Card | Ask for a reason when moving cards, Draggable (in its hamburger); Card number, Collapse, Parent card, Linked card, Dependencies, Blocked, Class of service, MoSCoW, WSJF, Card sorting by number, Show lists, Swimlane, Card buttons, Similar cards |
| Time | Spent time, Flowtime, Pomodoro |
| Custom Fields | the board's custom fields, and **+** |
| Voting | Voting question (one line) |
| Planning Poker | Planning Poker (one line) |
| Description | Description title, Description text, Description badge |
| Scrum settings | Sprint, Past sprints, Release, Issue type, Acceptance criteria, Backlog rank |
| Checklists | Checklists, Checklist title, Checklist due date, Checklist count, Checklist from description |
| Subtasks | Subtasks (one line) |
| Attachments | Cover image, Attachments, Attachment count, Previews, Details, Text notes, Drawing |
| Comments | Comments, Comment count, Unread comments, Activities, Action items |

**List title** - a card's own choice to show its list's name - is not in Card
Settings (there is no card there); each card sets it in its own menu.

Board Settings / Card moves by its title bar (or the drag handle, when drag
handles are on) and has maximize / minimize beside its close button.

### Card actions in their sections

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

### The rows that are not a field of their own

Collapse, Labels text, Labels above the title, the attachment previews and
details, the count badges, Card color, Parent and Linked card, and the helpers
such as Similar cards, At risk, Forecast and Due date from the title change how
a shown field looks or help to fill it. They follow Board Settings / Card like
every row.

## How the numbers are calculated

Card fields have no numbers of their own: whether a field is drawn is a yes
or no of the board (and of Admin Panel / Settings / Features), the same for
every card of the board, whatever the card holds. The order is the board's
stored order, else the default section order above
([models/lib/cardSettingsSections.js](../../../models/lib/cardSettingsSections.js)
`DEFAULT_SECTION_ORDER`); the counts a section shows in Card Settings are
described in [Card Settings](Card-Settings.md#how-the-numbers-are-calculated).

## How it works in WeKan

The opened card's templates read the board's flags (`currentBoard.allowsDueDate`
and so on). The opened card and each of its section templates get their own
`currentBoard` helper (`client/components/cards/cardAddFields.js`
`CARD_FIELD_TEMPLATES`): the board as its cards see it
(`models/lib/cardShownFields.js` `boardForCard`), whose flags read false for
the rows of a section hidden whole on Show on Card - the same overlay as Admin
Panel / Settings / Features (`models/lib/cardFieldVisibility.js`), one level
down. It is the same for every card of the board: it does not depend on what
the card holds. The minicard has its own (`boardForMinicard`,
`client/components/cards/minicard.js`). The board itself is never changed. The
Scrum fields the board does not show (Board Settings / Scrum) are left out of
the Scrum settings section the same way, and a section with nothing to show
draws no heading (`client/components/cards/cardDetails.js`
`orderedSectionsOf`, `cardSectionHasContent`).

The legacy fields - `shownFields` / `hiddenFields` on a card,
`cardFieldsAlwaysShown` / `showEmptyCardFields` on a board - stay in the
schema so documents that have them validate; nothing reads or writes them.

### Related files

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

## Commits

 - [Flow fields Blocked, Class of service, MoSCoW and WSJF join the Card section](https://github.com/wekan/wekan/commit/0071dde0f36bb7c8582073a2c072159e15f41ceb)
 - [Card Settings in two panes; the card and the minicard follow their order](https://github.com/wekan/wekan/commit/2bd5d1180a24bde1fb30acfe75617bb4c68f864e)
 - [A checkbox per section, every field always shown, Card Settings only in Board Settings](https://github.com/wekan/wekan/commit/3e5bc58105d32b1ef9e2ed9424e2990b9da95220)
 - [Board Settings / Card uses the same templates as the opened card's Card Settings](https://github.com/wekan/wekan/commit/52de57c844a750e2f4a0fb18d9fd81f04e5a1015)
 - [The Scrum section shows no Scrum field the board has turned off](https://github.com/wekan/wekan/commit/0a224b3ceac5f14a22d5f4794258df9cb53567d4)
 - [Card Settings on the opened card, its sections as checklists](https://github.com/wekan/wekan/commit/c0ec28e82f04fafa1b5bebc52f113aa13ed019c1)
 - [A linked card shows the fields its source card has](https://github.com/wekan/wekan/commit/1f5a7b8220488092ee3ace5ec2d2f5518bc955df)
 - [Show on Card and Show on Minicard lists per section, reordered by drag and drop](https://github.com/wekan/wekan/commit/8224852de15e5c0019e999a8d85d12a1e80fb8e1)
 - [Show empty fields for the board, and the Show empty column](https://github.com/wekan/wekan/commit/1aa9df6075d93679f4781f57c8be605b2e670386)
 - [Show when empty: the fields every card shows even while empty](https://github.com/wekan/wekan/commit/80b936223fb9b20697565a2c26a95da2154fdc2c)
 - [Card actions moved into the opened card's section hamburgers](https://github.com/wekan/wekan/commit/4f20f24201b4b51c07118b1ebd543a774ee4a79f)
 - [The opened card shows only the fields it has data in, and + Add adds the rest](https://github.com/wekan/wekan/commit/6fe0a7ef9427e95b1870f1f6ab72d90d799e94d9)
 - [Every Board Settings / Card row can be shown on the card and the minicard](https://github.com/wekan/wekan/commit/79b44675464d829b8b9ac05d01ec0aad2a8423b0)
 - [Each Scrum field is its own Board Settings / Card row](https://github.com/wekan/wekan/commit/6d950b7474c394b8f2ef08a2a388c5918a66e3d4)
 - [A toggle for every card section and minicard badge, in card order](https://github.com/wekan/wekan/commit/970213010013529150101d3fd6c59f33eab542d4)
 - [Board Settings reorders the opened card's sections](https://github.com/wekan/wekan/commit/131514d6140479aaa8de925774fe226814f507f3)
