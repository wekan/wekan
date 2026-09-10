# WIP Limit Groups

A **shared Work-In-Progress limit across two or more lists together**, on top
of each list's own [per-list WIP limit](WipLimit.md). Useful when "in
progress" spans several lists (e.g. "Doing" + "Review" + "Testing") and you
want to cap the combined card count across all of them rather than each list
separately - or cap an entire swimlane at once.

## Where to find it

**Board sidebar (hamburger menu) → Board Settings → WIP Limit Groups.**

```
┌─ Sidebar ▾ ─────────────────┐
│ Board Settings               │
│  Swimlane                    │
│  List                        │
│  Card                        │
│  ▸ WIP Limit Groups  <- here │
└────────────────────────────────┘

┌ WIP Limit Groups ──────────────────────────────┐
│ [ Group name.............. ]                    │
│ ☐ To Do  ☑ Doing  ☑ Review  ☑ Testing  ☐ Done   │
│ Limit: [ 5 ]  [Apply]                            │
│ ☑ Enable   🗑 Delete                              │
│ ------------------------------------------------ │
│ Add group:                                       │
│ Swimlane: [ pick a swimlane ▾ ] [Apply]          │
│ ☐ To Do  ☐ Doing  ☐ Review ...                   │
│ Limit: [ 1 ]  [Add]                               │
└────────────────────────────────────────────────────┘
```

## Steps to use it

1. Open a board, click the sidebar's hamburger menu, then **Board Settings →
   WIP Limit Groups**.
2. Under **Add group**, type an optional name for the group, then check the
   lists it should cover (any two or more lists on the board).
3. Enter the combined **limit** (an integer, 1-999) and click **Add** (the
   `wip-limit-group-add` button) - or first pick a swimlane from the
   **swimlane** dropdown and click **Apply** to quick-check every list of
   that swimlane instead of ticking them one by one.
4. Toggle **Enable** on the new group to start enforcing it; a disabled
   group is kept but ignored.
5. To edit an existing group: change its name, ticked lists or limit, then
   click **Apply** on that group's own row.
6. Click the trash icon to delete a group.

## Prerequisites

- The board needs at least two lists to form a group.
- A group's limit applies to the **combined** card count across every list
  in the group, in addition to (not instead of) each list's own WIP limit.
