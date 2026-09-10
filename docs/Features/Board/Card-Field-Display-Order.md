# Card field display order

Reorder the major sections of an opened card - **Labels, Dates, Members,
Custom Fields, Description** - instead of the historical fixed order (#4448).
Useful when a board relies mostly on Description or Custom Fields and wants
that section to show up first, right under the card title.

## Where to find it

**Board sidebar (hamburger menu) → Board Settings → Card**, in the "Card
field order" list near the bottom of that panel.

```
┌─ Sidebar ▾ ─────────────────┐
│ Board Settings               │
│  Swimlane                    │
│  List                        │
│  ▸ Card              <- here │
└────────────────────────────────┘

┌ Card Settings ───────────────────────┐
│ ...                                   │
│ Card field order                      │
│  ↑ ↓   Labels                         │
│  ↑ ↓   Dates                          │
│  ↑ ↓   Members                        │
│  ↑ ↓   Custom Fields                  │
│  ↑ ↓   Description                    │
└──────────────────────────────────────────┘
```

## Steps to use it

1. Open a board you are an admin of, click the sidebar's hamburger menu,
   then **Board Settings → Card**.
2. Scroll to **Card field order**, which lists the five reorderable
   sections: Labels, Dates, Members, Custom Fields, Description.
3. Click the **up**/**down** arrow beside a section to move it earlier or
   later - the top-most arrow is disabled on the first row and the
   bottom-most arrow is disabled on the last row.
4. The change takes effect immediately on every card of this board; there is
   no separate save step.
5. What information is needed: none beyond deciding the order - this is a
   pure reordering control, not a text field.

## Prerequisites

- Only a board admin can see and change this setting (`canModifyBoard`).
- Only these five sections are reorderable. Checklists, Attachments,
  Comments, Activity, Dependencies/Sort and Vote/Poker stay at their current
  fixed positions and are not affected by this setting.
