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

## Advanced custom-field comparisons

An advanced comparison matches the named custom field's own value. For example,
`Points = 2` does not match a card with Points set to 1 merely because another
field contains 2. The same rule applies to ranges, dates, dropdown values,
regular expressions and `!=`: another field cannot supply or veto the value.
A card without the named field does not satisfy that comparison. Combine
comparisons with `and` or `or` to constrain several fields.

Use single quotes around names containing spaces, for example
`'Jira points' = 2`. A rule referring to an unknown field does not match. The
sidebar retains its last valid selector when a new expression cannot be built.
Rules and the sidebar share the same comparison builder; rules query the saved
card while the sidebar filters the cards already published to the browser.

Parentheses can group comparisons, including nested groups, and need no spaces
between the parentheses and their contents. `not` (or `!`) negates the next
comparison or group: `not(Points = 1 or Points = 2)`. Unlike `Points != 2`,
`not Points = 2` also includes cards without a Points field because they do not
match the positive comparison. `and` and `or` retain left-to-right evaluation;
use parentheses to select a different grouping. Incomplete expressions,
unclosed quotes and unmatched parentheses are rejected. Invalid rule expressions
never execute an action; the sidebar keeps its last valid filter.
