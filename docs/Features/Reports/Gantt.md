# Gantt chart

This new Gantt feature was added to MIT WeKan 2025-12-22 at https://github.com/wekan/wekan

At "All Boards" page, click board to open one board view. There, Gantt is at top dropdown menu Swimlanes/Lists/Calendar/Gantt.

Gantt shows all dates, according to selected date format at opened card: Received Start Due End.

Gantt dates are shown for every week where exist dates at the current opened board.

You can click task name to open card.

You can click any date icon to change that date, like: Received Start Due End.

## Where to find it

**Board View menu (top bar) → Gantt.**

```
┌─ Board View ▾ ──────────────────────┐
│ ...                                  │
│ ▸ Gantt              <- here         │
│   Gantt (Frappe)                     │
│   Gantt (dhtmlx)                     │
│ ...                                  │
└───────────────────────────────────────┘

┌ Gantt ──────────────────────────────────────────────┐
│ Task            | wk1 | wk2 | wk3 | wk4 | ...        │
│ Card A          |  ▬▬▬▬▬▬  🔵🟢🟡🔴 (date icons)      │
│ Card B          |       ▬▬▬▬▬▬▬                       │
└─────────────────────────────────────────────────────────┘
```

## Steps to use it

1. Open a board that has cards with at least one of Received/Start/Due/End
   dates set.
2. Click **Board View** (top bar) → **Gantt**.
3. Click a task's name to open its card.
4. Click any of the four date icons on a row (Received/Start/Due/End) to
   change that date directly from the chart - this table view has no
   drag-to-reschedule, only the click-a-date-icon editor.

## Two additional Gantt engines: Frappe and dhtmlx

Besides the built-in table-style Gantt above, the same **Board View** menu
offers two more Gantt renderers built on third-party libraries
(`client/components/gantt/frappeGantt.jade`,
`client/components/gantt/dhtmlxGantt.jade`). All three read the same four
card dates (Received/Start/Due/End) from the same board's cards; what
differs is the library and, importantly, whether you can **drag** a bar to
reschedule a card instead of only clicking a date icon.

```
┌─ Board View ▾ ──────────────────────┐
│ ▸ Gantt                              │
│ ▸ Gantt (Frappe)      <- here        │
│ ▸ Gantt (dhtmlx)      <- or here     │
└───────────────────────────────────────┘
```

### Gantt (Frappe)

Uses [frappe-gantt](https://github.com/frappe/frappe-gantt) (MIT, zero
runtime dependencies). Each card is drawn as one draggable bar spanning its
Start-Due (or whichever pair of the four dates it has); the bar's left/right
edges can be **dragged to reschedule the card** when you have write access
to the board - dragging is disabled (`readonly_dates`) for a member without
write permission. Clicking a bar opens the card.

### Gantt (dhtmlx)

Uses [dhtmlx-gantt Community Edition](https://github.com/DHTMLX/gantt) (MIT
since v10, zero runtime dependencies). Same idea - one draggable bar per
card, drag-to-reschedule gated on write access (`gantt.config.readonly`) -
but rendered by a different library with its own look (a classic
grid+timeline split) and its own drag/hover interaction feel. `dhtmlx-gantt`
is a JavaScript **singleton**, so switching away from this view and back
destroys and recreates it rather than reusing an instance.

## Steps to use Frappe or dhtmlx Gantt

1. Open a board that has cards with Start/Due (or Received/End) dates set.
2. Click **Board View** (top bar) → **Gantt (Frappe)** or **Gantt (dhtmlx)**.
3. Click a card's bar to open its card.
4. If you have write access to the board, drag a bar's edge to change that
   card's date directly on the chart; the change is saved back to whichever
   of the four dates that edge represents.
5. Without write access the chart is still readable, just not draggable.

## Prerequisites

- Cards need at least one of Received/Start/Due/End set to appear on any of
  the three Gantt views; a card with none of the four is skipped.
- Dragging to reschedule (Frappe/dhtmlx only) requires board write access.

# Old WeKan Gantt GPL

Previous GPLv2 WeKan Gantt is deprecated https://github.com/wekan/wekan-gantt-gpl

# UCS

[Gantt feature at UCS](../../Platforms/FOSS/Container/UCS#gantt)
