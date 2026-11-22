# Archived-card contributions

## What it is

A year of this board's archived cards, one cell per day, in the style of a
contribution calendar: how many cards were archived on each date, and with
which labels. It is the **Archived · Cards** grid of **Board View → Pulse**,
above the activity chart.

## Read more

- [Wikipedia: Heat map](https://en.wikipedia.org/wiki/Heat_map)
- [Wikipedia: Coordinated Universal Time](https://en.wikipedia.org/wiki/Coordinated_Universal_Time),
  the time zone the dates are grouped in
- [Archive and Delete](Archive-and-Delete.md)
- [Board views](../../Board-Header/README.md)

## How to use it

1. Open **Board View → Pulse** to see the **Archived · Cards** grid above the
   activity chart.
2. Choose a year and press **Apply** to load or refresh it. Months run across
   the grid and day numbers run down it.
3. Hover or focus a date to see its count and colored label names. Escape
   dismisses the tooltip. Tapping a cell also shows its details below the grid.

Open **Board View → Pulse** to see the **Archived · Cards** grid above the
activity chart. Choose a year and press **Apply** to load or refresh it. Months
run across the grid and day numbers run down it. Each real calendar date has a
cell, including February 29 in leap years. The count is printed as well as shaded:
zero is gray; 1, 2–3, 4–7 and 8 or more cards use progressively darker greens.

Hover or focus a date to see its count and colored label names. Escape dismisses
the tooltip. Tapping a cell also shows its details below the grid. Label names
are plain text, including names that contain markup. Month names follow the
selected language; archive-date boundaries use UTC for every viewer.

## How the numbers are calculated

From [models/lib/archiveContributions.js](../../../../models/lib/archiveContributions.js):

- **A day's count** is the number of the board's cards that are archived now
  and whose `archivedAt` falls on that date in UTC. Each real calendar date
  has a cell, including February 29 in leap years.
- **The shade** (level) is 0 for no cards and otherwise
  `min(4, 1 + floor(log2(count)))`: 1 card is level 1, 2-3 cards level 2, 4-7
  level 3 and 8 or more level 4.
- **The labels** of a day are the board's labels on those cards, each named
  once; a label colour that is not a colour name or a `#rrggbb` hex is drawn
  gray.
- **The year** must be a whole number from 1900 to 9998; without one, the
  current UTC year is used.

Counts include currently archived cards on this board, grouped by `archivedAt`.
Restoring a card removes it from the report; archiving it again moves its count
to its new archive date. This is a view of the current archive, not an immutable
history of every archive action. Legacy archived cards without a valid archive
date are excluded. Deleted cards are absent. The adjacent Pulse activity report
and its PDF/Excel exports are separate from this archive grid.

## How it works in WeKan

Private boards require board visibility. Every assigned-only role sees only
archived cards assigned to that member; labels on hidden cards are not included.
The server projects and iterates archive records, accumulating one calendar year
without retaining full card documents. It rechecks board access and the assigned
scope before returning. Apply refreshes the result; the grid is not a live
subscription.

The method is `archivedCardContributions` in
[server/publications/boards.js](../../../../server/publications/boards.js),
which reads through
[server/lib/archiveContributions.js](../../../../server/lib/archiveContributions.js);
the grid is drawn by
[client/components/boards/charts/archiveContributions.js](../../../../client/components/boards/charts/archiveContributions.js).

Coverage: `tests/archiveContributions.test.cjs` checks calendar boundaries,
archive lifecycle, invalid input, deduplicated labels and color levels.
`tests/playwright/specs/archive-contributions.e2e.js` runs the real method and UI,
covering the grid, colored escaped tooltips, keyboard interaction, empty years,
all three assigned-only roles, denied board reads and restored/undated cards.

## Commits

 - [Show archived-card contributions in Pulse](https://github.com/wekan/wekan/commit/1c200407a23449395f381497bbebaca7443d9aa3)
