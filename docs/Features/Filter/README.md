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

Numeric comparisons preserve fractions, signs and exponent notation, for example
`Points >= 2.5`, `Cost < -0.5` or `Points = 25e-1`. Use a decimal point in the
expression. The whole token must be a finite decimal number for a range
comparison; `Points > 2hours` is invalid. Equality can still match literal text
such as `Text = '2hours'`, without also matching the number 2. Dropdown labels
continue resolving to their stored option IDs.

## Hide old cards in a list

In **Filter → Hide old cards in a list**, select a list (for example Done),
enter a whole number of days, and choose **Apply**. Cards that entered that list
more than N × 24 hours ago are hidden. The cutoff refreshes once per minute.
Other lists and cards with unknown entry dates remain visible. This combines
with the other card filters; it does not archive or delete anything. Choose
**Do not hide by list age** and Apply, or clear the filters, to show them again.
The selected list resets when navigating to another board.

New cards record `listEnteredAt`. Moving to another list or board resets it in
the same card update. Reordering within a list, switching swimlanes, editing
text, adding comments and archiving do not change this date. A conditional
update that does not match the card cannot reset it. Undoing a move counts as
entering the previous list again.

Existing cards without this field remain visible until they next change lists.
Reconstructing their dates from historical move activities is still pending;
creation and last-edit dates are not substitutes for missing move history.
Direct/raw database maintenance bypasses application hooks and must preserve
or update this derived field deliberately. This implements the current-data
portion of [#1499](https://github.com/wekan/wekan/issues/1499); the historical
backfill remains in TODO Later.
