# Multi Board Calendar

A Planyway-style calendar that shows the received/start/due/end dates of
cards across **every board you are a member of**, not just the board you
currently have open - one place to see everything due this week regardless
of which board it lives on. Each calendar entry is prefixed with its board's
title so cards from different boards stay distinguishable. See
[#2469](https://github.com/wekan/wekan/issues/2469).

## Where to find it

**Board View menu (top bar) → Multi Board Calendar**, from inside any board.

```
┌─ Board View ▾ ────────────┐
│ ...  Calendar             │
│ ▸ Multi Board Calendar    │  <- here
│ ...                       │
└──────────────────────────────┘

┌ Multi Board Calendar ─────────── < September 2026 > ──┐
│ Mon   Tue   Wed   Thu   Fri   Sat   Sun                 │
│  1     2     3     4     5     6     7                  │
│              [Alpha: Ship v2]                            │
│  8     9    10    11    12    13    14                  │
│       [Beta: Review]  [Alpha: Due]                       │
└───────────────────────────────────────────────────────────┘
```

## Steps to use it

1. Open any board you belong to.
2. Click **Board View** (top bar) → **Multi Board Calendar**.
3. The calendar shows one entry per card with a date, across all boards you
   are a member of, each labeled `Board title: Card title`.
4. Click an entry to open that card directly (works across boards).

## Prerequisites

Cards need a Received/Start/Due/End date set to appear at all - see
[Due Date](Due-Date.md). Only boards you are a member of are included, same
as [Bigboard](../Board/Bigboard.md), which this view's board-lookup logic is
shared with.
