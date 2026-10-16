# Product Backlog

The planning table displays each card's releases and provides a release selector
beside its sprint and rank controls. A card can be in several releases
(2026-10-08): the selector is a multiple select, so hold Ctrl (Cmd on a Mac) to
choose more than one, and clear every choice to take the card out of all
releases. Only the current board's releases are offered and accepted. The same
editor is used for sprint work. Saving uses existing card write permissions,
board-local reference validation, revision checks and Scrum History undo/redo.
Release assignments do not create planning records or change the release's
lifecycle state. See
[Scrum-Design.md](Scrum-Design.md#several-releases-per-card) for how cards
saved with one release are read.

Board View / Product Backlog shows non-archived cards without a current sprint.
It reuses existing card estimates. Missing estimates are displayed as unknown.

A card's backlog rank provides an order independent of its list position.
Smaller ranks appear first. Authorized editors can change the rank, assign a
planned or active sprint, record a work-item type, and edit acceptance criteria.
The card title opens the existing card details view.

When cards have the same effective rank, their stable card IDs break the tie.
This keeps the order consistent across clients and refreshes, including cards
from different lists with matching list positions. Sprint card tables use the
same ordering. Titles and other metadata edits do not change this tie-breaker.

An unset backlog rank is blank in the editor and shown as a dash in the table.
It uses the card's normal sort position for ordering without copying that
position into Scrum metadata. Clear the rank field to return to this fallback;
zero remains a valid explicit rank. Negative board sort positions do not block
saving sprint, release or other metadata. Explicit negative Scrum ranks remain
invalid. Clearing a rank is recorded by the existing Scrum History method.

Sprint assignments preserve past membership when a card leaves a sprint.
Assignment to a different board's sprint is rejected. Revision checks reject
stale edits rather than silently overwriting another person's metadata.

See [Sprints](Sprints.md) for lifecycle and optional field visibility, and
[the Scrum design](Scrum-Design.md) for remaining implementation work.
