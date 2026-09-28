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

On the first startup after upgrading, the background repair pass reconstructs
legacy entry dates from recorded card creation and movement activities. This
also covers archived cards and boards. It reads cards in batches of 250 and
streams each history, so a long history is not truncated to an arbitrary number
of events. A recorded entry must lead consistently to the card's current board
and list; repeated moves use the latest entry, while same-list swimlane changes
do not reset it. Old cross-board events without a destination list cannot by
themselves establish the date. A later recorded list entry can establish one.

Missing, contradictory, invalid or ambiguously ordered history stays unknown
and visible. Creation/last-edit fields are never substituted for absent movement
evidence. The migration only fills missing/null entry dates, with a conditional
write checking the observed placement and edit timestamps. A concurrent move's
new timestamp wins. Interrupted writes are safe to retry; unresolved concurrent
changes keep the startup migration pending for the next restart. The repair
status records scanned, restored, unknown, raced and pending counts. The normal
`WEKAN_SKIP_STARTUP_REPAIR=true` setting also disables this backfill.

Direct/raw database maintenance bypasses application hooks and must preserve
or update the derived field deliberately. Keep all application writers upgraded
when performing this repair. These controls implement the list-age request in
[#1499](https://github.com/wekan/wekan/issues/1499); unrecorded historical moves
cannot be reconstructed, so their ages deliberately remain unknown.

## Filter the card's own dates

Advanced Filter accepts these built-in date names:

| Name | Card date |
| --- | --- |
| `@createdAt` | Created |
| `@receivedAt` | Received |
| `@startAt` | Start |
| `@dueAt` | Due |
| `@endAt` | End |
| `@listEnteredAt` | Entry into the current board/list |

For example, hide cards completed before September 2026 while keeping cards
without an end date:

```text
@endAt >= '2026-09-01' or @endAt = none
```

Use `=`, `!=`, `<`, `<=`, `>` or `>=` and the same date formats supported by
custom-field dates. An equality matches the entire specified day (or minute or
second when supplied); `>` means after that interval, and `>=` includes it.
Dates use the browser's local timezone, and regional day/month order follows
the user's date-display preference. ISO `YYYY-MM-DD` avoids that ambiguity.
Rules use the same parser with server-local timezone and default month-first
regional parsing, as existing custom-field date rules do.

An ordinary date comparison, including `!=`, requires an actual non-null date.
Use `= none` for missing/null dates and `!= none` for present dates. Negating a
whole condition with `not` also includes cards without a date. Combine date
conditions with custom fields, parentheses, `and`, `or` and `not` as usual.

Built-in names are case-insensitive. Quote a custom field's name if it starts
with `@`: `'@endAt' = keep` addresses that custom field, while
`@endAt = '2026-09-01'` addresses the card's end date. Invalid dates, unsupported
names and regex comparisons are rejected; the sidebar retains its last valid
filter and a rule does not match. Filtering does not archive or delete cards.

## Pick a date range without an expression

Under **Filter by date**, choose a **Date field**, enter **From** and/or
**Through**, and press **Apply**. The picker supports creation, last modification,
received, start, due, end and current-list entry dates. Both selected days are
included in the browser's local timezone. Leave either bound blank for an
open-ended range; leave both blank to disable it. Enable **Include cards without
this date** to keep missing/null values visible alongside the dated matches.

The range combines with other active filters and stays selected across board
navigation because these date fields have the same meaning on every board.
Closing/reopening the sidebar preserves its controls. Its **Clear filter**
button clears just the range; the panel's final clear button clears everything.
A reversed or invalid range leaves the last applied range unchanged and shows
an input-validation message. No card is archived, edited or deleted.

This addresses the no-expression date-selection portion of
[#935](https://github.com/wekan/wekan/issues/935). Searching for any movement
within a historical date range is different from filtering the latest list
entry: a card may have moved again since then. That activity-based filter,
combined title/description/checklist/comment text filtering, and the remaining
relative-date presets from the issue's RFC are still tracked in TODO Later.
