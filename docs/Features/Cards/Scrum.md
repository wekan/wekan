# Using WeKan for Scrum

See also the [native Scrum source audit and implementation design](../Board-Header/Board-Views/Scrum/Scrum-Design.md). The design distinguishes existing features from planned additions.

[Discussion](https://github.com/wekan/wekan/issues/3087)

## What it is

A reporter asked for tips on running a basic Scrum process on WeKan: cards
as user stories, story points, acceptance-test checklists, one board per
sprint, and a separate planning/backlog board. All of that is possible with
WeKan's existing features - no plugin or extra setup is needed. This page
lays out one concrete mapping; adapt it to how your team already works.
Since 2026-09-27 WeKan also has native Scrum planning - sprints, a Product
Backlog, sprint reports and velocity - and each card has a **Scrum settings**
section of its own; see [What WeKan now has built in](#what-wekan-now-has-built-in).

## Read more

- Wikipedia: [Scrum (project management)](https://en.wikipedia.org/wiki/Scrum_(project_management)),
  [User story](https://en.wikipedia.org/wiki/User_story),
  [Story point](https://en.wikipedia.org/wiki/Story_point),
  [Planning poker](https://en.wikipedia.org/wiki/Planning_poker) and
  [Velocity (software development)](https://en.wikipedia.org/wiki/Velocity_(software_development)).
- [The Scrum Guide](https://scrumguides.org/scrum-guide.html).
- In WeKan: [Sprints](../Board-Header/Board-Views/Scrum/Sprints.md),
  [Product Backlog](../Board-Header/Board-Views/Scrum/Product-Backlog.md),
  [Sprint Report and Velocity](../Board-Header/Board-Views/Scrum/Sprint-Reports.md),
  [Scrum settings](../Board-Sidebar/Board-Settings/Scrum-Settings.md),
  [Planning Poker](Planning-Poker.md) and
  [Scrum meetings](../Board-Sidebar/Board-Settings/Scrum-Meetings.md).

## How to use it

### Cards as user stories

A card is the natural unit for a user story: title it the way the team
writes stories ("As a user, I can ..."), and use the card description for
the rest of the story text. Story acceptance criteria fit best as a
**checklist** on the card (see [Checklists](../../API/Checklists.md) and
[the card's Checklists](Checklists.md)) -
each acceptance test becomes one checklist item, and the card's
checklist-progress badge on the minicard shows how many are done without
opening the card. With Scrum planning on, the card's **Scrum settings**
section also has an **Acceptance criteria** field.

### Story points as a numeric custom field

Add a numeric [Custom Field](CustomFields/CustomFields.md) (for example
named "Story Points") at board level, and attach it to the card types you
use for stories. Custom fields also support a "show sum at top of list"
toggle (`models/customFields.js`'s `showSumAtTopOfList`) - turn it on and
the list header draws a "∑ n" badge next to the card-count badge, totalling
that field over the cards in the list. In Swimlanes view the same list is
drawn once per swimlane row, and the badge is scoped to the row it is
drawn in, so a story-point sum next to a sprint's "Doing" or "Done" list
reads as that swimlane's own total, not the whole board's - useful for a
rough velocity number without a separate burndown tool. See
[Burndown and Velocity Chart](../Board-Header/Board-Views/Charts/Burndown-and-Velocity-Chart.md)
for existing burndown options if a graph is wanted on top of the sum.

Step by step:

1. **Board Settings → Card**, the **Custom Fields** section, **+** (**Create
   Field**) - see [Custom Fields](CustomFields/CustomFields.md).
2. Name it (for example "Story Points"), choose the type **Number**, and tick
   **Show sum of fields at top of list** (and **Add field to all cards**, if
   every card is a story).
3. Click **Save**, and fill in the field on each story card.

Planning Poker estimates are the other estimate source: the Scrum settings
choose either one.

### One board (or swimlane) per sprint

Either works, and the tradeoff is the same one Scrum teams already weigh
outside WeKan:

- **A board per sprint** keeps each sprint's cards, lists and history
  completely separate, and a finished sprint's board can simply be
  archived (see [Archive and Delete](../Board-Sidebar/Archive/Archive-and-Delete.md)).
  [Templates](../All-Boards/Templates.md) let a new sprint board start from a
  saved list/swimlane layout instead of being rebuilt from scratch every
  time.
- **A swimlane per sprint** on one long-lived board keeps all sprints
  visible side by side, and the numeric custom-field sum badge described
  above is naturally scoped per swimlane, so several sprint rows on the
  same board each show their own point total. See
  [Swimlanes](../Swimlanes/Swimlanes.md).

Either way, [Card Dependencies ("Red Strings")](../General/Editor/RedStrings/RedStrings.md)
and [Linked Cards](Linked-Cards.md) can connect a story on a sprint board
back to its source card on the backlog/planning board below.

### A backlog / planning board

A separate board (or a "Backlog" list on the same board) holds stories not
yet committed to a sprint. Move or copy a card into the active sprint
board/swimlane when it is pulled into a sprint - WeKan's
[Drag Drop](../General/DragDrop/Drag-Drop.md) and "move card to board" actions
both work across boards. [WIP Limits](../Lists/WipLimit/WipLimit.md) on
the sprint board's "Doing" list give a simple check against overcommitting
mid-sprint.

### Meetings

The board menu's [Daily standup timer and Retrospective board](../Board-Sidebar/Board-Settings/Scrum-Meetings.md)
help with the daily standup and the sprint retrospective, and the
[flow policies](../Lists/Flow-Policies.md) page describes the Definition of
Ready beside the Definition of Done.

### What WeKan now has built in

This page started as a manual mapping of Scrum concepts onto WeKan's existing
card, checklist, custom-field and swimlane/board features, at a time when
WeKan had no purpose-built "sprint" or "story points" object, velocity chart,
or sprint-close/rollover action. That is no longer so:

- **Board View → Scrum → Sprints** plans, starts, closes and cancels sprints,
  and closing one moves its unfinished cards to another sprint or back to the
  backlog ([Sprints](../Board-Header/Board-Views/Scrum/Sprints.md)).
- **Board View → Scrum → Product Backlog** orders the cards that are in no
  sprint ([Product Backlog](../Board-Header/Board-Views/Scrum/Product-Backlog.md)).
- **Sprint Report** and **Velocity** show what each closed sprint committed
  and completed ([Sprint Report and Velocity](../Board-Header/Board-Views/Scrum/Sprint-Reports.md)).
- The opened card's **Scrum settings** section shows the card's **Sprint**,
  **Past sprints**, **Release**, **Work item type**, **Acceptance criteria**
  and **Backlog rank**, each with its own Show on Card / Show on Minicard row
  in Board Settings / Card.

The estimate is a Planning Poker estimate or a numeric custom field such as
the "Story Points" above, chosen in
[Scrum settings](../Board-Sidebar/Board-Settings/Scrum-Settings.md). If your
team needs a Scrum workflow neither the mapping above nor these views cover,
please open a feature request describing the exact workflow.

## How the numbers are calculated

- **The "∑ n" badge** (`sumCustomFieldValues` in
  [models/lib/customFieldsSum.js](../../../models/lib/customFieldsSum.js)):
  the sum, over the list's non-archived cards (in Swimlanes view only those of
  that swimlane row), of every Number custom field of the board that has
  **Show sum of fields at top of list** ticked. A card without a value adds 0;
  a text value is read as a number with `,` or `.` as the decimal mark, and one
  that is no number is skipped.
- **Its tooltip** (`numberFieldStats`) adds the smallest and largest value and
  how many of the cards have one: `(min–max, count/total)`.
- **Checklist badge**: finished items / all items of the card's checklists.
- **Sprint numbers** - commitment, completion, velocity and estimates - are
  described on [Sprints](../Board-Header/Board-Views/Scrum/Sprints.md) and
  [Sprint Report and Velocity](../Board-Header/Board-Views/Scrum/Sprint-Reports.md).

## How it works in WeKan

- The sum badge: `numberFieldsSum`, `numberFieldsStats` and
  `numberFieldsSumTooltip` in
  [client/components/lists/listHeader.js](../../../client/components/lists/listHeader.js),
  drawn in [listHeader.jade](../../../client/components/lists/listHeader.jade);
  the toggle is `showSumAtTopOfList` in
  [models/customFields.js](../../../models/customFields.js), set in
  [client/components/sidebar/sidebarCustomFields.jade](../../../client/components/sidebar/sidebarCustomFields.jade).
- The card's Scrum settings section is `cardFieldSectionScrum` in
  [client/components/cards/cardDetails.jade](../../../client/components/cards/cardDetails.jade);
  its rows are the `scrum…` entries of
  [models/lib/cardSettingsRows.js](../../../models/lib/cardSettingsRows.js),
  and the Scrum rules are [models/lib/scrum.js](../../../models/lib/scrum.js).
- Tests: [tests/scrumDomain.test.cjs](../../../tests/scrumDomain.test.cjs),
  [tests/scrumViewHelpers.test.cjs](../../../tests/scrumViewHelpers.test.cjs)
  and [tests/scrumMeetings.test.cjs](../../../tests/scrumMeetings.test.cjs).

## Commits

 - [Daily standup timer and retrospective board in the board menu](https://github.com/wekan/wekan/commit/2f7a4e210f0e90005bba662e7ac418b403ffa2ba)
 - [Native Scrum sprint planning, card Scrum fields and snapshot reports](https://github.com/wekan/wekan/commit/83eac102113623f8e0bc91b012c994b3c8291765)
 - [Document the existing Scrum capabilities and the implementation design](https://github.com/wekan/wekan/commit/c666a69b2c86ed252373b644fb53e3cedf2672d8)
 - [The list header's sum badge gets min/max and a date-field range](https://github.com/wekan/wekan/commit/453b309c72069ab6428b88f76a28d65fc306674f)
 - [The sum of a number custom field at the top of a list, per swimlane row](https://github.com/wekan/wekan/commit/4de77a4a5b377ffa8ce8111a9d85c9bdc7cf78c0)
 - [A Using WeKan for Scrum guide, linked from docs/README.md](https://github.com/wekan/wekan/commit/f9c046dd2eba0ea6e0ef8bd535e4bf0078d30288)
