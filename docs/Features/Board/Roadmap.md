# Roadmap

A Gantt-style roadmap that groups cards into rows by a **custom field**
(rather than by list/swimlane) and draws each row's cards on a timeline -
useful for a release/epic/theme roadmap when you already track that grouping
as a custom field on your cards.

## Where to find it

**Board View menu (top bar) → Roadmap.**

```
┌─ Board View ▾ ─────┐
│ ...                │
│ ▸ Roadmap          │  <- here
│ ...                │
└──────────────────────┘

┌ Roadmap ────────────────────────────────────────────┐
│ Group by: [ Release ▾ ]                               │
│                                                        │
│ v1.0 (4)                                              │
│  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬  (gantt bars for this group)     │
│                                                        │
│ v2.0 (2)                                              │
│  ▬▬▬▬▬▬▬▬▬                                            │
└──────────────────────────────────────────────────────────┘
```

## Steps to use it

1. Open a board that has at least one [Custom Field](../Cards/CustomFields/CustomFields.md)
   defined (a dropdown/text field works well as the grouping key, e.g. a
   "Release" or "Epic" field).
2. Click **Board View** (top bar) → **Roadmap**.
3. Use the **Group by** dropdown at the top to pick which custom field to
   group rows by.
4. Cards that have a value set for that custom field are grouped into one
   row per value, each drawn as a small Gantt chart using the cards' dates.
5. What information is needed: at least one custom field on the board, and
   cards with that field filled in and with Start/Due dates set (so they
   have something to draw on the timeline).

## Prerequisites

- If the board has **no custom fields at all**, Roadmap shows an empty-state
  message instead of the picker - add a custom field first (Board Settings →
  Custom Fields).
- Cards with the grouping field left empty do not appear in any row.
