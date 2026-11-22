# Card field display order

## What it is

Choose what the opened card and the minicard show, and in what order - each
of the two independently (#4448, #6688). Useful when a board relies mostly on
Description or Custom Fields and wants that section first, right under the
card title, or wants the minicard to lead with its due date rather than its
labels.

This is [Card Settings](../../Cards/Card-Settings.md) - the only place it is:
the opened card has no Card Settings of its own. It has two panes, side by
side when there is room (stacked otherwise): **Show on Minicard** first, what
every minicard shows, and **Show on Card**, what every opened card of the
board shows - every field ticked, empty or not. In each the sections (Labels,
Date, Members, Card, Time, ... Scrum settings, Checklists, Subtasks,
Attachments, Comments) are checklists - a section is a checklist's title with
a checkbox of its own, its fields the items.

**What Card Settings shows is what the card and the minicard draw**: the
opened card draws these sections, in the Show on Card pane's order, each with
its heading, and each section's fields in the order of its rows there; the
minicard does the same for the Show on Minicard pane, without headings.

## Read more

- [Wikipedia: Kanban board](https://en.wikipedia.org/wiki/Kanban_board), whose
  cards these are
- [Card Settings](../../Cards/Card-Settings.md)
- [Flow fields](../../Cards/Flow-Fields.md)
- [Helpers that need no AI](../../General/Assistants/Assistants.md)
- Issues [#4448](https://github.com/wekan/wekan/issues/4448) and
  [#6688](https://github.com/wekan/wekan/issues/6688), the requests

## How to use it

### Where to find it

**Board sidebar (hamburger menu) → Board Settings → Card**.

| part | what it does |
| --- | --- |
| the two panes | the minicard's (first) and the opened card's: each pane's checkboxes, order and drags are that side's; each collapses by the caret at its top and scrolls on its own; the splitter between them sets their widths |
| a row's checkbox | whether that side shows the field at all - the same board toggles as before (`allowsLabels`, `allowsLabelsOnMinicard`, ...) |
| a section's checkbox | whether that side shows the whole section at all (`cardSettingsHiddenOnCard`, `cardSettingsHiddenOnMinicard`); the rows keep their ticks |
| a one-row section | one line: one checkbox - the field's own - its name, its hamburger (Subtasks, Voting, Planning Poker) |
| Custom Fields | its items are the board's custom fields - Show on Card is *add to all cards*, Show on Minicard is *show on minicard* - dragged to reorder, **+** to create one |
| a row's hamburger | only Labels text's way back to the board's default, while overridden; no other row has one |
| a section's hamburger | Card: Ask for a reason when moving cards and the Draggable table; Subtasks: the Subtask settings; no other section has one. A hamburger opens under its line, not in a popup |
| drag and drop | move a field earlier or later **on the pane's side only**, within its section; move a whole section above or below another - on that side only |

What is dragged follows the member's drag handles setting: with drag handles
on, only the handle - the rest of the row scrolls the page; with them off,
the icon and name. Up and Down on a focused handle or name move it one row. A
field cannot move to another section: dropped there, it goes back where it
was and nothing is saved.

Removed on 2026-10-28: the opened card's **Card Settings** button, **On this
card**, **Show empty**, **Show empty fields** and the hamburgers' **Select
all / Select none**. Every opened card shows every field its board shows,
empty or not.

The minicard order and the card order are independent, the sections' order
as well as the fields': a field can be third on the minicard and last on the
card, and Description can be the minicard's first section and the card's last.

### Steps to use it

1. Open a board you are an admin of, click the sidebar's hamburger menu,
   then **Board Settings → Card**.
2. Use the **Show on Card** pane for the opened card, the **Show on
   Minicard** pane for the minicard.
3. Drag a field within its section to move it on that side, or a section to
   move the whole section on that side.
4. The change takes effect immediately on every card of this board; there
   is no separate save step.
5. Untick a checkbox to hide the field on that side; tick it to show it.
   Untick a section's checkbox to hide the whole section on that side.

A row that cannot move (see below) is not dragged. A dropped row goes right
after the row now above it in the side's whole order (or right before the row
below it, at the top).

Somebody who is not a board admin may open it too: the board's rows are
disabled for them, and they may still set the one personal row, **Labels
text**, which is stored on their own profile.

## How the numbers are calculated

- **The two panes' widths**
  ([models/lib/cardSettingsSplit.js](../../../../models/lib/cardSettingsSplit.js)):
  what is kept is the Minicard pane's share of the width, a fraction, kept per
  user; the Card pane takes the rest. They start half and half (0.5), and a
  double-click on the splitter goes back to that. Neither pane is narrower than
  16 em; when the two minimums do not fit, the split is half and half. An arrow
  key moves the splitter 5% of the width, Home makes the Minicard pane as
  narrow and End as wide as allowed.
- **A dropped row** goes right after the row now above it in the side's whole
  order, or right before the row below it at the top (`moveKey` in
  [models/lib/cardFieldOrder.js](../../../../models/lib/cardFieldOrder.js)).
- **Defaults**: every helper that needs no AI is on except the minicard's
  forecast, which shows the 85 % date; the four flow fields are off until
  turned on.

## How it works in WeKan

### What moves, and how

Both the card and the minicard are a fixed **head** and Card Settings'
**sections** (since 2026-10-28; `models/lib/cardFieldOrder.js` `CARD_LAYOUT`,
`MINICARD_LAYOUT`).

**On the opened card:**

- *Head, fixed:* the title bar - Mark as complete, Card number, the cover
  above it (and the rows that only change it: Collapse, Parent card, Linked
  card, Labels above the title, Card color).
- *Sections, in the Show on Card pane's order:* Labels (Labels, Stickers,
  Location), Date (Received, Start, Due, End; At risk follows Due, Forecast
  End), Members (Members, Assignee, Creator, Requested by, Assigned by), Card
  (Dependencies, Sort number, Show lists with Swimlane, Card buttons, Similar
  cards), Time (Spent time, Flowtime, Pomodoro), Custom Fields, Voting,
  Planning Poker, Description (title, text), Scrum settings, Checklists
  (count, checklists), Subtasks, Attachments (attachments, text notes),
  Comments.
- *Fixed outside them:* the attachment count is on the Attachments heading;
  the Activities are the right column of every opened card; on a maximized
  card the Comments move to the top of the right column.

**On the minicard:** the title row and the cover under it are fixed; the
sections follow in the Show on Minicard pane's order, with no headings. What
shares a container still does: the dates of Date and Time are one dates line
(At risk and Forecast are badges in it), and badges next to each other - of
one section or of neighbouring ones - one badge strip
(`models/lib/minicardGroups.js`).

Moving a field follows two rules:

1. **A field moves within its section.** *Start* dropped below *Due* goes
   after it, on that side.
2. **A field cannot leave its section**; dropped on another, it goes back.
   **Description title** is the Description heading on the card, so it
   always stays first there.

A few rows have no element of their own on a side - *Labels text* (how
labels are drawn), *List title* (the per-card switch under *Show lists*),
*Description title* and *Unread comments* on the minicard ... - so they sit
under the row they modify and are not dragged.

### The default order

The default - what a board that never touched the popup shows, and where any
field a stored order does not name goes - keeps the order the card and the
minicard had **before fields became orderable** (the templates at commit
`59f7d61df`, right before #4448's first commit, read top to bottom) as far as
Card Settings' sections allow: each section where its first field was, its
fields in their old order.

**Card sections:** Labels, Date, Members, Card, Time, Custom Fields, Voting,
Planning Poker, Description, Scrum settings, Checklists, Subtasks,
Attachments, Comments.

**Minicard sections:** Scrum settings, Date, Time, Labels, Custom Fields,
Members, Checklists, Card, Comments, Voting, Planning Poker, Attachments,
Subtasks, Description.

What moved: on the card, the card buttons and the similar cards are in Card,
the timers in Time, Text notes in Attachments, the checklists ... comments
are sections in the order instead of a fixed tail, and At risk is under Due;
on the minicard, the cover is under the title, and the badges sit in their
sections. A stored order from before keeps each field's relative order inside
its section. `tests/cardFieldOrderDefaultIsPreFeatureOrder.test.cjs` and
`tests/cardSectionsOnCard.test.cjs` pin both.

### The helpers that need no AI

Seven rows turn the [helpers that need no AI](../../General/Assistants/Assistants.md)
on and off for this board. For them *Show on Card* and *Show on Minicard* mean
where the helper works:

| Row | Show on Minicard | Show on Card |
| --- | --- | --- |
| [Due date from title](../../Cards/Dates/Due-Date-From-Title.md) | the add-card form | renaming the opened card |
| [Similar cards](../../Cards/Similar-Cards.md) | the hint in the add-card form | the section in the opened card |
| [At risk](../../Cards/At-Risk.md) | the triangle | the reasons line |
| [Suggested members](../../Cards/Suggested-Members.md) | - | the Members and Assignees popups |
| [Forecast](../../Cards/Dates/Forecast.md) | the 85 % date, off by default | the forecast line |
| [Checklist from description](../../Cards/Checklist-From-Description.md) | - | From description in Checklists |
| [Action items](../../Cards/Action-Items.md) | - | the comment and card menu entries |

All are on by default except the minicard's forecast.

### The flow fields

The Card section also has four Kanban and Scrum fields, each a row with its
Show on Minicard and Show on Card checkboxes, off until turned on:
**Blocked** (with a reason), **Class of service**, **MoSCoW priority** and
**WSJF score**. Admin Panel can hide any of them on every board. See
[flow fields](../../Cards/Flow-Fields.md).

### Prerequisites

- Only a board admin can change these settings; only an admin can drag a
  row. Who may write them is decided where it is for every other
  board setting: `Boards.allow`'s update rule in
  `server/permissions/boards.js`.
- A board that never touched the order shows exactly what it always has.

### For developers

- `models/lib/cardFieldOrder.js` - the two layouts (`CARD_LAYOUT`,
  `MINICARD_LAYOUT`), the canonical order (`applyCardOrder`,
  `applyMinicardOrder`) and the move (`moveKey`). Pure, tested without
  Meteor by `tests/cardFieldOrderLayout.test.cjs` and
  `tests/cardFieldOrder.test.cjs`.
- `models/lib/cardShownFields.js` - the board as its opened cards and its
  minicards see it (`boardForCard`, `boardForMinicard`): the rows of a
  section hidden on that side read false. It does not depend on the card.
  `models/lib/cardSettingsSections.js` holds the hidden-section rules
  (`hiddenSectionsOf`, `hiddenSectionsAfter`, `rowKeysHiddenBySections`),
  written through `board.setCardSettingsSectionShown(side, id, shown)`.
  Pinned by `tests/cardSettingsSectionShown.test.cjs` and
  `tests/cardShownFields.test.cjs`.
- `models/lib/cardSettingsRows.js` - the rows of the popup: toggle class,
  board field, icons and label keys of every setting.
- Stored on the board as `cardFieldOrder` and `minicardFieldOrder`, flat
  arrays of field keys, written through `board.setCardFieldOrder()` and
  `board.setMinicardFieldOrder()`, and the section orders
  `cardSettingsSectionOrder` and `minicardSettingsSectionOrder`, written
  through `board.setCardSettingsSectionOrder(order, side)`
  (`models/lib/cardSettingsSections.js` `sectionOrder`, `sectionOrderOf`).
  The five section keys the first version of #4448 stored (`labels, dates,
  members, customFields, description`) stay valid and expand to the fields
  they rendered; so do the template groups' keys of before 2026-10-28
  (`dates`, `sort`, `voteAndPoker`, the minicard's `badges`). The REST
  endpoints `GET/PUT /api/boards/:boardId/cardFieldOrder` speak in the
  layout's section keys, which are Card Settings' section ids now (`labels,
  date, members, card, time, customFields, vote, poker, description, scrum,
  checklists, subtasks, attachments, comments`) - they read and write the
  fields' order, not the order the card draws its sections in.
- `cardDetails.jade` renders the sections through `each section in
  orderedCardFieldSections` (`cardDetails.js` `orderedSectionsOf`) and the
  fields inside a section through `orderedLabelsFields`, `orderedDateFields`,
  ... (`cardSettingsSections.sectionFieldsOn('card', ...)`); `minicard.jade`
  through `each group in minicardGroups`. `tests/cardSectionsOnCard.test.cjs`
  pins that every field is drawn in its own section, and
  `tests/cardSettingsCoverage.test.cjs` the popup.

## Commits

 - [Card Settings: two panes, the card and the minicard follow their order, menus inline](https://github.com/wekan/wekan/commit/2bd5d1180a24bde1fb30acfe75617bb4c68f864e)
 - [Card Settings: a checkbox per section, always every field, only in Board Settings](https://github.com/wekan/wekan/commit/3e5bc58105d32b1ef9e2ed9424e2990b9da95220)
 - [Board Settings / Card is the opened card's Card Settings, same templates](https://github.com/wekan/wekan/commit/52de57c844a750e2f4a0fb18d9fd81f04e5a1015)
 - [Card Settings on the opened card, its sections as checklists](https://github.com/wekan/wekan/commit/c0ec28e82f04fafa1b5bebc52f113aa13ed019c1)
 - [Card Settings: a Show on Card and a Show on Minicard list per section, reordered by drag and drop again](https://github.com/wekan/wekan/commit/8224852de15e5c0019e999a8d85d12a1e80fb8e1)
 - [Card Settings: Select all and Select none per column, headings aligned with their cells, labels whole](https://github.com/wekan/wekan/commit/c8a15b514ff5f17c4de7e2d93725c83c41a6b194)
 - [Card Settings: opens on Card, Show empty fields for the board, and the Show empty column](https://github.com/wekan/wekan/commit/1aa9df6075d93679f4781f57c8be605b2e670386)
 - [Board Settings / Card: Always show, for every field - the description, attachments and comments by default](https://github.com/wekan/wekan/commit/b54525abbe46820bd2874b575edb0fc9303ba949)
 - [Board Settings / Card: Show when empty, the fields every card of the board shows even while empty](https://github.com/wekan/wekan/commit/80b936223fb9b20697565a2c26a95da2154fdc2c)
 - [Card Settings / Custom Fields: Create Field and Link fields to another card are forms in the pane, not popups](https://github.com/wekan/wekan/commit/f33987931f1f4ffa0a3d1fc9c7e609e315bf2e7e)
 - [Card Settings: Card is the first entry, Subtasks and Planning Poker are sections of their own, and each section's ](https://github.com/wekan/wekan/commit/c69f3fe25a0db118bdf258370ded4a330f7e0ffa)
 - [Board Settings / Card and the opened card's "+ Add" are one popup: sections in the Admin Panel's left menu, each row ](https://github.com/wekan/wekan/commit/20e2273c075e376b983a5afce5fdc65da6fb98d9)
 - [Board Settings / Card calls the Whiteboard row Drawing, in its existing translations](https://github.com/wekan/wekan/commit/4bea319239eb5e573ab580a11e9c739e83697e97)
 - [Declutter the opened card, attachments too, and fit Card Settings on the screen](https://github.com/wekan/wekan/commit/2c520ef382f560ba3e7c68f2cddd6539ff0bafd5)
 - [Give Board Settings / Card rows to what the card and minicard drew without one](https://github.com/wekan/wekan/commit/8d30e4fdbc2fc48513e2125a7030a94dae57694e)
 - [Let every Board Settings / Card row be shown on the card and the minicard](https://github.com/wekan/wekan/commit/79b44675464d829b8b9ac05d01ec0aad2a8423b0)
 - [Reorder Board Settings / Card and Board View rows by drag and drop](https://github.com/wekan/wekan/commit/2d80e6e4ee4afec3dff380e53fa90f419af450f2)
 - [Show each Scrum field as its own Board Settings / Card row](https://github.com/wekan/wekan/commit/6d950b7474c394b8f2ef08a2a388c5918a66e3d4)
 - [Use available popup width for menu columns and card settings](https://github.com/wekan/wekan/commit/e0a53728b47bc3d925ffdbe54f1c4070ab99f616)
 - [Card Settings: the default card and minicard field order is the order they had before fields became orderable](https://github.com/wekan/wekan/commit/859771a10ece44f1c48c371d182b4c079c84faad)
 - [Board Settings / Card: one "Card field order" heading over two lists, with arrows on every row](https://github.com/wekan/wekan/commit/15b2b6c5339979341d8237aa592ae37a5fd0607d)
 - [Let Board Settings reorder the opened card's Description, Custom Fields, Labels, dates and members (#4448)](https://github.com/wekan/wekan/commit/131514d6140479aaa8de925774fe226814f507f3)
