# Card field display order

Choose what the opened card and the minicard show, and in what order - each
of the two independently (#4448, #6688). Useful when a board relies mostly on
Description or Custom Fields and wants that section first, right under the
card title, or wants the minicard to lead with its due date rather than its
labels.

**Show on Card** says what the cards of the board CAN show. Each opened card
then shows only the fields it has data in - plus its description, attachments
and comments - and its own **+ Add** opens this same popup, with an **On this
card** checkbox beside each field
([Card fields](../../Cards/Card-Fields.md)).

The popup is the Admin Panel's left menu and pane: the rows are grouped into
sections (Card, Date, Time, Members, Labels, ... Voting, Planning Poker,
Scrum settings, Comments), and each row is one line with its **Show on
Minicard** and **Show on Card** checkbox, its position on each side and the
**up and down arrows** that move it there. The first menu entry, **Card**,
also holds Ask for a reason when moving cards and the Draggable table; a
section's own settings - Subtask settings, Edit custom fields, Change spent
time, Card kind, Edit voting, Edit Planning Poker - are forms at the top of
its pane ([Card fields](../../Cards/Card-Fields.md)).

## Where to find it

**Board sidebar (hamburger menu) → Board Settings → Card**, or **+ Add** on
an opened card. The left menu lists the sections; the right pane shows the
open section's rows:

| Label | Show on Minicard | Show on Card | On this card |
| --- | --- | --- | --- |
| the field, with the icon and name the card uses | checkbox, position, ▲ ▼ | checkbox, position, ▲ ▼ | opened from a card only |

| part | what it does |
| --- | --- |
| checkbox | whether that side shows the field at all - the same board toggles as before (`allowsLabels`, `allowsLabelsOnMinicard`, ...) |
| position | where the field is on that side, counted among the fields that move |
| ▲ ▼ | move the field earlier or later **on that side only** |

The minicard order and the card order are independent: a field can be third
on the minicard and last on the card. On a narrow screen the menu stacks above
the pane, as it does in the Admin Panel.

## Steps to use it

1. Open a board you are an admin of, click the sidebar's hamburger menu,
   then **Board Settings → Card** - or click **+ Add** on an opened card.
2. Pick a section in the left menu.
3. In a row's **Show on Card** cell, click ▲ or ▼ to move the field on the
   opened card; in its **Show on Minicard** cell, to move it on the minicard.
4. The change takes effect immediately on every card of this board; there
   is no separate save step.
5. Untick a checkbox to hide the field on that side; tick it to show it.

A row that cannot move (see below) has no arrows on that side.

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

The arrows follow three rules:

1. **A field moves within its section.** ▼ on *Start* puts it after *Due*.
2. **At the edge of its section, a field moves the whole section.** ▲ on
   the first row of Dates lifts the Dates section above the section before
   it; ▼ on its last row drops it below the next one.
3. **A section's header stays first.** Labels, Members, Sort number and
   Description title head their sections (the fold caret is theirs), so
   their arrows always move the section, and no other field goes above
   them.

A few minicard rows have no element of their own there - *Labels text* (how
labels are drawn), *List title* (the per-card switch under *Show lists*),
*Requested by*, *Assigned by*, *Description title*, *Attachments* - so they
sit under the row they modify with their arrows disabled.

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

- Only a board admin can change these settings; the arrows are shown only
  to an admin. Who may write them is decided where it is for every other
  board setting: `Boards.allow`'s update rule in
  `server/permissions/boards.js`.
- A board that never touched the order shows exactly what it always has.

## For developers

- `models/lib/cardFieldOrder.js` - the two layouts (`CARD_LAYOUT`,
  `MINICARD_LAYOUT`), the canonical order (`applyCardOrder`,
  `applyMinicardOrder`) and the move (`moveKey`). Pure, tested without
  Meteor by `tests/cardFieldOrderLayout.test.cjs` and
  `tests/cardFieldOrder.test.cjs`.
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
