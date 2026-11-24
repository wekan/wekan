# Roadmap

## What it is

A Gantt-style roadmap that groups cards into rows by a **custom field**
(rather than by list/swimlane) and draws each row's cards on a timeline -
useful for a release/epic/theme roadmap when you already track that grouping
as a custom field on your cards (#627: a roadmap "organizing cards by version
or release milestone in a timeline layout"). Each row is its own small Frappe
Gantt chart.

## Read more

- [Technology roadmap](https://en.wikipedia.org/wiki/Technology_roadmap) and
  [Product management](https://en.wikipedia.org/wiki/Product_management) at
  Wikipedia - what a release roadmap is for.
- [Gantt chart](https://en.wikipedia.org/wiki/Gantt_chart) at Wikipedia, and
  [Frappe Gantt](https://github.com/frappe/gantt), the library each row is
  drawn with.
- WeKan: [Gantt](Gantt.md) (the Frappe Gantt view the rows reuse),
  [Custom Fields](../../Cards/CustomFields/README.md).

## How to use it

**Where to find it.** **Board View menu (top bar) → Roadmap**, in the menu's
**Calendar and time** group.

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
│                                                        │
│ No value (3)                                          │
│  ▬▬▬▬▬                                                │
└──────────────────────────────────────────────────────────┘
```

**Steps to use it:**

1. Open a board that has at least one **text** or **dropdown**
   [Custom Field](../../Cards/CustomFields/README.md) defined (e.g. a
   "Release" or "Epic" field) - other field types are not offered for
   grouping.
2. Click **Board View** (top bar) → **Roadmap**.
3. Use the **Group by:** dropdown at the top to pick which custom field to
   group rows by. The first field, alphabetically, is chosen at first.
4. Cards are grouped into one row per value of that field, each drawn as a
   small Gantt chart using the cards' dates. Cards with the field left empty
   are in the **No value** row, always last.
5. Click a bar to open its card. With write access to the board, drag a bar or
   its edge to change the card's dates, the same as in Frappe Gantt.
6. What information is needed: at least one text or dropdown custom field on
   the board, and cards with that field filled in and with Start (or
   Received) and Due dates set (so they have something to draw on the
   timeline).

**Prerequisites:**

- If the board has **no text or dropdown custom field**, Roadmap shows an
  empty-state message instead of the picker ("This board has no custom fields
  yet...") - add a custom field first (Board Settings → Custom Fields).
- A board with no cards shows "No cards.".
- A card without a Start or Received date is counted in its row but has no bar.
- A site admin can turn it off with "Overview views" in
  [Admin Panel → Settings → Features](../../Admin-Panel/Settings/Features.md).

## How the numbers are calculated

- **Rows** (`computeCardsByCustomFieldGroup` in
  [models/lib/chartCalculations.js](../../../../models/lib/chartCalculations.js)):
  each card counts under exactly one row, the value of the chosen field
  (a dropdown shows its option's name). Rows are sorted alphabetically by
  their value (`localeCompare`), with **No value** last.
- **The number after a row's name** is how many cards that row holds,
  dated or not.
- **Bars** are the same as in [Frappe Gantt](Gantt.md#how-the-numbers-are-calculated):
  start = Start, else Received; end = Due, else End; one day when there is no
  end or the end is not after the start; progress 100 % when the card has an
  End date; red when overdue (Due in the past and no End).
- **Time scale**: every row starts in the Week view and has no view-mode
  dropdown.

## How it works in WeKan

- **View**:
  [client/components/boards/roadmapView.jade](../../../../client/components/boards/roadmapView.jade),
  [.js](../../../../client/components/boards/roadmapView.js) and
  [.css](../../../../client/components/boards/roadmapView.css). It imports
  `loadGanttLib`, `cardsToTasks` and `popupDetailsHtml` from
  [client/components/gantt/frappeGantt.js](../../../../client/components/gantt/frappeGantt.js),
  so a row is drawn by the same code as the Frappe Gantt view, one chart per
  row.
- **Data**: the board's cards from the browser's card collection; a card's
  value is read with `card.customFieldsWD()`; the fields are the board's
  custom fields of type `text` or `dropdown`, sorted by name. This view only
  reads custom fields; they are created and edited in Board Settings.
- **Writes**: dragging calls the card's `setStart`/`setReceived` and
  `setDue`/`setEnd`, allowed only when `Utils.currentUserCan('write', board)`.
- **Titles**: row headings and popups use the shared title viewer, and bar
  labels its plain text ([Board-view titles](Title-Rendering.md)).
- **Menu and feature switch**: `board-view-roadmap` in
  [models/lib/boardViewSettings.js](../../../../models/lib/boardViewSettings.js),
  feature `views-overview` in
  [models/lib/instanceFeatures.js](../../../../models/lib/instanceFeatures.js).
- **Tests**:
  [tests/chartCalculations.test.cjs](../../../../tests/chartCalculations.test.cjs)
  (the grouping),
  [tests/boardViewTitleViewer.test.cjs](../../../../tests/boardViewTitleViewer.test.cjs),
  [tests/boardViewMenu.test.cjs](../../../../tests/boardViewMenu.test.cjs).

## Commits

 - [Optional features: a site admin can turn the overview views off](https://github.com/wekan/wekan/commit/18d57b2b8f789b11409afbd485cff139adeb3095)
 - [Security-aware title viewer for the Roadmap headings and bars](https://github.com/wekan/wekan/commit/457614a2acd21dae9bfff49dfc955695a2bc4ebb)
 - [The Roadmap board view: cards grouped by a custom field into timeline rows](https://github.com/wekan/wekan/commit/784a249331b98cc617bc7f00ca87ad2d28afd2c7)
