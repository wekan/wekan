# Card Settings

## What it is

**Card Settings is Board Settings / Card**: a popup opened from the board's
cog menu (**Board Settings → Card**). It decides what **every opened card**
and **every minicard** of the board shows, and in what order. The opened card
has no Card Settings of its own (until 2026-10-28 it had a **Card Settings**
button under its cover that drew the same thing on the card; it is gone, and
so is **On this card**).

An opened card shows **every field its board shows on cards**, empty or not:
an empty Due, an empty Members, an empty Custom Fields section are drawn,
ready to be filled in ([Card fields](Card-Fields.md)).

## Read more

- [Kanban board](https://en.wikipedia.org/wiki/Kanban_board) on Wikipedia -
  the cards and minicards Card Settings lays out.
- [Checklist](https://en.wikipedia.org/wiki/Checklist),
  [Checkbox](https://en.wikipedia.org/wiki/Checkbox),
  [Accordion (GUI)](https://en.wikipedia.org/wiki/Accordion_(GUI)) and
  [Hamburger button](https://en.wikipedia.org/wiki/Hamburger_button) - the
  pieces the panes are drawn with.
- MDN: [Container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) -
  how the panes go side by side or stacked.
- In WeKan: [Card fields](Card-Fields.md),
  [Board Settings / Card](../Board-Sidebar/Board-Settings/Card.md) and
  [Custom Fields](CustomFields/CustomFields.md).

## How to use it

1. Open the board's cog menu, **Board Settings**, then **Card**. The popup is
   titled **Card Settings** and shows two panes, **Show on Minicard** and
   **Show on Card**.
2. Tick or untick a **row** to show or hide that field on the pane's side,
   for every card of the board. Tick or untick a **section's checkbox** to
   show or hide the whole section on that side.
3. **Drag** a section or a row (by its handle, or by its icon and name when
   drag handles are off) to change the order that side draws them in, or
   focus it and press **Up** / **Down**.
4. Open a **hamburger** where there is one: Card's holds **Ask for a reason
   when moving cards** and the **Draggable** table, Subtasks' the **Subtask
   settings**.
5. Under **Custom Fields**, tick a field for the minicard or for every card,
   open its hamburger to edit it, or click **+** to create one.
6. Drag the **splitter** between the panes, or collapse a pane by its caret,
   to make room. Close the popup; the cards and minicards follow at once.

Only a board admin changes the checkboxes and drags; everybody else sees them
disabled, except their own row (Labels text).

### One section model: Card Settings is what the card and the minicard draw

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

#### The default section order

A board that never dragged a section gets the order its surface drew before,
as far as the grouping allows:

| | Default section order |
| --- | --- |
| Opened card | Labels, Date, Members, Card, Time, Custom Fields, Voting, Planning Poker, Description, Scrum settings, Checklists, Subtasks, Attachments, Comments |
| Minicard | Scrum settings, Date, Time, Labels, Custom Fields, Members, Checklists, Card, Comments, Voting, Planning Poker, Attachments, Subtasks, Description |

#### Where each field of the opened card is

| Section | Fields, in default order |
| --- | --- |
| Labels | Labels, Stickers, Location |
| Date | Received, Start, Due, At risk, End, Forecast |
| Members | Members, Assignee, Creator, Requested by, Assigned by |
| Card | Dependencies, Blocked, Class of service, MoSCoW, WSJF, Card sorting by number, List (and Swimlane under it), Card buttons, Similar cards |
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

### Top to bottom

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

### The checkboxes

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

### A section with one row is one line

A section that has exactly **one row** on the pane's side - Subtasks, Voting,
Planning Poker - is drawn as **one line**: one checkbox, its name, and the
section's hamburger when it has one. No caret, no count, no item under it. It
still drags as a section.

Its checkbox reads **this field is shown on this side**: ticked when the
row's own flag is on and the section is not hidden. Clicking it sets the
row's own flag (through the row's own checkbox, kept in the line out of
sight); turning it on also shows the section again if it was hidden whole.

### Custom Fields

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

### Hamburgers

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

### Drag and drop, collapse

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

## How the numbers are calculated

- **A section's count `n/m`** ([client/components/sidebar/sidebar.js](../../../client/components/sidebar/sidebar.js)):
  `m` is the number of the section's rows on that pane's side (for Custom
  Fields, the board's custom fields), and `n` how many of them are ticked.
  A field the administrator turned off in Admin Panel / Settings / Features
  is not counted. The count stays while the section is hidden whole.
- **The splitter** ([models/lib/cardSettingsSplit.js](../../../models/lib/cardSettingsSplit.js)):
  the Minicard pane's share of the width, a fraction from 0 to 1, starts at
  **0.5** (`DEFAULT_SPLIT`, half and half - a double-click goes back to it).
  Neither pane is narrower than **16em** (`MIN_PANE_EM`); when the two
  minimums do not fit, it is half and half. An arrow key moves it **0.05**
  (`KEY_STEP`, 5 % of the width), Home and End to the narrowest and widest
  Minicard pane. It is stored rounded to three decimals
  (`profile.cardSettingsSplit`), and `aria-valuenow` is the share in percent.
- **Side by side or stacked**: the panes go side by side when the popup's
  content is at least **40em** wide (the `card-settings-panes` container
  query in [client/components/cards/cardAddFields.css](../../../client/components/cards/cardAddFields.css)),
  about 20em per pane.
- **The popup's width** is `min(96vw, 1100px)`
  ([client/components/main/popup.css](../../../client/components/main/popup.css),
  mirrored as `CARD_SETTINGS_MAX_WIDTH` in
  [client/lib/popupOffset.js](../../../client/lib/popupOffset.js)).

## How it works in WeKan

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

## Commits

 - [Flow fields Blocked, Class of service, MoSCoW and WSJF in the Card section](https://github.com/wekan/wekan/commit/0071dde0f36bb7c8582073a2c072159e15f41ceb)
 - [Two panes; the card and the minicard follow their order; hamburgers open inline](https://github.com/wekan/wekan/commit/2bd5d1180a24bde1fb30acfe75617bb4c68f864e)
 - [Hamburger menus open next to their button](https://github.com/wekan/wekan/commit/9c9742e09d743bbdabc451e23a51c6d12a4d0560)
 - [A checkbox per section, every field always shown, only in Board Settings](https://github.com/wekan/wekan/commit/3e5bc58105d32b1ef9e2ed9424e2990b9da95220)
 - [Board Settings / Card uses the same templates as the opened card's Card Settings](https://github.com/wekan/wekan/commit/52de57c844a750e2f4a0fb18d9fd81f04e5a1015)
 - [Sections drawn as checklists](https://github.com/wekan/wekan/commit/c0ec28e82f04fafa1b5bebc52f113aa13ed019c1)
 - [A Show on Card and a Show on Minicard list per section, reordered by drag and drop](https://github.com/wekan/wekan/commit/8224852de15e5c0019e999a8d85d12a1e80fb8e1)
 - [Ask for a reason and Select all / Select none as Draggable's buttons](https://github.com/wekan/wekan/commit/37b3c8f599304768dc4d9fd9676fd85b1d83e6e9)
 - [Select all and Select none per column, labels whole](https://github.com/wekan/wekan/commit/c8a15b514ff5f17c4de7e2d93725c83c41a6b194)
 - [Opens on Card, with Show empty fields and the Show empty column](https://github.com/wekan/wekan/commit/1aa9df6075d93679f4781f57c8be605b2e670386)
 - [Create Field and Link fields to another card as forms in the pane](https://github.com/wekan/wekan/commit/f33987931f1f4ffa0a3d1fc9c7e609e315bf2e7e)
 - [Card first, Subtasks and Planning Poker as sections of their own](https://github.com/wekan/wekan/commit/c69f3fe25a0db118bdf258370ded4a330f7e0ffa)
 - [Board Settings / Card and the opened card's + Add are one popup](https://github.com/wekan/wekan/commit/20e2273c075e376b983a5afce5fdc65da6fb98d9)
 - [Rows of Board Settings / Card reordered by drag and drop](https://github.com/wekan/wekan/commit/2d80e6e4ee4afec3dff380e53fa90f419af450f2)
 - [The default card and minicard field order is the order they had before](https://github.com/wekan/wekan/commit/859771a10ece44f1c48c371d182b4c079c84faad)
 - [One Card field order heading over two lists](https://github.com/wekan/wekan/commit/15b2b6c5339979341d8237aa592ae37a5fd0607d)
