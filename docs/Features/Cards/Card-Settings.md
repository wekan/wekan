# Card Settings

**Card Settings is Board Settings / Card**: a popup opened from the board's
cog menu (**Board Settings → Card**). It decides what **every opened card**
and **every minicard** of the board shows, and in what order. The opened card
has no Card Settings of its own (until 2026-10-28 it had a **Card Settings**
button under its cover that drew the same thing on the card; it is gone, and
so is **On this card**).

An opened card shows **every field its board shows on cards**, empty or not:
an empty Due, an empty Members, an empty Custom Fields section are drawn,
ready to be filled in ([Card fields](Card-Fields.md)).

## One section model: Card Settings is what the card and the minicard draw

The **opened card** and the **minicard** draw exactly Card Settings'
sections, in the order Card Settings shows them, and each section's fields in
the order of its rows (since 2026-10-28):

- **The order of the sections is per side.** The Card pane's order is the
  opened card's (`cardSettingsSectionOrder`), the Minicard pane's the
  minicard's (`minicardSettingsSectionOrder`). Dragging a section in one pane
  reorders that surface only.
- **The order inside a section** is the side's row order (`cardFieldOrder`,
  `minicardFieldOrder`). Dragging a row reorders that field on that surface,
  within its section; it cannot leave its section.
- **The opened card** heads every section with the section's icon and title,
  and each heading collapses its section. A section the card has nothing to
  show for (its rows all off, or hidden whole) draws no heading. Fixed, and not
  in the order: the card's **title bar** (Mark complete, the number, the cover
  above it, Collapse, Parent and Linked card, Labels above the title, the card
  color), the **activities** (the right column), and on a **maximized** card
  the **comments**, which move to the top of the right column.
- **The minicard** has no headings - it is compact - only the grouping and the
  order. Fields that share a container still do: consecutive dates are one
  dates line (Date and Time together, as Spent time always was), consecutive
  badges one badge strip. The title row and the cover under it are fixed.

### The default section order

A board that never dragged a section gets the order its surface drew before,
as far as the grouping allows:

| | Default section order |
| --- | --- |
| Opened card | Labels, Date, Members, Card, Time, Custom Fields, Voting, Planning Poker, Description, Scrum settings, Checklists, Subtasks, Attachments, Comments |
| Minicard | Scrum settings, Date, Time, Labels, Custom Fields, Members, Checklists, Card, Comments, Voting, Planning Poker, Attachments, Subtasks, Description |

### Where each field of the opened card is

| Section | Fields, in default order |
| --- | --- |
| Labels | Labels, Stickers, Location |
| Date | Received, Start, Due, At risk, End, Forecast |
| Members | Members, Assignee, Creator, Requested by, Assigned by |
| Card | Dependencies, Card sorting by number, List (and Swimlane under it), Card buttons, Similar cards |
| Time | Spent time, Flowtime, Pomodoro |
| Custom Fields | the card's custom fields |
| Voting, Planning Poker | the question, the votes |
| Description | its title (the heading), the text |
| Scrum settings | Sprint, Past sprints, Release, Work item type, Acceptance criteria, Backlog rank |
| Checklists | the count of finished items, the checklists |
| Subtasks | the subtasks |
| Attachments | the attachments, the text notes |
| Comments | the comments |

Before, the card had groups of its own (a "Sort" group with the list and the
timers, Dependencies and Text notes as sections of their own, a fixed tail of
checklists ... comments). A stored order from before keeps meaning what it
can: each field keeps its relative order inside its new section, and the old
group keys (`dates`, `sort`, `voteAndPoker`, the minicard's `badges` ...)
stand for their fields (`models/lib/cardFieldOrder.js`).

## Top to bottom

```
Card Settings                                            [□] [X]   <- the popup's header
▾ Show on Minicard                  ┃ ▾ Show on Card
▾ ⠿ [x] Scrum settings     0/6     ┃ ▾ ⠿ [x] Labels              3/7
▾ ⠿ [x] Date               2/8     ┃       [x] Labels
      [x] Received                 ┃       ...
      ...                          ┃ ▾ ⠿ [x] Date                4/8
...                                ┃ ...
```

Board Settings / Card shows **both sides at once**, as two **panes**:

- the **Minicard pane** first - on the left in a left-to-right page, on the
  right in a right-to-left one - and the **Card pane** after it;
- **side by side** when the popup is wide enough for two panes (about 20em
  each), **stacked** - Minicard above Card - when it is not. That follows the
  popup's own width (a container query), so a popup made narrower by its
  corner grip stacks too;
- each pane has a header line: the **caret** at its top start, which
  collapses the whole pane (only its header stays, and side by side the other
  pane takes the width), and its title, Show on Minicard or Show on Card. A
  collapsed pane is the user's own, kept per board;
- side by side, **each pane scrolls on its own**; stacked, the two scroll
  together;
- between them, side by side and with neither collapsed, a **splitter**:
  dragged like the edge between two spreadsheet columns (mouse, touch or pen),
  it changes the Minicard pane's width and the Card pane takes the rest;
  neither goes below about 16em. Focused, the Left and Right arrow keys move
  it a step, Home and End to the narrowest and widest Minicard pane, and a
  double-click puts it back to half and half. The split is the user's own
  (`profile.cardSettingsSplit`), kept as a share of the width, so it survives
  a different popup width;
- the popup is window-tall and centred, about twice as wide as one pane, and
  can be **moved**, **maximized** and **resized** by the grip in its bottom
  corner (the end corner: bottom-right left to right, bottom-left right to
  left); the panes follow its new size.

In each pane, the **sections** - Labels, Date, Members, Card, Time, Custom
Fields, Voting, Planning Poker, Description, Scrum settings, Checklists,
Subtasks, Attachments and Comments - are drawn like the card's
**checklists**, in that side's order:

- the section is the **checklist's title**: its caret, its drag handle, a
  **checkbox** of its own, its name, how many of its rows are ticked
  (`2/8`) and - only when it has something in it - a **hamburger**;
- its rows are the **checklist items**: a **checkbox**, the row's name and,
  when it has anything in it, its own **hamburger**.

A section with no row on a pane's side is left out of that pane, except Card,
whose hamburger holds what is not a field.

## The checkboxes

**A row's checkbox** says whether that field is **visible on the pane's
side**, for every card of the board: in the Card pane it is the board's Show
on Card, in the Minicard pane the board's Show on Minicard.

**A section's checkbox**, left of its title, says whether the **whole
section** is shown on the pane's side at all:

- Unticked in the **Card** pane, the section is missing from every opened
  card of the board, whatever its rows are ticked; unticked in the
  **Minicard** pane, from every minicard. The two sides are independent.
- The rows **keep their own ticks** while their section is hidden (drawn
  faded), so ticking the section back shows exactly what was shown before.
- The count `n/m` stays.

The board stores the hidden sections of each side, `cardSettingsHiddenOnCard`
and `cardSettingsHiddenOnMinicard` (lists of section ids), written by
`board.setCardSettingsSectionShown(side, sectionId, shown)`.

Every checkbox is a board admin's: for anybody else it is shown disabled,
except their own row (Labels text).

## A section with one row is one line

A section that has exactly **one row** on the pane's side - Subtasks, Voting,
Planning Poker - is drawn as **one line**: one checkbox, its name, and the
section's hamburger when it has one. No caret, no count, no item under it. It
still drags as a section.

Its checkbox reads **this field is shown on this side**: ticked when the
row's own flag is on and the section is not hidden. Clicking it sets the
row's own flag (through the row's own checkbox, kept in the line out of
sight); turning it on also shows the section again if it was hidden whole.

## Custom Fields

Custom Fields' items are the **board's custom fields** themselves, in their
order (`sort`, the order the card and the minicard draw them in):

| Pane | An item's checkbox is the custom field's |
| --- | --- |
| Minicard | **Show on minicard** (`showOnCard`, the legacy name of what the minicard reads) |
| Card | **Add to all cards** (`alwaysOnCard`): the opened card draws the custom fields the CARD carries, and this puts the field on every card of the board |

Unticking Show on Card stops the field being added to cards; a card that
already carries it keeps it until it is taken off that card in its own Custom
Fields hamburger, because a card may carry a field it was given on its own.

- An item's **hamburger** opens the custom field's edit form, the board
  sidebar's own, under the item; saving it closes the form and Card Settings
  stays open.
- Items are **dragged** within Custom Fields only - by the handle with drag
  handles on, by the icon and name with them off; Up and Down move one step.
  That writes each custom field's `sort`, so the card's and the minicard's
  order follow.
- Under the items, also when there are none, **+** opens the board's Create
  Field form under it; saved, the new field is the last item and the form
  closes.
- The **section's checkbox** is the board's Custom Fields flag of the pane's
  side (`allowsCustomFields` / `allowsCustomFieldsOnMinicard`, the row that
  was its only item) and, as for a one-row section, ticking it also shows the
  section again if it was hidden whole. So there is no "Custom Fields >
  Custom Fields" line.

The +, the checkboxes and the hamburgers are a board admin's; anybody else
sees no + and disabled checkboxes.

## Hamburgers

A hamburger is drawn **only when it has something in it**.

What a hamburger holds opens **under its line, inside the pane** - an
accordion, not a popup: under the section's title line for a section's
hamburger, under the row (or the custom field, or the +) for theirs - and
pushes what is below it down. The open hamburger **shows it is open**: it is
tinted, `aria-expanded="true"`, and the panel hangs from it in the same tint
with a notch pointing up at it. One is open at a time in a pane: another
hamburger closes it, and so do its own hamburger again, the panel's X, and
Escape (which closes the panel, not Card Settings). A checkbox in a panel is
handled once, by the pane.

| Hamburger | Holds |
| --- | --- |
| A row's | Labels text's way back to the board's default, while the user overrides it. Every other row has none. |
| Card's | **Ask for a reason when moving cards**, and the **Draggable** table. |
| Subtasks' | the **Subtask settings** themselves, for a board admin. |
| Any other section's | nothing - so no hamburger. |

What a card does with its own fields - Filter: Subtasks, Edit voting, Card
kind, Edit custom fields, Link fields - is in that card's own section
hamburgers on the opened card, not here.

Removed on 2026-10-28: **On this card** and **Show empty** (a row's
hamburger), **Show empty fields** (Card's), and **Select all / Select none**
(every section's). Empty fields are always shown, and a section has its own
checkbox.

## Drag and drop, collapse

What a section or a row is dragged by follows the member's **drag handles**
setting, as checklists do:

| Drag handles | Dragged by | The rest of the line |
| --- | --- | --- |
| On | the handle only | scrolls the page, as a touch there means to |
| Off | the icon and name (a section: its title) | - |

- A **section** is dragged above or below another, as a checklist is, in
  its pane. The order is the board's and per side (`cardSettingsSectionOrder`
  for the Card pane, `minicardSettingsSectionOrder` for the Minicard pane),
  so every member sees the sections - and the opened card or the minicard
  draws them - in it; a section added to WeKan later appears in its default
  place.
- A **row** is dragged within its section, as a checklist item is. That moves
  the field on the pane's side: the card's order in the Card pane, the
  minicard's in the Minicard pane - inside that section on the card or the
  minicard too.
- A row **cannot move to another section**: the sections are unrelated kinds
  of fields. Dropped on another section, it goes back where it was, and
  nothing is saved.
- The **Up** and **Down** keys on a focused section title or row name move it
  one step.
- Only a board admin drags.
- The caret before a section's title **collapses** and expands it, as a
  checklist's caret does. Collapsed sections are the user's own, kept per
  board and per pane.

## How it works

| File | What it is |
| --- | --- |
| `client/components/sidebar/sidebar.jade` | `boardCardSettingsPopup`: two `+cardSettingsInline(side=...)` panes and the splitter; `cardSettingsInlineSection`, `cardSettingsInlinePanel` (a hamburger's panel) |
| `client/components/sidebar/sidebar.js` | The panes (`setUpCardSettingsInline`, `paneCollapseKey`), the splitter (`boardCardSettingsPopup` onRendered), the sections (`inlineSectionsOf`, `single`, `customFieldItems`), the rows (`sectionRowsOf`), the panels (`togglePanel`, `openPanel`), the handlers (`cardSettingsEvents`, wrapped once for the pane), the drags (`reorderOnDrop`, `ownListOnly`, `placeSectionOrder(ids, side)`) |
| `client/components/cards/cardAddFields.css` | The checklist look, the panes and their container query, the splitter, the panels |
| `client/components/main/popup.css`, `client/lib/popupOffset.js` | The popup's width (1100px), the panes filling it, the corner grip's strip |
| `models/lib/cardSettingsSections.js` | The sections, their default order per side (`DEFAULT_SECTION_ORDER`), their stored order (`sectionOrder`, `sectionOrderOf`, `SECTION_ORDER_FIELD`), a section's fields on a side (`sectionFieldsOn`), and whether one is shown: `hiddenSectionsOf`, `sectionShown`, `hiddenSectionsAfter`, `rowKeysHiddenBySections`, `isSingleRowSection`, `singleLineChecked` |
| `models/lib/cardFieldOrder.js` | `CARD_LAYOUT`, `MINICARD_LAYOUT`: each side's fields per Card Settings section, the fixed head and tail, and the old keys a stored order may hold |
| `models/lib/minicardGroups.js` | The minicard's dates line, badge strips and blocks |
| `models/lib/cardSettingsSplit.js` | The splitter's arithmetic |
| `models/lib/cardSettingsCustomFields.js` | Custom Fields' items: their order, their checkbox per side, their new `sort` after a drop |
| `models/lib/cardShownFields.js` | `boardForCard` / `boardForMinicard`: the board as its cards / minicards see it, the rows of hidden sections reading false |
| `client/components/cards/cardDetails.jade`, `cardDetails.js` | The opened card's sections (`orderedSectionsOf`, `cardSectionHasContent`, the `ordered*Fields` helpers) |
| `client/components/cards/minicard.jade`, `minicard.js` | The minicard's sections (`minicardGroups`) |
| `client/components/cards/cardAddFields.js` | `cardBoardView`, `CARD_FIELD_TEMPLATES`: the opened card's templates read that view |
| `models/boards.js` | `cardSettingsSectionOrder`, `minicardSettingsSectionOrder`, `cardSettingsHiddenOnCard`, `cardSettingsHiddenOnMinicard`, `setCardSettingsSectionOrder(order, side)`, `setCardSettingsSectionShown` |
| `tests/cardSectionsOnCard.test.cjs`, `tests/minicardSections.test.cjs`, `tests/cardSettingsSplit.test.cjs`, `tests/cardSettingsInlinePanels.test.cjs`, `tests/cardSettingsSectionShown.test.cjs`, `tests/cardSettingsCustomFields.test.cjs`, `tests/cardSettingsOnCard.test.cjs` | The rules, the layout, the handlers, the panes, the panels |
| `tests/playwright/specs/card-add-fields.e2e.js`, `tests/playwright/specs/card-settings-sections-order.e2e.js` | The popup, the panes, the checkboxes, the hamburgers, Custom Fields, the drag and collapse; the card and the minicard following Card Settings |

Card Settings itself reads the board as it is - its checkboxes show each
row's own flag even while its section is hidden; only the opened card and the
minicard read the side's view.
