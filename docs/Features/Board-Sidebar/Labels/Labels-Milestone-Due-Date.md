# Label due dates (Milestones)

## What it is

An optional **due date on a label itself** (#2802), rather than on a card.
Giving a label such as "Sprint 1" or "v2.0" its own due date turns it into a
lightweight milestone: every card carrying that label shows the same
milestone date next to the label, without setting a due date on each card
individually.

## Read more

- [Wikipedia: Milestone (project management)](https://en.wikipedia.org/wiki/Milestone_(project_management))
- [Wikipedia: Tag (metadata)](https://en.wikipedia.org/wiki/Tag_(metadata))
- [WeKan issue #2802](https://github.com/wekan/wekan/issues/2802), the request
- [Filter](../Filter/README.md), whose label filter finds a milestone's cards

## How to use it

### Where to find it

**Card → Labels popup → create/edit a label → Due date**, and **board
sidebar → Labels** for editing an existing label the same way.

```
┌ Labels ──────────────────────────────┐
│ ▮ green  ▮ yellow  ▮ Sprint 1 ✎       │  <- edit a label
└──────────────────────────────────────────┘

┌ Edit label ───────────────────────────┐
│ Name:       [ Sprint 1......... ]      │
│ Color:      ▮▮▮▮▮▮▮▮▮▮ (palette)       │
│ Custom color: [ #______ ]              │
│ Due date:   [ 2026-01-15 ]  <- here    │
│ [Save]                    [Delete]      │
└────────────────────────────────────────────┘

┌ Card minicard ────────────────────────┐
│ Sprint 1  📅 2026-01-15   <- shown next │
│                              to the label│
└────────────────────────────────────────────┘
```

### Steps to use it

1. Open a card, click **Labels**, then click the pencil/edit icon on an
   existing label (or create a new one).
2. In the label form, fill the **Due date** field (a plain date picker) with
   the milestone's date, e.g. a sprint end or release date.
3. Save (**Create**, or **Save** for an existing label). Every card that
   already has (or later gets) this label now shows the label's due date
   beside it, on the minicard and on the card.
4. Leave **Due date** blank to keep the label an ordinary label with no
   milestone date; clearing a previously set date removes it again.
5. Filtering by this label still uses the existing label filter - there is
   no separate "Milestone" filter or object; the due date is purely a
   property carried on the label.

## How the numbers are calculated

The feature has no numbers of its own: a label has at most one due date, a
calendar date, shown in the reader's date format; there is no count, limit or
default beyond that.

## How it works in WeKan

The date is the optional `dueAt` field of a label in the board's `labels`
array ([models/boards.js](../../../../models/boards.js)), so labels and boards
without it are unaffected. The label form `formLabel` in
[client/components/cards/labels.jade](../../../../client/components/cards/labels.jade)
has the **Due date** field (`labelDueAt`); the create and edit popups pass it
to `board.addLabel(name, color, dueAt)` and `board.editLabel(labelId, name,
color, dueAt)`, which set `dueAt` when there is one and remove it when the
field is empty. The label is drawn with the date beside it
(`card-label-due-at`). Pinned by
[tests/labelDueAt.test.cjs](../../../../tests/labelDueAt.test.cjs).

### Prerequisites

- Editing a label's due date requires the same board-member permission as
  editing any other label property (name/color).
- No card-level configuration is needed - every card with the label
  automatically shows the label's due date once it is set.

### Known issue

`addLabel` and `editLabel` write only when the board has no other label with
the same name and colour (`getLabel(name, color)`). For an existing label whose
name and colour are left as they are, that check finds the label itself, so a
change of **only** its due date is not saved. Change the name or the colour in
the same edit (and change it back afterwards), or create the label with its
due date.

## Commits

 - [Member-selected calendars and accessible date and time controls, the label due date input included](https://github.com/wekan/wekan/commit/5057a0a2c1079780f6560369e989d0022c54e53a)
 - [Let a label carry its own optional due date, so it can serve as a milestone](https://github.com/wekan/wekan/commit/1af1d7ad3fcadbaeca0a52ef473552a775849f02)
