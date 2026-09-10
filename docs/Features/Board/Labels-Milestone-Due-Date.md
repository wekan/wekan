# Label due dates (Milestones)

An optional **due date on a label itself** (#2802), rather than on a card.
Giving a label such as "Sprint 1" or "v2.0" its own due date turns it into a
lightweight milestone: every card carrying that label shows the same
milestone date next to the label, without setting a due date on each card
individually.

## Where to find it

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

## Steps to use it

1. Open a card, click **Labels**, then click the pencil/edit icon on an
   existing label (or create a new one).
2. In the label form, fill the **Due date** field (a plain date picker) with
   the milestone's date, e.g. a sprint end or release date.
3. Save. Every card that already has (or later gets) this label now shows
   the label's due date beside it, on the minicard and on the card.
4. Leave **Due date** blank to keep the label an ordinary label with no
   milestone date; clearing a previously set date removes it again.
5. Filtering by this label still uses the existing label filter - there is
   no separate "Milestone" filter or object; the due date is purely a
   property carried on the label.

## Prerequisites

- Editing a label's due date requires the same board-member permission as
  editing any other label property (name/color).
- No card-level configuration is needed - every card with the label
  automatically shows the label's due date once it is set.
