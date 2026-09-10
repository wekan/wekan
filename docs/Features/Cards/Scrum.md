[Discussion](https://github.com/wekan/wekan/issues/3087)

A reporter asked for tips on running a basic Scrum process on WeKan: cards
as user stories, story points, acceptance-test checklists, one board per
sprint, and a separate planning/backlog board. All of that is possible with
WeKan's existing features - no plugin or extra setup is needed. This page
lays out one concrete mapping; adapt it to how your team already works.

## Cards as user stories

A card is the natural unit for a user story: title it the way the team
writes stories ("As a user, I can ..."), and use the card description for
the rest of the story text. Story acceptance criteria fit best as a
**checklist** on the card (see [Checklists](../../API/Checklists.md)) -
each acceptance test becomes one checklist item, and the card's
checklist-progress badge on the minicard shows how many are done without
opening the card.

## Story points as a numeric custom field

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
[Burndown and Velocity Chart](../Reports/Burndown-and-Velocity-Chart.md)
for existing burndown options if a graph is wanted on top of the sum.

## One board (or swimlane) per sprint

Either works, and the tradeoff is the same one Scrum teams already weigh
outside WeKan:

- **A board per sprint** keeps each sprint's cards, lists and history
  completely separate, and a finished sprint's board can simply be
  archived (see [Archive and Delete](../Board/Archive-and-Delete.md)).
  [Templates](../Board/Templates.md) let a new sprint board start from a
  saved list/swimlane layout instead of being rebuilt from scratch every
  time.
- **A swimlane per sprint** on one long-lived board keeps all sprints
  visible side by side, and the numeric custom-field sum badge described
  above is naturally scoped per swimlane, so several sprint rows on the
  same board each show their own point total. See
  [Swimlanes](../Board/Swimlanes.md).

Either way, [Card Dependencies ("Red Strings")](../Editor/RedStrings/RedStrings.md)
and [Linked Cards](Linked-Cards.md) can connect a story on a sprint board
back to its source card on the backlog/planning board below.

## A backlog / planning board

A separate board (or a "Backlog" list on the same board) holds stories not
yet committed to a sprint. Move or copy a card into the active sprint
board/swimlane when it is pulled into a sprint - WeKan's
[Drag Drop](../../DragDrop/Drag-Drop.md) and "move card to board" actions
both work across boards. [WIP Limits](../../Lists/WipLimit/WipLimit.md) on
the sprint board's "Doing" list give a simple check against overcommitting
mid-sprint.

## What this does not cover

This is a manual mapping of Scrum concepts onto WeKan's existing card,
checklist, custom-field and swimlane/board features - WeKan has no
purpose-built "sprint" or "story points" object, velocity chart, or
sprint-close/rollover action. If your team needs one of those built in
rather than assembled this way, please open a feature request describing
the exact workflow.
