# Archived-card contributions

Open **Board View → Pulse** to see the **Archived · Cards** grid above the
activity chart. Choose a year and press **Apply** to load or refresh it. Months
run across the grid and day numbers run down it. Each real calendar date has a
cell, including February 29 in leap years. The count is printed as well as shaded:
zero is gray; 1, 2–3, 4–7 and 8 or more cards use progressively darker greens.

Hover or focus a date to see its count and colored label names. Escape dismisses
the tooltip. Tapping a cell also shows its details below the grid. Label names
are plain text, including names that contain markup. Month names follow the
selected language; archive-date boundaries use UTC for every viewer.

Counts include currently archived cards on this board, grouped by `archivedAt`.
Restoring a card removes it from the report; archiving it again moves its count
to its new archive date. This is a view of the current archive, not an immutable
history of every archive action. Legacy archived cards without a valid archive
date are excluded. Deleted cards are absent. The adjacent Pulse activity report
and its PDF/Excel exports are separate from this archive grid.

Private boards require board visibility. Every assigned-only role sees only
archived cards assigned to that member; labels on hidden cards are not included.
The server projects and iterates archive records, accumulating one calendar year
without retaining full card documents. It rechecks board access and the assigned
scope before returning. Apply refreshes the result; the grid is not a live
subscription.

Coverage: `tests/archiveContributions.test.cjs` checks calendar boundaries,
archive lifecycle, invalid input, deduplicated labels and color levels.
`tests/playwright/specs/archive-contributions.e2e.js` runs the real method and UI,
covering the grid, colored escaped tooltips, keyboard interaction, empty years,
all three assigned-only roles, denied board reads and restored/undated cards.
