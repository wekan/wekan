# Sprint Report and Velocity

Board View / Sprint Report displays a selected closed sprint. Board View /
Velocity lists closed sprints chronologically. Both use persisted start and
close snapshots, so later estimate changes do not rewrite finished results.

The reports distinguish original commitments, completed work, added and removed
scope, and incomplete work. Each total includes card count, known estimate sum
and number of cards with unknown estimates. Unknown estimates are not zeroes.
Compare results only when units and completion policies match.
Native transfers require each sprint's start and close snapshots to agree on
estimate unit, estimate source, custom-field identifier and completion policy.
Mixed snapshot policies are rejected before import creates a board, matching
the rule that active sprints cannot change these settings. Workweek calendars
may differ; planned duration continues to use the start calendar. Supporting
external historical sprints with mixed policies requires separate report
contexts and remains pending, rather than treating unlike totals as comparable.

An unfinished sprint does not produce a completed-sprint velocity result.
Assigned-only members receive snapshots filtered to cards they can currently
see. Those partial reports must not be treated as whole-team totals.

The Export action uses the existing chart export popup and produces Excel or
PDF with the same report data and requesting user's access restrictions.
Exports retain the snapshot estimate source, custom-field identifier and
completion policy as stable identifiers. They also include the count, original
estimate total and unknown-estimate count for completed original commitments.
That subtotal excludes work added after sprint start and uses start estimates,
whereas the general completed total uses close-snapshot estimates. These columns
make changing estimates and unlike completion policies visible outside WeKan.
Excel uses columns. PDF prints wrapped labelled values for each sprint so the
wide set of metrics does not get clipped into narrow columns.
Selecting a sprint also displays its daily scope and remaining-work observations.
Each UTC day has at most one measured state, shown with its actual capture
timestamp. The bars offer card counts or known estimates with unknown counts;
they omit unobserved days and do not interpolate changes. Active sprints can
have daily observations before a closed-sprint result exists. Empty history,
partial visibility and truncation to the latest 366 observations are labelled.
Refreshing reloads the selected report. The daily section's own Export action
downloads those observations as Excel or PDF; the toolbar Export action still
exports sprint results. Both daily formats use the same permission-scoped,
bounded reader as the view. They retain sprint names, exact UTC capture times,
units, estimate sources, custom-field identifiers, completion policies and
separate count/known-estimate/unknown totals. Excel includes a Notes sheet and
PDF includes wrapped notices explaining observations, partial results and any
366-observation truncation, including when the result is empty. PDF prints
wrapped labels rather than clipping sixteen columns into a page-width table.
Unobserved days are never fabricated. Event-complete historical burndown remains
work listed in [the Scrum design](Scrum-Design.md).

Reports and Excel/PDF exports also show the planned working-day count. The
calendar is retained in the sprint's start snapshot, so subsequent board
calendar changes do not alter the result. Planned start and end dates are
inclusive UTC dates. A weekend-only range can have zero working days. Legacy
snapshots without a recorded calendar, or sprints without both planned dates,
show an unknown value (a dash on screen and an empty export cell). Native
transfer and full-board duplication preserve the snapshot calendar. This is
planned calendar duration, not a measurement of hours worked or daily progress.

## Charts

Responsive horizontal bars appear above the report table. A metric
selector switches between card counts and known estimates. Velocity compares
committed and completed work; Sprint Report also shows added, removed and
incomplete work. Exact values and unknown-estimate counts remain visible beside
the bars.
Scales are separated by snapshot unit, estimate source, custom field and
completion policy. Partial results use a separate scale from complete results.
Partial-snapshot warnings remain visible. Empty or unfinished
sprints produce no bars. Charts use native HTML/CSS, requiring no additional
dependency, and retain
the existing permission-filtered report data and export actions.
