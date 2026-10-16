# Group by Assignee

A board view that lists every card grouped under the member it is assigned
to, instead of under the list/swimlane it lives in - a quick "who has what"
view without opening each list.

## Where to find it

**Board View menu (top bar) → Group by Assignee.**

```
┌─ Board View ▾ ──────────┐
│ Swimlanes  Lists  Table │
│ ...                     │
│ ▸ Group by Assignee     │  <- here
│ ...                     │
└──────────────────────────┘

┌ Group by Assignee ───────────────────────┐
│ Alice (3)                                 │
│  • Fix login bug          due 2026-09-12  │
│  • Update docs                            │
│  • Review PR #42          ⏰ overtime     │
│ Bob (1)                                   │
│  • Write tests                            │
│ Unassigned (2)                            │
│  • Investigate flaky test                 │
│  • ...                                    │
└────────────────────────────────────────────┘
```

## Steps to use it

1. Open a board.
2. Click **Board View** (top bar) → **Group by Assignee**.
3. Cards are grouped into one section per assignee (plus an "unassigned"
   group), each showing the card title, its due date if set, and an
   overtime clock icon if the card is over time.
4. Click any card title to open that card.

## Prerequisites

Cards need an **assignee** (Card → Assign, not the same as "Members") for
the grouping to be meaningful - cards with no assignee fall into a single
"unassigned" group. This view is read-only: it does not support drag-and-drop
reordering, only opening cards.
