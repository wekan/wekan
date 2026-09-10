# Bigboard

Bigboard stacks **every board you are a member of** on one scrollable page,
each as its own kanban section with its own lists and cards - the same
drag-and-drop, card popups and list editing as a normal single-board page,
just all your boards at once. It is WeKan's equivalent of Kanboard's
"BigBoard" plugin. See [#4223](https://github.com/wekan/wekan/issues/4223).

## Where to find it

**Board View menu (top bar) → Bigboard**, from inside any board you are a
member of.

```
┌─ Board View ▾ ──────┐
│ ...                 │
│ ▸ Bigboard          │  <- here
│ ...                 │
└───────────────────────┘

┌ Bigboard ──────────────────────────────────────────┐
│ ## Project Alpha                                    │
│  [Backlog]   [Doing]   [Done]                        │
│   card        card      card                         │
│   card                  card                          │
│                                                        │
│ ## Project Beta                                       │
│  [To Do]  [In Progress]  [Review]  [Done]              │
│   card       card                                     │
└────────────────────────────────────────────────────────┘
```

## Steps to use it

1. Open any board.
2. Click **Board View** (top bar) → **Bigboard**.
3. Every board you belong to is stacked in one page, each with its normal
   lists and cards.
4. Drag cards between lists, open cards, or edit lists exactly as on a
   single board - each board section behaves like its own board page.

## Prerequisites

You must be a member of at least one board; boards you are not a member of
never appear. There is no separate setup - Bigboard reuses the same
lists/cards data as the regular board view.
