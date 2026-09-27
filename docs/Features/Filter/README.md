# Board filters

Open **Filter** in the board header. Title, list and advanced-filter text stays
visible when the panel is closed and reopened. Closing the panel does not clear
an active filter. Title and advanced text apply when the field changes; submit
the list filter to apply it.

Under **Labels**, choose **OR** to match any selected label (the default), or
**AND** to require every selected label. Clicking a selected label again excludes
it; exclusions still take precedence. **No label** remains an alternative for
unlabeled cards. Clearing filters or switching boards resets label combinations.
These controls filter already authorized content; they do not alter access or
change any card.

The board Calendar grid and Calendar list honor the same active card filters.
This does not claim that the separate Multi Board Calendar shares every board
filter or that arbitrary historical move-date filters exist.

## Subtasks by parent

Choose **Filter → Parent card** to show direct subtasks of the selected parent
cards. Selecting several parents matches children of any of them. Click a
selected parent again to remove it, or use **Clear filters** to restore the board.
Other active filters continue to apply using their existing combination rules.

From an opened card, choose **Card Actions → Filter: Subtasks** to select that
card as the parent and open the Filter sidebar. This shows direct children, not
the parent itself or all descendants. The sidebar lists current-board parents
with published children, plus selected current-board parents. Private parent
titles from other boards are not fetched or exposed.

This is a view filter: read-only members can use it, and it changes no card or
permission. Switching boards clears parent selections, like other board-local
filters. No new card fields or server publications are required.
