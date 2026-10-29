# Card field display order

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

## Where to find it

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

## Steps to use it

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

## What moves, and how

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

## The default order

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

## The helpers that need no AI

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

## Prerequisites

- Only a board admin can change these settings; only an admin can drag a
  row. Who may write them is decided where it is for every other
  board setting: `Boards.allow`'s update rule in
  `server/permissions/boards.js`.
- A board that never touched the order shows exactly what it always has.

## For developers

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
