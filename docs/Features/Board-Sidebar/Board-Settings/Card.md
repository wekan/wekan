# Card field display order

Choose what the opened card and the minicard show, and in what order - each
of the two independently (#4448, #6688). Useful when a board relies mostly on
Description or Custom Fields and wants that section first, right under the
card title, or wants the minicard to lead with its due date rather than its
labels.

This is [Card Settings](../../Cards/Card-Settings.md) - the only place it is:
the opened card has no Card Settings of its own. **Show on Card** says what
every opened card of the board shows - every field ticked, empty or not -
and **Show on Minicard** what every minicard shows. **Show** chooses which,
then the sections (Card, Date, Time, Members, Labels, ... Voting, Planning
Poker, Scrum settings, Comments) are checklists - a section is a checklist's
title with a checkbox of its own, its fields the items.

## Where to find it

**Board sidebar (hamburger menu) → Board Settings → Card**.

| part | what it does |
| --- | --- |
| Show | which side the checkboxes and the order are: the minicard's or the opened card's |
| a row's checkbox | whether that side shows the field at all - the same board toggles as before (`allowsLabels`, `allowsLabelsOnMinicard`, ...) |
| a section's checkbox | whether that side shows the whole section at all (`cardSettingsHiddenOnCard`, `cardSettingsHiddenOnMinicard`); the rows keep their ticks |
| a one-row section | one line: one checkbox - the field's own - its name, its hamburger (Subtasks, Voting, Planning Poker) |
| Custom Fields | its items are the board's custom fields - Show on Card is *add to all cards*, Show on Minicard is *show on minicard* - dragged to reorder, **+** to create one |
| a row's hamburger | only Labels text's way back to the board's default, while overridden; no other row has one |
| a section's hamburger | Card: Ask for a reason when moving cards and the Draggable table; Subtasks: Subtask settings; no other section has one |
| drag and drop | move a field earlier or later **on the chosen side only**, within its section; move a whole section above or below another |

What is dragged follows the member's drag handles setting: with drag handles
on, only the handle - the rest of the row scrolls the page; with them off,
the icon and name. Up and Down on a focused handle or name move it one row. A
field cannot move to another section: dropped there, it goes back where it
was and nothing is saved.

Removed on 2026-10-28: the opened card's **Card Settings** button, **On this
card**, **Show empty**, **Show empty fields** and the hamburgers' **Select
all / Select none**. Every opened card shows every field its board shows,
empty or not.

The minicard order and the card order are independent: a field can be third
on the minicard and last on the card.

## Steps to use it

1. Open a board you are an admin of, click the sidebar's hamburger menu,
   then **Board Settings → Card**.
2. Choose **Show on Card** or **Show on Minicard**.
3. Drag a field within its section to move it on that side, or a section to
   move the whole section.
4. The change takes effect immediately on every card of this board; there
   is no separate save step.
5. Untick a checkbox to hide the field on that side; tick it to show it.
   Untick a section's checkbox to hide the whole section on that side.

A row that cannot move (see below) is not dragged. A dropped row goes right
after the row now above it in the side's whole order (or right before the row
below it, at the top).

## What moves, and how

The card and the minicard are each a fixed **head**, a reorderable middle of
**sections**, and (on the card) a fixed **tail**.

**On the opened card:**

- *Head, fixed:* Mark as complete, Card number, Cover image - the title bar.
- *Sections, reorderable:* Labels (Labels, Stickers, Location), Dates
  (Received, Start, Due, End), Members (Members, Assignee, Creator,
  Requested by, Assigned by), Dependencies, Sort (Sort number, Show lists,
  Spent time, Flowtime, Pomodoro), Custom Fields, Vote and Planning Poker,
  Description (title, text).
- *Tail, fixed:* Checklists, Checklist count, Subtasks, Attachments,
  Attachment count, Text notes, Comments, Activities - they live in the
  card's galleries and its right column, not in the field list.

**On the minicard:** the title bar (Mark as complete, Card number) is fixed;
everything under it is reorderable - the dates line, Cover, Labels, Custom
Fields, Assignees, Members, Creator, Checklists, the badge strip
(Dependencies, Stickers, Comment count, Vote, Poker, Attachment count,
Subtasks, Checklist count, Sort number), Description text, the comment
preview, List name, Swimlane name. Inside the dates line and the badge strip
the fields reorder among themselves too.

Moving a field follows three rules:

1. **A field moves within its section.** *Start* dropped below *Due* goes
   after it.
2. **Leaving its section, a field takes the whole section along.** The
   first row of Dates dragged up lifts the Dates section above the section
   before it.
3. **A section's header stays first.** Labels, Members, Sort number and
   Description title head their sections (the fold caret is theirs), so
   dragging them always moves the section, and no other field goes above
   them.

A few minicard rows have no element of their own there - *Labels text* (how
labels are drawn), *List title* (the per-card switch under *Show lists*),
*Requested by*, *Assigned by*, *Description title*, *Attachments* - so they
sit under the row they modify and are not dragged.

## The default order

The default - what a board that never touched the popup shows, and where any
field a stored order does not name goes - is the order the card and the
minicard had **before fields became orderable**: the templates as they were
at commit `59f7d61df`, right before #4448's first commit, read top to
bottom. It is not a tidied-up order; changing it would change the shape of
every card on upgrade.

**Card:** Mark as complete, Card number, Cover image; Labels, Stickers,
Location; Received, Start, Due, End; Members, Assignee, Creator, Requested
by, Assigned by; Dependencies; Sort number, Show lists, Spent time, Flowtime,
Pomodoro; Custom Fields; Vote, Planning Poker; Description title,
Description text; Checklists, Checklist count, Subtasks, Attachments,
Attachment count, Text notes, Comments, Activities.

**Minicard:** Mark as complete, Card number; Received, Start, Due, End,
Spent time; Cover image; Labels; Custom Fields; Assignees; Members; Creator;
Checklists; Dependencies, Stickers, Comment count, Vote, Planning Poker,
Attachment count, Subtasks, Checklist count, Sort number; Description text;
Comments; List name; Swimlane name.

Two fields did not exist at that commit and sit beside their closest older
neighbour: *Text notes* (card, between the attachment count and comments)
and *Swimlane name* (minicard, last, under the list name).
`tests/cardFieldOrderDefaultIsPreFeatureOrder.test.cjs` pins both sequences.

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
  `board.setMinicardFieldOrder()`. The five section keys the first version
  of #4448 stored (`labels, dates, members, customFields, description`)
  stay valid and expand to what they rendered - Members carried
  Dependencies and Sort then, Custom Fields carried Vote/Poker. The REST
  endpoints `GET/PUT /api/boards/:boardId/cardFieldOrder` still speak in
  section keys (eight now: `labels, dates, members, dependencies, sort,
  customFields, voteAndPoker, description`).
- `cardDetails.jade` renders the sections through `each section in
  orderedCardFieldSections` and the fields inside a section through
  `orderedDatesFields`, `orderedMembersFields`, ...; `minicard.jade`
  through `orderedMinicardSections`, `orderedMinicardDates` and
  `orderedMinicardBadges`. `tests/cardSettingsCoverage.test.cjs` derives
  each layout's default order from the templates and pins the popup.
